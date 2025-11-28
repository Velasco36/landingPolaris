'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './landing.css'

export default function Home() {
  const modelContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const modelContainer = modelContainerRef.current
    if (!modelContainer) return

    // --------- THREE.JS ----------
    let model: THREE.Object3D | null = null
    let rafId = 0

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      32.5, // ← Reducido de 100 para mejor visualización
      window.innerWidth / window.innerHeight,
      0.1,
      5000
    )

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setClearColor(0x000000, 0)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    modelContainer.appendChild(renderer.domElement)

    // Iluminación
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0)
    mainLight.position.set(1, 2, 3)
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5)
    fillLight.position.set(-2, 0, -2)
    scene.add(fillLight)

    // ⚙️ PERSONALIZACIÓN: Variables para animación de entrada
    let animationProgress = 0
    const animationDuration = 2000
    let startTime: number | null = null

    // ✅ CENTRADO: Posiciones del modelo en el centro (Y = 0)
    const initialModelPosition = new THREE.Vector3(0, 0, 0)
    const targetModelPosition = new THREE.Vector3(0, 0, 0)

    // ✅ CENTRADO: Cámara mirando al centro (Y = 0)
    const initialCameraPosition = new THREE.Vector3(0, 0, 5)
    const targetCameraPosition = new THREE.Vector3(0, 0, 3)

    // Punto al que mira la cámara (centro de la pantalla)
    const lookAtTarget = new THREE.Vector3(0, 0, 0)

    // Rotación del modelo
    const initialRotation = Math.PI * 0.5
    const targetRotation = 3.2

    // Función de easing suave
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3)
    }

    // Cargar modelo
    const loadModel = async () => {
      try {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
        const loader = new GLTFLoader()

        const modelPath = '/modelo.glb'

        console.log('Cargando modelo desde:', modelPath)

        loader.load(
          modelPath,
          (gltf) => {
            model = gltf.scene
            console.log('Modelo cargado exitosamente')

            // Configurar materiales
            model.traverse((node: any) => {
              if (node.isMesh && node.material) {
                node.material.metalness = 0.05
                node.material.roughness = 0.9
              }
            })

            // ✅ CENTRAR MODELO COMPLETAMENTE
            const box = new THREE.Box3().setFromObject(model)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())

            // Centrar el modelo en el origen (0, 0, 0)
            model.position.set(
              -center.x,
              -center.y,  // ← Esto centra verticalmente
              -center.z
            )

            // Configurar rotación inicial
            model.rotation.y = initialRotation

            // Configurar posición de cámara basada en tamaño del modelo
            const maxDim = Math.max(size.x, size.y, size.z)
            initialCameraPosition.z = maxDim * 2.5
            targetCameraPosition.z = maxDim * 1.8

            camera.position.copy(initialCameraPosition)
            camera.lookAt(lookAtTarget)

            scene.add(model)

            // Iniciar animación de entrada
            startTime = Date.now()
          },
          (progress) => {
            console.log('Cargando modelo:', ((progress.loaded / progress.total) * 100).toFixed(2) + '%')
          },
          (err) => {
            console.error('Error cargando modelo:', err)
          }
        )
      } catch (error) {
        console.error('Error importing GLTFLoader:', error)
      }
    }

    // Función de animación
    const animate = (currentTime: number) => {
      rafId = requestAnimationFrame(animate)

      // Animación de entrada
      if (startTime !== null && animationProgress < 1) {
        const elapsed = Date.now() - startTime
        animationProgress = Math.min(elapsed / animationDuration, 1)

        const easedProgress = easeOutCubic(animationProgress)

        // Animar rotación del modelo
        if (model) {
          model.rotation.y = initialRotation + (targetRotation - initialRotation) * easedProgress
        }

        // Animar posición de cámara
        camera.position.lerpVectors(
          initialCameraPosition,
          targetCameraPosition,
          easedProgress
        )
        camera.lookAt(lookAtTarget)

        // Fade in de opacidad
        if (model && animationProgress < 0.5) {
          const opacity = animationProgress * 2
          model.traverse((node: any) => {
            if (node.isMesh && node.material) {
              node.material.transparent = true
              node.material.opacity = opacity
            }
          })
        } else if (model && animationProgress >= 0.5) {
          model.traverse((node: any) => {
            if (node.isMesh && node.material) {
              node.material.opacity = 1
            }
          })
        }

        if (animationProgress >= 1) {
          startTime = null
        }
      }

      renderer.render(scene, camera)
    }

    loadModel()
    animate(0)

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(rafId)

      if (model) {
        scene.remove(model)
      }

      renderer.dispose()
      if (modelContainer.contains(renderer.domElement)) {
        modelContainer.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="model-container bg-1section">
      <div
        ref={modelContainerRef}
        className="model-wrapper"
      />
    </div>
  )
}
