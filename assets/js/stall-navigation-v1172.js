/* V11.8.5 — unified CAD interactions: pan anywhere, tap selects, no mode switch.
   Never modifies stall locations or stored device coordinates. */
(function(){'use strict';
const canvas=document.getElementById('canvas'),svg=document.getElementById('plan'),viewer=document.querySelector('.viewer');
if(!canvas||!svg||!viewer)return;
const make=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
const pointers=new Map();const ignoredClicks=[];
const threshold=t=>t==='mouse'?7:11;
const action=()=>Boolean(window.HWEquipment?.getAction?.()?.action);
let selectedId='',selectedNode=null;
const card=make('section','v1171-card');card.id='v1171Card';card.hidden=true;card.setAttribute('aria-label','欄格快速資訊');
const top=make('div','v1171-card-header'),heading=make('div','v1171-card-title');
const title=make('strong','','尚未選取'),subtitle=make('small','','');heading.append(title,subtitle);
const close=make('button','v1171-card-close','×');close.type='button';close.setAttribute('aria-label','關閉欄格資訊');close.onclick=hideCard;top.append(heading,close);
const content=make('div','v1171-card-content'),footer=make('div','v1171-card-actions');
const full=make('button','v1171-card-detail','查看設備詳情 →');full.type='button';full.onclick=()=>{
 if(!selectedId)return;const id=selectedId,node=selectedNode;hideCard();window.HWStallLinks?.handleStallClick?.(id,node);
};
const dismiss=make('button','v1171-card-done','關閉資訊');dismiss.type='button';dismiss.onclick=hideCard;
footer.append(dismiss,full);card.append(top,content,footer);viewer.appendChild(card);
function hideCard(){selectedId='';selectedNode=null;card.hidden=true;document.body.classList.remove('v1171-card-open');svg.querySelectorAll('.v1171-selected-stall').forEach(n=>n.classList.remove('v1171-selected-stall'));window.HWStallGeometry?.clear?.();}
function showStall(id,node){if(action()||!id)return false;
 hideCard();selectedId=id;selectedNode=node;node?.classList.add('v1171-selected-stall');
 title.textContent=window.HWStallLinks?.label?.(id)||id;subtitle.textContent=id;content.replaceChildren();
 const linked=window.HWStallLinks?.linksFor?.(id)||[];
 if(!linked.length)content.append(make('p','','尚未建立設備關聯（不代表現場沒有設備）'));
 else {content.append(make('p','',`已建立 ${linked.length} 筆設備關聯`));
   for(const entry of linked.slice(0,4)){const d=entry.device;content.append(make('div','v1171-linked',d?`${d.name} · ${d.zone||'未填區域'}`:`⚠ 失效設備：${entry.id}`));}
   if(linked.length>4)content.append(make('small','',`還有 ${linked.length-4} 筆，可開啟詳情查看`));
 }
 card.hidden=false;document.body.classList.add('v1171-card-open');return true;
}
function elementAtDown(e,sel){return e.target.closest?.(sel)||null;}
function reset(){pointers.clear();ignoredClicks.length=0;}
document.addEventListener('pointerdown',e=>{
 if(!canvas.contains(e.target))return;
 if(e.pointerType==='mouse'&&e.button!==0)return;
 // Alt+mouse-drag is explicitly reserved for administrator icon repositioning.
 if(e.altKey&&e.pointerType==='mouse'&&elementAtDown(e,'[data-eq-device]'))return;
 if(!pointers.size)ignoredClicks.length=0;
 const target={stall:elementAtDown(e,'[data-stall-id]'),device:elementAtDown(e,'[data-eq-device]'),route:elementAtDown(e,'[data-eq-route]')};
 pointers.set(e.pointerId,{...target,x:e.clientX,y:e.clientY,kind:e.pointerType,multi:false,moved:false});
 if(pointers.size>1)for(const p of pointers.values())p.multi=true;
},true);
document.addEventListener('pointermove',e=>{
 const p=pointers.get(e.pointerId);if(!p)return;
 if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>threshold(p.kind))p.moved=true;
},true);
function end(e,cancelled){const p=pointers.get(e.pointerId);if(!p)return;
 pointers.delete(e.pointerId);
 const dragged=cancelled||p.moved||p.multi||Math.hypot(e.clientX-p.x,e.clientY-p.y)>threshold(p.kind);
 if(dragged){ignoredClicks.push({x:e.clientX,y:e.clientY,expires:performance.now()+520});return;}
 // The canvas captures pointers to pan; the click target may be retargeted to
 // #canvas. Rely on original pointerdown target instead of the subsequent click.
 if(action())return;
 if(p.device){hideCard();window.HWEquipment?.select?.('device',p.device.getAttribute('data-eq-device'));}
 else if(p.stall){showStall(p.stall.getAttribute('data-stall-id'),p.stall);}
 else if(p.route){hideCard();window.HWEquipment?.select?.('route',p.route.getAttribute('data-eq-route'));}
 else if(!e.target.closest?.('[data-facility-id]'))hideCard();
 if(p.device||p.stall||p.route)ignoredClicks.push({x:e.clientX,y:e.clientY,expires:performance.now()+520});
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
window.addEventListener('blur',reset);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!card.hidden){hideCard();e.preventDefault();}});
// Kept as compatibility API for CAD links; no browse/inspect mode exists.
window.HWStallNavigation={version:'11.8.5',handlesTap:true,isInspectMode:()=>true,getMode:()=> 'automatic',showStall,hideCard};
})();
