/* V11.8.6 — free CAD pan/zoom and real-device/route selection.
   Sow crates and individual gilt pens are CAD reference geometry, NOT clickable equipment.
   Their ID geometry and opt-in search/binding services remain intact. */
(function(){'use strict';
const canvas=document.getElementById('canvas'),svg=document.getElementById('plan');
if(!canvas||!svg)return;
const pointers=new Map(), ignoredClicks=[];
const threshold=kind=>kind==='mouse'?7:11;
const editing=()=>Boolean(window.HWEquipment?.getAction?.()?.action);
const targetAt=(e,sel)=>e.target.closest?.(sel)||null;
const noop=()=>false;
function clear(){pointers.clear();ignoredClicks.length=0;}
document.addEventListener('pointerdown',e=>{
 if(!canvas.contains(e.target)||(e.pointerType==='mouse'&&e.button!==0))return;
 // Pointer tracking is used to distinguish taps from dragging.
 if(!pointers.size)ignoredClicks.length=0;
 pointers.set(e.pointerId,{
   device:targetAt(e,'[data-eq-device]'),
   route:targetAt(e,'[data-eq-route]'),
   x:e.clientX,y:e.clientY,kind:e.pointerType,multi:false,moved:false
 });
 if(pointers.size>1)for(const p of pointers.values())p.multi=true;
},true);
document.addEventListener('pointermove',e=>{
 const p=pointers.get(e.pointerId);if(!p)return;
 if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>threshold(p.kind))p.moved=true;
},true);
function end(e,cancelled){
 const p=pointers.get(e.pointerId);if(!p)return;
 pointers.delete(e.pointerId);
 const moved=cancelled||p.moved||p.multi||Math.hypot(e.clientX-p.x,e.clientY-p.y)>threshold(p.kind);
 if(moved){ignoredClicks.push({x:e.clientX,y:e.clientY,expires:performance.now()+520});return;}
 if(editing())return;
 // Only real equipment and piping are selected by direct tap.
 // A tap on a crate, a pen divider, or blank floor leaves equipment windows closed.
 if(p.device){window.HWEquipment?.select?.('device',p.device.getAttribute('data-eq-device'));}
 else if(p.route){window.HWEquipment?.select?.('route',p.route.getAttribute('data-eq-route'));}
 if(p.device||p.route)ignoredClicks.push({x:e.clientX,y:e.clientY,expires:performance.now()+520});
}
document.addEventListener('pointerup',e=>end(e,false),true);
document.addEventListener('pointercancel',e=>end(e,true),true);
document.addEventListener('click',e=>{
 if(!canvas.contains(e.target)||e.detail===0)return;
 const now=performance.now();
 for(let i=ignoredClicks.length-1;i>=0;i--)if(ignoredClicks[i].expires<now)ignoredClicks.splice(i,1);
 const idx=ignoredClicks.findIndex(p=>Math.hypot(p.x-e.clientX,p.y-e.clientY)<36);
 if(idx>=0){ignoredClicks.splice(idx,1);e.preventDefault();e.stopImmediatePropagation();}
},true);
window.addEventListener('blur',clear);
// Compatibility for legacy SVG click handler: handling is deliberately passive;
// search and system-service bindings may still explicitly open their own panels.
window.HWStallNavigation={version:'11.8.6',handlesTap:true,isInspectMode:()=>false,
 getMode:()=> 'passive',showStall:noop,hideCard:()=>{window.HWStallGeometry?.clear?.();}};
})();
