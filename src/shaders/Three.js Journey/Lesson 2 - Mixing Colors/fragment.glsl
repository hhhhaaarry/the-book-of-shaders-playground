#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535897932384626433

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

varying vec2 vUv;

//	Classic Perlin 2D Noise 
//	by Stefan Gustavson (https://github.com/stegu/webgl-noise)
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
float cnoise(vec2 P){
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




float random (in vec2 st)
{
  return fract(sin(dot(st.xy, vec2(12.9898, 78233)))* 43758.5453123);
}

vec2 rotate(vec2 uv, float rotation, vec2 mid)
{
  return vec2(
    cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
    cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
  );
}

void main() {
    vec3 color = vec3(0.5);
    float strength = 0.5;
  //Pattern 1
    // color = vec3(vUv.x, vUv.y, 1.0);
  
  //Pattern 2
    // color = vec3(vUv.x, vUv.y, 0.0);
  
  //Pattern 3
    // strength = vUv.x;
    // color = vec3(strength, strength, strength);
  
  //Pattern 4
    // strength = vUv.y;
    // color = vec3(strength, strength, strength);
  
  //Pattern 5
    // strength = 1.0-vUv.y;
    // color = vec3(strength, strength, strength);
  
  //Pattern 6
    // strength = vUv.y*10.;
    // color = vec3(strength, strength, strength);
  
  //Pattern 6
    // strength = vUv.y*10.;
    // color = vec3(strength, strength, strength);
  
  //Pattern 7
    // strength = mod(vUv.y*10., 1.0);
    // color = vec3(strength, strength, strength);
  
  //Pattern 8
    // strength = mod(vUv.y*10., 1.0);
    // strength = step(0.5, strength);
    // color = vec3(strength, strength, strength);
  
  //Pattern 9
    // strength = mod(vUv.y*10., 1.0);
    // strength = step(0.8, strength);
    // color = vec3(strength, strength, strength);
  
  //Pattern 10
    // strength = mod(vUv.x*10., 1.0);
    // strength = step(0.8, strength);
    // color = vec3(strength, strength, strength);
  
  //Pattern 11
    // strength = step(0.8, mod(vUv.x*10., 1.0));
    // strength += step(0.8, mod(vUv.y*10., 1.0));
    // color = vec3(strength, strength, strength);
  
  //Pattern 12
    // strength = step(0.8, mod(vUv.x*10., 1.0));
    // strength *= step(0.8, mod(vUv.y*10., 1.0));
    // color = vec3(strength, strength, strength);

  //Pattern 13
    // strength = step(0.4, mod(vUv.x*10., 1.0));
    // strength *= step(0.8, mod(vUv.y*10., 1.0));
    // color = vec3(strength, strength, strength);

  //Pattern 14
    float barX = 0.;
    float barY = 0.;
    barX = step(0.4, mod(vUv.x*10., 1.0));
    barX *= step(0.8, mod(vUv.y*10., 1.0));
    barY = step(0.4, mod(vUv.y*10., 1.0));
    barY *= step(0.8, mod(vUv.x*10., 1.0));
    strength = barX+barY;
    color = vec3(strength, strength, strength);

  //Pattern 15
    // float barX = step(0.4, mod(vUv.x*10., 1.0));
    // barX *= step(0.8, mod(vUv.y*10.+0.2, 1.0));
    // float barY = step(0.4, mod(vUv.y*10., 1.0));
    // barY *= step(0.8, mod(vUv.x*10.+0.2, 1.0));
    // strength = barX+barY;
    // color = vec3(strength, strength, strength);

  //Pattern 16
    // strength = abs(vUv.x-0.5);
    // color = vec3(strength, strength, strength);

  //Pattern 17
    // strength = min(abs(vUv.x-0.5), abs(vUv.y-0.5));
    // color = vec3(strength, strength, strength);

  //Pattern 18
    // strength = max(abs(vUv.x-0.5), abs(vUv.y-0.5));
    // color = vec3(strength, strength, strength);

  //Pattern 19
    // strength = step(0.2, max(abs(vUv.x-0.5), abs(vUv.y-0.5)));
    // color = vec3(strength, strength, strength);
  
  //Pattern 20
    // strength =  step(0.2, max(abs(vUv.x-0.5), abs(vUv.y-0.5)));
    // strength *=  1.0 - step(0.25, max(abs(vUv.x-0.5), abs(vUv.y-0.5)));
    // color = vec3(strength, strength, strength);

  //Pattern 21
    // strength =  floor(vUv.x*10.)/10.;
    // color = vec3(strength, strength, strength);

  //Pattern 22
    // strength =  floor(vUv.x*10.)/10.;
    // strength *= floor(vUv.y*10.)/10.;
    // color = vec3(strength, strength, strength);

  //Pattern 23
    // strength = random(vUv);
    // color = vec3(strength, strength, strength);

  //Pattern 24
    // vec2 gridUV = vec2(floor(vUv.x*10.)/10., floor(vUv.y*10.)/10.);
    // strength = random(gridUV);
    // color = vec3(strength, strength, strength);

  //Pattern 25
    // vec2 gridUV = vec2(
    //   floor(vUv.x*10.)/10.,
    //   floor((vUv.y+vUv.x*0.5)*10.)/10.
    // );
    // strength = random(gridUV);
    // color = vec3(strength, strength, strength);

  //Pattern 26
    // strength = length(vUv);
    // color = vec3(strength, strength, strength);

  //Pattern 27
    // strength = length(vUv-0.5);
    // // strength = distance(vUv,vec2(0.8,0.2));
    // color = vec3(strength, strength, strength);

  //Pattern 28
  //   strength = 1.- length(vUv-0.5);
  // // strength = 1.0 - distance(vUv,vec2(0.8,0.2));
  //   color = vec3(strength, strength, strength);

  //Pattern 29
    // strength = 0.015/distance(vUv,vec2(0.5));
    // color = vec3(strength, strength, strength);

  //Pattern 30
    // float disortX = 0.1;
    // float disortY = 0.5;
    // vec2 lightUv = vec2(
    //   vUv.x * disortX + ((1.-disortX)*0.5), 
    //   vUv.y * disortY + ((1.-disortY)*0.5)
    // );
    // strength = 0.015/distance(lightUv,vec2(0.5));
    // color = vec3(strength, strength, strength);

  //Pattern 31
    // float disortX = 0.2;
    // float disortY = 0.9;
    // vec2 lightUvX = vec2(
    //   vUv.x * disortX + ((1.-disortX)*0.5), 
    //   vUv.y * disortY + ((1.-disortY)*0.5)
    // );
    // float lightX = 0.015/distance(lightUvX,vec2(0.5));
    // vec2 lightUvY = vec2(
    //   vUv.y * disortX + ((1.-disortX)*0.5), 
    //   vUv.x * disortY + ((1.-disortY)*0.5)
    // );
    // float lightY = 0.015/distance(lightUvY,vec2(0.5));
    // strength = lightX*lightY;
    // color = vec3(strength, strength, strength);

   //Pattern 32
    // vec2 rotatedUv = rotate(vUv, PI*0.25, vec2(0.5));
    // float disortX = 0.1;
    // float disortY = 0.5;
    // vec2 lightUvX = vec2(
    //   rotatedUv.x * disortX + ((1.-disortX)*0.5), 
    //   rotatedUv.y * disortY + ((1.-disortY)*0.5)
    // );
    // float lightX = 0.015/distance(lightUvX,vec2(0.5));
    // vec2 lightUvY = vec2(
    //   rotatedUv.y * disortX + ((1.-disortX)*0.5), 
    //   rotatedUv.x * disortY + ((1.-disortY)*0.5)
    // );
    // float lightY = 0.015/distance(lightUvY,vec2(0.5));
    // strength = lightX * lightY;
    // color = vec3(strength, strength, strength);

  //Pattern 33
    // strength = step(0.25,length(vUv-0.5));
    // color = vec3(strength, strength, strength);

  //Pattern 34
    // strength = abs(distance(vUv, vec2(0.5)) - 0.25);
    // color = vec3(strength, strength, strength);

  //Pattern 35
    // strength = step(0.01,abs(distance(vUv, vec2(0.5)) - 0.25));
    // color = vec3(strength, strength, strength);

  //Pattern 36
    // strength = 1. - step(0.01,abs(distance(vUv, vec2(0.5)) - 0.25));
    // color = vec3(strength, strength, strength);

  //Pattern 37
    // vec2 wavedUv = vec2(vUv.x, vUv.y + sin(vUv.x*30.)*0.1);
    // strength = 1. - step(0.01,abs(distance(wavedUv, vec2(0.5)) - 0.25));
    // color = vec3(strength, strength, strength);

  //Pattern 38
    // vec2 wavedUv = vec2(vUv.x + sin(vUv.y*30.)*0.1, vUv.y + sin(vUv.x*30.)*0.1);
    // strength = 1. - step(0.01,abs(distance(wavedUv, vec2(0.5)) - 0.25));
    // color = vec3(strength, strength, strength);

  //Pattern 39
    // vec2 wavedUv = vec2(vUv.x + sin(vUv.y*100.)*0.1, vUv.y + sin(vUv.x*100.)*0.1);
    // strength = 1. - step(0.01,abs(distance(wavedUv, vec2(0.5)) - 0.25));
    // color = vec3(strength, strength, strength);

  //Pattern 40
    // float angle = atan(vUv.x -0.5, vUv.y - 0.5);
    // strength = angle;
    // color = vec3(strength, strength, strength);
  
  //Pattern 41
    // float angle = atan(vUv.x -0.5, vUv.y - 0.5);
    // strength = angle;
    // color = vec3(strength, strength, strength);

  //Pattern 42
    // float angle = atan(vUv.x -0.5, vUv.y - 0.5);
    // angle /= PI*2.;
    // angle += 0.5;
    // strength = angle;
    // color = vec3(strength, strength, strength);

  //Pattern 43
    // float angle = atan(vUv.x -0.5, vUv.y - 0.5);
    // angle /= PI*2.;
    // angle += 0.5;
    // strength = mod(angle*20., 1.);
    // color = vec3(strength, strength, strength);

  //Pattern 44
    // float angle = atan(vUv.x -0.5, vUv.y - 0.5);
    // angle /= PI*2.;
    // angle += 0.5;
    // strength = sin(angle*100.);
    // color = vec3(strength, strength, strength);

  //Pattern 45 alt
    // vec2 wavedUv = vec2(vUv.x + sin(distance(vUv, vec2(0.5))*u_time)*0.1, vUv.y);
    // strength = 1. - step(0.01,abs(distance(wavedUv, vec2(0.5)) - 0.25));
    // color = vec3(strength, strength, strength);

  //Pattern 45
     // float angle = atan(vUv.x -0.5, vUv.y - 0.5);
     // angle /= PI*2.;
     // angle += 0.5;
     // float sinusoid = sin(angle*100.);
     // float radius = 0.25 + sinusoid*0.02;
     // strength = 1.0 - step(0.01,abs(distance(vUv, vec2(0.5)) - radius));
     // color = vec3(strength, strength, strength);

  //Pattern 46
     // strength = cnoise(vUv*10.);
     // color = vec3(strength, strength, strength);

  //Pattern 47
     // strength = step(0.1,cnoise(vUv*10.));
     // color = vec3(strength, strength, strength);

  //Pattern 48
     // strength = 1. - abs(cnoise(vUv*10.));
     // color = vec3(strength, strength, strength);
  
  //Pattern 49
     // strength = sin(cnoise(vUv*10.)*20.);
     // color = vec3(strength, strength, strength);
  
  //Pattern 49
     // strength = step(0.9,sin(cnoise(vUv*10.)*30.));
     // color = vec3(strength, strength, strength);


  
  //colored version
  vec3 blackColor = vec3(0.0);
  vec3 uvColor = vec3(vUv,1.0);
  //clamp strength to not reach more than 1.0
  strength = clamp(strength, 0.0, 1.0);

  color = mix(blackColor, uvColor, clamp(strength, 0.0, 1.0));


  


  
    gl_FragColor = vec4(color, 1.0);
} 