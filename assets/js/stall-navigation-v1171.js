/* V11.7.1 CAD gestures: pan first; inspect pens only when explicitly enabled.
   This module does not change CAD geometry, stored equipment or pen links. */
(function(){'use strict';
const canvas=document.getElementById('canvas'),svg=document.getElementById('plan'),viewer=document.querySelector('.viewer');
if(!canvas||!svg||!viewer)return;
const $=id=>document.getElementById(id);
const make=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
let mode='browse',selectedId='',selectedNode=null;
const pointers=new Map(),blockedClicks=[];
function hasAction(){return !!window.HWEquipment?.getAction?.()?.action;}
function isInspectMode(){return mode==='inspect';}
function setMode(next){mode=next==='inspect'?'inspect':'browse';viewer.classList.toggle('v1171-inspecting',isInspectMode());
  browseBtn.setAttribute('aria-pressed',String(!isInspectMode()));inspectBtn.setAttribute('aria-pressed',String(isInspectMode()));
  browseBtn.classList.toggle('active',!isInspectMode());inspectBtn.classList.toggle('active',isInspectMode());
  hint.textContent=isInspectMode()?'點一下欄格，先查看小資訊卡；拖曳仍只移動圖面':'自由拖曳／雙指縮放；點夾欄不會開視窗';
  hideCard();return mode;}
// Observe gestures at document capture level so pointer capture on #canvas cannot hide them.
document.addEventListener('pointerdown',e=>{
 if(!canvas.contains(e.target))return;
 if(e.pointerType==='mouse'&&e.button!==0)return;
 if(pointers.size===0)blockedClicks.length=0; // A new deliberate gesture must not inherit the previous drag's click guard.
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,prevX:e.clientX,prevY:e.clientY,kind:e.pointerType,downStall:e.target.closest?.('[data-stall-id]')||null,dragged:false,multi:false});
 if(pointers.size>1)for(const p of pointers.values())p.multi=true;
},true);
document.addEventListener('pointermove',e=>{
 const p=pointers.get(e.pointerId);if(!p)return;
 p.prevX=e.clientX;p.prevY=e.clientY;
 if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>(p.kind==='mouse'?8:12))p.dragged=true;
},true);
function finishGesture(e){const p=pointers.get(e.pointerId);if(!p)return;
 pointers.delete(e.pointerId);
 const moved=p.dragged||p.multi||Math.hypot(e.clientX-p.x,e.clientY-p.y)>(p.kind==='mouse'?8:12);
 if(moved){blockedClicks.push({x:e.clientX,y:e.clientY,expires:performance.now()+360});}
 // The viewer takes pointer capture for panning. Consequently pointerup/click can be
 // retargeted to #canvas even when pointerdown correctly hit a pen. Remember that
 // original pen and decide only after verifying that this really was a stationary tap.
 if(!moved&&p.downStall&&isInspectMode()&&!hasAction()){
  const id=p.downStall.getAttribute('data-stall-id');if(id)showStall(id,p.downStall);
 }
}
document.addEventListener('pointerup',finishGesture,true);
document.addEventListener('pointercancel',finishGesture,true);
document.addEventListener('click',e=>{
 if(!canvas.contains(e.target)||e.detail===0)return;
 const now=performance.now();for(let i=blockedClicks.length-1;i>=0;i--)if(blockedClicks[i].expires<now)blockedClicks.splice(i,1);
 const index=blockedClicks.findIndex(p=>Math.hypot(p.x-e.clientX,p.y-e.clientY)<36);
 if(index>=0){blockedClicks.splice(index,1);e.preventDefault();e.stopImmediatePropagation();}
},true);
const switcher=make('div','v1171-mode');switcher.id='v1171Mode';switcher.setAttribute('role','group');switcher.setAttribute('aria-label','CAD 操作方式');
const browseBtn=make('button','v1171-mode-btn active','✋ 瀏覽／拖曳'),inspectBtn=make('button','v1171-mode-btn','⌖ 欄格查詢');
for(const b of [browseBtn,inspectBtn])b.type='button';
browseBtn.setAttribute('aria-pressed','true');inspectBtn.setAttribute('aria-pressed','false');
browseBtn.onclick=()=>setMode('browse');inspectBtn.onclick=()=>setMode('inspect');
switcher.append(browseBtn,inspectBtn);
const hint=make('div','v1171-hint');hint.id='v1171Hint';hint.textContent='自由拖曳／雙指縮放；點夾欄不會開視窗';
const nav=make('div','v1171-top-controls');nav.append(switcher,hint);viewer.appendChild(nav);
const card=make('section','v1171-card');card.id='v1171Card';card.hidden=true;card.setAttribute('aria-label','欄格快速資訊');
const top=make('div','v1171-card-header'),heading=make('div','v1171-card-title');
const title=make('strong','','尚未選取'),subtitle=make('small','','');heading.append(title,subtitle);
const close=make('button','v1171-card-close','×');close.type='button';close.title='關閉欄格資訊';close.setAttribute('aria-label','關閉欄格資訊');close.onclick=hideCard;
top.append(heading,close);
const content=make('div','v1171-card-content');const footer=make('div','v1171-card-actions');
const full=make('button','v1171-card-detail','查看設備詳情 →');full.type='button';full.onclick=()=>{
 if(!selectedId)return;const id=selectedId,node=selectedNode;
 setMode('browse');if(window.HWStallLinks?.handleStallClick)window.HWStallLinks.handleStallClick(id,node);
};
const dismiss=make('button','v1171-card-done','完成查詢');dismiss.type='button';dismiss.onclick=()=>setMode('browse');
footer.append(dismiss,full);card.append(top,content,footer);viewer.appendChild(card);
function hideCard(){selectedId='';selectedNode=null;card.hidden=true;document.body.classList.remove('v1171-card-open');svg.querySelectorAll('.v1171-selected-stall').forEach(el=>el.classList.remove('v1171-selected-stall'));window.HWStallGeometry?.clear?.();}
function showStall(id,node){if(!isInspectMode()||hasAction())return false;
 hideCard();selectedId=id;selectedNode=node;node?.classList.add('v1171-selected-stall');
 const label=window.HWStallLinks?.label?.(id)||id;
 title.textContent=label;subtitle.textContent=id;
 content.replaceChildren();const linked=window.HWStallLinks?.linksFor?.(id)||[];
 if(!linked.length){content.append(make('p','','尚未建立設備關聯（不代表現場沒有設備）'));}
 else{content.append(make('p','',`已建立 ${linked.length} 筆設備關聯`));
  for(const entry of linked.slice(0,4)){const d=entry.device;content.append(make('div','v1171-linked',d?`${d.name} · ${d.zone||'未填區域'}`:`⚠ 失效設備：${entry.id}`));}
  if(linked.length>4)content.append(make('small','',`還有 ${linked.length-4} 筆，詳情內可查看`));}
 card.hidden=false;document.body.classList.add('v1171-card-open');return true;
}
svg.addEventListener('click',e=>{if(isInspectMode()&&!e.target.closest?.('[data-stall-id]')&&!card.hidden)hideCard();});
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape')return;
 if(!card.hidden||isInspectMode()){setMode('browse');e.preventDefault();}
});
// Explicit mode only, no persistence: each new session starts safe in browse mode.
window.HWStallNavigation={version:'11.7.1',isInspectMode,getMode:()=>mode,setMode,showStall,hideCard};
})();
