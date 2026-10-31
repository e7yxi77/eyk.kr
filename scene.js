/*
  EYK — 3D scene
  A figure drawn entirely from signed distance functions in a fragment shader.
  No model files and no libraries. The canvas is transparent wherever nothing is
  drawn, so page elements placed under it (blocks, giant words) show through and
  get hidden by the figure.
*/
(function () {
  'use strict';

  const canvas = document.getElementById('scene');
  if (!canvas) return;

  const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

  const FRAG = `
precision highp float;
uniform vec2 R;
uniform float T,ROT,ARM,FLAT,INK,CHR,BAND;
uniform vec2 M;
uniform vec3 C,FIG,LINE,INKC;
uniform mat3 HEAD;

const vec3 NECK=vec3(0.,1.49,0.);
vec3 gE,gH;

float smin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
float smax(float a,float b,float k){return -smin(-a,-b,k);}
float cap(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}
float con(vec3 p,vec3 a,vec3 b,float r1,float r2){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-mix(r1,r2,h);}
float ell(vec3 p,vec3 r){float k0=length(p/r);float k1=length(p/(r*r));return k0*(k0-1.)/k1;}
float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}

float head(vec3 q){
  float d=ell(q-vec3(0.,.168,-.006),vec3(.082,.104,.098));
  d=smin(d,ell(q-vec3(0.,.098,.026),vec3(.06,.072,.068)),.045);
  vec3 s=vec3(abs(q.x),q.yz);
  d=smax(d,-(length(s-vec3(.036,.15,.094))-.017),.02);
  d=smin(d,cap(q,vec3(0.,.152,.09),vec3(0.,.118,.112),.012),.018);
  d=smin(d,cap(s,vec3(0.,.176,.086),vec3(.04,.178,.078),.01),.018);
  d=smin(d,cap(q,vec3(-.02,.083,.092),vec3(.02,.083,.092),.005),.008);
  d=smin(d,ell(s-vec3(.08,.135,-.006),vec3(.007,.025,.015)),.012);
  return d;
}

float map(vec3 p){
  const float HS=1.16;
  vec3 q=HEAD*(p-NECK)/HS;
  float hb=length(q-vec3(0.,.14,.01))-.16;
  float d=(hb>.06?hb:head(q))*HS;
  d=smin(d,cap(p,vec3(0.,1.38,0.),NECK+vec3(0.,.07,0.),.058),.03);

  vec3 f=vec3(p.x,p.y,p.z*1.34);
  float t=con(f,vec3(0.,.94,0.),vec3(0.,1.31,0.),.158,.176)*.8;
  t=smin(t,cap(f,vec3(-.158,1.385,-.005),vec3(.158,1.385,-.005),.07)*.8,.09);
  t=smin(t,ell(p-vec3(0.,1.44,-.09),vec3(.115,.075,.07)),.05);

  float a=cap(p,vec3(-.212,1.38,0.),vec3(-.272,1.11,-.03),.058);
  a=smin(a,con(p,vec3(-.272,1.11,-.03),vec3(-.19,.92,.07),.054,.044),.03);
  t=smin(t,a,.03);

  float b=cap(p,vec3(.212,1.38,0.),gE,.058);
  b=smin(b,con(p,gE,gH,.054,.04),.03);
  t=smin(t,b,.03);

  float lg=con(p,vec3(-.088,.94,0.),vec3(-.112,.52,.03),.104,.08);
  lg=smin(lg,con(p,vec3(-.112,.52,.03),vec3(-.125,.11,-.01),.08,.062),.03);
  float rg=con(p,vec3(.088,.94,0.),vec3(.132,.52,.0),.104,.08);
  rg=smin(rg,con(p,vec3(.132,.52,.0),vec3(.175,.11,.02),.08,.062),.03);
  t=smin(t,min(lg,rg),.045);

  t+=.0035*sin(p.y*46.+3.*sin(p.x*21.+p.z*17.));
  d=smin(d,t,.02);

  d=min(d,smin(cap(p,vec3(-.125,.055,-.05),vec3(-.14,.05,.11),.048),box(p-vec3(-.13,.016,.03),vec3(.046,.014,.12)),.02));
  d=min(d,smin(cap(p,vec3(.175,.055,-.03),vec3(.208,.05,.13),.048),box(p-vec3(.19,.016,.05),vec3(.046,.014,.12)),.02));

  d=smin(d,length(p-gH)-.046,.02);
  if(ARM>.5) d=min(d,box(p-(gH+vec3(-.018,.03,.03)),vec3(.036,.075,.006)));
  return d;
}

vec3 nor(vec3 p){
  vec2 e=vec2(1.,-1.)*.0014;
  return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx));
}

float B2(vec2 a){a=floor(a);return fract(a.x/2.+a.y*a.y*.75);}
float B4(vec2 a){return B2(.5*a)*.25+B2(a);}

float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){return vn(p)*.55+vn(p*2.1+7.)*.3+vn(p*4.3+3.)*.15;}

vec4 inkLayer(vec2 fc){
  vec2 g=fc/R.y;
  float asp=R.x/R.y;
  vec2 mp=vec2((M.x*.5+.5)*asp,M.y*.5+.5);
  float md=length(g-mp);
  float n=fbm(g*2.5+vec2(T*.012,-T*.018));
  n+=.16*exp(-md*md*16.);
  float l=abs(fract(n*3.6)-.5);
  float mainBand=step(l,.095);
  float softBand=step(abs(l-.3),.04);
  float d1=step(mod(fc.x,2.),1.)*step(mod(fc.y,2.),1.);
  float d2=step(mod(fc.x,3.),1.)*step(mod(fc.y,3.),1.);
  float a=max(mainBand*d1,softBand*d2*.55);
  float fade=mix(1.,smoothstep(1.02,.2,fc.y/R.y),CHR);
  a*=INK*fade;
  vec3 c=INKC;
  if(CHR>.01){
    float k=B4(fc+vec2(2.,1.));
    c=mix(c,vec3(.1,.75,1.)*c.b,step(.72,k)*CHR);
    c=mix(c,vec3(.55,.35,1.)*c.b,step(k,.14)*CHR);
  }
  return vec4(c*a,a);
}

void main(){
  vec2 fc=gl_FragCoord.xy;
  gE=mix(vec3(.268,1.11,-.02),vec3(.262,1.13,.07),ARM);
  gH=mix(vec3(.285,.87,.03),vec3(.1,1.32,.2),ARM);

  vec2 uv=(2.*fc-R)/R.y;
  uv.x-=C.x;
  vec3 ro=vec3(0.,C.y,C.z);
  vec3 rd=normalize(vec3(uv,-2.4));
  float cr=cos(ROT),sr=sin(ROT);
  mat2 rm=mat2(cr,-sr,sr,cr);
  ro.xz=rm*ro.xz;rd.xz=rm*rd.xz;

  vec3 bmin=vec3(-.54,-.02,-.44),bmax=vec3(.54,1.82,.44);
  vec3 t0=(bmin-ro)/rd,t1=(bmax-ro)/rd;
  vec3 ta=min(t0,t1),tb=max(t0,t1);
  float tN=max(max(ta.x,ta.y),max(ta.z,0.));
  float tF=min(tb.x,min(tb.y,tb.z));

  float minD=1.;
  float tHit=-1.;
  if(tN<tF){
    float t=tN;
    for(int i=0;i<52;i++){
      float d=map(ro+rd*t);
      minD=min(minD,d/t);
      if(d<.0009*t){tHit=t;break;}
      t+=d;
      if(t>tF)break;
    }
  }

  if(tHit>0.){
    vec3 p=ro+rd*tHit;
    vec3 n=nor(p);
    float ndv=max(dot(n,-rd),0.);
    float dif=max(dot(n,normalize(vec3(.5,.75,.6))),0.);
    float rim=pow(1.-ndv,2.4);
    float ao=clamp(map(p+n*.07)/.07,0.,1.);
    float by=mix(.1,1.8,fract(T*.065));
    float band=exp(-(p.y-by)*(p.y-by)/.016)*BAND;
    float lum=.04+.8*dif*(.35+.65*ao)+.62*rim+band*.85;
    lum*=mod(fc.y,2.)<1.?1.:.74;
    float r=step(B4(fc+vec2(3.,1.)),lum*.42);
    float g=step(B4(fc+vec2(1.,2.)),lum*.74);
    float b=step(B4(fc),lum*1.3);
    vec3 dith=vec3(r,g,b)*vec3(.62,.86,1.);
    dith=max(dith,vec3(.018,.02,.03));
    vec3 flat_=mix(FIG,LINE,(1.-smoothstep(.02,.2,ndv))*.92);
    gl_FragColor=vec4(mix(dith,flat_,FLAT),1.);
    return;
  }

  if(FLAT>.02&&minD<.0042){
    float la=FLAT;
    vec4 ink=inkLayer(fc);
    vec3 col=LINE*la+ink.rgb*(1.-la);
    gl_FragColor=vec4(col,max(la,ink.a));
    return;
  }
  gl_FragColor=inkLayer(fc);
}`;

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' });

  function fail() {
    document.documentElement.classList.add('no-gl');
    window.dispatchEvent(new Event('eyk:scene-ready'));
  }
  if (!gl) { fail(); return; }

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { fail(); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    fail();
    return;
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.clearColor(0, 0, 0, 0);

  const U = {};
  ['R', 'T', 'ROT', 'ARM', 'FLAT', 'INK', 'CHR', 'BAND', 'M', 'C', 'FIG', 'LINE', 'INKC', 'HEAD'].forEach(n => { U[n] = gl.getUniformLocation(prog, n); });

  /* Colour of each page theme. Tweened in time so it flips with the CSS background. */
  const THEMES = {
    dark:  { flat: 0, fig: [.02, .02, .03], line: [.3, .4, .9],    ink: [.16, .34, 1],   inkA: .55, chr: 1, band: 1 },
    light: { flat: 1, fig: [1, 1, 1],       line: [.55, .58, .64], ink: [.03, .04, .08], inkA: .8,  chr: 0, band: 0 },
    blue:  { flat: 1, fig: [.102, .271, 1], line: [.01, .02, .09], ink: [.01, .02, .07], inkA: .95, chr: 0, band: 0 }
  };

  /* Where the camera sits for each section. x: screen shift · y: look height · d: distance */
  const WIDE = {
    hero:    { x: 0,    y: .92,  d: 2.85, rot: -.42, look: 1,   arm: 1 },
    about:   { x: 0,    y: 1.46, d: 1.02, rot: 0,    look: 0,   arm: 0 },
    work:    { x: .95,  y: 1.02, d: 3.05, rot: .7,   look: .7,  arm: 1 },
    record:  { x: -1.05, y: 1.4, d: 1.5,  rot: -.5,  look: .1,  arm: 0 },
    stack:   { x: 0,    y: 1.46, d: 1.02, rot: 0,    look: 0,   arm: 0 },
    goals:   { x: 1.02, y: .92,  d: 2.85, rot: 2.6,  look: .85, arm: 1 },
    contact: { x: 0,    y: 1.42, d: 1.12, rot: 0,    look: 0,   arm: 0 }
  };
  const NARROW = {
    hero:    { x: 0, y: .98,  d: 3.3,  rot: -.42, look: 1,   arm: 1 },
    about:   { x: 0, y: 1.46, d: 1.5,  rot: 0,    look: 0,   arm: 0 },
    work:    { x: 0, y: 1.0,  d: 3.4,  rot: .7,   look: .7,  arm: 1 },
    record:  { x: 0, y: 1.4,  d: 1.9,  rot: -.5,  look: .1,  arm: 0 },
    stack:   { x: 0, y: 1.46, d: 1.5,  rot: 0,    look: 0,   arm: 0 },
    goals:   { x: 0, y: .98,  d: 3.4,  rot: 2.6,  look: .85, arm: 1 },
    contact: { x: 0, y: 1.42, d: 1.6,  rot: 0,    look: 0,   arm: 0 }
  };

  const sections = [...document.querySelectorAll('[data-scene]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = () => innerWidth < 900;

  let px = narrow() ? 1.5 : 2;
  let pxLocked = false;
  let tops = [];
  const cam = { x: 0, y: .92, d: 2.85, rot: -.42, look: 1, arm: 1 };
  const col = JSON.parse(JSON.stringify(THEMES.dark));
  let theme = 'dark';
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };

  function resize() {
    const w = Math.ceil(innerWidth / px), h = Math.ceil(innerHeight / px);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    tops = sections.map(s => s.getBoundingClientRect().top + scrollY);
    mark();
  }

  function sstep(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  function targetCam() {
    const set = narrow() ? NARROW : WIDE;
    const y = scrollY, vh = innerHeight;
    let i = 0;
    for (let k = 0; k < tops.length; k++) if (y >= tops[k] - vh) i = k;
    const next = sections[i];
    const prev = sections[Math.max(0, i - 1)];
    const e = i === 0 ? 1 : sstep(tops[i] - vh, tops[i], y);
    const a = set[prev.dataset.scene], b = set[next.dataset.scene], out = {};
    for (const k in a) out[k] = a[k] + (b[k] - a[k]) * e;
    return out;
  }

  /* Page theme flips when a section reaches the middle of the viewport. */
  function mark() {
    const y = scrollY + innerHeight * .5;
    let cur = sections[0];
    for (let k = 0; k < tops.length; k++) if (y >= tops[k]) cur = sections[k];
    const th = cur.dataset.theme;
    if (th !== document.body.dataset.theme) document.body.dataset.theme = th;
    theme = th;
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === cur.id));
  }

  function headMatrix(pitch, yaw) {
    const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
    return [cy, sy * sp, -sy * cp, 0, cp, sp, sy, -cy * sp, cy * cp];
  }

  const mini = document.getElementById('miniFig');
  const miniCtx = mini ? mini.getContext('2d') : null;

  let frames = 0, last = 0, acc = 0, n = 0, startT = performance.now(), ready = false;

  function draw(now) {
    const t = reduced ? 0 : (now - startT) / 1000;
    const tgt = targetCam();
    const ease = reduced ? 1 : .085;
    for (const k in cam) cam[k] += (tgt[k] - cam[k]) * ease;
    mouse.sx += (mouse.x - mouse.sx) * .06;
    mouse.sy += (mouse.y - mouse.sy) * .06;

    const th = THEMES[theme], ce = reduced ? 1 : .07;
    col.flat += (th.flat - col.flat) * ce;
    col.inkA += (th.inkA - col.inkA) * ce;
    col.chr += (th.chr - col.chr) * ce;
    col.band += (th.band - col.band) * ce;
    ['fig', 'line', 'ink'].forEach(k => { for (let i = 0; i < 3; i++) col[k][i] += (th[k][i] - col[k][i]) * ce; });

    const sway = reduced ? 0 : Math.sin(t * .22) * .16;
    const rot = cam.rot + sway * (1 - col.flat) + mouse.sx * (col.flat > .5 ? .1 : .55);
    const pitch = -.62 * cam.look + mouse.sy * .16;
    const yaw = -mouse.sx * .42;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.R, canvas.width, canvas.height);
    gl.uniform1f(U.T, t);
    gl.uniform2f(U.M, mouse.sx, mouse.sy);
    gl.uniform3f(U.C, cam.x, cam.y, cam.d);
    gl.uniform1f(U.ROT, rot);
    gl.uniform1f(U.ARM, cam.arm);
    gl.uniform1f(U.FLAT, col.flat);
    gl.uniform1f(U.INK, col.inkA);
    gl.uniform1f(U.CHR, col.chr);
    gl.uniform1f(U.BAND, col.band);
    gl.uniform3fv(U.FIG, col.fig);
    gl.uniform3fv(U.LINE, col.line);
    gl.uniform3fv(U.INKC, col.ink);
    gl.uniformMatrix3fv(U.HEAD, false, headMatrix(pitch, yaw));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (miniCtx && frames % 4 === 0 && scrollY < innerHeight) {
      const sw = canvas.height * .9 * (mini.width / mini.height), sh = canvas.height * .9;
      miniCtx.clearRect(0, 0, mini.width, mini.height);
      miniCtx.drawImage(canvas, (canvas.width - sw) / 2, canvas.height * .05, sw, sh, 0, 0, mini.width, mini.height);
    }
    frames++;

    if (!ready) {
      ready = true;
      window.dispatchEvent(new Event('eyk:scene-ready'));
    }
  }

  function loop(now) {
    if (document.hidden) { requestAnimationFrame(loop); return; }
    const dt = now - last;
    last = now;
    if (dt < 200) {
      acc += dt;
      n++;
      if (n === 48) {
        if (!pxLocked && acc / n > 30 && px < 3.5) { px += .5; resize(); }
        acc = 0;
        n = 0;
      }
    }
    draw(now);
    requestAnimationFrame(loop);
  }

  addEventListener('resize', resize, { passive: true });
  addEventListener('load', resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
  addEventListener('scroll', () => { mark(); if (reduced) draw(performance.now()); }, { passive: true });
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    mouse.x = e.clientX / innerWidth * 2 - 1;
    mouse.y = 1 - e.clientY / innerHeight * 2;
  }, { passive: true });

  resize();
  if (reduced) {
    for (let i = 0; i < 2; i++) draw(performance.now());
  } else {
    requestAnimationFrame(loop);
  }

  window.EYK_SCENE = { setPx(v) { px = v; pxLocked = true; resize(); }, info() { return { px, w: canvas.width, h: canvas.height, frames, theme, cam: { ...cam } }; } };
})();
