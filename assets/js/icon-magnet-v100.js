/* V11.9.8 — continuous outline-to-outline magnetic snapping.
 * Every visible segment is a snap target, not just corners or center-aligned anchors.
 * DisplayX/displayY only: real CAD device coordinates and route endpoints stay unchanged.
 */
(()=>{'use strict';
const EPS=.00022;
const round=n=>Math.round(n*10000)/10000;
const clamp=(v,a,b)=>Math.max(a,Math.min(v,b));
const dot=(p,n)=>p.x*n.x+p.y*n.y;
const meta=(d,types)=>typeof types==='function'?(types(d.type)||{}):(types?.[d.type]||{});
const size=(d,types)=>clamp(Number(d.size||meta(d,types).size||100)/100,.5,3);
const clearance=(a,b,types)=>round(clamp(.045*Math.min(size(a,types),size(b,types)),.025,.095));
const points=(d,types)=>{
 const s=size(d,types),sh=d.shape||meta(d,types).shape||'circle';
 let raw;
 if(sh==='diamond'){
  const r=1.185;raw=[{x:0,y:-r},{x:r,y:0},{x:0,y:r},{x:-r,y:0}];
 }else if(sh==='square'){
  const r=.965;raw=[{x:-r,y:-r},{x:r,y:-r},{x:r,y:r},{x:-r,y:r}];
 }else if(sh==='hex'){
  raw=[[-1.015,-.57],[0,-1.135],[1.015,-.57],[1.015,.57],[0,1.135],[-1.015,.57]].map(([x,y])=>({x,y}));
 }else{
  // Dense convex perimeter so circular symbols can stick to any tangent point.
  raw=Array.from({length:48},(_,i)=>{const a=2*Math.PI*i/48;return{x:.975*Math.cos(a),y:.975*Math.sin(a)};});
 }
 const theta=Number(d.rotation||0)*Math.PI/180,c=Math.cos(theta),sn=Math.sin(theta);
 return raw.map(p=>({x:s*(p.x*c-p.y*sn),y:s*(p.x*sn+p.y*c)}));
};
const bounds=poly=>poly.reduce((b,v)=>({minX:Math.min(b.minX,v.x),maxX:Math.max(b.maxX,v.x),minY:Math.min(b.minY,v.y),maxY:Math.max(b.maxY,v.y)}),{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity});
function regions(d,types){const b=bounds(points(d,types));return[{x0:b.minX,x1:b.maxX,y0:b.minY,y1:b.maxY,part:'icon'}];}
function dims(d,types){const b=bounds(points(d,types));return{...b,x:Math.max(-b.minX,b.maxX),y:Math.max(-b.minY,b.maxY),size:size(d,types),regions:regions(d,types)};}
function project(poly,x,y,axis){let min=Infinity,max=-Infinity;for(const p of poly){const v=(p.x+x)*axis.x+(p.y+y)*axis.y;min=Math.min(min,v);max=Math.max(max,v);}return{min,max};}
function polygonCollision(a,polyA,b,polyB,gap){
 const ba=bounds(polyA),bb=bounds(polyB);
 if(a.x+ba.maxX+gap<=b.x+bb.minX+EPS||b.x+bb.maxX+gap<=a.x+ba.minX+EPS||
    a.y+ba.maxY+gap<=b.y+bb.minY+EPS||b.y+bb.maxY+gap<=a.y+ba.minY+EPS)return false;
 for(const poly of [polyA,polyB]){
  for(let i=0;i<poly.length;i++){
   const u=poly[i],v=poly[(i+1)%poly.length],dx=v.x-u.x,dy=v.y-u.y,len=Math.hypot(dx,dy);
   if(len<1e-10)continue;
   const axis={x:dy/len,y:-dx/len};
   const pa=project(polyA,a.x,a.y,axis),pb=project(polyB,b.x,b.y,axis);
   if(pa.max+gap<=pb.min+EPS||pb.max+gap<=pa.min+EPS)return false;
  }
 }
 return true;
}
function collision(a,b,types,gap){return polygonCollision(a,points(a,types),b,points(b,types),Number.isFinite(gap)?gap:clearance(a,b,types));}
function inside(p,limit){return p.x>=limit.minX&&p.x<=limit.maxX&&p.y>=limit.minY&&p.y<=limit.maxY;}
function solve(p,dev,others,types,opts={}){
 const limit=opts.bounds||{minX:-10,maxX:75,minY:-10,maxY:90};
 const want={x:round(Number(p.x)),y:round(Number(p.y))};
 if(!Number.isFinite(want.x)||!Number.isFinite(want.y)||!inside(want,limit))return{ok:false,reason:'out-of-bounds'};
 if(opts.enabled===false)return{ok:true,...want,snapped:false,avoid:false};
 const moving={...dev,...want},mp=points(moving,types),mb=bounds(mp),ms=size(moving,types);
 // Lazily build expensive rotated polygons only for objects near a candidate.
 // Large farms may have hundreds of devices elsewhere on the CAD: distant icons
 // must not slow every pointermove on phones and tablets.
 const around=(others||[]).filter(d=>d.id!==dev.id).map(d=>({d,poly:null,scale:size(d,types),gap:clearance(moving,d,types)}));
 const getPoly=o=>o.poly||(o.poly=points(o.d,types));
 const free=pt=>inside(pt,limit)&&!around.some(o=>{
  // Conservative AABB prefilter before building the target polygon.
  const bound=1.60*o.scale+o.gap;
  if(Math.abs(pt.x-o.d.x)>Math.max(-mb.minX,mb.maxX)+bound||
     Math.abs(pt.y-o.d.y)>Math.max(-mb.minY,mb.maxY)+bound)return false;
  return polygonCollision({...moving,...pt},mp,o.d,getPoly(o),o.gap);
 });
 const overlapped=!free(want);
 const candidates=[];
 // Face projection is continuous along the tangent: DO NOT move/align to the other device center.
 for(const o of around){
  const {d,gap}=o,span=ms+o.scale;
  if(Math.abs(d.x-want.x)>Math.max(-mb.minX,mb.maxX)+1.6*o.scale+2.4*span||
     Math.abs(d.y-want.y)>Math.max(-mb.minY,mb.maxY)+1.6*o.scale+2.4*span)continue;
  const poly=getPoly(o);
  const add=(x,y,style,edgeIndex)=>{
   const q={x:round(x),y:round(y)};if(!inside(q,limit))return;
   const distance=Math.hypot(q.x-want.x,q.y-want.y);
   candidates.push({...q,dist:distance,other:d,style,edgeIndex});
  };
  for(let i=0;i<poly.length;i++){
   const v1=poly[i],v2=poly[(i+1)%poly.length];
   const dx=v2.x-v1.x,dy=v2.y-v1.y,length=Math.hypot(dx,dy);
   if(length<.00001)continue;
   // Vertices are consistently clockwise in screen coordinates, so (dy,-dx) points outward.
   const n={x:dy/length,y:-dx/length},t={x:dx/length,y:dy/length};
   const centerDirection=(want.x-d.x)*n.x+(want.y-d.y)*n.y;
   if(centerDirection<-.08*span)continue;
   const targetLine=dot({x:d.x+v1.x,y:d.y+v1.y},n);
   const support=project(mp,want.x,want.y,n);
   const shift=targetLine+gap-support.min;
   // A face is valid at ANY offset along the edge where the outlines' tangents overlap.
   // Preserve user-selected tangential position. This is what enables side-to-side sliding.
   const extreme=mp.filter(v=>Math.abs(dot({x:v.x+want.x,y:v.y+want.y},n)-support.min)<.0015);
   const at=extreme.map(v=>dot({x:v.x+want.x,y:v.y+want.y},t));
   const fixedT1=dot({x:d.x+v1.x,y:d.y+v1.y},t),fixedT2=dot({x:d.x+v2.x,y:d.y+v2.y},t);
   const touchMin=Math.min(...at),touchMax=Math.max(...at);
   if(touchMax<Math.min(fixedT1,fixedT2)-.001||touchMin>Math.max(fixedT1,fixedT2)+.001)continue;
   add(want.x+shift*n.x,want.y+shift*n.y,'edge',i);
  }
  // Corner touching the middle of an edge is supported, but never takes priority
  // over a closer, continuous edge-to-edge position.
  if(overlapped){
   for(let i=0;i<poly.length;i++){
    const v1=poly[i],v2=poly[(i+1)%poly.length];
    const dx=v2.x-v1.x,dy=v2.y-v1.y,len2=dx*dx+dy*dy;
    if(len2<.0001)continue;
    const len=Math.sqrt(len2),n={x:dy/len,y:-dx/len};
    for(const point of mp){
     const a={x:want.x+point.x,y:want.y+point.y},b={x:d.x+v1.x,y:d.y+v1.y};
     const u=((a.x-b.x)*dx+(a.y-b.y)*dy)/len2;
     if(u<.02||u>.98)continue;
     const perpendicular=(b.x-a.x)*n.x+(b.y-a.y)*n.y;
     if(Math.abs(perpendicular)>3.8*span)continue;
     add(want.x+(perpendicular+gap)*n.x,want.y+(perpendicular+gap)*n.y,'edge-point',i);
    }
   }
  }
 }
 candidates.sort((a,b)=>a.dist-b.dist||(a.style==='edge'?-1:1));
 if(!overlapped){
  for(const c of candidates){
   const targetScale=size(c.other,types);
   if(c.dist>clamp(.34*(ms+targetScale),.35,2.2))break;
   if(free(c))return{ok:true,x:c.x,y:c.y,snapped:true,avoid:false,targetId:c.other.id,axis:c.style,edge:c.edgeIndex};
  }
  return{ok:true,...want,snapped:false,avoid:false};
 }
 const maxMove=clamp(2.2*(ms+3)+Math.max(Math.abs(mb.minX),mb.maxX,Math.abs(mb.minY),mb.maxY),5,24);
 for(const c of candidates){
  if(c.dist>maxMove)break;
  if(free(c))return{ok:true,x:c.x,y:c.y,snapped:true,avoid:true,targetId:c.other.id,axis:c.style,edge:c.edgeIndex};
 }
 // Crowded layout fallback: find a legal position without moving real CAD coordinates.
 const inc=clamp(.25*ms,.22,.72),radius=clamp(4+2.8*ms,5.4,15);
 for(let r=inc;r<=radius;r+=inc){
  const count=clamp(Math.round(2*Math.PI*r/inc),20,100);
  for(let i=0;i<count;i++){
   const theta=2*Math.PI*i/count,cp={x:round(want.x+r*Math.cos(theta)),y:round(want.y+r*Math.sin(theta))};
   if(free(cp))return{ok:true,...cp,snapped:false,avoid:true};
  }
 }
 return{ok:false,reason:'no-space'};
}
function overlapsFor(dev,devices,types){return(devices||[]).filter(d=>d.id!==dev.id&&collision(dev,d,types));}
window.HWIconMagnet={solve,collision,dims,regions,clearance,overlapsFor,version:'V11.9.8'};
})();
