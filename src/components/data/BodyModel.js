"use client";

import { Suspense, useLayoutEffect, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import PLACEMENTS from "@/lib/organ-placements.json";
import { STATUS_COLORS, DEFAULT_STATUS } from "./organStatus";

const ENTRIES = Object.entries(PLACEMENTS);
const FILES = ENTRIES.map(([, p]) => p.file);

// Raw sRGB (display-space) components — the overlay is mixed into the already-sRGB
// framebuffer, so the colour must NOT be linearized by three.
function hexToSRGBVec(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
const STATUS_VEC = {
  good: hexToSRGBVec(STATUS_COLORS.good),
  neutral: hexToSRGBVec(STATUS_COLORS.neutral),
  bad: hexToSRGBVec(STATUS_COLORS.bad),
};

function BodyAndOrgans({ highlight, status = DEFAULT_STATUS }) {
  const { scene } = useGLTF("/maleOptimisedV8.glb");
  const { camera } = useThree();

  const textures = useTexture(FILES);
  useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    });
  }, [textures]);

  // shared uniforms injected into the body material; updated live when category/status change
  const u = useMemo(
    () => ({
      uMap: { value: null },
      uHasOverlay: { value: 0 },
      uHoriz: { value: new THREE.Vector3(1, 0, 0) },
      uDepth: { value: new THREE.Vector3(0, 0, 1) },
      uCenter: { value: new THREE.Vector2() },
      uSize: { value: new THREE.Vector2(1, 1) },
      uColor: { value: STATUS_VEC[DEFAULT_STATUS].clone() },
    }),
    [],
  );

  // Clone + center the model (static; the camera orbits) and inject a world-space
  // projective organ overlay into every material so the organ paints onto the real body.
  const data = useMemo(() => {
    const s = scene.clone(true);
    s.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(s);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    s.position.sub(center);

    s.traverse((o) => {
      if (!o.isMesh) return;
      const mat = new THREE.MeshStandardMaterial({ color: "#ededed", roughness: 0.72, metalness: 0 });
      mat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, u);
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWN;")
          .replace(
            "#include <skinnormal_vertex>",
            "#include <skinnormal_vertex>\nvWN = normalize(mat3(modelMatrix) * objectNormal);",
          )
          .replace(
            "#include <skinning_vertex>",
            "#include <skinning_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;",
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
             varying vec3 vWPos; varying vec3 vWN;
             uniform sampler2D uMap; uniform float uHasOverlay;
             uniform vec3 uHoriz; uniform vec3 uDepth; uniform vec2 uCenter; uniform vec2 uSize; uniform vec3 uColor;`,
          )
          .replace(
            "#include <dithering_fragment>",
            `#include <dithering_fragment>
             if (uHasOverlay > 0.5) {
               float h = dot(vWPos, uHoriz);
               vec2 ouv = vec2((h - uCenter.x) / uSize.x + 0.5, (vWPos.y - uCenter.y) / uSize.y + 0.5);
               if (ouv.x >= 0.0 && ouv.x <= 1.0 && ouv.y >= 0.0 && ouv.y <= 1.0) {
                 float nd = dot(normalize(vWN), uDepth);
                 if (nd > 0.04) {
                   vec4 oc = texture2D(uMap, ouv);
                   float a = oc.a * smoothstep(0.04, 0.5, nd);
                   gl_FragColor.rgb = mix(gl_FragColor.rgb, uColor, a);
                 }
               }
             }`,
          );
      };
      o.material = mat;
    });

    const lookAlongX = size.x < size.z;
    return {
      root: s,
      size,
      lookAlongX,
      widthExtent: lookAlongX ? size.z : size.x,
      depthExtent: lookAlongX ? size.x : size.z,
    };
  }, [scene, u]);

  useMemo(() => {
    const idx = ENTRIES.findIndex(([name]) => name === highlight);
    if (idx < 0) {
      u.uHasOverlay.value = 0;
      return;
    }
    const p = ENTRIES[idx][1];
    const { size, lookAlongX, widthExtent } = data;
    u.uMap.value = textures[idx];
    u.uHasOverlay.value = 1;
    u.uHoriz.value.set(...(lookAlongX ? [0, 0, 1] : [1, 0, 0]));
    u.uDepth.value.set(...(lookAlongX ? [1, 0, 0] : [0, 0, 1]));
    u.uCenter.value.set(p.xFrac * widthExtent, -size.y / 2 + p.yFrac * size.y);
    u.uSize.value.set(p.wFrac * widthExtent, p.hFrac * size.y);
    u.uColor.value.copy(STATUS_VEC[status] || STATUS_VEC.good);
  }, [highlight, status, data, textures, u]);

  useLayoutEffect(() => {
    const dist = data.size.y * 2.5;
    if (data.lookAlongX) camera.position.set(dist, 0, 0);
    else camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [data, camera]);

  // Gentle camera orbit — the body appears to sway, organs stay painted on it.
  useFrame(({ clock }) => {
    const az = Math.sin(clock.elapsedTime * 0.45) * 0.3;
    const dist = data.size.y * 2.5;
    if (data.lookAlongX) camera.position.set(dist * Math.cos(az), 0, dist * Math.sin(az));
    else camera.position.set(dist * Math.sin(az), 0, dist * Math.cos(az));
    camera.lookAt(0, 0, 0);
  });

  return (
    <group>
      <primitive object={data.root} />
    </group>
  );
}

export function BodyModel({ className, highlight, status }) {
  return (
    <div className={className}>
      <Canvas
        frameloop="always"
        camera={{ position: [0, 0, 4], fov: 28 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: "transparent" }}
        onCreated={({ gl, invalidate }) => {
          gl.domElement.addEventListener("webglcontextrestored", () => invalidate());
        }}
      >
        <ambientLight intensity={0.65} />
        <hemisphereLight intensity={0.75} groundColor="#d8d8d8" color="#ffffff" />
        <directionalLight position={[3, 5, 6]} intensity={2.0} />
        <directionalLight position={[-4, 1, -2]} intensity={0.45} />
        <Suspense fallback={null}>
          <BodyAndOrgans highlight={highlight} status={status} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/maleOptimisedV8.glb");
export default BodyModel;
