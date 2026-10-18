/* V10.1: magnetic icon edge alignment / collision avoidance. CAD is never changed.
   Pure positioning utility also exposed for QA; all coordinates are CAD SVG units. */
(()=>{'use strict';
const GAP=.20, EPS=0.00008, MAGNET_RANGE=.75;
const round=n=>Math.round(n*10000)/10000;
function dims(d,types){const t=typeof types==='function'?types(d.type):(types?.[d.type]||{});
 const s=Math.max(.5,Math.min(3,Number(d.size||t?.size||100)/100));
 const shape=d.shape||t?.shape||'circle', angle=(Number(d.rotation)||0)*Math.PI/180;
 const rX=(shape==='diamond'?1.15:shape==='hex'?1.04:1.05)*s;
 const rY=(shape==='square'?1.05:1.07)*s;
 // Rotation-aware bounding box. Two-dimensional marker extents stay outside the rotate group.
 const c=Math.abs(Math.cos(angle)),si=Math.abs(Math.sin(angle));
 const extX=rX*c+rY*si,extY=rX*si+rY*c;
 // Water badges and selected/all-visible labels are represented conservatively.
 const top=(d.type==='threeWay'&&d.waterSources?.length?.35:0);
 const bottom=d.showLabel===false?0:.26*s;
 return {x:extX+.08*s,y:extY+top+bottom+.08*s};
}
function collision(a,b,types,gap=GAP){const ap=dims(a,types),bp=dims(b,types);
 return Math.abs(a.x-b.x)<ap.x+bp.x+gap-EPS&&Math.abs(a.y-b.y)<ap.y+bp.y+gap-EPS;
}
function inside(p,edge){return p.x>=edge.minX&&p.x<=edge.maxX&&p.y>=edge.minY&&p.y<=edge.maxY;}
function solve(p,dev,others,types,opts={}){
 const edge=opts.bounds||{minX:-10,maxX:75,minY:-10,maxY:90};
 const on=opts.enabled!==false;
 const want={x:round(Number(p.x)),y:round(Number(p.y))};
 if(!Number.isFinite(want.x)||!Number.isFinite(want.y)||!inside(want,edge))return {ok:false,reason:'out-of-bounds'};
 if(!on)return {ok:true,...want,snapped:false,avoid:false};
 const moving={...dev,x:want.x,y:want.y},near=[];
 const me=dims(moving,types);
 for(const d of others||[]){if(d.id===dev.id)continue;const dim=dims(d,types);
  if(Math.abs(d.x-want.x)<=me.x+dim.x+9&&Math.abs(d.y-want.y)<=me.y+dim.y+9)near.push({d,dim});}
 const free=(p)=>inside(p,edge)&&!near.some(({d})=>collision({...moving,x:p.x,y:p.y},d,types));
 const hasOverlap=!free(want);
 // Snap only near an icon's outer edge, never teleport across the CAD on distant cursor motion.
 const suggestions=[];
 function add(x,y,other,style){const pp={x:round(x),y:round(y)};
  if(!inside(pp,edge))return;
  const dist=Math.hypot(pp.x-want.x,pp.y-want.y);
  suggestions.push({...pp,other,style,dist});}
 for(const {d,dim} of near){const dx=me.x+dim.x+GAP+.0002,dy=me.y+dim.y+GAP+.0002;
  // Side alignment: prefer the exact same row/column for neat rows of equipment.
  for(const sign of [-1,1]){
   const x=d.x+sign*dx,y=d.y+sign*dy;
   add(x,Math.abs(want.y-d.y)<1.15?d.y:want.y,d,'horizontal');
   add(Math.abs(want.x-d.x)<1.15?d.x:want.x,y,d,'vertical');
   // Tight clusters still have reachable diagonal holes.
   add(x,y,d,'corner');
  }
 }
 suggestions.sort((a,b)=>a.dist-b.dist||(['horizontal','vertical','corner'].indexOf(a.style)-['horizontal','vertical','corner'].indexOf(b.style)));
 if(!hasOverlap){for(const c of suggestions){
   if(c.dist<=MAGNET_RANGE && free(c) && c.style!=='corner')return {ok:true,x:c.x,y:c.y,snapped:true,avoid:false,targetId:c.other.id,axis:c.style};
  }return {ok:true,...want,snapped:false,avoid:false};}
 // For an occupied target try the closest free neighboring edge. Never overlap another icon.
 for(const c of suggestions){if(c.dist<8.5&&free(c))return {ok:true,x:c.x,y:c.y,snapped:true,avoid:true,targetId:c.other.id,axis:c.style};}
 // Dense layouts: spiral outward without moving any existing device.
 for(let r=.4;r<=8;r+=.35){const count=Math.max(12,Math.round(2*Math.PI*r/.32));
  for(let i=0;i<count;i++){const angle=2*Math.PI*i/count;const cp={x:round(want.x+r*Math.cos(angle)),y:round(want.y+r*Math.sin(angle))};if(free(cp))return {ok:true,...cp,snapped:false,avoid:true};}
 }
 return {ok:false,reason:'no-space'};
}
function overlapsFor(dev,devices,types){return (devices||[]).filter(d=>d.id!==dev.id&&collision(dev,d,types));}
window.HWIconMagnet={solve,collision,dims,overlapsFor,version:'V10.1'};
})();
