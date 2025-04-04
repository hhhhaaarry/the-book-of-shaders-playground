// Triángulo con bordes redondeados
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float sdf_triangulo(vec2 p, float r) {
    const float k = sqrt(3.0);
    p.x = abs(p.x) - 1.0;
    p.y = p.y + 1.0/k;
    if(p.x + k*p.y > 0.0) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
    p.x -= clamp(p.x, -2.0, 0.0);
    return -length(p)*sign(p.y);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st = st * 2.0 - 1.0; // Centrar en 0,0
    st.x *= u_resolution.x/u_resolution.y; // Corregir aspecto
    
    // Rotar y escalar
    float angle = u_time;
    vec2 p = vec2(st.x * cos(angle) - st.y * sin(angle),
                  st.x * sin(angle) + st.y * cos(angle));
    p *= 2.0;
    
    float d = sdf_triangulo(p, 0.1);
    vec3 color = vec3(1.0 - smoothstep(0.0, 0.01, d));
    
    gl_FragColor = vec4(color, 1.0);
} 