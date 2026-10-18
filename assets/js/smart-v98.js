/* V9.8 智慧連線 + 跨系統設備關聯：不改動 CAD SVG 底圖。 */
(()=>{'use strict';
const api=window.HWEquipment, map=document.getElementById('plan'), viewer=document.querySelector('.viewer');
if(!api||!map||!viewer)return;
const SVG='http://www.w3.org/2000/svg';
const colors={water:'#67cfff',electric:'#f7bd69',feed:'#f5a078',ventilation:'#94b4c1'};
const labels={water:'水管',electric:'電線',feed:'飼料管',ventilation:'舊通風示意'};
const el=(t,cls,txt)=>{const e=document.createElement(t);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
const sEl=(t,attributes={})=>{const e=document.createElementNS(SVG,t);Object.entries(attributes).forEach(([k,v])=>e.setAttribute(k,v));return e;};
const graphLayer=sEl('g',{'id':'v98SnapLayer','pointer-events':'none','aria-hidden':'true'});
const ghostLine=sEl('path',{fill:'none',stroke:'#abf9da','stroke-width':'.17','stroke-dasharray':'.28 .14'});
const ghostCircle=sEl('circle',{r:'.28',fill:'#102c39',stroke:'#abf9da','stroke-width':'.15'});
graphLayer.append(ghostLine,ghostCircle);map.append(graphLayer);graphLayer.style.display='none';
const hint=el('div','v98-snap-hint');hint.id='v98SnapHint';hint.hidden=true;viewer.appendChild(hint);
function point(ev){const ctm=map.getScreenCTM();if(!ctm)return null;const p=map.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;return p.matrixTransform(ctm.inverse());}
function actualPoint(pt){return {x:pt.x,y:pt.y};}
function redrawCursor(ev){
 const act=api.getAction();if(act.action!=='route'||!['water','electric','feed'].includes(act.actionType)||api.getRole()!=='admin'||api.getWorkspace()!=='equipment'){
  graphLayer.style.display='none';hint.hidden=true;return;
 }
 const p=point(ev);if(!p)return;
 const target=api.getSmartSnap(p.x,p.y,act.actionType,true),end=target?actualPoint(target):actualPoint(p);
 const nodes=api.getDrawing(),start=nodes.at(-1);
 graphLayer.style.display='';graphLayer.style.stroke=colors[act.actionType]||'#abf9da';
 ghostCircle.setAttribute('cx',end.x);ghostCircle.setAttribute('cy',end.y);
 ghostCircle.setAttribute('stroke',target?colors[act.actionType]:'#87afb8');
 ghostCircle.setAttribute('r',target?'.34':'.13');
 if(start)ghostLine.setAttribute('d',`M ${start.x} ${start.y} L ${end.x} ${end.y}`);else ghostLine.setAttribute('d','');
 hint.textContent=target?(target.kind==='junction'?'分支吸附：'+target.name+'（點一下可建立接點）':'已吸附：'+target.name):'點圖面增加轉折點；點設備完成連線';
 hint.hidden=false;
 const bounds=viewer.getBoundingClientRect();
 hint.style.left=Math.min(Math.max(8,ev.clientX-bounds.left+14),Math.max(8,bounds.width-225))+'px';
 hint.style.top=Math.min(Math.max(8,ev.clientY-bounds.top+18),Math.max(8,bounds.height-64))+'px';
}
map.addEventListener('pointermove',redrawCursor,{passive:true});
map.addEventListener('pointerleave',()=>{graphLayer.style.display='none';hint.hidden=true;});
const card=el('section','v98-card');card.id='v98DeviceCard';card.hidden=true;card.setAttribute('aria-label','所選設備與跨系統連接');
card.innerHTML=`<div class="v98-card-head"><div><small>V10.1｜設備快速檢視</small><strong id="v98DeviceTitle"></strong></div><button id="v98CardClose" type="button" title="收起檢視卡" aria-label="收起設備檢視卡">×</button></div>
<div class="v98-actions"><button type="button" id="v98Record">設備檔案</button><button type="button" id="v98Photos">照片標記</button><button type="button" id="v98Links">連接關係</button></div>
<div class="v98-system" id="v98SystemList"></div>
<p class="v98-disclaimer">顯示已登錄的管線連接；未現場核對的不代表真正通電或可供料。</p>`;
viewer.append(card);
let suppressed='';
const selectedDevice=()=>{const sel=api.getSelected();return sel?.kind==='device'?api.getData().devices.find(d=>d.id===sel.id):null;};
const match=(r,id)=>r.fromDeviceId===id||r.toDeviceId===id||r.points?.some(pt=>pt.deviceId===id);
function linksFor(id){const data=api.getData();return data.routes.filter(r=>match(r,id)).map(r=>({route:r,from:data.devices.find(d=>d.id===r.fromDeviceId),to:data.devices.find(d=>d.id===r.toDeviceId)}));}
function openTab(tab){const device=selectedDevice();if(!device)return;
 if(api.getRole()==='admin')api.openEditor();else window.HWDeviceRecordV96?.open(true);
 if(tab!=='basic')window.HWDeviceRecordV96?.tab(tab);
}
function renderCard(){const device=selectedDevice();if(!device||api.getWorkspace()!=='equipment'||api.getAction().action||suppressed===device.id){card.hidden=true;return;}
 card.hidden=false;document.getElementById('v98DeviceTitle').textContent=device.name;
 const host=document.getElementById('v98SystemList');host.replaceChildren();
 const data=linksFor(device.id);
 for(const group of ['water','electric','feed']){
  const list=data.filter(q=>q.route.group===group);const row=el('div','v98-system-row');row.style.setProperty('--sys',colors[group]);
  const header=el('div','v98-system-head');header.append(el('strong','',labels[group]),el('span','',list.length+' 條連線'));row.append(header);
  if(!list.length)row.append(el('small','v98-empty','尚未建立連線'));
  for(const e of list.slice(0,5)){
   const r=e.route;const dest=r.fromDeviceId===device.id?(e.to?.name||'下游未指定'):r.toDeviceId===device.id?(e.from?.name||'上游未指定'):('中間接點 · '+(r.name||'線路'));
   const button=el('button','v98-route-row');button.type='button';button.title='點選這條'+labels[group]+'並於 CAD 定位';
   button.append(el('span','',dest),el('small',r.confirmed?'v98-verified':'v98-unverified',r.confirmed?'已標記核對':'待核對'));
   button.addEventListener('click',()=>{api.select('route',r.id);const p=r.points[Math.floor(r.points.length/2)];if(p)api.focus(p.x,p.y);});row.append(button);
  }
  if(list.length>5)row.append(el('small','v98-empty','尚有 '+(list.length-5)+' 條連線，請進入設備檔案查看'));
  host.append(row);
 }
}
document.getElementById('v98CardClose').addEventListener('click',()=>{suppressed=selectedDevice()?.id||'';card.hidden=true;});
document.getElementById('v98Record').addEventListener('click',()=>openTab('basic'));
document.getElementById('v98Photos').addEventListener('click',()=>openTab('photos'));
document.getElementById('v98Links').addEventListener('click',()=>openTab('links'));
window.addEventListener('hw-v90-change',e=>{if(e.detail?.kind==='selection'){if(selectedDevice()?.id!==suppressed)suppressed='';}if(['selection','data','role','workspace'].includes(e.detail?.kind))renderCard();});
// Accessibility hint: new branch junctions remain separate actual devices for future tracers.
window.HWSmartV98={linksFor,getSnap:(x,y,group)=>api.getSmartSnap(x,y,group,true)};
renderCard();
})();
