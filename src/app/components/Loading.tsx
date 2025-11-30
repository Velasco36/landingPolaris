'use client';

import React, { useEffect, useRef, useState } from 'react';

class Particle {
  private index: number;
  private total: number;
  private startAngle: number;
  private startDistance: number;
  private circleAngle: number;
  private circleRadius: number;
  private organicX: number;
  private organicY: number;
  private size: number;
  private opacity: number;
  private radius: number;

  constructor(index: number, total: number, radius: number) {
    this.index = index;
    this.total = total;
    this.radius = radius;

    this.startAngle = Math.random() * Math.PI * 2;
    this.startDistance = Math.random() * 200 + 100;

    this.circleAngle = Math.random() * Math.PI * 2;
    this.circleRadius = Math.sqrt(Math.random()) * (radius * 1.1);

    const organicDistance = Math.sqrt(Math.random()) * (radius * 1.5);
    const organicAngle = Math.random() * Math.PI * 2;
    this.organicX = Math.cos(organicAngle) * organicDistance;
    this.organicY = Math.sin(organicAngle) * organicDistance;

    this.size = Math.random() * 2 + 1;
    this.opacity = 1;
  }

  easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  getPosition(phase: number, phaseProgress: number, centerX: number, centerY: number) {
    let x: number, y: number;

    const easeProgress = this.easeInOutCubic(phaseProgress);

    const circleX = Math.cos(this.circleAngle) * this.circleRadius;
    const circleY = Math.sin(this.circleAngle) * this.circleRadius;

    const startX = Math.cos(this.startAngle) * this.startDistance;
    const startY = Math.sin(this.startAngle) * this.startDistance;

    if (phase === 0) {
      x = centerX + startX + (circleX - startX) * easeProgress;
      y = centerY + startY + (circleY - startY) * easeProgress;
    } else if (phase === 1) {
      x = centerX + circleX + (this.organicX - circleX) * easeProgress;
      y = centerY + circleY + (this.organicY - circleY) * easeProgress;
    } else {
      x = centerX + this.organicX + (startX - this.organicX) * easeProgress;
      y = centerY + this.organicY + (startY - this.organicY) * easeProgress;
    }

    return { x, y };
  }

  draw(ctx: CanvasRenderingContext2D, phase: number, phaseProgress: number, centerX: number, centerY: number) {
    const pos = this.getPosition(phase, phaseProgress, centerX, centerY);

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(60, 60, 60, ${this.opacity * 0.8})`;
    ctx.fill();
  }
}

const ParticleMorphingLoading: React.FC<{ onLoadingComplete?: () => void }> = ({ onLoadingComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = 120;

    const particleCount = 350;
    const particles = Array.from({ length: particleCount }, (_, i) => new Particle(i, particleCount, radius));

    let phase = 0;
    let phaseProgress = 0;
    const phaseDuration = 2000;
    let lastTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      phaseProgress += deltaTime / phaseDuration;

      if (phaseProgress >= 1) {
        phaseProgress = phaseProgress % 1;
        phase = (phase + 1) % 3;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      particles.forEach(particle => {
        particle.draw(ctx, phase, phaseProgress, centerX, centerY);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Timer para ocultar el loading después de 3 segundos
    const hideTimer = setTimeout(() => {
      setIsHiding(true);
      // Esperar a que termine la animación de slide-up antes de llamar onLoadingComplete
      setTimeout(() => {
        if (onLoadingComplete) {
          onLoadingComplete();
        }
      }, 800); // Duración de la animación slide-up
    }, 5000);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(hideTimer);
    };
  }, [onLoadingComplete]);

  return (
    <section
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-pink-50 to-pink-200 transition-transform duration-800 ease-in-out ${
        isHiding ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="max-w-full"
      />
      <div className="mt-8 text-gray-800 font-light text-sm tracking-widest">
        LOADING
      </div>
    </section>
  );
};

// Componente principal de ejemplo que muestra cómo usar el loading
const MainApp: React.FC = () => {
  const [showLoading, setShowLoading] = useState(true);

  return (
    <>
      {showLoading && (
        <ParticleMorphingLoading onLoadingComplete={() => setShowLoading(false)} />
      )}

      {/* Tu contenido principal */}
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="model-fixed-container" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          pointerEvents: 'none'
        }}>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-6xl font-bold mb-4">POLARIS</h1>
              <h2 className="text-2xl">Lo mejor para tu negocio</h2>
              <div className="mt-8">
                <h1 className="text-6xl font-bold mb-4">BUSINESS</h1>
                <h2 className="text-2xl">Desarrollo empresarial</h2>
              </div>
              <div className="mt-12 text-sm">
                <span>Scroll para explorar</span>
                <div className="mt-2 text-2xl animate-bounce">↓</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainApp;
