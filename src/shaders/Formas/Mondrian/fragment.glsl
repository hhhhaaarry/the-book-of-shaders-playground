// Author @patriciogv - 2015
// http://patriciogonzalezvivo.com

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

varying vec2 vUv;

float drawFilledSquare(float b, float l, float t, float r, vec2 st){
    vec2 bl;
    bl.x = floor(st.x + 1.0-l);
    bl.y = floor(st.y + 1.0-b);
    float result = bl.x * bl.y;
    
    vec2 tr;
    tr.x = floor(1.0-st.x + 1.0-r);
    tr.y = floor(1.0-st.y + 1.0-t);
    
    result *= tr.x * tr.y;
    return result;
}
float drawStrokeSquare(float b, float l, float t, float r, vec2 st, float w){
    //cuadrado externo
    vec2 bl;
    vec2 tr;
    float outter;
    bl.x = step(l, st.x);
    bl.y = step(b, st.y);
    outter = bl.x * bl.y;
    
    tr.x = step(r, 1.0-st.x);
    tr.y = step(t, 1.0-st.y);
    outter *= tr.x * tr.y;
    
    //cuadrado interno
    vec2 blInner;
    vec2 trInner;
    float inner;
    blInner.x = step(l+w, st.x);
    blInner.y = step(b+w, st.y);
    inner = blInner.x * blInner.y;
    
    trInner.x = step(r+w, 1.0-st.x);
    trInner.y = step(t+w, 1.0-st.y);
    inner *= trInner.x * trInner.y;
    
    // Retornamos directamente la diferencia sin invertir
    return outter - inner;
}

void main(){
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec3 blue = vec3(0.,0.,1.0);
    vec3 yellow = vec3(1.,1.,0.);
    vec3 red = vec3(1.,0.,0.);
    
    // 1. Fondo blanco
    vec3 color = vec3(1.0);

    // 2. Rectángulos de color
    // Azul (esquina inferior derecha)
    float rect2 = drawFilledSquare(0.12, 0.72, 0.42, 0.12, st);
    color = mix(color, blue, rect2);
    
    // Amarillo (esquina superior derecha)
    float rect3 = drawFilledSquare(0.72, 0.42, 0.12, 0.12, st);
    color = mix(color, yellow, rect3);
    
    // Azul pequeño (centro)
    float rect4 = drawFilledSquare(0.42, 0.42, 0.42, 0.42, st);
    color = mix(color, blue, rect4);
    
    // Rojo pequeño (abajo izquierda)
    float rect5 = drawFilledSquare(0.12, 0.12, 0.42, 0.72, st);
    color = mix(color, red, rect5);
        float borders = drawStrokeSquare(0.1, 0.1, 0.1, 0.1, st, 0.02); // Borde exterior
    borders += drawStrokeSquare(0.1, 0.4, 0.1, 0.4, st, 0.02);  // Línea vertical central
    borders += drawStrokeSquare(0.1, 0.7, 0.1, 0.1, st, 0.02);  // Línea vertical derecha
    borders += drawStrokeSquare(0.4, 0.1, 0.4, 0.1, st, 0.02);  // Línea horizontal central
    borders += drawStrokeSquare(0.7, 0.1, 0.1, 0.1, st, 0.02);  // Línea horizontal superior
    color *= (1.0 - borders);

    gl_FragColor = vec4(color, 1.0);
}
