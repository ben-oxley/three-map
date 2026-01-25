import './style.css';
import * as THREE from 'three';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510); // Very dark blue/black
// Add some fog for depth
scene.fog = new THREE.FogExp2(0x050510, 0.002);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Position camera to view the hands
// Leap coordinates: Y is up, X is right, Z is towards user (positive) / away (negative)? 
// Standard Leap: Right handed. Y vertical. Z positive towards user. Origin at device center.
// We'll position camera a bit back and up.
camera.position.set(0, 0.4, 0.8);
camera.lookAt(0, 0.2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// --- Lighting ---
// Ambient light for base visibility
const ambientLight = new THREE.AmbientLight(0x222222);
scene.add(ambientLight);

// --- Geometry & Materials ---
// Ball of light: MeshStandardMaterial with emissive property + PointLight
const handGeometry = new THREE.SphereGeometry(0.04, 32, 32);
const handMaterial = new THREE.MeshStandardMaterial({
  color: 0xffaa00,
  emissive: 0xff5500,
  emissiveIntensity: 2,
  roughness: 0.1,
  metalness: 0.1
});

// Cache for hand meshes
// Map<HandId, Mesh>
const handsMap = new Map();

// Helper to create a hand mesh group (mesh + light)
function createHandMesh(id, type) {
  const group = new THREE.Group();

  const mesh = new THREE.Mesh(handGeometry, handMaterial.clone());
  // Adjust color based on hand type if desired
  if (type === 'left') {
    mesh.material.color.setHex(0x00aaff);
    mesh.material.emissive.setHex(0x0044aa);
  } else {
    mesh.material.color.setHex(0xffaa00);
    mesh.material.emissive.setHex(0xff5500);
  }

  group.add(mesh);

  const light = new THREE.PointLight(mesh.material.color, 2, 2);
  group.add(light);

  scene.add(group);
  return group;
}

// Axis Helper to see where 0,0,0 is
const axesHelper = new THREE.AxesHelper(0.1);
scene.add(axesHelper);

// --- WebSocket Handling ---
const wsParams = {
  reconnectInterval: 1000,
  url: 'ws://localhost:8765'
};

function connectWebSocket() {
  console.log('Connecting to WebSocket...');
  const ws = new WebSocket(wsParams.url);

  ws.onopen = () => {
    console.log('Connected to Leap Server');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleTrackingData(data);
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  };

  ws.onclose = () => {
    console.log('Disconnected. Reconnecting in 1s...');
    setTimeout(connectWebSocket, wsParams.reconnectInterval);
  };

  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
    ws.close();
  };
}

// Data Handling
// Scale mm to meters (Three.js standard unit is usually meters)
// Leap coordinates are in mm.
const SCALE = 0.001;

function handleTrackingData(frame) {
  // Current frame hand IDs
  const currentHandIds = new Set();

  if (frame.hands && Array.isArray(frame.hands)) {
    frame.hands.forEach(handData => {
      currentHandIds.add(handData.id);

      let handGroup = handsMap.get(handData.id);

      if (!handGroup) {
        // Create new
        handGroup = createHandMesh(handData.id, handData.type);
        handsMap.set(handData.id, handGroup);
      }

      // Update position
      // Leap: X=right, Y=up, Z=towards user
      // Three: X=right, Y=up, Z=towards user (typically)
      // But verify coordinate scaling. 
      // If we use y as up, and z as depth, it matches.

      handGroup.position.set(
        handData.palm_position.x * SCALE,
        handData.palm_position.y * SCALE,
        handData.palm_position.z * SCALE
      );
    });
  }

  // cleanup removed hands
  for (const [id, group] of handsMap) {
    if (!currentHandIds.has(id)) {
      scene.remove(group);
      handsMap.delete(id);
    }
  }
}

connectWebSocket();

// --- Resize Handling ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Optional: Add some subtle idle movement or pulsation to lights

  renderer.render(scene, camera);
}

animate();
