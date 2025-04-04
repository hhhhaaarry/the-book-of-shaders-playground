uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

void main() {
    // Obtener coordenadas normalizadas (0 a 1)
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    
    // Crear un círculo en la posición del mouse
    float dist = distance(uv, u_mouse);
    float circle = smoothstep(0.1, 0.09, dist);
    
    // Añadir animación
    circle *= 0.5 + 0.5 * sin(u_time * 2.0);
    
    vec3 color = vec3(circle);
    gl_FragColor = vec4(color, 1.0);
} 