import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1') {
    return 'https://dung-study.onrender.com';
  }
  return 'http://localhost:5000';
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

/**
 * Hook giáo viên dùng để quản lý phòng giám sát.
 * Trả về danh sách học sinh và streams (Map<socketId, MediaStream>)
 */
export function useMonitor({ examId, teacherName, enabled = true }) {
  const socketRef = useRef(null);
  const peersRef = useRef({}); // { socketId: RTCPeerConnection }
  const [students, setStudents] = useState([]); // { socketId, name, userId }
  const [streams, setStreams] = useState({}); // { socketId: MediaStream }

  const addStream = useCallback((socketId, stream) => {
    setStreams(prev => ({ ...prev, [socketId]: stream }));
  }, []);

  const removeStudent = useCallback((socketId) => {
    setStudents(prev => prev.filter(s => s.socketId !== socketId));
    setStreams(prev => { const n = { ...prev }; delete n[socketId]; return n; });
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].close();
      delete peersRef.current[socketId];
    }
  }, []);

  const handleOffer = useCallback(async (socket, { studentSocketId, studentName: sName, offer }) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[studentSocketId] = pc;

    pc.ontrack = (event) => {
      if (event.streams?.[0]) addStream(studentSocketId, event.streams[0]);
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit('ice-candidate', { targetSocketId: studentSocketId, candidate });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        removeStudent(studentSocketId);
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('teacher:answer', { studentSocketId, answer });
  }, [addStream, removeStudent]);

  const requestStream = useCallback((studentSocketId) => {
    if (socketRef.current) {
      socketRef.current.emit('teacher:request-stream', { studentSocketId });
    }
  }, []);

  useEffect(() => {
    if (!enabled || !examId || !teacherName) return;

    const token = localStorage.getItem('accessToken');
    const socket = io(getSocketUrl(), { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('teacher:join-monitor', { examId, teacherName });
    });

    socket.on('monitor:student-list', (list) => {
      setStudents(list);
      // Yêu cầu stream từ các học sinh đang online
      list.forEach(s => socket.emit('teacher:request-stream', { studentSocketId: s.socketId }));
    });

    socket.on('monitor:student-joined', (student) => {
      setStudents(prev => {
        if (prev.find(s => s.socketId === student.socketId)) return prev;
        return [...prev, student];
      });
      // Tự động yêu cầu stream
      socket.emit('teacher:request-stream', { studentSocketId: student.socketId });
    });

    socket.on('monitor:student-left', ({ socketId }) => removeStudent(socketId));

    socket.on('monitor:offer', (data) => handleOffer(socket, data));

    socket.on('ice-candidate', async ({ from: socketId, candidate }) => {
      const pc = peersRef.current[socketId];
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      }
    });

    return () => {
      socket.disconnect();
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
    };
  }, [enabled, examId, teacherName, handleOffer, removeStudent]);

  return { students, streams, requestStream };
}
