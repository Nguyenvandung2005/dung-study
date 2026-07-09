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

const renderStudySymbols = (canvas, config) => {
  const ctx = canvas.getContext('2d');
  const { speed = 0.45, colors = ['#ff4d6d', '#3a86ff', '#06d6a0', '#ffb703', '#8338ec'] } = config;
  const symbols = ['+', '−', '×', '÷', 'π', 'x', 'y', 'z', '∑', '√', '?', '!', '📐', '✏️', '🧪', '💡', '1', '2', 'A', 'B'];
  let particles = [];
  let animId;
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 35; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed - 0.2, // Drift up
      text: symbols[Math.floor(Math.random() * symbols.length)],
      size: Math.random() * 20 + 16, // Larger symbols
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.4 + 0.25, // Clearer, brighter opacity
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.008,
    });
  }

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rotation += p.rotSpeed;
      if (p.x < -40) p.x = canvas.width + 40;
      if (p.x > canvas.width + 40) p.x = -40;
      if (p.y < -40) p.y = canvas.height + 40;
      if (p.y > canvas.height + 40) p.y = -40;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.font = `bold ${p.size}px sans-serif`;
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    });
    animId = requestAnimationFrame(draw);
  };
  draw();
  return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
};

const renderCosmos = (canvas, config) => {
  const ctx = canvas.getContext('2d');
  const { starCount = 100 } = config; // Denser star field
  let stars = [];
  let animId;
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.2 + 0.8, // Slightly larger stars
      twinkleSpeed: Math.random() * 0.02 + 0.006,
      phase: Math.random() * Math.PI
    });
  }

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.phase += s.twinkleSpeed;
      const alpha = Math.abs(Math.sin(s.phase)) * 0.75 + 0.25; // Brighter twinkle
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    });
    animId = requestAnimationFrame(draw);
  };
  draw();
  return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
};

const renderBubbles = (canvas, config) => {
  const ctx = canvas.getContext('2d');
  const { bubbleCount = 40, colors = ['#ff758f', '#52b788', '#4cc9f0', '#f72585', '#7209b7'] } = config;
  let bubbles = [];
  let animId;
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < bubbleCount; i++) {
    bubbles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height + canvas.height,
      vy: -(Math.random() * 0.4 + 0.2),
      vx: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 18 + 6, // Larger bubbles
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.35 + 0.15, // Clearer bubbles
      wobbleSpeed: Math.random() * 0.02,
      wobbleRange: Math.random() * 10,
      phase: Math.random() * Math.PI * 2
    });
  }

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bubbles.forEach(b => {
      b.y += b.vy;
      b.phase += b.wobbleSpeed;
      const currentX = b.x + Math.sin(b.phase) * b.wobbleRange;
      if (b.y < -b.r) {
        b.y = canvas.height + b.r;
        b.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.arc(currentX, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = b.alpha;
      ctx.lineWidth = 1.8; // Thicker border
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(currentX - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'; // Brighter reflection
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    animId = requestAnimationFrame(draw);
  };
  draw();
  return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
};

// ─── Component ────────────────────────────────────────────────────────────

import { useAuth } from '../../context/AuthContext';

export default function AnimatedBackground({ overrideType }) {
  const canvasRef = useRef(null);
  const { activeTheme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const type = overrideType || user?.settings?.animation || activeTheme?.config?.type || 'particles';
    const config = activeTheme?.config || { type };

    let cleanup = () => {};
    if (type === 'none') {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return cleanup;
    }

    switch (type) {
      case 'particles': cleanup = renderParticles(canvas, config); break;
      case 'wave': cleanup = renderWave(canvas, config); break;
      case 'matrix': cleanup = renderMatrix(canvas, config); break;
      case 'geometric': cleanup = renderGeometric(canvas, config); break;
      case 'pulse': cleanup = renderPulse(canvas, config); break;
      case 'study-symbols': cleanup = renderStudySymbols(canvas, config); break;
      case 'cosmos': cleanup = renderCosmos(canvas, config); break;
      case 'bubbles': cleanup = renderBubbles(canvas, config); break;
      default: cleanup = renderParticles(canvas, { type: 'particles' });
    }
    return cleanup;
  }, [activeTheme, overrideType, user?.settings?.animation]);

  return <canvas ref={canvasRef} id="bg-canvas" aria-hidden="true" />;
}

