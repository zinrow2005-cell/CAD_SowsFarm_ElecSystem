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
