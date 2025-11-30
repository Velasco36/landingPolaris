"use client";

import React, { useEffect, useRef, useState } from "react";

const FramePlayer: React.FC = () => {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isFixed, setIsFixed] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0); // Nuevo estado para la altura

  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameSectionRef = useRef<HTMLDivElement | null>(null);
  const scrollStartY = useRef<number>(0);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Configuración
  const totalFrames = 80;
  const basePath = "/imagenes";
  const framePrefix = "video1_frame_";
  const frameExtension = ".jpg";
  const pixelsPerFrame = 50;

  // Altura total necesaria para la animación
  const totalScrollHeight = totalFrames * pixelsPerFrame;

  // Obtener altura de la ventana solo en el cliente
  useEffect(() => {
    setWindowHeight(window.innerHeight);

    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Precargar todas las imágenes
  useEffect(() => {
    let loadedCount = 0;
    const imagesToLoad: HTMLImageElement[] = [];

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const frameNumber = String(i).padStart(3, '0');
      img.src = `${basePath}/${framePrefix}${frameNumber}${frameExtension}`;

      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalFrames) {
          setImagesLoaded(true);
        }
      };

      imagesToLoad.push(img);
    }

    imagesRef.current = imagesToLoad;

    return () => {
      imagesRef.current = [];
    };
  }, []);

  // Control de scroll
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      const frameSection = frameSectionRef.current;
      if (!container || !frameSection || windowHeight === 0) return;

      const containerRect = container.getBoundingClientRect();
      const scrollProgress = -containerRect.top;

      // Determinar si debemos fijar la sección
      if (containerRect.top <= 0 && containerRect.bottom > windowHeight) {
        setIsFixed(true);

        // Calcular el frame basado en el progreso del scroll
        const newFrame = Math.max(
          1,
          Math.min(totalFrames, Math.floor(scrollProgress / pixelsPerFrame) + 1)
        );

        setCurrentFrame(newFrame);
      } else if (containerRect.top > 0) {
        // Antes de llegar a la sección
        setIsFixed(false);
        setCurrentFrame(1);
      } else if (containerRect.bottom <= windowHeight) {
        // Después de pasar la sección
        setIsFixed(false);
        setCurrentFrame(totalFrames);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Ejecutar una vez al montar

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [totalFrames, pixelsPerFrame, windowHeight]);

  const getFramePath = (frameNumber: number) => {
    const frameNum = String(frameNumber).padStart(3, '0');
    return `${basePath}/${framePrefix}${frameNum}${frameExtension}`;
  };

  return (
    <div>
      {/* Contenido antes de la sección de frames */}

      {/* Contenedor con altura para permitir el scroll */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: `${totalScrollHeight + (windowHeight || 1000)}px`, // Usar windowHeight o un valor por defecto
          background: '#000'
        }}
      >
        {/* Sección de frames que se fija */}
        <div
          ref={frameSectionRef}
          style={{
            position: isFixed ? 'fixed' : 'absolute',
            top: isFixed ? 0 : 'auto',
            bottom: isFixed ? 'auto' : 0,
            left: 0,
            width: '100%',
            height: '100vh',
            zIndex: isFixed ? 1000 : 'auto'
          }}
        >
          {!imagesLoaded ? (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontSize: '1.5rem',
              textAlign: 'center'
            }}>
              <div>Cargando frames...</div>
              <div style={{ fontSize: '2rem', marginTop: '1rem' }}>
                {Math.round((currentFrame / totalFrames) * 100)}%
              </div>
            </div>
          ) : (
            <>
              <img
                src={getFramePath(currentFrame)}
                alt={`Frame ${currentFrame}`}
                style={{
                  width: '100%',
                  height: '100vh',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />

              {/* Indicador de progreso */}
              <div style={{
                position: 'absolute',
                bottom: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '8px',
                display: 'flex',
                gap: '1rem',
                fontSize: '0.9rem',
                zIndex: 10,
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <span>Frame {currentFrame} / {totalFrames}</span>
                <span>|</span>
                <span>{isFixed ? "📌 Scroll activo" : "⏸️ Normal"}</span>
                <span>|</span>
                <span>{Math.round((currentFrame / totalFrames) * 100)}%</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contenido después de la sección de frames */}

    </div>
  );
};

export default FramePlayer;
