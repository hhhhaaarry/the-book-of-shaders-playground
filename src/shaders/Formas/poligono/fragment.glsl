// Polígono regular con número de lados variable
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float poligono(vec2 st, float lados, float radio) {
    // Ángulo y distancia desde el centro
    float angulo = atan(st.y, st.x) + PI;
    float radio_st = length(st);
    
    // Ángulo para cada segmento
    float segmento = TWO_PI / lados;
    
    // Calcular distancia al borde más cercano
    float a = mod(angulo, segmento) - segmento * 0.5;
    float r = radio * cos(a) / cos(segmento * 0.5);
    
    return 1.0 - smoothstep(r - 0.01, r + 0.01, radio_st);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st = st * 2.0 - 1.0; // Centrar en 0,0
    st.x *= u_resolution.x/u_resolution.y; // Corregir aspecto
    
    // Número de lados animado (entre 3 y 8)
    float lados = floor(3.5 + sin(u_time) * 2.5);
    
    vec3 color = vec3(poligono(st, lados, 0.5));
    
    gl_FragColor = vec4(color, 1.0);
} 