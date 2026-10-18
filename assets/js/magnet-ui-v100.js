/* V10.1 subtle magnetic placement controls and CAD alignment guide. */
(()=>{'use strict';
const api=window.HWEquipment, map=document.getElementById('plan'), viewer=document.querySelector('.viewer');
if(!api||!map||!viewer)return;
const el=(tag,cls,content)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(content)n.textContent=content;return n;};
const box=el('div','v100-magnet-box'),toggle=el('button','v100-magnet-toggle'),hint=el('div','v100-magnet-hint');
toggle.type='button';toggle.setAttribute('aria-label','切換設備圖標磁吸防重疊');hint.hidden=true;hint.setAttribute('role','status');
box.append(toggle,hint);viewer.append(box);
function label(){const enabled=api.getIconMagnetEnabled();toggle.textContent=enabled?'🧲 圖標吸附：開':'圖標吸附：關';toggle.setAttribute('aria-pressed',String(enabled));toggle.title=enabled?'圖標會貼齊鄰近設備並避免重疊，點擊可暫時關閉':'目前自由定位，可能與其他設備重疊，點擊重新啟用';}
toggle.onclick=()=>{api.setIconMagnetEnabled(!api.getIconMagnetEnabled());label();};
const NS='http://www.w3.org/2000/svg',g=document.createElementNS(NS,'g');g.id='v100Guide';g.setAttribute('pointer-events','none');g.style.display='none';
const guide=document.createElementNS(NS,'line');guide.classList.add('v100-guide-line');const ring=document.createElementNS(NS,'circle');ring.classList.add('v100-guide-ring');ring.setAttribute('r','.31');g.append(guide,ring);map.append(g);
let hideTimer;
function showMessage(txt){hint.textContent=txt;hint.hidden=false;clearTimeout(hideTimer);hideTimer=setTimeout(()=>{hint.hidden=true;},1900);}
function draw(p){if(!p?.ok||!p.targetId||!p.snapped||!api.getIconMagnetEnabled()){g.style.display='none';return;}
 const d=api.getData().devices.find(x=>x.id===p.targetId);if(!d){g.style.display='none';return;}
 guide.setAttribute('x1',Number.isFinite(d.displayX)?d.displayX:d.x);guide.setAttribute('y1',Number.isFinite(d.displayY)?d.displayY:d.y);guide.setAttribute('x2',p.x);guide.setAttribute('y2',p.y);
 ring.setAttribute('cx',p.x);ring.setAttribute('cy',p.y);g.style.display='';
}
window.addEventListener('hw-v100-magnet',e=>{const p=e.detail||{};
 if(p.mode==='toggle'){label();g.style.display='none';if(p.enabled)showMessage('已啟用設備自動貼齊與防重疊');return;}
 if(p.mode==='end'){g.style.display='none';return;}
 draw(p);
 if(p.mode==='place'&&p.snapped)showMessage(p.avoid?'此處已有設備，已移至旁邊避免重疊':'已與鄰近圖標貼齊');
});
map.addEventListener('pointermove',e=>{const a=api.getAction();if(a.action!=='place'||api.getRole()!=='admin'||!api.getIconMagnetEnabled()){if(a.action!=='route')g.style.display='none';return;}
 const m=map.getScreenCTM();if(!m)return;const pt=map.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const c=pt.matrixTransform(m.inverse());draw(api.getIconMagnetPreview(a.actionType,c.x,c.y));
},{passive:true});
map.addEventListener('pointerleave',()=>g.style.display='none');
window.addEventListener('hw-v90-change',()=>{
 box.hidden=api.getRole()!=='admin'||api.getWorkspace()!=='equipment';
 if(box.hidden)g.style.display='none';
});
box.hidden=api.getRole()!=='admin'||api.getWorkspace()!=='equipment';label();
})();
