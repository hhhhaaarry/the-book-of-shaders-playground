#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535897932384626433

uniform vec2 u_resolution;
uniform vec2 u_mouse;  // Ahora en rango -1 a 1
uniform float u_time;
varying vec2 vUv;

//usamos varyings para no tener que crear nuevas uniforms en el material
varying float vBigWavesElevation;
varying vec2 vBigWavesFrequency;
varying float vBigWavesSpeed;

varying vec3 vDepthColor;
varying vec3 vSurfaceColor;
varying float vColorOffset;
varying float vColorMultiplier;

varying float vElevation;

void main() {
    float mixStrength = (vElevation + vColorOffset) * vColorMultiplier;
  
    vec3 color = mix(vDepthColor, vSurfaceColor, mixStrength);

    gl_FragColor = vec4(color, 1.0);
}