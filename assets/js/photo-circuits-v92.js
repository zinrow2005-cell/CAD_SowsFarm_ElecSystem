/* V9.0 annotated device photos, terminal register and directed wiring tracing. */
(function(){'use strict';
const api=window.HWEquipment,media=window.HWPhotoStore;if(!api||!media)return;
const $=id=>document.getElementById(id),el=(tag,cls,content)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(content!=null)n.textContent=content;return n;},uid=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const viewer=document.querySelector('.viewer');let opened=false,tab='photos',activePhoto='',activeMarker='',annotate=false,photoKey='',photoSeq=0,tracePort='',isDrawing=false;
const modal=el('div','v90-overlay');modal.id='v90Overlay';modal.hidden=true;
modal.innerHTML=`<section class="v90-sheet" role="dialog" aria-modal="true" aria-label="設備照片與迴路管理">
<header class="v90-head"><div><small>HUWEI FARM · EQUIPMENT PHOTOS</small><h2 id="v90DeviceTitle">設備照片與線路</h2><p id="v90DeviceSub"></p></div><button type="button" id="v90Close" aria-label="關閉">✕</button></header>
<nav class="v90-tabs"><button data-v90tab="photos" class="active">📷 照片與標記</button><button data-v90tab="terminals">🔌 開關／端子</button><button data-v90tab="trace">↗ 供電追蹤</button></nav>
<div class="v90-content">
<section id="v90Photos" class="v90-tab-pane"><div class="v90-actions"><button type="button" class="v99-camera-open" id="v99OpenCamera">📷 現場拍照</button><label class="v90-upload v99-native-fallback" id="v99NativeFallback" hidden>使用系統相機<input type="file" id="v90Camera" accept="image/*" capture="environment" hidden></label><label class="v90-upload">🖼️ 從相簿／檔案上傳<input type="file" id="v90Upload" accept="image/*" hidden></label><span id="v90PhotoCount"></span></div>
<p class="v90-hint">每張照片可直接點選位置新增標記，關聯到開關或端子。新版照片保存高解析主圖及輕量縮圖；舊版照片保持原畫質。跨裝置請使用加密完整私人備份。</p>
<div id="v90Thumbs" class="v90-thumbs"></div>
<div id="v90PhotoMain" class="v90-photomain" hidden><div class="v90-photo-toolbar"><button id="v90AddPin" type="button">＋ 標記照片位置</button><button id="v90LockAll" type="button">🔒 全部鎖定</button><button id="v90UnlockAll" type="button">🔓 全部解鎖</button><button id="v90RemovePhoto" type="button" class="v90-danger">刪除照片</button><span id="v90PhotoHint"></span></div>
<div class="v90-photo-stage" id="v90Stage"><div class="v90-image-wrap" id="v90ImageWrap"><img id="v90Image" alt="設備照片" draggable="false"><div id="v90Pins" class="v90-pins"></div></div></div>
<div id="v90MarkerForm" class="v90-marker-form" hidden><strong>標記內容</strong><div class="v90-grid"><label>標記名稱<input id="v90MarkerTitle" maxlength="100" placeholder="例如：2號無熔絲開關"></label><label>連結開關／端子<select id="v90MarkerTerminal"></select></label></div><label>功能、上游及下游說明<textarea id="v90MarkerNote" rows="3" maxlength="500" placeholder="例：電源由主盤 MCCB-02 進來，控制產房 B 棟的三台排風扇"></textarea></label><label class="v90-check v90-marker-lock"><input id="v90MarkerLocked" type="checkbox"> 鎖定標記位置（避免誤觸拖動）</label><div class="v90-actions"><button id="v90QuickLock" type="button">🔒 立即鎖定位置</button><button id="v90SaveMarker" type="button" class="v90-primary">儲存標記</button><button id="v90RemoveMarker" type="button" class="v90-danger">刪除標記</button></div></div>
</div><div class="v90-empty" id="v90PhotoEmpty">尚未加入照片。選擇「現場拍照」或「上傳圖片」開始。</div></section>
<section id="v90Terminals" class="v90-tab-pane" hidden><p class="v90-hint">為配電盤每個進線端子、斷路器及出線端子建立名稱。出線端子可選擇由哪一個端子供電；未設定的內部接線不會被系統自行推測。</p><div id="v90TerminalList"></div><button id="v90AddTerminal" type="button" class="v90-primary">＋ 新增開關／端子</button></section>
<section id="v90Trace" class="v90-tab-pane" hidden><p class="v90-hint">從圖上已連結的電線自動追蹤上下游。只反映已建檔的線路和設備內部端子連結，不能代替現場查線、斷電驗證或電氣測試。</p><label class="v90-field">追蹤起點 <select id="v90TraceTerminal"></select></label><div class="v90-grid" id="v90TraceGrid"><div><h3>← 上游供電來源</h3><div id="v90Upstream"></div></div><div><h3>→ 下游供電設備</h3><div id="v90Downstream"></div></div></div><div id="v90Unlinked" class="v90-hint"></div></section>
</div></section>`;
viewer.appendChild(modal);
const openBtns=el('button','v90-open-btn','📷 照片／迴路');openBtns.type='button';$('v84Selection')?.querySelector('.v84-selection-buttons')?.prepend(openBtns);
const staffBtn=el('button','v82-btn primary','📷 查看設備照片／迴路');staffBtn.type='button';staffBtn.id='v90StaffOpen';$('eqDetails')?.appendChild(staffBtn);
// A selected wire can also open its connection editor directly, even when not selecting a device.
const routeLink=el('div','v90-route-links');routeLink.innerHTML=`<h4>電線迴路連接</h4><p>必須明確記錄起點和終點，才會進入供電追蹤。方向為「上游 → 下游」。</p>
<label>迴路編號<input id="v90CircuitName" maxlength="80" placeholder="例：P-B-FAN-01"></label><label>控制範圍／用途<input id="v90Purpose" maxlength="400" placeholder="例：產房 B 排風扇"></label><label>電線規格<input id="v90CableSpec" maxlength="120" placeholder="例：4C × 5.5mm²"></label>
<div class="v90-grid"><label>上游設備<select id="v90FromDevice"></select></label><label>下游設備<select id="v90ToDevice"></select></label><label>出線端子<select id="v90FromTerminal"></select></label><label>進線端子<select id="v90ToTerminal"></select></label></div>
<div class="v103-verify-record"><strong>現場迴路核對紀錄</strong><div class="v90-grid"><label>核對人<input id="v103VerifiedBy" maxlength="80" placeholder="現場確認人員"></label><label>核對日期<input id="v103VerifiedAt" type="date"></label><label>佐證設備照片<select id="v103EvidencePhoto"></select></label><label>核對說明<input id="v103VerificationNote" maxlength="500" placeholder="例：已核對開關標示和下游端點（不代表已帶電測試）"></label></div></div>
<label class="v90-check"><input type="checkbox" id="v90Confirmed"> 已依現場接線核對此方向與端點</label><div id="v90RouteWarning" class="v90-hint"></div>`;
$('eqRouteEditor')?.appendChild(routeLink);
const clone=x=>JSON.parse(JSON.stringify(x));
const data=()=>api.getData(),getSel=()=>api.getSelected(),device=()=>{const id=getSel()?.id;return getSel()?.kind==='device'?data().devices.find(x=>x.id===id):null;};
const editable=()=>api.getRole()==='admin';
function message(t){const node=$('toast');if(!node)return;node.textContent=t;node.style.display='block';setTimeout(()=>node.style.display='none',3000);}
function opt(sel,val,text){const o=el('option','',text);o.value=val;sel.appendChild(o);}
function emptySelect(sel,label='尚未設定'){sel.replaceChildren();opt(sel,'',label);}
function updateDevice(d,patch){if(!editable())return false;return api.updateDetails('device',d.id,patch);}
function stop(){window.HWLiveCameraV99?.stop();opened=false;modal.hidden=true;annotate=false;}
function openPanel(which='photos'){const d=device();if(!d)return message('請先選取設備物件');lastSelection='device-'+d.id;opened=true;tab=which;modal.hidden=false;switchTab(tab);}
function switchTab(t){if(t!=='photos')window.HWLiveCameraV99?.stop();tab=t;modal.querySelectorAll('[data-v90tab]').forEach(b=>b.classList.toggle('active',b.dataset.v90tab===t));['photos','terminals','trace'].forEach(n=>{$('v90'+n[0].toUpperCase()+n.slice(1)).hidden=n!==t;});render();}
openBtns.addEventListener('click',()=>openPanel());staffBtn.addEventListener('click',()=>openPanel());$('v90Close').addEventListener('click',stop);modal.addEventListener('click',e=>{if(e.target===modal)stop();});modal.querySelectorAll('[data-v90tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.v90tab)));
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){e.preventDefault();e.stopImmediatePropagation();stop();}},true);
async function handleFile(file){if(!file||!editable())return;const d=device();if(!d)return;try{if((d.photos||[]).length>=32)throw Error('單台設備最多 32 張照片');const url=await media.compress(file),id=uid('photo');await media.put(id,url);if(media.putOriginal){try{await media.putOriginal(id,file);}catch(originalError){await media.remove(id);throw originalError;}}const current=data().devices.find(x=>x.id===d.id);if(!current)throw Error('設備已被刪除');const photos=clone(current.photos||[]);photos.push({id,name:(file.name||'現場照片').slice(0,120),createdAt:new Date().toISOString(),markers:[]});if(!updateDevice(current,{photos}))throw Error('照片已暫存，但設備資料未能儲存，請先檢查儲存狀態');activePhoto=id;activeMarker='';render();message('已加入高畫質照片，可點圖標記開關');return true;}catch(err){message('照片加入失敗：'+err.message);return false;}}
for(const key of ['v90Camera','v90Upload'])$(key).addEventListener('change',async e=>{const f=e.target.files?.[0];e.target.value='';if(f)await handleFile(f);});
async function paintPhoto(ph){const id=ph?.id||'',seq=++photoSeq;photoKey=id;if(!id)return;const image=await media.get(id).catch(()=>null);if(seq!==photoSeq||!opened||photoKey!==id)return;$('v90Image').src=image||'';$('v90Image').alt=image?'設備照片':'照片資料未儲存在本裝置（請匯入完整備份）';$('v90Image').style.opacity=image?'1':'.15';if(!image)message('找不到照片原檔，請匯入包含照片的備份');}
function renderPhotos(d){const photos=d.photos||[];const thumbs=$('v90Thumbs');thumbs.replaceChildren();$('v90PhotoCount').textContent=photos.length+' 張照片';if(!photos.some(ph=>ph.id===activePhoto))activePhoto=photos[0]?.id||'';const current=photos.find(ph=>ph.id===activePhoto);$('v90PhotoMain').hidden=!current;$('v90PhotoEmpty').hidden=!!current;
 for(const ph of photos){const b=el('button','v90-thumb'+(activePhoto===ph.id?' active':''),ph.name);b.title=ph.name;b.addEventListener('click',()=>{activePhoto=ph.id;activeMarker='';annotate=false;renderPhotos(device());});thumbs.appendChild(b);}
 if(!current){window.dispatchEvent(new CustomEvent('hw-v118-photo-view',{detail:{deviceId:d.id,photoId:'',markers:[]}}));return;}
 $('v90PhotoMain').dataset.photoId=current.id;
 if(photoKey!==current.id||!$('v90Image').src)paintPhoto(current);
 $('v90AddPin').classList.toggle('active',annotate);
 const markerCount=(current.markers||[]).length,lockedCount=(current.markers||[]).filter(m=>m.locked===true).length;
 $('v90PhotoHint').textContent=(annotate?'點一下照片上欲標示的位置':'點標記查看內容；未鎖定的標記才能拖動')+` · 已鎖定 ${lockedCount}/${markerCount}`;
 $('v90LockAll').disabled=!editable()||!markerCount||lockedCount===markerCount;
 $('v90UnlockAll').disabled=!editable()||lockedCount===0;
 const pins=$('v90Pins');pins.replaceChildren();for(const [i,m] of (current.markers||[]).entries()){const locked=!!m.locked;const pin=el('button','v90-pin'+(activeMarker===m.id?' active':'')+(locked?' locked':''),'');pin.title=(m.title||'照片標記')+(locked?'（已鎖定位置）':'');pin.dataset.markerId=m.id;pin.dataset.label=String(i+1);pin.dataset.locked=locked?'1':'0';pin.dataset.linked=(d.terminals||[]).some(t=>t.id===m.terminalId)?'1':'0';pin.setAttribute('aria-label',`照片標記 ${i+1}：${m.title||'未命名標記'}${locked?'（已鎖定位置）':''}`);pin.style.left=m.x+'%';pin.style.top=m.y+'%';pin.addEventListener('click',e=>{e.stopPropagation();activeMarker=m.id;annotate=false;renderPhotos(device());window.dispatchEvent(new Event('hw-v1212-marker-click'));});
 pin.addEventListener('pointerdown',e=>{
  if(!editable()||e.button!==0&&e.pointerType==='mouse')return;
  e.stopPropagation();
  if(locked){activeMarker=m.id;annotate=false;renderPhotos(device());window.dispatchEvent(new Event('hw-v1212-marker-click'));message('此標記已鎖定；請先取消鎖定才能移動');return;}
  e.preventDefault();
  const rect=$('v90ImageWrap').getBoundingClientRect();
  const origin={x:e.clientX,y:e.clientY,left:Number(m.x),top:Number(m.y)};
  const pointerId=e.pointerId;let dragged=false;
  const move=ev=>{
   if(ev.pointerId!==pointerId)return;
   if(!dragged&&Math.hypot(ev.clientX-origin.x,ev.clientY-origin.y)<7)return;
   dragged=true;
   pin.style.left=Math.max(0,Math.min(100,(ev.clientX-rect.left)/rect.width*100))+'%';
   pin.style.top=Math.max(0,Math.min(100,(ev.clientY-rect.top)/rect.height*100))+'%';
  };
  const cleanup=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);};
  const cancel=ev=>{if(ev.pointerId!==pointerId)return;cleanup();pin.style.left=origin.left+'%';pin.style.top=origin.top+'%';};
  const up=ev=>{
   if(ev.pointerId!==pointerId)return;cleanup();
   if(!dragged)return;
   const latest=device(),photo=latest?.photos?.find(x=>x.id===current.id);
   const latestMarker=photo?.markers?.find(x=>x.id===m.id);
   if(!latest||!latestMarker||latestMarker.locked){renderPhotos(device());return;}
   const updated=clone(latest.photos),mark=updated.find(x=>x.id===current.id).markers.find(x=>x.id===m.id);
   mark.x=+parseFloat(pin.style.left).toFixed(2);mark.y=+parseFloat(pin.style.top).toFixed(2);
   if(updateDevice(latest,{photos:updated}))renderPhotos(device());else renderPhotos(device());
  };
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);
 });pins.appendChild(pin);}
 const mark=(current.markers||[]).find(m=>m.id===activeMarker);$('v90MarkerForm').hidden=!mark;
 if(mark){
  $('v90MarkerTitle').value=mark.title;$('v90MarkerNote').value=mark.note;
  $('v90MarkerLocked').checked=!!mark.locked;
  $('v90QuickLock').textContent=mark.locked?'🔓 立即解鎖位置':'🔒 立即鎖定位置';
  $('v90QuickLock').disabled=!editable();
  $('v90RemoveMarker').disabled=!!mark.locked;
  $('v90RemoveMarker').title=mark.locked?'已鎖定標記不可刪除，請先解鎖':'刪除這個照片標記';
  const select=$('v90MarkerTerminal');emptySelect(select,'不連結端子');(d.terminals||[]).forEach(t=>opt(select,t.id,t.name));select.value=mark.terminalId||'';
 }
 $('v90AddPin').disabled=!editable();$('v90RemovePhoto').hidden=!editable();$('v90SaveMarker').hidden=!editable();$('v90RemoveMarker').hidden=!editable();$('v90QuickLock').hidden=!editable();$('v90LockAll').hidden=!editable();$('v90UnlockAll').hidden=!editable();
 window.dispatchEvent(new CustomEvent('hw-v118-photo-view',{detail:{deviceId:d.id,photoId:current.id,markers:current.markers||[]}}));}
// Photo/marker lock changes are persisted through HWEquipment.updateDetails (and sanitize).
function changeLockForSelected(lock){
 const d=device();if(!d||!editable())return;
 const photos=clone(d.photos||[]),ph=photos.find(p=>p.id===activePhoto),mark=ph?.markers?.find(m=>m.id===activeMarker);
 if(!mark)return;
 if(!!mark.locked===lock)return;
 // A quick lock should not discard any text/terminal edits still visible in the form.
 mark.title=$('v90MarkerTitle').value.trim().slice(0,100);
 mark.note=$('v90MarkerNote').value.trim().slice(0,500);
 mark.terminalId=$('v90MarkerTerminal').value;
 mark.locked=lock;
 if(updateDevice(d,{photos})){renderPhotos(device());message(lock?'已儲存並鎖定位置，不會誤拖或刪除':'已儲存並解鎖，可以重新調整位置');}
 else message('無法儲存鎖定狀態，請確認資料儲存是否正常');
}
function changeLockForAll(lock){
 const d=device();if(!d||!editable())return;
 const photos=clone(d.photos||[]),ph=photos.find(p=>p.id===activePhoto);
 if(!ph||!Array.isArray(ph.markers)||!ph.markers.length)return message('這張照片尚未建立標記');
 const changing=ph.markers.filter(m=>!!m.locked!==lock).length;
 if(!changing)return message(lock?'這張照片的標記已全部鎖定':'這張照片沒有鎖定中的標記');
 if(!lock&&!confirm(`確定要解鎖這張照片的 ${changing} 個標記？解鎖後可移動及刪除。`))return;
 ph.markers.forEach(m=>{m.locked=lock;});
 if(updateDevice(d,{photos})){renderPhotos(device());message(lock?`已鎖定這張照片的 ${changing} 個標記`:`已解鎖這張照片的 ${changing} 個標記`);}
 else message('無法儲存批次鎖定狀態，資料未變更');
}
$('v90QuickLock').addEventListener('click',()=>{
 const mark=device()?.photos?.find(ph=>ph.id===activePhoto)?.markers?.find(m=>m.id===activeMarker);
 if(mark)changeLockForSelected(!mark.locked);
});
$('v90LockAll').addEventListener('click',()=>changeLockForAll(true));
$('v90UnlockAll').addEventListener('click',()=>changeLockForAll(false));
$('v90AddPin').addEventListener('click',()=>{annotate=!annotate;renderPhotos(device());});
$('v90Stage').addEventListener('click',e=>{if(!annotate||!editable()||e.target.closest('.v90-pin'))return;const d=device();if(!d)return;const rect=$('v90ImageWrap').getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)return;const mark={id:uid('pin'),x:+(Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100))).toFixed(2),y:+(Math.max(0,Math.min(100,(e.clientY-rect.top)/rect.height*100))).toFixed(2),title:'新標記',note:'',terminalId:'',locked:false};const photos=clone(d.photos||[]),ph=photos.find(p=>p.id===activePhoto);if(!ph||ph.markers.length>=80)return;ph.markers.push(mark);activeMarker=mark.id;annotate=false;updateDevice(d,{photos});renderPhotos(device());});
$('v90SaveMarker').addEventListener('click',()=>{
 const d=device();if(!d||!editable())return;
 const photos=clone(d.photos||[]),ph=photos.find(p=>p.id===activePhoto),mark=ph?.markers?.find(m=>m.id===activeMarker);
 if(!mark)return;
 mark.title=$('v90MarkerTitle').value.trim().slice(0,100);
 mark.note=$('v90MarkerNote').value.trim().slice(0,500);
 mark.terminalId=$('v90MarkerTerminal').value;
 mark.locked=!!$('v90MarkerLocked').checked;
 if(updateDevice(d,{photos})){renderPhotos(device());message(mark.locked?'照片標記已儲存，位置已鎖定':'照片標記已儲存');}
 else message('標記儲存失敗，請先檢查設備資料狀態');
});
$('v90RemoveMarker').addEventListener('click',()=>{
 const d=device();if(!d||!editable())return;
 const photos=clone(d.photos||[]),ph=photos.find(p=>p.id===activePhoto),mark=ph?.markers?.find(m=>m.id===activeMarker);
 if(!mark)return;if(mark.locked)return message('此標記已鎖定，請先解鎖才能刪除');
 if(!confirm('確定要刪除這個照片標記？'))return;
 ph.markers=ph.markers.filter(m=>m.id!==activeMarker);
 if(updateDevice(d,{photos})){activeMarker='';renderPhotos(device());message('照片標記已刪除');}
});
$('v90RemovePhoto').addEventListener('click',()=>{
 const d=device();if(!d||!editable())return;
 const ph=d.photos?.find(p=>p.id===activePhoto);if(!ph)return;
 const protectedCount=(ph.markers||[]).filter(m=>m.locked).length;
 if(protectedCount)return message(`這張照片有 ${protectedCount} 個鎖定標記；請先全部解鎖才能刪除`);
 if(!confirm('確定刪除這張照片與其所有標記？'))return;
 const removed=activePhoto,photos=d.photos.filter(p=>p.id!==removed);
 if(updateDevice(d,{photos})){activePhoto=photos[0]?.id||'';activeMarker='';photoKey='';renderPhotos(device());message('照片已移除，原檔仍可由先前備份還原');}
});
function renderTerminals(d){const host=$('v90TerminalList');host.replaceChildren();const terms=d.terminals||[];for(const [index,t] of terms.entries()){const item=el('div','v90-terminal');item.dataset.terminalId=t.id;item.tabIndex=-1;const label=el('div','v90-terminal-caption','端子 '+(index+1));item.appendChild(label);const grid=el('div','v90-grid');function input(l,key,max=150){const wrap=el('label','',l),n=el('input');n.value=t[key]||'';n.maxLength=max;n.disabled=!editable();n.addEventListener('change',()=>changeTerm(d,t.id,{[key]:n.value.slice(0,max)}));wrap.appendChild(n);grid.appendChild(wrap);}input('開關／端子名稱','name',70);
 const dirWrap=el('label','','方向'),dir=el('select');[['input','進線'],['output','出線'],['both','雙向／接點']].forEach(([v,txt])=>opt(dir,v,txt));dir.value=t.direction;dir.disabled=!editable();dir.addEventListener('change',()=>changeTerm(d,t.id,{direction:dir.value}));dirWrap.appendChild(dir);grid.appendChild(dirWrap);
 const sourceWrap=el('label','','內部供電來自'),source=el('select');emptySelect(source,'尚未指定');terms.filter(other=>other.id!==t.id).forEach(other=>opt(source,other.id,other.name));source.value=t.feedsFrom||'';source.disabled=!editable();source.addEventListener('change',()=>changeTerm(d,t.id,{feedsFrom:source.value}));sourceWrap.appendChild(source);grid.appendChild(sourceWrap);input('控制位置／用途','controls',200);input('迴路說明','purpose',200);item.appendChild(grid);
 if(editable()){const del=el('button','v90-danger','刪除端子');del.addEventListener('click',()=>{if(!confirm('刪除此端子？既有電線端點與照片標記的關聯將失效。'))return;updateDevice(d,{terminals:terms.filter(x=>x.id!==t.id)});renderTerminals(device());});item.appendChild(del);}host.appendChild(item);}if(!terms.length)host.appendChild(el('div','v90-empty','尚無開關／端子資料，可先從配電箱進線、主開關、各分路開始建立。'));$('v90AddTerminal').hidden=!editable();}
function changeTerm(d,id,patch){const arr=clone(d.terminals||[]),t=arr.find(x=>x.id===id);if(!t)return;Object.assign(t,patch);updateDevice(d,{terminals:arr});renderTerminals(device());}
$('v90AddTerminal').addEventListener('click',()=>{const d=device();if(!d||!editable())return;if((d.terminals||[]).length>=80)return message('最多 80 個開關或端子');const terms=clone(d.terminals||[]);terms.push({id:uid('port'),name:'新端子 '+(terms.length+1),direction:'both',feedsFrom:'',purpose:'',controls:'',note:''});updateDevice(d,{terminals:terms});renderTerminals(device());});
// The wire connections are directed: cable origin -> cable destination. Internal equipment
// connection is traversed only if an explicit feedsFrom terminal has been recorded.
function topology(){const p=data(),edges=[],missing=[];const nodes=new Map();const key=(id,port)=>id+':'+(port||'');
 for(const d of p.devices){const ports=d.terminals||[];nodes.set(key(d.id,''),{device:d,port:null});for(const t of ports){nodes.set(key(d.id,t.id),{device:d,port:t});if(t.feedsFrom&&ports.some(x=>x.id===t.feedsFrom))edges.push({from:key(d.id,t.feedsFrom),to:key(d.id,t.id),label:'內部供電 → '+t.name,route:null});}}
 for(const r of p.routes.filter(x=>x.group==='electric')){const a=r.fromDeviceId||r.points[0]?.deviceId,b=r.toDeviceId||r.points[r.points.length-1]?.deviceId;if(!a||!b||!p.devices.some(d=>d.id===a)||!p.devices.some(d=>d.id===b)){missing.push(r);continue;}const ap=r.fromTerminalId||'',bp=r.toTerminalId||'';
 if(ap&&!nodes.has(key(a,ap))||bp&&!nodes.has(key(b,bp))){missing.push(r);continue;}
 edges.push({from:key(a,ap),to:key(b,bp),label:r.circuitName||r.name,route:r});}
 return{nodes,edges,missing,key};}
function walk(start,edges,reverse){const queue=[{key:start,path:[]}],visited=new Set([start]),found=[];while(queue.length){const cur=queue.shift();for(const e of edges){const here=reverse?e.to:e.from,next=reverse?e.from:e.to;if(here!==cur.key||visited.has(next))continue;visited.add(next);const path=[...cur.path,e];found.push({key:next,path});queue.push({key:next,path});if(visited.size>2200)break;}}return found;}
function renderTrace(d){const topo=topology(),sel=$('v90TraceTerminal'),all=d.terminals||[];emptySelect(sel,'整台設備（設備級）');all.forEach(t=>opt(sel,t.id,t.name));if(tracePort&&!all.some(t=>t.id===tracePort))tracePort='';sel.value=tracePort;
 const starts=tracePort?[topo.key(d.id,tracePort)]:[topo.key(d.id,''),...(d.terminals||[]).map(t=>topo.key(d.id,t.id))];
 const union=reverse=>{const seen=new Set(),items=[];for(const start of starts)for(const item of walk(start,topo.edges,reverse)){if(seen.has(item.key)||starts.includes(item.key))continue;seen.add(item.key);items.push(item);}return items;};
 const upstream=union(true),downstream=union(false);
 function fill(hostId,found,reverse){const host=$(hostId);host.replaceChildren();if(!found.length){host.appendChild(el('p','v90-hint','沒有已記錄的連接，或端子之間尚未建立內部連接。'));return;}for(const record of found.slice(0,70)){const obj=topo.nodes.get(record.key);if(!obj)continue;const node=el('div','v90-trace-item');const title=el('strong','',obj.device.name+(obj.port?' · '+obj.port.name:''));node.appendChild(title);const steps=record.path.map(e=>e.label).join(reverse?' ← ':' → ');node.appendChild(el('small','',steps));if(record.path.some(e=>e.route&&!e.route.confirmed))node.appendChild(el('small','v90-warn','未經現場核對'));host.appendChild(node);} }
 fill('v90Upstream',upstream,true);fill('v90Downstream',downstream,false);
 let warning=topo.missing.length+' 條電線缺少有效起點／終點';if(!tracePort&&all.length)warning+='；目前使用設備級查詢，請指定端子才能區分不同分路';$('v90Unlinked').textContent=warning+'。電路來源由已建檔線路追蹤，不代表現場已驗證。';}
$('v90TraceTerminal').addEventListener('change',e=>{tracePort=e.target.value;const d=device();if(d)renderTrace(d);});
function fillSelects(d){const p=data(),route=p.routes.find(r=>r.id===getSel()?.id);if(!route||getSel()?.kind!=='route'||!opened)return;}
function renderRouteForm(){const sel=getSel(),r=sel?.kind==='route'?data().routes.find(x=>x.id===sel.id):null;routeLink.hidden=!r||r.group!=='electric';if(!r||r.group!=='electric')return;
 const all=data().devices,fillDevices=(id,val)=>{const s=$(id);emptySelect(s,'尚未指定');all.forEach(d=>opt(s,d.id,d.name));s.value=val||'';};fillDevices('v90FromDevice',r.fromDeviceId||r.points[0]?.deviceId);fillDevices('v90ToDevice',r.toDeviceId||r.points[r.points.length-1]?.deviceId);
 function fillTerm(type){const input=type==='From'?'v90FromDevice':'v90ToDevice',target=type==='From'?'v90FromTerminal':'v90ToTerminal';const select=$(target),d=all.find(x=>x.id===$(input).value);emptySelect(select,'未指明端子');(d?.terminals||[]).forEach(t=>opt(select,t.id,t.name));const val=type==='From'?r.fromTerminalId:r.toTerminalId;select.value=val||'';}
 fillTerm('From');fillTerm('To');$('v90CircuitName').value=r.circuitName||'';$('v90Purpose').value=r.purpose||'';$('v90CableSpec').value=r.cableSpec||'';$('v90Confirmed').checked=!!r.confirmed;
 $('v103VerifiedBy').value=r.verifiedBy||'';$('v103VerifiedAt').value=/^\d{4}-\d{2}-\d{2}$/.test(r.verifiedAt||'')?r.verifiedAt:'';$('v103VerificationNote').value=r.verificationNote||'';
 const evidence=$('v103EvidencePhoto');emptySelect(evidence,'未指定佐證照片');for(const d of all.filter(d=>[r.fromDeviceId,r.toDeviceId].includes(d.id)))for(const ph of d.photos||[])opt(evidence,ph.id,d.name+' · '+ph.name);evidence.value=r.evidencePhotoId||'';
 if(r.evidencePhotoId&&!evidence.value)opt(evidence,r.evidencePhotoId,'⚠ 已關聯但照片已不在端點設備');evidence.value=r.evidencePhotoId||'';
 $('v90RouteWarning').textContent=(!r.fromDeviceId||!r.toDeviceId)?'起點與終點未完整建檔，此線路不會被當成已連結供電迴路。':'上游 → 下游方向已記錄。若要追蹤箱內各分路，還需要設定對應端子與內部供電來源。';}
['v90FromTerminal','v90ToTerminal'].forEach(id=>$(id).addEventListener('change',()=>{$('v90Confirmed').checked=false;}));
['From','To'].forEach(type=>{const key='v90'+type+'Device';$(key).addEventListener('change',()=>{const sel='v90'+type+'Terminal';emptySelect($(sel),'未指明端子');const d=data().devices.find(x=>x.id===$(key).value);(d?.terminals||[]).forEach(t=>opt($(sel),t.id,t.name));$('v90Confirmed').checked=false;});});
// Capture before V8.9's existing save handler. It saves route metadata and gives users feedback.
$('eqSaveRoute').addEventListener('click',()=>{const sel=getSel();if(!editable()||sel?.kind!=='route')return;const current=data().routes.find(r=>r.id===sel.id);if(!current||current.group!=='electric')return;const from=$('v90FromDevice').value,to=$('v90ToDevice').value;
 const patch={fromDeviceId:from,toDeviceId:to,fromTerminalId:from?$('v90FromTerminal').value:'',toTerminalId:to?$('v90ToTerminal').value:'',circuitName:$('v90CircuitName').value.trim(),purpose:$('v90Purpose').value.trim(),cableSpec:$('v90CableSpec').value.trim(),verifiedBy:$('v103VerifiedBy').value.trim(),verifiedAt:$('v103VerifiedAt').value,verificationNote:$('v103VerificationNote').value.trim(),evidencePhotoId:$('v103EvidencePhoto').value,
 confirmed:$('v90Confirmed').checked&&!!from&&!!to};
 if(patch.confirmed&&(!patch.verifiedBy||!patch.verifiedAt)){patch.confirmed=false;message('請先填寫核對人及核對日期，再標記為已核對');}
 const points=clone(current.points);if(from)points[0].deviceId=from;else delete points[0].deviceId;if(to)points[points.length-1].deviceId=to;else delete points[points.length-1].deviceId;patch.points=points;api.updateDetails('route',current.id,patch);},true);
function render(){if(!opened)return;const d=device();if(!d){stop();return;}$('v90DeviceTitle').textContent=d.name;$('v90DeviceSub').textContent=(d.zone||'未指定棟舍')+' · '+(api.getType(d.type)?.label||'設備');$('v99OpenCamera').hidden=!editable();$('v99NativeFallback').hidden=!editable() || (window.isSecureContext && !!navigator.mediaDevices?.getUserMedia);$('v90Upload').parentNode.hidden=!editable();if(tab==='photos')renderPhotos(d);if(tab==='terminals')renderTerminals(d);if(tab==='trace')renderTrace(d);}
let lastSelection='';window.addEventListener('hw-v90-change',e=>{const sel=getSel(),id=sel?.kind+'-'+sel?.id;if(id!==lastSelection){if(opened&&(!sel||sel.kind!=='device'))stop();activePhoto='';activeMarker='';annotate=false;tracePort='';photoKey='';lastSelection=id;}if(opened&&e.detail?.kind!=='data')render();if(e.detail?.kind==='editorOpen')renderRouteForm();});
window.addEventListener('hw-v90-photo-updated',()=>{if(opened&&tab==='photos'){photoKey='';renderPhotos(device());}});
// Route panel open hook is emitted when V8.9 opens the editor.
window.addEventListener('hw-v89-ui-sync',()=>{const selection=getSel();staffBtn.hidden=selection?.kind!=='device';});
// Public static sites do not enforce real staff/admin login. Provide a photos-free
// export separately from the private backup to avoid accidental photo disclosure.
const publishHost=$('v84BackupContents');if(publishHost){
 const warning=el('p','v90-hint','安全提醒：若 GitHub Pages 網站公開，任何人都可能看到已發布的設備與迴路資料。含照片的完整備份只供私人保存，勿放入公開儲存庫。');publishHost.prepend(warning);
 const publishButton=el('button','v82-btn','匯出不含照片的網站資料');publishButton.type='button';publishHost.insertBefore(publishButton,publishHost.querySelector('#eqExport'));
 publishButton.addEventListener('click',()=>{const content=clone(data());content.devices.forEach(d=>{d.photos=[];});delete content.photoAssets;const blob=new Blob([JSON.stringify(content,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='equipment-data.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);message('已匯出不含照片版，發布前仍應確認設備資料是否可公開');});
 $('eqExport').textContent='下載完整私人備份（含照片）';
}
window.HWDeviceRecords={addPhoto:handleFile,open:(which='photos',photoId='',markerId='')=>{if(!['photos','terminals','trace'].includes(which))which='photos';if(photoId){activePhoto=photoId;photoKey='';activeMarker=markerId||'';annotate=false;}openPanel(which);},close:stop,
 showTerminal:(terminalId)=>{const d=device();if(!d)return;if(terminalId&&(d.terminals||[]).every(t=>t.id!==terminalId))return message('端子不存在，請重新連結');switchTab('terminals');requestAnimationFrame(()=>{const item=[...$('v90TerminalList').querySelectorAll('[data-terminal-id]')].find(x=>x.dataset.terminalId===terminalId);if(item){item.classList.add('v1212-terminal-target');item.scrollIntoView({block:'center',behavior:'smooth'});item.focus({preventScroll:true});}});},
 traceTerminal:(terminalId)=>{const d=device();if(!d||(d.terminals||[]).every(t=>t.id!==terminalId))return message('請先連結有效端子');tracePort=terminalId;switchTab('trace');requestAnimationFrame(()=>{$('v90TraceTerminal').scrollIntoView({block:'nearest'});});}
};
window.HWPowerTrace={graph:topology,walk};
})();
