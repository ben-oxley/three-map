import logo from './logo.svg';
import './App.css';
import { FC, useRef, useState, useEffect, useMemo } from 'react'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, TransformControls, useCursor, PerspectiveCamera, CameraControls, Plane, useTexture, MeshPortalMaterial } from '@react-three/drei'
import { MeshPhongMaterial } from 'three';

function App() {
  const geom = useLoader(OBJLoader, './eastnor-v1-lq2.obj');
  const ref = useRef();
  const camera = useRef();
  const cameraview = { enabled: true, fullWidth: 1280, fullHeight: 800, offsetX: 0, offsetY: 400, width: 1280, height: 800 }
  const texture = useLoader(TextureLoader, "2k_earth_nightmap.jpg");
  const name = (type) => `PavingStones092_1K-JPG_${type}.jpg`;
  //const colorMap = useLoader(TextureLoader, 'PavingStones092_1K-JPG_Color.jpg')
  const colorMap = useLoader(TextureLoader, "map2.png");
  const geometry = useMemo(() => {
    let g;
    geom.traverse((c) => {
      if (c.type === "Mesh") {
        c.castShadow = true;
        c.receiveShadow = true;
        const _c = c;
        g = _c.geometry;
      }
    });
    return g;
  }, [geom]);
  return (
    <div id="canvas-container">
      <Canvas shadowMap>
        <ambientLight intensity={1}></ambientLight>
        <PerspectiveCamera makeDefault position={[400, 0, 0]} fov={72 / 2} ref={camera} far={5000000} view={cameraview} />
        <mesh ref={ref} position={[0, 0, 371.62 / 2]} rotation={[0, 0, 0]} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial map={colorMap} />
        </mesh>
        {/* <pointLight castShadow position={[100, 100, 0]} intensity={10000} color="#fff" shadow-mapSize-height={512}
          shadow-mapSize-width={512} shadow-camera-far={1000} shadow-camera-near={1} /> */}
        <Plane
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -100, 0]}
          args={[1000, 1000]}
        >
          <meshStandardMaterial attach="material" color="black" />
        </Plane>
        <Controls></Controls>
      </Canvas>
    </div>
  );
}

function Controls(props) {
  // This reference will give us direct access to the mesh
  const cameraControlsRef = useRef()
  // Subscribe this component to the render-loop, rotate the mesh every frame
  // Return view, these are regular three.js elements expressed in JSX
  return (
    <CameraControls ref={cameraControlsRef} azimuthAngle={3.14159265 / 2} polarAngle={0} makeDefault />
  )
}

export default App;
