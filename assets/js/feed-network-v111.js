/* V11.1: verified-vs-pending feed-flow graph, connected equipment and stall coverage.
   All links are read-only projections of HWEquipment routes + V10.9 stall links.
   Geometry intersection NEVER establishes a connection. */
(()=>{'use strict';
const HW=window.HWEquipment, stall=window.HWStallLinks;
if(!HW)return;
const $=id=>document.getElementById(id);
const create=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x;};
const feedGroup=new Set(['feedSilo','feedBin','feedLine','feedAuger','feedMotor','feedDistributor','feedValve','feedDrop','feedSensor','feedTrough','feedControl']);
function data(){return HW.getData();}
function isFeed(d){return d&&((HW.getType(d.type)?.group==='feed')||feedGroup.has(d.type));}
function network(){const p=data(),all=new Map(p.devices.map(d=>[d.id,d]));const routes=p.routes.filter(r=>r.group==='feed');const valid=[],issues=[];
 for(const r of routes){const points=Array.isArray(r.points)?r.points:[];
  const from=r.fromDeviceId||points[0]?.deviceId||'';
  const to=r.toDeviceId||points.at(-1)?.deviceId||'';
  if(!from||!to||!all.has(from)||!all.has(to)||from===to){issues.push({route:r,reason:from===to&&from?'起點與終點為同一設備':'缺少有效的起訖設備關聯'});continue;}
  if(!isFeed(all.get(from))||!isFeed(all.get(to))){issues.push({route:r,reason:'連接到非飼料類設備，未列入供料追蹤'});continue;}
  valid.push({route:r,from,to,confirmed:r.confirmed===true});
 }
 return {devices:p.devices.filter(isFeed),routes,edges:valid,issues,all};
}
/* Two-state visit means an unchecked path never hides a separately verified path. */
function trace(start,direction='down'){
 const g=network();if(!g.all.has(start))return [];
 const outgoing=new Map();for(const edge of g.edges){const key=direction==='up'?edge.to:edge.from;
  if(!outgoing.has(key))outgoing.set(key,[]);outgoing.get(key).push(edge);}
 const queue=[{id:start,verified:true,hops:0,path:[]}],seen=new Set([start+'|1']),found=new Map();let cursor=0;
 while(cursor<queue.length&&cursor<3500){const current=queue[cursor++];if(current.hops>=32)continue;
  for(const edge of outgoing.get(current.id)||[]){const id=direction==='up'?edge.from:edge.to;
   const verified=current.verified&&edge.confirmed;
   if(id===start)continue;const key=id+'|'+(verified?'1':'0');if(seen.has(key))continue;
   seen.add(key);const entry={id,device:g.all.get(id),verified,hops:current.hops+1,path:[...current.path,edge.route.id]};
   const before=found.get(id);if(!before||(entry.verified&&!before.verified)||(entry.verified===before.verified&&entry.hops<before.hops))found.set(id,entry);
   if(queue.length<3500)queue.push(entry);
  }
 }
 return [...found.values()].sort((a,b)=>(b.verified?1:0)-(a.verified?1:0)||a.hops-b.hops||a.device?.name?.localeCompare(b.device?.name,'zh-Hant'));
}
function scope(start,direction='down'){
 const g=network();const reached=trace(start,direction),ids=[start,...reached.map(r=>r.id)];const bins=new Map(),rowSets=new Map();
 for(const id of ids){const verify=id===start||reached.find(q=>q.id===id)?.verified;
  for(const raw of stall?.stallsFor?.(id)||[]){const sid=stall.resolve(raw)||raw;const old=bins.get(sid);bins.set(sid,{id:sid,verified:!!verify||!!old?.verified});
   const row=sid.startsWith('B-R')||sid.startsWith('A-R')?sid.slice(0,4):sid.startsWith('MAT-')?'配種舍':sid.startsWith('G-')?'女豬育成區':'公豬欄';
   if(!rowSets.has(row))rowSets.set(row,new Set());rowSets.get(row).add(sid);
  }
 }
 return {root:g.all.get(start),reached,stalls:[...bins.values()].sort((a,b)=>a.id.localeCompare(b.id)),rows:[...rowSets].map(([name,ids])=>({name,count:ids.size})).sort((a,b)=>a.name.localeCompare(b.name)),missing:g.issues};
}
const overlay=create('div','v111f-overlay');overlay.id='v111FeedNetwork';overlay.hidden=true;
overlay.innerHTML=`<section class="v111f-dialog" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="v111fTitle">
 <header class="v111f-header"><div><small>HUWEI FARM · V11.1 FEED NETWORK</small><h2 id="v111fTitle">飼料輸送與欄格供應關聯</h2><p>只追蹤已建檔的飼料管起訖設備，不從 CAD 線條交叉推斷實際相通。</p></div><button id="v111fClose" aria-label="關閉供料查詢" type="button">×</button></header>
 <div class="v111f-content"><div id="v111fStats" class="v111f-stats"></div>
 <div class="v111f-controls"><label>搜尋設備<input id="v111fSearch" type="search" placeholder="設備名稱、區域、料塔、馬達…" autocomplete="off"></label>
 <label>查詢設備<select id="v111fRoot"><option value="">請選擇已配置的飼料設備</option></select></label>
 <label>查詢方向<select id="v111fDirection"><option value="down">從此設備查下游及可能影響欄格</option><option value="up">從此設備反查上游料源</option></select></label></div><div class="v111f-secondary"><button type="button" id="v111fBind">查看／設定所選設備的服務欄格</button><button type="button" id="v111fLocate">在 CAD 定位所選設備</button></div>
 <div id="v111fHint" class="v111f-hint" role="status"></div>
 <div class="v111f-columns"><section class="v111f-block"><h3>設備路徑 <small id="v111fDeviceCount"></small></h3><div id="v111fDevices" class="v111f-scroll"></div></section>
 <section class="v111f-block"><h3>關聯欄格 <small id="v111fStallCount"></small></h3><div id="v111fRows"></div><div id="v111fStalls" class="v111f-scroll"></div><p class="v111f-tiny">「可能影響」僅依人工建立的設備－欄格關聯推算，不等於實際停料判定。</p></section></div>
 <section class="v111f-block"><h3>已建立的飼料管 <small id="v111fRouteCount"></small></h3><div id="v111fRoutes" class="v111f-routes"></div></section>
 <div id="v111fWarnings" class="v111f-warnings"></div>
 <p class="v111f-foot">核對＝使用者人工標記，不代表感測器即時確認。送料馬達的供電線、控制迴路請另用電力系統追蹤，勿視為飼料管。</p>
 </div></section>`;
document.body.append(overlay);
const launch=create('button','v111f-launch','▰ 供料路徑／影響欄格查詢');launch.id='v111FeedNetworkLaunch';launch.type='button';
const eq=$('v83EquipPanel');if(eq)eq.insertBefore(launch,eq.children[2]||null);
let opened=false,chosen='',direction='down';
function stat(t,v){const el=create('div','v111f-stat');el.append(create('span','',t),create('b','',v));return el;}
function button(text,callback,cls='v111f-smallbutton'){const b=create('button',cls,text);b.type='button';b.onclick=callback;return b;}
function badge(text,ok){return create('span','v111f-state '+(ok?'good':'pending'),text);}
function locate(d){HW.select('device',d.id);HW.focus(d.x,d.y);close();}
function jumpStall(id){if(stall?.focus?.(id))close();}
function render(){if(!opened)return;const g=network(),keyword=$('v111fSearch').value.trim().toLowerCase();const listed=g.devices.filter(d=>(d.name+' '+d.zone+' '+(HW.getType(d.type)?.label||'')).toLowerCase().includes(keyword))
 .sort((a,b)=>(a.zone||'').localeCompare(b.zone||'','zh-Hant')||(a.name||'').localeCompare(b.name||'','zh-Hant'));
 const picker=$('v111fRoot'),old=chosen;picker.replaceChildren(new Option('請選擇已配置的飼料設備',''));
 listed.forEach(d=>picker.add(new Option(`${d.name} · ${d.zone||'未指定區域'} · ${HW.getType(d.type)?.label||d.type}`,d.id)));
 if(old&&!listed.some(d=>d.id===old))picker.add(new Option((g.all.get(old)?.name||'設備')+'（不符合搜尋條件）',old));
 picker.value=chosen&&g.all.has(chosen)?chosen:'';
 $('v111fBind').disabled=!chosen||!g.all.has(chosen);$('v111fLocate').disabled=!chosen||!g.all.has(chosen);
 $('v111fStats').replaceChildren(stat('飼料設備',g.devices.length),stat('已畫料管',g.routes.length),stat('已核對料管',g.routes.filter(r=>r.confirmed).length),stat('缺端點／異常',g.issues.length));
 const result=chosen&&g.all.has(chosen)?scope(chosen,direction):null;
 const devicesHost=$('v111fDevices'),stallsHost=$('v111fStalls'),rowsHost=$('v111fRows'),routesHost=$('v111fRoutes'),warningsHost=$('v111fWarnings');
 for(const host of [devicesHost,stallsHost,rowsHost,routesHost,warningsHost])host.replaceChildren();
 $('v111fHint').textContent=g.devices.length===0?'目前尚無飼料類設備。請先在 CAD 放置料塔、送料馬達、料槽等真實設備。':!chosen?'請先選擇料塔、馬達、料槽或其他已放置飼料設備。':'顯示已建檔的物理起訖關聯；未核對的線路不會被標示為確定供料。';
 $('v111fDeviceCount').textContent=result?result.reached.length+' 個連結設備':'—';
 $('v111fStallCount').textContent=result?result.stalls.length+' 格':'—';
 $('v111fRouteCount').textContent=g.routes.length+' 條';
 if(result){
  if(!result.reached.length)devicesHost.append(create('p','v111f-empty','沒有已建立的'+(direction==='down'?'下游':'上游')+'設備關聯。'));
  for(const item of result.reached.slice(0,80)){const row=create('div','v111f-item'),label=create('div','v111f-item-text');label.append(create('b','',item.device?.name||'已刪除設備'),create('small','',`${item.device?.zone||'未指定區域'} · ${item.hops} 段料管`));row.append(label,badge(item.verified?'整段已核對':'含待核對管線',item.verified),button('CAD 定位',()=>locate(item.device)));devicesHost.append(row);}
  if(result.reached.length>80)devicesHost.append(create('p','v111f-tiny',`其餘 ${result.reached.length-80} 台請縮小查詢範圍。`));
  if(!result.stalls.length)stallsHost.append(create('p','v111f-empty','尚未建立飼料設備與欄格的服務關聯。'));
  for(const row of result.rows)rowsHost.append(create('span','v111f-rowbadge',row.name+' · '+row.count+' 格'));
  for(const item of result.stalls.slice(0,120))stallsHost.append(button(item.id+(item.verified?' ✓':' ○'),()=>jumpStall(item.id),'v111f-stall '+(item.verified?'v111f-verified':'')));
  if(result.stalls.length>120)stallsHost.append(create('p','v111f-tiny',`其餘 ${result.stalls.length-120} 格未展開，可從原欄格管理介面查詢。`));
 }
 if(!g.routes.length)routesHost.append(create('p','v111f-empty','目前尚未畫飼料管。請使用上方飼料系統「畫飼料輸送管」後再設定端點。'));
 for(const r of g.routes.slice(0,80)){const route=g.edges.find(e=>e.route.id===r.id),warn=g.issues.find(x=>x.route.id===r.id);
  const line=create('div','v111f-route'),summary=create('div','v111f-route-text'),src=route?g.all.get(route.from)?.name:'尚未設定',dst=route?g.all.get(route.to)?.name:'尚未設定';
  summary.append(create('b','',r.name||'未命名飼料管'),create('small','',`${src} → ${dst} · ${r.feedSpec||'未填管徑／規格'} · ${r.feedMode||'未指定方式'}`));
  const verified=!!route&&r.confirmed===true&&!warn;
  line.append(summary,badge(verified?'已核對':warn?'需檢查連接':'待現場核對',verified),button('編輯',()=>{window.HWFeedV97?.open?.(r.id);close();}));
  routesHost.append(line);
 }
 if(g.routes.length>80)routesHost.append(create('p','v111f-tiny',`另有 ${g.routes.length-80} 條請使用飼料管編輯器查詢。`));
 for(const issue of g.issues.slice(0,30))warningsHost.append(create('p','',`⚠ ${issue.route.name||issue.route.id}：${issue.reason}`));
}
function open(id){if(id&&network().all.has(id))chosen=id;opened=true;overlay.hidden=false;render();overlay.querySelector('.v111f-dialog').focus();}
function close(){opened=false;overlay.hidden=true;}
$('v111fClose').onclick=close;overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened)close();});
$('v111fSearch').addEventListener('input',render);
$('v111fRoot').onchange=e=>{chosen=e.target.value;render();};
$('v111fDirection').onchange=e=>{direction=e.target.value==='up'?'up':'down';render();};
$('v111fBind').onclick=()=>{if(!chosen)return;close();if(!stall?.openForDevice?.(chosen))window.HWStallLinks?.open?.();};
$('v111fLocate').onclick=()=>{const d=network().all.get(chosen);if(d)locate(d);};
launch.onclick=()=>open();
window.addEventListener('hw-v90-change',e=>{if(opened&&['data','history','role'].includes(e.detail?.kind))render();});
window.addEventListener('hw-v109-change',()=>{if(opened)render();});
window.HWFeedNetworkV111={open,close,network,trace,scope,version:'11.1'};
})();
