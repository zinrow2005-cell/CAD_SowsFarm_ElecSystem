/* V9.7: independent feed-pipe inspector and legacy ventilation-line classification.
 * No inference of physical wiring or feed-pipe endpoints is made from geometrical proximity.
 * All changes go through HWEquipment.updateDetails and therefore its sanitize/save/history.
 */
(function(){'use strict';
const api=window.HWEquipment;
if(!api)return;
const $=id=>document.getElementById(id);
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
const project=()=>api.getData();
const feedRoutes=()=>project().routes.filter(r=>r.group==='feed');
const activeRoute=()=>{const sel=api.getSelected();return sel?.kind==='route'?project().routes.find(r=>r.id===sel.id):null;};
const isAdmin=()=>api.getRole()==='admin';
let routeId='',opened=false;
const dlg=make('div','v97-backdrop');dlg.id='v97FeedDialog';dlg.hidden=true;
const body=make('section','v97-modal');body.setAttribute('role','dialog');body.setAttribute('aria-modal','true');body.setAttribute('aria-labelledby','v97FeedTitle');
body.innerHTML=`<div class="v97-modal-head"><div><small>飼料輸送配置 / V9.7</small><h2 id="v97FeedTitle">飼料管與上下游追蹤</h2></div><button type="button" class="v97-close" id="v97Close" aria-label="關閉飼料管資訊">×</button></div>
<div class="v97-modal-body">
 <label class="v97-label" for="v97Route">選擇一條飼料傳輸管</label><select id="v97Route" class="v97-input"></select>
 <p class="v97-hint">方向為 <strong>來源 → 去向</strong>，只有明確建檔的設備連接才會列入追蹤。不是現場自動辨識管線。</p>
 <div id="v97Warnings" class="v97-warnings" aria-live="polite"></div>
 <div class="v97-two">
   <label class="v97-label">上游／飼料來源<select id="v97From" class="v97-input"></select></label>
   <label class="v97-label">下游／供料去向<select id="v97To" class="v97-input"></select></label>
 </div>
 <div class="v97-two">
  <label class="v97-label">輸送方式<select id="v97Mode" class="v97-input"><option value="auger">絞龍／螺旋輸送</option><option value="chain">鏈式／盤鏈</option><option value="pneumatic">氣送／風送飼料</option><option value="other">其他／尚未確認</option></select></label>
  <label class="v97-label">料管規格／管徑<input class="v97-input" id="v97Spec" maxlength="120" placeholder="例：Φ60 mm、管徑／材質"></label>
 </div>
 <label class="v97-label">用途／供應區域<input class="v97-input" id="v97Purpose" maxlength="400" placeholder="例：產房 B 棟第 1～3 排料槽"></label>
 <label class="v97-check"><input type="checkbox" id="v97Confirmed"> 這條料管的來源與去向已經現場核對</label>
 <div class="v97-actions"><button type="button" id="v97Save" class="v97-main">儲存料管資料</button><button type="button" id="v97Locate">在 CAD 定位</button></div>
 <div class="v97-trace"><h3>從這條料管追蹤</h3><div class="v97-two"><div><strong>上游來源</strong><div id="v97Upstream"></div></div><div><strong>下游去向</strong><div id="v97Downstream"></div></div></div></div>
 <p class="v97-hint">飼料管只代表已記錄的物理輸送路徑。送料馬達或風扇的<strong>供電／控制配線仍使用「畫電線」</strong>，不可將氣流方向或飼料流向視為電力迴路。</p>
</div>`;
dlg.appendChild(body);document.body.appendChild(dlg);
function close(){opened=false;dlg.hidden=true;}
function alertText(txt){$('v97Warnings').replaceChildren();if(txt)$('v97Warnings').appendChild(make('div','v97-warning',txt));}
function findRoute(id){return feedRoutes().find(r=>r.id===id);}
function refreshSelects(route){const data=project(),opts=[...data.devices].sort((a,b)=>(api.getType(a.type)?.group==='feed'?0:1)-(api.getType(b.type)?.group==='feed'?0:1));
 for(const id of ['v97From','v97To']){const select=$(id),old=id==='v97From'?route?.fromDeviceId:route?.toDeviceId;select.replaceChildren();select.add(new Option('尚未指定設備（待核對）',''));for(const dev of opts){const label=(api.getType(dev.type)?.group==='feed'?'飼料｜':'其他｜')+dev.name+(dev.zone?' · '+dev.zone:'');select.add(new Option(label,dev.id));}select.value=old||'';}
}
function graph(){const ds=project().devices, valid=new Set(ds.map(d=>d.id));const edges=[];
 for(const r of feedRoutes()){const from=r.fromDeviceId||r.points?.[0]?.deviceId||'',to=r.toDeviceId||r.points?.[r.points.length-1]?.deviceId||'';
  if(valid.has(from)&&valid.has(to)&&from!==to)edges.push({from,to,route:r});}
 return{edges,names:new Map(ds.map(d=>[d.id,d.name]))};}
function trace(root,reverse){const g=graph(),found=[],visited=new Set([root]),queue=[{device:root,path:[]}];
 while(queue.length&&found.length<40){const item=queue.shift();for(const e of g.edges){const match=reverse?e.to===item.device:e.from===item.device;if(!match)continue;const next=reverse?e.from:e.to;
  if(visited.has(next))continue;visited.add(next);
  const path=[...item.path,e],record={name:g.names.get(next)||'設備已刪除',route:e.route,path,device:next};found.push(record);
  if(!item.path.some(p=>p.from===e.from&&p.to===e.to)&&path.length<30)queue.push({device:next,path});
 }}return found;}
function traceList(id,root,reverse){const host=$(id);host.replaceChildren();if(!root){host.appendChild(make('p','v97-hint','尚未指定連接設備，無法追蹤。'));return;}
 const items=trace(root,reverse);if(!items.length){host.appendChild(make('p','v97-hint','沒有其他已建檔的'+(reverse?'上游':'下游')+'管線。'));return;}
 for(const item of items.slice(0,25)){const a=make('button','v97-trace-row');a.type='button';a.textContent=item.name+' · '+(item.route.name||'送料管');const complete=item.path.every(p=>p.route.confirmed);const chip=make('small',complete?'v97-ok':'v97-pending',complete?'已核對路徑':'含待核對連接');a.append(chip);a.addEventListener('click',()=>{routeId=item.route.id;populate();});host.appendChild(a);}
 if(items.length>25)host.appendChild(make('p','v97-hint','還有其他路徑，請縮小管線範圍。'));
}
function populate(){const list=feedRoutes(),choice=$('v97Route');choice.replaceChildren();for(const r of list)choice.add(new Option(r.name||'未命名飼料管',r.id));if(!list.some(r=>r.id===routeId))routeId=list[0]?.id||'';choice.value=routeId;
 if(!routeId){for(const key of ['v97Upstream','v97Downstream'])$(key).replaceChildren(make('p','v97-hint','目前尚未建立飼料管。'));['v97From','v97To'].forEach(k=>$(k).replaceChildren());alertText('請先用「畫飼料管」建立管線，並點選來源與終點設備。');$('v97Save').disabled=true;return;}
 const route=findRoute(routeId);refreshSelects(route);$('v97Mode').value=route.feedMode||'auger';$('v97Spec').value=route.feedSpec||'';$('v97Purpose').value=route.purpose||'';$('v97Confirmed').checked=!!route.confirmed;
 const isSelected=!!route,edit=isAdmin();for(const id of ['v97From','v97To','v97Mode','v97Spec','v97Purpose','v97Confirmed'])$(id).disabled=!edit;$('v97Save').hidden=!edit;$('v97Save').disabled=!isSelected;
 const valid=new Set(project().devices.map(x=>x.id));const reasons=[];
 if(!route.fromDeviceId||!valid.has(route.fromDeviceId))reasons.push('未設定有效上游料源');
 if(!route.toDeviceId||!valid.has(route.toDeviceId))reasons.push('未設定有效下游目的地');
 if(route.fromDeviceId&&route.toDeviceId&&route.fromDeviceId===route.toDeviceId)reasons.push('來源與去向是同一個設備');
 if(!route.confirmed)reasons.push('尚未現場核對');
 if(reasons.length)alertText(reasons.join('；'));else alertText('此送料路徑已標記為現場核對。');
 traceList('v97Upstream',route.fromDeviceId,true);traceList('v97Downstream',route.toDeviceId,false);
}
function open(id){routeId=id||activeRoute()?.id||feedRoutes()[0]?.id||'';opened=true;dlg.hidden=false;populate();}
$('v97Close').addEventListener('click',close);dlg.addEventListener('click',e=>{if(e.target===dlg)close();});
$('v97Route').addEventListener('change',e=>{routeId=e.target.value;populate();});
$('v97Save').addEventListener('click',()=>{const route=findRoute(routeId);if(!route||!isAdmin())return;
 const from=$('v97From').value,to=$('v97To').value,checked=$('v97Confirmed').checked;
 if(checked&&(!from||!to||from===to)){alertText('核對狀態無法儲存：請先指定不同的有效上游、下游設備。');return;}
 const fields={fromDeviceId:from,toDeviceId:to,feedMode:$('v97Mode').value,feedSpec:$('v97Spec').value.trim(),purpose:$('v97Purpose').value.trim(),confirmed:checked};
 // Synchronize actual route endpoint bindings with the explicit source/destination selection.
 const points=route.points.map(p=>({...p})),byId=new Map(project().devices.map(d=>[d.id,d]));
 for(const [idx,id] of [[0,from],[points.length-1,to]]){if(id&&byId.has(id)){const d=byId.get(id);points[idx]={x:d.x,y:d.y,deviceId:id};}else {const old=route.points[idx];points[idx]={x:old.x,y:old.y};}}
 fields.points=points;
 if(!api.updateDetails('route',route.id,fields)){alertText('無法儲存，請確認管理者模式。');return;}
 populate();$('v97Warnings').appendChild(make('div','v97-ok v97-saved','已儲存至本機設備資料，請記得備份。'));
});
$('v97Locate').addEventListener('click',()=>{const r=findRoute(routeId);if(!r)return;api.select('route',r.id);const p=r.points[Math.floor(r.points.length/2)];if(p)api.focus(p.x,p.y);close();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){e.stopImmediatePropagation();close();}},true);
// Compact actions appear only for relevant selected route. No extra sidebar groups.
const details=$('eqDetails'),tools=make('div','v97-context');const feedButton=make('button','v97-inline','▰ 料管資訊與上下游追蹤');feedButton.type='button';feedButton.addEventListener('click',()=>open(activeRoute()?.id));
const legacyButton=make('button','v97-inline v97-legacy','確認舊通風線為電線，轉換分類');legacyButton.type='button';legacyButton.addEventListener('click',()=>{
 const old=activeRoute();if(!isAdmin()||old?.group!=='ventilation')return;
 const yes=confirm('請現場確認：這條「舊通風線路」是否確實是風扇、水簾或導引扇的供電／控制電線？\n\n若原本畫的是風向／氣流示意，請按「取消」，保留原分類。\n\n轉換後會標示為未核對，須再設定電線端子及供電迴路。');
 if(!yes)return;
 api.updateDetails('route',old.id,{group:'electric',confirmed:false,fromTerminalId:'',toTerminalId:'',note:[old.note,'V9.7：人工確認為供電／控制線後由舊通風線轉換；端子與電路仍待核對。'].filter(Boolean).join(' | ').slice(0,900)});
});
tools.append(feedButton,legacyButton);details?.appendChild(tools);
// Selecting a route often leaves the sidebar collapsed. Provide one small on-map action
// rather than forcing users to open the long sidebar to inspect the active line.
const floatBar=make('div','v97-floatbar');floatBar.id='v97FloatBar';floatBar.hidden=true;
const floatFeed=make('button','v97-float','▰ 料管資料／追蹤');floatFeed.type='button';floatFeed.addEventListener('click',()=>open(activeRoute()?.id));
const floatLegacy=make('button','v97-float v97-float-legacy','核對舊通風線 → 轉電線');floatLegacy.type='button';floatLegacy.addEventListener('click',()=>legacyButton.click());
floatBar.append(floatFeed,floatLegacy);document.querySelector('.viewer')?.appendChild(floatBar);
function updateTools(){const r=activeRoute();const applicable=!!r&&(r.group==='feed'||r.group==='ventilation');tools.hidden=!applicable;feedButton.hidden=r?.group!=='feed';legacyButton.hidden=r?.group!=='ventilation'||!isAdmin();floatBar.hidden=!applicable||api.getWorkspace()!=='equipment';floatFeed.hidden=r?.group!=='feed';floatLegacy.hidden=r?.group!=='ventilation'||!isAdmin();}
window.addEventListener('hw-v90-change',e=>{if(['selection','data','role','workspace'].includes(e.detail?.kind)){updateTools();if(opened)populate();}});
updateTools();
window.HWFeedV97={open,close,graph,trace,feedRoutes};
})();
