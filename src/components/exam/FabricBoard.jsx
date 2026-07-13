import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

export default function FabricBoard({ initialSvg, onApply, onClose }) {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [tool, setTool] = useState('select'); // select, pen, line, rect, circle, eraser
  const [color, setColor] = useState('#1d4ed8');

  useEffect(() => {
    // Initialize Fabric Canvas
    const c = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth - 60,
      height: window.innerHeight - 140,
      backgroundColor: '#f8fafc',
      isDrawingMode: false,
    });
    setCanvas(c);

    // Load initial SVG
    if (initialSvg && initialSvg.includes('<svg')) {
      fabric.loadSVGFromString(initialSvg, (objects, options) => {
        if (!objects || objects.length === 0) return;
        const obj = fabric.util.groupSVGElements(objects, options);
        // Ungroup to allow editing individual elements
        if (obj.type === 'group') {
          const items = obj.getObjects();
          obj.destroy();
          items.forEach(item => {
            c.add(item);
          });
        } else {
          c.add(obj);
        }
        c.renderAll();
      });
    }

    const handleResize = () => {
      c.setWidth(window.innerWidth - 60);
      c.setHeight(window.innerHeight - 140);
      c.renderAll();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      c.dispose();
    };
  }, [initialSvg]);

  // Handle tool changes
  useEffect(() => {
    if (!canvas) return;
    
    // Reset defaults
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.forEachObject(o => o.set('selectable', true));
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    canvas.defaultCursor = 'default';

    if (tool === 'pen') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.width = 3;
    } else if (tool === 'eraser') {
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.forEachObject(o => o.set('selectable', false));
      
      canvas.on('mouse:down', (o) => {
        if (o.target) {
          canvas.remove(o.target);
        }
      });
    } else if (tool !== 'select') {
      canvas.selection = false;
      canvas.forEachObject(o => o.set('selectable', false));
      canvas.defaultCursor = 'crosshair';

      let isDrawing = false;
      let shape = null;
      let startX, startY;

      canvas.on('mouse:down', (o) => {
        isDrawing = true;
        const pointer = canvas.getPointer(o.e);
        startX = pointer.x;
        startY = pointer.y;

        if (tool === 'rect') {
          shape = new fabric.Rect({
            left: startX, top: startY, width: 0, height: 0,
            fill: 'transparent', stroke: color, strokeWidth: 2,
            selectable: false
          });
        } else if (tool === 'circle') {
          shape = new fabric.Circle({
            left: startX, top: startY, radius: 0,
            fill: 'transparent', stroke: color, strokeWidth: 2,
            selectable: false
          });
        } else if (tool === 'line') {
          shape = new fabric.Line([startX, startY, startX, startY], {
            stroke: color, strokeWidth: 2, selectable: false
          });
        }
        if (shape) canvas.add(shape);
      });

      canvas.on('mouse:move', (o) => {
        if (!isDrawing || !shape) return;
        const pointer = canvas.getPointer(o.e);
        
        if (tool === 'rect') {
          shape.set({
            width: Math.abs(pointer.x - startX),
            height: Math.abs(pointer.y - startY),
            left: Math.min(pointer.x, startX),
            top: Math.min(pointer.y, startY)
          });
        } else if (tool === 'circle') {
          const radius = Math.hypot(pointer.x - startX, pointer.y - startY) / 2;
          shape.set({
            radius: radius,
            left: Math.min(pointer.x, startX),
            top: Math.min(pointer.y, startY)
          });
        } else if (tool === 'line') {
          shape.set({ x2: pointer.x, y2: pointer.y });
        }
        canvas.renderAll();
      });

      canvas.on('mouse:up', () => {
        isDrawing = false;
        if (shape) shape.setCoords();
      });
    }
  }, [canvas, tool, color]);

  // Handle color change for drawing mode
  useEffect(() => {
    if (canvas && tool === 'pen') {
      canvas.freeDrawingBrush.color = color;
    }
  }, [color, canvas, tool]);

  const handleExport = () => {
    if (canvas) {
      // Bỏ nền xám, xuất SVG trong suốt (hoặc nền trắng)
      canvas.setBackgroundColor(null, canvas.renderAll.bind(canvas));
      const svg = canvas.toSVG({
        width: canvas.width,
        height: canvas.height,
      });
      onApply(svg);
    }
  };

  const deleteSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      activeObjects.forEach(obj => canvas.remove(obj));
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(10,14,26,0.95)', backdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column', padding: '20px 30px'
    }}>
      {/* Header */}
      <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16, marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.6rem' }}>🎨</span> Smart Canvas (Fabric.js)
          </h3>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>Dùng công cụ Chuột 🖱️ để chọn, di chuyển, thu phóng, xóa các nét vẽ của AI.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={onClose}>Hủy & Đóng</button>
          <button className="btn btn-outline" onClick={() => canvas?.clear()}>🗑 Xóa tất cả</button>
          <button className="btn btn-primary" onClick={handleExport} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            💾 Hoàn tất & Lưu SVG
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar Tools */}
        <div style={{ width: 70, borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 12 }}>
          <button style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: tool === 'select' ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)', color: tool === 'select' ? '#a78bfa' : '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setTool('select')} title="Chọn đối tượng">🖱️</button>
          <button style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: tool === 'pen' ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)', color: tool === 'pen' ? '#a78bfa' : '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setTool('pen')} title="Vẽ tự do">✏️</button>
          <button style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: tool === 'line' ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)', color: tool === 'line' ? '#a78bfa' : '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setTool('line')} title="Đường thẳng">📏</button>
          <button style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: tool === 'rect' ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)', color: tool === 'rect' ? '#a78bfa' : '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setTool('rect')} title="Hình chữ nhật">🟦</button>
          <button style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: tool === 'circle' ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)', color: tool === 'circle' ? '#a78bfa' : '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setTool('circle')} title="Hình tròn">⭕</button>
          <button style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: tool === 'eraser' ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)', color: tool === 'eraser' ? '#a78bfa' : '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setTool('eraser')} title="Cục tẩy (Xóa đối tượng)">🧽</button>
          
          <button style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', marginTop: 10, fontWeight: 'bold' }} onClick={deleteSelected} title="Xóa phần tử đang chọn (Delete)">XÓA</button>

          <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
          
          {/* Colors */}
          {['#1d4ed8', '#ef4444', '#10b981', '#f59e0b', '#000000'].map(c => (
            <button key={c} 
              style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}
              onClick={() => setColor(c)} 
            />
          ))}
        </div>

        {/* Canvas Area */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', background: '#0f172a', borderRadius: 8 }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
