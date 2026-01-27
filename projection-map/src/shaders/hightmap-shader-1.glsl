varying vec2 vUv;
uniform float u_time;

vec3 colorA = vec3(0.912,0.191,0.652);
vec3 colorB = vec3(1.000,0.777,0.052);
varying float vZ;


void main() {
  vec3 color = mix(colorA, colorB, sin(u_time)*vZ*0.15); 
  gl_FragColor = vec4(color, 1.0);
}
