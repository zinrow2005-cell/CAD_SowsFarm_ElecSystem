/* V11.12.18 Files/Google Drive provider import and native share support. */
(function(){'use strict';
const hw=window.HWEquipment,media=window.HWPhotoStore,core=window.HWPortableCore;
if(!hw||!media||!core)return;
const $=id=>document.getElementById(id);
const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;};
const ui=el('div','v117-overlay');ui.id='v117Overlay';ui.hidden=true;
ui.innerHTML=`<section class="v117-panel" role="dialog" aria-modal="true" aria-labelledby="v117Title" tabindex="-1">
 <header class="v117-head"><div><small>HUWEI FARM · PORTABLE PROJECT</small><h2 id="v117Title">完整備份與跨裝置還原驗證</h2><p>設備、全部照片、配電開關標記、管線、欄格及母子系統一起帶走；不需要雲端帳號。</p></div><button id="v117Close" type="button" aria-label="關閉">✕</button></header>
 <div class="v117-mode" role="tablist" aria-label="備份操作"><button type="button" id="v117ModeExport" class="active" role="tab" aria-selected="true" aria-controls="v117ExportArea">↓ 匯出完整專案</button><button type="button" id="v117ModeImport" role="tab" aria-selected="false" aria-controls="v117ImportArea">↑ 換裝置匯入</button></div>
 <div id="v126Progress" class="v126-progress" role="status" aria-live="polite" aria-atomic="true">匯出：先按下方「製作備份」，完成驗證後再按「下載」；匯入：選檔預覽後才可還原。</div>
 <div id="v117ExportArea">
 <div class="v117-summary" id="v117Current">正在讀取本機專案…</div><div class="v11111-coverage" id="v11111LocalCoverage">正在核對設備資料類別…</div>
 <button type="button" id="v118Preflight">✓ 備份前檢查照片／開關標記／資料關聯</button><div id="v118PreflightResult" class="v118-preflight" role="status">尚未執行備份前檢查。</div>
 <p class="v117-help">新版免密碼備份會保留設備資料與照片原圖（若有），並逐張驗證完整性；檔案<strong>沒有加密</strong>，取得檔案的人可查看照片和設備資訊，請自行妥善保存，不要上傳公開 GitHub。</p>
 <div class="v117-actions"><button type="button" id="v117Export" class="v117-primary">① 開始製作完整備份</button><button type="button" id="v117Save" class="v117-primary" hidden>② 儲存備份到指定資料夾</button><a id="v11119Download" class="v11119-download" href="#" download hidden>② 下載已驗證的 .hwpack</a><button type="button" id="v111218Share" class="v117-primary" hidden>② 用系統分享備份（可選 Google Drive）</button></div><p class="v11119-notice"><b>正式備份是單一 .hwpack 檔，不是 ZIP。</b>建立完成後請按「下載」保存；可用 AirDrop、LINE 或「檔案」App 傳給手機，不必壓縮，也不要更改副檔名。</p><p class="v11111-verified" id="v11111ExportVerified" hidden role="status"></p>
 </div>
 <div id="v117ImportArea" hidden>
 <p class="v117-help">選擇電腦傳來的 <b>.hwpack</b>，或內含 .hwpack 的 <b>.zip</b>。系統自動辨識內容，不需解壓縮；先預覽、再確認還原，不覆蓋原資料。舊版加密 .hwpack 仍需原密碼。</p>
 <label class="v111218-pick">📂 從「檔案」App 選擇備份（包含 Google 雲端硬碟）
   <input type="file" id="v117File" aria-describedby="v111218DriveInstructions"></label>
 <p id="v111218DriveInstructions" class="v111218-tip">iPhone／iPad：點選檔案後，按「瀏覽」→「位置」→「Google Drive」。可選擇本機、iCloud 或已啟用的雲端硬碟；為避免 iOS 將 .hwpack 隱藏，不限制副檔名，仍會在載入後驗證檔案內容。</p>
 <details class="v111218-guide"><summary>看不到 Google Drive？查看啟用方式</summary><ol><li>先安裝並登入 Google Drive App。</li><li>打開 iPhone／iPad 的「檔案」App →「瀏覽」。</li><li>點「⋯」→「編輯」，開啟 Google Drive（較舊 iOS 可從「位置」→「編輯」開啟）。</li><li>回到本系統重新按「選擇檔案」→「瀏覽」→「Google Drive」，點選私人備份的 .hwpack 檔。</li></ol><p>Google Drive 是否出現，由 iOS 檔案提供者決定；本系統不會要求雲端帳密或直接讀取整個雲端硬碟。雲端檔案首次可能需要網路下載。</p></details>
 <div id="v11121Detected" class="v117-summary" role="status">選擇檔案後將依據內容辨識格式，不看副檔名猜測。</div>
 <label id="v11121OldPassword" hidden>舊版加密 .hwpack 的原密碼（僅舊檔使用）<input type="password" id="v117ImportPass" autocomplete="off" maxlength="200" placeholder="僅限舊加密備份"></label>
 <button type="button" id="v11121LegacyImport" class="v117-primary" hidden>使用舊版 .hwb 匯入工具（需原密碼）</button>
 <button type="button" id="v117Inspect" class="v117-primary">檢查備份並預覽（不覆蓋）</button>
 <div id="v117Review" hidden><div class="v117-summary" id="v117ReviewText"></div><div class="v11111-coverage" id="v11111ImportCoverage"></div>
 <div class="v11112-verify" id="v11112CheckPanel">
 <h3>安全驗收｜與此裝置目前資料比對</h3>
 <p>已匯入另一台裝置、重新開啟 APP 後，重新選擇同一份備份，按下方按鈕。這只讀取資料，不會覆蓋。核對包含每項設備設定與全部照片原圖、縮圖。</p>
 <button type="button" id="v11112Compare" class="v117-primary">逐項比對目前裝置（不修改資料）</button>
 <div class="v11112-result" id="v11112Result" hidden role="status" aria-live="polite"></div>
 <section id="v11113Acceptance" class="v11113-acceptance" hidden aria-labelledby="v11113Title">
  <h3 id="v11113Title">現場移轉驗收｜核對後逐項確認</h3>
  <p>僅在整份備份與本機資料比對一致後啟用。這是此裝置的<strong>自助驗收</strong>，不會修改設備、照片或備份。請在實際要使用的手機或平板重新啟動 APP 後執行。</p>
  <div class="v11113-step"><b>① 本機儲存可讀寫檢查</b><button type="button" id="v11113Storage" class="v117-primary">檢查儲存功能與可用空間</button><div id="v11113StorageResult" class="v11113-note" role="status">尚未執行（只會寫入並刪除臨時測試資料）。</div></div>
  <div class="v11113-step"><b>② 實際設備照片抽樣</b><button type="button" id="v11113PhotosButton" class="v117-primary">顯示本機照片抽樣（最多 6 張）</button><div id="v11113PhotoResult" class="v11113-note">尚未抽查；如備份無照片會明確標示。</div><div id="v11113PhotosGrid" class="v11113-photos"></div></div>
  <div class="v11113-step"><b>③ 實際裝置核對</b>
   <label class="v11113-check"><input type="checkbox" id="v11113Restart"> 已在目前裝置關閉並重新開啟 APP，再重新選取原始備份進行比對</label>
   <label class="v11113-check"><input type="checkbox" id="v11113Cad"> 已打開 CAD，人工核對設備位置、旋轉、棟舍與管線標示</label>
   <label class="v11113-check"><input type="checkbox" id="v11113Markers"> 已打開設備照片工具核對照片上的開關、端子等標記（沒有標記則核對照片內容）</label>
  </div>
  <button type="button" id="v11113Finish" class="v117-primary">產生本裝置驗收結論</button>
  <div id="v11113Final" class="v11113-note" role="status" aria-live="polite">尚未完成自助驗收。</div>
  <p class="v11113-caution">本檢查不會將資料傳上網；臨時儲存測試可能使用 localStorage 與單獨的 IndexedDB 測試資料庫。驗收並非資料永久保存的保證，請持續留存 .hwpack 原檔。</p>
 </section>
 </div>
 <p class="v117-danger">請先另存目前這台裝置的完整備份。還原是整份取代，不會合併不同裝置的修改。瀏覽器沒有跨 localStorage 與 IndexedDB 的單一交易，若儲存空間不足，必須重新核對照片與資料。</p>
 <label class="v117-confirm"><input id="v117Agreement" type="checkbox"> 我已保存目前專案備份，確定要使用這份檔案取代</label>
 <label>請輸入「覆蓋」兩字確認<input id="v117Typed" maxlength="2" autocomplete="off" placeholder="覆蓋"></label>
 <button type="button" id="v117Apply" class="v117-danger-btn">確認整份取代並還原照片</button></div>
 </div>
 <div class="v117-status" id="v117Status" role="status" aria-live="polite">準備就緒。舊版 .hwb 備份仍可由舊格式相容入口匯入。</div>
 <footer>系統不會自行連線上傳 Google Drive／Firebase／公開 GitHub；只有你主動在系統分享選單選擇 Google Drive，才會交由 iOS／Android 處理。新版備份無密碼加密，請妥善保存在私人位置，勿建立公開分享連結。</footer>
 </section>`;
document.body.appendChild(ui);
const launch=el('button','v117-launch','▣ 完整專案備份');launch.id='v117Launch';launch.type='button';
const v116=$('v116Launch'),sidebar=$('v83EquipPanel'),top=$('v84BackupContents');if(v116)v116.after(launch);else sidebar?.prepend(launch);
const mobileBar=document.querySelector('.mobilebar');if(mobileBar){const m=el('button','v117-mobile','備份');m.type='button';m.addEventListener('click',open);mobileBar.appendChild(m);}
if(top){const direct=el('button','v117-direct','▣ 完整專案匯入／匯出');direct.type='button';direct.addEventListener('click',open);top.prepend(direct);
 const old=top.querySelector('.v92-card');if(old){old.querySelector('#v92Export')?.remove();const adv=el('details','v117-old'),sum=el('summary','', '舊版 .hwb 備份相容工具（點擊展開）');adv.append(sum,old);top.appendChild(adv);}}
const message=(s,bad=false)=>{const status=$('v117Status'),progress=$('v126Progress');status.textContent=s;status.dataset.error=bad?'true':'false';progress.textContent=s;progress.dataset.error=bad?'true':'false';};
let mode='export',review=null,reviewSource=null,selectedResolved=null,prepared=null,busy=false,priorFocus=null,downloadUrl=null;
function makeShareFile(item){
 return new File([item.blob],item.name,{type:'application/octet-stream',lastModified:Date.now()});
}
function releaseDownload(){
 const link=$('v11119Download');if(link){link.hidden=true;link.removeAttribute('href');link.removeAttribute('download');}
 const shareButton=$('v111218Share');if(shareButton)shareButton.hidden=true;
 if(downloadUrl){URL.revokeObjectURL(downloadUrl);downloadUrl=null;}
}
function enableDownload(file){
 releaseDownload();downloadUrl=URL.createObjectURL(file.blob);
 const link=$('v11119Download');link.href=downloadUrl;link.download=file.name;link.hidden=false;
 // A true iOS/Android system file share is opt-in and only offered when available.
 // This never uploads to any cloud server itself.
 const shareButton=$('v111218Share');
 if(shareButton){
  let allowed=typeof navigator.share==='function';
  if(allowed&&typeof navigator.canShare==='function'){
   try{allowed=!!navigator.canShare({files:[makeShareFile(file)]});}catch(_){allowed=false;}
  }
  shareButton.hidden=!allowed;
 }

}

// V11.11.3: the acceptance report is ephemeral, per backup and per device.
let accept={comparisonOk:false,storageOk:false,storageChecked:false,photosReady:false,photoCount:0,sampleCount:0,sampleViewed:0,sourceFile:null};
function resetAcceptance(){
 accept={comparisonOk:false,storageOk:false,storageChecked:false,photosReady:false,photoCount:0,sampleCount:0,sampleViewed:0,sourceFile:null};
 const root=$('v11113Acceptance');if(root)root.hidden=true;
 ['v11113Restart','v11113Cad','v11113Markers'].forEach(id=>{if($(id))$(id).checked=false;});
 if($('v11113StorageResult'))$('v11113StorageResult').textContent='尚未執行（只會寫入並刪除臨時測試資料）。';
 if($('v11113PhotoResult'))$('v11113PhotoResult').textContent='尚未抽查；如備份無照片會明確標示。';
 if($('v11113PhotosGrid'))$('v11113PhotosGrid').replaceChildren();
 if($('v11113Final')){$('v11113Final').textContent='尚未完成自助驗收。';$('v11113Final').dataset.status='';}
}

function counts(p){const c=core.totals(p);return `設備 ${c.devices} 台／管線 ${c.routes} 條／照片 ${c.photos} 張／照片標記 ${c.markers} 處\n系統節點 ${c.systems} 個／維修紀錄 ${c.maintenance} 筆／欄格關聯 ${c.stallLinks} 個`}
function coverageText(project,capacity,links){const c=core.coverage(project,capacity,links);return `資料類別核對｜已巡檢 ${c.inspected} 台／異常 ${c.abnormal} 台／待結案 ${c.workOrdersOpen} 筆\n陣列群組標示 ${c.arrays} 組／拆分設備 ${c.arrayMembers} 台／區段設備 ${c.segments} 個\n自訂圖示 ${c.customTypes} 種／設備樣板 ${c.templates} 個／配電端子 ${c.circuitTerminals} 個\n已填起訖設備管線 ${c.routeEndpoints} 條／欄位容量設定 ${c.capacitySaved?'有':'無'}／欄格設備關聯 ${c.stallLinksSaved?'有':'無'}`;}
function setBusy(v){busy=!!v;ui.querySelectorAll('button').forEach(b=>{b.disabled=busy;});$('v117Export').textContent=busy&&mode==='export'?'正在建立與驗證備份…':'① 開始製作完整備份';$('v126Progress').dataset.busy=busy?'true':'false';}
function changeTab(next){if(busy)return;releaseDownload();resetAcceptance();mode=next;review=null;reviewSource=null;selectedResolved=null;prepared=null;$('v117Save').hidden=true;$('v117Review').hidden=true;$('v11112Result').hidden=true;$('v11111ExportVerified').hidden=true;$('v117ExportArea').hidden=next!=='export';$('v117ImportArea').hidden=next!=='import';$('v117ModeExport').classList.toggle('active',next==='export');$('v117ModeImport').classList.toggle('active',next==='import');$('v117ModeExport').setAttribute('aria-selected',String(next==='export'));$('v117ModeImport').setAttribute('aria-selected',String(next==='import'));$('v117Typed').value='';$('v117Agreement').checked=false;message(next==='export'?'匯出頁籤已開啟：建立備份後可下載，支援的裝置還可使用系統分享。':'匯入頁籤已開啟：可從「檔案」App 的本機、iCloud 或 Google Drive 選擇 .hwpack，先預覽才還原。');}
function open(){priorFocus=document.activeElement;ui.hidden=false;hw.setWorkspace('equipment');changeTab('export');try{const p=hw.getData();$('v117Current').textContent='目前裝置\n'+counts({...p,stallLinks:window.HWStallLinks?.getBackupData?.()});$('v11111LocalCoverage').textContent=coverageText(p,window.HWStallCapacity?.getBackupData?.(),window.HWStallLinks?.getBackupData?.());$('v118PreflightResult').textContent='尚未執行備份前檢查。';}catch(e){$('v117Current').textContent='無法讀取設備資料：'+e.message;}ui.querySelector('.v117-panel').focus();$('side')?.classList.remove('open');}
function close(){if(busy)return;releaseDownload();resetAcceptance();ui.hidden=true;review=null;reviewSource=null;selectedResolved=null;prepared=null;$('v117Save').hidden=true;$('v117ImportPass').value='';$('v117File').value='';$('v11121OldPassword').hidden=true;$('v11121LegacyImport').hidden=true;$('v117Typed').value='';priorFocus?.focus?.();}
launch.addEventListener('click',open);$('v117Close').onclick=close;
ui.addEventListener('click',e=>{if(e.target===ui)close();});document.addEventListener('keydown',e=>{if(!ui.hidden&&e.key==='Escape'){e.preventDefault();close();}});
async function runPreflight(){
 const output=$('v118PreflightResult'),button=$('v118Preflight');button.disabled=true;
 output.textContent='正在逐張核對本機照片及設備關聯…';message('正在檢查設備照片和資料關聯，請勿關閉此視窗…');
 try{
  const p=hw.getData(),photoIds=[...new Set((p.devices||[]).flatMap(d=>(d.photos||[]).map(ph=>ph.id)))];
  const audit={total:photoIds.length,master:0,previewOnly:0,missing:0,problems:[]},missingPreviews=[],recoverable=[],unfixable=[],storageErrors=[];
  // Query independently: IndexedDB preview access can fail while masters survive.
  for(let index=0;index<photoIds.length;index++){
   const id=photoIds[index];
   const progressText='正在讀取設備照片 '+(index+1)+'／'+photoIds.length+'（縮圖與原圖）…';
   output.textContent=progressText;message(progressText);
   // A blocked IndexedDB request must produce a visible error, not leave an
   // apparently inert export button forever. Never silently omit a photo.
   const timeoutRead=(promise,label)=>new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error(label+'讀取逾時，請確認瀏覽器儲存空間')),12000);Promise.resolve().then(promise).then(v=>{clearTimeout(t);resolve(v);},err=>{clearTimeout(t);reject(err);});});
   let preview=null,original=null;
   try{preview=await timeoutRead(()=>media.getPreview(id),'縮圖 '+id+' ');}catch(e){storageErrors.push('縮圖 '+id+'：'+(e?.message||e));}
   try{original=await timeoutRead(()=>media.getOriginal(id),'原圖 '+id+' ');}catch(e){storageErrors.push('原圖 '+id+'：'+(e?.message||e));}
   if(!preview)missingPreviews.push(id);
   if(!preview&&!original){audit.missing++;audit.problems.push(id);unfixable.push(id);}
   else if(original){audit.master++;if(!preview)recoverable.push(id);}
   else audit.previewOnly++;
  }
  // A nonessential system-health scan must not prevent a readable backup.
  let report=null,scanError='';
  try{report=window.HWSystemHealthV115?.scanProject?.(p);}catch(e){scanError=e?.message||String(e);}
  const problems=report?.problems||[],broken=problems.filter(x=>x.severity==='error'),waiting=problems.filter(x=>x.severity==='review');
  const markers=(p.devices||[]).reduce((n,d)=>n+(d.photos||[]).reduce((a,ph)=>a+(ph.markers||[]).length,0),0);
  const lines=[`照片 ${audit.total} 張｜高畫質 ${audit.master} 張｜僅縮圖 ${audit.previewOnly} 張｜缺失 ${audit.missing} 張`,
   `開關／設備照片標記 ${markers} 處｜資料異常 ${broken.length} 筆｜現場待核對 ${waiting.length} 筆`];
  if(recoverable.length)lines.push('ⓘ '+recoverable.length+' 張照片只有原圖；製作備份時會在記憶體臨時重建縮圖，原始資料不變。');
  if(unfixable.length)lines.push('⚠ 原圖與縮圖皆無法讀取：'+unfixable.slice(0,5).join('、')+'（共 '+unfixable.length+' 張）。為避免偽稱完整備份，這些照片未修復前會阻擋匯出。');
  if(storageErrors.length)lines.push('⚠ 照片儲存讀取問題：'+storageErrors.slice(0,3).join('；')+'。如果仍能讀取原圖，可臨時重建縮圖。');
  if(broken.length)lines.push('⚠ 資料關聯異常：'+broken.slice(0,4).map(x=>x.text).join('；')+'。本功能不會偷偷修改關聯。');
  if(scanError)lines.push('ⓘ 額外的系統健康檢查無法執行：'+scanError+'（不影響已核對的照片備份）。');
  if(!audit.missing&&!storageErrors.length&&!broken.length)lines.push('✓ 所需設備照片可讀取；仍須下載 .hwpack 並在另一台裝置確認。');
  output.textContent=lines.join('\n');output.dataset.status=unfixable.length?'error':(broken.length||recoverable.length||storageErrors.length||scanError)?'warning':'ok';
  return {audit,broken,waiting,missingPreviews,recoverable,unfixable};
 }catch(e){output.textContent='⚠ 健檢失敗：'+(e?.message||e);output.dataset.status='error';throw e;
 }finally{button.disabled=false;}
}
$('v118Preflight').onclick=async()=>{try{await runPreflight();}catch(e){message('健檢未完成：'+e.message,true);}};
$('v117ModeExport').onclick=()=>{if(mode==='export'&&!busy){message(prepared?'備份已通過驗證：請按下方「② 下載已驗證的 .hwpack」。':'目前在「匯出」頁籤：請按下方「① 開始製作完整備份」。');(prepared?$('v11119Download'):$('v117Export')).scrollIntoView({block:'nearest'});(prepared?$('v11119Download'):$('v117Export')).focus();}else changeTab('export');};$('v117ModeImport').onclick=()=>{if(mode==='import'&&!busy){message('目前在「匯入」頁籤：可選 .hwpack 或內含 .hwpack 的 ZIP，再按「檢查備份並預覽」。');$('v117File').focus();}else changeTab('import');};$('v117File').onchange=async()=>{
 resetAcceptance();review=null;reviewSource=null;selectedResolved=null;$('v117Review').hidden=true;$('v11112Result').hidden=true;
 const file=$('v117File').files?.[0],info=$('v11121Detected');
 $('v11121OldPassword').hidden=true;$('v11121LegacyImport').hidden=true;
 if(!file){info.textContent='請選擇完整備份檔。';return;}
 info.textContent='正在確認檔案內容，ZIP 可能需要讀取解壓…';
 try{
  const format=await core.detectArchiveFormat(file);
  if(format==='plain'||format==='encrypted'||format==='zip'){
   const resolved=await window.HWPortableZipBridge.resolve(file);
   if($('v117File').files?.[0]!==file)return;
   selectedResolved=resolved;
   info.textContent=resolved.label+(resolved.kind==='encrypted'?'；這份舊加密備份需要原密碼。':'；可按「檢查備份並預覽」。');
   $('v11121OldPassword').hidden=resolved.kind!=='encrypted';
  }else if(format==='legacy-hwb'){
   info.textContent='舊版 .hwb 加密檔需原密碼，請使用相容匯入。';$('v11121LegacyImport').hidden=false;
  }else if(format==='legacy-json'){
   info.textContent='這是舊版 JSON，不包含完整設備照片，請使用舊版 JSON 相容匯入。';
  }else{ info.textContent='格式不支援。請選擇真正的 .hwpack 或內含 .hwpack 的 ZIP。'; }
 }catch(e){if($('v117File').files?.[0]===file)info.textContent='無法使用這份備份：'+e.message+'。手機資料未變動。';}
};
$('v11121LegacyImport').onclick=()=>{
 const old=$('v92Import');close();if(old)old.click();else alert('此版本找不到舊 .hwb 匯入工具，請保留原檔並回報。');
};
async function saveBlob(blob,name){
 // Only the second user gesture can open a file picker. On browsers without a
 // usable File System Access API, keep a PERSISTENT anchor to the verified blob.
 if(typeof window.showSaveFilePicker==='function'){
  try{
   const handle=await window.showSaveFilePicker({suggestedName:name,types:[{description:'虎尾場完整設備備份',accept:{'application/octet-stream':['.hwpack']}}]});
   const writable=await handle.createWritable();try{await writable.write(blob);await writable.close();}catch(e){try{await writable.abort();}catch(_){}throw e;}
   return '✓ 備份檔已寫入：'+handle.name+'。請到該資料夾確認檔案大小。';
  }catch(e){
   if(e?.name==='AbortError')throw Error('已取消儲存位置選擇；備份還在目前視窗，請再次按儲存或點下方「直接下載」');
   // Picker unavailable or rejected by this browser: do not drop the prepared
   // archive and never pretend that a download succeeded.
   return '瀏覽器無法使用資料夾選擇器（'+(e?.message||'不支援')+'）。請改按下方「② 下載已驗證的 .hwpack」；已驗證的免密碼備份仍保留在目前視窗。';
  }
 }
 return '此瀏覽器請點下方「② 下載已驗證的 .hwpack」；如果是 iPhone／iPad，下載後請到「檔案」App 檢查。';
}
function fileSize(n){return n<1048576?Math.max(1,Math.round(n/1024))+' KB':(n/1048576).toFixed(1)+' MB';}
function updater(s,n,total){message(s+(total?` （${n}/${total}）`:''));}
$('v117Export').onclick=async()=>{if(busy)return;setBusy(true);prepared=null;releaseDownload();$('v117Save').hidden=true;$('v11111ExportVerified').hidden=true;message('已開始匯出：正在執行備份前檢查…');await new Promise(resolve=>setTimeout(resolve,0));try{
 if(hw.getRole()!=='admin')throw Error('目前裝置未啟用完整編輯模式');
 const check=await runPreflight();if(check.audit.missing||check.unfixable.length)throw Error('有照片原圖與縮圖皆無法讀取（'+check.unfixable.slice(0,5).join('、')+'），不能建立完整備份；未遺失的設備資料不會被清除');const state=hw.getStorageState?.();if(state?.dirty)message('注意：本機自動儲存失敗，將從記憶體建立緊急完整備份，完成後請立即確認下載。',true);
 releaseDownload();prepared=null;$('v117Save').hidden=true;$('v11111ExportVerified').hidden=true;message('照片與設備資料檢查完成，正在製作 .hwpack…');
 const result=await core.exportArchive({project:hw.getData(),photos:media,stallCapacity:window.HWStallCapacity?.getBackupData?.(),stallLinks:window.HWStallLinks?.getBackupData?.(),onProgress:updater});
 // V11.11.2: verify the just-created encrypted archive, including every photo
 // and all saved project modules, *before* enabling the save button.
 const checked=await core.inspectArchive({file:result.blob,validateData:hw.validateData,onProgress:updater});
 const expected=core.coverage(hw.validateData(hw.getData()),window.HWStallCapacity?.getBackupData?.(),window.HWStallLinks?.getBackupData?.());
 const actual=core.coverage(checked.validated.project,checked.meta.project.stallCapacity,checked.meta.project.stallLinks);
 if(JSON.stringify(expected)!==JSON.stringify(actual))throw Error('匯出後資料類別與筆數不一致，已禁止儲存；請先檢查專案');
 prepared=result;enableDownload(result);$('v117Save').hidden=false;
 $('v11111ExportVerified').textContent='✓ 匯出後已重新讀取並核對 '+checked.validated.images.length+' 個照片區塊的 SHA-256、專案資料及所有資料類別。仍請確認下載檔案存在，並在另一台裝置試還原。';$('v11111ExportVerified').hidden=false;
 
 message('✓ 備份製作與驗證完成！請立即點「② 下載已驗證的 .hwpack」，並確認檔案已存在。檔案大小：'+fileSize(result.blob.size)+'；高解析原圖 '+result.master+' 張，僅縮圖 '+result.previewOnly+' 張。請確認檔案出現在裝置檔案夾，再關閉視窗。');$('v11119Download').scrollIntoView({block:'nearest'});
 }catch(e){message('匯出未完成：'+e.message,true);}finally{setBusy(false);}};
$('v11119Download').addEventListener('click',()=>{if(!prepared)return;message('已請瀏覽器下載 '+prepared.name+'；請到下載項目或「檔案」確認實際存在且大小約 '+fileSize(prepared.blob.size)+'。未確認前不要清除原裝置資料。');});
// On supported iPhone/iPad browsers, the user may choose Google Drive or Save to Files
// from the native share sheet. A successful share() resolution is not cloud verification.
$('v111218Share').addEventListener('click',async()=>{
 if(!prepared||busy||typeof navigator.share!=='function')return;
 const file=makeShareFile(prepared);
 try{
  if(typeof navigator.canShare==='function'&&!navigator.canShare({files:[file]}))throw Error('此瀏覽器不支援分享 .hwpack 檔案');
  await navigator.share({files:[file],title:'虎尾場私人完整備份'});
  message('已交給系統分享功能處理。請在「Google Drive」或「儲存到檔案」確認備份實際存在、檔案大小約 '+fileSize(prepared.blob.size)+'。分享完成不等於雲端已成功上傳；在另一台裝置驗證前請保留原始資料。');
 }catch(e){
  if(e?.name==='AbortError')message('已取消分享。完整備份仍在此視窗，可再次分享或直接下載。');
  else message('此裝置無法使用分享功能：'+(e?.message||e)+'。請改用「② 下載已驗證的 .hwpack」，再由「檔案」App 移動／分享至 Google Drive。',true);
 }
});

$('v117Save').onclick=async()=>{if(!prepared||busy)return;try{setBusy(true);const msg=await saveBlob(prepared.blob,prepared.name);message(msg+'\n新版免密碼檔含未加密設備照片，請勿公開分享；請到另一台裝置測試還原。');}catch(e){message('尚未完成儲存：'+e.message+'；你仍可再次按下儲存按鈕。',true);}finally{setBusy(false);}};
$('v117Inspect').onclick=async()=>{if(busy)return;try{
 if(hw.getRole()!=='admin')throw Error('無法使用完整編輯模式');const source=$('v117File').files?.[0];if(!source)throw Error('請選擇備份檔');const resolved=(selectedResolved?.source===source?selectedResolved:await window.HWPortableZipBridge.resolve(source));selectedResolved=resolved;const file=resolved.file;
 setBusy(true);resetAcceptance();review=null;reviewSource=null;selectedResolved=null;$('v117Review').hidden=true;$('v11112Result').hidden=true;
 const result=await core.inspectArchive({file,password:$('v11121OldPassword').hidden?'':$('v117ImportPass').value,validateData:hw.validateData,onProgress:updater});
 review=result;reviewSource=source;$('v11112Result').hidden=true;$('v11111ImportCoverage').textContent=coverageText(result.validated.project,result.meta.project.stallCapacity,result.meta.project.stallLinks);$('v117ReviewText').textContent='這台裝置目前的資料：\n'+counts({...hw.getData(),stallLinks:window.HWStallLinks?.getBackupData?.()})+'\n\n即將還原的完整專案：\n'+counts({...result.validated.project,stallLinks:result.meta.project.stallLinks})+'\n\n備份日期：'+result.meta.createdAt+'\nCAD 版本指紋：'+result.meta.cadFingerprint.slice(0,16)+'…\n照片主圖與縮圖已逐項通過 SHA-256 完整性驗證。';
 $('v117Agreement').checked=false;$('v117Typed').value='';$('v117Review').hidden=false;$('v117ImportPass').value='';
 message('整份備份驗證通過，目前尚未寫入任何裝置資料。');
 }catch(e){review=null;message('備份預覽失敗，原裝置資料未變動：'+e.message,true);}finally{setBusy(false);}};
$('v11112Compare').onclick=async()=>{
 if(busy)return;
 resetAcceptance();
 try{
  if(!review)throw Error('請先選檔並按「檢查備份並預覽」');
  if($('v117File').files?.[0]!==reviewSource)throw Error('選取的備份已變更，請重新驗證');
  setBusy(true);
  const out=$('v11112Result');out.hidden=false;out.textContent='正在比較目前裝置的設備資料及照片…';out.dataset.ok='';
  const result=await core.compareCurrentArchive({archive:review,project:hw.getData(),photos:media,
   stallCapacity:window.HWStallCapacity?.getBackupData?.(),stallLinks:window.HWStallLinks?.getBackupData?.(),onProgress:updater});
  const unchanged=result.sections.filter(s=>s.ok).length;
  const lines=[result.ok?'✓ 全項比對一致：本裝置讀取到的專案及照片與所選備份相符。':'⚠ 比對有差異：請勿把目前裝置當成已完整還原。',
   '設備與設定核對 '+unchanged+' / '+result.sections.length+' 項；照片區塊 '+result.verifiedPhotos+' / '+result.expectedPhotos+' 項',
   '備份日期：'+new Date(result.archiveDate).toLocaleString('zh-TW'),
   ...result.changed.slice(0,12).map(s=>'✕ '+s.label+(s.localCount!=null?'（本機 '+s.localCount+'／備份 '+s.expectedCount+'）':'')),
   ...result.photoIssues.slice(0,12).map(p=>'✕ 照片 '+p.id+'（'+(p.kind==='master'?'原圖':'縮圖')+'）：'+p.reason)];
  const total=result.changed.length+result.photoIssues.length;
  if(total>24)lines.push('其餘 '+(total-24)+' 項差異未逐條列出。');
  lines.push('這是目前開啟的本機資料比對結果；不能取代實體裝置重新啟動、現場抽查或儲存空間檢查。');
  out.textContent=lines.join('\n');out.dataset.ok=result.ok?'yes':'no';
  if(result.ok){accept.comparisonOk=true;accept.sourceFile=reviewSource;accept.photoCount=result.expectedPhotos;$('v11113Acceptance').hidden=false;}

  message(result.ok?'只讀驗收完成：資料一致，未修改目前裝置。':'只讀驗收完成：發現 '+total+' 項差異，未修改目前裝置。',!result.ok);
 }catch(e){$('v11112Result').hidden=false;$('v11112Result').dataset.ok='no';$('v11112Result').textContent='無法完成比對：'+(e?.message||e);message('只讀驗收失敗：'+(e?.message||e),true);}finally{setBusy(false);}
};
$('v117Apply').onclick=async()=>{if(busy)return;try{
 if(hw.getRole()!=='admin')throw Error('請先切換本機管理者模式');if(!review)throw Error('請先重新驗證備份檔');
 if(!$('v117Agreement').checked||$('v117Typed').value.trim()!=='覆蓋')throw Error('請先勾選確認並輸入「覆蓋」');
 if($('v117File').files?.[0]!==reviewSource)throw Error('備份檔已更換，請重新預覽');
 setBusy(true);
 const result=await core.applyArchive(review,{importProject:data=>hw.importPrivateProject(data,'V11.8 完整可攜式備份'),restoreCapacity:window.HWStallCapacity?.restore,restoreLinks:window.HWStallLinks?.restore,onProgress:updater});
 const check=await media.audit(hw.getData());
 if(check.missing||check.total!==result.photos)throw Error('專案已寫入，但事後照片檢查不完整：預期 '+result.photos+' 張，實際 '+check.total+' 張，缺失 '+check.missing+' 張。請保留原備份檔，暫停後續修改並重新核對。');
 const verified=await core.verifyRestored({archive:review,project:hw.getData(),photos:media,stallCapacity:window.HWStallCapacity?.getBackupData?.(),stallLinks:window.HWStallLinks?.getBackupData?.(),onProgress:updater});
 message('已還原 '+result.devices+' 台設備、'+result.routes+' 條線路、'+result.photos+' 張照片。已重新讀取並核對本機資料、'+verified.verifiedPreviews+' 張縮圖與 '+verified.verifiedMasters+' 張原圖。請再以 CAD 與現場設備抽查驗收。');review=null;reviewSource=null;selectedResolved=null;$('v117Review').hidden=true;$('v117File').value='';$('v117Typed').value='';$('v117Agreement').checked=false;
 }catch(e){message('還原未完成：'+e.message+'。如曾開始寫入，請使用原裝置備份再做完整核對。',true);}finally{setBusy(false);}};

// V11.11.3 on-device storage diagnostics. Only temporary keys / isolated DB are written.
async function probeIndexedDB(){
 if(!window.indexedDB)throw Error('此瀏覽器不支援 IndexedDB');
 const name='HuweiFarmV11113TemporaryProbe';
 const request=()=>new Promise((resolve,reject)=>{
  const open=indexedDB.open(name,1);
  open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains('tests'))open.result.createObjectStore('tests');};
  open.onerror=()=>reject(open.error||Error('無法開啟臨時照片資料庫'));
  open.onblocked=()=>reject(Error('其他分頁阻擋儲存檢查'));
  open.onsuccess=()=>resolve(open.result);
 });
 let db;
 try{
  db=await request();
  const token='temporary-check-'+Date.now();
  await new Promise((resolve,reject)=>{const tx=db.transaction('tests','readwrite');tx.objectStore('tests').put(token,'selftest');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('IndexedDB 無法寫入'));tx.onabort=()=>reject(tx.error||Error('IndexedDB 寫入被中止'));});
  const value=await new Promise((resolve,reject)=>{const tx=db.transaction('tests','readonly');const req=tx.objectStore('tests').get('selftest');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('IndexedDB 無法讀取'));});
  if(value!==token)throw Error('IndexedDB 寫入與讀回資料不同');
  await new Promise((resolve,reject)=>{const tx=db.transaction('tests','readwrite');tx.objectStore('tests').delete('selftest');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('清除測試資料失敗'));});
  return true;
 }finally{
  if(db)db.close();
  // Delete the isolated test database; never touch the app photo databases.
  try{const del=indexedDB.deleteDatabase(name);del.onerror=()=>{};del.onblocked=()=>{};}catch(_){}
 }
}
$('v11113Storage').onclick=async()=>{
 if(busy||!accept.comparisonOk)return;
 invalidateAcceptanceReport();const target=$('v11113StorageResult');accept.storageOk=false;accept.storageChecked=false;target.textContent='正在檢查（不會變更設備或照片）…';
 setBusy(true);
 const parts=[];let localOk=false,dbOk=false;
 try{
  const key='hw-v11113-temporary-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  try{const val='storage-probe';localStorage.setItem(key,val);localOk=localStorage.getItem(key)===val;parts.push(localOk?'✓ 本機設定儲存：寫入、讀回正常':'✕ 本機設定儲存：讀回內容不一致');}
  catch(e){parts.push('✕ 本機設定儲存失敗：'+(e?.message||e));}
  finally{try{localStorage.removeItem(key);}catch(_){}}
  try{dbOk=await probeIndexedDB();parts.push('✓ 臨時照片資料庫：寫入、讀回正常（測試資料已清除）');}
  catch(e){parts.push('✕ 照片資料庫測試失敗：'+(e?.message||e));}
  if(navigator.storage?.estimate){
   try{const est=await navigator.storage.estimate();
    const used=typeof est.usage==='number'?(est.usage/1048576).toFixed(1):'未知';
    const quota=typeof est.quota==='number'?(est.quota/1048576).toFixed(1):'未知';
    parts.push(`參考容量：已用 ${used} MB／估計配額 ${quota} MB（瀏覽器回報，非實際保證）`);
   }catch(e){parts.push('瀏覽器不提供容量估計。');}
  }else parts.push('此瀏覽器不支援容量估計。');
  if(navigator.storage?.persisted){
   try{parts.push((await navigator.storage.persisted())?'持久性儲存權限：已授予':'持久性儲存權限：未授予或無法確定，請保留離線備份');}
   catch(_){parts.push('持久性儲存狀態：無法確認');}
  }
  accept.storageOk=localOk&&dbOk;accept.storageChecked=true;
  parts.push(accept.storageOk?'✓ 本次可讀寫檢查通過；不保證日後不遭系統清除。':'⚠ 儲存功能未通過，請先解決再做移轉驗收。');
  target.dataset.status=accept.storageOk?'ok':'error';target.textContent=parts.join('\n');
 }finally{setBusy(false);}
};
function invalidateAcceptanceReport(){const result=$('v11113Final');if(result){result.textContent='驗收項目有變動，請重新產生結論。';result.dataset.status='';}}
['v11113Restart','v11113Cad','v11113Markers'].forEach(id=>$(id).addEventListener('change',invalidateAcceptanceReport));
function photoReferences(project){
 const map=new Map();
 for(const d of project?.devices||[]){for(const ph of d.photos||[]){
  if(!ph?.id||map.has(ph.id))continue;
  map.set(ph.id,{id:ph.id,device:d.name||d.label||d.id||'未命名設備',markers:Array.isArray(ph.markers)?ph.markers.length:0});
 }}
 return Array.from(map.values());
}
$('v11113PhotosButton').onclick=async()=>{
 if(busy||!accept.comparisonOk||!review||accept.sourceFile!==reviewSource)return;
 invalidateAcceptanceReport();const grid=$('v11113PhotosGrid'),status=$('v11113PhotoResult');grid.replaceChildren();accept.photosReady=false;accept.sampleViewed=0;
 const items=photoReferences(review.validated.project);accept.photoCount=items.length;
 if(!items.length){accept.sampleCount=0;accept.photosReady=true;status.textContent='此份備份沒有設備照片，照片抽樣不適用。請仍核對 CAD 和其他已建檔資料。';return;}
 // Deterministic spaced selection across devices, not merely the first six images.
 const n=Math.min(6,items.length),subset=[];
 for(let i=0;i<n;i++)subset.push(items[Math.floor(i*items.length/n)]);
 accept.sampleCount=n;setBusy(true);status.textContent=`正在讀取 ${n} 張本機照片縮圖…`;
 try{
  for(const item of subset){
   const card=el('div','v11113-photo');const img=el('img');img.alt=`${item.device} 的設備照片`;img.loading='lazy';
   const note=el('p','',`${item.device}｜照片 ${item.id}｜記錄標記 ${item.markers} 處`);
   const label=el('label','v11113-check');const input=document.createElement('input');input.type='checkbox';
   const span=el('span','','已目視確認此照片內容正確');label.append(input,span);
   const data=await media.getPreview(item.id).catch(()=>null);
   if(typeof data==='string'&&/^data:image\/(png|jpeg|webp);base64,/.test(data)){
    img.src=data;card.append(img,note,label);
    input.addEventListener('change',()=>{invalidateAcceptanceReport();const all=[...grid.querySelectorAll('input[type="checkbox"]:not(:disabled)')];accept.sampleViewed=all.filter(x=>x.checked).length;accept.photosReady=all.length===n&&all.every(x=>x.checked);status.textContent=`已確認 ${accept.sampleViewed}/${n} 張照片；照片標記仍須到設備照片工具個別檢視。`;});
   }else{
    input.disabled=true;card.append(el('p','v11113-missing','⚠ 無法讀取本機縮圖'),note,label);
   }
   grid.append(card);
  }
  if(grid.querySelectorAll('img').length!==n)status.textContent='⚠ 部分照片無法開啟，請勿視為完成現場驗收。';
  else status.textContent=`已載入 ${n} 張（全案 ${items.length} 張）。逐張確認內容後勾選；照片標記請另外在設備照片工具核對。`;
 }finally{setBusy(false);}
};
$('v11113Finish').onclick=async()=>{
 if(busy)return;
 const out=$('v11113Final');out.dataset.status='error';
 const blockers=[];
 if(!accept.comparisonOk||!review||accept.sourceFile!==reviewSource)blockers.push('尚未使用同一份備份完成一致性比對');
 if(!accept.storageChecked||!accept.storageOk)blockers.push('本機儲存讀寫檢查尚未通過');
 if(!accept.photosReady)blockers.push('照片抽樣未完成或有無法讀取的照片');
 if(!$('v11113Restart').checked)blockers.push('尚未確認關閉並重啟 APP');
 if(!$('v11113Cad').checked)blockers.push('尚未人工抽查 CAD 設備與管線');
 if(!$('v11113Markers').checked)blockers.push('尚未人工核對照片與標記');
 if(blockers.length){out.textContent='尚未完成本機移轉驗收：\n'+blockers.map(x=>'• '+x).join('\n');return;}
 // Re-compare at the moment of sign-off: changes made after the earlier
 // successful comparison must never be silently accepted.
 out.textContent='正在重新核對最新本機資料與照片…';setBusy(true);
 try{
  const latest=await core.compareCurrentArchive({archive:review,project:hw.getData(),photos:media,
   stallCapacity:window.HWStallCapacity?.getBackupData?.(),stallLinks:window.HWStallLinks?.getBackupData?.()});
  if(!latest.ok){out.textContent='⚠ 最終驗收中止：裝置資料或照片自上次比對後已有變更。請重新執行逐項比對與抽樣確認。';accept.comparisonOk=false;$('v11113Acceptance').hidden=true;message('最終核對有差異，驗收不通過。',true);return;}
  out.dataset.status='ok';out.textContent=`✓ 此裝置自助驗收清單已完成（${new Date().toLocaleString('zh-TW')}）。\n✓ 最新資料與備份逐項比對一致；儲存測試正常；抽樣照片 ${accept.sampleCount} 張已人工確認；CAD 與照片標記已人工檢查。\n備份：${reviewSource?.name||review.file.name}\n此結果是使用者在目前裝置的自助檢查，不代表系統已自動驗證另一台實體裝置的資料永久保存。請保留原始 .hwpack。`;
 }catch(e){out.textContent='⚠ 最終核對未完成：'+(e?.message||e);out.dataset.status='error';}
 finally{setBusy(false);}
};

window.HWPortableUI={open,changeTab};
})();
