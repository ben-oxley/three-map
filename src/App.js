import logo from './logo.svg';
import './App.css';
import { FC, useRef, useState, useEffect, useMemo } from 'react'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { GlitchMode, BlendFunction } from 'postprocessing'
import { EffectComposer, ASCII, Pixelation, DotScreen, Noise, Outline, Glitch, ColorAverage, ToneMapping } from '@react-three/postprocessing'
import { OrbitControls, TransformControls, useCursor, PerspectiveCamera, CameraControls, Plane, useTexture, MeshPortalMaterial } from '@react-three/drei'
import { MeshPhongMaterial } from 'three';
import useMqtt from './useMqtt'
import mqtt from 'mqtt';

//Texture
//https://github.com/pmndrs/react-three-fiber/discussions/2288

//<meshBasicMaterial>
//<canvasTexture
//  ref={textureRef} <- if you're animating the canvas, you'll need to set needsUpdate to true 
//  attach="map"
//  image={canvasRef.current} 
///>
//</meshBasicMaterial>

function App() {
  const [effect, setEffect] = useState("");
  const geom = useLoader(OBJLoader, './real-size-lq.obj');
  const ref = useRef();
  const cvs = useRef();
  const camera = useRef();
  const canvasRef = useRef(document.createElement("canvas"));
  const textureRef = useRef();
  const cameraview = { enabled: true, fullWidth: 1920, fullHeight: 1080, offsetX: 0, offsetY: 540, width: 1920, height: 1080 }
  const colorMap = useLoader(TextureLoader, "custom-textures/map-sat-rotated-3857.png");
  if (canvasRef.current.getContext) {
    const ctx = canvasRef.current.getContext("2d");

    ctx.fillStyle = "rgb(255 255 255)";
    ctx.fillRect(0, 0, 1000, 1000);

    ctx.fillStyle = "rgb(200 0 0)";
    ctx.fillRect(10, 10, 50, 50);

    ctx.fillStyle = "rgb(0 0 200 / 50%)";
    ctx.fillRect(30, 30, 50, 50);

  }
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


  const { mqttSubscribe, mqttPublish, isConnected, payload } = useMqtt();


  useEffect(() => {
    if (isConnected) {
      mqttSubscribe('#');
    }
  }, [isConnected]);

  useEffect(() => {
    if (payload.message
      && ['add', "remove", "state", "effect", "geteffect"].includes(payload.topic)
    ) {
      if (payload.topic == "effect") {
        setEffect(payload.message)
      }
      if (payload.topic == "geteffect") {
        mqttPublish('effect', effect)
      }
    }
  }, [payload]);





  return (
    <div id="canvas-container">
      <Canvas shadows={{ type: "BasicShadowMap" }}>
        {/* <ambientLight intensity={1}></ambientLight> */}
        <PerspectiveCamera makeDefault position={[1100, 0, 0]} fov={45} ref={camera} far={5000000} view={cameraview} />
        <mesh ref={ref} position={[343, -50, 160]} rotation={[0, 0, 0]} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial map={colorMap} />
          {/* <meshBasicMaterial>
            <canvasTexture
              ref={textureRef}
              attach="map"
              image={canvasRef.current}
            />
          </meshBasicMaterial> */}
        </mesh>
        {/* <pointLight castShadow position={[Math.sin(count.current), 100, Math.cos(count.current)]} intensity={100000} color="#fff" shadow-mapSize-height={512}
          shadow-mapSize-width={512} shadow-camera-far={1000} shadow-camera-near={1} /> */}
        <PointLight></PointLight>
        <Plane
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -100, 0]}
          args={[10000, 10000]}
        >
          <meshStandardMaterial attach="material" color="black" />
        </Plane>
        <EffectComposer>
          {effect === "ascii" && <ASCII></ASCII>}
          {effect === "pixel" && <Pixelation
            granularity={5} // pixel granularity
          />}
          {effect === "dot" && <DotScreen></DotScreen>}
          {effect === "glitch" && <Glitch
            delay={[1.5, 3.5]} // min and max glitch delay
            duration={[0.6, 1.0]} // min and max glitch duration
            strength={[0.1, 0.3]} // min and max glitch strength
            mode={GlitchMode.SPORADIC} // glitch mode
            active // turn on/off the effect (switches between "mode" prop and GlitchMode.DISABLED)
            ratio={0.85} // Threshold for strong glitches, 0 - no weak glitches, 1 - no strong glitches.
          />}
        </EffectComposer>
        <Controls></Controls>
      </Canvas>
      <Canvas ref={cvs}></Canvas>
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

function PointLight(props) {
  const count = useRef(0.0);
  const light = useRef();
  useFrame(() => {

    count.current = count.current + 0.01;
    light.current.position.x = 400 + Math.cos(count.current) * 300;
    light.current.position.z = Math.sin(count.current) * 300;
  })
  return (
    <pointLight castShadow position={[0, 300, 0]} intensity={1000000} color="#fff" shadow-mapSize-height={2048}
      shadow-mapSize-width={2048} shadow-camera-far={3000} shadow-camera-near={1} ref={light} />
  )
}

export default App;
