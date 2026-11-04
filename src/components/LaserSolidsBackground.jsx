import React, { useEffect, useRef, useState } from 'react';

/**
 * LaserSolidsBackground
 * High-Performance 60FPS 3D Holographic Laser Solids Engine ("Ganavasthu / Solid Items")
 * 
 * - Evenly distributed across the FULL screen (no clumping in center)
 * - Ultra-smooth 60 FPS performance (batched 2-pass hardware glow, 0% lag)
 * - Progressive laser wireframe construction with sparks & solid holographic facets
 */

// 3D Geometric Solid Models
const createCube = (size = 48) => {
  const s = size;
  const vertices = [
    [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
    [-s, -s, s],  [s, -s, s],  [s, s, s],  [-s, s, s]
  ];
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ];
  const faces = [
    [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
    [2, 3, 7, 6], [1, 2, 6, 5], [0, 3, 7, 4]
  ];
  return { type: 'Cube', vertices, edges, faces, radius: s * 1.5 };
};

const createOctahedron = (size = 52) => {
  const s = size;
  const h = s * 1.35;
  const vertices = [
    [0, -h, 0], [0, h, 0],
    [s, 0, 0], [-s, 0, 0],
    [0, 0, s], [0, 0, -s]
  ];
  const edges = [
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 4], [4, 3], [3, 5], [5, 2]
  ];
  const faces = [
    [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
    [1, 2, 4], [1, 4, 3], [1, 3, 5], [1, 5, 2]
  ];
  return { type: 'Octahedron', vertices, edges, faces, radius: h };
};

const createIcosahedron = (size = 44) => {
  const phi = (1 + Math.sqrt(5)) / 2;
  const a = size;
  const b = size * phi;

  const rawVertices = [
    [-a, b, 0], [a, b, 0], [-a, -b, 0], [a, -b, 0],
    [0, -a, b], [0, a, b], [0, -a, -b], [0, a, -b],
    [b, 0, -a], [b, 0, a], [-b, 0, -a], [-b, 0, a]
  ];

  const edges = [];
  const edgeSet = new Set();
  const targetDistSq = (2 * a) * (2 * a) * 1.05;

  for (let i = 0; i < rawVertices.length; i++) {
    for (let j = i + 1; j < rawVertices.length; j++) {
      const dx = rawVertices[i][0] - rawVertices[j][0];
      const dy = rawVertices[i][1] - rawVertices[j][1];
      const dz = rawVertices[i][2] - rawVertices[j][2];
      const distSq = dx * dx + dy * dy + dz * dz;
      if (Math.abs(distSq - targetDistSq) < targetDistSq * 0.15) {
        const key = `${i}-${j}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push([i, j]);
        }
      }
    }
  }

  // Simplified representative faces for holographic depth
  const faces = [
    [0, 1, 5], [0, 5, 11], [0, 11, 10], [0, 10, 7], [0, 7, 1],
    [2, 3, 4], [2, 4, 9], [2, 9, 8], [2, 8, 6], [2, 6, 3]
  ];

  return { type: 'Icosahedron', vertices: rawVertices, edges, faces, radius: b };
};

const createPyramid = (size = 50) => {
  const s = size;
  const h = size * 1.25;
  const vertices = [
    [0, -h * 0.8, 0],
    [-s, h * 0.5, -s],
    [s, h * 0.5, -s],
    [s, h * 0.5, s],
    [-s, h * 0.5, s]
  ];
  const edges = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4], [4, 1]
  ];
  const faces = [
    [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
    [1, 2, 3, 4]
  ];
  return { type: 'Pyramid', vertices, edges, faces, radius: h };
};

const createHexagonalPrism = (size = 42) => {
  const r = size;
  const h = size * 0.9;
  const vertices = [];
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI) / 3;
    vertices.push([Math.cos(ang) * r, -h, Math.sin(ang) * r]);
  }
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI) / 3;
    vertices.push([Math.cos(ang) * r, h, Math.sin(ang) * r]);
  }
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
    [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 6],
    [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]
  ];
  const faces = [
    [0, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11]
  ];
  return { type: 'HexPrism', vertices, edges, faces, radius: h * 1.3 };
};

export default function LaserSolidsBackground({ 
  opacity = 0.55,
  speedMultiplier = 1.0
}) {
  const canvasRef = useRef(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [laserSpeed, setLaserSpeed] = useState(1);
  const [colorMode, setColorMode] = useState('cyan'); // 'cyan' | 'violet' | 'emerald'

  useEffect(() => {
    if (!isEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse camera parallax
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const modelGenerators = [
      createCube,
      createOctahedron,
      createIcosahedron,
      createPyramid,
      createHexagonalPrism
    ];

    // Generate around 8 shapes placed in random positions with generous spacing
    const generateSolids = () => {
      const targetCount = 8;
      const points = [];
      const minDistance = 0.23; // Normalized spacing threshold ensuring ample breathing room between shapes

      // Candidate generation with rejection sampling for well-spaced random positions
      for (let attempt = 0; attempt < 500 && points.length < targetCount; attempt++) {
        const candidateX = 0.08 + Math.random() * 0.84;
        const candidateY = 0.10 + Math.random() * 0.80;

        let tooClose = false;
        for (let i = 0; i < points.length; i++) {
          const dx = candidateX - points[i].x;
          const dy = (candidateY - points[i].y) * (height / width);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistance) {
            tooClose = true;
            break;
          }
        }

        if (!tooClose) {
          points.push({ x: candidateX, y: candidateY });
        }
      }

      // Fallback spaced points if random sampling had any unfilled spots
      const fallbackGrid = [
        { x: 0.12, y: 0.18 }, { x: 0.85, y: 0.16 },
        { x: 0.48, y: 0.22 }, { x: 0.15, y: 0.52 },
        { x: 0.82, y: 0.55 }, { x: 0.35, y: 0.82 },
        { x: 0.68, y: 0.80 }, { x: 0.50, y: 0.50 }
      ];
      while (points.length < targetCount) {
        points.push(fallbackGrid[points.length]);
      }

      const solids = [];
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const generator = modelGenerators[i % modelGenerators.length];
        const baseSize = width < 768 ? 38 + Math.random() * 12 : 46 + Math.random() * 18;
        const model = generator(baseSize);

        solids.push({
          ...model,
          anchorX: pt.x,
          anchorY: pt.y,
          currentScreenX: pt.x * width,
          currentScreenY: pt.y * height,
          rotX: Math.random() * Math.PI * 2,
          rotY: Math.random() * Math.PI * 2,
          rotZ: Math.random() * Math.PI * 2,
          speedX: (0.005 + Math.random() * 0.006) * (Math.random() > 0.5 ? 1 : -1),
          speedY: (0.006 + Math.random() * 0.007) * (Math.random() > 0.5 ? 1 : -1),
          speedZ: (0.003 + Math.random() * 0.004) * (Math.random() > 0.5 ? 1 : -1),
          constructProgress: Math.random(),
          scanLaserY: -baseSize * 1.5,
          scanLaserSpeed: (0.9 + Math.random() * 0.5) * 1.3,
          floatPhase: Math.random() * Math.PI * 2,
          pulseProgress: Math.random(),
          pulseSpeed: 0.02 + Math.random() * 0.02,
          pulseEdgeIdx: Math.floor(Math.random() * model.edges.length)
        });
      }
      return solids;
    };

    let solids = generateSolids();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      solids = generateSolids();
    };

    window.addEventListener('resize', handleResize);

    let time = 0;

    const render = () => {
      time += 0.02;

      // Smooth mouse interpolation for parallax
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      const parallaxX = ((mouse.x / width) - 0.5) * 35;
      const parallaxY = ((mouse.y / height) - 0.5) * 25;

      // 60FPS Hardware-accelerated clear
      ctx.clearRect(0, 0, width, height);

      // Color Schemes
      let neonGlow = 'rgba(25, 195, 255, 0.4)';  // Cyan Glow
      let laserCore = '#19c3ff';                  // Cyan Core
      let sparkColor = '#ffffff';                 // Bright White Spark
      let faceFill = 'rgba(25, 195, 255, 0.04)';

      if (colorMode === 'emerald') {
        neonGlow = 'rgba(52, 211, 153, 0.4)';
        laserCore = '#34d399';
        faceFill = 'rgba(52, 211, 153, 0.04)';
      } else if (colorMode === 'violet') {
        neonGlow = 'rgba(144, 80, 240, 0.4)';
        laserCore = '#9050f0';
        faceFill = 'rgba(144, 80, 240, 0.04)';
      }

      // Arrays to collect projected points and lines for batched 2-pass drawing
      const allSolidData = [];

      for (let sIdx = 0; sIdx < solids.length; sIdx++) {
        const s = solids[sIdx];

        // Smooth floating motion
        const floatOffsetY = Math.sin(time * 1.4 + s.floatPhase) * 12;
        const centerX = s.anchorX * width + parallaxX;
        const centerY = s.anchorY * height + floatOffsetY + parallaxY;
        s.currentScreenX = centerX;
        s.currentScreenY = centerY;

        // Rotate 3D orientation
        s.rotX += s.speedX * laserSpeed;
        s.rotY += s.speedY * laserSpeed;
        s.rotZ += s.speedZ * laserSpeed;

        // Update Laser Construction & Scan Cycle
        s.constructProgress += 0.0035 * laserSpeed;
        if (s.constructProgress > 1.2) {
          s.constructProgress = 0;
        }

        s.scanLaserY += s.scanLaserSpeed * laserSpeed;
        if (s.scanLaserY > s.radius * 1.4) {
          s.scanLaserY = -s.radius * 1.4;
        }

        // Trigonometry for local 3D rotation
        const cx = Math.cos(s.rotX);
        const sx = Math.sin(s.rotX);
        const cy = Math.cos(s.rotY);
        const sy = Math.sin(s.rotY);
        const cz = Math.cos(s.rotZ);
        const sz = Math.sin(s.rotZ);

        // Project local 3D vertices directly onto screen center (Zero Center Clumping!)
        const projected = [];
        for (let vIdx = 0; vIdx < s.vertices.length; vIdx++) {
          const [vx, vy, vz] = s.vertices[vIdx];

          // 3D Matrix Rotation (local space)
          const y1 = vy * cx - vz * sx;
          const z1 = vy * sx + vz * cx;

          const x2 = vx * cy + z1 * sy;
          const z2 = -vx * sy + z1 * cy;

          const x3 = x2 * cz - y1 * sz;
          const y3 = x2 * sz + y1 * cz;

          // Direct Screen mapping
          projected.push({
            x: centerX + x3,
            y: centerY + y3,
            modelY: vy
          });
        }

        allSolidData.push({
          solid: s,
          projected,
          centerX,
          centerY
        });
      }

      // ==========================================
      // PASS 1: DRAW SOLID FACETS (Holographic Volume)
      // ==========================================
      ctx.fillStyle = faceFill;
      for (let d = 0; d < allSolidData.length; d++) {
        const { solid: s, projected } = allSolidData[d];
        if (s.faces && s.faces.length > 0) {
          for (let f = 0; f < s.faces.length; f++) {
            const face = s.faces[f];
            if (face.length < 3) continue;

            const p0 = projected[face[0]];
            const p1 = projected[face[1]];
            const p2 = projected[face[2]];

            // Fast 2D cross-product backface check
            const cross = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
            if (cross > -50) {
              ctx.beginPath();
              ctx.moveTo(p0.x, p0.y);
              for (let k = 1; k < face.length; k++) {
                ctx.lineTo(projected[face[k]].x, projected[face[k]].y);
              }
              ctx.closePath();
              ctx.fill();
            }
          }
        }
      }

      // ==========================================
      // PASS 2: BATCHED NEON LASER GLOW AURA (Fast!)
      // ==========================================
      ctx.strokeStyle = neonGlow;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      for (let d = 0; d < allSolidData.length; d++) {
        const { solid: s, projected } = allSolidData[d];
        const activeEdges = Math.min(
          s.edges.length,
          Math.floor(s.edges.length * Math.min(1, s.constructProgress * 1.3))
        );

        for (let e = 0; e < activeEdges; e++) {
          const [v1, v2] = s.edges[e];
          const p1 = projected[v1];
          const p2 = projected[v2];
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }
      }
      ctx.stroke();

      // ==========================================
      // PASS 3: CRISP HIGH-TECH LASER CORE LINE
      // ==========================================
      ctx.strokeStyle = laserCore;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let d = 0; d < allSolidData.length; d++) {
        const { solid: s, projected } = allSolidData[d];
        const activeEdges = Math.min(
          s.edges.length,
          Math.floor(s.edges.length * Math.min(1, s.constructProgress * 1.3))
        );

        for (let e = 0; e < activeEdges; e++) {
          const [v1, v2] = s.edges[e];
          const p1 = projected[v1];
          const p2 = projected[v2];
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }
      }
      ctx.stroke();

      // ==========================================
      // PASS 4: SCANNING WELD BEAMS, VERTICES & SPARKS
      // ==========================================
      for (let d = 0; d < allSolidData.length; d++) {
        const { solid: s, projected, centerX, centerY } = allSolidData[d];

        // 1. Vertices (Joint beacons)
        ctx.fillStyle = sparkColor;
        for (let v = 0; v < projected.length; v++) {
          const p = projected[v];
          ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        }

        // 2. Traveling Edge Laser Spark
        s.pulseProgress += s.pulseSpeed * laserSpeed;
        if (s.pulseProgress > 1) {
          s.pulseProgress = 0;
          s.pulseEdgeIdx = Math.floor(Math.random() * s.edges.length);
        }
        if (s.pulseEdgeIdx < s.edges.length) {
          const [v1, v2] = s.edges[s.pulseEdgeIdx];
          const p1 = projected[v1];
          const p2 = projected[v2];
          const px = p1.x + (p2.x - p1.x) * s.pulseProgress;
          const py = p1.y + (p2.y - p1.y) * s.pulseProgress;

          ctx.fillStyle = sparkColor;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Local Laser Slice / Holographic Scanning Ellipse
        if (s.scanLaserY > -s.radius && s.scanLaserY < s.radius) {
          const scanY = centerY + s.scanLaserY;
          ctx.strokeStyle = neonGlow;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(centerX, scanY, s.radius * 1.1, s.radius * 0.35, s.rotZ, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // ==========================================
      // PASS 5: CONSTELLATION LASER LINKS (Clean & Fast)
      // ==========================================
      ctx.strokeStyle = 'rgba(25, 195, 255, 0.12)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      for (let i = 0; i < allSolidData.length; i++) {
        for (let j = i + 1; j < allSolidData.length; j++) {
          const c1 = allSolidData[i];
          const c2 = allSolidData[j];
          const dx = c1.centerX - c2.centerX;
          const dy = c1.centerY - c2.centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 280) {
            ctx.moveTo(c1.centerX, c1.centerY);
            ctx.lineTo(c2.centerX, c2.centerY);
          }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isEnabled, laserSpeed, colorMode]);

  if (!isEnabled) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setIsEnabled(true)}
          className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[10px] font-mono text-cyan-400 hover:text-white shadow-xl backdrop-blur-md flex items-center gap-1.5"
          title="Enable Laser Solids Background"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          <span>Laser 3D Solids: OFF</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 3D Laser Wireframe Canvas Layer (Hardware accelerated) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-700"
        style={{ opacity }}
        aria-hidden="true"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* Soft Ambient Vignette that keeps solids clearly visible */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07090e]/30 via-transparent to-[#07090e]/30 pointer-events-none" />
      </div>

      {/* Floating Laser Control Pill */}
      <div className="fixed bottom-4 left-4 z-40 group pointer-events-auto">
        <div className="flex items-center gap-2 p-1.5 rounded-full bg-slate-950/85 border border-slate-800/90 shadow-2xl backdrop-blur-md text-[10px] font-mono text-slate-300">
          <div className="flex items-center gap-1 pl-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="font-semibold text-cyan-400 uppercase tracking-wider">3D Laser</span>
          </div>

          <button
            onClick={() => setLaserSpeed(prev => (prev === 1 ? 1.7 : prev === 1.7 ? 0.5 : 1))}
            className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
            title="Toggle Laser Speed"
          >
            Speed: {laserSpeed === 1.7 ? 'FAST' : laserSpeed === 0.5 ? 'SLOW' : '1x'}
          </button>

          <button
            onClick={() => setColorMode(prev => (prev === 'cyan' ? 'violet' : prev === 'violet' ? 'emerald' : 'cyan'))}
            className="px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:text-white transition-colors uppercase"
            title="Change Laser Color Theme"
          >
            {colorMode}
          </button>

          <button
            onClick={() => setIsEnabled(false)}
            className="px-1.5 py-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Turn Off 3D Laser FX"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
}
