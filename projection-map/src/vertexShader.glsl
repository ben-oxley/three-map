varying vec2 vUv;
varying float vZ;

void main() {
  vUv = uv;
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  vZ = modelPosition.y;
  gl_Position = projectedPosition;
}
