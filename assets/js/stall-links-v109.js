/* V10.9 欄格快速定位與設備服務範圍：獨立資料索引；不變更既有 CAD 幾何、設備座標及路線。 */
(function(){'use strict';
const HW=window.HWEquipment, geometry=window.HWStallGeometry, capacity=window.HWStallCapacity;
const svg=document.getElementById('plan');
if(!HW||!geometry||!capacity||!svg)return;
const STORE='huwei_v109_stall_links', MAX_EDGES=20000;
const allCells=[...svg.querySelectorAll('[data-stall-id]')], byCell=new Map(allCells.map(n=>[n.getAttribute('data-stall-id'),n]));
const penIds=[...byCell.keys()], known=new Set(penIds);
const $=id=>document.getElementById(id), clean=s=>String(s??'').trim(), clone=o=>JSON.parse(JSON.stringify(o));
const pad=(n,size)=>String(n).padStart(size,'0');
const simplify=s=>clean(s).toUpperCase().replace(/\s+/g,'').replace(/[＿_]/g,'-');
function resolve(input){const t=simplify(input);if(known.has(t))return t;
 // 育成頭位  G-03-08 對應實際 CAD 的 G-03 欄；頭位只作查詢提示。
 let m=t.match(/^G-?(\d{1,2})-?(\d{1,2})$/);if(m&&+m[1]>=1&&+m[1]<=14&&+m[2]>=1&&+m[2]<=10)return 'G-'+pad(+m[1],2);
 m=t.match(/^G-?(\d{1,2})$/);if(m&&+m[1]>=1&&+m[1]<=14)return 'G-'+pad(+m[1],2);
 m=t.match(/^MAT-?(\d{1,3})$/);if(m&&+m[1]>=1&&+m[1]<=76)return 'MAT-'+pad(+m[1],3);
 m=t.match(/^([AB])-?R?([123])-?(\d{1,3})$/);if(m){const max=(m[1]==='A'?84:(m[2]==='3'?80:82));if(+m[3]>=1&&+m[3]<=max)return m[1]+'-R'+m[2]+'-'+pad(+m[3],3);}
 if(['BOAR','BOAR-HEAT','BOAR-HEAT-1'].includes(t))return 'BOAR-HEAT-01';
 return null;
}
function label(id){if(id==='BOAR-HEAT-01')return '配種區巡情公豬欄';if(id.startsWith('G-'))return '女豬育成 '+id.slice(2)+' 欄（10 頭）';if(id.startsWith('MAT-'))return '配種舍 '+id.slice(4)+' 號母豬夾欄';if(/^[AB]-R[123]-/.test(id))return `妊娠${id[0]}棟 第${id[3]}排 第${id.slice(-3)}格${id.startsWith('B-R3-')?'（靠水溝）':''}`;return id;}
function blank(){return {version:'10.9',updatedAt:'',bindings:{}};}
function validate(raw){if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('欄格綁定資料格式不正確');const b=raw.bindings;if(b==null||typeof b!=='object'||Array.isArray(b))throw Error('缺少設備與欄格綁定表');const result=blank();let edges=0;const ids=Object.keys(b);if(ids.length>2000)throw Error('設備綁定筆數過多');for(const deviceId of ids){if(!/^[-\w]{1,100}$/.test(deviceId))throw Error('無效的設備編號');if(!Array.isArray(b[deviceId])||b[deviceId].length>600)throw Error('單一設備綁定超出限制');const set=new Set();for(const stall of b[deviceId]){if(typeof stall!=='string'||!known.has(stall))throw Error('未知的欄格編號：'+stall);set.add(stall);}if(set.size)result.bindings[deviceId]=[...set].sort();edges+=set.size;if(edges>MAX_EDGES)throw Error('服務關聯數量超出 20,000 筆限制');}
 result.updatedAt=typeof raw.updatedAt==='string'?raw.updatedAt.slice(0,80):'';return result;}
let state=blank(),dirty=false,currentStall=null,currentDevice='',searchTerm='';
try{const raw=localStorage.getItem(STORE);if(raw)state=validate(JSON.parse(raw));}catch(e){dirty=true;console.warn('V10.9 欄格綁定讀取異常，原始資料未被覆蓋',e);}
function devices(){return HW.getData().devices||[];}function deviceMap(){return new Map(devices().map(d=>[d.id,d]));}
function admin(){return HW.getRole()==='admin';}
function status(t,error=false){const el=$('v109Status');if(el){el.textContent=t;el.dataset.error=error?'true':'false';}}
function persist(next){next.updatedAt=new Date().toISOString();const serial=JSON.stringify(next);try{localStorage.setItem(STORE,serial);state=next;dirty=false;render();window.dispatchEvent(new CustomEvent('hw-v109-change',{detail:{updatedAt:next.updatedAt}}));return true;}catch(e){dirty=true;status('無法儲存綁定！原有資料未被覆蓋，請檢查儲存空間：'+e.message,true);return false;}}
function mutate(fn){if(!admin())return false;const next=clone(state);fn(next);try{return persist(validate(next));}catch(e){status(e.message,true);return false;}}
function bind(deviceId,stalls){const device=deviceMap().get(deviceId);if(!device||!stalls?.length)return false;const target=stalls.map(resolve);if(target.some(x=>!x)){status('包含不存在的欄格編號',true);return false;}
 return mutate(next=>{const set=new Set(next.bindings[deviceId]||[]);target.forEach(id=>set.add(id));next.bindings[deviceId]=[...set].sort();});}
function unbind(deviceId,stallId){if(!deviceId||!resolve(stallId))return false;return mutate(next=>{const set=new Set(next.bindings[deviceId]||[]);set.delete(resolve(stallId));if(set.size)next.bindings[deviceId]=[...set].sort();else delete next.bindings[deviceId];});}
function linksFor(id){const sid=resolve(id);if(!sid)return [];const map=deviceMap();return Object.entries(state.bindings).filter(([did,a])=>a.includes(sid)).map(([did])=>({id:did,device:map.get(did)||null}));}
function stallsFor(id){return [...(state.bindings[id]||[])];}
function orphanIds(){const current=deviceMap();return Object.keys(state.bindings).filter(id=>!current.has(id));}
function groupIds(group){return penIds.filter(id=>byCell.get(id)?.getAttribute('data-row-id')===group);}
function focus(id){const sid=resolve(id),g=sid&&byCell.get(sid);if(!g||!g.getBBox)return false;
 const cat=g.closest('.cad-layer');if(cat){const layer=cat.getAttribute('data-layer');if(layer&&window.HWViewer?.getState&&!window.HWViewer.getState()[layer]){const newState={...window.HWViewer.getState(),[layer]:true};window.HWViewer.loadState(newState);}}
 const bb=g.getBBox(),view=svg.viewBox.baseVal,ratio=view.height/view.width;const width= Math.max(5.8,bb.width*7),height=width*ratio;const cx=bb.x+bb.width/2,cy=bb.y+bb.height/2;
 svg.setAttribute('viewBox',[cx-width/2,cy-height/2,width,height].join(' '));
 for(const node of allCells)node.classList.toggle('v109-map-target',node===g);
 currentStall=sid;$('v109Lookup').value=sid;showStall(sid);return true;}
function escapeText(id){const e=document.createElement('span');e.textContent=id;return e.textContent;}
const launch=document.createElement('button');launch.type='button';launch.id='v109Launch';launch.className='v109-launch';launch.innerHTML='<span aria-hidden="true">⌕</span><span><b>欄格定位與設備關聯</b><small>輸入編號 · CAD 定位 · 查看服務設備</small></span><span aria-hidden="true">›</span>';
const base=$('v83BasePanel'),eq=$('v83EquipPanel');if(base)base.insertBefore(launch,base.children[2]||null);else document.body.append(launch);
const smallLaunch=document.createElement('button');smallLaunch.type='button';smallLaunch.id='v109EquipOpen';smallLaunch.textContent='⌕ 搜尋欄格／設備服務範圍';smallLaunch.className='v109-equip-link';if(eq)eq.insertBefore(smallLaunch,eq.children[2]||null);
const overlay=document.createElement('div');overlay.className='v109-overlay';overlay.hidden=true;overlay.id='v109Overlay';overlay.innerHTML=`<section class="v109-modal" role="dialog" aria-modal="true" aria-labelledby="v109Heading" tabindex="-1">
<header class="v109-header"><div><small>HUWEI FARM · STALL ↔ EQUIPMENT</small><h2 id="v109Heading">欄格定位與設備智慧連動</h2><p>以 V10.5 已校正的真實 CAD 欄格為基礎；不新增或移動設備圖標</p></div><button id="v109Close" type="button" aria-label="關閉">×</button></header>
<div class="v109-body">
<div class="v109-search"><label for="v109Lookup">搜尋欄格編號</label><div><input id="v109Lookup" placeholder="例如 B-R3-025、MAT-012、G-03" spellcheck="false" autocomplete="off"><button id="v109Go" type="button">在 CAD 定位</button></div><small>育成頭位 G-03-08 會定位至 G-03 欄；B 棟第三排為靠水溝側（CAD 排別位置仍請現場核對）。</small></div>
<div class="v109-columns">
<section class="v109-card"><h3>所選欄格 <span id="v109Current">尚未選擇</span></h3><p id="v109Description" class="v109-sub">可輸入欄號搜尋，或直接在 CAD 上點選欄格。</p><h4>服務這個欄格的設備</h4><div id="v109LinkedDevices" class="v109-items"></div></section>
<section class="v109-card"><h3>指定設備服務範圍</h3><label for="v109Device">選擇已配置設備</label><select id="v109Device"><option value="">— 請先選擇設備 —</option></select>
<div class="v109-buttons"><button id="v109UseSelected" type="button">使用 CAD 目前選取設備</button><button id="v109FindDevice" type="button">在 CAD 找此設備</button></div>
<p id="v109DeviceInfo" class="v109-sub">尚未選取設備。</p><div id="v109DeviceStalls" class="v109-items"></div>
<div class="v109-edit"><label for="v109Scope">綁定方式</label><select id="v109Scope"><option value="one">所選單一欄格</option><option value="row">所選欄格的整排／整區</option></select><button id="v109Bind" type="button">＋ 加入設備服務範圍</button></div><small>一台設備可服務多個欄格；一個欄格也能連結多台設備。管理者可新增／移除，員工只能查看。</small></section>
</div><div class="v109-backup"><span id="v109Counts">載入中</span><button id="v109Export" type="button">匯出關聯 JSON</button><button id="v109Import" type="button">匯入關聯 JSON</button><input type="file" accept=".json,application/json" id="v109File" hidden></div>
<p id="v109Status" class="v109-status" role="status">欄格關聯另存於本機，並納入新版私人加密備份與雲端快照。上傳前請先檢查設備與照片資料。</p>
</div></section>`;
document.body.append(overlay);
let opened=false;function open(){opened=true;overlay.hidden=false;document.body.classList.add('v109-open');render();overlay.querySelector('.v109-modal').focus();}
function close(){opened=false;overlay.hidden=true;document.body.classList.remove('v109-open');}
launch.onclick=open;smallLaunch.onclick=open;$('v109Close').onclick=close;
overlay.addEventListener('click',ev=>{if(ev.target===overlay)close();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){close();e.preventDefault();}});
$('v109Go').onclick=()=>{const id=resolve($('v109Lookup').value);if(!id){status('找不到欄格：請確認編號是否在正式 587 個實體欄格內。',true);return;}focus(id);close();};
$('v109Lookup').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('v109Go').click();}});
$('v109UseSelected').onclick=()=>{const selection=HW.getSelected();if(selection?.kind==='device'&&deviceMap().has(selection.id)){currentDevice=selection.id;render();status('已選取 CAD 設備。');}else status('請先在 CAD 圖上選取設備，再使用此功能。',true);};
$('v109FindDevice').onclick=()=>{if(!currentDevice||!deviceMap().has(currentDevice))return;HW.select('device',currentDevice);const pos=HW.getVisualPlacement(currentDevice)?.physical;if(pos){const b=svg.viewBox.baseVal,w=9.5,h=w*b.height/b.width;svg.setAttribute('viewBox',[pos.x-w/2,pos.y-h/2,w,h].join(' '));}close();};
$('v109Device').onchange=e=>{currentDevice=e.target.value;render();};
$('v109Bind').onclick=()=>{if(!currentDevice||!currentStall){status('請先選擇設備與欄格，再執行綁定。',true);return;}
 const row=byCell.get(currentStall)?.getAttribute('data-row-id'),scope=$('v109Scope').value;const ids=scope==='row'?groupIds(row):[currentStall];
 if(ids.length>1&&!confirm(`將 ${ids.length} 個欄格與這台設備連結（${row}）；確定嗎？`))return;
 if(bind(currentDevice,ids))status(`已連結 ${ids.length} 個欄格，可在設備清單反查服務範圍。`);
};
function makeButton(text,cb,className){const b=document.createElement('button');b.type='button';b.textContent=text;if(className)b.className=className;b.onclick=cb;return b;}
function showStall(id){const current=$('v109Current');current.textContent=id||'尚未選擇';$('v109Description').textContent=id?label(id):'可在 CAD 上點選欄格，或輸入欄號查詢。';const host=$('v109LinkedDevices');host.replaceChildren();if(!id){host.textContent='尚未選擇欄格';return;}
 const linked=linksFor(id);if(!linked.length){host.textContent='尚未綁定設備（不代表現場沒有設備）';return;}
 for(const item of linked){const row=document.createElement('div');row.className='v109-item';const t=document.createElement('span');t.textContent=item.device?`${item.device.name} · ${item.device.zone||'未指定區域'}`:`⚠ 設備 ${item.id} 已不存在（保留關聯待處理）`;row.append(t,makeButton('反查設備',()=>{currentDevice=item.id;render();}));if(admin())row.append(makeButton('解除',()=>{if(unbind(item.id,id))status('已解除此欄格與設備的連結。');},'v109-danger'));host.append(row);}}
function showDevice(){const host=$('v109DeviceStalls');host.replaceChildren();const d=deviceMap().get(currentDevice);$('v109DeviceInfo').textContent=d?`${d.name} · ${d.zone||'未指定區域'} · 真實座標 (${d.x}, ${d.y})`:(currentDevice?'⚠ 此設備在目前專案已不存在。':'請選擇一台設備，查看它服務的欄位。');const routes=(HW.getData().routes||[]).filter(r=>r.fromDeviceId===currentDevice||r.toDeviceId===currentDevice||(r.points||[]).some(p=>p.deviceId===currentDevice));
 if(routes.length){const wrapper=document.createElement('div');wrapper.className='v109-device-routes';const heading=document.createElement('b');heading.textContent=`相連管線（${routes.length} 條）`;wrapper.append(heading);for(const route of routes.slice(0,8)){const b=makeButton((route.confirmed?'✓ ':'○ ')+route.name,()=>{HW.select('route',route.id);close();},'v109-route-btn');b.title=route.group+' · '+(route.confirmed?'已核對':'尚待核對');wrapper.append(b);}if(routes.length>8){const more=document.createElement('small');more.textContent=`另有 ${routes.length-8} 條，可在 CAD 迴路盤點中查看`;wrapper.append(more);}host.append(wrapper);}
 const list=stallsFor(currentDevice);if(!list.length){const msg=document.createElement('small');msg.textContent='沒有已建立的欄格關聯。';host.append(msg);return;}
 const groups=new Map();for(const s of list){const row=byCell.get(s)?.getAttribute('data-row-id')||'其他';groups.set(row,(groups.get(row)||0)+1);}
 const summary=document.createElement('small');summary.className='v109-groups';summary.textContent=[...groups].map(([r,n])=>r+'：'+n+' 格').join(' · ');host.append(summary);
 const listEl=document.createElement('div');listEl.className='v109-stall-list';for(const s of list){const pill=makeButton(s,()=>{focus(s);close();},'v109-stall-pill');listEl.append(pill);}host.append(listEl);
 if(admin())host.append(makeButton('解除此設備與目前所選欄格的連結',()=>{if(currentStall&&unbind(currentDevice,currentStall))status('已解除單一欄格連結。');},'v109-danger v109-unlink'));
}
function render(){const current=devices(),select=$('v109Device'),old=currentDevice;if(currentDevice&&!current.some(d=>d.id===currentDevice)&&!Object.hasOwn(state.bindings,currentDevice))currentDevice='';select.replaceChildren();let empty=document.createElement('option');empty.value='';empty.textContent='— 請選擇設備 —';select.append(empty);
 for(const d of current.slice().sort((a,b)=>(a.zone+a.name).localeCompare(b.zone+b.name,'zh-Hant'))){const opt=document.createElement('option');opt.value=d.id;opt.textContent=(d.zone?d.zone+'／':'')+d.name+' · '+d.id;select.append(opt);}if(old&&!current.some(d=>d.id===old)&&Object.hasOwn(state.bindings,old)){const opt=document.createElement('option');opt.value=old;opt.textContent='⚠ 已刪除設備：'+old;select.append(opt);}
 select.value=currentDevice;const authorized=admin();$('v109Bind').disabled=!authorized||!currentDevice||!currentStall;$('v109Scope').disabled=!authorized;$('v109Import').disabled=!authorized;
 showStall(currentStall);showDevice();const total=Object.values(state.bindings).reduce((n,a)=>n+a.length,0);$('v109Counts').textContent=`${Object.keys(state.bindings).length} 台設備 · ${total} 筆欄格關聯`+(orphanIds().length?` · ⚠ ${orphanIds().length} 個失效設備 ID`:'')+(dirty?' · ⚠ 本機儲存異常':'');}
function handleStallClick(id,g){const resolved=resolve(id);if(!resolved)return;geometry.clear();focus(resolved);open();status('已從 CAD 選取 '+resolved+'。');}
function csvDownload(){const obj={app:'HuweiStallLinks',...getBackupData()};const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='虎尾場_V10.9_欄格設備關聯.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);}
$('v109Export').onclick=csvDownload;$('v109Import').onclick=()=>{if(admin())$('v109File').click();};
$('v109File').onchange=async function(){const file=this.files?.[0];this.value='';if(!file||!admin())return;try{if(file.size>3*1024*1024)throw Error('關聯檔案不能超過 3 MB');const raw=JSON.parse(await file.text());if(raw.app!=='HuweiStallLinks')throw Error('不是 V10.9 設備欄格關聯檔');const next=validate(raw);const map=deviceMap(),missing=Object.keys(next.bindings).filter(id=>!map.has(id));if(missing.length)throw Error('此備份包含 '+missing.length+' 個當前不存在的設備 ID。請先還原對應設備資料再匯入。');if(!confirm('匯入將整份覆蓋目前欄格與設備關聯，是否確定？'))return;if(persist(next))status('已成功還原欄格與設備關聯。');}catch(e){status('匯入失敗：'+e.message,true);}};
function getBackupData(){return {module:'HuweiStallLinks',...clone(state)};}
function restore(raw){try{const next=validate(raw);const map=deviceMap(),missing=Object.keys(next.bindings).filter(id=>!map.has(id));if(missing.length)throw Error('備份的 '+missing.length+' 台設備在目前專案中不存在');return {ok:persist(next),reason:dirty?'本機儲存空間不足':''};}catch(e){return {ok:false,reason:e.message};}}
window.HWStallLinks={openForDevice:(id)=>{if(!deviceMap().has(id))return false;currentDevice=id;open();return true;},version:'10.9',resolve,label,focus,open,close,handleStallClick,bind,unbind,linksFor,stallsFor,groupIds,getState:()=>clone(state),getBackupData,validateBackupData:validate,restore,getSummary:()=>({devices:Object.keys(state.bindings).length,edges:Object.values(state.bindings).reduce((n,a)=>n+a.length,0),orphans:orphanIds().length}),getKnownIds:()=>[...known]};
window.addEventListener('hw-v90-change',ev=>{if(['data','selection','role'].includes(ev.detail?.kind)&&opened)render();});
})();
