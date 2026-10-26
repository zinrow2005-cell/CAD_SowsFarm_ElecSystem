/* V11.12.13: device-perimeter line anchors. Geometric only; never implies a verified circuit. */
(function(root){'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=v=>Number.isFinite(Number(v));
const round=n=>Math.round(n*10000)/10000;
const AXIS=v=>Math.max(.3,Math.min(3,(Number(v)||100)/100));
function dims(d){
 const scale=(Number(d.size)||75)/100,rotation=(Number(d.rotation)||0)*Math.PI/180;
 const seg=d.segment?.enabled?d.segment:null,arr=d.array?.enabled?d.array:null;
 const length=seg?Number(seg.length)||6:arr?1.65+(Math.max(2,Number(arr.count)||3)-1)*(Number(arr.spacing)||2.3):0;
 const thick=seg?Number(seg.thickness)||.65:arr?1.65:0;
 return {x:finite(d.displayX)?Number(d.displayX):Number(d.x)||0,y:finite(d.displayY)?Number(d.displayY):Number(d.y)||0,
  rx:length?Math.max(.1,length/2):Math.max(.1,scale*AXIS(d.widthScale)*({diamond:1.13,hex:.96,square:.91,circle:.92}[d.shape]||{diamond:1.13,hex:.96,square:.91,circle:.92}[d.defaultShape]||.92)),
  ry:length?Math.max(.09,thick/2):Math.max(.1,scale*AXIS(d.heightScale)*({diamond:1.13,hex:1.08,square:.91,circle:.92}[d.shape]||{diamond:1.13,hex:1.08,square:.91,circle:.92}[d.defaultShape]||.92)),
  rotation,shape:length?'rect':(d.shape||d.defaultShape||'circle')};
}
function local(d,pt){const box=dims(d),dx=Number(pt.x)-box.x,dy=Number(pt.y)-box.y,c=Math.cos(box.rotation),s=Math.sin(box.rotation);return {u:(c*dx+s*dy)/box.rx,v:(-s*dx+c*dy)/box.ry};}
function fromLocal(d,edge){const b=dims(d),c=Math.cos(b.rotation),s=Math.sin(b.rotation),x=Number(edge.u)*b.rx,y=Number(edge.v)*b.ry;return{x:round(b.x+c*x-s*y),y:round(b.y+s*x+c*y)};}
function vertices(shape){
 if(shape==='diamond')return [[0,-1],[1,0],[0,1],[-1,0]];
 if(shape==='hex')return [[0,-1],[1,-.5],[1,.5],[0,1],[-1,.5],[-1,-.5]];
 return [[-1,-1],[1,-1],[1,1],[-1,1]];
}
function boundary(d,pt){const b=dims(d),v=local(d,pt);let u,vv;
 if(b.shape==='circle'){const norm=Math.hypot(v.u,v.v);u=norm>1e-7?v.u/norm:1;vv=norm>1e-7?v.v/norm:0;}
 else{let best=Infinity;for(const [i,a] of vertices(b.shape).entries()){
   const verts=vertices(b.shape),z=verts[(i+1)%verts.length];
   const dx=(z[0]-a[0])*b.rx,dy=(z[1]-a[1])*b.ry;
   const t=clamp(((v.u-a[0])*b.rx*dx+(v.v-a[1])*b.ry*dy)/Math.max(1e-10,dx*dx+dy*dy),0,1);
   const cu=a[0]+(z[0]-a[0])*t,cv=a[1]+(z[1]-a[1])*t;
   const distance=((cu-v.u)*b.rx)**2+((cv-v.v)*b.ry)**2;
   if(distance<best){best=distance;u=cu;vv=cv;}
  }
 }
 const edge={u:round(u),v:round(vv)};
 return {...fromLocal(d,edge),edge};
}
function resolve(d,edge){if(!edge||!finite(edge.u)||!finite(edge.v))return null;
 return fromLocal(d,boundary(d,fromLocal(d,{u:clamp(Number(edge.u),-1.2,1.2),v:clamp(Number(edge.v),-1.2,1.2)})).edge);
}
function inside(d,pt){const b=dims(d),v=local(d,pt),u=Math.abs(v.u),y=Math.abs(v.v);
 if(b.shape==='circle')return v.u*v.u+v.v*v.v<=1.15;
 if(b.shape==='diamond')return u+y<=1.12;
 if(b.shape==='hex')return y<=1.1&&u<=1.1&&u*.5+y<=1.12;
 return u<=1.06&&y<=1.06;
}
root.HWRouteAnchorsV111213={dims,local,fromLocal,boundary,resolve,inside};
})(window);
