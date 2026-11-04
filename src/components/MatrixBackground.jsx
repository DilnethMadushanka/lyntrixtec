import React, { useEffect, useRef, useState } from 'react';

/**
 * MatrixBackground
 * High-performance, GPU-accelerated HTML5 Canvas Matrix Cyber Rain
 * with horizontal wave oscillation ("eha meha yana"), interactive cursor deflection,
 * and Lyntrix cyber-cyan & neon indigo aesthetics.
 */
export default function MatrixBackground({ 
  opacity = 0.28,
  speed = 1.0,
  fontSize = 15
}) {
  const canvasRef = useRef(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [motionIntensity, setMotionIntensity] = useState(1); // 1 = normal, 1.8 = high sway, 0.4 = gentle

  useEffect(() => {
    if (!isEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking for reactive matrix deflection
    let mouse = {
      x: -1000,
      y: -1000,
      radius: 140
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    // Character set: Katakana, cyber runes, hex code, binary, brackets
    const characters = '012345678901ABCDEF0123456789{}+-/*=<>~#!$%&?@ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ'.split('');

    const colWidth = Math.max(16, fontSize);
    let columns = Math.ceil(width / colWidth);
    let drops = [];

    const initColumns = () => {
      columns = Math.ceil(width / colWidth);
      drops = [];
      for (let i = 0; i < columns; i++) {
        drops.push({
          baseX: i * colWidth,
          x: i * colWidth,
          y: Math.random() * -height, // staggered start
          speed: (0.7 + Math.random() * 1.3) * speed,
          length: Math.floor(12 + Math.random() * 18),
          swayPhase: Math.random() * Math.PI * 2,
          swaySpeed: 0.015 + Math.random() * 0.02,
          swayAmp: (15 + Math.random() * 25) * motionIntensity,
          deflectX: 0
        });
      }
    };

    initColumns();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initColumns();
    };

    window.addEventListener('resize', handleResize);

    let time = 0;

    const render = () => {
      time += 0.03;

      // Dark fade trail to preserve smooth neon phosphor persistence
      ctx.fillStyle = 'rgba(7, 9, 14, 0.22)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "Fira Code", monospace, "Courier New"`;

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];

        // Horizontal sinusoidal wave oscillation ("eha meha yana" sway motion)
        const waveX = Math.sin(time * drop.swaySpeed * 60 + drop.swayPhase + drop.y * 0.008) * drop.swayAmp;

        // Interactive mouse repulsion/deflection
        const dx = drop.x - mouse.x;
        const dy = drop.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (1 - dist / mouse.radius) * 35;
          const angle = Math.atan2(dy, dx);
          drop.deflectX += Math.cos(angle) * force * 0.2;
        }

        // Dampen deflection back toward equilibrium
        drop.deflectX *= 0.92;

        // Final calculated X position with sway + deflection
        const currentX = drop.baseX + waveX + drop.deflectX;
        drop.x = currentX;

        // Pick dynamic character
        const char = characters[Math.floor(Math.random() * characters.length)];

        // Draw the leading head character (White-Cyan super-glow)
        if (drop.y > 0 && drop.y < height) {
          ctx.save();
          ctx.shadowColor = '#19c3ff';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(char, currentX, drop.y);
          ctx.restore();
        }

        // Draw trail glyphs
        for (let j = 1; j < drop.length; j++) {
          const trailY = drop.y - j * fontSize;
          if (trailY > 0 && trailY < height) {
            const alpha = Math.max(0, 1 - j / drop.length);
            
            // Calculate trailing sway
            const trailWaveX = Math.sin(time * drop.swaySpeed * 60 + drop.swayPhase + trailY * 0.008) * drop.swayAmp;
            const trailX = drop.baseX + trailWaveX + drop.deflectX * (1 - j * 0.03);

            // Shifting matrix colors: Cyan to Indigo to Deep Blue
            if (j < 3) {
              ctx.fillStyle = `rgba(25, 195, 255, ${alpha * 0.9})`; // Bright Cyan
            } else if (j < 8) {
              ctx.fillStyle = `rgba(99, 102, 241, ${alpha * 0.75})`; // Electric Indigo
            } else {
              ctx.fillStyle = `rgba(30, 58, 138, ${alpha * 0.45})`; // Deep Slate Blue
            }

            // Occasionally mutate a trailing character for organic cyber flickers
            const trailChar = (Math.random() > 0.92)
              ? characters[Math.floor(Math.random() * characters.length)]
              : characters[(i + j) % characters.length];

            ctx.fillText(trailChar, trailX, trailY);
          }
        }

        // Progress drop downward
        drop.y += drop.speed * 4;

        // Reset drop when past screen
        if (drop.y - drop.length * fontSize > height) {
          drop.y = Math.random() * -120;
          drop.speed = (0.7 + Math.random() * 1.3) * speed;
          drop.swayAmp = (15 + Math.random() * 25) * motionIntensity;
          drop.deflectX = 0;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isEnabled, motionIntensity, speed, fontSize]);

  if (!isEnabled) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setIsEnabled(true)}
          className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-[10px] font-mono text-cyan-400 hover:text-white hover:border-cyan-400 shadow-lg backdrop-blur-md transition-all flex items-center gap-1.5"
          title="Enable Matrix Background"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          <span>Matrix FX: OFF</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Dynamic Animated Matrix Canvas */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-700"
        style={{ opacity }}
        aria-hidden="true"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* Ambient Radial Vignette to preserve optimal foreground text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-[#07090e]/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_35%,_#07090e_90%)] pointer-events-none" />
      </div>

      {/* Floating subtle control pill to adjust or toggle Matrix mode */}
      <div className="fixed bottom-4 left-4 z-40 group pointer-events-auto">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-950/85 border border-slate-800/90 shadow-xl backdrop-blur-md text-[10px] font-mono text-slate-300">
          <button
            onClick={() => setMotionIntensity(prev => (prev === 1 ? 1.8 : prev === 1.8 ? 0.4 : 1))}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-cyan-900/60 transition-colors"
            title="Sway Motion: Wave back and forth ('Eha Meha Yana')"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span>
              Wave: {motionIntensity === 1.8 ? 'MAX' : motionIntensity === 0.4 ? 'GENTLE' : 'DYNAMIC'}
            </span>
          </button>

          <button
            onClick={() => setIsEnabled(false)}
            className="px-2 py-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Turn Matrix FX Off"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
}
