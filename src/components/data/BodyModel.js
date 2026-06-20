"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { DEFAULT_STATUS } from "./organStatus";

// Digital-twin body model per biological sex (same naming superpower uses:
// `/{sex}OptimisedV8.glb`). Both are skinned bodies with the SAME UV layout the
// status textures are baked against, so the organ overlays land pixel-perfect.
const MODEL_BY_SEX = {
  male: "/maleOptimisedV8.glb",
  female: "/femaleOptimisedV8.glb",
};
const modelUrlForSex = (sex) => MODEL_BY_SEX[sex] || MODEL_BY_SEX.male;

// Pre-baked, UV-aligned textures live under /models/{sex}/textures/.
// `base.jpg` is the plain body; `{organ}_{status}.jpg` paints one organ region in
// its status colour (good/neutral/bad). This is exactly how superpower does it —
// no projection maths, so it's perfectly accurate from every angle.
const texDirForSex = (sex) => `/models/${sex}/textures`;
const fileFor = (highlight, status) =>
  highlight ? `${highlight}_${status}.jpg` : "base.jpg";

// superpower's texture config: unflipped (GLB convention), sRGB, linear, no mipmaps.
function configureTexture(t) {
  t.flipY = false;
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  return t;
}

function BodyTwin({ highlight, status = DEFAULT_STATUS, sex = "male" }) {
  const { scene } = useGLTF(modelUrlForSex(sex));
  const { camera, gl } = useThree();

  const meshesRef = useRef([]);
  const cacheRef = useRef(new Map()); // filename -> THREE.Texture (per-instance, sex-scoped)
  const loaderRef = useRef(null);
  const texDir = texDirForSex(sex);

  // Clone + center the model (static; the camera orbits), and give every mesh a
  // fresh matte material whose `map` we swap to the active organ texture.
  const data = useMemo(() => {
    const s = scene.clone(true);
    s.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(s);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    s.position.sub(center);

    const meshes = [];
    s.traverse((o) => {
      if (!o.isMesh) return;
      o.material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0,
        map: null,
      });
      meshes.push(o);
    });
    meshesRef.current = meshes;

    const lookAlongX = size.x < size.z;
    return { root: s, size, lookAlongX };
  }, [scene]);

  // Load (and cache) a texture from the current sex's texture directory.
  const loadTexture = useCallback(
    (file) =>
      new Promise((resolve) => {
        const cache = cacheRef.current;
        if (cache.has(file)) return resolve(cache.get(file));
        if (!loaderRef.current) loaderRef.current = new THREE.TextureLoader();
        loaderRef.current.load(
          `${texDir}/${file}`,
          (t) => {
            configureTexture(t);
            gl.initTexture?.(t);
            cache.set(file, t);
            resolve(t);
          },
          undefined,
          () => resolve(null),
        );
      }),
    [texDir, gl],
  );

  const applyTexture = useCallback((t) => {
    if (!t) return;
    meshesRef.current.forEach((m) => {
      m.material.map = t;
      m.material.needsUpdate = true;
    });
  }, []);

  // Swap the body texture whenever the selected organ/status (or model) changes.
  // The body stays visible the whole time — only the map updates once it's loaded.
  const activeFile = fileFor(highlight, status);
  useEffect(() => {
    let cancelled = false;
    loadTexture(activeFile).then((t) => {
      if (cancelled) return;
      if (t) return applyTexture(t);
      // Missing organ/status texture -> fall back to the plain base body.
      if (activeFile !== "base.jpg") {
        loadTexture("base.jpg").then((b) => !cancelled && applyTexture(b));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeFile, data, loadTexture, applyTexture]);

  // Frame the body and gently orbit the camera (the body itself stays put).
  useLayoutEffect(() => {
    const dist = data.size.y * 2.5;
    if (data.lookAlongX) camera.position.set(dist, 0, 0);
    else camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [data, camera]);

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

export function BodyModel({ className, highlight, status, sex = "male" }) {
  return (
    <div className={className}>
      <Canvas
        flat
        frameloop="always"
        camera={{ position: [0, 0, 4], fov: 28 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: "transparent" }}
        onCreated={({ gl, invalidate }) => {
          gl.domElement.addEventListener("webglcontextrestored", () => invalidate());
        }}
      >
        <ambientLight intensity={0.7} />
        <hemisphereLight intensity={0.6} groundColor="#d8d8d8" color="#ffffff" />
        <directionalLight position={[3, 5, 6]} intensity={1.3} />
        <directionalLight position={[-4, 1, -2]} intensity={0.35} />
        <Suspense fallback={null}>
          {/* key on sex forces a clean remount so the new body/textures/camera reset */}
          <BodyTwin key={sex} highlight={highlight} status={status} sex={sex} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/maleOptimisedV8.glb");
useGLTF.preload("/femaleOptimisedV8.glb");
export default BodyModel;
