'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './landing.css';
import VideoSection from './pages/Landing/videoSection';
import ParticleMorphingLoading from './components/Loading';

export default function Home() {
  const modelContainerRef = useRef<HTMLDivElement>(null);
  const [textState, setTextState] = useState<'hidden' | 'entering' | 'visible' | 'exiting'>('hidden');
  const [showLoading, setShowLoading] = useState(true);
  const sceneRef = useRef<{
    camera: THREE.PerspectiveCamera | null;
    model: THREE.Object3D | null;
    targetRotationY: number;
    targetFOV: number;
    targetCameraZ: number;
    targetScale: number;
    initialCameraZ: number;
  }>({
    camera: null,
    model: null,
    targetRotationY: 3.2,
    targetFOV: 32.5,
    targetCameraZ: 3,
    targetScale: 1,
    initialCameraZ: 3
  });

  useEffect(() => {
    // Animación de entrada del texto DESPUÉS DE 5 SEGUNDOS
    const textTimer = setTimeout(() => {
      setTextState('entering');
      // Después de la animación de entrada, marcar como visible
      setTimeout(() => {
        setTextState('visible');
      }, 1000); // Duración de la animación de entrada
    }, 5000); // 5 segundos para el texto

    const modelContainer = modelContainerRef.current;
    if (!modelContainer) return;

    let model: THREE.Object3D | null = null;
    let rafId = 0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      32.5,
      window.innerWidth / window.innerHeight,
      0.1,
      5000
    );

    sceneRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    modelContainer.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(1, 2, 3);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-2, 0, -2);
    scene.add(fillLight);

    let animationProgress = 0;
    const animationDuration = 2000;
    let startTime: number | null = null;
    let entryAnimationComplete = false;

    const initialCameraPosition = new THREE.Vector3(0, 0, 5);
    const targetCameraPosition = new THREE.Vector3(0, 0, 3);
    const lookAtTarget = new THREE.Vector3(0, 0, 0);

    const initialRotation = Math.PI * 0.5;
    const targetRotation = 3.2;

    const initialFOV = 32.5;
    const finalFOV = 15;

    const initialRotationY = 3.2;
    const finalRotationY = 0;

    const zoomCameraMultiplier = 0.5;
    const initialScale = 1;
    const finalScale = 2;

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    // ========== SCROLL HANDLER ==========
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = Math.min(scrollTop / documentHeight, 1);

      // Control de visibilidad del texto
      const hideThreshold = 0.03; // 3% del scroll
      const showThreshold = 0.01; // 1% del scroll

      setTextState(prev => {
        if (scrollProgress > hideThreshold && (prev === 'visible' || prev === 'entering')) {
          return 'exiting';
        } else if (scrollProgress < showThreshold && prev === 'exiting') {
          return 'visible';
        }
        return prev;
      });

      const easedProgress = easeOutCubic(scrollProgress);

      sceneRef.current.targetRotationY = initialRotationY + (finalRotationY - initialRotationY) * easedProgress;
      sceneRef.current.targetFOV = initialFOV + (finalFOV - initialFOV) * easedProgress;

      const initialZ = sceneRef.current.initialCameraZ;
      const finalZ = initialZ * zoomCameraMultiplier;
      sceneRef.current.targetCameraZ = initialZ + (finalZ - initialZ) * easedProgress;

      sceneRef.current.targetScale = initialScale + (finalScale - initialScale) * easedProgress;
    };

    const loadModel = async () => {
      try {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();

        const modelPath = '/modelo.glb';

        loader.load(
          modelPath,
          (gltf) => {
            model = gltf.scene;
            sceneRef.current.model = model;

            model.traverse((node: any) => {
              if (node.isMesh && node.material) {
                node.material.metalness = 0.05;
                node.material.roughness = 0.9;
                // Inicialmente hacer el modelo transparente
                node.material.transparent = true;
                node.material.opacity = 0;
              }
            });

            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            model.position.set(-center.x, -center.y, -center.z);
            model.rotation.y = initialRotation;

            const maxDim = Math.max(size.x, size.y, size.z);
            initialCameraPosition.z = maxDim * 2.5;
            targetCameraPosition.z = maxDim * 1.8;

            sceneRef.current.initialCameraZ = targetCameraPosition.z;
            sceneRef.current.targetCameraZ = targetCameraPosition.z;

            camera.position.copy(initialCameraPosition);
            camera.lookAt(lookAtTarget);

            scene.add(model);

            // INICIAR ANIMACIÓN DEL MODELO DESPUÉS DE 5 SEGUNDOS
            setTimeout(() => {
              startTime = Date.now();
            }, 5000); // 5 segundos para la animación del modelo
          },
          undefined,
          (err) => {
            console.error('Error cargando modelo:', err);
          }
        );
      } catch (error) {
        console.error('Error importing GLTFLoader:', error);
      }
    };

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      if (startTime !== null && animationProgress < 1) {
        const elapsed = Date.now() - startTime;
        animationProgress = Math.min(elapsed / animationDuration, 1);

        const easedProgress = easeOutCubic(animationProgress);

        if (model) {
          model.rotation.y = initialRotation + (targetRotation - initialRotation) * easedProgress;
        }

        camera.position.lerpVectors(
          initialCameraPosition,
          targetCameraPosition,
          easedProgress
        );
        camera.lookAt(lookAtTarget);

        if (model && animationProgress < 0.5) {
          const opacity = animationProgress * 2;
          model.traverse((node: any) => {
            if (node.isMesh && node.material) {
              node.material.transparent = true;
              node.material.opacity = opacity;
            }
          });
        } else if (model && animationProgress >= 0.5) {
          model.traverse((node: any) => {
            if (node.isMesh && node.material) {
              node.material.opacity = 1;
            }
          });
        }

        if (animationProgress >= 1) {
          startTime = null;
          entryAnimationComplete = true;
        }
      }

      if (entryAnimationComplete) {
        const lerpFactor = 0.08;

        if (sceneRef.current.model) {
          const currentRotation = sceneRef.current.model.rotation.y;
          const targetRot = sceneRef.current.targetRotationY;
          sceneRef.current.model.rotation.y += (targetRot - currentRotation) * lerpFactor;

          const currentScale = sceneRef.current.model.scale.x;
          const targetScale = sceneRef.current.targetScale;
          const newScale = currentScale + (targetScale - currentScale) * lerpFactor;
          sceneRef.current.model.scale.set(newScale, newScale, newScale);
        }

        if (sceneRef.current.camera) {
          const currentFOV = sceneRef.current.camera.fov;
          const targetFOV = sceneRef.current.targetFOV;
          sceneRef.current.camera.fov += (targetFOV - currentFOV) * lerpFactor;

          const currentZ = sceneRef.current.camera.position.z;
          const targetZ = sceneRef.current.targetCameraZ;
          sceneRef.current.camera.position.z += (targetZ - currentZ) * lerpFactor;

          sceneRef.current.camera.updateProjectionMatrix();
          sceneRef.current.camera.lookAt(lookAtTarget);
        }
      }

      renderer.render(scene, camera);
    };

    loadModel();
    animate();

    window.addEventListener('scroll', handleScroll);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(textTimer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);

      if (model) {
        scene.remove(model);
      }

      renderer.dispose();
      if (modelContainer.contains(renderer.domElement)) {
        modelContainer.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <>
      {showLoading && (
        <ParticleMorphingLoading onLoadingComplete={() => setShowLoading(false)} />
      )}
      {/* Modelo 3D Fijo */}
      <div className="model-fixed-container">
        <div className="model-container bg-1section">
          {/* Texto izquierdo */}
          <div className={`side-content left-content text-${textState}`}>
            <h1 className="main-title">POLARIS</h1>
            <h2 className="sub-title">Lo mejor para tu negocio</h2>
          </div>

          {/* Texto derecho */}
          <div className={`side-content right-content text-${textState}`}>
            <h1 className="main-title">BUSINESS</h1>
            <h2 className="sub-title">Desarrollo empresarial</h2>
          </div>

          <div
            ref={modelContainerRef}
            className="model-wrapper"
          />

          {/* Indicador de scroll */}
          <div className={`scroll-indicator ${textState === 'exiting' ? 'hide' : ''}`}>
            <span>Scroll para explorar</span>
            <div className="scroll-arrow"></div>
          </div>
        </div>
      </div>

      {/* Contenedor de scroll con altura */}
      <div className="scroll-content">
        <section className="section spacer-section"></section>
        <section className="section second-section">
          <div className="section-content">
            <h2>Innovación Empresarial</h2>
            <p>Transformamos tu negocio con soluciones tecnológicas de vanguardia</p>
          </div>
        </section>
        <section className="section third-section">
          <div className="section-content">
            <h2>Desarrollo a Medida</h2>
            <p>Creamos herramientas personalizadas que impulsan tu crecimiento</p>
          </div>
        </section>
        <div className='transitionModel'></div>
        <VideoSection />
      </div>
    </>
  );
}
