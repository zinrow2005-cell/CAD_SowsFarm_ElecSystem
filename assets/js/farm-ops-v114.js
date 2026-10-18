/* HUWEI FARM V11.4 — all-farm lookup + work orders, no changes to CAD geometry. */
(function(){'use strict';
const hw=window.HWEquipment, links=window.HWStallLinks;
if(!hw)return;
const $=id=>document.getElementById(id), el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;};
const TYPES={device:'設備',route:'管線',stall:'欄格',work:'維修單',photo:'設備照片',marker:'照片標記'};
const CATS={water:'水路',electric:'電力',feed:'飼料',ventilation:'氣流',equipment:'其他'};
const KINDS={fault:'異常通報',repair:'設備維修',inspection:'定期巡檢',replacement:'零件更換'};
const STATUSES={open:'待處理',working:'處理中',done:'已完成'};
const PRIORITIES={high:'高',normal:'一般',low:'低'};
const escCSV=value=>{let s=String(value??'');if(/^[\s\uFEFF]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
const openFile=(filename,contents)=>{const blob=new Blob(['\ufeff'+contents],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),6000);};
const overlay=el('div','v114-overlay');overlay.id='v114Overlay';overlay.hidden=true;
overlay.innerHTML=`<section class="v114-dialog" role="dialog" aria-modal="true" aria-labelledby="v114Title" tabindex="-1">
<header class="v114-header"><div><small>HUWEI FARM · OPERATIONS DESK · V11.8</small><h2 id="v114Title">全場設備、照片標記與維修搜尋</h2><p>搜尋配電開關與照片標記、CAD 設備及維修紀錄 · 直接使用已建檔資料</p></div><button type="button" id="v114Close" aria-label="關閉搜尋與維修工作台">✕</button></header>
<div class="v114-stats" id="v114Stats"></div>
<div class="v114-toolbar"><div class="v114-search"><span aria-hidden="true">⌕</span><input id="v114Query" type="search" autocomplete="off" placeholder="輸入設備、開關用途、標記文字、棟舍、B-R3-025…" aria-label="全場關鍵字搜尋"/></div><select id="v114Category" aria-label="搜尋類型"><option value="all">全部類型</option><option value="device">設備</option><option value="route">管線</option><option value="stall">欄格</option><option value="work">維修單</option><option value="photo">照片／開關標記</option></select><select id="v114WorkStatus" aria-label="維修單狀態"><option value="all">全部維修狀態</option><option value="open">待處理</option><option value="working">處理中</option><option value="done">已完成</option></select></div>
<div class="v114-main"><section class="v114-left"><div class="v114-subhead"><b>查詢結果</b><span id="v114Count">0 筆</span></div><div id="v114Results" class="v114-results"></div><p class="v114-muted">最多顯示前 120 筆；請輸入更具體的設備名稱或欄格編號。</p></section>
<section class="v114-right"><div id="v114Detail" class="v114-detail"></div>
<div class="v114-subhead v114-audit-title"><b>全場資料檢查</b><button id="v114Export" type="button">↓ 維修清冊 CSV</button></div><div id="v114Audit" class="v114-audit"></div></section></div>
<div class="v114-bottom"><span id="v114Message" role="status" aria-live="polite">維修資料納入原專案 JSON 及私人加密備份。資料盤點不是即時故障監控。</span><button type="button" id="v114New" class="v114-primary">＋ 新增維修／巡檢紀錄</button></div>
</section>`;
document.body.append(overlay);
const launch=el('button','v114-launch','⌕ 全場設備搜尋／維修紀錄 →');launch.id='v114Launch';launch.type='button';$('v83EquipPanel')?.insertBefore(launch,$('v83EquipPanel').children[2]||null);
const fab=el('button','v114-fab','⌕ 搜尋');fab.id='v114Fab';fab.type='button';fab.setAttribute('aria-label','搜尋設備及維修紀錄');document.body.append(fab);
let opened=false,picked=null,editing='',notice='';
const get=()=>hw.getData(),dateNow=()=>new Date().toLocaleDateString('en-CA');
function btn(text,click,cls=''){const b=el('button',cls,text);b.type='button';b.addEventListener('click',click);return b;}
function msg(t,error=false){notice=t;$('v114Message').textContent=t;$('v114Message').dataset.error=error?'true':'false';}
function select(kind,id){picked={kind,id};render();}
function open(kind,id){if(kind&&id)picked={kind,id};else {const sel=hw.getSelected();if(sel&&sel.kind)picked={kind:sel.kind,id:sel.id};}opened=true;overlay.hidden=false;render();overlay.querySelector('.v114-dialog').focus();}
function close(){opened=false;overlay.hidden=true;editing='';}
function mapLocate(kind,id){const data=get();if(kind==='stall'){if(!links?.focus?.(id)){msg('CAD 找不到此欄格，請核對幾何編號',true);return;}close();return;}
 const item=(kind==='device'?data.devices:data.routes).find(x=>x.id===id);if(!item){msg('對應設備／管線已不存在',true);return;}
 hw.setWorkspace('equipment');hw.select(kind,id);const pos=kind==='device'?item:item.points[Math.floor(item.points.length/2)];if(pos)hw.focus(pos.x,pos.y);close();}
function activeRecords(data){return data.maintenance.filter(w=>!w.archived);}
function issueItems(data){const out=[];const map=new Map(data.devices.map(d=>[d.id,d]));const routes=new Map(data.routes.map(r=>[r.id,r]));
 for(const r of data.routes){if(['electric','water','feed'].includes(r.group)){
   if(!r.fromDeviceId||!r.toDeviceId||!map.has(r.fromDeviceId)||!map.has(r.toDeviceId))out.push({key:'route:'+r.id,text:'管線缺少有效起訖設備：'+r.name,kind:'route',id:r.id});
   else if(!r.confirmed)out.push({key:'review:'+r.id,text:'管線尚待現場核對：'+r.name,kind:'route',id:r.id});
 }}
 for(const w of activeRecords(data)){
  if(w.deviceId&&!map.has(w.deviceId))out.push({key:'missing:'+w.id,text:'維修單引用已刪除設備：'+w.title,kind:'work',id:w.id});
  if(w.routeId&&!routes.has(w.routeId))out.push({key:'missingroute:'+w.id,text:'維修單引用已刪除管線：'+w.title,kind:'work',id:w.id});
  if(w.dueDate&&w.status!=='done'&&w.dueDate<dateNow())out.push({key:'overdue:'+w.id,text:'維修單超過預定日期：'+w.title,kind:'work',id:w.id});
 }
 return out;
}
function resultItems(data){const q=$('v114Query').value.trim().toLocaleLowerCase(),cat=$('v114Category').value,stat=$('v114WorkStatus').value;
 const arr=[],push=(kind,id,title,sub,search)=>{if((cat==='all'||cat===kind)&&(!q||search.toLocaleLowerCase().includes(q)))arr.push({kind,id,title,sub});};
 if(cat==='all'||cat==='device')for(const d of data.devices){const label=hw.getType(d.type)?.label||d.type;push('device',d.id,d.name,`${d.zone||'未指定區域'} · ${label}`,[d.id,d.name,d.zone,label,d.note,(d.fields||[]).map(f=>f.key+' '+f.value).join(' ')].join(' '));}
 if(cat==='all'||cat==='route')for(const r of data.routes)push('route',r.id,r.name,`${CATS[r.group]||r.group} · ${r.confirmed?'原紀錄已核對':'待核對'}`,[r.id,r.name,r.note,r.circuitName,r.purpose,r.fromDeviceId,r.toDeviceId].join(' '));
 if(cat==='all'||cat==='stall'){
  const ids=links?.getKnownIds?.()||[];const exact=q?links?.resolve?.(q):null;
  if(exact){push('stall',exact,exact,links.label(exact),exact+' '+links.label(exact));}
  else if(q){for(const id of ids){const name=links.label(id);if((id+' '+name).toLocaleLowerCase().includes(q))push('stall',id,id,name,id+' '+name);if(arr.length>180)break;}}
 }
 // V11.8 — Photo markers and terminal purposes remain attached to original
 // device / photo / marker IDs; no duplicate image index is persisted.
 if(cat==='all'||cat==='photo')for(const d of data.devices){
  const terms=new Map((d.terminals||[]).map(t=>[t.id,t]));
  for(const ph of d.photos||[]){
   const photoKey=[d.id,ph.id].join('|');
   if(cat==='photo'||q)push('photo',photoKey,ph.name||'現場照片',`${d.name} · ${d.zone||'未填棟舍'} · ${(ph.markers||[]).length} 處標記`,[d.name,d.zone,ph.name,ph.id].join(' '));
   for(const mark of ph.markers||[]){
    const term=terms.get(mark.terminalId);
    // Default all-category view should not be flooded with individual pins.
    if(!q&&cat!=='photo')continue;
    push('marker',[d.id,ph.id,mark.id].join('|'),mark.title||'未命名標記',`${d.name} · ${ph.name||'設備照片'}`,
     [d.id,d.name,d.zone,ph.name,mark.title,mark.note,term?.name,term?.controls,term?.purpose].join(' '));
   }
  }
 }
 if(cat==='all'||cat==='work')for(const w of activeRecords(data))if(stat==='all'||stat===w.status){const d=data.devices.find(x=>x.id===w.deviceId);push('work',w.id,w.title,`${STATUSES[w.status]} · ${d?.name||'設備已移除'} · ${w.workDate||'未填日期'}`,[w.id,w.title,w.description,w.result,w.assignee,w.reporter,d?.name,d?.zone].join(' '));}
 return arr;
}
function renderStats(data){const issues=issueItems(data),work=activeRecords(data);$('v114Stats').replaceChildren();for(const [number,label] of [[data.devices.length,'已建設備'],[data.routes.length,'已建管線'],[work.filter(w=>w.status!=='done').length,'待處理／處理中'],[issues.length,'需盤點項目']]){const card=el('div','v114-stat');card.append(el('b','',number),el('small','',label));$('v114Stats').append(card);}}
function renderResults(data){const all=resultItems(data),host=$('v114Results');host.replaceChildren();$('v114Count').textContent=all.length+(all.length>120?'（顯示前120筆）':'')+' 筆';
 if(!all.length)host.append(el('p','v114-empty','沒有符合的紀錄。可改用設備名稱、欄格編號或縮小篩選範圍。'));
 for(const o of all.slice(0,120)){const b=btn('',()=>select(o.kind,o.id),'v114-item'+(picked?.kind===o.kind&&picked?.id===o.id?' is-active':''));const a=el('span','v114-kind',TYPES[o.kind]);const mid=el('span','v114-item-mid');mid.append(el('b','',o.title),el('small','',o.sub));b.append(a,mid);host.append(b);}
}
function row(parent,label,value){const e=el('div','v114-row');e.append(el('small','',label),el('span','',value||'未填'));parent.append(e);return e;}
function section(parent,title){const h=el('h4','',title);parent.append(h);return h;}
function chip(text,cb){return btn(text,cb,'v114-chip');}
function routeTouches(r,id){return r.fromDeviceId===id||r.toDeviceId===id||r.points?.some(p=>p.deviceId===id);}
function workButtons(host,data,deviceId){const w=activeRecords(data).filter(x=>x.deviceId===deviceId).sort((a,b)=>(b.workDate||b.createdAt).localeCompare(a.workDate||a.createdAt));
 section(host,`維修／巡檢紀錄（${w.length}）`);
 host.append(btn('＋ 為此設備新增工作單',()=>{if(hw.getRole()!=='admin')return msg('請先切換管理者編輯模式',true);form('',deviceId);},'v114-primary'));
 if(!w.length)host.append(el('p','v114-muted','尚無工作單（不代表設備已通過現場檢查）。'));
 for(const entry of w.slice(0,18))host.append(chip(`${STATUSES[entry.status]} · ${entry.title}`,()=>select('work',entry.id)));
}
function renderDevice(host,data,id){const d=data.devices.find(x=>x.id===id);if(!d){host.append(el('p','v114-empty','這台設備已不存在。'));return;}
 host.append(el('h3','',d.name));row(host,'設備 ID',d.id);row(host,'區域',d.zone);row(host,'設備類型',hw.getType(d.type)?.label||d.type);
 const buttons=el('div','v114-buttons');buttons.append(btn('⌖ CAD 定位',()=>mapLocate('device',d.id),'v114-primary'),btn('查看設備照片',()=>{close();hw.select('device',d.id);window.HWDeviceRecords?.open('photos');}));host.append(buttons);
 const rows=data.routes.filter(r=>routeTouches(r,d.id));section(host,`關聯管線（${rows.length}）`);
 if(!rows.length)host.append(el('p','v114-muted','沒有已建檔連接，不表示現場沒有管線。'));
 for(const r of rows.slice(0,24)){const b=chip(`${CATS[r.group]||r.group} · ${r.confirmed?'原紀錄已核對':'待核對'} · ${r.name}`,()=>select('route',r.id));host.append(b);}
 const stalls=links?.stallsFor?.(d.id)||[];section(host,`服務欄格（${stalls.length}）`);if(stalls.length){const wrap=el('div','v114-chips');for(const s of stalls.slice(0,36))wrap.append(chip(s,()=>mapLocate('stall',s)));host.append(wrap);if(stalls.length>36)host.append(el('small','v114-muted','只顯示前36格，可到欄格關聯工作台查看全部。'));}
 else host.append(el('p','v114-muted','目前尚未建立欄格服務關聯。'));
 workButtons(host,data,d.id);
}
function renderRoute(host,data,id){const r=data.routes.find(x=>x.id===id);if(!r){host.append(el('p','v114-empty','管線已不存在。'));return;}
 host.append(el('h3','',r.name));row(host,'系統',CATS[r.group]||r.group);row(host,'圖面核對紀錄',r.confirmed?'已有核對標記（仍須以現場為準）':'待現場核對');row(host,'用途',r.purpose||r.note);row(host,'起點設備',data.devices.find(d=>d.id===r.fromDeviceId)?.name||'未建立起點');row(host,'終點設備',data.devices.find(d=>d.id===r.toDeviceId)?.name||'未建立終點');
 const buttons=el('div','v114-buttons');buttons.append(btn('⌖ 定位線路',()=>mapLocate('route',r.id),'v114-primary'));for(const id of [r.fromDeviceId,r.toDeviceId])if(id&&data.devices.some(d=>d.id===id))buttons.append(btn('查看 '+data.devices.find(d=>d.id===id).name,()=>select('device',id)));host.append(buttons);
 host.append(el('p','v114-muted','線路狀態來自已建檔資料；沒有即時傳感器數值或自動故障偵測。'));
}
function renderStall(host,data,id){host.append(el('h3','',id));row(host,'區域',links.label(id));const associated=links.linksFor(id);section(host,`關聯設備（${associated.length}）`);for(const x of associated)host.append(chip(x.device?.name||'設備已移除',()=>select('device',x.id)));
 host.append(btn('⌖ CAD 定位此欄格',()=>mapLocate('stall',id),'v114-primary'));
}
function selectOptions(select,items,current){select.replaceChildren();for(const [id,name] of items){const opt=new Option(name,id);select.append(opt);}select.value=current||'';}
function form(id='',prefDevice=''){if(hw.getRole()!=='admin'){msg('員工檢視模式不可修改工作單',true);return;}
 editing=id;const data=get(),current=data.maintenance.find(x=>x.id===id)||null;const host=$('v114Detail');host.replaceChildren();host.append(el('h3','',current?'編輯工作單':'新增維修／巡檢工作單'));
 const form=el('form','v114-form');form.id='v114WorkForm';form.noValidate=true;
 function field(label,key,type='text',max=100){const lab=el('label','',label);const inp=el(type==='textarea'?'textarea':'input');inp.name=key;if(type!=='textarea')inp.type=type;inp.maxLength=max;if(type==='number'){inp.min='0';inp.max='100000000';inp.step='1';}inp.value=current?.[key]??(key==='workDate'?dateNow():'');lab.append(inp);form.append(lab);return inp;}
 function pick(label,key,choices,defaultValue){const lab=el('label','',label),sel=el('select');sel.name=key;selectOptions(sel,choices,current?.[key]??defaultValue);lab.append(sel);form.append(lab);return sel;}
 field('工作單主旨（必填）','title','text',120).required=true;
 pick('設備（必填）','deviceId',[['','— 請選擇設備 —'],...data.devices.map(d=>[d.id,`${d.zone||'未指定棟舍'} · ${d.name}`])],current?.deviceId||prefDevice);
 pick('類型','kind',Object.entries(KINDS),'inspection');pick('處理狀態','status',Object.entries(STATUSES),'open');pick('優先度','priority',Object.entries(PRIORITIES),'normal');
 field('發現或維修日期','workDate','date');field('預定完成日期（可留空）','dueDate','date');field('完成日期（可留空）','completedAt','date');
 field('回報人','reporter','text',70);field('處理人','assignee','text',70);
 field('問題與處理內容','description','textarea',1800);field('處理結果／更換零件','result','textarea',1800);
 field('費用（元；可留空）','cost','number',12);
 const routes=[['','— 不指定線路 —'],...data.routes.map(r=>[r.id,r.name])];pick('相關線路（選填）','routeId',routes,'');
 const photo=pick('佐證照片（引用既有設備照片）','photoId',[['','— 尚未連結照片 —']],'');
 const photosFor=(id,desired='')=>{const d=data.devices.find(x=>x.id===id),items=(d?.photos||[]).map(ph=>[ph.id,ph.name]);selectOptions(photo,[['','— 尚未連結照片 —'],...items],desired);if(desired&&!items.some(([id])=>id===desired)){photo.append(new Option('⚠ 原關聯照片已不存在：'+desired,desired));photo.value=desired;}};
 photosFor(current?.deviceId||prefDevice,current?.photoId||'');
 form.querySelector('[name=deviceId]').addEventListener('change',e=>photosFor(e.target.value));
 if(current?.deviceId&&!data.devices.some(d=>d.id===current.deviceId)){
  const select=form.querySelector('[name=deviceId]');select.append(new Option('⚠ 已刪除設備：'+current.deviceId,current.deviceId));select.value=current.deviceId;
 }
 if(current?.routeId&&!data.routes.some(r=>r.id===current.routeId)){
  const select=form.querySelector('[name=routeId]');select.append(new Option('⚠ 已刪除管線：'+current.routeId,current.routeId));select.value=current.routeId;
 }
 const foot=el('div','v114-buttons');foot.append(btn('儲存工作單',()=>{const fields={};for(const [k,v] of new FormData(form))fields[k]=v;fields.cost=Number(fields.cost||0);if(!fields.title.trim()||!fields.deviceId){msg('工作單名稱與設備不可空白',true);return;}const r=hw.manageWorkOrder(current?'update':'create',id,fields);if(!r.ok)return msg(r.error,true);editing='';picked={kind:'work',id:r.id};msg('工作單已寫入原設備專案；記得備份完整專案。');render();},'v114-primary'));
 foot.append(btn('取消',()=>{editing='';render();}));if(current)foot.append(btn('封存工作單',()=>{if(!confirm('確定封存？紀錄不會刪除，可在專案 JSON 保留歷史。'))return;const r=hw.manageWorkOrder('archive',id);if(!r.ok)return msg(r.error,true);editing='';picked={kind:'device',id:current.deviceId};msg('已封存工作單，不會破壞歷史備份。');render();},'v114-danger'));
 host.append(form,foot,el('p','v114-muted','可填入現場維修日期、回報人及結果。工作單是人工紀錄，不會自動判定設備故障。'));
}
function renderWork(host,data,id){const w=data.maintenance.find(x=>x.id===id);if(!w){host.append(el('p','v114-empty','找不到工作單。'));return;}
 host.append(el('h3','',w.title));row(host,'工單類型',KINDS[w.kind]);row(host,'處理狀態',STATUSES[w.status]);row(host,'優先度',PRIORITIES[w.priority]);row(host,'設備',data.devices.find(x=>x.id===w.deviceId)?.name||'⚠ 設備已被刪除');row(host,'維修日期',w.workDate);row(host,'預定完成',w.dueDate);row(host,'回報／處理',`${w.reporter||'—'} ／ ${w.assignee||'—'}`);row(host,'處理說明',w.description);row(host,'結果／換件',w.result);row(host,'費用',w.cost+' 元');
 row(host,'佐證照片',w.photoId?(data.devices.find(x=>x.id===w.deviceId)?.photos?.some(p=>p.id===w.photoId)?'已連結設備照片':'⚠ 既有照片已不在此設備內'):'尚未指定');
 const actions=el('div','v114-buttons');
 if(w.photoId&&data.devices.find(x=>x.id===w.deviceId)?.photos?.some(p=>p.id===w.photoId))actions.append(btn('開啟佐證照片',()=>{close();hw.select('device',w.deviceId);window.HWDeviceRecords?.open('photos',w.photoId);}));if(hw.getRole()==='admin')actions.append(btn('編輯工作單',()=>form(id),'v114-primary'));if(data.devices.some(x=>x.id===w.deviceId))actions.append(btn('查看設備',()=>select('device',w.deviceId)));if(w.routeId&&data.routes.some(x=>x.id===w.routeId))actions.append(btn('查看管線',()=>select('route',w.routeId)));host.append(actions);
}
function renderPhotoRecord(host,data,kind,id){
 const [deviceId,photoId,markerId]=id.split('|'),d=data.devices.find(x=>x.id===deviceId),ph=d?.photos?.find(x=>x.id===photoId),mark=ph?.markers?.find(x=>x.id===markerId);
 if(!d||!ph||(kind==='marker'&&!mark)){host.append(el('p','v114-empty','照片或標記已移除，請重新搜尋。'));return;}
 host.append(el('h3','',kind==='marker'?(mark.title||'照片標記'):(ph.name||'設備照片')));
 row(host,'所屬設備',d.name);row(host,'棟舍／區域',d.zone||'未填');row(host,'照片名稱',ph.name);
 if(mark){row(host,'標記用途',mark.note||'尚未填寫');row(host,'照片標記位置',`水平 ${mark.x}% ／ 垂直 ${mark.y}%`);
  const t=(d.terminals||[]).find(x=>x.id===mark.terminalId);
  row(host,'關聯開關／端子',t?.name||(mark.terminalId?'⚠ 端子已不存在':'尚未指定'));
  if(t){row(host,'端子控制用途',t.controls||t.purpose||'尚未填寫');}
 }
 const actions=el('div','v114-buttons');
 actions.append(btn('⌖ CAD 定位配電箱／設備',()=>mapLocate('device',d.id)));
 actions.append(btn(mark?'📷 開啟照片並選取標記':'📷 開啟這張照片',()=>{
  close();hw.setWorkspace('equipment');hw.select('device',d.id);
  window.HWDeviceRecords?.open?.('photos',ph.id,mark?.id||'');
 },'v114-primary'));
 host.append(actions);
 host.append(el('p','v114-muted','照片標記以原始百分比座標保存；需由現場人員核對開關實際接線。'));
}
function renderDetail(data){if(editing&&$('v114WorkForm'))return;const host=$('v114Detail');host.replaceChildren();if(!picked){host.append(el('h3','','選擇一台設備或工作單'),el('p','v114-muted','輸入名稱、欄格編號、配電箱、風扇或飼料設備，在左側選擇結果。'));const sel=hw.getSelected();if(sel?.kind==='device')host.append(btn('使用 CAD 已選設備',()=>select('device',sel.id),'v114-primary'));return;}
 if(picked.kind==='device')renderDevice(host,data,picked.id);else if(picked.kind==='route')renderRoute(host,data,picked.id);else if(picked.kind==='stall')renderStall(host,data,picked.id);else if(picked.kind==='work')renderWork(host,data,picked.id);else if(picked.kind==='photo'||picked.kind==='marker')renderPhotoRecord(host,data,picked.kind,picked.id);
}
function renderAudit(data){const issues=issueItems(data),host=$('v114Audit');host.replaceChildren();if(!issues.length){host.append(el('p','v114-muted','目前沒有被資料檢查規則標記的項目；不等於現場零故障。'));return;}
 for(const i of issues.slice(0,50))host.append(btn('⚠ '+i.text,()=>select(i.kind,i.id),'v114-issue'));
 if(issues.length>50)host.append(el('small','v114-muted',`僅顯示前 50 項，共 ${issues.length} 項。`));}
function render(){if(!opened)return;const data=get();renderStats(data);renderResults(data);renderDetail(data);renderAudit(data);$('v114New').disabled=hw.getRole()!=='admin';$('v114Export').disabled=!data.maintenance.length;}
function exportCSV(){const data=get();const header=['工單ID','設備ID','設備名稱','區域','類型','狀態','優先度','主旨','維修日期','預定完成','完成日期','回報人','處理人','費用元','說明','結果','線路ID','是否封存'];const lines=[header];for(const w of data.maintenance){const d=data.devices.find(x=>x.id===w.deviceId);lines.push([w.id,w.deviceId,d?.name||'設備已刪除',d?.zone||'',KINDS[w.kind],STATUSES[w.status],PRIORITIES[w.priority],w.title,w.workDate,w.dueDate,w.completedAt,w.reporter,w.assignee,w.cost,w.description,w.result,w.routeId,w.archived?'是':'否']);}openFile('虎尾場_V11.4_維修與巡檢工作單.csv',lines.map(row=>row.map(escCSV).join(',')).join('\r\n'));msg(`已匯出 ${data.maintenance.length} 筆維修／巡檢紀錄（包含封存資料）`);}
launch.onclick=()=>open();fab.onclick=()=>open();$('v114Close').onclick=close;$('v114New').onclick=()=>form('',picked?.kind==='device'?picked.id:'');$('v114Export').onclick=exportCSV;
let v118SearchDelay=0;$('v114Query').addEventListener('input',()=>{clearTimeout(v118SearchDelay);v118SearchDelay=setTimeout(()=>{if(opened)render();},140);});$('v114Category').addEventListener('change',render);$('v114WorkStatus').addEventListener('change',render);
$('v114Query').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const q=$('v114Query').value,stall=links?.resolve?.(q);if(stall)select('stall',stall);}});
overlay.addEventListener('click',e=>{if(e.target===overlay)close();});window.addEventListener('keydown',e=>{if(opened&&e.key==='Escape'){e.stopPropagation();close();}});
window.addEventListener('hw-v90-change',e=>{if(opened&&['data','role'].includes(e.detail?.kind)&&!$('v114WorkForm'))render();});
window.HWFarmOpsV114={version:'11.8',open,close,newWork:(deviceId)=>{if(hw.getRole()!=='admin')return false;const selectedDevice=deviceId||hw.getSelected()?.id;if(!get().devices.some(d=>d.id===selectedDevice))return false;open('device',selectedDevice);form('',selectedDevice);return true;},issues:()=>issueItems(get()),search:()=>resultItems(get()),exportCSV,showDevice:id=>open('device',id),showWork:id=>open('work',id)};
})();
