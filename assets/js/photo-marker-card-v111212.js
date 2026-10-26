/* V11.12.12 Photo marker context card. This UI reads canonical device/route data;
 * it stores terminalId only through the existing equipment updateDetails API.
 * Route/path displays are recorded links, NOT physical electrical verification. */
(function(){'use strict';
const api=window.HWEquipment, stage=document.getElementById('v90Stage'),host=document.getElementById('v90PhotoMain');
if(!api||!stage||!host||!window.HWDeviceRecords)return;
const $=id=>document.getElementById(id);
const card=document.createElement('aside');card.id='v1212MarkerCard';card.className='v1212-card';
card.setAttribute('aria-label','照片標記即時資訊');card.hidden=true;
card.innerHTML=`<header class="v1212-card-head"><div><small id="v1212Number">照片標記</small><h3 id="v1212Name">標記內容</h3></div><button type="button" id="v1212Close" aria-label="收起標記資訊">✕</button></header>
<div class="v1212-flags"><span id="v1212LockState"></span><span id="v1212LinkState"></span></div>
<nav class="v1212-subtabs" aria-label="標記資訊分類"><button type="button" data-v1212-tab="overview" class="active">內容</button><button type="button" data-v1212-tab="terminal">端子</button><button type="button" data-v1212-tab="trace">追蹤</button></nav>
<div id="v1212Overview" class="v1212-card-pane"><div class="v1212-item"><strong>功能說明</strong><p id="v1212Note"></p></div><div class="v1212-item"><strong>位置</strong><p id="v1212Position"></p></div><div class="v1212-item"><strong>已連結端子</strong><p id="v1212TerminalBrief"></p></div></div>
<div id="v1212TerminalPane" class="v1212-card-pane" hidden><div class="v1212-item"><strong>連結此設備的開關／端子</strong><label for="v1212TerminalSelect">選取既有端子</label><select id="v1212TerminalSelect"></select><button id="v1212SaveLink" type="button" class="v1212-primary">儲存連結</button><p id="v1212TerminalHelp"></p></div><div class="v1212-item" id="v1212TerminalDetails"></div></div>
<div id="v1212TracePane" class="v1212-card-pane" hidden><p id="v1212TraceWarning" class="v1212-disclaimer">僅根據已建檔的端子與電線顯示，不代表現場接線已確認。</p><div class="v1212-trace-cols"><section><strong>← 上游</strong><div id="v1212Upstream"></div></section><section><strong>→ 下游</strong><div id="v1212Downstream"></div></section></div></div>
<footer class="v1212-card-actions"><button id="v1212Edit" type="button">✏️ 編輯詳細</button><button id="v1212GoTerminal" type="button">🔌 查看／建立端子</button><button id="v1212GoTrace" type="button">↗ 供電追蹤</button></footer>`;
stage.insertAdjacentElement('afterend',card);
const navButtons=[...card.querySelectorAll('[data-v1212-tab]')];
let markerRef=null,currentPane='overview',dismissed=false;
function getContext(){
 const selection=api.getSelected();if(selection?.kind!=='device'||!markerRef)return null;
 const dev=api.getData().devices.find(d=>d.id===selection.id);if(!dev)return null;
 const photo=dev.photos?.find(p=>p.id===markerRef.photoId);
 const marker=photo?.markers?.find(m=>m.id===markerRef.markerId);
 if(!marker)return null;
 const terminal=(dev.terminals||[]).find(t=>t.id===marker.terminalId)||null;
 return {dev,photo,marker,terminal};
}
function setText(id,value){$(id).textContent=value==null?'':String(value);}
function status(text){const toast=$('toast');if(!toast)return;toast.textContent=text;toast.style.display='block';setTimeout(()=>{if(toast.textContent===text)toast.style.display='none';},3000);}
function renderRoutes(ctx){const up=$('v1212Upstream'),down=$('v1212Downstream');up.replaceChildren();down.replaceChildren();
 const graphApi=window.HWPowerTrace;
 function draw(target,items){
  if(!items.length){const p=document.createElement('p');p.textContent='尚無有效連線紀錄';target.appendChild(p);return;}
  for(const entry of items.slice(0,5)){
   const node=graph.nodes.get(entry.key);if(!node)continue;
   const n=document.createElement('div');n.className='v1212-path';
   const t=document.createElement('strong');t.textContent=node.device.name+(node.port?' · '+node.port.name:'');n.appendChild(t);
   const s=document.createElement('small');const electric=entry.path.filter(edge=>!!edge.route);
   s.textContent=electric.length ? (electric.every(e=>e.route?.confirmed)?'有已核對的電線紀錄（內部端子需另核實）':'包含尚未核對的線路'):'僅記錄端子內部關聯（未核對）';n.appendChild(s);target.appendChild(n);
  }
 }
 if(!ctx.terminal){setText('v1212TraceWarning','請先連結這張照片的標記與端子，才能以該端子追蹤供電。');draw(up,[]);draw(down,[]);return;}
 if(!graphApi?.graph||!graphApi?.walk){setText('v1212TraceWarning','供電追蹤模組尚未載入，請重新開啟系統。');draw(up,[]);draw(down,[]);return;}
 let graph;try{graph=graphApi.graph();}catch(e){setText('v1212TraceWarning','目前線路資料無法解析，請先檢查線路端點。');draw(up,[]);draw(down,[]);return;}
 const key=graph.key(ctx.dev.id,ctx.terminal.id);
 const backward=graphApi.walk(key,graph.edges,true),forward=graphApi.walk(key,graph.edges,false);
 setText('v1212TraceWarning','僅呈現已建檔的端子和線路；供電方向仍需現場核對。'+(graph.missing.length?' 有 '+graph.missing.length+' 條線路端點不完整。':''));
 draw(up,backward);draw(down,forward);
}
function displayPane(){navButtons.forEach(b=>{const yes=b.dataset.v1212Tab===currentPane;b.classList.toggle('active',yes);b.setAttribute('aria-selected',yes?'true':'false');});
 $('v1212Overview').hidden=currentPane!=='overview';$('v1212TerminalPane').hidden=currentPane!=='terminal';$('v1212TracePane').hidden=currentPane!=='trace';
}
function renderCard(){const ctx=getContext();if(!ctx||dismissed){card.hidden=true;host.classList.remove('v1212-show-card');return;}
 const {dev,photo,marker,terminal}=ctx;const index=(photo.markers||[]).findIndex(m=>m.id===marker.id)+1;
 card.hidden=false;host.classList.add('v1212-show-card');
 setText('v1212Number',`標記 ${index} · ${photo.name||'設備照片'}`);
 setText('v1212Name',marker.title||'未命名標記');
 setText('v1212LockState',marker.locked?'🔒 位置已鎖定':'🔓 位置未鎖定');
 setText('v1212LinkState',terminal?'🔗 已連結端子':'◌ 尚未連結端子');
 setText('v1212Note',marker.note||'尚未填寫說明');
 setText('v1212Position',`水平 ${Number(marker.x).toFixed(1)}%　垂直 ${Number(marker.y).toFixed(1)}%`);
 setText('v1212TerminalBrief',terminal?`${dev.name}／${terminal.name}`:(marker.terminalId?'原連結端子已不存在，請重新選擇。':'尚未連結，可在「端子」頁選取。'));
 const sel=$('v1212TerminalSelect');sel.replaceChildren();
 const no=document.createElement('option');no.value='';no.textContent='不連結';sel.appendChild(no);
 for(const t of dev.terminals||[]){const opt=document.createElement('option');opt.value=t.id;opt.textContent=t.name+(t.direction==='input'?' · 進線':t.direction==='output'?' · 出線':' · 接點');sel.appendChild(opt);}
 sel.value=terminal?.id||'';
 sel.disabled=api.getRole()!=='admin';$('v1212SaveLink').disabled=api.getRole()!=='admin';
 setText('v1212TerminalHelp',!dev.terminals?.length?'尚無端子：請先按「查看端子」，建立端子後再回照片連結。':'選擇此設備已建立的端子，按「儲存連結」後才會寫入資料。');
 const det=$('v1212TerminalDetails');det.replaceChildren();
 if(terminal){for(const [label,txt] of [['開關／端子',terminal.name],['方向',({input:'進線',output:'出線',both:'雙向／接點'})[terminal.direction]||'未設定'],['用途',terminal.controls||terminal.purpose||'尚未填寫'],['內部供電來自',(dev.terminals||[]).find(t=>t.id===terminal.feedsFrom)?.name||'尚未指定']]){
 const p=document.createElement('p');p.textContent=label+'：'+txt;det.appendChild(p);}}
 $('v1212GoTerminal').disabled=false;
 $('v1212GoTrace').disabled=!terminal;
 renderRoutes(ctx);displayPane();
}
window.addEventListener('hw-v118-photo-view',event=>{
 const selected=document.querySelector('#v90Pins .v90-pin.active');const photoId=event.detail?.photoId||'';
 const markerId=selected?.dataset.markerId||'';
 const next=markerId&&photoId?{photoId,markerId}:null;
 if(!next){markerRef=null;dismissed=false;renderCard();return;}
 if(!markerRef||markerRef.photoId!==next.photoId||markerRef.markerId!==next.markerId){currentPane='overview';dismissed=false;}
 markerRef=next;renderCard();
});
window.addEventListener('hw-v1212-marker-click',()=>{dismissed=false;renderCard();});
$('v1212Close').addEventListener('click',()=>{dismissed=true;renderCard();});
navButtons.forEach(b=>b.addEventListener('click',()=>{currentPane=b.dataset.v1212Tab;const ctx=getContext();if(ctx){renderRoutes(ctx);displayPane();}}));
$('v1212SaveLink').addEventListener('click',()=>{
 const ctx=getContext();if(!ctx||api.getRole()!=='admin')return;
 const id=$('v1212TerminalSelect').value;
 if(id&&!(ctx.dev.terminals||[]).some(t=>t.id===id))return status('端子不存在，請重新選擇');
 const photos=JSON.parse(JSON.stringify(ctx.dev.photos||[]));
 const marker=photos.find(p=>p.id===ctx.photo.id)?.markers?.find(m=>m.id===ctx.marker.id);if(!marker)return;
 marker.terminalId=id;
 if(!api.updateDetails('device',ctx.dev.id,{photos}))return status('端子連結儲存失敗，原有資料未改變');
 window.HWDeviceRecords.open('photos',ctx.photo.id,ctx.marker.id);
 currentPane='terminal';renderCard();status(id?'已將標記連結到端子':'已取消標記的端子連結');
});
$('v1212GoTerminal').addEventListener('click',()=>{const ctx=getContext();if(ctx)window.HWDeviceRecords.showTerminal(ctx.terminal?.id||'');});
$('v1212GoTrace').addEventListener('click',()=>{const ctx=getContext();if(ctx?.terminal)window.HWDeviceRecords.traceTerminal(ctx.terminal.id);});
$('v1212Edit').addEventListener('click',()=>{
 if(!getContext())return;
 dismissed=true;renderCard();const form=$('v90MarkerForm');form?.scrollIntoView({behavior:'smooth',block:'center'});
 const field=$('v90MarkerTitle');field?.focus({preventScroll:true});
});
window.HWPhotoMarkerCardV111212={refresh:renderCard};
})();
