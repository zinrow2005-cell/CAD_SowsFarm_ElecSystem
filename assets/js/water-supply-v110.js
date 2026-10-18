/* V11.0 三種水源 / 供水資料查核：僅使用既有設備與管線專案，不修改 CAD 幾何。 */
(function(){'use strict';
const hw=window.HWEquipment;
if(!hw||!document.getElementById('v83EquipPanel'))return;
const $=id=>document.getElementById(id);
const SOURCES={tower:'水塔水',groundwater:'地下水',tap:'自來水',unknown:'未指定'};
const DIRECTIONS={unknown:'未確認方向',forward:'起點 → 終點',reverse:'終點 → 起點'};
const VALVES={unknown:'未知／待現場確認',tower:'水塔水',groundwater:'地下水',tap:'自來水',closed:'關閉（手動紀錄）'};
const clean=s=>String(s??'').trim();
const devices=()=>hw.getData().devices||[];
const routes=()=>hw.getData().routes.filter(r=>r.group==='water');
const admin=()=>hw.getRole()==='admin';
const getDevice=id=>devices().find(d=>d.id===id);
const getRoute=id=>routes().find(r=>r.id===id);
let pickedRoute='',pickedValve='',origin='',opened=false,lastTrace=null;
const make=(tag,text)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;return el;};
const option=(value,label)=>{const el=make('option',label);el.value=value;return el;};
const waterType=t=>hw.getType(t)?.group==='water'||t==='drinker'||t==='curtain';
const sourceType={waterTower:'tower',waterTank:'tower',groundwater:'groundwater',tap:'tap'};
function audit(){const ds=new Map(devices().map(d=>[d.id,d]));const summary={total:0,review:0,confirmed:0,missingEndpoints:0,unknownSource:0,unknownDirection:0,conflicts:0};
 for(const r of routes()){summary.total++;const a=ds.get(r.fromDeviceId),b=ds.get(r.toDeviceId);if(!a||!b||a.id===b.id)summary.missingEndpoints++;if(!r.waterSource||r.waterSource==='unknown')summary.unknownSource++;if(!r.flowDirection||r.flowDirection==='unknown')summary.unknownDirection++;if((a&&sourceType[a.type]&&sourceType[a.type]!==r.waterSource)||(b&&sourceType[b.type]&&sourceType[b.type]!==r.waterSource))summary.conflicts++;if(r.confirmed)summary.confirmed++;else summary.review++;}return summary;}
// Only trace explicit, verified, directed edges from the chosen physical source.
// Stops at valves with unknown / closed / incompatible manually-recorded selector.
function trace(start){const ds=new Map(devices().map(d=>[d.id,d]));const root=ds.get(start);if(!root)return {nodes:[],edges:[],warnings:['來源設備不存在'],source:'unknown'};
 const source=sourceType[root.type]||'unknown',warnings=[];
 if(source==='unknown')warnings.push('此設備不是明確的水塔、井水或自來水進水源，無法作為可信供水源頭');
 const adjacency=new Map();
 for(const r of routes()){
  if(!r.confirmed||!r.fromDeviceId||!r.toDeviceId||r.fromDeviceId===r.toDeviceId||!ds.has(r.fromDeviceId)||!ds.has(r.toDeviceId))continue;
  if(!['forward','reverse'].includes(r.flowDirection)||!['tower','groundwater','tap'].includes(r.waterSource))continue;
  if(source==='unknown'||r.waterSource!==source)continue;
  const from=r.flowDirection==='forward'?r.fromDeviceId:r.toDeviceId, to=r.flowDirection==='forward'?r.toDeviceId:r.fromDeviceId;
  if(!adjacency.has(from))adjacency.set(from,[]);adjacency.get(from).push({to,routeId:r.id});
 }
 const reached=new Set([start]),edges=[],queue=[start],maxNodes=2001;
 while(queue.length&&reached.size<maxNodes){const id=queue.shift(),d=ds.get(id);
  if(d.type==='threeWay'){
   const sw=d.valveSelection||'unknown';if(sw==='closed'){warnings.push(d.name+'：三向閥記錄為關閉，已停止繼續追蹤');continue;}
   if(sw==='unknown'||sw!==source||!(d.waterSources||[]).includes(sw)){warnings.push(d.name+'：三向閥目前的人工選擇位置未確認或與此水源不符，下游不視為已連通');continue;}
  }
  for(const step of adjacency.get(id)||[]){edges.push(step.routeId);if(!reached.has(step.to)){reached.add(step.to);queue.push(step.to);}}
 }
 if(source==='unknown')return {nodes:[root],edges:[],warnings,source};
 const related=routes().filter(r=>reached.has(r.fromDeviceId)||reached.has(r.toDeviceId));
 const unknown=related.filter(r=>!r.confirmed||r.flowDirection==='unknown'||r.waterSource==='unknown'||!r.fromDeviceId||!r.toDeviceId);
 if(unknown.length)warnings.push('接觸到 '+unknown.length+' 條尚未核對、缺少端點或水源／流向不明的水管；這些線路沒有納入連通結果');
 return {nodes:[...reached].map(id=>ds.get(id)).filter(Boolean),edges:[...new Set(edges)],warnings,source};
}
const launch=make('button');launch.id='v110Launch';launch.type='button';launch.className='v110-launch';launch.innerHTML='<span aria-hidden="true">💧</span><span><b>三水源與供水管線</b><small>水塔水 · 地下水 · 自來水 · 管路追蹤</small></span><span>›</span>';
const eq=$('v83EquipPanel');eq.insertBefore(launch,eq.children[3]||null);
const base=$('v83BasePanel');const mini=make('button','💧 三種水源與供水追蹤');mini.id='v110BaseLaunch';mini.type='button';mini.className='v110-mini';if(base)base.insertBefore(mini,base.children[3]||null);
const overlay=make('div');overlay.className='v110-overlay';overlay.id='v110Overlay';overlay.hidden=true;
overlay.innerHTML=`<section class="v110-dialog" role="dialog" aria-modal="true" aria-labelledby="v110Title" tabindex="-1">
<header class="v110-head"><div><small>HUWEI FARM · WATER SUPPLY NETWORK</small><h2 id="v110Title">三種水源與供水管線</h2><p>管理水源、管徑、接點與實際流向；沒有核對的路段不當作已連通</p></div><button type="button" id="v110Close" aria-label="關閉">×</button></header>
<div class="v110-body"><div class="v110-stats" id="v110Stats"></div>
<div class="v110-top"><label class="v110-toggle"><input type="checkbox" id="v110Colors">CAD 供水管路依水源分色</label><button type="button" id="v110UseRoute">使用 CAD 目前選取線路</button><button type="button" id="v110UseValve">使用 CAD 目前選取三向閥</button></div>
<div class="v110-columns"><section class="v110-panel"><h3>① 水管資料與起訖設備</h3><label for="v110Route">選擇既有水管</label><select id="v110Route"></select><div class="v110-fields">
<label>供水來源<select id="v110Source"><option value="unknown">未指定／待現場確認</option><option value="tower">水塔水</option><option value="groundwater">地下水</option><option value="tap">自來水</option></select></label>
<label>實際流向<select id="v110Direction"><option value="unknown">未確認</option><option value="forward">起點 → 終點</option><option value="reverse">終點 → 起點</option></select></label>
<label>起點設備<select id="v110From"></select></label><label>終點設備<select id="v110To"></select></label>
<label>管徑／規格<input id="v110Diameter" placeholder="例如 PVC 1 吋、Ø32 mm" maxlength="55"></label>
<label>材質<input id="v110Material" placeholder="例如 PVC、PE" maxlength="80"></label></div>
<div class="v110-actions"><button type="button" id="v110SaveRoute">儲存水管資料</button><button type="button" id="v110Verify">標記現場已核對</button><button type="button" id="v110Unverify">取消核對</button><button type="button" id="v110LocateRoute">在 CAD 選取此線路</button></div>
<p class="v110-tip" id="v110RouteInfo">請選擇一條水管。改動水源、流向、起訖或規格後會自動取消原核對。</p>
</section><section class="v110-panel"><h3>② 三向閥的可能水源與實際記錄</h3><label for="v110Valve">選擇三向閥</label><select id="v110Valve"></select><div id="v110ValvePossibilities" class="v110-tip">先選擇圖上的三向閥；可能水源在設備編輯器設定。</div><label for="v110ValveState">人工記錄的切換位置（不是即時監測）</label><select id="v110ValveState"><option value="unknown">未知／待確認</option><option value="tower">水塔水</option><option value="groundwater">地下水</option><option value="tap">自來水</option><option value="closed">關閉（記錄）</option></select><button type="button" id="v110SaveValve">保存三向閥紀錄</button>
<div class="v110-divider"></div><h3>③ 已核對管路追蹤</h3><label for="v110Origin">由哪個水源設備出發？</label><select id="v110Origin"></select><button type="button" id="v110Trace">追蹤已核對連接</button><div id="v110TraceResult" class="v110-results">目前沒有開始追蹤。此功能不會判斷真實即時水流。</div>
</section></div>
<p id="v110Status" class="v110-status" role="status">此視窗的水管資料存入原設備專案，隨原有加密備份與雲端快照保存。</p></div></section>`;
document.body.append(overlay);
function status(message,error=false){$('v110Status').textContent=message;$('v110Status').dataset.error=error?'true':'false';}
function lineInfo(){const r=getRoute(pickedRoute);if(!r){$('v110RouteInfo').textContent='尚未選擇任何水管。';return;}
 const f=getDevice(r.fromDeviceId),t=getDevice(r.toDeviceId);$('v110RouteInfo').textContent=(r.confirmed?'✓ 已現場核對':'○ 尚待核對')+' · '+(f?.name||'未設起點')+' → '+(t?.name||'未設終點')+' · '+SOURCES[r.waterSource||'unknown']+' · '+DIRECTIONS[r.flowDirection||'unknown'];}
function renderRouteFields(){const r=getRoute(pickedRoute),inputs=['v110Source','v110Direction','v110From','v110To','v110Diameter','v110Material'];for(const id of inputs)$(id).disabled=!r||!admin();$('v110SaveRoute').disabled=!r||!admin();$('v110Verify').disabled=!r||!admin()||r.confirmed;$('v110Unverify').disabled=!r||!admin()||!r.confirmed;$('v110LocateRoute').disabled=!r;
 $('v110Source').value=r?.waterSource||'unknown';$('v110Direction').value=r?.flowDirection||'unknown';$('v110From').value=r?.fromDeviceId||'';$('v110To').value=r?.toDeviceId||'';$('v110Diameter').value=r?.pipeDiameter||'';$('v110Material').value=r?.pipeMaterial||'';lineInfo();}
function renderValveFields(){const d=getDevice(pickedValve);const s=(d?.waterSources||[]).map(x=>SOURCES[x]).join('＋')||'尚未指定可能水源';$('v110ValvePossibilities').textContent=d?'可接入水源：'+s+'。若需修改，請至原本設備編輯器選取三向閥。':'目前沒有選擇三向閥。';$('v110ValveState').value=d?.valveSelection||'unknown';$('v110ValveState').disabled=!d||!admin();$('v110SaveValve').disabled=!d||!admin();}
function populate(){const data=hw.getData(),rs=data.routes.filter(r=>r.group==='water'),ds=data.devices;const oldRoute=pickedRoute,oldValve=pickedValve,oldOrigin=origin;
 const sr=$('v110Route');sr.replaceChildren(option('','— 選擇水管 —'));for(const r of rs)sr.append(option(r.id,(r.confirmed?'✓ ':'○ ')+r.name+' · '+(SOURCES[r.waterSource]||'水源未知')));pickedRoute=rs.some(r=>r.id===oldRoute)?oldRoute:'';sr.value=pickedRoute;
 for(const id of ['v110From','v110To']){const select=$(id);select.replaceChildren(option('','— 未連接／未指定 —'));for(const d of ds.slice().sort((a,b)=>Number(waterType(b.type))-Number(waterType(a.type))||a.name.localeCompare(b.name,'zh-Hant'))){select.append(option(d.id,(waterType(d.type)?'💧 ':'')+d.name+(d.zone?' · '+d.zone:'')));}}
 const valves=ds.filter(d=>d.type==='threeWay');$('v110Valve').replaceChildren(option('','— 選擇三向閥 —'));for(const d of valves)$('v110Valve').append(option(d.id,d.name+(d.zone?' · '+d.zone:'')));pickedValve=valves.some(d=>d.id===oldValve)?oldValve:'';$('v110Valve').value=pickedValve;
 const origins=ds.filter(d=>sourceType[d.type]&&d.type!=='waterTank');$('v110Origin').replaceChildren(option('','— 選擇供水源頭 —'));for(const d of origins)$('v110Origin').append(option(d.id,(SOURCES[sourceType[d.type]]||'水源')+'｜'+d.name));origin=origins.some(d=>d.id===oldOrigin)?oldOrigin:'';$('v110Origin').value=origin;
 const a=audit();$('v110Stats').replaceChildren();for(const [label,val] of [['水管線路',a.total],['已核對',a.confirmed],['待核對',a.review],['欠缺端點',a.missingEndpoints],['水源未知',a.unknownSource]]){const box=make('div');box.append(make('small',label),make('strong',String(val)));$('v110Stats').append(box);}
 $('v110Colors').checked=document.body.classList.contains('v110-colors');renderRouteFields();renderValveFields();$('v110Trace').disabled=!origin;
}
function open(){opened=true;overlay.hidden=false;document.body.classList.add('v110-open');populate();overlay.querySelector('.v110-dialog').focus();}
function close(){opened=false;overlay.hidden=true;document.body.classList.remove('v110-open');}
launch.addEventListener('click',open);mini.addEventListener('click',open);$('v110Close').addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){e.stopPropagation();close();}});
$('v110Route').onchange=e=>{pickedRoute=e.target.value;renderRouteFields();};$('v110Valve').onchange=e=>{pickedValve=e.target.value;renderValveFields();};$('v110Origin').onchange=e=>{origin=e.target.value;$('v110Trace').disabled=!origin;};
$('v110UseRoute').onclick=()=>{const s=hw.getSelected();if(s?.kind==='route'&&getRoute(s.id)){pickedRoute=s.id;open();status('已從 CAD 選取水管 '+getRoute(s.id).name);}else status('請先在 CAD 選取一條水管',true);};
$('v110UseValve').onclick=()=>{const s=hw.getSelected();if(s?.kind==='device'&&getDevice(s.id)?.type==='threeWay'){pickedValve=s.id;open();status('已從 CAD 選取三向閥')}else status('請先在 CAD 選取一個三向閥設備',true);};
$('v110Colors').onchange=e=>{document.body.classList.toggle('v110-colors',e.target.checked);try{localStorage.setItem('hw-v110-source-colors',e.target.checked?'1':'0');}catch(_e){}};
try{if(localStorage.getItem('hw-v110-source-colors')==='1')document.body.classList.add('v110-colors');}catch(_e){}
function changedRoute(){const before=getRoute(pickedRoute);if(!before||!admin())return false;const from=$('v110From').value,to=$('v110To').value;
 if(from&&to&&from===to){status('水管起點和終點不可為相同設備',true);return false;}
 const points=JSON.parse(JSON.stringify(before.points));if(points.length>=2){if(from)points[0].deviceId=from;else delete points[0].deviceId;if(to)points[points.length-1].deviceId=to;else delete points[points.length-1].deviceId;}
 const patch={waterSource:$('v110Source').value,flowDirection:$('v110Direction').value,pipeDiameter:clean($('v110Diameter').value).slice(0,55),pipeMaterial:clean($('v110Material').value).slice(0,80),fromDeviceId:from,toDeviceId:to,points};
 const ok=hw.updateDetails('route',before.id,patch);if(ok){populate();status('水管資料已保存。若水源、路線端點、管徑或方向變更，核對狀態已清除；請重新現場確認。');}else status('水管資料未保存。請先切換管理者本機編輯模式。',true);return ok;
}
$('v110SaveRoute').onclick=changedRoute;
$('v110Verify').onclick=()=>{const r=getRoute(pickedRoute);if(!admin()||!r)return;const fieldsChanged= r.waterSource!==$('v110Source').value||r.flowDirection!==$('v110Direction').value||r.fromDeviceId!==$('v110From').value||r.toDeviceId!==$('v110To').value||r.pipeDiameter!==clean($('v110Diameter').value)||r.pipeMaterial!==clean($('v110Material').value);if(fieldsChanged){status('欄位尚未儲存，請先按「儲存水管資料」，現場確認後再核對。',true);return;}
 if(!r.fromDeviceId||!r.toDeviceId||r.fromDeviceId===r.toDeviceId||!getDevice(r.fromDeviceId)||!getDevice(r.toDeviceId)||!['tower','groundwater','tap'].includes(r.waterSource)||!['forward','reverse'].includes(r.flowDirection)){status('需要有效起訖設備、指定水源與流向，才可標記為現場已核對。',true);return;}
 if(!confirm('已到現場核對這段管線的兩端設備、水源與流向？\n\n此核對紀錄不代表正在即時通水。'))return;
 if(hw.updateDetails('route',r.id,{confirmed:true})){populate();status('此段水管已標記現場核對。');}else status('無法保存核對紀錄',true);
};
$('v110Unverify').onclick=()=>{const r=getRoute(pickedRoute);if(r&&admin()&&hw.updateDetails('route',r.id,{confirmed:false})){populate();status('已取消此段水管的現場核對狀態。');}};
$('v110LocateRoute').onclick=()=>{if(!pickedRoute)return;hw.select('route',pickedRoute);close();};
$('v110SaveValve').onclick=()=>{const d=getDevice(pickedValve);if(!d||!admin())return;const selected=$('v110ValveState').value;
 if(['tower','groundwater','tap'].includes(selected)&&!(d.waterSources||[]).includes(selected)){status('三向閥尚未設定可接入「'+SOURCES[selected]+'」。請先在原設備編輯器設定可能水源。',true);return;}
 if(hw.updateDetails('device',d.id,{valveSelection:selected})){populate();status('已儲存三向閥的人工選擇位置（不代表即時狀態），其相關線路需要重新核對。');}else status('儲存三向閥紀錄失敗。',true);
};
$('v110Trace').onclick=()=>{if(!origin){status('請先選擇水源設備',true);return;}lastTrace=trace(origin);const el=$('v110TraceResult');el.replaceChildren();const title=make('div','已核對的可追蹤設備：'+lastTrace.nodes.length+' 台／點；管線 '+lastTrace.edges.length+' 條');title.className='v110-summary';el.append(title);
 for(const d of lastTrace.nodes){const b=make('button',(d.id===origin?'起點｜':'')+d.name+(d.zone?' · '+d.zone:''));b.type='button';b.onclick=()=>{hw.select('device',d.id);close();};el.append(b);}
 for(const warning of lastTrace.warnings){const p=make('p','⚠ '+warning);p.className='v110-warning';el.append(p);}
 if(!lastTrace.edges.length)el.append(make('small','沒有已核對且方向明確的下游管線。這只表示資料不足，不代表現場沒有接通。'));
 status('追蹤已完成；僅根據已核對的線路與人工記錄的閥位，不代表即時水壓或實際通水。');
};
window.addEventListener('hw-v90-change',ev=>{if(opened&&['data','role','selection'].includes(ev.detail?.kind))populate();});
window.HWWaterV110={version:'11.0',audit,trace,open,close,setRoute:(id)=>{if(!getRoute(id))return false;pickedRoute=id;if(opened)populate();return true;},sourceLabels:{...SOURCES},getDisplayState:()=>({opened,route:pickedRoute,origin,lastTrace})};
})();
