import logo from './logo.svg';
import './App.css';
import { FC, useRef, useState, useEffect, useMemo, useLayoutEffect, forwardRef } from 'react'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { GlitchMode, BlendFunction, BlurPass, Resizer, KernelSize, Resolution } from 'postprocessing'
import { EffectComposer, ASCII, Pixelation, DotScreen, Noise, Outline, Glitch, ColorAverage, ToneMapping, Bloom, BrightnessContrast } from '@react-three/postprocessing'
import { OrbitControls, TransformControls, useCursor, PerspectiveCamera, CameraControls, Plane, useTexture, MeshPortalMaterial, RenderTexture, Text } from '@react-three/drei'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshPhongMaterial, Vector2, MathUtils } from 'three';
import * as THREE from 'three';
import useMqtt from './useMqtt'
import { cvsData } from './image'
import mqtt from 'mqtt';
import ScheduleLayer from './ScheduleLayer'; // Added ScheduleLayer

import vertexShader from "!!raw-loader!./vertexShader.glsl";/* eslint import/no-webpack-loader-syntax: off */
import fragmentShader from "!!raw-loader!./shaders/clouds.glsl";/* eslint import/no-webpack-loader-syntax: off */

const SHOW_SCHEDULE_LAYER = true; // Configurable toggle

const curve1 = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-500, 200, -500),
  new THREE.Vector3(250, 300, -250),
  new THREE.Vector3(400, 150, 100),
  new THREE.Vector3(250, 200, 400),
  new THREE.Vector3(-250, 250, 500),
  new THREE.Vector3(-400, 200, 250),
], true);

const curve2 = new THREE.CatmullRomCurve3([
  new THREE.Vector3(500, 200, 500),
  new THREE.Vector3(-250, 350, 250),
  new THREE.Vector3(-400, 150, -100),
  new THREE.Vector3(-250, 200, -400),
  new THREE.Vector3(250, 250, -500),
  new THREE.Vector3(400, 200, -250),
], true);

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
  const colorMap = useLoader(TextureLoader, "custom-textures/earth-low-res.jpeg");

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
        <PointLight move={false}></PointLight>
        <ProjectorCamera makeDefault position={[500, 0, 0]} ref={camera} TR={0.25} offsetDeg={20} aspect={16 / 9} near={0.1} far={5000000} view={cameraview} />
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
        <SplineShip modelPath="spaceship.glb" curve={curve1} speed={0.05} reverse={true} rotate180={true} />
        <SplineShip modelPath="spaceship2.glb" curve={curve2} speed={0.03} offset={0.5} reverse={false} />
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
    <CameraControls ref={cameraControlsRef} azimuthAngle={-3.14159265 / 2} polarAngle={0} makeDefault />
  )
}

function SplineShip({ modelPath, curve, speed = 0.05, offset = 0, scale = 10.0, initialRotationY = Math.PI, reverse = false, rotate180 = false }) {
  const groupRef = useRef();
  const gltf = useLoader(GLTFLoader, modelPath);

  const finalRotationY = initialRotationY + (rotate180 ? Math.PI : 0);

  useFrame((state) => {
    if (!groupRef.current) return;

    let time = state.clock.elapsedTime * speed;
    if (reverse) time = -time;

    let t = (time + offset) % 1.0;
    if (t < 0) t += 1.0; // Handle negative JS modulo

    // get position and tangent
    const pos = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();

    if (reverse) {
      tangent.negate();
    }

    groupRef.current.position.copy(pos);

    // look at a point slightly ahead along the tangent
    const target = pos.clone().add(tangent);
    groupRef.current.lookAt(target);
  });

  return (
    <group ref={groupRef}>
      <primitive castShadow receiveShadow object={gltf.scene} scale={scale} rotation={[0, finalRotationY, 0]} />
    </group>
  )
}

function PointLight(props) {
  const count = useRef(0.0);
  const light = useRef();
  useFrame(() => {
    if (!props.move) return;

    count.current = count.current + 0.005;
    light.current.position.x = 400 + Math.cos(count.current) * 1000;
    light.current.position.y = Math.abs(Math.sin(count.current) * 1000) - 100;
  })
  return (
    <pointLight castShadow position={[900, 800, 400]} intensity={2000000} color="#fff" shadow-mapSize-height={2048}
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

const ProjectorCamera = forwardRef(({ TR = 0.5, offsetDeg = 10, aspect = 16 / 9, near = 0.1, far = 100.0, ...props }, ref) => {
  const localRef = useRef();

  useLayoutEffect(() => {
    if (!localRef.current) return;
    const camera = localRef.current;

    camera.updateProjectionMatrix = () => {
      const offsetRad = MathUtils.degToRad(offsetDeg);

      const widthAtNear = near / TR;
      const halfWidth = widthAtNear / 2;
      const left = -halfWidth;
      const right = halfWidth;

      const heightAtNear = widthAtNear / aspect;

      const bottom = near * Math.tan(offsetRad);
      const top = bottom + heightAtNear;

      camera.projectionMatrix.makePerspective(left, right, top, bottom, near, far);
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    };

    camera.updateProjectionMatrix();

  }, [TR, offsetDeg, aspect, near, far]);

  return <PerspectiveCamera ref={(node) => {
    localRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }} {...props} />;
});

export default App;
