precision mediump float;

uniform float u_time;

// No necesitamos declarar position ni uv ya que THREE.js los proporciona
varying vec2 vUv;

void main() {
    // Crear una ondulación basada en el tiempo
    vec3 pos = position;
    
    // Modificar la posición Y usando una onda sinusoidal
    float amplitude = 0.2; // Altura de la onda
    float frequency = 3.0; // Frecuencia de la onda
    float wave = sin(pos.x * frequency + u_time) * amplitude;
    
    pos.y += wave;
    
    // Pasar las coordenadas UV al fragment shader
    vUv = uv;
    
    // Aplicar las transformaciones
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}