import logo from './logo.svg';
import './App.css';
import { FC, useRef, useState, useEffect, useMemo } from 'react'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { GlitchMode, BlendFunction, BlurPass, Resizer, KernelSize, Resolution } from 'postprocessing'
import { EffectComposer, ASCII, Pixelation, DotScreen, Noise, Outline, Glitch, ColorAverage, ToneMapping, Bloom, BrightnessContrast } from '@react-three/postprocessing'
import { OrbitControls, TransformControls, useCursor, PerspectiveCamera, CameraControls, Plane, useTexture, MeshPortalMaterial, RenderTexture, Text } from '@react-three/drei'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshPhongMaterial, Vector2 } from 'three';
import useMqtt from './useMqtt'
import { cvsData } from './image'
import mqtt from 'mqtt';
import ScheduleLayer from './ScheduleLayer'; // Added ScheduleLayer

import vertexShader from "!!raw-loader!./vertexShader.glsl";/* eslint import/no-webpack-loader-syntax: off */
import fragmentShader from "!!raw-loader!./shaders/clouds.glsl";/* eslint import/no-webpack-loader-syntax: off */

const SHOW_SCHEDULE_LAYER = true; // Configurable toggle

//Texture


//Texture
//https://github.com/pmndrs/react-three-fiber/discussions/2288

//<meshBasicMaterial>
//<canvasTexture
//  ref={textureRef} <- if you're animating the canvas, you'll need to set needsUpdate to true 
//  attach="map"
//  image={canvasRef.current} 
///>
//</meshBasicMaterial>
// Map set to #17.13/52.041397/-2.37697
function App() {
  const [effect, setEffect] = useState("");
  const geom = useLoader(OBJLoader, './real-size-lq.obj');
  const ref = useRef();
  const camera = useRef();
  const cameraview = { enabled: true, fullWidth: 1920, fullHeight: 1080, offsetX: 0, offsetY: 540, width: 1920, height: 1080 }
  const colorMap = useLoader(TextureLoader, "custom-textures/gemini-mars.png");

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
      <Canvas shadows={{ type: "BasicShadowMap" }} gl={{ preserveDrawingBuffer: true }}>
        <ambientLight intensity={0.3}></ambientLight>
        <PointLight></PointLight>
        <PerspectiveCamera makeDefault position={[1000, 0, 0]} fov={45} ref={camera} far={5000000} view={cameraview} />
        <Text font="Inter-Medium.woff" position={[300, 300, 500]} rotation={[-Math.PI / 2, 0, 0]} fontSize={40} letterSpacing={-0.1} color={'#35c19f'}>
          Stage A
        </Text>
        <mesh ref={ref} position={[343, -50, 160]} rotation={[0, 0, 0]} geometry={geometry} castShadow receiveShadow>
          <RenderTexture></RenderTexture>
          <meshStandardMaterial map={colorMap} />
          {/* <MovingPlane></MovingPlane> */}
          {/* {effect == "shader" ? <MovingPlane></MovingPlane> : <meshStandardMaterial wireframe={effect === "wireframe"} emissiveIntensity={2} toneMapped={false}>
            <MapCanvas></MapCanvas>
          </meshStandardMaterial>} */}
        </mesh>

        {/* EMF Schedule Layer */}
        <ScheduleLayer visible={SHOW_SCHEDULE_LAYER} />

        {/* <pointLight castShadow position={[Math.sin(count.current), 100, Math.cos(count.current)]} intensity={100000} color="#fff" shadow-mapSize-height={512}
          shadow-mapSize-width={512} shadow-camera-far={1000} shadow-camera-near={1} /> */}
        <FlyingShip></FlyingShip>
        <FlyingShip2></FlyingShip2>
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
          {effect === "bloom" && <Bloom
            intensity={5.0} // The bloom intensity.
            blurPass={undefined} // A blur pass.
            kernelSize={KernelSize.LARGE} // blur kernel size
            luminanceThreshold={0.2} // luminance threshold. Raise this value to mask out darker elements in the scene.
            luminanceSmoothing={0.025} // smoothness of the luminance threshold. Range is [0, 1]
            mipmapBlur={false} // Enables or disables mipmap blur.
            resolutionX={Resolution.AUTO_SIZE} // The horizontal resolution.
            resolutionY={Resolution.AUTO_SIZE} // The vertical resolution.
          />}
          <BrightnessContrast
            brightness={0} // brightness. min: -1, max: 1
            contrast={0.5} // contrast: min -1, max: 1
          />
        </EffectComposer>
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

function FlyingShip() {
  const ref = useRef();
  const count = useRef(0.0);
  const gltf = useLoader(GLTFLoader, "spaceship.glb")

  useFrame(() => {
    count.current = count.current + 0.005;
    ref.current.position.z = 1000 - ((count.current * 1000) % 2000);
    ref.current.rotation.z = Math.sin(count.current * 10) / 10;
    ref.current.position.y = 200;
    ref.current.rotation.y = Math.PI;
    if (ref.current.position.z <= -990) {
      ref.current.position.x = Math.random() * 750;
    }
  })
  return (
    <primitive castShadow receiveShadow object={gltf.scene} scale={10.0} ref={ref} />
  )
}


function FlyingShip2() {
  const ref = useRef();
  const count = useRef(0.0);
  const gltf = useLoader(GLTFLoader, "spaceship2.glb")

  useFrame(() => {
    count.current = count.current + 0.005;
    ref.current.position.z = ((count.current * 327) % 2000) - 1000;
    ref.current.rotation.z = Math.sin(count.current * 10) / 10;
    ref.current.position.y = 200;
    if (ref.current.position.z <= -990) {
      ref.current.position.x = Math.random() * 750;
    }
  })
  return (
    <primitive castShadow receiveShadow object={gltf.scene} scale={10.0} ref={ref} />
  )
}

function PointLight(props) {
  const count = useRef(0.0);
  const light = useRef();
  useFrame(() => {

    count.current = count.current + 0.005;
    light.current.position.x = 400 + Math.cos(count.current) * 1000;
    light.current.position.y = Math.abs(Math.sin(count.current) * 1000) - 100;
  })
  return (
    <pointLight castShadow position={[0, 300, 0]} intensity={2000000} color="#fff" shadow-mapSize-height={2048}
      shadow-mapSize-width={2048} shadow-camera-far={3000} shadow-camera-near={1} ref={light} />
  )
}

function Screen({ children }) {
  return (
    <meshBasicMaterial toneMapped={false} scale={1000.0}>
      <RenderTexture width={512} height={512} attach="map" anisotropy={16}>
        {children}
      </RenderTexture>
    </meshBasicMaterial>
  )
}

function ScreenText({ invert, x = 0, y = 1.2, ...props }) {
  const textRef = useRef()
  const rand = Math.random() * 10000
  useFrame((state) => (textRef.current.position.x = x + Math.sin(rand + state.clock.elapsedTime / 4) * 8))
  return (
    <Screen {...props}>
      <PerspectiveCamera makeDefault manual aspect={1 / 1} position={[0, 0, 15]} />
      <color attach="background" args={[invert ? 'black' : '#35c19f']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />

    </Screen>
  )
}

const MovingPlane = () => {
  // This reference will give us direct access to the mesh
  const material = useRef();

  const uniforms = useMemo(
    () => ({
      u_time: {
        value: 0.0,
      },
      u_resolution: {
        value: [1920, 1080],
      },
    }), []
  );

  useFrame((state) => {
    const { clock } = state;
    material.current.uniforms.u_time.value = clock.getElapsedTime();
  });

  return (

    <shaderMaterial ref={material}
      fragmentShader={fragmentShader}
      vertexShader={vertexShader}
      uniforms={uniforms}
      wireframe={false}
    />
  );
};

function MapCanvas(props) {

  const [count, setCount] = useState(0);
  const [prevCount, setPrevCount] = useState(0);
  const canvasRef = useRef(document.createElement("canvas"));
  const textureRef = useRef();

  if (canvasRef.current.getContext) {
    const ctx = canvasRef.current.getContext("2d");
    if (ctx.canvas.width != 1080) ctx.canvas.width = 1080;
    if (ctx.canvas.height != 1920) ctx.canvas.height = 1920;

  }

  useEffect(() => {
    //Implementing the setInterval method
    const interval = setInterval(() => {
      setCount(count + 1);
    }, 250);

    //Clearing the interval
    return () => clearInterval(interval);
  }, [count]);

  useFrame(({ clock }) => {
    if (prevCount != count) {
      if (canvasRef.current.getContext) {
        const ctx = canvasRef.current.getContext("2d");

        if (textureRef.current) {
          textureRef.current.needsUpdate = true;
        }
        var img = new Image;
        img.onload = function () {
          ctx.drawImage(img, 0, 0); // Or at whatever offset you like
        };
        img.crossOrigin = "Anonymous";
        img.src = `http://localhost:3000/map.png?t=${Date.now()}`;

      }
      setPrevCount(count);
    }
  });

  return (
    <canvasTexture
      ref={textureRef}
      attach="map"
      image={canvasRef.current}
      repeat={new Vector2(1, 1)}
    />
  )
}

export default App;
