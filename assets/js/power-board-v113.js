/* V11.3 Electrical board, protection device register and documented route diagnosis.
   All state lives in canonical HWEquipment devices[].terminals / routes[];
   never infer energized wiring or a true short-circuit/fault state from CAD geometry.
*/
(()=>{'use strict';
const hw=window.HWEquipment,stalls=window.HWStallLinks;
if(!hw)return;
const $=id=>document.getElementById(id);
const make=(tag,cls='',txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
const KINDS={mccb:'MCCB 無熔絲斷路器',mcb:'MCB 小型斷路器',rcbo:'RCBO 漏電斷路器',rcd:'RCD 漏電保護器',contactor:'電磁接觸器',relay:'控制繼電器',fuse:'保險絲',terminal:'接線端子',other:'其他開關／保護元件'};
const PANEL_TYPES=new Set(['panel','subPanel','controlBox','ats','generator','ups','electricJunction']);
const read=()=>hw.getData();const selectedDev=id=>read().devices.find(d=>d.id===id);
const getTypes=d=>hw.getType(d.type)?.group;
const nodeKey=(device,terminal)=>device+'::'+(terminal||'');
const docText='本功能僅比對已輸入的線路資料、端子關係及人工核對紀錄；不能判定是否帶電、實際斷路器是否跳脫，也不能代替電工查線及驗電。';
function endpoints(r){return[r.fromDeviceId||r.points?.[0]?.deviceId||'',r.toDeviceId||r.points?.[r.points.length-1]?.deviceId||''];}
function inspect(){
 const p=read(),all=new Map(p.devices.map(d=>[d.id,d])),issues=[],wires=[],outgoing=new Map(),incoming=new Map(),graph=[];
 const addEdge=e=>{graph.push(e);if(!outgoing.has(e.from))outgoing.set(e.from,[]);outgoing.get(e.from).push(e);if(!incoming.has(e.to))incoming.set(e.to,[]);incoming.get(e.to).push(e);};
 const deviceTerminals=new Map();
 for(const d of p.devices){const terminals=new Map((d.terminals||[]).map(t=>[t.id,t]));deviceTerminals.set(d.id,terminals);
  for(const t of d.terminals||[]){const problems=[];if(t.feedsFrom){if(!terminals.has(t.feedsFrom))problems.push('內部供電來源端子不存在');else if(t.feedsFrom===t.id)problems.push('端子不可供電給自己');else addEdge({from:nodeKey(d.id,t.feedsFrom),to:nodeKey(d.id,t.id),internal:true,route:null,verified:false,label:d.name+'：'+terminals.get(t.feedsFrom).name+' → '+t.name});}
   const seen=new Set([t.id]);let next=t.feedsFrom;
   while(next&&terminals.has(next)){if(seen.has(next)){problems.push('內部供電端子形成循環');break;}seen.add(next);next=terminals.get(next).feedsFrom;}
   if(problems.length)issues.push({kind:'terminal',deviceId:d.id,terminalId:t.id,title:d.name+'／'+t.name,problems});
  }
 }
 for(const r of p.routes.filter(x=>x.group==='electric')){
  const [from,to]=endpoints(r),d1=all.get(from),d2=all.get(to),port1=deviceTerminals.get(from)?.get(r.fromTerminalId),port2=deviceTerminals.get(to)?.get(r.toTerminalId);
  const probs=[];
  if(!d1)probs.push('缺少起點設備');if(!d2)probs.push('缺少終點設備');
  if(d1&&d2&&from===to)probs.push('起訖為同一設備，請確認是否為箱內接線');
  if(d1&&!r.fromTerminalId)probs.push('尚未指定出線端子');else if(r.fromTerminalId&&!port1)probs.push('出線端子不存在');
  if(d2&&!r.toTerminalId)probs.push('尚未指定進線端子');else if(r.toTerminalId&&!port2)probs.push('進線端子不存在');
  if(port1?.direction==='input')probs.push('出線端子方向標成進線');
  if(port2?.direction==='output')probs.push('進線端子方向標成出線');
  if(!r.verifiedBy||!/^\d{4}-\d{2}-\d{2}$/.test(r.verifiedAt||''))probs.push('缺少現場核對人或日期');
  if(!r.confirmed)probs.push('尚未標記已現場核對');
  // A connection is only presented as verified when its full endpoint / human check is valid.
  const valid=!!d1&&!!d2&&from!==to&&!!port1&&!!port2&&port1.direction!=='input'&&port2.direction!=='output';
  const verified=valid&&r.confirmed===true&&!!r.verifiedBy&&/^\d{4}-\d{2}-\d{2}$/.test(r.verifiedAt||'');
  const severity=!d1||!d2||(r.fromTerminalId&&!port1)||(r.toTerminalId&&!port2)?'broken':verified?'verified':'review';
  const item={route:r,from,to,d1,d2,fromTerm:port1,toTerm:port2,valid,verified,severity,problems:probs};wires.push(item);
  if(valid)addEdge({from:nodeKey(from,r.fromTerminalId),to:nodeKey(to,r.toTerminalId),internal:false,route:r,verified,label:r.circuitName||r.name});
  if(probs.length)issues.push({kind:'route',routeId:r.id,title:r.circuitName||r.name,problems:probs});
 }
 function reach(deviceId,terminalId,reverse=false,onlyVerified=false){
  if(!all.has(deviceId))return[];
  const start=nodeKey(deviceId,terminalId),adj=reverse?incoming:outgoing,queue=[{key:start,path:[],verified:true}],visited=new Set([start]),results=[];
  while(queue.length&&visited.size<=4500){const item=queue.shift();for(const e of adj.get(item.key)||[]){if(onlyVerified&&!e.internal&&!e.verified)continue;
   const key=reverse?e.from:e.to;if(visited.has(key))continue;visited.add(key);
   const path=item.path.concat(e),verified=item.verified&&(e.internal||e.verified);
   const cur={key,path,verified};results.push(cur);queue.push(cur);
  }}return results;
 }
 return {project:p,all,wires,issues,graph,reach,panels:p.devices.filter(d=>PANEL_TYPES.has(d.type)),breakers:p.devices.reduce((n,d)=>n+(d.terminals||[]).filter(t=>t.breakerKind&&t.breakerKind!=='terminal').length,0)};
}
const overlay=make('div','v113-overlay');overlay.id='v113Overlay';overlay.hidden=true;
overlay.innerHTML=`<section class="v113-dialog" role="dialog" aria-modal="true" aria-labelledby="v113Title" tabindex="-1">
<header class="v113-head"><div><small>HUWEI FARM · POWER NETWORK · V11.3</small><h2 id="v113Title">配電箱與斷路器管理</h2><p>設備 → 開關／端子 → 電線迴路 → 服務設備與現場照片</p></div><button type="button" id="v113Close" aria-label="關閉配電管理">×</button></header>
<div class="v113-scroll"><div class="v113-stats" id="v113Stats"></div>
<div class="v113-filter"><label>搜尋箱體、設備或區域<input type="search" id="v113Search" placeholder="例如：產房、配電箱、FAN、送料馬達"></label><label>選擇設備<select id="v113Device"><option value="">— 請選擇 —</option></select></label><button type="button" id="v113CSV">匯出電力盤點 CSV</button></div>
<div class="v113-layout"><section class="v113-pane"><div class="v113-pane-head"><h3>斷路器／端子登錄</h3><button type="button" id="v113Add" class="v113-primary">＋ 新增斷路器</button></div>
<p class="v113-muted" id="v113DeviceHint">請選擇已放在 CAD 的配電箱或設備。未指定端子接線前，不會推測箱內供電。</p><div id="v113TerminalList" class="v113-term-list"></div>
<div id="v113Edit" hidden><h4>開關／端子編輯 <span id="v113EditId"></span></h4><div class="v113-form">
<label>名稱／開關編號<input id="v113TermName" maxlength="70" placeholder="例如 MCCB-02"></label>
<label>保護或開關類型<select id="v113Kind"></select></label>
<label>額定電流（A，非即時負載）<input id="v113Amps" inputmode="decimal" maxlength="7" placeholder="例如 20；未知請留空"></label>
<label>極數<select id="v113Poles"><option value="">未知</option><option value="1">1P</option><option value="2">2P</option><option value="3">3P</option><option value="4">4P</option></select></label>
<label>端子方向<select id="v113Dir"><option value="input">進線</option><option value="output">出線</option><option value="both">雙向／接點</option></select></label>
<label>內部供電來源<select id="v113Feeds"></select></label>
<label>迴路／控制用途<input id="v113Controls" maxlength="200" placeholder="例如 產房B排風扇"></label>
<label>現場標記代碼<input id="v113Tag" maxlength="60" placeholder="例如 PB-MCCB-02"></label>
</div><div class="v113-buttons"><button type="button" id="v113Save" class="v113-primary">儲存開關資料</button><button type="button" id="v113Photo">查看配電箱照片</button><button type="button" id="v113Locate">CAD 定位設備</button></div><p class="v113-muted">若修改額定電流、極數、類型、端子方向或內部供電來源，相關電線會重新列為待核對。</p></div>
</section><section class="v113-pane"><h3>供電路徑與疑點</h3><div class="v113-switch"><label><input type="checkbox" id="v113VerifiedOnly"> 僅追蹤已核對電線</label><span id="v113TraceInfo">請先選擇端子</span></div><div id="v113Impact" class="v113-impact">請選擇斷路器，查看其已記錄的下游設備及欄格範圍。</div><div class="v113-traces"><div><h4>← 上游來源</h4><div id="v113Upstream"></div></div><div><h4>→ 下游設備</h4><div id="v113Downstream"></div></div></div><h4>目前設備相連電線</h4><div id="v113Wires"></div></section></div>
<section class="v113-pane v113-audit"><div class="v113-pane-head"><h3>全場迴路盤點</h3><label>狀態 <select id="v113Status"><option value="all">全部</option><option value="broken">端點缺漏</option><option value="review">待核對</option><option value="verified">已核對</option></select></label></div><div id="v113Audit"></div></section>
<p class="v113-warning">${docText} 欄位內的文字「控制用途」只是備註，並不能自動證明與設備有實際電氣連接。</p><p class="v113-message" id="v113Msg" role="status" aria-live="polite">斷路器與端子資料保存在原設備專案，沿用現有私人加密備份。</p></div></section>`;
document.body.append(overlay);
const launcher=make('button','v113-launch','⚡ 配電箱／斷路器／控制迴路');launcher.id='v113Launch';launcher.type='button';
const host=$('v83EquipPanel');host?.insertBefore(launcher,host.children[2]||null);
const fab=make('button','v113-fab','⚡ 迴路');fab.id='v113Fab';fab.type='button';fab.setAttribute('aria-label','快速開啟配電迴路工作台');document.body.append(fab);
let opened=false,deviceId='',terminalId='',search='';
function opt(s,value,label){const o=new Option(label,value);s.append(o);}
function state(text,error=false){$('v113Msg').textContent=text;$('v113Msg').dataset.error=error?'1':'0';}
function report(){return inspect();}
function effectiveSelected(){return selectedDev(deviceId);}
function onlyAdmin(){if(hw.getRole()!=='admin'){state('員工檢視模式：僅能查詢，請切換到管理者編輯模式',true);return false;}return true;}
function setButtons(){const can=hw.getRole()==='admin'&&!!effectiveSelected();$('v113Add').disabled=!can;$('v113Save').disabled=!can||!terminalId;for(const id of ['v113TermName','v113Kind','v113Amps','v113Poles','v113Dir','v113Feeds','v113Controls','v113Tag'])$(id).disabled=!can;}
function deviceCandidates(result){const hasWire=new Set(result.wires.flatMap(w=>[w.from,w.to]));return result.project.devices.filter(d=>getTypes(d)==='electric'||hasWire.has(d.id)||(d.terminals||[]).length).sort((a,b)=>a.name.localeCompare(b.name,'zh-Hant'));}
function fillTerminalForm(d,t){const edit=$('v113Edit');edit.hidden=!t;if(!t)return;
 $('v113EditId').textContent='ID '+t.id;$('v113TermName').value=t.name;$('v113Kind').value=t.breakerKind||'terminal';$('v113Amps').value=t.ratedAmps||'';$('v113Poles').value=t.poleCount||'';$('v113Dir').value=t.direction||'both';$('v113Controls').value=t.controls||'';$('v113Tag').value=t.circuitTag||'';
 const feeds=$('v113Feeds');feeds.replaceChildren();opt(feeds,'','— 尚未設定（不自動推斷）—');for(const o of d.terminals||[])if(o.id!==t.id)opt(feeds,o.id,o.name);feeds.value=t.feedsFrom||'';
 if(t.feedsFrom&&!feeds.value)opt(feeds,t.feedsFrom,'⚠ 已不存在的上游端子');feeds.value=t.feedsFrom||'';
}
function pathLabel(key,result){const p=key.indexOf('::'),id=key.slice(0,p),term=key.slice(p+2),d=result.all.get(id),t=(d?.terminals||[]).find(x=>x.id===term);return {id,name:(d?.name||'未知設備')+(t?'／'+t.name:'')};}
function linkedCard(w){const row=make('div','v113-wire');const left=make('div','v113-wire-info');left.append(make('b','',w.route.circuitName||w.route.name),make('small','',(w.d1?.name||'未指定上游')+' → '+(w.d2?.name||'未指定下游')),make('small','',w.problems.length?w.problems.join('；'):'端點和現場核對資料齊全'));
 const pill=make('span','v113-pill '+w.severity,w.severity==='verified'?'已核對':w.severity==='broken'?'端點缺漏':'待核對');
 const b=make('button','','CAD 查看');b.type='button';b.onclick=()=>{close();hw.select('route',w.route.id);const pts=w.route.points;const pt=pts[Math.floor(pts.length/2)];if(pt)hw.focus(pt.x,pt.y);};row.append(left,pill,b);return row;}
function renderTrace(r,d,t){for(const [id,reverse] of [['v113Upstream',true],['v113Downstream',false]]){const div=$(id);div.replaceChildren();if(!d||!t){div.append(make('p','v113-muted','請先選取斷路器或端子'));continue;}
 const found=r.reach(d.id,t.id,reverse,$('v113VerifiedOnly').checked);
 if(!found.length){div.append(make('p','v113-muted','目前沒有可追蹤的已建檔連線'));continue;}
 for(const item of found.slice(0,80)){const {id,name}=pathLabel(item.key,r);const row=make('div','v113-path');row.append(make('span','',name),make('small','',item.verified?'全部外部電線已有核對紀錄':'路徑包含待核對電線／僅有內部端子記錄'));const jump=make('button','','定位');jump.onclick=()=>{const dev=r.all.get(id);if(dev){close();hw.select('device',id);hw.focus(dev.x,dev.y);}};row.append(jump);div.append(row);}
 if(found.length>80)div.append(make('p','v113-muted','僅列出前80筆，請選其他端子縮小範圍'));
 }
 const related=r.wires.filter(x=>x.from===d?.id||x.to===d?.id);$('v113TraceInfo').textContent=t?`從「${t.name}」追蹤（僅依文件接點）`:'請選擇端子';
 const impact=$('v113Impact');
 if(d&&t){
  const full=r.reach(d.id,t.id,false,false),checked=r.reach(d.id,t.id,false,true),ids=new Set(full.map(x=>x.key.split('::')[0]).filter(id=>id!==d.id)),verifiedIds=new Set(checked.map(x=>x.key.split('::')[0]).filter(id=>id!==d.id));
  const stallIds=new Set();for(const id of ids)for(const stall of stalls?.stallsFor?.(id)||[])stallIds.add(stall);
  impact.textContent=`資料關聯下游：${ids.size} 台設備；其中經已核對電線連通 ${verifiedIds.size} 台；關聯欄格 ${stallIds.size} 筆。這是圖面資料推算，不代表設備實際停電或確定受影響。`;
 }else impact.textContent='請先選擇斷路器或端子，查看已記錄的下游設備及欄格範圍。';const div=$('v113Wires');div.replaceChildren();if(!related.length)div.append(make('p','v113-muted','這台設備尚未連結電線'));related.forEach(w=>div.append(linkedCard(w)));
}
function update(){if(!opened)return;const r=report(),all=deviceCandidates(r),options=all.filter(d=>`${d.name} ${d.zone} ${hw.getType(d.type)?.label||''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
 const stats=$('v113Stats');stats.replaceChildren();for(const [value,label] of [[r.panels.length,'已建配電／控制設備'],[r.breakers,'開關與保護元件'],[r.wires.length,'電力線路'],[r.wires.filter(w=>w.severity!=='verified').length,'尚待盤點線路']]){const item=make('div','v113-stat');item.append(make('strong','',value),make('span','',label));stats.append(item);}
 const select=$('v113Device');select.replaceChildren();opt(select,'','— 請選擇現有設備 —');options.forEach(d=>opt(select,d.id,d.name+' · '+(d.zone||'未指定位置')));if(deviceId&&!options.some(d=>d.id===deviceId)&&all.some(d=>d.id===deviceId))opt(select,deviceId,'目前選擇的設備（不符合搜尋）');
 if(!all.some(d=>d.id===deviceId)){deviceId='';terminalId='';}select.value=deviceId;
 const d=effectiveSelected();$('v113DeviceHint').textContent=d?`目前設備：${d.name} · ${d.zone||'未指定區域'}；${(d.terminals||[]).length} 個端子。`: '尚未選擇設備。先從既有圖標選取配電箱或風扇，也可在 CAD 新增主配電箱／區域分電盤。';
 const list=$('v113TerminalList');list.replaceChildren();if(d){if(!d.terminals?.length)list.append(make('p','v113-muted','尚未建立端子或開關。先增加一個斷路器，再設定它的上游端子及電線。'));
  for(const t of d.terminals||[]){const line=make('button','v113-term'+(terminalId===t.id?' active':''));line.type='button';line.append(make('b','',t.name),make('small','',[KINDS[t.breakerKind]||'接線端子',t.ratedAmps?t.ratedAmps+'A':'電流未填',t.poleCount?t.poleCount+'P':''].filter(Boolean).join(' · ')));line.onclick=()=>{terminalId=t.id;update();};list.append(line);}
 }else list.append(make('p','v113-muted','尚未選擇設備'));
 const t=d?.terminals?.find(x=>x.id===terminalId);if(!t)terminalId='';fillTerminalForm(d,t);setButtons();renderTrace(r,d,t);
 const audit=$('v113Audit');audit.replaceChildren();const status=$('v113Status').value;let count=0;for(const w of r.wires){if(status!=='all'&&w.severity!==status)continue;if(++count>180)break;audit.append(linkedCard(w));}if(!count)audit.append(make('p','v113-muted','尚無符合條件的電線紀錄。'));if(count>180)audit.append(make('p','v113-muted','只列出前180條，請縮小篩選範圍。'));
}
function open(id){if(id&&read().devices.some(d=>d.id===id))deviceId=id;opened=true;overlay.hidden=false;update();overlay.querySelector('.v113-dialog').focus();}
function close(){opened=false;overlay.hidden=true;}
function addTerminal(){if(!onlyAdmin())return;const d=effectiveSelected();if(!d){state('請先選擇配電箱或其他設備',true);return;}if((d.terminals||[]).length>=80){state('單台設備最多80個開關／端子',true);return;}
 const item={id:'brk-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),name:'新斷路器 '+((d.terminals||[]).length+1),breakerKind:'mcb',ratedAmps:'',poleCount:'',circuitTag:'',direction:'output',feedsFrom:'',controls:'',purpose:'',note:''};
 if(!hw.updateDetails('device',d.id,{terminals:[...(d.terminals||[]),item]})){state('新增失敗，請檢查權限與儲存空間',true);return;}terminalId=item.id;update();state('已新增開關：請填實際規格並核對進出線；目前不代表已接線。');}
function saveTerminal(){if(!onlyAdmin())return;const d=effectiveSelected(),t=d?.terminals?.find(x=>x.id===terminalId);if(!t){state('請先選取端子',true);return;}
 const name=$('v113TermName').value.trim(),amps=$('v113Amps').value.trim(),poles=$('v113Poles').value,feeds=$('v113Feeds').value;
 if(!name){state('開關名稱不可空白',true);return;}
 if(amps&&(!/^\d{1,4}(?:\.\d{1,2})?$/.test(amps)||Number(amps)>2000||Number(amps)<=0)){state('額定電流請輸入 0 至 2000 A 的正數，或留空表示未知',true);return;}
 const peers=new Map(d.terminals.map(x=>[x.id,x]));if(feeds&&!peers.has(feeds)){state('內部上游端子無效，請重新選擇',true);return;}
 let next=feeds;const seen=new Set([terminalId]);while(next){if(seen.has(next)){state('這個來源設定會形成箱內供電循環，已拒絕儲存',true);return;}seen.add(next);next=peers.get(next)?.feedsFrom||'';}
 const copy=JSON.parse(JSON.stringify(d.terminals)),item=copy.find(x=>x.id===terminalId);
 Object.assign(item,{name:name.slice(0,70),breakerKind:$('v113Kind').value,ratedAmps:amps,poleCount:poles,direction:$('v113Dir').value,feedsFrom:feeds,controls:$('v113Controls').value.trim().slice(0,200),circuitTag:$('v113Tag').value.trim().slice(0,60)});
 const critical=['breakerKind','ratedAmps','poleCount','direction','feedsFrom','circuitTag'].some(k=>String(t[k]||'')!==String(item[k]||''));
 if(!hw.updateDetails('device',d.id,{terminals:copy})){state('更新失敗，請檢查儲存狀態',true);return;}
 update();state('端子已保存'+(critical?'；如有相關已核對電線，已改為待重新核對。':''));}
function exportCSV(){const r=report(),lines=[['類型','編號','名稱','來源','去向','規格','人工核對','盤點狀態','缺漏原因']];
 for(const d of r.project.devices)for(const t of d.terminals||[])lines.push(['開關／端子',t.circuitTag||t.id,d.name+'／'+t.name,t.feedsFrom||'',t.controls||'',[KINDS[t.breakerKind]||'端子',t.ratedAmps?t.ratedAmps+'A':'',t.poleCount?t.poleCount+'P':''].join(' '),'','', '']);
 for(const w of r.wires)lines.push(['電力線',w.route.circuitName||w.route.id,w.route.name,w.d1?.name||'未知',w.d2?.name||'未知',w.route.cableSpec||'',w.route.verifiedBy?[w.route.verifiedBy,w.route.verifiedAt].filter(Boolean).join('／'):'',w.severity,w.problems.join('；')]);
 const safe=v=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const blob=new Blob(['\uFEFF'+lines.map(row=>row.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download='虎尾場_V11.3_配電迴路盤點.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);state('已輸出 '+(lines.length-1)+' 筆開關及電線盤點資料，匯出前請注意資料保密。');}
$('v113Close').onclick=close;overlay.onclick=e=>{if(e.target===overlay)close();};document.addEventListener('keydown',e=>{if(opened&&e.key==='Escape'){e.stopPropagation();close();}});
const launchFromSelection=()=>{const sel=hw.getSelected();open(sel?.kind==='device'?sel.id:undefined);};launcher.onclick=launchFromSelection;fab.onclick=launchFromSelection;
$('v113Search').oninput=e=>{search=e.target.value.trim();update();};$('v113Device').onchange=e=>{deviceId=e.target.value;terminalId='';update();};$('v113Status').onchange=update;$('v113VerifiedOnly').onchange=update;
$('v113Add').onclick=addTerminal;$('v113Save').onclick=saveTerminal;$('v113CSV').onclick=exportCSV;
$('v113Photo').onclick=()=>{if(!deviceId)return;close();hw.select('device',deviceId);window.HWDeviceRecords?.open('photos');};
$('v113Locate').onclick=()=>{const d=effectiveSelected();if(d){close();hw.select('device',d.id);hw.focus(d.x,d.y);}};
for(const [val,name] of Object.entries(KINDS))opt($('v113Kind'),val,name);
window.addEventListener('hw-v90-change',e=>{if(opened&&['data','role','history'].includes(e.detail?.kind))update();});
window.HWPowerBoardV113={version:'11.3',open,close,inspect,addTerminal,saveTerminal};
})();
