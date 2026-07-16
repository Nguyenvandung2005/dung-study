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

export function useScreenShare({ examId, studentName, enabled = true }) {
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const peerRef = useRef(null);
  const [shareStatus, setShareStatus] = useState('idle'); // idle | sharing | error | denied

  const cleanup = useCallback(() => {
    if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
  }, []);

  const createOffer = useCallback(async (teacherSocketId) => {
    if (!streamRef.current || !socketRef.current) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerRef.current = pc;

    streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', { targetSocketId: teacherSocketId, candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setShareStatus('error');
      }
    };

    const offer = await pc.createOffer({ offerToReceiveVideo: false });
    await pc.setLocalDescription(offer);
    socketRef.current.emit('student:offer', { examId, offer });
  }, [examId]);

  useEffect(() => {
    if (!enabled || !examId || !studentName) return;

    let mounted = true;

    const init = async () => {
      // Yêu cầu chia sẻ màn hình
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 5, max: 10 }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        setShareStatus('sharing');

        // Khi học sinh dừng chia sẻ bằng tay (bấm nút Stop trên trình duyệt)
        stream.getVideoTracks()[0].onended = () => {
          setShareStatus('denied');
        };
      } catch (err) {
        console.error('[ScreenShare] Failed to get display media:', err);
        setShareStatus('denied');
        return;
      }

      // Kết nối Socket.IO
      const token = localStorage.getItem('accessToken');
      const socket = io(getSocketUrl(), { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('student:join-exam', { examId, studentName });
      });

      // Giáo viên yêu cầu stream
      socket.on('monitor:request-stream', async () => {
        // Đây là fallback — giáo viên kéo xem muộn
        await createOffer(null); // offer sẽ có teacherSocketId từ server
      });

      // Nhận answer từ giáo viên
      socket.on('monitor:answer', async ({ answer }) => {
        if (peerRef.current && peerRef.current.signalingState !== 'stable') {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      // ICE candidate từ giáo viên
      socket.on('ice-candidate', async ({ candidate }) => {
        if (peerRef.current && candidate) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
        }
      });

      socket.on('disconnect', () => setShareStatus('idle'));
      socket.on('connect_error', (err) => { console.error('[Socket]', err.message); setShareStatus('error'); });
    };

    init();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [enabled, examId, studentName, createOffer, cleanup]);

  return { shareStatus, stopSharing: cleanup };
}
