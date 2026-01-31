import proj4 from 'proj4';

// Constants derived from user input
// Top Left: -264649.038, 6808204.255
// Bottom Right: -264564.9921, 6807021.3314
// Center calculation:
// X: (-264649.038 + -264564.9921) / 2 = -264607.015
// Y: (6808204.255 + 6807021.3314) / 2 = 6807612.793
const MAP_CENTER_3857 = { x: -264607.015, y: 6807612.793 };
//-264576.628, 6807648.420
// User specified rotation: -25 degrees
const MAP_ROTATION_DEG = 25;
const MAP_ROTATION_RAD = MAP_ROTATION_DEG * (Math.PI / 180);

//Map is 750 units wide, map real scale is 355m, 
const MAP_SCALE = 1.3;

// From App.js mesh position: [343, -50, 160]
const MAP_OFFSET_THREEJS = { x: 343, y: -50, z: 0 };

export const latLonToWorld = (lat, lon) => {
    // 1. Convert Lat/Lon to EPSG:3857
    const [x3857, y3857] = proj4('EPSG:4326', 'EPSG:3857', [lon, lat]);

    // 2. Translate to map center relative coordinates
    const dx = x3857 - MAP_CENTER_3857.x;
    const dy = y3857 - MAP_CENTER_3857.y;

    // 3. Rotate coordinates
    // Assuming the map geometry is rotated by -25 degrees relative to North-Up
    const cosA = Math.cos(MAP_ROTATION_RAD);
    const sinA = Math.sin(MAP_ROTATION_RAD);

    // Standard 2D rotation
    const xRot = dx * cosA - dy * sinA;
    const yRot = dx * sinA + dy * cosA;

    // 4. Map to Three.js World Coordinates
    // X -> X
    // Y (North) -> -Z (In Three.js, usually -Z is forward/North if Y is up)
    // Add the mesh offset
    const worldX = xRot + MAP_OFFSET_THREEJS.x;
    const worldZ = -yRot + MAP_OFFSET_THREEJS.z;
    const worldY = MAP_OFFSET_THREEJS.y + 50; // Slightly above the map plane

    return [worldX * MAP_SCALE, worldY, worldZ * MAP_SCALE];
};
