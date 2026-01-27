//Waves pattern
varying vec2 vUv;
uniform float u_time;

vec3 colorA = vec3(0.0, 0.05, 0.2);
vec3 colorB = vec3(0.0,0.0,0.8);
varying float vZ;


void main() {
  vec3 color = mix(colorA, colorB, mod(sin(u_time/20.0)*vZ/10.0,1.0));
  gl_FragColor = vec4(color, 1.0);
}
