#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

void main() {
    // Normalizar las coordenadas del fragmento
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    
    // Crear un patrón de ondas
    float wave = sin(uv.x * 10.0 + u_time) * 0.5 + 0.5;
    wave *= sin(uv.y * 10.0 + u_time * 0.5) * 0.5 + 0.5;
    
    // Añadir interacción con el mouse
    float mouseDist = distance(uv, u_mouse);
    float mouseInfluence = smoothstep(0.3, 0.0, mouseDist);
    
    // Mezclar el patrón con la influencia del mouse
    float pattern = mix(wave, 1.0 - wave, mouseInfluence);
    
    // Crear un color basado en el patrón
    vec3 color = vec3(pattern);
    
    // Añadir un tinte basado en la posición
    color += vec3(uv.x, uv.y, sin(u_time) * 0.5 + 0.5) * 0.3;
    
    gl_FragColor = vec4(color, 1.0);
} 