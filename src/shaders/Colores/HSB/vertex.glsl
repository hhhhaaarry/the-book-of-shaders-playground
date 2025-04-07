precision mediump float;

uniform float u_time;

// No necesitamos declarar estos atributos ya que THREE.js los proporciona
// attribute vec3 position;  <- ELIMINAR
// attribute vec2 uv;       <- ELIMINAR

varying vec2 vUv;

void main() {
    // Crear una ondulación basada en el tiempo
    vec3 pos = position;  // position ya está disponible
    
    // Pasar las coordenadas UV al fragment shader
    vUv = uv;  // uv ya está disponible
    
    // Aplicar las transformaciones
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
} 