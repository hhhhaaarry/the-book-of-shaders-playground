#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535897932384626433

uniform vec2 u_resolution;
uniform vec2 u_mouse;  // Ahora en rango -1 a 1
uniform float u_time;
varying vec2 vUv;

void main() {
    // Para usar u_mouse con coordenadas UV (0 a 1), convertimos de vuelta:
    vec2 mouse_uv = (u_mouse + 1.0) * 0.5;

    // Ahora podemos usar mouse_uv para comparar con vUv
    float mouseDist = distance(vUv, mouse_uv);

    // Normalizar las coordenadas del fragmento (st =  canvas; uv = del plano)
    // vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec2 uv = vUv;

    // Crear un patrón de ondas
    float wave = sin(uv.x * 10.0 + u_time) * 0.5 + 0.5;
    wave *= sin(uv.y * 10.0 + u_time * 0.5) * 0.5 + 0.5;

    // Añadir interacción con el mouse
    float mouseInfluence = smoothstep(0.3, 0.0, mouseDist);

    // Mezclar el patrón con la influencia del mouse
    float pattern = mix(wave, 1.0 - wave, mouseInfluence);

    // Crear un color basado en el patrón
    vec3 color = vec3(pattern);

    // Añadir un tinte basado en la posición
    color += vec3(uv.x, uv.y, sin(u_time) * 0.5 + 0.5) * 0.3;

    gl_FragColor = vec4(color, 1.0);
}