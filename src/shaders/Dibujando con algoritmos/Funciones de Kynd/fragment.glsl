#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float plot(vec2 st, float pct){
  return  smoothstep( pct-0.02, pct, st.y) -
          smoothstep( pct, pct+0.02, st.y);
}
float kynd1(vec2 st, float pct){
  return 1.0 - pow(abs(st.x),pct);
}
float kynd2(vec2 st, float pct){
  return pow(cos(PI*st.x/2.0), pct);
}
float kynd3(vec2 st, float pct){
  return 1.0 - pow(abs(sin(PI*st.x/2.0)), pct);
}
float kynd4(vec2 st, float pct){
  return pow(min(cos(PI*st.x/2.0), 1.0 -abs(st.x)), pct);
}
float kynd5(vec2 st, float pct){
  return 1.0-pow(max(0.0, abs(st.x)*2.0-1.0), pct);
}
void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    float y = 0.;
  
    // Uncomment to change between different form functions
    y = kynd1(st, 0.5);
    // y = kynd2(st, 0.5);
    // y = kynd3(st, 0.5);
    // y = kynd4(st, 0.5);
    // y = kynd5(st, 0.5);

    vec3 color = vec3(y);

    float pct = plot(st,y);
    color = (1.0-pct)*color+pct*vec3(0.0,1.0,0.0);

    gl_FragColor = vec4(color,1.0);
}
