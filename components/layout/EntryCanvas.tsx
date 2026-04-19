"use client";

import { useEffect, useRef } from "react";

/**
 * EntryCanvas
 *
 * A quiet Three.js scene: slow-drifting particles connected by faint lines
 * when close to each other — like a soft constellation. No visible geometry,
 * no jarring rotations. Pure ambient depth.
 */
export function EntryCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let animId: number;
    let cleanup: (() => void) | null = null;

    import("three").then((THREE) => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(w, h);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
      camera.position.set(0, 0, 7);

      // ── Particle field ──────────────────────────────────────────────────────
      const PARTICLE_COUNT = 90;
      const positions: InstanceType<typeof THREE.Vector3>[] = [];
      const velocities: InstanceType<typeof THREE.Vector3>[] = [];

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions.push(new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 6,
        ));
        velocities.push(new THREE.Vector3(
          (Math.random() - 0.5) * 0.002,
          (Math.random() - 0.5) * 0.002,
          (Math.random() - 0.5) * 0.001,
        ));
      }

      // Dots
      const dotGeo = new THREE.BufferGeometry();
      const dotPositions = new Float32Array(PARTICLE_COUNT * 3);
      dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPositions, 3));
      const dotMat = new THREE.PointsMaterial({
        color: 0xc9a86c,
        size: 0.04,
        transparent: true,
        opacity: 0.55,
        sizeAttenuation: true,
      });
      const dots = new THREE.Points(dotGeo, dotMat);
      scene.add(dots);

      // Connection lines (updated per frame for nearby pairs)
      const MAX_LINES = 200;
      const linePositions = new Float32Array(MAX_LINES * 6);
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x8a7a5a,
        transparent: true,
        opacity: 0.12,
      });
      const lineSegs = new THREE.LineSegments(lineGeo, lineMat);
      scene.add(lineSegs);

      // Mouse parallax — very gentle
      let mouseX = 0, mouseY = 0;
      function onMouseMove(e: MouseEvent) {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      }
      window.addEventListener("mousemove", onMouseMove);

      // Resize
      function onResize() {
        const nw = mount!.clientWidth;
        const nh = mount!.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      }
      window.addEventListener("resize", onResize);

      const CONNECT_DIST = 2.8;
      let frame = 0;

      function animate() {
        animId = requestAnimationFrame(animate);
        frame++;

        // Move particles
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          positions[i].add(velocities[i]);
          // Soft boundary bounce
          if (Math.abs(positions[i].x) > 6) velocities[i].x *= -1;
          if (Math.abs(positions[i].y) > 5) velocities[i].y *= -1;
          if (Math.abs(positions[i].z) > 3) velocities[i].z *= -1;
          // Update buffer
          dotPositions[i * 3]     = positions[i].x;
          dotPositions[i * 3 + 1] = positions[i].y;
          dotPositions[i * 3 + 2] = positions[i].z;
        }
        dotGeo.attributes.position.needsUpdate = true;

        // Build connection lines for nearby pairs
        let lineIdx = 0;
        for (let i = 0; i < PARTICLE_COUNT && lineIdx < MAX_LINES; i++) {
          for (let j = i + 1; j < PARTICLE_COUNT && lineIdx < MAX_LINES; j++) {
            const dist = positions[i].distanceTo(positions[j]);
            if (dist < CONNECT_DIST) {
              linePositions[lineIdx * 6]     = positions[i].x;
              linePositions[lineIdx * 6 + 1] = positions[i].y;
              linePositions[lineIdx * 6 + 2] = positions[i].z;
              linePositions[lineIdx * 6 + 3] = positions[j].x;
              linePositions[lineIdx * 6 + 4] = positions[j].y;
              linePositions[lineIdx * 6 + 5] = positions[j].z;
              lineIdx++;
            }
          }
        }
        // Zero out unused line segments
        for (let k = lineIdx; k < MAX_LINES; k++) {
          linePositions.fill(0, k * 6, k * 6 + 6);
        }
        lineGeo.attributes.position.needsUpdate = true;
        lineGeo.setDrawRange(0, lineIdx * 2);

        // Subtle camera drift following mouse
        camera.position.x += (mouseX * 0.25 - camera.position.x) * 0.03;
        camera.position.y += (-mouseY * 0.2 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      }
      animate();

      cleanup = () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("mousemove", onMouseMove);
        cancelAnimationFrame(animId);
        renderer.dispose();
        dotGeo.dispose();
        dotMat.dispose();
        lineGeo.dispose();
        lineMat.dispose();
        if (mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
      };
    });

    return () => { cleanup?.(); };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    />
  );
}
