/* V9.2 — local-only wiring inventory, photo-marker backlinks, visual CAD trace. */
(function(){'use strict';
const api=window.HWEquipment,power=window.HWPowerTrace;if(!api||!power)return;
const $=id=>document.getElementById(id);
const mk=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!=null)x.textContent=text;return x;};
const viewer=document.querySelector('.viewer'),panel=$('v83EquipPanel');
if(!viewer||!panel)return;
const launch=mk('div','v91-launch');launch.innerHTML='<div><strong>迴路盤點與查線工作台</strong><small>查缺漏、找照片標記、定位電線</small></div><button type="button" id="v91OpenAudit">查看迴路</button>';
const before=$('v84Items')||$('v84Layers');if(before)before.before(launch);else panel.appendChild(launch);
const modal=mk('div','v91-overlay');modal.id='v91AuditOverlay';modal.hidden=true;
modal.innerHTML=`<section class="v91-sheet" role="dialog" aria-modal="true" aria-label="全場迴路盤點">
 <header class="v91-head"><div><small>POWER NETWORK · V9.2</small><h2>全場迴路盤點</h2><p>依你建檔的設備、端子及電線建立清單；未核對的接線不會視為已確認。</p></div><button class="v91-close" id="v91Close" type="button" aria-label="關閉">×</button></header>
 <div class="v91-body"><div class="v91-stats" id="v91Stats"></div>
 <div class="v91-filterbar"><input type="search" id="v91Search" placeholder="搜尋迴路、配電箱、棟舍或設備…" aria-label="搜尋迴路">
 <select id="v91Category" aria-label="顯示項目"><option value="all">全部項目</option><option value="wires">電線迴路</option><option value="terminals">端子與內部接線</option><option value="photos">照片標記</option></select>
 <select id="v91Status" aria-label="盤點狀態"><option value="all">全部狀態</option><option value="verified">已現場核對</option><option value="review">待核對</option><option value="missing">資料缺漏</option></select>
 <button id="v91Download" type="button">匯出盤點 CSV</button></div>
 <div class="v91-list" id="v91List"></div>
 <p class="v90-hint">此清單僅提供文件盤點與維修查詢，不能證明實際供電或電氣安全。CSV 含設備接線資訊，請勿上傳公開儲存庫。</p></div></section>`;
viewer.appendChild(modal);
const markerTrace=mk('div','v91-marker-link');markerTrace.innerHTML='<button type="button" id="v91TraceMarker">↗ 查看此開關的上下游</button><small>先將標記連結到開關／端子</small>';
const markerForm=$('v90MarkerForm');if(markerForm)markerForm.appendChild(markerTrace);
const traceQuick=mk('button','v91-link-btn','全場迴路盤點');traceQuick.type='button';traceQuick.id='v91TraceQuick';$('v90Trace')?.appendChild(traceQuick);
const traceBar=mk('div','v91-tracebar');traceBar.id='v91TraceBar';traceBar.hidden=true;
traceBar.innerHTML='<span id="v91TraceSummary">已標示迴路</span><button type="button" id="v91TraceEnd">清除標示</button>';
viewer.appendChild(traceBar);
let isOpen=false,highlight=null,previousFocus=null;
function project(){return api.getData();}
function allRows(){const p=project(),devById=new Map(p.devices.map(d=>[d.id,d])),rows=[];
 for(const r of p.routes.filter(r=>r.group==='electric')){
  const fromId=r.fromDeviceId||r.points?.[0]?.deviceId||'',toId=r.toDeviceId||r.points?.[r.points.length-1]?.deviceId||'';
  const from=devById.get(fromId),to=devById.get(toId),fromTerm=from?.terminals?.find(t=>t.id===r.fromTerminalId),toTerm=to?.terminals?.find(t=>t.id===r.toTerminalId);
  const reasons=[];
  if(!from)reasons.push('缺少有效上游設備');if(!to)reasons.push('缺少有效下游設備');
  if(from&&to&&from.id===to.id)reasons.push('起點與終點同一設備，請核對是否為箱內回路');
  if(from&&(!r.fromTerminalId||!fromTerm))reasons.push(r.fromTerminalId?'出線端子已不存在':'未指定出線端子');
  if(to&&(!r.toTerminalId||!toTerm))reasons.push(r.toTerminalId?'進線端子已不存在':'未指定進線端子');
  if(fromTerm&&fromTerm.direction==='input')reasons.push('上游出線端子標為進線');
  if(toTerm&&toTerm.direction==='output')reasons.push('下游進線端子標為出線');
  const broken=!from||!to||(r.fromTerminalId&&!fromTerm)||(r.toTerminalId&&!toTerm);
  const status=broken?'missing':reasons.length||!r.confirmed?'review':'verified';
  rows.push({id:'wire-'+r.id,kind:'wires',status,routeId:r.id,title:r.circuitName||r.name||'未命名電線',description:(from?.name||'未指定起點')+' → '+(to?.name||'未指定終點'),detail:[r.purpose,r.cableSpec].filter(Boolean).join(' · '),reasons:reasons.length?reasons:(!r.confirmed?['尚未確認現場接線']:[]),deviceId:fromId,search:[from?.zone,to?.zone].join(' ')});
 }
 for(const d of p.devices){const terms=d.terminals||[],byId=new Map(terms.map(t=>[t.id,t]));
  for(const t of terms){const issues=[];if(t.feedsFrom&&!byId.has(t.feedsFrom))issues.push('內部上游端子不存在');if(t.feedsFrom===t.id)issues.push('端子連接到自己');
   const seen=new Set([t.id]);let step=t.feedsFrom||'';while(step&&byId.has(step)){if(seen.has(step)){issues.push('內部供電關係形成循環');break;}seen.add(step);step=byId.get(step).feedsFrom||'';}
   rows.push({id:'terminal-'+d.id+'-'+t.id,kind:'terminals',status:issues.length?'missing':'review',deviceId:d.id,title:t.name,description:d.name+(t.feedsFrom?' · 上游：'+(byId.get(t.feedsFrom)?.name||'無效端子'):' · 未記錄內部上游'),detail:[t.controls,t.purpose].filter(Boolean).join(' · '),reasons:issues,terminalId:t.id,search:d.zone||''});
  }
  for(const ph of (d.photos||[])){for(const [i,m] of (ph.markers||[]).entries()){
   const issues=m.terminalId&&!byId.has(m.terminalId)?['照片標記連結到已不存在的端子']:!m.terminalId?['尚未連結端子']:[];
   rows.push({id:'photo-'+d.id+'-'+ph.id+'-'+m.id,kind:'photos',status:issues.length?'missing':'review',deviceId:d.id,photoId:ph.id,markerId:m.id,title:m.title||'照片標記 '+(i+1),description:d.name+' · '+ph.name,detail:m.note||'',reasons:issues,search:d.zone||''});
  }}
 }
 return rows;
}
function analyze(){const rows=allRows(),wires=rows.filter(x=>x.kind==='wires');return{rows,wires:wires.length,verified:wires.filter(x=>x.status==='verified').length,review:wires.filter(x=>x.status==='review').length,missing:rows.filter(x=>x.status==='missing').length};}
function badgeText(row){return row.status==='verified'?'現場已核對':row.status==='missing'?'資料缺漏':'待核對';}
function renderAudit(){const s=analyze(),stats=$('v91Stats'),list=$('v91List');stats.replaceChildren();
 for(const [value,title] of [[s.wires,'電線迴路'],[s.verified,'已核對線路'],[s.review,'待核對線路'],[s.missing,'資料缺漏']]){const card=mk('div','v91-stat');card.append(mk('b','',String(value)),mk('small','',title));stats.appendChild(card);}
 const q=$('v91Search').value.trim().toLocaleLowerCase(),cat=$('v91Category').value,st=$('v91Status').value;
 const rows=s.rows.filter(r=>(cat==='all'||r.kind===cat)&&(st==='all'||r.status===st)&&(!q||[r.title,r.description,r.detail,r.search,r.reasons.join(' ')].join(' ').toLocaleLowerCase().includes(q)));
 list.replaceChildren();if(!rows.length){list.appendChild(mk('div','v91-empty',s.rows.length?'沒有符合條件的紀錄。':'目前沒有電線、端子或照片標記。請先在 CAD 建立設備及連結。'));return;}
 for(const r of rows.slice(0,500)){const item=mk('div','v91-item');const main=mk('div');const title=mk('div','v91-item-title');title.append(mk('span','',r.title),mk('span','v91-status '+(r.status==='verified'?'ok':r.status==='missing'?'danger':'warn'),badgeText(r)));main.append(title,mk('small','',r.description));if(r.detail)main.appendChild(mk('small','',r.detail));if(r.reasons.length)main.appendChild(mk('small','v91-reasons',r.reasons.join('；')));
 const acts=mk('div','v91-item-btns');const locate=mk('button','','圖面定位');locate.type='button';locate.addEventListener('click',()=>locateRow(r));acts.appendChild(locate);
 if(r.kind==='wires'){const trace=mk('button','primary','追蹤路徑');trace.type='button';trace.addEventListener('click',()=>traceRoute(r.routeId));acts.appendChild(trace);}
 if(r.kind==='photos'){const ph=mk('button','primary','查看照片');ph.type='button';ph.addEventListener('click',()=>openPhotoRow(r));acts.appendChild(ph);}
 item.append(main,acts);list.appendChild(item);
 }
 if(rows.length>500)list.appendChild(mk('div','v91-empty','清單較長，僅顯示前 500 項。請使用搜尋縮小範圍。'));
}
function closeAudit(){isOpen=false;modal.hidden=true;}
function openAudit(){isOpen=true;modal.hidden=false;renderAudit();}
$('v91OpenAudit').addEventListener('click',openAudit);traceQuick.addEventListener('click',()=>{document.querySelector('#v90Close')?.click();openAudit();});
$('v91Close').addEventListener('click',closeAudit);modal.addEventListener('click',e=>{if(e.target===modal)closeAudit();});
for(const id of ['v91Search','v91Category','v91Status'])$(id).addEventListener(id==='v91Search'?'input':'change',renderAudit);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&isOpen){e.stopImmediatePropagation();e.preventDefault();closeAudit();}},true);
function mapFocus(x,y){if(Number.isFinite(x)&&Number.isFinite(y))api.focus(x,y);}
function locateRow(r){closeAudit();const p=project();if(r.kind==='wires'){const route=p.routes.find(x=>x.id===r.routeId);if(!route)return;api.select('route',route.id);const pt=route.points[Math.floor(route.points.length/2)];mapFocus(pt?.x,pt?.y);return;}
 const d=p.devices.find(x=>x.id===r.deviceId);if(!d)return;api.select('device',d.id);mapFocus(d.x,d.y);
}
function openPhotoRow(r){locateRow(r);const d=project().devices.find(x=>x.id===r.deviceId);const index=d?.photos?.findIndex(x=>x.id===r.photoId)??-1;
 const open=api.getRole()==='admin'?(document.querySelector('.v90-open-btn')||$('v90StaffOpen')):($('v90StaffOpen')||document.querySelector('.v90-open-btn'));if(!open||index<0)return;open.click();document.querySelector('[data-v90tab="photos"]')?.click();const thumbs=$('v90Thumbs')?.querySelectorAll('button');thumbs?.[index]?.click();
 const markIndex=d.photos[index].markers.findIndex(m=>m.id===r.markerId);const pins=$('v90Pins')?.querySelectorAll('button');if(markIndex>=0)pins?.[markIndex]?.click();
}
function traceRoute(id){const p=project(),route=p.routes.find(x=>x.id===id);if(!route)return;
 const g=power.graph();const from=route.fromDeviceId||route.points[0]?.deviceId||'',to=route.toDeviceId||route.points[route.points.length-1]?.deviceId||'';
 const start=from?g.key(from,route.fromTerminalId||''):null;
 const traversed=start&&g.nodes.has(start)?power.walk(start,g.edges,false):[];
 const routeIds=new Set([id]),deviceIds=new Set([from,to].filter(Boolean));
 for(const step of traversed){const node=g.nodes.get(step.key);if(node)deviceIds.add(node.device.id);for(const edge of step.path){if(edge.route)routeIds.add(edge.route.id);const a=g.nodes.get(edge.from),b=g.nodes.get(edge.to);if(a)deviceIds.add(a.device.id);if(b)deviceIds.add(b.device.id);}}
 highlight={routeIds,deviceIds};closeAudit();api.select('route',id);const middle=route.points[Math.floor(route.points.length/2)];mapFocus(middle?.x,middle?.y);
 $('v91TraceSummary').textContent='文件追蹤：'+(route.circuitName||route.name)+' · '+routeIds.size+' 條電線'+(route.confirmed?'（本迴路已核對）':'（含待核對）');traceBar.hidden=false;applyHighlight();}
function applyHighlight(){if(!highlight)return;const r=$('eqRoutes'),d=$('eqIcons');if(!r||!d)return;r.querySelectorAll('[data-eq-route]').forEach(n=>n.classList.toggle('v91-lit',highlight.routeIds.has(n.getAttribute('data-eq-route'))));d.querySelectorAll('[data-eq-device]').forEach(n=>n.classList.toggle('v91-lit',highlight.deviceIds.has(n.getAttribute('data-eq-device'))));}
$('v91TraceEnd').addEventListener('click',()=>{highlight=null;traceBar.hidden=true;applyHighlight();document.querySelectorAll('.v91-lit').forEach(n=>n.classList.remove('v91-lit'));});
window.addEventListener('hw-v90-change',()=>{if(isOpen)renderAudit();if(highlight)requestAnimationFrame(applyHighlight);});
// Jump from a precise photo annotation to its linked terminal's upstream/downstream list.
$('v91TraceMarker')?.addEventListener('click',()=>{const id=$('v90MarkerTerminal')?.value||'';if(!id){const toast=$('toast');if(toast){toast.textContent='請先把照片標記連結至端子';toast.style.display='block';}return;}
 document.querySelector('[data-v90tab="trace"]')?.click();const sel=$('v90TraceTerminal');if(sel&&[...sel.options].some(o=>o.value===id)){sel.value=id;sel.dispatchEvent(new Event('change',{bubbles:true}));}
});
function csvCell(v){let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
$('v91Download').addEventListener('click',()=>{const rows=allRows(),heads=['類型','名稱','狀態','設備與流向','用途及備註','需補資料'];const lines=[heads.map(csvCell).join(',')];for(const r of rows)lines.push([({wires:'電線',terminals:'端子',photos:'照片標記'})[r.kind],r.title,badgeText(r),r.description,r.detail,r.reasons.join('；')].map(csvCell).join(','));const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=mk('a');a.href=url;a.download='虎尾場_迴路盤點_V9.2.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);});
window.HWCircuitAudit={analyze,traceRoute};
})();
