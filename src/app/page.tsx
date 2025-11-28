'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './landing.css'

export default function Home() {
  const modelContainerRef = useRef<HTMLDivElement>(null)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    // Activar animación de texto después de un pequeño delay
    const textTimer = setTimeout(() => {
      setShowText(true)
    }, 500)

    const modelContainer = modelContainerRef.current
    if (!modelContainer) return

    // --------- THREE.JS ----------
    let model: THREE.Object3D | null = null
    let rafId = 0

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      32.5,
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

    let animationProgress = 0
    const animationDuration = 2000
    let startTime: number | null = null

    const initialCameraPosition = new THREE.Vector3(0, 0, 5)
    const targetCameraPosition = new THREE.Vector3(0, 0, 3)

    const lookAtTarget = new THREE.Vector3(0, 0, 0)

    const initialRotation = Math.PI * 0.5
    const targetRotation = 3.2

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3)
    }

    const loadModel = async () => {
      try {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
        const loader = new GLTFLoader()

        const modelPath = '/modelo.glb'

        loader.load(
          modelPath,
          (gltf) => {
            model = gltf.scene

            model.traverse((node: any) => {
              if (node.isMesh && node.material) {
                node.material.metalness = 0.05
                node.material.roughness = 0.9
              }
            })

            const box = new THREE.Box3().setFromObject(model)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())

            model.position.set(-center.x, -center.y, -center.z)
            model.rotation.y = initialRotation

            const maxDim = Math.max(size.x, size.y, size.z)
            initialCameraPosition.z = maxDim * 2.5
            targetCameraPosition.z = maxDim * 1.8

            camera.position.copy(initialCameraPosition)
            camera.lookAt(lookAtTarget)

            scene.add(model)
            startTime = Date.now()
          },
          undefined,
          (err) => {
            console.error('Error cargando modelo:', err)
          }
        )
      } catch (error) {
        console.error('Error importing GLTFLoader:', error)
      }
    }

    const animate = () => {
      rafId = requestAnimationFrame(animate)

      if (startTime !== null && animationProgress < 1) {
        const elapsed = Date.now() - startTime
        animationProgress = Math.min(elapsed / animationDuration, 1)

        const easedProgress = easeOutCubic(animationProgress)

        if (model) {
          model.rotation.y = initialRotation + (targetRotation - initialRotation) * easedProgress
        }

        camera.position.lerpVectors(
          initialCameraPosition,
          targetCameraPosition,
          easedProgress
        )
        camera.lookAt(lookAtTarget)

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
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(textTimer)
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
      {/* Texto izquierdo */}
      <div className={`side-content left-content ${showText ? 'animate-in' : ''}`}>
        <h1 className="main-title">POLARIS</h1>
        <h2 className="sub-title">Lo mejor para tu negocio</h2>
      </div>

      {/* Texto derecho */}
      <div className={`side-content right-content ${showText ? 'animate-in' : ''}`}>
        <h1 className="main-title">BUSINESS</h1>
        <h2 className="sub-title">Desarrollo empresarial</h2>
      </div>

      <div
        ref={modelContainerRef}
        className="model-wrapper"
      />
    </div>
  )
}
