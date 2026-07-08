import { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

// ─── Animation Renderers ───────────────────────────────────────────────────

const renderParticles = (canvas, config) => {
  const ctx = canvas.getContext('2d');
  const { particleCount = 120, speed = 0.15, colors = ['#6366f1', '#8b5cf6', '#06b6d4'], connectParticles = true } = config;
  
  let particles = [];
  let animId;
  
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      r: Math.random() * 2 + 1,
      color: randomColor(),
      alpha: Math.random() * 0.6 + 0.2,
    });
  }

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (connectParticles) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99,102,241,${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
    });

    animId = requestAnimationFrame(draw);
  };
  draw();
  return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
};

const renderWave = (canvas, config) => {
  const ctx = canvas.getContext('2d');
  const { amplitude = 60, colors = ['#0ea5e9', '#6366f1'], speed = 0.005 } = config;
  let t = 0; let animId;
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize(); window.addEventListener('resize', resize);

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    colors.forEach((color, idx) => {
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x += 5) {
        const y = canvas.height / 2 + amplitude * Math.sin((x / canvas.width) * Math.PI * 4 + t + idx * 1.5) + (idx * 60 - 60);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fillStyle = color + '15';
      ctx.fill();
    });
    t += speed;
    animId = requestAnimationFrame(draw);
  };
  draw();
  return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
};

const renderMatrix = (canvas, config) => {
  const ctx = canvas.getContext('2d');
  const { fontSize = 14, color = '#06b6d4', speed = 50 } = config;
  const chars = 'アイウエオカキクケコ0123456789ABCDEF';
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize(); window.addEventListener('resize', resize);
  const cols = Math.floor(canvas.width / fontSize);
  const drops = Array(cols).fill(1);
  let intervalId;

  const draw = () => {
    ctx.fillStyle = 'rgba(8,8,24,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color + '60';
    ctx.font = `${fontSize}px monospace`;
    drops.forEach((y, i) => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, y * fontSize);
      if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
  };
  intervalId = setInterval(draw, speed);
  return () => { clearInterval(intervalId); window.removeEventListener('resize', resize); };
};

const renderGeometric = (canvas, config) => {
  const ctx = canvas.getContext('2d');
  const { shapeCount = 15, colors = ['#6366f1', '#f59e0b', '#10b981'] } = config;
  let animId;
  const shapes = Array.from({ length: shapeCount }, (_, i) => ({
    x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
    size: Math.random() * 60 + 20, sides: Math.floor(Math.random() * 4) + 3,
    rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.005,
    vx: (Math.random() - 0.5) * 0.1, vy: (Math.random() - 0.5) * 0.1,
    color: colors[i % colors.length], alpha: Math.random() * 0.15 + 0.05,
  }));
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize(); window.addEventListener('resize', resize);

  const drawPoly = (x, y, sides, size, rot) => {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = rot + (i / sides) * Math.PI * 2;
      if (i === 0) ctx.moveTo(x + size * Math.cos(a), y + size * Math.sin(a));
      else ctx.lineTo(x + size * Math.cos(a), y + size * Math.sin(a));
    }
    ctx.closePath();
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach(s => {
      s.rotation += s.rotSpeed; s.x += s.vx; s.y += s.vy;
      if (s.x < -100 || s.x > canvas.width + 100) s.vx *= -1;
      if (s.y < -100 || s.y > canvas.height + 100) s.vy *= -1;
      drawPoly(s.x, s.y, s.sides, s.size, s.rotation);
      ctx.strokeStyle = s.color + Math.floor(s.alpha * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    animId = requestAnimationFrame(draw);
  };
  draw();
  return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
};

const renderPulse = (canvas, config) => {
  const ctx = canvas.getContext('2d');
  const { circleCount = 5, color = '#6366f1' } = config;
  let t = 0; let animId;
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize(); window.addEventListener('resize', resize);
  const cx = () => canvas.width / 2, cy = () => canvas.height / 2;

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < circleCount; i++) {
      const phase = (t + i * (1 / circleCount)) % 1;
      const r = phase * Math.min(canvas.width, canvas.height) * 0.45;
      const alpha = (1 - phase) * 0.12;
      ctx.beginPath();
      ctx.arc(cx(), cy(), r, 0, Math.PI * 2);
      ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    t += 0.0015;
    animId = requestAnimationFrame(draw);
  };
  draw();
  return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
};

// ─── Component ────────────────────────────────────────────────────────────

export default function AnimatedBackground({ overrideType }) {
  const canvasRef = useRef(null);
  const { activeTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Use overrideType for preview, otherwise use activeTheme
    const type = overrideType || activeTheme?.config?.type || 'particles';
    const config = activeTheme?.config || { type };

    let cleanup;
    switch (type) {
      case 'particles': cleanup = renderParticles(canvas, config); break;
      case 'wave': cleanup = renderWave(canvas, config); break;
      case 'matrix': cleanup = renderMatrix(canvas, config); break;
      case 'geometric': cleanup = renderGeometric(canvas, config); break;
      case 'pulse': cleanup = renderPulse(canvas, config); break;
      default: cleanup = renderParticles(canvas, { type: 'particles' });
    }
    return cleanup;
  }, [activeTheme]);

  return <canvas ref={canvasRef} id="bg-canvas" aria-hidden="true" />;
}
