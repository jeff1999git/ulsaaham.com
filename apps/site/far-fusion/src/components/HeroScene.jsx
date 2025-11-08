import { useEffect, useRef } from "react";
import {
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  CanvasTexture,
  LinearFilter,
  AdditiveBlending,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  Points,
  MathUtils,
  Vector2,
  Clock,
  SRGBColorSpace
} from "three";

const DOT_PRIMARY = new Color("#ff00ff");
const DOT_SECONDARY = new Color("#00ffff");

function createDotTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.6)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  return texture;
}

const HeroScene = () => {
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const observerRef = useRef(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const scene = new Scene();
    scene.background = new Color("#020617");

    const camera = new PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 2.5);

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = SRGBColorSpace;
    container.appendChild(renderer.domElement);

    container.style.opacity = "0";
    container.style.transition = "opacity 1.2s ease";
    requestAnimationFrame(() => {
      container.style.opacity = "1";
    });

    const particlesCount = 900;
    const geometry = new BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    const basePositions = new Float32Array(particlesCount * 3);

    const colorA = DOT_PRIMARY.clone();
    const colorB = DOT_SECONDARY.clone();

    for (let i = 0; i < particlesCount; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(MathUtils.randFloatSpread(1));
      const radius = 1 + Math.random() * 0.8;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.6;
      const z = radius * Math.sin(phi) * Math.sin(theta);

      const idx = i * 3;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      basePositions[idx] = x;
      basePositions[idx + 1] = y;
      basePositions[idx + 2] = z;

      const lerpAmount = Math.random();
      const color = colorA.clone().lerp(colorB, lerpAmount);
      colors[idx] = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;
    }

    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));

    const dotTexture = createDotTexture();
    const material = new PointsMaterial({
      size: 0.025,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: AdditiveBlending,
      map: dotTexture,
      vertexColors: true
    });

    const points = new Points(geometry, material);
    scene.add(points);

    const clock = new Clock();
    const mouseTarget = new Vector2(0, 0);

    const handlePointerMove = (event) => {
      const { innerWidth, innerHeight } = window;
      const x = (event.clientX / innerWidth - 0.5) * 0.9;
      const y = (event.clientY / innerHeight - 0.5) * 0.6;
      mouseTarget.set(x, -y);
    };

    const handlePointerLeave = () => {
      mouseTarget.set(0, 0);
    };

    const handleResize = () => {
      const { clientWidth, clientHeight } = container;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight || 1;
      camera.updateProjectionMatrix();
    };

    handleResize();

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", handleResize);

    const animate = () => {
      if (!isRunningRef.current) {
        animationFrameRef.current = null;
        return;
      }

      const elapsed = clock.getElapsedTime();
      const posAttr = geometry.getAttribute("position");
      const arr = posAttr.array;

      for (let i = 0; i < particlesCount; i += 1) {
        const idx = i * 3;
        const bx = basePositions[idx];
        const by = basePositions[idx + 1];
        const bz = basePositions[idx + 2];

        arr[idx] = bx + Math.sin(elapsed * 0.6 + bz) * 0.05;
        arr[idx + 1] = by + Math.cos(elapsed * 0.4 + bx) * 0.04;
        arr[idx + 2] = bz + Math.sin(elapsed * 0.5 + by) * 0.05;
      }
      posAttr.needsUpdate = true;

      camera.position.x += (mouseTarget.x - camera.position.x) * 0.045;
      camera.position.y += (mouseTarget.y - camera.position.y) * 0.045;
      camera.lookAt(scene.position);

      points.rotation.y += 0.0006;
      points.rotation.x += 0.0003;

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (isRunningRef.current) {
        return;
      }
      isRunningRef.current = true;
      clock.start();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      isRunningRef.current = false;
      clock.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAnimation();
          } else {
            stopAnimation();
          }
        });
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(container);

    return () => {
      stopAnimation();

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);

      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      scene.remove(points);
      geometry.dispose();
      material.dispose();
      dotTexture.dispose();
      renderer.dispose();

      if (renderer.domElement && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="hero-scene-canvas" aria-hidden="true" />;
};

export default HeroScene;

