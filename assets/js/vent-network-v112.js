/* V11.2 - Ventilation equipment register, electric/water associations, airflow diagram.
   No invented facilities or wires: read-only projections of canonical HWEquipment records;
   equipment specifications are saved as ordinary device.fields and survive all existing backups.
*/
(()=>{'use strict';
const hw=window.HWEquipment,stall=window.HWStallLinks;
if(!hw)return;
const $=id=>document.getElementById(id), mk=(tag,cls='',value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e;};
const TYPES=new Set(['curtain','fan','smallFan','guideFan','ceilingFan','roofFan','airInlet','airOutlet','sensor','controller','mist']);
const ZONES=[
 ['farrowing36','產房 36 床單位','左側水簾、導流板；右側 3 台排風扇（每排 1 台，位置待核對）'],
 ['farrowing42','產房 42 床單位','左側水簾、導流板；右側 3 台排風扇（每排 1 台，位置待核對）'],
 ['matingGilt','配種／新女豬育成區','左側水簾、右側排風扇、中央導引扇'],
 ['gestationWet','妊娠舍（水簾區）','左側水簾、右側排風扇、中央導引扇'],
 ['gestationDry','妊娠舍（無水簾區）','牆下排風、導流板與導引扇；不得自行假設有效風量'],
 ['boar','公豬舍','有水簾；排風設備以實際量測的小尺寸風扇為準'],
 ['other','其他／未歸類','先確認棟舍與設備位置，再填入真實規格']
];
const LABELS=Object.fromEntries(ZONES.map(z=>[z[0],z[1]]));
const KEYS={area:'HVAC_區域',size:'HVAC_尺寸',watts:'HVAC_功率W',airflow:'HVAC_風量m3h',purpose:'HVAC_用途'};
const field=(d,key)=>String((d.fields||[]).find(x=>x.key===KEYS[key])?.value||'');
const vent=d=>!!d&&(TYPES.has(d.type)||hw.getType(d.type)?.group==='ventilation');
const devMap=()=>new Map(hw.getData().devices.map(d=>[d.id,d]));
function groupLinks(d,p){const matching=p.routes.filter(r=>{const a=r.fromDeviceId||r.points?.[0]?.deviceId,b=r.toDeviceId||r.points?.at(-1)?.deviceId;return a===d.id||b===d.id;});
 const all=new Map(p.devices.map(x=>[x.id,x]));
 return {electric:matching.filter(r=>r.group==='electric'),water:matching.filter(r=>r.group==='water'),air:matching.filter(r=>r.group==='ventilation'),
  valid:r=>{const a=r.fromDeviceId||r.points?.[0]?.deviceId,b=r.toDeviceId||r.points?.at(-1)?.deviceId;return !!a&&!!b&&a!==b&&all.has(a)&&all.has(b)},
  endpoint:r=>{const a=r.fromDeviceId||r.points?.[0]?.deviceId,b=r.toDeviceId||r.points?.at(-1)?.deviceId;const other=a===d.id?b:a;return all.get(other)?.name||'未指定／已刪除端點';}};
}
function audit(){const p=hw.getData(),devices=p.devices.filter(vent),zones=ZONES.map(([id,label,reference])=>({id,label,reference,devices:devices.filter(d=>field(d,'area')===id)}));
 const knownWatts=devices.filter(d=>/^\d+(?:\.\d+)?$/.test(field(d,'watts'))&&Number(field(d,'watts'))>0);
 const totalWatts=knownWatts.reduce((n,d)=>n+Number(field(d,'watts')),0);
 return {devices,zones,totalWatts,knownWatts:knownWatts.length,unassigned:devices.filter(d=>!LABELS[field(d,'area')]||field(d,'area')==='other'),
  fans:devices.filter(d=>['fan','smallFan','guideFan','ceilingFan','roofFan'].includes(d.type)).length,
  curtains:devices.filter(d=>d.type==='curtain').length,
  electrical:p.routes.filter(r=>r.group==='electric').length,
  airflow:p.routes.filter(r=>r.group==='ventilation').length};
}
const ov=mk('div','v112v-overlay');ov.id='v112VentOverlay';ov.hidden=true;
ov.innerHTML=`<section class="v112v-dialog" role="dialog" aria-modal="true" aria-labelledby="v112vTitle" tabindex="-1">
<header class="v112v-head"><div><small>HUWEI FARM · V11.2 · VENTILATION</small><h2 id="v112vTitle">通風設備與水電關聯</h2><p>現場設備清冊 × 各區規格 × 供電與水簾供水 × 氣流示意</p></div><button type="button" id="v112vClose" aria-label="關閉通風管理">×</button></header>
<div class="v112v-scroll"><div class="v112v-stats" id="v112vStats"></div><p id="v112vPowerSummary" class="v112v-muted" aria-live="polite"></p>
<div class="v112v-controls"><label>設備名稱／位置搜尋<input type="search" id="v112vSearch" placeholder="排風、水簾、導引扇、配電…"></label><label>區域篩選<select id="v112vFilter"><option value="">全部區域</option></select></label><label>選擇已放置的設備<select id="v112vDevice"><option value="">請先選擇通風設備</option></select></label></div>
<div class="v112v-layout"><section class="v112v-panel"><h3>各區通風配置參考 <small>不代表已安裝數量</small></h3><div id="v112vZones"></div><p class="v112v-muted">本場所有棟舍無天花板。產房36／42床的右側風扇配置、配種與妊娠區導流及公豬舍尺寸，都須以現場位置和實際規格核對。不得把此參考配置當成完工資料。</p></section>
<section class="v112v-panel"><h3>所選設備資料 <small id="v112vType"></small></h3><div id="v112vEmpty" class="v112v-muted">請選擇一台已放到 CAD 的通風設備。沒有資料時，可先從原本的通風設備模板放置圖標。</div>
<div id="v112vForm" hidden><div class="v112v-formgrid">
<label>服務區域<select id="v112vArea"></select></label>
<label>設備尺寸／型號<input id="v112vSize" maxlength="100" placeholder="例：42 吋／依實測"></label>
<label>額定功率（W）<input id="v112vWatts" type="number" min="0" max="200000" step="0.01" placeholder="尚未量測可留白"></label>
<label>額定風量（m³/h）<input id="v112vAirflow" type="number" min="0" max="2000000" step="0.01" placeholder="尚未確認可留白"></label>
<label class="wide">服務用途／氣流方向說明<input id="v112vPurpose" maxlength="200" placeholder="例如右側排風／中間導風"></label></div>
<div class="v112v-actions"><button type="button" id="v112vSave">儲存設備規格</button><button type="button" id="v112vLocate">CAD 定位設備</button><button type="button" id="v112vBind">設定服務欄格</button></div>
<div id="v112vStallInfo" class="v112v-stalls"></div>
<h4>供電線路 <span>電力系統</span></h4><div id="v112vElectric" class="v112v-links"></div>
<h4>水簾進水 <span>水路系統</span></h4><div id="v112vWater" class="v112v-links"></div>
<h4>氣流示意 <span>非供電電線</span></h4><div id="v112vAir" class="v112v-links"></div>
</div></section></div>
<div id="v112vStatus" class="v112v-status" role="status">所有設備規格保存在原本設備資料的 fields 中，隨現有備份及雲端快照保存。</div>
<p class="v112v-muted">「已核對」表示人工核對紀錄，不代表風扇正在運轉、已通電、水簾正在進水，或感測器即時回傳。電力備援容量不能只憑額定瓦數推定，還須評估啟動電流及同時負載。</p>
</div></section>`;
document.body.append(ov);
const launch=mk('button','v112v-launch','❂ 通風設備／供電與水簾關聯');launch.id='v112VentLaunch';launch.type='button';
const panel=$('v83EquipPanel');if(panel)panel.insertBefore(launch,panel.children[2]||null);
let opened=false,selected='',filter='',search='';
const label=d=>hw.getType(d.type)?.label||d.type;
function opt(val,text){const x=new Option(text,val);return x;}
function state(text,ok){return mk('span','v112v-pill '+(ok?'ok':'pending'),text);}
function status(text,bad=false){$('v112vStatus').textContent=text;$('v112vStatus').dataset.error=bad?'1':'0';}
function runFocus(d){hw.select('device',d.id);hw.focus(d.x,d.y);close();}
function routeCard(r,valid,endpoint,group){const row=mk('div','v112v-link'),left=mk('div','v112v-linktext');left.append(mk('b','',r.name||'未命名線路'),mk('small','',endpoint));
 const confirmed=valid&&r.confirmed===true;row.append(left,state(confirmed?'已人工核對':!valid?'缺少有效端點':'尚待核對',confirmed));
 const b=mk('button','','在 CAD 選取');b.type='button';b.onclick=()=>{hw.select('route',r.id);close();};row.append(b);return row;}
function showAssociations(d){const p=hw.getData(),l=groupLinks(d,p);
 for(const [group,id] of [['electric','v112vElectric'],['water','v112vWater'],['air','v112vAir']]){const host=$(id);host.replaceChildren();const set=l[group];
  if(!set.length)host.append(mk('p','v112v-muted',group==='electric'?'尚未綁定供電線。':'尚未建立'+(group==='water'?'水路':'氣流示意')+'連接。'));
  for(const r of set)host.append(routeCard(r,l.valid(r),l.endpoint(r),group));
 }
 const ids=stall?.stallsFor?.(d.id)||[];const host=$('v112vStallInfo');host.replaceChildren();host.append(mk('b','','已綁定欄格：'+ids.length+' 格／頭位'));
 if(ids.length)host.append(mk('small','',ids.slice(0,8).join('、')+(ids.length>8?`…等 ${ids.length} 筆`:'')));
}
function populate(){if(!opened)return;
 const report=audit(),p=hw.getData(),deviceList=report.devices;
 const stats=$('v112vStats');stats.replaceChildren();
 for(const [key,val] of [['通風類設備',deviceList.length],['排風／導引等風扇',report.fans],['水簾設備',report.curtains],['已填功率設備',`${report.knownWatts}／${deviceList.length}`]]){const a=mk('div','v112v-stat');a.append(mk('span','',key),mk('strong','',val));stats.append(a);}
 $('v112vPowerSummary').textContent=`已填額定功率合計：${report.totalWatts.toLocaleString('zh-TW')} W（只含已填規格 ${report.knownWatts}／${deviceList.length} 台；不是全場實際負載或發電機容量）。`;
 const zhost=$('v112vZones');zhost.replaceChildren();for(const z of report.zones){const a=mk('button','v112v-zone'+(filter===z.id?' active':''));a.type='button';
  a.append(mk('b','',z.label),mk('span','',z.devices.length+' 台已建檔設備'),mk('small','',z.reference));a.onclick=()=>{filter=filter===z.id?'':z.id;$('v112vFilter').value=filter;populate();};zhost.append(a);}
 const list=deviceList.filter(d=>(!filter||(filter==='unassigned'?!LABELS[field(d,'area')]||field(d,'area')==='other':field(d,'area')===filter))&&`${d.name} ${d.zone} ${label(d)}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name,'zh-Hant'));
 const pick=$('v112vDevice');pick.replaceChildren(opt('','— 選擇已放置設備 —'));
 list.forEach(d=>pick.add(opt(d.id,`${d.name} · ${label(d)} · ${LABELS[field(d,'area')]||'未歸類'}`)));
 if(selected&&!list.some(d=>d.id===selected)&&deviceList.some(d=>d.id===selected))pick.add(opt(selected,'目前選取的設備（不符合篩選）'));
 if(!deviceList.some(d=>d.id===selected))selected='';pick.value=selected;
 const d=deviceList.find(x=>x.id===selected),enabled=!!d;
 $('v112vForm').hidden=!enabled;$('v112vEmpty').hidden=enabled;
 $('v112vType').textContent=d?label(d)+' · '+(d.zone||'位置未分類'):'';
 if(d){$('v112vArea').value=field(d,'area')||'other';$('v112vSize').value=field(d,'size');$('v112vWatts').value=field(d,'watts');$('v112vAirflow').value=field(d,'airflow');$('v112vPurpose').value=field(d,'purpose');showAssociations(d);}
 const edit=enabled&&hw.getRole()==='admin';for(const id of ['v112vArea','v112vSize','v112vWatts','v112vAirflow','v112vPurpose','v112vSave'])$(id).disabled=!edit;
 $('v112vLocate').disabled=!enabled;$('v112vBind').disabled=!enabled;
}
function open(id){if(id&&hw.getData().devices.some(d=>d.id===id&&vent(d)))selected=id;opened=true;ov.hidden=false;populate();ov.querySelector('.v112v-dialog').focus();}
function close(){opened=false;ov.hidden=true;}
function saveSpec(){const d=hw.getData().devices.find(x=>x.id===selected);if(!d||!vent(d)||hw.getRole()!=='admin'){status('員工唯讀：不可編輯設備規格',true);return false;}
 const val={area:$('v112vArea').value,size:$('v112vSize').value.trim(),watts:$('v112vWatts').value.trim(),airflow:$('v112vAirflow').value.trim(),purpose:$('v112vPurpose').value.trim()};
 for(const key of ['watts','airflow'])if(val[key]!==''&&(!/^\d+(?:\.\d{1,2})?$/.test(val[key])||Number(val[key])<0||Number(val[key])>(key==='watts'?200000:2000000))){status((key==='watts'?'功率':'風量')+'請輸入有效非負數字，或留空表示未知',true);return false;}
 if(!LABELS[val.area]){status('服務區域無效',true);return false;}
 const fields=(d.fields||[]).filter(f=>!Object.values(KEYS).includes(f.key));
 for(const [key,name] of Object.entries(KEYS))if(val[key]!=='')fields.push({key:name,value:val[key]});
 if(fields.length>30){status('設備規格欄位已滿（最多 30 項），請先整理原設備規格',true);return false;}
 const oldPower=field(d,'watts'),oldSize=field(d,'size');
 if(!hw.updateDetails('device',d.id,{fields})){status('儲存失敗，請檢查設備編輯權限及儲存空間',true);return false;}
 let affected=0;
 if(oldPower!==val.watts||oldSize!==val.size){
  for(const r of groupLinks(d,hw.getData()).electric){if(r.confirmed&&hw.updateDetails('route',r.id,{confirmed:false}))affected++;}
 }
 populate();status('設備規格已保存到既有專案。'+(affected?'因尺寸／功率變更，已將 '+affected+' 條供電迴路改為待核對。':''));return true;
}
$('v112vClose').onclick=close;ov.addEventListener('click',e=>{if(e.target===ov)close();});
document.addEventListener('keydown',e=>{if(opened&&e.key==='Escape'){e.stopPropagation();close();}});
launch.onclick=()=>{const selectedOnCad=hw.getSelected();open(selectedOnCad?.kind==='device'?selectedOnCad.id:undefined);};$('v112vSearch').oninput=e=>{search=e.target.value.trim();populate();};
const f=$('v112vFilter');ZONES.forEach(z=>f.add(opt(z[0],z[1])));f.add(opt('unassigned','尚未指定有效區域'));
const area=$('v112vArea');ZONES.forEach(z=>area.add(opt(z[0],z[1])));
f.onchange=e=>{filter=e.target.value;populate();};$('v112vDevice').onchange=e=>{selected=e.target.value;populate();};
$('v112vSave').onclick=saveSpec;
$('v112vLocate').onclick=()=>{const d=devMap().get(selected);if(d)runFocus(d);};
$('v112vBind').onclick=()=>{const id=selected;if(!id)return;close();if(!stall?.openForDevice?.(id))stall?.open?.();};
window.addEventListener('hw-v90-change',e=>{if(opened&&['data','role','history'].includes(e.detail?.kind))populate();});
window.addEventListener('hw-v109-change',()=>{if(opened)populate();});
window.HWVentilationV112={version:'11.2',open,close,audit,groupLinks,saveSpec,knownZones:ZONES.map(([id,label,reference])=>({id,label,reference}))};
})();
