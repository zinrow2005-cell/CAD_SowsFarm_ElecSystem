/* HUWEI V11.9.3 — read-only search index + CAD quick locator. No persisted search data. */
(function(){
'use strict';
const hw=window.HWEquipment, svg=document.getElementById('plan'), viewer=document.querySelector('.viewer');
if(!hw||!svg||!viewer)return;
const $=id=>document.getElementById(id);
const groups={water:'給排水',electric:'電力',ventilation:'通風',feed:'飼料',equipment:'其他設備'};
const categoryLabels={all:'全部',device:'所有設備',route:'管線',water:'水路',electric:'電力',ventilation:'通風',feed:'飼料',equipment:'其他'};
const initialBox=svg.getAttribute('viewBox').split(/\s+/).map(Number);
const ratio=initialBox[3]/initialBox[2];
let currentCategory='all', visible=false, lastActive=null, matches=[], previousQuery='';
const overlay=document.createElement('div');
overlay.id='v1192Search';overlay.hidden=true;
overlay.innerHTML=`<div class="v1192-shade" data-close="1"></div>
<section class="v1192-window" role="dialog" aria-modal="true" aria-labelledby="v1192Title" tabindex="-1">
 <header class="v1192-top"><div class="v1192-kicker">HUWEI · EQUIPMENT LOCATOR</div><div class="v1192-heading"><div><h2 id="v1192Title">快速搜尋與 CAD 定位</h2><p>輸入設備名稱、ID、類型或棟舍位置，直接跳到對應圖面</p></div><button type="button" class="v1192-close" id="v1192Close" aria-label="關閉搜尋">×</button></div></header>
 <div class="v1192-search-area"><label for="v1192Query">搜尋本機已建檔設備與線路</label><div class="v1192-input-box"><span aria-hidden="true">⌕</span><input type="search" id="v1192Query" placeholder="例如：水塔、配電箱、B棟、FAN、設備編號…" autocomplete="off" spellcheck="false"><button id="v1192Clear" type="button" aria-label="清除搜尋文字" hidden>清除</button></div>
 <div class="v1192-categories" role="group" aria-label="搜尋篩選分類"></div></div>
 <div class="v1192-results-bar"><b id="v1192Count" aria-live="polite">0 筆結果</b><small>僅搜尋此裝置已建立的紀錄，搜尋不會修改設備資料</small></div>
 <div class="v1192-results" id="v1192Results" role="list"></div>
 <div class="v1192-footer"><span id="v1192Message" role="status" aria-live="polite">點選設備，圖面會自動放大到該位置。</span><button type="button" id="v1192AllMap">⌗ 回全場圖</button></div>
</section>`;
document.body.appendChild(overlay);
const chips=overlay.querySelector('.v1192-categories');
for(const [key,value] of Object.entries(categoryLabels)){
 const btn=document.createElement('button');btn.type='button';btn.dataset.category=key;btn.textContent=value;btn.setAttribute('aria-pressed',String(key==='all'));chips.appendChild(btn);
}
const highlight=document.createElementNS('http://www.w3.org/2000/svg','g');
highlight.setAttribute('id','v1192MapHighlight');highlight.setAttribute('pointer-events','none');
highlight.setAttribute('aria-hidden','true');svg.appendChild(highlight);
const nav=document.createElement('button');nav.type='button';nav.id='v1192TopSearch';nav.innerHTML='⌕ <span>搜尋</span>';nav.title='搜尋設備並定位 CAD 圖面';nav.setAttribute('aria-label','搜尋設備或管線並定位 CAD 圖面');
(document.querySelector('.mobilebar')||viewer).appendChild(nav);
const desktop=document.createElement('button');desktop.type='button';desktop.id='v1192DesktopSearch';desktop.textContent='⌕ 快速搜尋';desktop.title='搜尋設備並定位（Ctrl+K）';desktop.setAttribute('aria-label','快速搜尋設備或管線');viewer.appendChild(desktop);
nav.addEventListener('click',open);desktop.addEventListener('click',open);
const groupForDevice=d=>hw.getType(d.type)?.group||'equipment';
const toText=v=>String(v??'').toLocaleLowerCase();
function allRecords(){
 const data=hw.getData();const devices=Array.isArray(data.devices)?data.devices:[];
 const routes=Array.isArray(data.routes)?data.routes:[];
 return [...devices.map(d=>{
    const type=hw.getType(d.type)||{};const group=groupForDevice(d);
    const values=[d.id,d.name,d.zone,d.note,type.label,type.symbol,d.type, ...(Array.isArray(type.keywords)?type.keywords:[]), ...(Array.isArray(d.fields)?d.fields.flatMap(f=>[f.key,f.value]):[])];
    return {kind:'device',id:d.id,group,title:d.name||'未命名設備',line:(d.zone||'尚未填區域')+' · '+(type.label||d.type||'設備'),search:values.map(toText).join(' '),record:d};
 }),...routes.map(r=>({kind:'route',id:r.id,group:r.group||'equipment',title:r.name||'未命名管線',line:(groups[r.group]||'其他')+'線路 · '+(r.points?.length||0)+' 個節點',search:[r.id,r.name,r.note,r.purpose,r.circuitName,r.group,r.fromDeviceId,r.toDeviceId].map(toText).join(' '),record:r}))];
}
function include(item){return currentCategory==='all'||(currentCategory==='device'&&item.kind==='device')||(currentCategory==='route'&&item.kind==='route')||(item.kind==='device'&&item.group===currentCategory);}
function rank(item,q){const name=toText(item.title),id=toText(item.id);return name===q||id===q?0:name.startsWith(q)?1:id.startsWith(q)?2:item.line.toLocaleLowerCase().includes(q)?3:4;}
function render(){
 if(!visible)return;
 const q=$('v1192Query').value.trim().toLocaleLowerCase();previousQuery=q;
 const list=allRecords().filter(include).filter(item=>!q||q.split(/\s+/).every(word=>item.search.includes(word)));
 if(q)list.sort((a,b)=>rank(a,q)-rank(b,q)||a.title.localeCompare(b.title,'zh-TW'));
 matches=list;
 const host=$('v1192Results');host.replaceChildren();
 $('v1192Count').textContent=list.length.toLocaleString('zh-TW')+' 筆結果'+(list.length>100?'（顯示前 100 筆）':'');
 $('v1192Clear').hidden=!q;
 for(const item of list.slice(0,100)){
    const btn=document.createElement('button');btn.type='button';btn.className='v1192-result';btn.dataset.kind=item.kind;btn.dataset.id=item.id;btn.setAttribute('role','listitem');
    const icon=document.createElement('span');icon.className='v1192-result-icon';icon.dataset.group=item.group;icon.textContent=item.kind==='route'?'⌁':({'water':'💧','electric':'⚡','ventilation':'◉','feed':'▰','equipment':'⚙'}[item.group]||'⚙');
    const body=document.createElement('span');body.className='v1192-result-body';
    const title=document.createElement('strong');title.textContent=item.title;
    const info=document.createElement('small');info.textContent=item.line;
    const id=document.createElement('em');id.textContent='ID：'+item.id;
    const arrow=document.createElement('span');arrow.className='v1192-result-arrow';arrow.textContent='定位 ↗';
    body.append(title,info,id);btn.append(icon,body,arrow);host.appendChild(btn);
 }
 if(!list.length){const empty=document.createElement('div');empty.className='v1192-empty';const b=document.createElement('b');b.textContent=q?'沒有找到符合的紀錄':'尚無設備或管線資料';const small=document.createElement('p');small.textContent=q?'請試試其他名稱、區域或設備編號。':'目前搜尋的是本機資料，需先在設備工作台建立記錄。';empty.append(b,small);host.appendChild(empty);}
 chips.querySelectorAll('button').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.category===currentCategory)));
}
function open(){
 if(visible)return;
 window.HWMobileFieldV1191?.closeDrawer?.();
 lastActive=document.activeElement;visible=true;overlay.hidden=false;currentCategory='all';announce('點選設備，圖面會自動放大到該位置。');
 render();
 $('v1192Query').focus({preventScroll:true});$('v1192Query').select();
}
function close(){
 visible=false;overlay.hidden=true;lastActive?.focus?.({preventScroll:true});
}
function announce(message){$('v1192Message').textContent=message;}
function svgNode(tag,attrs){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;}
function markPoint(x,y){
 const circle=svgNode('circle',{cx:x,cy:y,r:1.36,fill:'none',stroke:'#ffe08c','stroke-width':'.19','stroke-dasharray':'.28 .13'});
 const center=svgNode('circle',{cx:x,cy:y,r:'.20',fill:'#ffe08c',stroke:'#0b2534','stroke-width':'.11'});
 highlight.append(circle,center);
}
function camera(centerX,centerY,spanW){
 const maxW=initialBox[2], maxH=initialBox[3], width=Math.min(maxW,Math.max(7.5,spanW));
 const height=Math.min(maxH,width*ratio);
 const minX=initialBox[0],minY=initialBox[1];
 const left=Math.max(minX,Math.min(minX+maxW-width,centerX-width/2));
 const top=Math.max(minY,Math.min(minY+maxH-height,centerY-height/2));
 svg.setAttribute('viewBox',[left,top,width,height].map(v=>Number(v.toFixed(4))).join(' '));
}
function locate(kind,id){
 // Changing CAD viewport mid-route can cause accidental placement; keep the existing edit intact.
 if(hw.getAction()?.action){announce('正在放置設備或繪製管線。請先完成或取消操作，再進行搜尋定位。');return false;}
 if(!$('v84Drawer')?.hidden && hw.getRole()==='admin'){announce('設備編輯視窗尚未關閉。請先完成編輯或儲存並關閉，再進行定位。');return false;}
 const item=allRecords().find(x=>x.kind===kind&&x.id===id);
 if(!item){announce('這筆設備／管線已不存在，請重新搜尋。');render();return false;}
 const d=item.record;let points=[];
 if(kind==='device'){
   const placement=hw.getVisualPlacement?.(id);const p=placement?.icon||placement?.physical||d;
   if(Number.isFinite(+p.x)&&Number.isFinite(+p.y))points=[{x:+p.x,y:+p.y}];
 } else {
   const devices=new Map(hw.getData().devices.map(x=>[x.id,x]));
   points=(Array.isArray(d.points)?d.points:[]).map(p=>p?.deviceId&&devices.has(p.deviceId)?devices.get(p.deviceId):p).filter(p=>p&&Number.isFinite(+p.x)&&Number.isFinite(+p.y)).map(p=>({x:+p.x,y:+p.y}));
 }
 if(!points.length){announce('這筆紀錄沒有可用的 CAD 座標，請至設備工作台檢查。');return false;}
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 const viewWidth=kind==='route'?Math.max(10,Math.max(...xs)-Math.min(...xs)+4,(Math.max(...ys)-Math.min(...ys)+4)/ratio):10.8;
 window.HWHomeV119?.hide?.();
 $('side')?.classList.remove('open');window.HWMobileFieldV1191?.closeDrawer?.();
 // The legacy staff record module opens a large drawer on selection in the equipment
 // workspace. Select while in base mode, then return to equipment without that popup.
 if(!$('v84Drawer')?.hidden) $('v84DrawerClose')?.click();
 hw.setWorkspace('base');hw.select(kind,id);hw.setWorkspace('equipment');
 camera(cx,cy,viewWidth);
 highlight.replaceChildren();
 if(kind==='route'&&points.length>=2){highlight.appendChild(svgNode('polyline',{points:points.map(p=>`${p.x},${p.y}`).join(' '),fill:'none',stroke:'#ffe08c','stroke-width':'.18','stroke-linejoin':'round','stroke-linecap':'round'}));}
 markPoint(kind==='device'?points[0].x:cx,kind==='device'?points[0].y:cy);
 close();
 viewer.classList.add('v1192-locating');document.body.classList.add('v1192-locating');
 $('v1192LocateBannerText').textContent='已定位：'+item.title;
 $('v1192LocateBanner').hidden=false;
 return true;
}
function reset(){highlight.replaceChildren();viewer.classList.remove('v1192-locating');document.body.classList.remove('v1192-locating');$('v1192LocateBanner').hidden=true;$('fit')?.click();}
const banner=document.createElement('div');banner.id='v1192LocateBanner';banner.hidden=true;banner.innerHTML='<span id="v1192LocateBannerText" role="status"></span><button type="button" id="v1192Info">查看資料</button><button type="button" id="v1192Reset">⌗ 全場</button><button type="button" id="v1192Dismiss" aria-label="關閉定位提示">×</button>';viewer.appendChild(banner);
$('v1192Reset').addEventListener('click',reset);
$('v1192Info').addEventListener('click',()=>{viewer.classList.remove('v1192-locating');document.body.classList.remove('v1192-locating');banner.hidden=true;});
$('v1192Dismiss').addEventListener('click',()=>{viewer.classList.remove('v1192-locating');document.body.classList.remove('v1192-locating');banner.hidden=true;highlight.replaceChildren();});
$('v1192Query').addEventListener('input',render);
$('v1192Clear').addEventListener('click',()=>{$('v1192Query').value='';render();$('v1192Query').focus();});
chips.addEventListener('click',e=>{const btn=e.target.closest('button[data-category]');if(!btn)return;currentCategory=btn.dataset.category;render();});
$('v1192Results').addEventListener('click',e=>{const btn=e.target.closest('button[data-kind]');if(btn)locate(btn.dataset.kind,btn.dataset.id);});
$('v1192Results').addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){const items=[...$('v1192Results').querySelectorAll('button')];const index=items.indexOf(document.activeElement);if(index>=0){e.preventDefault();items[Math.min(items.length-1,Math.max(0,index+(e.key==='ArrowDown'?1:-1)))]?.focus();}}});
$('v1192Query').addEventListener('keydown',e=>{if(e.key==='Enter'&&matches.length){e.preventDefault();locate(matches[0].kind,matches[0].id);}if(e.key==='ArrowDown'){$('v1192Results').querySelector('button')?.focus();e.preventDefault();}});
$('v1192Close').addEventListener('click',close);
overlay.addEventListener('click',e=>{if(e.target?.dataset?.close==='1')close();});
$('v1192AllMap').addEventListener('click',()=>{window.HWHomeV119?.hide?.();close();reset();});
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
   if(e.target?.closest?.('input,textarea,[contenteditable="true"]'))return;
   e.preventDefault();visible?close():open();
 }
 if(!visible)return;
 if(e.key==='Escape'){e.preventDefault();close();}
 if(e.key==='Tab'){
   const nodes=[...overlay.querySelectorAll('button:not([hidden]),input:not([hidden])')].filter(el=>el.getClientRects().length&&el.offsetParent!==null);
   if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
});
$('fit')?.addEventListener('click',()=>{highlight.replaceChildren();viewer.classList.remove('v1192-locating');document.body.classList.remove('v1192-locating');banner.hidden=true;});
window.addEventListener('hw-v90-change',e=>{if(visible&&e.detail?.kind==='data')render();});
window.HWQuickLocateV1192={open,close,locate,reset,search:q=>{open();$('v1192Query').value=q;render();},getResults:()=>matches.map(x=>({id:x.id,kind:x.kind,title:x.title})),getVersion:()=> '11.9.3'};
})();
