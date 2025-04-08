/**
 * Referencia de Shaders - The Book of Shaders
 * 
 * Este archivo contiene funciones y técnicas comunes para shaders,
 * organizadas por categorías y con comentarios explicativos.
 * 
 * Uso: Copia y pega las funciones que necesites en tu shader.
 */

// =============================================
// FUNCIONES BÁSICAS
// =============================================

/**
 * Función para crear un círculo
 * 
 * @param {vec2} uv - Coordenadas normalizadas (0-1)
 * @param {vec2} center - Centro del círculo (0-1)
 * @param {float} radius - Radio del círculo (0-1)
 * @return {float} - 1.0 dentro del círculo, 0.0 fuera
 */
const circleFunction = `
float circle(vec2 uv, vec2 center, float radius) {
    float dist = distance(uv, center);
    return smoothstep(radius, radius - 0.01, dist);
}
`;

/**
 * Función para crear un rectángulo
 * 
 * @param {vec2} uv - Coordenadas normalizadas (0-1)
 * @param {vec2} center - Centro del rectángulo (0-1)
 * @param {vec2} size - Tamaño del rectángulo (0-1)
 * @return {float} - 1.0 dentro del rectángulo, 0.0 fuera
 */
const rectangleFunction = `
float rectangle(vec2 uv, vec2 center, vec2 size) {
    vec2 q = abs(uv - center) - size * 0.5;
    return smoothstep(0.0, 0.01, min(q.x, q.y));
}
`;

/**
 * Función para crear un patrón de líneas
 * 
 * @param {vec2} uv - Coordenadas normalizadas (0-1)
 * @param {float} scale - Escala del patrón
 * @param {float} thickness - Grosor de las líneas
 * @return {float} - 1.0 en las líneas, 0.0 fuera
 */
const linesFunction = `
float lines(vec2 uv, float scale, float thickness) {
    float line = sin(uv.x * scale) * 0.5 + 0.5;
    return smoothstep(thickness, thickness - 0.01, line);
}
`;

// =============================================
// EFECTOS DE COLOR
// =============================================

/**
 * Función para crear un gradiente
 * 
 * @param {vec2} uv - Coordenadas normalizadas (0-1)
 * @param {vec3} color1 - Color inicial
 * @param {vec3} color2 - Color final
 * @return {vec3} - Color interpolado
 */
const gradientFunction = `
vec3 gradient(vec2 uv, vec3 color1, vec3 color2) {
    return mix(color1, color2, uv.x);
}
`;

/**
 * Función para crear un degradado radial
 * 
 * @param {vec2} uv - Coordenadas normalizadas (0-1)
 * @param {vec2} center - Centro del degradado (0-1)
 * @param {vec3} color1 - Color central
 * @param {vec3} color2 - Color exterior
 * @return {vec3} - Color interpolado
 */
const radialGradientFunction = `
vec3 radialGradient(vec2 uv, vec2 center, vec3 color1, vec3 color2) {
    float dist = distance(uv, center);
    return mix(color1, color2, dist);
}
`;

// =============================================
// EFECTOS DE MOVIMIENTO
// =============================================

/**
 * Función para crear un movimiento ondulante
 * 
 * @param {vec2} uv - Coordenadas normalizadas (0-1)
 * @param {float} time - Tiempo transcurrido
 * @param {float} frequency - Frecuencia de la onda
 * @param {float} amplitude - Amplitud de la onda
 * @return {vec2} - Coordenadas desplazadas
 */
const waveDisplacementFunction = `
vec2 waveDisplacement(vec2 uv, float time, float frequency, float amplitude) {
    float wave = sin(uv.x * frequency + time) * amplitude;
    return vec2(uv.x, uv.y + wave);
}
`;

/**
 * Función para crear un efecto de zoom
 * 
 * @param {vec2} uv - Coordenadas normalizadas (0-1)
 * @param {float} time - Tiempo transcurrido
 * @param {float} speed - Velocidad del zoom
 * @return {vec2} - Coordenadas con zoom
 */
const zoomEffectFunction = `
vec2 zoomEffect(vec2 uv, float time, float speed) {
    vec2 center = vec2(0.5);
    float scale = 1.0 + sin(time * speed) * 0.2;
    return center + (uv - center) * scale;
}
`;

// =============================================
// TÉCNICAS AVANZADAS
// =============================================

/**
 * Función para crear un efecto de distorsión
 * 
 * @param {vec2} uv - Coordenadas normalizadas (0-1)
 * @param {float} time - Tiempo transcurrido
 * @param {float} strength - Fuerza de la distorsión
 * @return {vec2} - Coordenadas distorsionadas
 */
const distortionFunction = `
vec2 distortion(vec2 uv, float time, float strength) {
    float noise = sin(uv.y * 10.0 + time) * cos(uv.x * 10.0 + time);
    return uv + vec2(noise, noise) * strength;
}
`;

/**
 * Función para crear un efecto de mosaico
 * 
 * @param {vec2} uv - Coordenadas normalizadas (0-1)
 * @param {float} size - Tamaño de las celdas
 * @return {vec2} - Coordenadas con efecto mosaico
 */
const mosaicFunction = `
vec2 mosaic(vec2 uv, float size) {
    return floor(uv / size) * size + size * 0.5;
}
`;

/**
 * Función que devuelve una coordenada aleatoria
 * 
 * @param {vec2} st - Coordenadas de entrada
 * @return {float} - Valor aleatorio entre 0 y 1
 */
const randomFunction = `
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}
`;

/**
 * Función que rota una coordenada
 * 
 * @param {vec2} uv - Coordenada de entrada
 * @param {float} rotation - Ángulo de rotación
 * @param {vec2} mid - Centro de rotación
 */
const rotateFunction = `
vec2 rotate(vec2 uv, float rotation, vec2 mid)
{
  return vec2(
    cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
    cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
  );
}
`;

/**
 * Función auxiliar para el ruido de Perlin
 * 
 * @param {vec4} x - Vector de entrada
 * @return {vec4} - Vector permutado
 */
const permuteFunction = `
vec4 permute(vec4 x) {
    return mod(((x*34.0)+1.0)*x, 289.0);
}
`;

/**
 * Función auxiliar para el ruido de Perlin
 * 
 * @param {vec2} t - Vector de entrada
 * @return {vec2} - Vector con interpolación suave
 */
const fadeFunction = `
vec2 fade(vec2 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}
`;

/**
 * Implementación clásica del ruido de Perlin en 2D
 * Basado en la implementación de Stefan Gustavson
 * 
 * @param {vec2} P - Punto de entrada
 * @return {float} - Valor de ruido entre -1 y 1
 */
const perlinNoiseFunction = `
float cnoise(vec2 P) {
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x,gy.x);
    vec2 g10 = vec2(gx.y,gy.y);
    vec2 g01 = vec2(gx.z,gy.z);
    vec2 g11 = vec2(gx.w,gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 * 
        vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
}
`;

// =============================================
// EJEMPLOS DE USO
// =============================================

/**
 * Ejemplo: Círculo animado que sigue al mouse
 */
const circleExample = `
void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    
    // Crear un círculo en la posición del mouse
    float circle = circle(uv, u_mouse, 0.1);
    
    // Añadir animación
    circle *= 0.5 + 0.5 * sin(u_time * 2.0);
    
    vec3 color = vec3(circle);
    gl_FragColor = vec4(color, 1.0);
}
`;

/**
 * Ejemplo: Gradiente con distorsión
 */
const gradientExample = `
void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    
    // Aplicar distorsión
    vec2 distortedUV = distortion(uv, u_time, 0.05);
    
    // Crear gradiente
    vec3 color = gradient(distortedUV, vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0));
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// Exportar todas las funciones
export const shaderFunctions = {
    circle: circleFunction,
    rectangle: rectangleFunction,
    lines: linesFunction,
    gradient: gradientFunction,
    radialGradient: radialGradientFunction,
    waveDisplacement: waveDisplacementFunction,
    zoomEffect: zoomEffectFunction,
    distortion: distortionFunction,
    mosaic: mosaicFunction,
    random: randomFunction,
    rotate: rotateFunction,
    perlinNoise: {
        permute: permuteFunction,
        fade: fadeFunction,
        noise: perlinNoiseFunction
    },
    examples: {
        circle: circleExample,
        gradient: gradientExample
    }
}; 