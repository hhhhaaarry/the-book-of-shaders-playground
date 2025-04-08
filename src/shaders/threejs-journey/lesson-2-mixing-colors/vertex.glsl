precision mediump float;
uniform float u_time;
varying vec2 vUv;

void main() {
    // Crear una ondulación basada en el tiempo
    vec3 pos = position;

    // Pasar las coordenadas UV al fragment shader
    vUv = uv;
    
    // Aplicar las transformaciones
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
} 