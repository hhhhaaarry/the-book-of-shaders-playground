#define PI 3.14159265359
#define TWO_PI 6.28318530718

// Forma personalizada usando SDF (Signed Distance Field)
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

// Operaciones SDF básicas
float opUnion(float d1, float d2) { return min(d1, d2); }
float opIntersection(float d1, float d2) { return max(d1, d2); }
float opSubtraction(float d1, float d2) { return max(-d1, d2); }

// Forma personalizada: estrella con agujero
float formaPersonalizada(vec2 p) {
    float radio = 0.3;
    float angulo = atan(p.y, p.x);
    float r = length(p);
    
    // Estrella de 5 puntas
    float estrella = r - radio * (1.0 + 0.5 * sin(5.0 * angulo + u_time));
    
    // Círculo central (agujero)
    float circulo = length(p) - 0.15;
    
    // Combinar formas
    return opSubtraction(circulo, estrella);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st = st * 2.0 - 1.0; // Centrar en 0,0
    st.x *= u_resolution.x/u_resolution.y; // Corregir aspecto
    
    float d = formaPersonalizada(st);
    vec3 color = vec3(1.0 - smoothstep(-0.01, 0.01, d));
    
    gl_FragColor = vec4(color, 1.0);
} 