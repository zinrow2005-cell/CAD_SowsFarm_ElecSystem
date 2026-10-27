/* HUWEI FARM V11.9.4: zero-mutation local overview + verified navigation to existing modules. */
(function(){ 'use strict';
const $=id=>document.getElementById(id);
// Read the version from the same page title used by the CAD workspace.
const APP_VERSION='V'+(document.querySelector('meta[name="app-version"]')?.content||'11.12.17');
const hw=window.HWEquipment;
if(!hw || !document.querySelector('.viewer')) return;
const root=document.createElement('section');
root.id='v119Home'; root.setAttribute('aria-label','虎尾豬場首頁儀表板');
root.innerHTML=`<div class="v119-shell">
<header class="v119-header">
  <div class="v119-brand"><img src="./icons/icon-192.png" width="57" height="57" alt="虎尾豬場圖示"><div><div class="v119-kicker">HUWEI PIG FARM · ${APP_VERSION}</div><div class="v119-brand-title">虎尾豬場設備管理</div></div></div>
  <div class="v119-meta"><span id="v119Network" class="v119-pill"><i class="v119-indicator"></i><span>本機作業</span></span><span class="v119-pill">資料來源：這台裝置</span></div>
</header>
<section class="v119-hero" aria-label="前往全場 CAD 圖面">
  <div><div class="v119-eyebrow">FARM OPERATIONS · CAD WORKSPACE</div>
    <h2>全場配置，<br>一眼掌握。</h2>
    <p>用一張 CAD 圖管理現場設備、水電管線與維修紀錄。從這裡快速進入工作台，不必在層層選單中尋找功能。</p>
    <div class="v119-hero-buttons"><button class="v119-primary" type="button" data-home-action="cad">開啟全場 CAD ↗</button><button class="v119-secondary" type="button" data-home-action="search">搜尋設備</button></div>
  </div>
  <div class="v119-blueprint" aria-hidden="true">
    <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" fill="none">
      <rect x="10" y="9" width="280" height="181" rx="10" stroke="#7fe8d5" stroke-opacity=".5" stroke-width="1.5"/>
      <path d="M30 61H272M30 118H272M101 28V176M180 28V176" stroke="#5c9da8" stroke-width="1.8" stroke-dasharray="5 4" opacity=".6"/>
      <path d="M30 25H87V52H30zM111 25H168V52H111zM191 25H270V52H191zM31 73H89V107H31zM111 73H168V107H111zM191 73H270V107H191z" stroke="#9bc1ce" stroke-width="1.4"/>
      <path d="M30 130H88V175H30zM111 130H168V175H111zM191 130H270V175H191z" stroke="#9bc1ce" stroke-width="1.4"/>
      <path d="M20 63H85V120H163V63H224" stroke="#8af4d7" stroke-width="3" stroke-linecap="round"/>
      <path d="M224 63V145H269" stroke="#ffe2a2" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="85" cy="120" r="6.5" fill="#8af4d7" stroke="#0b3044" stroke-width="3"/>
      <circle cx="163" cy="63" r="6.5" fill="#8af4d7" stroke="#0b3044" stroke-width="3"/>
      <circle cx="224" cy="145" r="6.5" fill="#ffe2a2" stroke="#0b3044" stroke-width="3"/>
      <circle cx="224" cy="63" r="5" fill="#9cdbef"/>
    </svg><div class="v119-blueprint-caption"><span>CAD · SYSTEM MAP</span><span>● 設備節點示意</span></div>
  </div>
</section>
<div class="v119-heading"><h3>本機資料概況</h3><small>非即時設備監控 · 開啟首頁時更新</small></div>
<section class="v119-stats" aria-label="本機設備數據">
 <div class="v119-stat"><small>◈ 已建檔設備</small><div class="v119-value"><span id="v119Devices">—</span><span class="v119-unit">台／點</span></div></div>
 <div class="v119-stat"><small>⌁ 已建檔管線</small><div class="v119-value"><span id="v119Routes">—</span><span class="v119-unit">條</span></div></div>
 <div class="v119-stat"><small>▣ 設備照片紀錄</small><div class="v119-value"><span id="v119Photos">—</span><span class="v119-unit">張</span></div></div>
 <div class="v119-stat"><small>◷ 待處理維修／巡檢</small><div class="v119-value"><span id="v119Works">—</span><span class="v119-unit">筆</span></div></div>
</section>
<div class="v119-heading"><h3>快速進入</h3><small>一鍵開啟既有功能</small></div>
<section class="v119-actions" aria-label="功能快速入口">
 <button class="v119-card" data-home-action="cad" type="button"><span class="v119-card-icon">▦</span><span class="v119-card-copy"><b>CAD 全場圖面</b><small>縮放、移動、查看原始棟舍配置</small></span><span class="v119-card-arrow">↗</span></button>
 <button class="v119-card" data-home-action="equipment" data-tone="blue" type="button"><span class="v119-card-icon">⚙</span><span class="v119-card-copy"><b>設備配置工作台</b><small>設備點位、水電、通風與飼料管線</small></span><span class="v119-card-arrow">↗</span></button>
 <button class="v119-card" data-home-action="layers" type="button"><span class="v119-card-icon">◫</span><span class="v119-card-copy"><b>圖層與文字顯示</b><small>棟舍、面積、尺寸自由勾選</small></span><span class="v119-card-arrow">↗</span></button>
 <button class="v119-card" data-home-action="search" data-tone="blue" type="button"><span class="v119-card-icon">⌕</span><span class="v119-card-copy"><b>設備搜尋與維修</b><small>依名稱、位置、照片標記快速查詢</small></span><span class="v119-card-arrow">↗</span></button>
 <button class="v119-card" data-home-action="inspection" data-tone="gold" type="button"><span class="v119-card-icon">☑</span><span class="v119-card-copy"><b>現場巡檢與維修</b><small>逐台檢查、同排巡檢、異常報修與紀錄</small></span><span class="v119-card-arrow">↗</span></button>
 <button class="v119-card" data-home-action="health" data-tone="gold" type="button"><span class="v119-card-icon">✓</span><span class="v119-card-copy"><b>資料健檢</b><small>檢查缺失關聯與需要核對的紀錄</small></span><span class="v119-card-arrow">↗</span></button>
 <button class="v119-card" data-home-action="backup" data-tone="purple" type="button"><span class="v119-card-icon">⇩</span><span class="v119-card-copy"><b>完整專案備份</b><small>免密碼備份、跨裝置匯入 .hwpack</small></span><span class="v119-card-arrow">↗</span></button>
</section>
<p class="v119-footer" id="v119Notice" role="status">資料統計僅包含本機已儲存的設備、管線、照片紀錄及未完成的維修／巡檢單。尚未建檔時顯示 0，不代表豬場沒有設備。完整備份需由使用者手動執行。</p>
</div>
<nav class="v119-mobile-nav" aria-label="首頁捷徑"><button type="button" aria-current="page" data-home-action="home"><span>⌂</span>首頁</button><button type="button" data-home-action="cad"><span>▦</span>CAD</button><button type="button" data-home-action="search"><span>⌕</span>搜尋</button><button type="button" data-home-action="backup"><span>⇩</span>備份</button></nav>`;
document.body.appendChild(root);
let previouslyFocused=null;
function refresh(){
 const status=$('v119Network');const online=navigator.onLine !== false;
 status.classList.toggle('is-offline',!online);
 status.querySelector('span').textContent=online?'網路可用｜本機資料':'離線模式｜本機資料';
 try{
  const d=hw.getData();
  const devices=Array.isArray(d.devices)?d.devices:[];
  const routes=Array.isArray(d.routes)?d.routes:[];
  const maintenance=Array.isArray(d.maintenance)?d.maintenance:[];
  $('v119Devices').textContent=devices.length.toLocaleString('zh-TW');
  $('v119Routes').textContent=routes.length.toLocaleString('zh-TW');
  $('v119Photos').textContent=devices.reduce((n,x)=>n+(Array.isArray(x.photos)?x.photos.length:0),0).toLocaleString('zh-TW');
  $('v119Works').textContent=maintenance.filter(x=>!x.archived && x.status!=='done').length.toLocaleString('zh-TW');
  $('v119Notice').textContent='僅顯示這台裝置目前已建檔的資料；非現場即時監控。設備與管線的實際數量可能尚未全部錄入。完整備份需另行執行。';
  const storage=hw.getStorageState?.();
  if(storage?.dirty) $('v119Notice').textContent='⚠ 本機資料自動儲存可能失敗，請進入設備管理檢查後立即備份。';
 }catch(e){
  ['v119Devices','v119Routes','v119Photos','v119Works'].forEach(id=>{$(id).textContent='—'});
  $('v119Notice').textContent='目前無法讀取本機設備統計，請進入 CAD 工作台核對資料。';
 }
}
function show(){
 $('side')?.classList.remove('open');window.HWMobileFieldV1191?.closeDrawer?.();
 previouslyFocused=document.activeElement;
 refresh();root.hidden=false;
 document.body.classList.add('v119-home-open');
 root.scrollTop=0;
 const first=root.querySelector('[data-home-action="cad"]');if(first)first.focus({preventScroll:true});
}
function hide(){root.hidden=true;document.body.classList.remove('v119-home-open');previouslyFocused?.focus?.({preventScroll:true});}
function openDrawer(){const sidebar=$('side');if(sidebar && matchMedia('(max-width:760px), (max-width:1024px) and (pointer:coarse)').matches){sidebar.classList.add('open');}}
function run(action){
 if(action==='home'){show();return;}
 if(action==='inspection'){hide();window.HWInspectionV11108?.open?.();return;}
 if(['equipment','layers','search','health','backup'].includes(action) && window.HWWorkspaceHubV1194?.open){hide();window.HWWorkspaceHubV1194.open(action);return;}
 hide();
 $('side')?.classList.remove('open');
 if(action==='cad'){hw.setWorkspace('base');$('fit')?.click();return;}
 if(action==='equipment'){hw.setWorkspace('equipment');openDrawer();return;}
 if(action==='layers'){hw.setWorkspace('base');openDrawer();return;}
 if(action==='search'){if(window.HWFarmOpsV114?.open){window.HWFarmOpsV114.open();}else{hw.setWorkspace('equipment');openDrawer();}return;}
 if(action==='health'){if(window.HWSystemHealthV115?.open){window.HWSystemHealthV115.open();}else{hw.setWorkspace('equipment');openDrawer();}return;}
 if(action==='backup'){if(window.HWPortableUI?.open){window.HWPortableUI.open();}else{hw.setWorkspace('equipment');openDrawer();}return;}
}
root.addEventListener('click',function(e){const btn=e.target.closest('[data-home-action]');if(btn)run(btn.dataset.homeAction);});
window.addEventListener('online',refresh);window.addEventListener('offline',refresh);
// Return to the dashboard from the existing CAD workbench without replacing its toolbar or controls.
const mobilebar=document.querySelector('.mobilebar');
if(mobilebar){const btn=document.createElement('button');btn.type='button';btn.id='v119MobileHome';btn.className='v119-home-link';btn.textContent='⌂ 首頁';btn.title='回到首頁儀表板';btn.addEventListener('click',show);mobilebar.insertBefore(btn,mobilebar.firstChild);}
const topline=document.querySelector('.side .topline');
if(topline){const btn=document.createElement('button');btn.type='button';btn.id='v119DesktopHome';btn.className='v119-home-link';btn.textContent='⌂ 首頁';btn.title='回到首頁儀表板';btn.addEventListener('click',show);topline.appendChild(btn);}
window.HWHomeV119={show,hide,refresh,run};
show();
})();
