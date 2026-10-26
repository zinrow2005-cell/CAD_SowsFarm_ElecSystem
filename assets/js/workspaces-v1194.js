/* HUWEI V11.9.4 – distinct, task-oriented workspaces; no persistent data mutations.
   Existing CAD, work-order, health, and archive functions remain authoritative. */
(function(){'use strict';
const hw=window.HWEquipment, home=window.HWHomeV119;
if(!hw || !home)return;
const $=id=>document.getElementById(id);
const modules={
 equipment:{label:'設備管理中心',icon:'⚙',step:'02',lead:'先找設備，再進入 CAD 配置',description:'集中瀏覽已建立設備、分類與管線。需要調整位置、畫線或新增設備時，才進入 CAD 編輯圖面。',className:'equipment'},
 layers:{label:'圖層顯示中心',icon:'▦',step:'03',lead:'先決定要看什麼，再查看全場',description:'切換棟舍、區域、面積、尺寸；所有勾選同步作用於既有 CAD，不會修改原圖或設備資料。',className:'layers'},
 search:{label:'設備查找與維修中心',icon:'⌕',step:'04',lead:'查找設備、照片和維修紀錄',description:'快速定位 CAD 上的設備，也能進入完整紀錄查找設備照片、開關標記與維修／巡檢資料。',className:'search'},
 health:{label:'專案資料健檢中心',icon:'✓',step:'05',lead:'先看問題數量，再逐項核對',description:'檢查管線關聯、設備資料與待現場核對項目。這是資料完整性檢查，不代表設備已實際安全驗收。',className:'health'},
 backup:{label:'完整備份與還原中心',icon:'⇩',step:'06',lead:'把整套設備專案安全帶走',description:'備份包含專案、設備照片與關聯資料。匯出完成後，請確認檔案存在，並在另一台裝置測試還原。',className:'backup'}
};
const overlay=document.createElement('section');overlay.id='v1194Hub';overlay.hidden=true;overlay.setAttribute('aria-label','獨立功能工作區');
overlay.innerHTML=`<div class="v1194-frame">
 <header class="v1194-nav"><div class="v1194-brand"><span class="v1194-brand-icon">▦</span><span><b>HUWEI PIG FARM</b><small>設備配置管理平台 · ${(document.title.match(/\bV\d+\.\d+\.\d+\b/)||[])[0]||'V11.10.3'}</small></span></div><div class="v1194-nav-actions"><button type="button" data-hub-action="home">⌂ 返回首頁</button><button type="button" class="v1194-nav-map" data-hub-action="map">↗ CAD 全場圖</button></div></header>
 <nav class="v1194-tabs" aria-label="功能工作區切換">
  <button type="button" data-hub-to="equipment"><span class="v1194-tab-icon" aria-hidden="true">⚙</span><span class="v1194-tab-label">設備</span></button><button type="button" data-hub-to="layers"><span class="v1194-tab-icon" aria-hidden="true">▦</span><span class="v1194-tab-label">圖層</span></button><button type="button" data-hub-to="search"><span class="v1194-tab-icon" aria-hidden="true">⌕</span><span class="v1194-tab-label">搜尋維修</span></button><button type="button" data-hub-to="health"><span class="v1194-tab-icon" aria-hidden="true">✓</span><span class="v1194-tab-label">健檢</span></button><button type="button" data-hub-to="backup"><span class="v1194-tab-icon" aria-hidden="true">⇩</span><span class="v1194-tab-label">備份</span></button>
 </nav>
 <div class="v1194-body" id="v1194Body"></div>
 </div>`;
document.body.appendChild(overlay);
let current=null,previousFocus=null;
const button=(name,act,kind='sub')=>`<button type="button" class="v1194-action ${kind}" data-hub-action="${act}">${name}<span aria-hidden="true">↗</span></button>`;
const banner=(head,sub)=>`<div class="v1194-section-head"><h2>${head}</h2><p>${sub}</p></div>`;
function getData(){try{return hw.getData()||{};}catch(_){return {};}}
const arr=(value)=>Array.isArray(value)?value:[];
const num=v=>Number(v||0).toLocaleString('zh-TW');
const selectedGroup=d=>hw.getType(d.type)?.group||'equipment';
function header(mod){return `<header class="v1194-page-head"><div class="v1194-page-label">WORKSPACE ${mod.step} / 06</div><div class="v1194-page-title"><span class="v1194-head-icon">${mod.icon}</span><div><h1>${mod.label}</h1><strong>${mod.lead}</strong></div></div><p>${mod.description}</p></header>`;}
function stats(items){return `<div class="v1194-metrics">${items.map(x=>`<div class="v1194-metric"><small>${x[0]}</small><b>${x[1]}</b><span>${x[2]||''}</span></div>`).join('')}</div>`;}
function equipment(){
 const data=getData(),d=arr(data.devices),r=arr(data.routes),w=arr(data.maintenance);
 const photos=d.reduce((a,i)=>a+arr(i.photos).length,0);
 const groups=[['water','給排水','💧'],['electric','電力','⚡'],['ventilation','通風','◉'],['feed','飼料','▰'],['equipment','其他','⚙']];
 return `${stats([['已建設備',num(d.length),'台／點'],['已建管線',num(r.length),'條'],['設備照片',num(photos),'張'],['未完成維修',num(w.filter(x=>!x.archived&&x.status!=='done').length),'筆']])}
  <div class="v1194-columns"><section class="v1194-panel v1194-main-panel">${banner('依設備系統進入','查看本機實際建檔筆數；也可直接設定 CAD 上設備分類的顯示狀態。')}
  <div class="v1194-category-grid">${groups.map(g=>`<div class="v1194-category" data-group="${g[0]}"><span class="v1194-category-icon">${g[2]}</span><div><b>${g[1]}</b><small>${num(d.filter(x=>selectedGroup(x)===g[0]).length)} 台設備 · ${num(r.filter(x=>x.group===g[0]).length)} 條線</small></div><label class="v1194-switch"><input type="checkbox" data-hub-eq="${g[0]}" aria-label="顯示${g[1]}系統"><span></span></label></div>`).join('')}</div>
  </section><aside class="v1194-panel v1194-side-panel">${banner('現場工作捷徑','先進行查找；真正新增設備與畫管線則回到 CAD。')}
  <div class="v1194-action-stack">${button('開啟 CAD 設備編輯','equipment-map','main')}${button('新增設備（管理者）','add-device')}${button('設備與維修清單','records')}${button('快速搜尋 CAD 位置','locator')}</div>
  <p class="v1194-note">操作原則：設備資料、照片、管線都仍儲存在同一份本機專案。切換工作區不會複製或清除資料。</p></aside></div>`;
}
function layers(){
 const kinds=[['building','棟舍名稱','棟舍名稱識別','⌂'],['zone','區域名稱','走道、分區與功能位置','⌗'],['area','面積文字','面積數值標示','㎡'],['dimension','尺寸文字','牆線與尺寸標註','↔']];
 return `<div class="v1194-columns"><section class="v1194-panel v1194-main-panel">${banner('CAD 文字圖層','直接切換目前 CAD 的顯示設定；狀態會跟原本的圖層工具列同步。')}
   <div class="v1194-layer-grid">${kinds.map(k=>`<label class="v1194-layer-card"><span class="v1194-layer-icon">${k[3]}</span><span><b>${k[1]}</b><small>${k[2]}</small></span><input type="checkbox" data-hub-layer="${k[0]}" aria-label="切換${k[1]}"></label>`).join('')}</div>
   ${banner('一鍵顯示模式','快速套用常用顯示組合；切換後 CAD 畫面會同步變化。')}
   <div class="v1194-preset-row"><button type="button" data-hub-preset="clean">純圖面<small>隱藏文字</small></button><button type="button" data-hub-preset="simple">名稱＋面積<small>主要資訊</small></button><button type="button" data-hub-preset="full">完整標註<small>所有資訊</small></button></div>
  </section><aside class="v1194-panel v1194-side-panel v1194-layer-side"><div class="v1194-blueprint-preview" aria-hidden="true"><div class="v1194-plan-lines"><i></i><i></i><i></i><i></i><i></i><i></i></div><b>DISPLAY LAYERS</b><small>切換顯示，不改原始 CAD</small></div>
  ${banner('接著要做什麼？','直接帶入剛剛的圖層設定，在全場平面圖檢查結果。')}<div class="v1194-action-stack">${button('查看全場 CAD','layers-map','main')}${button('更多圖層細節設定','layers-drawer')}</div></aside></div>`;
}
function search(){const data=getData(),works=arr(data.maintenance);return `${stats([['可搜尋設備',num(arr(data.devices).length),'台／點'],['可搜尋管線',num(arr(data.routes).length),'條'],['維修／巡檢單',num(works.filter(w=>!w.archived).length),'筆']])}
  <div class="v1194-work-cards"><section class="v1194-work-card"><span class="v1194-work-icon">⌖</span><div class="v1194-work-tag">CAD LOCATOR</div><h2>快速找設備位置</h2><p>用名稱、編號或區域搜尋，點選結果後直接將 CAD 放大並標示位置。</p>${button('搜尋並定位 CAD','locator','main')}</section>
  <section class="v1194-work-card"><span class="v1194-work-icon">☷</span><div class="v1194-work-tag">FIELD RECORDS</div><h2>照片與維修紀錄</h2><p>查詢設備照片、開關標記、維修單與巡檢資訊，並可在管理者模式建立工作單。</p>${button('開啟設備／維修資料庫','records','main')}${button('現場巡檢與故障通報','inspection','main')}</section></div>`;}
function health(){
 const data=getData();let problems=[],bad=0,review=0;
 try{problems=arr(window.HWSystemHealthV115?.scanProject?.(data)?.problems);bad=problems.filter(p=>p.severity==='error').length;review=problems.filter(p=>p.severity==='review').length;}catch(_){}
 return `${stats([['資料異常',num(bad),'筆'],['待現場核對',num(review),'筆'],['問題總數',num(problems.length),'筆']])}
 <div class="v1194-columns"><section class="v1194-panel v1194-main-panel">${banner('待檢視項目','以下來自程式對本機關聯資料的檢查；不代表已完成現場設備驗收。')}
 ${problems.length?`<div class="v1194-issues" id="v1194IssueList"></div>`:'<div class="v1194-empty"><span>✓</span><b>目前未檢出關聯問題</b><p>請仍定期檢查照片、設備位置與現場管線連接。</p></div>'}
 </section><aside class="v1194-panel v1194-side-panel">${banner('資料驗證與處理','啟動原系統健檢，查看完整的異常清單與本機照片檢查。')}
 <div class="v1194-action-stack">${button('開啟完整資料健檢','health-detail','main')}${button('前往維修／巡檢紀錄','records')}</div><p class="v1194-note">若涉及供電、水壓、抽風、污水與結構安全，仍需在現場由合適人員驗證。</p></aside></div>`;
}
function backup(){const data=getData(),d=arr(data.devices),r=arr(data.routes),p=d.reduce((n,x)=>n+arr(x.photos).length,0),s=hw.getStorageState?.()||{};
 return `${stats([['設備',num(d.length),'台／點'],['管線',num(r.length),'條'],['照片紀錄',num(p),'張'],['本機儲存',s.dirty?'需檢查':'未顯示異常','狀態']])}
 <div class="v1194-columns"><section class="v1194-panel v1194-main-panel">${banner('完整專案備份流程','建議按下面的順序操作，確保更換手機、平板或電腦時資料能完整還原。')}
 <div class="v1194-steps"><div><i>01</i><span><b>檢查資料及照片</b><small>先確認照片主檔與相關設備有正常連結</small></span></div><div><i>02</i><span><b>免密碼完整備份 .hwpack</b><small>產生完整備份檔並核對照片及資料</small></span></div><div><i>03</i><span><b>儲存並測試還原</b><small>確認檔案存在，再到另一台裝置驗證內容</small></span></div></div>
 </section><aside class="v1194-panel v1194-side-panel">${banner('備份與還原工具','此處只是入口，尚未表示備份成功。')}
 <div class="v1194-action-stack">${button('立即建立完整備份','backup-export','main')}${button('從 .hwpack 還原','backup-import')}${button('CAD 圖面匯出（DXF／SVG／PNG／PDF）','cad-export')}</div><p class="v1194-note">重要：先保留舊裝置上的原始資料；只有新裝置完成還原驗證後，才可視為備份有效。</p></aside></div>`;}
function open(type){if(!(type in modules))return false;
 if(!current)previousFocus=document.activeElement;
 current=type;overlay.dataset.mode=type;overlay.hidden=false;
 $('side')?.classList.remove('open');window.HWMobileFieldV1191?.closeDrawer?.();
 document.body.classList.add('v1194-hub-open');
 const mod=modules[type],content={equipment,layers,search,health,backup}[type]();
 $('v1194Body').innerHTML=header(mod)+content;
 overlay.querySelectorAll('[data-hub-to]').forEach(b=>{const active=b.dataset.hubTo===type;b.setAttribute('aria-current',active?'page':'false');});
 if(type==='equipment'){for(const input of overlay.querySelectorAll('[data-hub-eq]')){input.checked=hw.getVisibility?.()[input.dataset.hubEq]!==false;}}
 if(type==='layers'){for(const input of overlay.querySelectorAll('[data-hub-layer]')){const orig=document.querySelector(`#v83BaseQuick input[data-quick="${input.dataset.hubLayer}"]`);input.checked=!!orig?.checked;}}
 if(type==='health'){
  const data=getData();try{const issues=arr(window.HWSystemHealthV115?.scanProject?.(data)?.problems),host=$('v1194IssueList');if(host)issues.slice(0,8).forEach(issue=>{const row=document.createElement('div');row.className='v1194-issue';const tag=document.createElement('span');tag.textContent=issue.severity==='error'?'資料異常':'待核對';tag.dataset.level=issue.severity;const body=document.createElement('p');body.textContent=issue.text||'未命名項目';row.append(tag,body);host.append(row);});}catch(_){}
 }
 overlay.scrollTop=0;overlay.querySelector('[data-hub-action="home"]')?.focus({preventScroll:true});return true;
}
function close(){overlay.hidden=true;document.body.classList.remove('v1194-hub-open');current=null;}
function showMap(workspace='base',drawer=false){close();home.hide();hw.setWorkspace(workspace);if(workspace==='base')$('fit')?.click(); if(drawer)window.HWMobileFieldV1191?.openDrawer?.(workspace);}
function launch(type){close();home.hide();
 if(type==='records')window.HWFarmOpsV114?.open?.();
 else if(type==='locator')window.HWQuickLocateV1192?.open?.();
 else if(type==='health-detail')window.HWSystemHealthV115?.open?.();
 else if(type==='backup-export'||type==='backup-import'){window.HWPortableUI?.open?.();if(type==='backup-import')window.HWPortableUI?.changeTab?.('import');}
}
function handleAction(action){
 if(action==='cad-export'){window.HWCADExportV111215?.open?.();return;}
 if(action==='inspection'){close();home.hide();window.HWInspectionV11108?.open?.();return;}
 if(action==='home'){close();home.show();return;}
 if(action==='map'){showMap('base');return;}
 if(action==='equipment-map'){showMap('equipment');return;}
 if(action==='layers-map'){showMap('base');return;}
 if(action==='layers-drawer'){showMap('base',true);return;}
 if(action==='add-device'){
   if(hw.getRole()!=='admin') {const t=$('v1194HubMessage')||document.createElement('div');t.id='v1194HubMessage';t.className='v1194-message';t.textContent='請先回 CAD 切換到「管理者編輯」，再從設備工具選取類型並新增。';overlay.querySelector('.v1194-action-stack')?.append(t);return;}
   showMap('equipment',true);const add=$('v95Place');if(add)add.click();return;
 }
 if(['locator','records','health-detail','backup-export','backup-import'].includes(action))launch(action);
}
overlay.addEventListener('click',e=>{
 const tab=e.target.closest('button[data-hub-to]');if(tab){open(tab.dataset.hubTo);return;}
 const btn=e.target.closest('button[data-hub-action]');if(btn){handleAction(btn.dataset.hubAction);return;}
 const preset=e.target.closest('button[data-hub-preset]');if(preset){document.querySelector(`.mode-btn[data-mode="${preset.dataset.hubPreset}"]`)?.click();open('layers');return;}
});
overlay.addEventListener('change',e=>{
 const el=e.target;
 if(el.matches('input[data-hub-layer]')){
   const old=document.querySelector(`#v83BaseQuick input[data-quick="${el.dataset.hubLayer}"]`);
   if(old&&old.checked!==el.checked)old.click();
   // Let existing draw/selector synchronization complete, then reflect authoritative value.
   el.checked=!!old?.checked;
 }
 if(el.matches('input[data-hub-eq]')){
  const control=document.querySelector(`#v83EquipPanel input[data-eq-toggle="${el.dataset.hubEq}"]`);
  if(control&&control.checked!==el.checked)control.click();
  else if(!control)hw.setVisibility?.(el.dataset.hubEq,el.checked);
  el.checked=hw.getVisibility?.()[el.dataset.hubEq]!==false;
 }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){close();home.show();}});
window.HWWorkspaceHubV1194={open,close,getCurrent:()=>current};
})();
