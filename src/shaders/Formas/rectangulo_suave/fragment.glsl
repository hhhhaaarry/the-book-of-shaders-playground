// Rectángulo con bordes suavizados
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float rectanguloSuave(vec2 st, vec2 pos, vec2 size, float suavizado) {
    vec2 borde = smoothstep(pos - size/2.0 - suavizado,
                           pos - size/2.0 + suavizado,
                           st);
    borde *= smoothstep(pos + size/2.0 + suavizado,
                       pos + size/2.0 - suavizado,
                       st);
    return borde.x * borde.y;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    
    // Tamaño animado del rectángulo
    vec2 size = vec2(0.3 + sin(u_time) * 0.1, 0.4);
    float suavizado = 0.01;
    
    vec3 color = vec3(0.0);
    float forma = rectanguloSuave(st, vec2(0.5), size, suavizado);
    color = vec3(forma);
    
    gl_FragColor = vec4(color, 1.0);
} 