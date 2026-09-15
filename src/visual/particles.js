/* One point cloud, five authored forms. The hero samples the supplied logo, including its even-odd cutouts. */
import { logoPath } from './logo-shape.js';
  const vertexSource = [
    'precision highp float;',
    'attribute vec3 aLogo; attribute vec3 aGraph; attribute vec3 aMemory; attribute vec3 aLanguage; attribute vec4 aOwnership; attribute vec4 aMeta; attribute vec4 aNetwork; attribute vec4 aFlow;',
    'uniform float uTime; uniform float uState; uniform float uAspect; uniform float uDpr; uniform float uScale; uniform float uCrossing; uniform float uInteraction;',
    'uniform vec2 uPointer; uniform vec2 uOrigin; uniform vec4 uTextRectA; uniform vec4 uTextRectB; uniform vec3 uNodes[15];',
    'varying vec3 vColor; varying float vAlpha;',
    'mat2 turn(float a){ return mat2(cos(a),-sin(a),sin(a),cos(a)); }',
    'float textMask(vec2 p,vec4 rect){ return smoothstep(rect.x-.06,rect.x,p.x)*(1.0-smoothstep(rect.z,rect.z+.06,p.x))*smoothstep(rect.w-.10,rect.w,p.y)*(1.0-smoothstep(rect.y,rect.y+.10,p.y)); }',
    'vec3 livingNode(vec3 p){ float phase=p.x*2.7+p.y*1.3; return p+vec3(sin(uTime*.46+phase)*.115,cos(uTime*.38+phase*1.7)*.10,sin(uTime*.32+phase)*.08); }',
    'float travellingSignal(float t,float id,float speed){ float d=(t-fract(uTime*speed+id*.137))*17.0; float along=exp(-d*d); float node=pow(.5+.5*sin(uTime*1.7-id*.7),4.0); return mix(node,along,step(0.0,id)); }',
    'void main(){',
    ' float g=clamp(uState,0.0,1.0); float m=clamp(uState-1.0,0.0,1.0); float l=clamp(uState-2.0,0.0,1.0); float o=clamp(uState-3.0,0.0,1.0);',
    ' float logoWeight=1.0-g; float graphWeight=g-m; float memoryWeight=m-l; float languageWeight=l-o;',
    ' float phase=aMeta.x*6.283185;',
    ' float networkPoint=step(.5,aNetwork.w); float networkNode=step(1.75,aNetwork.w);',
    ' float connectionPhase=aNetwork.x*1.8+aNetwork.y*1.1;',
    ' float changingEdge=step(1.25,aNetwork.w)*(1.0-networkNode);',
    ' float connection=smoothstep(-.15,.55,sin(uTime*.52+connectionPhase));',
    ' float networkVisibility=mix(1.0,connection,changingEdge);',
    ' float signalHead=fract(uTime*.22+aNetwork.x*.137+aNetwork.y*.071);',
    ' float signalDistance=(aNetwork.z-signalHead)*19.0; float signal=exp(-signalDistance*signalDistance);',
    // A ten-second travelling breath releases a minority of points, then returns them.
    // The original path remains the anchor, so the face and cutouts stay recognizable.
    ' float logoCycle=mod(uTime,10.0);',
    ' float sweepY=mix(2.6,-2.6,smoothstep(1.4,8.2,logoCycle));',
    ' float sweepEnvelope=smoothstep(.5,1.8,logoCycle)*(1.0-smoothstep(8.2,9.7,logoCycle));',
    ' float waveDistance=(aLogo.y-sweepY)*1.7; float logoWave=exp(-waveDistance*waveDistance)*sweepEnvelope;',
    ' float release=logoWave*smoothstep(.62,.92,aMeta.y)*(1.0-networkPoint);',
    ' vec3 drift=vec3(sin(phase*2.0+uTime*.38)*.40,cos(phase*3.0-uTime*.32)*.26,sin(phase+uTime*.42)*.72);',
    ' vec3 logo=aLogo+drift*release;',
    ' if(networkPoint>.5){',
    '  vec3 a=livingNode(uNodes[int(aNetwork.x)]); vec3 b=livingNode(uNodes[int(aNetwork.y)]);',
    '  logo=mix(a,b,aNetwork.z);',
    '  logo+=vec3(sin(phase*3.0),cos(phase*4.0),sin(phase*5.0))*mix(.006,.028,networkNode);',
    '  logo.z+=sin(aNetwork.z*3.14159265)*.04*(1.0-networkNode);',
    ' }',
    ' logo+=vec3(sin(aLogo.y*1.8+uTime*.55)*.018,sin(aLogo.x*2.1-uTime*.45)*.015,sin(aLogo.y*1.6+uTime*.5)*.055);',
    ' logo.xz=turn(sin(uTime*.23)*.20)*logo.xz;',
    ' logo.xy=turn(sin(uTime*.31)*.025)*logo.xy;',
    ' logo*=1.0+sin(uTime*.65)*.023;',
    // Spatially coherent deformation keeps each cluster and its links together.
    ' vec3 graph=aGraph;',
    ' graph+=vec3(sin(aGraph.y*1.3+uTime*.54)*.13,sin(aGraph.x*1.4+uTime*.44)*.11,cos(aGraph.y*1.2+uTime*.48)*.24);',
    ' graph.xz=turn(sin(uTime*.20)*.30)*graph.xz; graph.xy=turn(sin(uTime*.18)*.065)*graph.xy;',
    ' graph*=1.0+sin(uTime*.72)*.032;',
    ' vec3 memory=aMemory;',
    ' memory+=vec3(sin(aMemory.y*1.5+uTime*.70)*.11,sin(aMemory.x*1.7-uTime*.55)*.10,cos(aMemory.x*1.6+uTime*.52)*.15);',
    ' memory.xz=turn(sin(uTime*.21)*.29)*memory.xz;',
    ' memory*=1.0+sin(uTime*.76)*.03;',
    ' float graphSignal=travellingSignal(aFlow.x,aFlow.y,.24); float memorySignal=travellingSignal(aFlow.z,aFlow.w,.29);',
    ' vec3 language=aLanguage; language.z+=sin(language.x*3.0-uTime*1.1)*.12;',
    ' if(aMeta.w<-.5){ float center=aMeta.w< -1.5 ? -.82 : .82; language.y=center+(language.y-center)*(.72+.28*sin(uTime*1.65+language.x*4.0)); }',
    // The fourth ownership component carries a rim path, core marker, or link path.
    // Keep these in the existing attribute slot and point budget (WebGL 1: eight slots).
    ' vec3 ownership=aOwnership.xyz;',
    ' float ownershipRim=step(0.0,aOwnership.w); float ownershipLink=1.0-step(-1.5,aOwnership.w);',
    ' float ownershipCore=1.0-ownershipRim-ownershipLink;',
    ' float rimDistance=abs(fract(aOwnership.w-uTime*.085+.5)-.5)*13.0;',
    ' float rimSignal=exp(-rimDistance*rimDistance)*ownershipRim;',
    ' float coreSignal=pow(.5+.5*sin(aOwnership.y*7.0-uTime*1.6),6.0)*ownershipCore;',
    ' float linkSignal=0.0; float linkVisibility=1.0;',
    ' if(ownershipCore>.5){',
    '  ownership.y-=.08; ownership.xz=turn(uTime*.28)*ownership.xz;',
    '  ownership.yz=turn(sin(uTime*.32)*.22)*ownership.yz;',
    '  ownership*=1.0+sin(uTime*.75+.4)*.075; ownership.y+=.08;',
    ' }',
    ' if(ownershipLink>.5){',
    '  float t=clamp(-aOwnership.w-2.0,0.0,1.0);',
    '  float linkPhase=aOwnership.x*2.1+aOwnership.y*1.6;',
    '  vec3 origin=normalize(aOwnership.xyz-vec3(0.0,.08,0.0))*.51*(1.0+sin(uTime*.75+.4)*.075)+vec3(0.0,.08,0.0);',
    '  ownership=mix(origin,aOwnership.xyz,t); ownership.z+=sin(t*3.141593)*sin(uTime*.55+linkPhase)*.12;',
    '  linkVisibility=mix(.18,1.0,smoothstep(-.7,.65,sin(uTime*.55+linkPhase)));',
    '  float d=(t-fract(uTime*.24+linkPhase*.17))*15.0; linkSignal=exp(-d*d)*linkVisibility;',
    ' }',
    ' ownership.xy*=1.0+sin(uTime*.75)*.028+rimSignal*.025;',
    ' ownership.z+=sin(ownership.y*1.8+uTime*.65)*.09;',
    ' ownership.xz=turn(sin(uTime*.24)*.20)*ownership.xz;',
    ' ownership.xy=turn(sin(uTime*.20)*.025)*ownership.xy;',
    ' float ownershipSignal=rimSignal*.8+coreSignal*.35+linkSignal*.65;',
    ' vec3 p=mix(mix(mix(mix(logo,graph,g),memory,m),language,l),ownership,o);',
    ' float transition=sin(fract(uState)*3.14159265);',
    ' p += vec3(sin(phase*3.0+uTime*.28),cos(phase*5.0+uTime*.24),sin(phase*7.0))*transition*.85;',
    ' p.z += sin(aMeta.y*6.283185)*transition*2.1;',
    ' p.y+=sin(phase*2.0+uTime*.5)*mix(.012,.027,1.0-logoWeight);',
    // Evaluate the reference palette in model space, so phone scaling keeps the same hues.
    ' float tone=clamp(.5-p.y*.255+sin(phase)*.03,0.0,1.0);',
    ' p*=uScale;',
    ' float z=max(2.6,6.6-p.z);',
    ' vec2 projected=p.xy*2.1/z; projected.x/=uAspect; projected+=uOrigin;',
    ' vec2 delta=(projected-uPointer)*vec2(uAspect,1.0);',
    ' float influence=exp(-dot(delta,delta)*22.0)*uInteraction;',
    ' vec2 push=normalize(delta+vec2(.0001))*.095*influence;',
    ' projected+=push/vec2(uAspect,1.0);',
    ' vColor=mix(vec3(.22,1.0,.78),vec3(.37,.70,.97),smoothstep(.10,.60,tone));',
    ' vColor=mix(vColor,vec3(.52,.40,1.0),smoothstep(.50,.95,tone));',
    ' vec3 highlight=mix(vColor,vec3(.88,1.0,1.0),.42);',
    ' float activation=logoWeight*(logoWave*.36+networkPoint*max(signal,networkNode*.45))+graphWeight*graphSignal*.65+memoryWeight*memorySignal*.70+o*ownershipSignal*.75;',
    ' vColor=mix(vColor,highlight,clamp(activation,0.0,1.0));',
    ' vColor=mix(vColor,vec3(.90,1.0,1.0),influence*.35);',
    ' float twinkle=.82+.18*sin(uTime*.65+phase*5.0);',
    ' vAlpha=(.35+aMeta.z*.34)*twinkle;',
    ' vAlpha*=mix(1.0,1.12,logoWeight);',
    ' vAlpha*=mix(1.0,.48,languageWeight+o);',
    ' vAlpha+=logoWeight*logoWave*(.10+aMeta.z*.08);',
    ' vAlpha+=graphWeight*graphSignal*.60+memoryWeight*memorySignal*.62;',
    ' vAlpha*=mix(1.0,.26*linkVisibility,o*ownershipLink);',
    ' vAlpha+=o*ownershipSignal*.62;',
    ' vAlpha=mix(vAlpha,(.36+signal*.75+networkNode*(.20+.16*sin(uTime*.8+connectionPhase)))*networkVisibility,logoWeight*networkPoint);',
    ' vAlpha*=1.0-logoWeight*(1.0-step(-.5,aNetwork.w))*.82;',
    ' vAlpha*=1.0-transition*.32;',
    ' vAlpha*=1.0-uCrossing*.45;',
    ' float textArea=max(textMask(projected,uTextRectA),textMask(projected,uTextRectB));',
    ' vAlpha*=1.0-.94*textArea;',
    ' float size=(1.35+aMeta.z*.90+influence*2.5+logoWeight*networkPoint*(signal*.45+networkNode*.55)+graphWeight*graphSignal*.4+memoryWeight*memorySignal*.45+o*ownershipSignal*.45)*uDpr*(6.0/z);',
    ' gl_PointSize=clamp(size,.8,8.0*uDpr);',
    ' gl_Position=vec4(projected,clamp(-p.z*.08,-.95,.95),1.0);',
    ' if(aMeta.w>.5){',
    '  vec2 s=aLogo.xy; s.y+=sin(uTime*.075+phase)*.012*(1.0-logoWeight);',
    '  gl_Position=vec4(s,.97,1.0); gl_PointSize=(.65+aMeta.z*1.25)*uDpr;',
    '  vColor=mix(vec3(.50,.76,.69),vec3(.52,.50,.80),aMeta.y);',
    '  vAlpha=(.13+aMeta.z*.25)*(.75+.25*sin(uTime*.35*(1.0-logoWeight)+phase));',
    '  float starTextArea=max(textMask(s,uTextRectA),textMask(s,uTextRectB));',
    '  vAlpha*=1.0-.72*starTextArea;',
    ' }',
    '}'
  ].join('\n');
  const fragmentSource = [
    'precision mediump float;',
    'varying vec3 vColor; varying float vAlpha;',
    'void main(){',
    ' float d=length(gl_PointCoord-.5)*2.0;',
    ' if(d>1.0) discard;',
    ' float core=exp(-d*d*5.5); float halo=(1.0-smoothstep(.0,1.0,d))*.32;',
    ' gl_FragColor=vec4(vColor,vAlpha*(core+halo));',
    '}'
  ].join('\n');

  function geometry(total, starCount) {
    let seed = 764189;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(.00001, random()))) * Math.cos(random() * Math.PI * 2);
    const count = total + starCount;
    const logo = new Float32Array(count * 3), graph = new Float32Array(count * 3);
    const memory = new Float32Array(count * 3), language = new Float32Array(count * 3), ownership = new Float32Array(count * 4);
    const meta = new Float32Array(count * 4);
    const network = new Float32Array(count * 4);
    const flow = new Float32Array(count * 4);

    // Rasterize the exact supplied path once; sampling preserves all transparent holes.
    const mask = document.createElement('canvas'); mask.width = 560; mask.height = 558;
    const ctx = mask.getContext('2d', {willReadFrequently: true});
    ctx.scale(2, 2); ctx.fill(new Path2D(logoPath), 'evenodd');
    const pixels = ctx.getImageData(0, 0, 560, 558).data;
    const filled = [];
    for (let y = 0; y < 558; y++) for (let x = 0; x < 560; x++) {
      if (pixels[(y * 560 + x) * 4 + 3] > 160) filled.push([x / 2, y / 2]);
    }
    if (!filled.length) throw new Error('Logo geometry is empty.');
    // Preserve the face and outer rim, but quiet the old interior lines under the living graph.
    ctx.clearRect(0, 0, 280, 279);
    ctx.fill(new Path2D(logoPath.match(/^.*?Z/)[0]));
    const outer = ctx.getImageData(0, 0, 560, 558).data;
    const inside = (x, y) => {
      const px = Math.round(x * 2), py = Math.round(y * 2);
      return px >= 0 && px < 560 && py >= 0 && py < 558 && outer[(py * 560 + px) * 4 + 3] > 160;
    };
    const interior = (x, y) => y < 218 && x > (y < 110 ? 79 : y < 175 ? 116 : 151)
      && [[-7,0],[7,0],[0,-7],[0,7],[-5,-5],[5,-5],[-5,5],[5,5]].every(([dx,dy]) => inside(x + dx,y + dy));
    const anchors = [[100,68],[122,88],[145,52],[178,74],[211,79],[162,106],[139,124],[202,122],[216,154],[161,151],[121,171],[187,174],[160,200],[183,214],[123,46]];
    const nodes = new Float32Array(anchors.flatMap(([x,y]) => [(x - 130) * .0188,(143 - y) * .0188,.10]));
    const distance = (a,b) => anchors[a].reduce((sum,v,k) => sum + (v-anchors[b][k]) ** 2,0);
    // A spanning tree stays connected; nearby alternate paths gently appear and disappear.
    const livingEdges = [], edgeKeys = new Set(), reached = new Set([0]);
    const addEdge = (a,b,type) => {
      const key = [a,b].sort((x,y) => x-y).join(':');
      if (!edgeKeys.has(key)) { edgeKeys.add(key); livingEdges.push([a,b,type]); }
    };
    while (reached.size < anchors.length) {
      let nearest = null;
      for (const a of reached) for (let b = 0; b < anchors.length; b++) {
        if (!reached.has(b) && (!nearest || distance(a,b) < nearest.d)) nearest = {a,b,d:distance(a,b)};
      }
      addEdge(nearest.a,nearest.b,1); reached.add(nearest.b);
    }
    anchors.forEach((_,a) => anchors.map((_,b) => b).filter(b => b !== a)
      .sort((b,c) => distance(a,b)-distance(a,c)).slice(0,4).forEach(b => addEdge(a,b,1.5)));


    // An open spatial graph: five knowledge clusters and their cross-connections.
    const graphNodes = [[0, 0, .45]];
    for (let cluster = 0; cluster < 5; cluster++) {
      const a = cluster * Math.PI * 2 / 5 + .38;
      const center = [Math.cos(a) * 1.46, Math.sin(a) * 1.58, Math.sin(a * 2) * .33];
      graphNodes.push(center);
      for (let n = 0; n < 4; n++) {
        const t = n * Math.PI * .5 + cluster * .43;
        graphNodes.push([center[0] + Math.cos(t) * .48, center[1] + Math.sin(t) * .44, center[2] + Math.sin(t * 2 + n) * .30]);
      }
    }
    const graphEdges = [];
    for (let cluster = 0; cluster < 5; cluster++) {
      const hub = 1 + cluster * 5;
      graphEdges.push([0, hub], [hub, 1 + (cluster + 1) % 5 * 5]);
      for (let n = 1; n <= 4; n++) graphEdges.push([hub, hub + n], [hub + n, hub + n % 4 + 1]);
    }

    // Two hemispheres, connected by fine neural filaments and memory pathways.
    const memoryNodes = [];
    for (let i = 0; i < 82; i++) {
      const side = i % 2 ? 1 : -1, angle = i * 2.399963;
      const y = 1 - 2 * (i + .5) / 82, r = Math.sqrt(1 - y * y);
      memoryNodes.push([side * .67 + Math.cos(angle) * r * .97, y * 1.55, Math.sin(angle) * r * .83]);
    }
    const memoryEdges = [];
    memoryNodes.forEach((a, i) => {
      memoryNodes.map((b, j) => ({j, d: a.reduce((sum, v, k) => sum + (v - b[k]) ** 2, 0)}))
        .filter(n => n.j !== i).sort((a, b) => a.d - b.d).slice(0, 4)
        .forEach(n => { if (n.j > i) memoryEdges.push([i, n.j]); });
    });
    const curve = (points, t) => {
      const v = Math.min(.999999, t) * (points.length - 1), k = Math.floor(v), f = v - k;
      return points[k].map((p, axis) => p + (points[k + 1][axis] - p) * f);
    };
    const bubble = [[-1.05,.62],[-.83,.76],[.84,.76],[1.07,.62],[1.14,.42],[1.14,-.35],[1.04,-.55],[.83,-.64],[-.36,-.64],[-.85,-.99],[-.73,-.64],[-.92,-.61],[-1.12,-.40],[-1.14,.41],[-1.05,.62]];
    const shield = [[0,1.93],[.53,1.70],[1.15,1.47],[1.53,1.37],[1.49,.52],[1.35,-.30],[1.03,-.98],[.56,-1.55],[0,-1.94],[-.56,-1.55],[-1.03,-.98],[-1.35,-.30],[-1.49,.52],[-1.53,1.37],[-1.15,1.47],[-.53,1.70],[0,1.93]];
    for (let i = 0; i < total; i++) {
      const pixel = filled[Math.floor(random() * filled.length)];
      logo.set([(pixel[0] - 130 + random() * .5) * .0188, (143 - pixel[1] - random() * .5) * .0188, gaussian() * .045], i * 3);

      if (interior(pixel[0],pixel[1])) network[i * 4 + 3] = -1;

      if (i % 5 < 2) {
        const node = graphNodes[i % graphNodes.length];
        flow[i * 4 + 1] = -1 - i % graphNodes.length;
        const r = (i % graphNodes.length === 0 ? .16 : .07) * Math.pow(random(), .45);
        const a = random() * Math.PI * 2, b = random() * Math.PI;
        graph.set([node[0] + r * Math.sin(b) * Math.cos(a), node[1] + r * Math.sin(b) * Math.sin(a), node[2] + r * Math.cos(b)], i * 3);
      } else {
        const edgeIndex = Math.floor(random() * graphEdges.length);
        const edge = graphEdges[edgeIndex], a = graphNodes[edge[0]], b = graphNodes[edge[1]], t = random();
        flow[i * 4] = t; flow[i * 4 + 1] = edgeIndex;
        graph.set(a.map((x, k) => x + (b[k] - x) * t + gaussian() * .012 + Math.sin(t * Math.PI) * Math.sin(k * 2 + edge[0]) * .08), i * 3);
      }

      if (i % 9 === 0) {
        const n = memoryNodes[i % memoryNodes.length];
        flow[i * 4 + 3] = -1 - i % memoryNodes.length;
        memory.set(n.map(x => x + gaussian() * .045), i * 3);
      } else {
        const edgeIndex = i % memoryEdges.length;
        const edge = memoryEdges[edgeIndex], a = memoryNodes[edge[0]], b = memoryNodes[edge[1]], t = random();
        flow[i * 4 + 2] = t; flow[i * 4 + 3] = edgeIndex;
        memory.set(a.map((x, k) => x + (b[k] - x) * t + Math.sin(edge[0] * 2.1 + k * 3) * Math.sin(t * Math.PI) * .16 + gaussian() * .022), i * 3);
      }

      const side = i % 2 ? 1 : -1;
      const cx = side * .65, cy = -side * .82;
      if (i % 10 < 6) {
        const p = curve(bubble, random());
        language.set([p[0] * (side === 1 ? -1 : 1) + cx + gaussian() * .028, p[1] + cy + gaussian() * .028, side * .22 + gaussian() * .08], i * 3);
      } else if (i % 10 < 9) {
        const bar = Math.floor(random() * 29), x = (bar - 14) * .053;
        const height = .07 + Math.exp(-x * x * 3) * (.16 + .19 * Math.abs(Math.sin(bar * .87)));
        language.set([cx + x, cy + (random() - .5) * height * 2 + .035, side * .22 + gaussian() * .05], i * 3);
      } else {
        const t = random(), a = t * Math.PI * 2;
        language.set([Math.cos(a) * 2.1, Math.sin(a) * 1.95, -.65 + gaussian() * .035], i * 3);
      }

      if (i % 20 < 13) {
        const path = random(), p = curve(shield, path), layer = i % 4;
        const scale = 1 - layer * .032;
        ownership.set([p[0] * scale + gaussian() * .018, p[1] * scale + gaussian() * .018, (layer - 1.5) * .12 + gaussian() * .05, path], i * 4);
      } else if (i % 20 < 18) {
        const a = random() * Math.PI * 2, b = Math.acos(2 * random() - 1), r = .51 + gaussian() * .015;
        ownership.set([Math.cos(a) * Math.sin(b) * r, Math.cos(b) * r + .08, Math.sin(a) * Math.sin(b) * r, -1], i * 4);
      } else {
        // Ten fine paths link the personal core to the innermost shield layer.
        const path = (Math.floor(i / 20) % 10 + .5) / 10, p = curve(shield, path);
        ownership.set([p[0] * .904, p[1] * .904, .18, -2 - random()], i * 4);
      }
      meta.set([random(), random(), i % 8 === 0 ? .95 : .2 + random() * .65, i % 10 >= 6 && i % 10 < 9 ? (side === 1 ? -2 : -1) : 0], i * 4);
    }
    // Reuse part of the existing point budget; every point retains all later scene targets.
    for (let i = 0; i < total; i += 7) {
      const n = i / 7, isNode = n % 6 === 0;
      const edge = livingEdges[Math.floor(random() * livingEdges.length)];
      const a = isNode ? Math.floor(n / 6) % anchors.length : edge[0];
      const b = isNode ? a : edge[1], t = isNode ? 0 : random();
      network.set([a,b,t,isNode ? 2 : edge[2]],i * 4);
      for (let axis = 0; axis < 3; axis++) logo[i * 3 + axis] = nodes[a * 3 + axis] + (nodes[b * 3 + axis] - nodes[a * 3 + axis]) * t;
    }
    for (let i = total; i < count; i++) {
      const p = [random() * 2 - 1, random() * 2 - 1, 0];
      [logo, graph, memory, language].forEach(shape => shape.set(p, i * 3));
      ownership.set([...p, -1], i * 4);
      meta.set([random(), random(), random(), 1], i * 4);
    }
    return {logo, graph, memory, language, ownership, meta, network, flow, nodes, edgeCount: livingEdges.length, count};
  }

  export function createLingoParticles(canvas) {
    let gl = null;
    try { gl = canvas.getContext('webgl', {alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance', premultipliedAlpha: false}); } catch {}
    if (!gl) { document.documentElement.classList.add('no-webgl'); return null; }

    let program, uniforms, buffers = [], data;
    let lost = false, raf = 0, alive = true, running = false, wantsRunning = false, previous = 0, time = 0, targetState = 0, currentState = 0;
    let renderCount = 0, renderWidth = 0, renderHeight = 0, dpr = 1, isMobile = false;
    let artFrame = null, mainDrawCount = 0, sampleFrames = 0, sampleMs = 0;
    let textRects = [[-3, -3, -3, -3], [-3, -3, -3, -3]], sceneOrigins = [.45];
    let pointerTarget = {x: 2, y: 2, active: 0}, pointer = {x: 2, y: 2}, velocity = {x: 0, y: 0}, interaction = 0;
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(error);
      }
      return shader;
    };
    function build() {
      const vert = compile(gl.VERTEX_SHADER, vertexSource), frag = compile(gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram(); gl.attachShader(program, vert); gl.attachShader(program, frag); gl.linkProgram(program);
      gl.deleteShader(vert); gl.deleteShader(frag);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      uniforms = {};
      ['uTime','uState','uAspect','uDpr','uScale','uCrossing','uInteraction','uPointer','uOrigin','uTextRectA','uTextRectB'].forEach(name => { uniforms[name] = gl.getUniformLocation(program, name); });
      if (!data) data = geometry(matchMedia('(max-width: 700px)').matches ? 26000 : 52000, 600);
      uniforms.uNodes = gl.getUniformLocation(program, 'uNodes[0]');
      gl.uniform3fv(uniforms.uNodes, data.nodes);
      [['aLogo', data.logo, 3],['aGraph', data.graph, 3],['aMemory', data.memory, 3],['aLanguage', data.language, 3],['aOwnership', data.ownership, 4],['aMeta', data.meta, 4],['aNetwork', data.network, 4],['aFlow', data.flow, 4]].forEach(([name, array, size]) => {
        const buffer = gl.createBuffer(); buffers.push(buffer); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
        const attribute = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0, 0);
      });
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.disable(gl.DEPTH_TEST);
      gl.clearColor(.008, .014, .013, 1);
      canvas.dataset.renderer = 'webgl'; canvas.dataset.particles = String(data.count);
      canvas.dataset.networkNodes = String(data.nodes.length / 3); canvas.dataset.networkEdges = String(data.edgeCount);
      document.documentElement.classList.remove('no-webgl');
    }
    function draw() {
      if (!alive || lost || !program) return;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.uTime, time);
      gl.uniform1f(uniforms.uState, currentState);
      gl.uniform1f(uniforms.uAspect, renderWidth / renderHeight);
      gl.uniform1f(uniforms.uDpr, dpr);
      const mobileScale = artFrame ? Math.min(artFrame.height / (renderHeight * .86), artFrame.width / (renderHeight * .80), .9) : .4;
      gl.uniform1f(uniforms.uScale, isMobile ? mobileScale : Math.min(1, renderWidth / renderHeight * .68));
      // Position and form use the same live state, including when scrolling reverses.
      const scene = Math.min(Math.floor(currentState), sceneOrigins.length - 1);
      const from = sceneOrigins[scene], to = sceneOrigins[Math.min(scene + 1, sceneOrigins.length - 1)];
      const progress = currentState - Math.floor(currentState), blend = progress * progress * (3 - 2 * progress);
      const originX = isMobile && artFrame ? artFrame.x / renderWidth * 2 - 1 : from + (to - from) * blend;
      const crossing = isMobile ? 0 : Math.abs(to - from) / .9 * Math.sin(progress * Math.PI);
      gl.uniform2f(uniforms.uOrigin, originX, isMobile && artFrame ? 1 - artFrame.y / renderHeight * 2 : -.035);
      gl.uniform1f(uniforms.uCrossing, crossing);
      gl.uniform1f(uniforms.uInteraction, interaction);
      gl.uniform2f(uniforms.uPointer, pointer.x, pointer.y);
      gl.uniform4f(uniforms.uTextRectA, ...textRects[0]);
      gl.uniform4f(uniforms.uTextRectB, ...textRects[1]);
      gl.drawArrays(gl.POINTS, 0, mainDrawCount);
      gl.drawArrays(gl.POINTS, data.count - 600, 600);
      renderCount++;
      // Sparse DOM diagnostics make lifecycle checks possible without exposing app internals.
      if (renderCount % 30 === 0 || !running) {
        canvas.dataset.frame = String(renderCount);
        canvas.dataset.morph = currentState.toFixed(3);
        canvas.dataset.originX = originX.toFixed(3);
        canvas.dataset.crossing = crossing.toFixed(3);
      }
    }
    function frame(now) {
      raf = 0;
      if (!running || !alive || lost) return;
      const elapsed = previous ? now - previous : 0;
      if (elapsed > 0 && elapsed < 200) {
        sampleFrames++; sampleMs += elapsed;
        if (sampleFrames === 120) {
          canvas.dataset.frameMs = (sampleMs / sampleFrames).toFixed(1);
          sampleFrames = 0; sampleMs = 0;
        }
      }
      const dt = previous ? Math.min(elapsed / 1000, .04) : 1 / 60;
      previous = now; time += dt;
      currentState += (targetState - currentState) * (1 - Math.exp(-dt * 12));
      for (const k of ['x', 'y']) {
        velocity[k] += ((pointerTarget[k] - pointer[k]) * 100 - velocity[k] * 20) * dt;
        pointer[k] += velocity[k] * dt;
      }
      interaction += (pointerTarget.active - interaction) * (1 - Math.exp(-dt * 6));
      draw(); raf = requestAnimationFrame(frame);
    }
    function resize() {
      const rect = canvas.getBoundingClientRect();
      renderWidth = Math.max(rect.width, 1); renderHeight = Math.max(rect.height, 1);
      isMobile = renderWidth <= 700; dpr = Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 1.8);
      mainDrawCount = Math.min(data.count - 600, isMobile ? 26000 : 52000);
      canvas.dataset.particles = String(mainDrawCount + 600);
      canvas.width = Math.round(renderWidth * dpr); canvas.height = Math.round(renderHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height); draw();
    }
    const api = {
      resize,
      setArtFrame(rect) { artFrame = rect; },
      setTextRects(rects) { textRects = rects; },
      setSceneOrigins(origins) { sceneOrigins = origins; },
      setState(value, instant = false) {
        targetState = value;
        if (instant || !running) { currentState = value; draw(); }
      },
      setPointer(x, y, active) {
        if (!running) return;
        if (!pointerTarget.active && active) { pointer.x = x; pointer.y = y; velocity.x = velocity.y = 0; }
        pointerTarget = {x, y, active: active ? 1 : 0};
      },
      setRunning(value) {
        wantsRunning = Boolean(value);
        running = Boolean(wantsRunning && alive && !lost);
        canvas.dataset.running = String(running);
        if (!running) { cancelAnimationFrame(raf); raf = 0; previous = 0; sampleFrames = 0; sampleMs = 0; interaction = 0; pointerTarget.active = 0; currentState = targetState; draw(); }
        else if (!raf) { previous = 0; raf = requestAnimationFrame(frame); }
      },
      destroy() { canvas.removeEventListener('webglcontextlost', onContextLost); canvas.removeEventListener('webglcontextrestored', onContextRestored); alive = false; cancelAnimationFrame(raf); buffers.forEach(b => gl.deleteBuffer(b)); if (program) gl.deleteProgram(program); },
    };
    const onContextLost = event => {
      event.preventDefault(); lost = true; cancelAnimationFrame(raf); raf = 0;
      canvas.dataset.running = 'false'; document.documentElement.classList.add('no-webgl');
    };
    const onContextRestored = () => {
      lost = false; buffers = [];
      try { build(); resize(); api.setRunning(wantsRunning); } catch { document.documentElement.classList.add('no-webgl'); }
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    try { build(); resize(); } catch (error) {
      console.warn('Particle renderer unavailable; using the static composition.', error.message);
      api.destroy(); document.documentElement.classList.add('no-webgl'); return null;
    }
    return api;
  }
