/* V11.12.25 — local photo-rescue workbench. Read-only by default.
   Only explicit, individually verified photo restoration writes to IndexedDB.
   Never calls equipment.importPrivateProject or changes project/markers. */
(function(){'use strict';
const hw=window.HWEquipment, photos=window.HWPhotoStore, core=window.HWPortableCore;
if(!hw||!photos||!core)return;
const $=id=>document.getElementById(id);
const root=document.createElement('section');root.id='hwPhotoRescue';root.hidden=true;root.className='hw-rescue-overlay';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','照片安全診斷與救援');
root.innerHTML=`<div class="hw-rescue-sheet"><header><div><small>HUWEI · LOCAL PHOTO RECOVERY</small><h2>照片安全診斷與救援</h2><p>保留照片 ID、設備資料與所有標記座標；不執行整份專案還原。</p></div><button id="hwRescueClose" type="button">✕ 關閉</button></header><main>
<div class="hw-rescue-warn"><strong>先不要清除網站資料、重設 APP、刪除設備照片或整份匯入舊備份。</strong> 請務必在原本上傳照片的電腦、原本的瀏覽器與同一個網址使用。救援中心的「診斷」不會修改資料；只有你明確按「補回」才會寫入相符影像。</div>
<div class="hw-rescue-actions"><button type="button" id="hwRescueScan">① 唯讀檢查兩個照片資料庫</button><button type="button" id="hwRescueExport" disabled>② 下載標記與設備緊急保存 JSON</button></div>
<pre id="hwRescueReport" class="hw-rescue-report" role="status" aria-live="polite">尚未診斷。此頁不會自動重建或清空 IndexedDB。</pre>
<details><summary>③ 從以前的 .hwpack 只補回相符照片（不整份還原）</summary>
<p>選擇<strong>問題發生前</strong>的 .hwpack。只接受目前仍缺失、照片 ID 與原始檔名都一致的影像。可使用不同 CAD 版本的備份，因為不會匯入 CAD 底圖或設備位置。</p>
<label>舊版備份檔 <input id="hwRescueArchive" type="file" accept=".hwpack,application/octet-stream" /></label>
<label>舊版加密備份密碼（非加密檔留空）<input id="hwRescuePassword" type="password" autocomplete="off" /></label>
<div class="hw-rescue-actions"><button id="hwRescuePreviewArchive" type="button">檢查與預覽可補回照片（唯讀）</button></div>
<pre id="hwRescueArchiveResult" class="hw-rescue-report" role="status">尚未選擇備份。</pre>
<label class="hw-rescue-check"><input id="hwRescueArchiveAgree" type="checkbox" /> 我已下載設備標記緊急保存 JSON，並核對這是正確的舊備份。</label>
<button id="hwRescueApplyArchive" type="button" disabled>只補回缺失照片（不覆蓋設備與 49 個標記）</button>
</details>
<details><summary>④ 沒有 .hwpack 時，使用原始 JPG／PNG 逐張重新連結</summary>
<p>若電腦裡仍有原始照片，可依原檔名重新連結到既有照片 ID。<strong>請選相同照片、相同裁切和方向</strong>，否則原標記會在視覺上偏移；不修改既有百分比座標。</p>
<label>要補回的照片 <select id="hwRescueTarget"></select></label>
<label>選擇原始照片 <input id="hwRescueFile" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" /></label>
<img id="hwRescueImagePreview" alt="待補回原始照片預覽" hidden />
<label class="hw-rescue-check"><input id="hwRescuePhotoAgree" type="checkbox" /> 已確認這是同一張照片，願意只補回所選 ID 的影像，不修改照片標記。</label>
<button id="hwRescueApplyFile" type="button" disabled>只補回此張照片</button>
</details>
<p class="hw-rescue-foot">標記緊急保存 JSON <strong>不是</strong>可完整還原的 .hwpack，裡面不包含缺失的影像。檔案包含設備、照片名稱與電路資料，請勿放進公開 GitHub。診斷及復原在本機執行，不上傳外部伺服器。</p>
</main></div>`;
document.body.append(root);
const openButton=document.createElement('button');openButton.type='button';openButton.id='hwRescueOpen';openButton.className='hw-rescue-launch';openButton.textContent='🛟 照片救援／保留標記';
const backupHost=$('v117ExportArea')||$('v84BackupContents')||document.querySelector('.side');
backupHost?.append(openButton);
const state={report:null,candidate:null,busy:false,lastFocus:null,exported:false};
const report=$('hwRescueReport'),archiveReport=$('hwRescueArchiveResult');
const datestr=()=>new Date().toISOString().replace(/[:.]/g,'-');
function status(t){report.textContent=t;}
function busy(value){state.busy=!!value;root.querySelectorAll('button').forEach(b=>{if(b.id!=='hwRescueClose')b.disabled=!!value;});$('hwRescueClose').disabled=!!value;if(!value){$('hwRescueExport').disabled=!state.report;$('hwRescueApplyArchive').disabled=!state.candidate?.assets?.length||!$('hwRescueArchiveAgree').checked;$('hwRescueApplyFile').disabled=!$('hwRescuePhotoAgree').checked||!$('hwRescueFile').files?.length||!$('hwRescueTarget').value;}}
function photoList(){const project=hw.getData();const photosList=[];for(const d of project.devices||[])for(const ph of d.photos||[])photosList.push({id:ph.id,name:ph.name||'',deviceName:d.name||'',deviceId:d.id,markers:(ph.markers||[]).length});return photosList;}
function dbOpenExisting(name){return new Promise((resolve,reject)=>{
 if(!window.indexedDB)return reject(Error('此瀏覽器無 IndexedDB'));
 let upgraded=false;const request=indexedDB.open(name);
 // Abort on creation: NEVER make an empty "recovered" photo database.
 request.onupgradeneeded=()=>{upgraded=true;try{request.transaction.abort();}catch(_){};};
 request.onsuccess=()=>{if(upgraded){request.result.close();resolve(null);}else resolve(request.result);};
 request.onerror=()=>{if(upgraded)resolve(null);else reject(request.error||Error('資料庫開啟失敗'));};
 request.onblocked=()=>reject(Error('資料庫正被其他分頁使用，請關閉其他相同網頁後重試'));
 });}
async function inspectDB(name,store){
 const out={name,store,exists:false,keys:[],error:'',invalid:0};let db=null;
 try{
  if(indexedDB.databases){const list=await indexedDB.databases();if(!list.some(d=>d.name===name))return out;}
  db=await dbOpenExisting(name);if(!db)return out;out.exists=true;
  if(!db.objectStoreNames.contains(store)){out.error='資料庫存在，但找不到 '+store+' 物件倉庫';return out;}
  const rows=await new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly'),os=tx.objectStore(store),arr=[];const cur=os.openCursor();cur.onsuccess=()=>{const c=cur.result;if(c){arr.push({key:String(c.key),valid:typeof c.value==='string'&&/^data:image\/(?:jpeg|png|webp);base64,/.test(c.value),length:typeof c.value==='string'?c.value.length:0});c.continue();}};cur.onerror=()=>reject(cur.error);tx.oncomplete=()=>resolve(arr);tx.onerror=()=>reject(tx.error);});
  out.keys=rows.filter(x=>x.valid).map(x=>x.key);out.invalid=rows.filter(x=>!x.valid).length;
 }catch(e){out.error=e?.message||String(e);}finally{db?.close();}
 return out;
}
async function scan(){
 status('只讀檢查中：不會修改本機設備、照片、標記及備份…');
 const list=photoList();let foundDBs=[];
 try{if(indexedDB.databases)foundDBs=(await indexedDB.databases()).map(x=>x.name).filter(Boolean);}catch(_){foundDBs=[];}
 const preview=await inspectDB('HuweiFarmDevicePhotosV90','images');
 const master=await inspectDB('HuweiFarmPhotoMastersV103','masters');
 const previews=new Set(preview.keys),masters=new Set(master.keys);
 const missing=list.filter(p=>!previews.has(p.id)&&!masters.has(p.id));
 const recovered=list.filter(p=>previews.has(p.id)||masters.has(p.id));
 const locations=list.map(p=>({...p,preview:previews.has(p.id),master:masters.has(p.id)}));
 const reportObj={origin:location.origin,pathname:location.pathname,generatedAt:new Date().toISOString(),photoCount:list.length,markerCount:list.reduce((n,p)=>n+p.markers,0),photos:locations,missing,readable:recovered,previewDB:preview,masterDB:master,dbNames:foundDBs,storageDirty:hw.getStorageState?.()?.dirty||false};
 state.report=reportObj;state.candidate=null;state.exported=false;$('hwRescueArchiveAgree').checked=false;
 const errorLines=[preview.error,master.error].filter(Boolean);const total=locations.length;
 status(`目前網址：${location.origin+location.pathname}\n設備照片 ${total} 張，標記 ${reportObj.markerCount} 個\n縮圖資料庫：${preview.exists?'存在':'不存在'}；有效影像 ${preview.keys.length} 筆${preview.invalid?'；不合格式 '+preview.invalid+' 筆':''}\n原圖資料庫：${master.exists?'存在':'不存在'}；有效影像 ${master.keys.length} 筆${master.invalid?'；不合格式 '+master.invalid+' 筆':''}\n本專案可對應照片 ${recovered.length} 張；兩庫皆無 ${missing.length} 張\n${errorLines.length?'⚠ 讀取錯誤：'+errorLines.join('；')+'\n':''}${missing.length?'缺失的照片名稱／ID：\n'+missing.map(p=>p.name+'｜'+p.deviceName+'｜'+p.id).join('\n'):'目前的照片 ID 都能在資料庫找到（仍需逐張檢查影像內容）。'}\n\n提示：若資料庫不存在，已避免自動建立空庫。`);
 const target=$('hwRescueTarget');target.replaceChildren();const start=document.createElement('option');start.value='';start.textContent='請選要補回的照片';target.append(start);
 for(const p of missing){const option=document.createElement('option');option.value=p.id;option.textContent=p.deviceName+' / '+p.name+' / '+p.id;target.append(option);}
 $('hwRescueExport').disabled=false;busy(false);return reportObj;
}
function saveJSON(name,value){const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function exportEvidence(){
 if(!state.report)throw Error('請先執行唯讀檢查');
 // Raw project preserves exactly the metadata bytes available right now.
 const names=[];for(let n=82;n<=94;n++)names.push('hw-v'+n+'-project');
 const raw={};for(const name of names){const value=localStorage.getItem(name);if(value!==null)raw[name]=value;}
 const pkg={type:'HUWEI_PHOTO_METADATA_RESCUE_NOT_FULL_BACKUP',formatVersion:1,warning:'不含照片影像，不能當完整 .hwpack；只保護設備、照片 ID 與標記座標',diagnostic:state.report,rawProjects:raw,currentProject:hw.getData(),stallCapacity:window.HWStallCapacity?.getBackupData?.()||null,stallLinks:window.HWStallLinks?.getBackupData?.()||null};
 saveJSON('虎尾場_照片缺失_設備與標記緊急保存_'+datestr()+'.json',pkg);state.exported=true;
 status(report.textContent+'\n\n✓ 已請瀏覽器下載緊急保存 JSON。請到下載資料夾確認檔案實際存在。');
}
async function restoreOnlyMissing(assets){
 if(hw.getRole()!=='admin')throw Error('請先切換管理者編輯模式');
 const expected=new Map(photoList().map(p=>[p.id,p]));let restored=0,skipped=0;const outcomes=[];
 for(const a of assets){
  if(!expected.has(a.id)){skipped++;continue;}
  // Both must be missing; an unreadable DB is an error, never overwrite.
  const preview=await photos.getPreview(a.id),master=await photos.getOriginal(a.id);
  if(preview||master){skipped++;continue;}
  if(typeof a.dataUrl!=='string')throw Error('沒有有效縮圖：'+a.id);
  await photos.ingest([a]);
  if(!(await photos.getPreview(a.id)))throw Error('寫入後照片驗證失敗：'+a.id);
  restored++;outcomes.push(a.id);
 }
 return{restored,skipped,outcomes};
}
$('hwRescueScan').onclick=async()=>{busy(true);try{await scan();}catch(e){status('診斷無法完成：'+(e?.message||e));}finally{busy(false);}};
$('hwRescueExport').onclick=()=>{try{exportEvidence();}catch(e){status('緊急保存 JSON 下載失敗：'+(e?.message||e));}};
$('hwRescuePreviewArchive').onclick=async()=>{state.candidate=null;busy(true);
 try{
  if(!state.report)await scan();const file=$('hwRescueArchive').files?.[0];if(!file)throw Error('請先選擇舊 .hwpack 檔案');
  const expectedNames=Object.fromEntries(state.report.missing.map(p=>[p.id,p.name]));
  archiveReport.textContent='正在檢查舊備份的照片 ID、檔名及 SHA-256…';
  const result=await core.extractPhotosForRecovery({file,password:$('hwRescuePassword').value,wantedIds:state.report.missing.map(p=>p.id),expectedNames,onProgress:(s)=>{archiveReport.textContent=s;}});
  state.candidate=result;
  archiveReport.textContent=`舊備份檔名：${file.name}\n與目前缺失照片完全對應：${result.assets.length} 張\n照片檔名不吻合：${[...new Set(result.nameMismatches.map(x=>x.id))].length} 張（為安全已跳過）\n相符照片：${result.assets.map(a=>expectedNames[a.id]+'｜'+a.id).join('\n')||'沒有'}\n\n這只是預覽，尚未修改任何資料。只有按下一步補回才會寫入照片影像。`;
 }catch(e){archiveReport.textContent='舊備份預覽失敗：'+(e?.message||e);}finally{busy(false);}};
$('hwRescueApplyArchive').onclick=async()=>{
 if(!state.exported||!$('hwRescueArchiveAgree').checked||!state.candidate?.assets?.length){archiveReport.textContent='請先下載標記緊急保存 JSON、預覽正確備份並勾選確認。';return;}
 if(!confirm('確定只補回缺失照片的 IndexedDB 影像？不改動任何設備／標記資料；請先確認標記緊急保存 JSON 已成功下載。'))return;
 busy(true);try{const r=await restoreOnlyMissing(state.candidate.assets);archiveReport.textContent=`已寫回 ${r.restored} 張影像，跳過 ${r.skipped} 張；沒有修改設備、49 個標記或 CAD 底圖。請關閉並重開照片頁，確認每個標記位置。`;
  state.candidate=null;await scan();
 }catch(e){archiveReport.textContent='部分照片可能已補回；請重新診斷確認：'+(e?.message||e);}finally{busy(false);}};
$('hwRescueFile').onchange=()=>{const f=$('hwRescueFile').files?.[0],img=$('hwRescueImagePreview');if(img.dataset.url){URL.revokeObjectURL(img.dataset.url);delete img.dataset.url;}img.hidden=!f;if(f){img.dataset.url=URL.createObjectURL(f);img.src=img.dataset.url;}$('hwRescuePhotoAgree').checked=false;busy(false);};
$('hwRescuePhotoAgree').onchange=()=>busy(false);
$('hwRescueArchiveAgree').onchange=()=>busy(false);
$('hwRescueApplyFile').onclick=async()=>{
 const id=$('hwRescueTarget').value,file=$('hwRescueFile').files?.[0];if(!id||!file||!$('hwRescuePhotoAgree').checked||!state.exported){status('請先下載標記 JSON，選取缺失照片、選擇正確原圖並勾選確認。');return;}
 if(!confirm('確定將選擇的原始照片存回 '+id+'？請確認是同一張、同方向、同裁切的照片，否則標記可能視覺偏移。'))return;
 busy(true);try{
  if(hw.getRole()!=='admin')throw Error('請先切換管理者編輯模式');
  const current=photoList().find(x=>x.id===id);if(!current)throw Error('此照片已不在目前專案');
  if(await photos.getPreview(id)||await photos.getOriginal(id))throw Error('此照片已有影像，為避免覆蓋而拒絕寫入');
  const compressed=await photos.compress(file);
  const original=await photos.prepareOriginal(file); // prepare only; do not write until both encodes succeed
  await photos.ingest([{id,dataUrl:compressed,originalDataUrl:original}]);
  if(!await photos.getPreview(id)||!await photos.getOriginal(id))throw Error('照片回寫驗證未通過，請重新檢查');
  status('✓ 已補回 '+current.name+'，保留照片 ID '+id+' 與原有 '+current.markers+' 個標記。請核對內容／方向／裁切是否與原圖一致。');
  $('hwRescuePhotoAgree').checked=false;$('hwRescueFile').value='';const img=$('hwRescueImagePreview');if(img.dataset.url)URL.revokeObjectURL(img.dataset.url);img.hidden=true;delete img.dataset.url;await scan();
 }catch(e){status('補回失敗：'+(e?.message||e));}finally{busy(false);}};
openButton.onclick=()=>{state.lastFocus=document.activeElement;root.hidden=false;root.querySelector('header button').focus();};
$('hwRescueClose').onclick=()=>{root.hidden=true;state.lastFocus?.focus?.();};
window.HWPhotoRescueV111225={open:()=>openButton.click(),scan};
})();
