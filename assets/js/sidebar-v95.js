/* 虎尾場 V9.5 — sidebar information architecture and water/electric-only route tools.
 * Presentation changes only. Keeps original CAD, saved equipment and legacy ventilation lines.
 */
(function(){'use strict';
const api=window.HWEquipment;
const $=id=>document.getElementById(id);
const sheet=document.querySelector('#v83EquipPanel .v84-workbench');
const base=$('v83BasePanel');
if(!api||!sheet||!base||!$('v84Admin')||!$('v84AdminLower'))return;
function el(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
function group(title,description,id){
 const d=el('details','v95-group');d.id=id;
 const s=el('summary','v95-group-summary');
 s.append(el('span','v95-group-title',title),el('small','v95-group-sub',description));
 d.append(s,el('div','v95-group-body'));return d;
}
// Organize primary map labels separately from occasional CAD settings.
const baseExtras=group('底圖細部設定','原始圖層 · 文字大小 · 顯示設定備份','v95BaseExtras');
const baseChildren=[...base.children],geomStart=baseChildren.findIndex(n=>n.classList?.contains('section')&&n.textContent.includes('底圖物件圖層'));
if(geomStart>=0){for(const n of baseChildren.slice(geomStart))baseExtras.lastElementChild.appendChild(n);base.appendChild(baseExtras);}
const baseText=base.querySelector('.tip');if(baseText){baseText.textContent='此處只調整 CAD 文字和圖層，不會刪除豬舍牆線或設備。';baseText.classList.add('v95-base-note');}
const baseHeader=base.querySelector('.v83-panel-head small');if(baseHeader)baseHeader.textContent='勾選名稱、面積、尺寸；其他設定按需展開。';

// Keep the V8.9 quick picker as the single main icon picker; do not repeat a long palette on screen.
const intro=sheet.querySelector('.v84-intro');
if(intro){const p=intro.querySelector('p'),h=intro.querySelector('h2');if(p)p.textContent='先選工作：放設備、畫水管或電線；點圖面物件就能查看內容。';if(h)h.textContent='設備配置';}
const start=el('section','v95-start');start.id='v95Start';
start.innerHTML=`<div class="v95-head"><span class="v95-eyebrow">快速工作台</span><strong>你現在要做什麼？</strong><small id="v95Instruction">先選工具，再到右邊 CAD 圖面操作</small></div>
 <div class="v95-start-grid">
   <button type="button" id="v95Place" class="v95-start-btn v95-primary" data-v95-admin><span aria-hidden="true">＋</span><b>放設備</b></button>
   <button type="button" id="v95Water" class="v95-start-btn" data-v95-admin><span aria-hidden="true">◉</span><b>畫水管</b></button>
   <button type="button" id="v95Electric" class="v95-start-btn" data-v95-admin><span aria-hidden="true">ϟ</span><b>畫電線</b></button>
   <button type="button" id="v95Feed" class="v95-start-btn" data-v95-admin><span aria-hidden="true">〰</span><b>畫飼料管</b></button>
 </div>
 <button type="button" id="v95Find" class="v95-search-link">⌕ 找設備與料線</button>
 <button type="button" id="v95Audit" class="v95-audit-link">↗ 查看全場迴路盤點與上下游追蹤</button>
 <div class="v95-status" id="v95ActionStatus" role="status">點選工具開始，或直接在圖上選擇已放置設備。</div>`;
intro?.after(start);

// Reparent existing wired controls: listeners and saved state remain untouched.
const admin=$('v84Admin'),adminLower=$('v84AdminLower'),layers=$('v84Layers'),items=$('v84Items');
const fullLibrary=group('完整圖標庫','自訂圖標 · 收藏 · 連續放置','v95Library');
for(const child of [...admin.children]){if(child.id==='v87Placement')continue; if(child.classList?.contains('v84-route-tile'))continue;fullLibrary.lastElementChild.appendChild(child);}
admin.append(fullLibrary);
const advanced=group('進階工具與資料管理','精準排列 · 設備模板 · 備份 · 雲端','v95Advanced');
// Preserve role switching: old workbench.js independently hides #v84Admin/#v84AdminLower.
advanced.lastElementChild.append(admin);
const precision=$('v87Placement');if(precision){precision.open=false;precision.removeAttribute('open');adminLower.prepend(precision);}
const lineOptions=group('管線進階設定','水平／垂直轉折 · 連線控制','v95LineOptions');
const originalRoutes=sheet.querySelector('.v84-route-tile');if(originalRoutes){originalRoutes.querySelectorAll('[data-start-route="ventilation"]').forEach(n=>n.remove());
  const title=originalRoutes.querySelector('.v84-section-label strong');if(title)title.textContent='水管／電線／飼料管';
  lineOptions.lastElementChild.append(originalRoutes);adminLower.prepend(lineOptions);
}
advanced.lastElementChild.append(adminLower);
const auditLaunch=sheet.querySelector('.v91-launch');if(auditLaunch){auditLaunch.hidden=true;advanced.lastElementChild.append(auditLaunch);}
const storage=sheet.querySelector('#v84StorageNote');if(storage)advanced.lastElementChild.append(storage);
const oldCloud=$('v93CloudPanel');if(oldCloud){oldCloud.open=false; oldCloud.removeAttribute('open');oldCloud.querySelector('summary').textContent='☁ 雲端工作區（選用）';sheet.after(oldCloud);}
// Consistent minimal sidebar ordering: actions / display / find / advanced.
start.after(layers);
layers.after(items);
items.after(advanced);
// Move lightweight advanced options under an admin-only panel, retain underlying workbench role logic.

// Remove obsolete 3rd line type from any advanced dropdown too, but never delete saved ventilation devices/lines.
const routeSelect=$('eqRouteType');routeSelect?.querySelector('option[value="ventilation"]')?.remove();if(routeSelect?.value==='ventilation'||routeSelect?.value==='equipment')routeSelect.value='water';
routeSelect?.querySelector('option[value="equipment"]')?.remove();
const oldRouteHeading=[...document.querySelectorAll('#eqAdmin .v82-group h3')].find(n=>n.textContent.includes('風管'));
if(oldRouteHeading)oldRouteHeading.textContent='② 繪製水管／電線';

function openItemList(){api.setWorkspace('equipment');items.open=true;const input=$('eqSearch');items.scrollIntoView({block:'nearest'});input?.focus({preventScroll:true});}
function closeMobileSide(){if(window.innerWidth<=760)$('side')?.classList.remove('open');}
function startLine(group){if(api.getRole()!=='admin')return;api.setWorkspace('equipment');if(routeSelect)routeSelect.value=group;api.begin(group,'route');closeMobileSide();}
$('v95Place').addEventListener('click',()=>{api.setWorkspace('equipment');const dock=$('v89QuickLaunch')?.querySelector('.v89-primary');if(dock)dock.click();else $('v84CreateIcon')?.click();closeMobileSide();});
$('v95Water').addEventListener('click',()=>startLine('water'));
$('v95Electric').addEventListener('click',()=>startLine('electric'));
$('v95Feed').addEventListener('click',()=>startLine('feed'));
$('v95Find').addEventListener('click',openItemList);
$('v95Audit').addEventListener('click',()=>{$('v91OpenAudit')?.click();closeMobileSide();});
function sync(){const role=api.getRole(),edit=role==='admin',act=api.getAction();
 for(const b of start.querySelectorAll('[data-v95-admin]'))b.hidden=!edit;
 $('v95Audit').hidden=!$('v91OpenAudit');
 const hint=$('v95Instruction');if(hint)hint.textContent=edit?'放設備 → 點圖定位 → 點物件修改內容':'點圖面查看設備，或搜尋設備與迴路';
 const status=$('v95ActionStatus');if(status){status.textContent=act.action==='place'?'放置中：在圖上點位置；可按 Esc 取消':act.action==='route'?'畫'+(act.actionType==='electric'?'電線':act.actionType==='feed'?'飼料管':'水管')+'中：依序點路徑，完成後按「完成線路」':'點圖上的設備，即可查看照片、規格與迴路。';}
 for(const [id,group] of [['v95Water','water'],['v95Electric','electric'],['v95Feed','feed']])$(''+id).classList.toggle('is-active',act.action==='route'&&act.actionType===group);
 $('v95Place').classList.toggle('is-active',act.action==='place');
}
window.addEventListener('hw-v89-ui-sync',sync);
// Admin activation defaults to the relevant workspace (still reversible with the base tab).
document.querySelector('[data-role="admin"]')?.addEventListener('click',()=>{if(api.getWorkspace()!=='equipment')api.setWorkspace('equipment');sync();});
// Clicking a different workspace should close route placement to prevent accidental CAD clicks.
$('v83TabBase')?.addEventListener('click',()=>{if(api.getAction().action==='route')api.cancelAction();sync();});
sync();
})();


/* V11.12.0 — Left navigation: group existing wired controls, without recreating
 * buttons or changing their data contracts. Runs after the original modules have
 * registered their click handlers. Every node is moved, not cloned.
 */
(function(){'use strict';
  function compactNavigation(){
    const panel=document.getElementById('v83EquipPanel');
    const start=document.getElementById('v95Start');
    if(!panel||!start||document.getElementById('hw120Groups'))return;
    const container=document.createElement('div');container.id='hw120Groups';container.className='hw120-groups';
    const configs=[
      {id:'hw120Find',title:'圖層・搜尋・欄格',desc:'圖面顯示、設備與維修查詢、欄位定位',open:true,
        items:[['v84Layers','圖層與設備顯示'],['v84Items','設備／線路快速搜尋'],['v114Launch','設備檔案與維修紀錄'],['v104EquipOpen','欄位容量與編號'],['v109EquipOpen','欄格定位與服務範圍']]},
      {id:'hw120Systems',title:'全場系統・水電關聯',desc:'系統架構、供水、配電、通風與送料',
        items:[['v116Launch','棟舍子系統架構'],['hw110Side','水電與設備關聯追蹤'],['v110Launch','三水源與供水管線'],['v113Launch','配電箱與控制迴路'],['v112VentLaunch','通風設備與水簾'],['v111FeedNetworkLaunch','飼料設備與送料路徑']]},
      {id:'hw120Manage',title:'巡檢・備份・進階設定',desc:'巡檢報修、專案備份、模板與選用雲端',
        items:[['hw108Launch','現場巡檢與維修'],['v117Launch','完整專案備份／還原'],['v95Advanced','設備模板與進階工具'],['v93CloudPanel','雲端工作區（選用）']]}
    ];
    const groups=[];
    for(const cfg of configs){
      const fold=document.createElement('details');fold.className='hw120-group';fold.id=cfg.id;fold.open=!!cfg.open;
      const summary=document.createElement('summary');summary.className='hw120-summary';summary.innerHTML='<span class="hw120-sum-title"></span><small></small><span class="hw120-chevron" aria-hidden="true">⌄</span>';
      summary.querySelector('.hw120-sum-title').textContent=cfg.title;
      summary.querySelector('small').textContent=cfg.desc;
      const body=document.createElement('div');body.className='hw120-body';
      for(const [id,label] of cfg.items){
        const item=document.getElementById(id);if(!item)continue;
        if(item.tagName==='BUTTON'){
          item.classList.add('hw120-row');
          if(id==='v114Launch')item.textContent='⌕ '+label;
          if(id==='v109EquipOpen')item.textContent='⌕ '+label;
          if(id==='hw110Side')item.textContent='⌁ '+label;
          if(id==='v113Launch')item.textContent='⚡ '+label;
          if(id==='v112VentLaunch')item.textContent='❂ '+label;
          if(id==='v111FeedNetworkLaunch')item.textContent='▰ '+label;
          if(id==='v104EquipOpen')item.textContent='▦ '+label;
        } else if(id==='v84Layers'){
          item.querySelector('summary')?.replaceChildren(document.createTextNode('圖層與設備名稱'));
        } else if(id==='v84Items'){
          const summary=item.querySelector('summary');if(summary){
            const badge=summary.querySelector('#v84ListCount');
            summary.replaceChildren(document.createTextNode('設備／線路快速搜尋 '));if(badge)summary.appendChild(badge);
          }
        } else if(id==='v95Advanced'){
          const title=item.querySelector('.v95-group-title'),sub=item.querySelector('.v95-group-sub');
          if(title)title.textContent='設備模板與進階工具';
          if(sub)sub.textContent='精準排列 · 範本 · 舊版相容工具';
        }
        body.appendChild(item);
      }
      fold.append(summary,body);container.appendChild(fold);groups.push(fold);
      fold.addEventListener('toggle',()=>{if(fold.open)for(const other of groups){if(other!==fold)other.open=false;}});
    }
    start.after(container);
    function reveal(groupId){const fold=document.getElementById(groupId);if(fold){fold.open=true;}}
    document.getElementById('v95Find')?.addEventListener('click',()=>reveal('hw120Find'),true);
    document.getElementById('v84ToolLayers')?.addEventListener('click',()=>reveal('hw120Find'),true);
    // Disclose nested ancestor whenever a programmatic shortcut focuses it.
    const item=document.getElementById('v84Items');const layer=document.getElementById('v84Layers');
    for(const node of [item,layer])node?.addEventListener('toggle',()=>{if(node.open)reveal('hw120Find');});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',compactNavigation,{once:true});
  else compactNavigation();
})();


/* V11.12.4 — Progressive disclosure, preserve every original wired control.
 * Primary actions are always visible; rare specialist actions remain one click away.
 */
(function(){'use strict';
 function boot(){
  const root=document.getElementById('hw120Groups');
  if(!root||document.getElementById('hw122ZoneExtras'))return;
  function extra(id,label,description,parent,ids){
   const d=document.createElement('details');d.className='hw122-extra';d.id=id;
   const sum=document.createElement('summary');sum.textContent=label;
   if(description)sum.title=description;
   const body=document.createElement('div');body.className='hw122-extra-body';
   for(const iid of ids){const item=document.getElementById(iid);if(item)body.appendChild(item);}
   d.append(sum,body);parent?.appendChild(d);
   return d;
  }
  const find=document.querySelector('#hw120Find>.hw120-body');
  const systems=document.querySelector('#hw120Systems>.hw120-body');
  const manage=document.querySelector('#hw120Manage>.hw120-body');
  extra('hw122ZoneExtras','欄格容量與服務範圍','較少使用的欄格資料設定',find,['v104EquipOpen','v109EquipOpen']);
  extra('hw122SystemExtras','更多專業查詢','供水、配電、通風、送料專用工具',systems,['v110Launch','v113Launch','v112VentLaunch','v111FeedNetworkLaunch']);
  extra('hw122ManageExtras','進階工具與選用雲端','設備模板、舊版工具和選用同步',manage,['v95Advanced','v93CloudPanel']);
  // Keep basic display modes visible; move infrequent building/water setup behind one disclosure.
  const base=document.getElementById('v83BasePanel');
  if(base&&!document.getElementById('hw122BaseTools')){
   const nodes=[base.querySelector('.v104-shortcut'),document.getElementById('v109Launch'),document.getElementById('v110BaseLaunch')].filter(Boolean);
   if(nodes.length){
    const fold=document.createElement('details');fold.id='hw122BaseTools';fold.className='hw122-extra';
    const summary=document.createElement('summary');summary.textContent='棟舍、欄格與三水源進階工具';
    const body=document.createElement('div');body.className='hw122-extra-body';
    for(const node of nodes)body.appendChild(node);
    fold.append(summary,body);
    base.querySelector('#v95BaseExtras')?.before(fold);
   }
  }
  // Preset display modes are the frequent action. Keep granular annotation
  // checkboxes available, but not permanently occupying mobile screen space.
  if(base&&!document.getElementById('hw122BaseLabels')){
   const children=[...base.children];
   const idx=children.findIndex(n=>n.classList?.contains('section')&&n.textContent.includes('文字與標註顯示'));
   if(idx>=0){
    const nodes=children.slice(idx,idx+4);
    if(nodes[1]?.id==='annotations'){
     const fold=document.createElement('details');fold.id='hw122BaseLabels';fold.className='hw122-extra';
     const summary=document.createElement('summary');summary.textContent='自訂文字與標註顯示';
     const content=document.createElement('div');content.className='hw122-extra-body';
     for(const n of nodes)content.appendChild(n);
     fold.append(summary,content);
     base.querySelector('#hw122BaseTools')?.before(fold);
    }
   }
  }
  // Continue to show shortcuts correctly even when destination moved into an accordion.
  function revealItem(node){
   if(!node)return;
   for(let x=node.parentElement;x;x=x.parentElement)if(x.tagName==='DETAILS')x.open=true;
  }
  document.getElementById('v95Find')?.addEventListener('click',()=>revealItem(document.getElementById('v84Items')),true);
  document.getElementById('v84ToolLayers')?.addEventListener('click',()=>revealItem(document.getElementById('v84Layers')),true);
  const status=document.getElementById('v95ActionStatus');
  const start=document.getElementById('v95Start');
  const sync=()=>{
   const action=window.HWEquipment?.getAction?.();
   const busy=action?.action==='place'||action?.action==='route';
   start?.classList.toggle('hw122-busy',!!busy);
   if(status)status.setAttribute('aria-live','polite');
  };
  window.addEventListener('hw-v89-ui-sync',sync);
  sync();
  // Keep existing controls and their attached click listeners. Hide redundant
  // labels visually, never remove old event listeners/data.
  const kicker=document.querySelector('#v95Start .v95-head strong');
  if(kicker)kicker.textContent='常用操作';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
