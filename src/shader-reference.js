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
function circle(uv, center, radius) {
    float dist = distance(uv, center);
    return smoothstep(radius, radius - 0.01, dist);
}

/**
 * Función para crear un rectángulo
 * 
 * @param {vec2} uv - Coordenadas normalizadas (0-1)
 * @param {vec2} center - Centro del rectángulo (0-1)
 * @param {vec2} size - Tamaño del rectángulo (0-1)
 * @return {float} - 1.0 dentro del rectángulo, 0.0 fuera
 */
function rectangle(uv, center, size) {
    vec2 q = abs(uv - center) - size * 0.5;
    return smoothstep(0.0, 0.01, min(q.x, q.y));
}

/**
 * Función para crear un patrón de líneas
 * 
 * @param {vec2} uv - Coordenadas normalizadas (0-1)
 * @param {float} scale - Escala del patrón
 * @param {float} thickness - Grosor de las líneas
 * @return {float} - 1.0 en las líneas, 0.0 fuera
 */
function lines(uv, scale, thickness) {
    float line = sin(uv.x * scale) * 0.5 + 0.5;
    return smoothstep(thickness, thickness - 0.01, line);
}

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
function gradient(uv, color1, color2) {
    return mix(color1, color2, uv.x);
}

/**
 * Función para crear un degradado radial
 * 
 * @param {vec2} uv - Coordenadas normalizadas (0-1)
 * @param {vec2} center - Centro del degradado (0-1)
 * @param {vec3} color1 - Color central
 * @param {vec3} color2 - Color exterior
 * @return {vec3} - Color interpolado
 */
function radialGradient(uv, center, color1, color2) {
    float dist = distance(uv, center);
    return mix(color1, color2, dist);
}

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
function waveDisplacement(uv, time, frequency, amplitude) {
    float wave = sin(uv.x * frequency + time) * amplitude;
    return vec2(uv.x, uv.y + wave);
}

/**
 * Función para crear un efecto de zoom
 * 
 * @param {vec2} uv - Coordenadas normalizadas (0-1)
 * @param {float} time - Tiempo transcurrido
 * @param {float} speed - Velocidad del zoom
 * @return {vec2} - Coordenadas con zoom
 */
function zoomEffect(uv, time, speed) {
    vec2 center = vec2(0.5);
    float scale = 1.0 + sin(time * speed) * 0.2;
    return center + (uv - center) * scale;
}

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
function distortion(uv, time, strength) {
    float noise = sin(uv.y * 10.0 + time) * cos(uv.x * 10.0 + time);
    return uv + vec2(noise, noise) * strength;
}

/**
 * Función para crear un efecto de mosaico
 * 
 * @param {vec2} uv - Coordenadas normalizadas (0-1)
 * @param {float} size - Tamaño de las celdas
 * @return {vec2} - Coordenadas con efecto mosaico
 */
function mosaic(uv, size) {
    return floor(uv / size) * size + size * 0.5;
}

// =============================================
// EJEMPLOS DE USO
// =============================================

/**
 * Ejemplo: Círculo animado que sigue al mouse
 * 
 * void main() {
 *     vec2 uv = gl_FragCoord.xy/u_resolution.xy;
 *     
 *     // Crear un círculo en la posición del mouse
 *     float circle = circle(uv, u_mouse, 0.1);
 *     
 *     // Añadir animación
 *     circle *= 0.5 + 0.5 * sin(u_time * 2.0);
 *     
 *     vec3 color = vec3(circle);
 *     gl_FragColor = vec4(color, 1.0);
 * }
 */

/**
 * Ejemplo: Gradiente con distorsión
 * 
 * void main() {
 *     vec2 uv = gl_FragCoord.xy/u_resolution.xy;
 *     
 *     // Aplicar distorsión
 *     vec2 distortedUV = distortion(uv, u_time, 0.05);
 *     
 *     // Crear gradiente
 *     vec3 color = gradient(distortedUV, vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0));
 *     
 *     gl_FragColor = vec4(color, 1.0);
 * }
 */ 