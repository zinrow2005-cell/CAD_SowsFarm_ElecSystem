/* V11.11.0 — documented network tracing. Read-only: NEVER infers live electrical or hydraulic state. */
(function(root){'use strict';
const GROUPS={electric:'電力',water:'供水',feed:'送料'};
const SOURCE_TYPES={waterTower:'tower',waterTank:'tower',groundwater:'groundwater',tap:'tap'};
const sourceLabels={tower:'水塔水',groundwater:'地下水',tap:'自來水'};
const ID=v=>String(v||'');
function checkRoute(r,byId){
 const a=byId.get(ID(r.fromDeviceId)),b=byId.get(ID(r.toDeviceId)),reasons=[];
 if(!a||!b)reasons.push('起訖設備尚未完整指定');
 if(a&&b&&a.id===b.id)reasons.push('起訖設備相同');
 if(!r.confirmed)reasons.push('尚未現場核對');
 if(r.group==='water'){
  if(!['forward','reverse'].includes(r.flowDirection))reasons.push('供水方向未確認');
  if(!sourceLabels[r.waterSource])reasons.push('供水來源未指定');
 }else if(r.group==='electric'){
  const out=a?.terminals?.find(t=>t.id===r.fromTerminalId),inn=b?.terminals?.find(t=>t.id===r.toTerminalId);
  if(!out||!inn)reasons.push('起訖端子尚未完整指定');
  if(out?.direction==='input'||inn?.direction==='output')reasons.push('端子進出方向不相符');
  if(!r.verifiedBy||!/^\d{4}-\d{2}-\d{2}$/.test(r.verifiedAt||''))reasons.push('缺少人工核對人員或日期');
 }
 return {ok:reasons.length===0,reasons};
}
function links(data,option){
 const devs=Array.isArray(data?.devices)?data.devices:[], routes=Array.isArray(data?.routes)?data.routes:[];
 const byId=new Map(devs.map(d=>[ID(d.id),d]));
 const rootId=ID(option?.deviceId),start=byId.get(rootId);
 const group=GROUPS[option?.group]?option.group:'water';
 const reverse=option?.direction==='upstream';
 const empty={group,rootId,direction:reverse?'upstream':'downstream',nodes:start?[start]:[],edges:[],pending:[],warnings:[],total:0};
 if(!start)return {...empty,warnings:['沒有找到選定設備']};
 const relevant=routes.filter(r=>r.group===group),checks=new Map(relevant.map(r=>[r.id,checkRoute(r,byId)]));
 const graph=new Map();
 function attach(from,step){if(!graph.has(from))graph.set(from,[]);graph.get(from).push(step);}
 for(const r of relevant){if(!checks.get(r.id).ok)continue;
  const forward=group==='water'&&r.flowDirection==='reverse'?false:true;
  const from=ID(forward?r.fromDeviceId:r.toDeviceId),to=ID(forward?r.toDeviceId:r.fromDeviceId);
  const fromTerminal=forward?r.fromTerminalId:r.toTerminalId,toTerminal=forward?r.toTerminalId:r.fromTerminalId;
  const edge={route:r,from,to,fromTerminal:ID(fromTerminal),toTerminal:ID(toTerminal)};
  if(reverse)attach(to,{...edge,from:to,to:from,fromTerminal:ID(toTerminal),toTerminal:ID(fromTerminal)});
  else attach(from,edge);
 }
 const warnings=[],used=new Map(),found=new Set([rootId]),states=[{id:rootId,port:'',source:SOURCE_TYPES[start.type]||(start.type==='threeWay'?start.valveSelection:'')||''}],seen=new Set(),maxSteps=500;
 if(group==='water'&&!sourceLabels[states[0].source])warnings.push('起始設備沒有明確的人工水源紀錄：只顯示符合現有資料的路段，不代表實際有水。');
 function valveAllows(d,src){
  if(d?.type!=='threeWay')return true;
  const pos=d.valveSelection;
  if(!sourceLabels[src]||pos!==src||!(d.waterSources||[]).includes(pos)){
   warnings.push((d.name||'三向閥')+'：未核對此水源的人工切換位置，追蹤在此停止');return false;
  }return true;
 }
 function electricAllows(d,arrive,depart){
  if(!arrive)return true; // starting device has no upstream terminal in this trace
  if(!depart)return false;
  if(arrive===depart)return true;
  const ports=new Map((d.terminals||[]).map(t=>[ID(t.id),t]));
  let at=depart;const visited=new Set();
  while(at&&!visited.has(at)){
   visited.add(at);at=ID(ports.get(at)?.feedsFrom);if(at===arrive)return true;
  }
  return false;
 }
 let steps=0;
 while(states.length&&steps++<maxSteps){
  const cur=states.shift(),node=byId.get(cur.id),key=cur.id+'|'+cur.port+'|'+cur.source;
  if(seen.has(key))continue;seen.add(key);
  if(group==='water'&&!valveAllows(node,cur.source))continue;
  for(const edge of graph.get(cur.id)||[]){
   if(group==='electric'&&cur.port&&!(reverse?electricAllows(node,edge.fromTerminal,cur.port):electricAllows(node,cur.port,edge.fromTerminal))){
    warnings.push((node.name||'設備')+'：箱內端子供電關係尚未建立，無法判定下游');continue;
   }
   if(group==='water'&&cur.source&&edge.route.waterSource!==cur.source)continue;
   const src=group==='water'?(cur.source||edge.route.waterSource):'';
   if(group==='water'&&!valveAllows(byId.get(edge.to),src)){
    // The valve itself is reachable, but its downstream is not taken as connected.
    found.add(edge.to);used.set(edge.route.id,edge.route);continue;
   }
   used.set(edge.route.id,edge.route);found.add(edge.to);
   states.push({id:edge.to,port:edge.toTerminal,source:src});
  }
 }
 if(steps>=maxSteps)warnings.push('追蹤已達安全筆數上限，部分路徑未展開');
 const pending=[];
 for(const r of relevant){if(used.has(r.id))continue;
  if(!found.has(ID(r.fromDeviceId))&&!found.has(ID(r.toDeviceId)))continue;
  const chk=checks.get(r.id);if(!chk.ok)pending.push({route:r,reasons:chk.reasons});
 }
 return {...empty,nodes:[...found].map(k=>byId.get(k)).filter(Boolean),edges:[...used.values()],pending,warnings:[...new Set(warnings)].slice(0,8),total:relevant.length};
}
const API={trace:links,checkRoute,GROUPS};
root.HWNetworkTraceCoreV11110=API;
const doc=root.document,hw=root.HWEquipment;
if(!doc||!hw)return;
const $=id=>doc.getElementById(id),make=(tag,cls,content)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=String(content);return n;};
let lastResult=null,opened=false,deviceId='',group='water',direction='downstream';
const viewer=doc.querySelector('.viewer');
if(!viewer)return;
const launcher=make('button','hw110-launch','⌁ 水電關聯');launcher.id='hw110Launch';launcher.type='button';launcher.title='追蹤已建檔的設備與管線';viewer.append(launcher);
const side=doc.getElementById('v83EquipPanel');
if(side){const sideBtn=make('button','hw110-side','⌁ 水電與設備關聯追蹤');sideBtn.type='button';sideBtn.id='hw110Side';sideBtn.addEventListener('click',()=>open());side.insertBefore(sideBtn,side.children[3]||null);}
const overlay=make('div','hw110-overlay');overlay.hidden=true;overlay.id='hw110Overlay';overlay.innerHTML=`<section class="hw110-dialog" role="dialog" aria-modal="true" aria-labelledby="hw110Title" tabindex="-1">
<header class="hw110-head"><div><small>HUWEI · NETWORK TRACE · V11.11.0</small><h2 id="hw110Title">水電與設備關聯追蹤</h2><p>僅依專案已記錄的線路與現場核對資料，並非即時設備狀態</p></div><button type="button" id="hw110Close" aria-label="關閉追蹤">✕</button></header>
<div class="hw110-scroll"><div class="hw110-controls"><label>追蹤類別<select id="hw110Group"><option value="water">💧 供水</option><option value="electric">⚡ 電力</option><option value="feed">🌾 送料</option></select></label><label>起始設備<select id="hw110Start"></select></label><label>追蹤方向<select id="hw110Direction"><option value="downstream">往下游</option><option value="upstream">找上游來源</option></select></label><button class="hw110-primary" type="button" id="hw110Go">開始追蹤</button></div>
<div class="hw110-help" id="hw110Help">只有已指定起訖設備且符合該類別核對條件的線路會進入追蹤。</div>
<div class="hw110-counts" id="hw110Counts"></div><div class="hw110-columns"><section><h3>已建立、符合核對條件的關聯</h3><div id="hw110Confirmed" class="hw110-items"></div></section><section><h3>相鄰但尚待核對</h3><div id="hw110Pending" class="hw110-items"></div></section></div>
<div class="hw110-warnings" id="hw110Warnings"></div><footer class="hw110-actions"><button type="button" id="hw110View">在 CAD 檢視追蹤標示</button><button type="button" id="hw110Clear">清除圖面標示</button><button type="button" id="hw110Close2">關閉</button></footer></div></section>`;
doc.body.append(overlay);
function data(){return hw.getData();}
function populate(){const d=data(),selected=hw.getSelected?.();const q=$('hw110Start'),old=deviceId||((selected?.kind==='device')?selected.id:'');q.replaceChildren();q.append(make('option','', '— 選擇起始設備 —'));q.lastChild.value='';
 const byId=new Set(d.routes.filter(r=>r.group===group).flatMap(r=>[r.fromDeviceId,r.toDeviceId]));
 for(const item of d.devices.slice().sort((a,b)=>Number(byId.has(b.id))-Number(byId.has(a.id))||a.name.localeCompare(b.name,'zh-Hant'))){const opt=make('option','',(byId.has(item.id)?'● ':'○ ')+item.name+(item.zone?'｜'+item.zone:''));opt.value=item.id;q.append(opt);}
 deviceId=d.devices.some(x=>x.id===old)?old:'';q.value=deviceId;$('hw110Group').value=group;$('hw110Direction').value=direction;
}
function itemRow(main,meta,device,route,quality){const box=make('div','hw110-item');const copy=make('span','hw110-copy');copy.append(make('b','',main),make('small','',meta));box.append(copy);
 const btn=make('button','','定位');btn.type='button';btn.dataset.focus=device||'';btn.dataset.route=route||'';btn.dataset.quality=quality||'';btn.disabled=!device&&!route;box.append(btn);return box;}
function showResult(){const r=lastResult,a=$('hw110Confirmed'),b=$('hw110Pending'),stat=$('hw110Counts'),warn=$('hw110Warnings');a.replaceChildren();b.replaceChildren();stat.replaceChildren();warn.replaceChildren();
 if(!r){a.append(make('p','hw110-empty','請選擇設備，再開始追蹤。'));b.append(make('p','hw110-empty','尚無結果。'));return;}
 for(const [name,num] of [['關聯設備',r.nodes.length],['核對線路',r.edges.length],['待查線路',r.pending.length]]){const tile=make('div','hw110-count');tile.append(make('b','',num),make('small','',name));stat.append(tile);}
 if(!r.edges.length)a.append(make('p','hw110-empty','目前找不到符合核對條件的連通路段；不代表設備實際上沒有接線。'));
 const deviceMap=new Map(data().devices.map(d=>[d.id,d]));
 for(const edge of r.edges){const f=deviceMap.get(edge.fromDeviceId)?.name||'未指定',t=deviceMap.get(edge.toDeviceId)?.name||'未指定';a.append(itemRow(edge.name||'未命名線路',f+' ↔ '+t+' · '+(edge.group==='water'?(sourceLabels[edge.waterSource]||'水源待核'):'已登錄核對'),'',edge.id,'confirmed'));}
 for(const p of r.pending.slice(0,35)){const f=deviceMap.get(p.route.fromDeviceId)?.name||'未指定',t=deviceMap.get(p.route.toDeviceId)?.name||'未指定';b.append(itemRow(p.route.name||'未命名線路',f+' ↔ '+t+' · '+p.reasons.join('、'),'',p.route.id,'pending'));}
 if(!r.pending.length)b.append(make('p','hw110-empty','目前沒有相鄰的待核對線路。'));
 if(r.pending.length>35)b.append(make('p','hw110-empty','另有待核對線路，請回原線路管理視窗查詢。'));
 for(const w of r.warnings)warn.append(make('p','', '⚠ '+w));
}
function mark(){const sets={nodes:new Set(lastResult?.nodes.map(n=>n.id)||[]),edges:new Set(lastResult?.edges.map(e=>e.id)||[])};
 for(const el of doc.querySelectorAll('#eqIcons [data-eq-device]'))el.classList.toggle('hw110-trace-device',sets.nodes.has(el.getAttribute('data-eq-device')));
 for(const el of doc.querySelectorAll('#eqRoutes [data-eq-route]'))el.classList.toggle('hw110-trace-route',sets.edges.has(el.getAttribute('data-eq-route')));
}
function clear(){lastResult=null;mark();showResult();}
function close(){opened=false;overlay.hidden=true;doc.body.classList.remove('hw110-open');launcher.focus({preventScroll:true});}
function open(id){if(id)deviceId=id;opened=true;populate();overlay.hidden=false;doc.body.classList.add('hw110-open');showResult();overlay.querySelector('.hw110-dialog').focus({preventScroll:true});}
function focusNode(nodeId,routeId){const d=data();let target=d.devices.find(x=>x.id===nodeId);
 if(!target&&routeId){const r=d.routes.find(x=>x.id===routeId);target=d.devices.find(x=>x.id===r?.fromDeviceId)||d.devices.find(x=>x.id===r?.toDeviceId);if(!target&&r?.points?.length){const pt=r.points[Math.floor(r.points.length/2)];hw.focus?.(pt.x,pt.y);close();return;}}
 if(target){const type=hw.getType?.(target.type);if(type?.group&&hw.getVisibility?.()[type.group]===false)hw.setVisibility?.(type.group,true);
 const point=hw.getVisualPlacement?.(target.id)?.icon||target;hw.focus?.(point.x,point.y);}
 close();requestAnimationFrame(mark);
}
launcher.onclick=()=>open();$('hw110Close').onclick=close;$('hw110Close2').onclick=close;
$('hw110Group').onchange=e=>{group=e.target.value;deviceId='';lastResult=null;mark();populate();showResult();};
$('hw110Start').onchange=e=>{deviceId=e.target.value;};$('hw110Direction').onchange=e=>{direction=e.target.value;};
$('hw110Go').onclick=()=>{deviceId=$('hw110Start').value;direction=$('hw110Direction').value;if(!deviceId){$('hw110Help').textContent='請先選擇起始設備。';return;}
 lastResult=links(data(),{deviceId,group,direction});$('hw110Help').textContent='已依資料追蹤：僅列出符合核對條件的路段；圖形相鄰但未登錄端點，不代表實際連通。';showResult();mark();};
$('hw110View').onclick=()=>{close();mark();};$('hw110Clear').onclick=clear;
for(const parent of [$('hw110Confirmed'),$('hw110Pending')])parent.addEventListener('click',e=>{const button=e.target.closest('button[data-focus]');if(button)focusNode(button.dataset.focus,button.dataset.route);});
overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
overlay.addEventListener('pointerdown',e=>e.stopPropagation());
doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){e.stopPropagation();close();}});
root.addEventListener('hw-v90-change',e=>{if(e.detail?.kind==='data'){if(lastResult){lastResult=links(data(),{deviceId,group,direction});showResult();}requestAnimationFrame(mark);}if(e.detail?.kind==='selection'&&opened&&!deviceId){populate();}});
root.HWNetworkTraceV11110={open,close,trace:opts=>links(data(),opts),clear,getResult:()=>lastResult};
})(typeof window!=='undefined'?window:globalThis);
