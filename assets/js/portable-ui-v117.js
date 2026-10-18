/* V11.7 portable backup user interface — an explicit, offline-first workflow. */
(function(){'use strict';
const hw=window.HWEquipment,media=window.HWPhotoStore,core=window.HWPortableCore;
if(!hw||!media||!core)return;
const $=id=>document.getElementById(id);
const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;};
const ui=el('div','v117-overlay');ui.id='v117Overlay';ui.hidden=true;
ui.innerHTML=`<section class="v117-panel" role="dialog" aria-modal="true" aria-labelledby="v117Title" tabindex="-1">
 <header class="v117-head"><div><small>HUWEI FARM · PORTABLE PROJECT</small><h2 id="v117Title">完整專案備份與換裝置還原</h2><p>設備、全部照片、配電開關標記、管線、欄格及母子系統一起帶走；不需要雲端帳號。</p></div><button id="v117Close" type="button" aria-label="關閉">✕</button></header>
 <div class="v117-mode"><button type="button" id="v117ModeExport" class="active">↓ 匯出完整專案</button><button type="button" id="v117ModeImport">↑ 換裝置匯入</button></div>
 <div id="v117ExportArea">
 <div class="v117-summary" id="v117Current">正在讀取本機專案…</div>
 <p class="v117-help">所有照片將逐張加密，包含高解析主圖（若有）及相容縮圖。匯出完成後請確認資料夾內的 .hwpack 檔案存在。檔案不會自動同步到其他裝置。</p>
 <label>設定至少 12 字元的備份密碼<input type="password" id="v117ExportPass" autocomplete="new-password" maxlength="200" placeholder="請使用不容易猜的長密碼"></label>
 <label>再次輸入密碼<input type="password" id="v117ExportAgain" autocomplete="new-password" maxlength="200" placeholder="確認密碼"></label>
 <div class="v117-actions"><button type="button" id="v117Export" class="v117-primary">① 製作加密備份檔</button><button type="button" id="v117Save" class="v117-primary" hidden>② 儲存到我的檔案夾</button></div>
 </div>
 <div id="v117ImportArea" hidden>
 <p class="v117-help">先選擇 .hwpack，輸入密碼。系統會驗證**所有照片**與專案版本並展示數量，驗證完成前絕不修改目前資料。</p>
 <label>選擇完整備份檔<input type="file" id="v117File" accept=".hwpack,application/octet-stream"></label>
 <label>備份密碼<input type="password" id="v117ImportPass" autocomplete="off" maxlength="200" placeholder="匯出時設定的密碼"></label>
 <button type="button" id="v117Inspect" class="v117-primary">檢查備份並預覽（不覆蓋）</button>
 <div id="v117Review" hidden><div class="v117-summary" id="v117ReviewText"></div>
 <p class="v117-danger">請先另存目前這台裝置的完整備份。還原是整份取代，不會合併不同裝置的修改。瀏覽器沒有跨 localStorage 與 IndexedDB 的單一交易，若儲存空間不足，必須重新核對照片與資料。</p>
 <label class="v117-confirm"><input id="v117Agreement" type="checkbox"> 我已保存目前專案備份，確定要使用這份檔案取代</label>
 <label>請輸入「覆蓋」兩字確認<input id="v117Typed" maxlength="2" autocomplete="off" placeholder="覆蓋"></label>
 <button type="button" id="v117Apply" class="v117-danger-btn">確認整份取代並還原照片</button></div>
 </div>
 <div class="v117-status" id="v117Status" role="status" aria-live="polite">準備就緒。舊版 .hwb 備份仍可由舊格式相容入口匯入。</div>
 <footer>本機作業，不上傳 Google Drive／Firebase／公開 GitHub。密碼不會儲存。請將備份檔與密碼分開保管。</footer>
 </section>`;
document.body.appendChild(ui);
const launch=el('button','v117-launch','▣ 完整專案備份');launch.id='v117Launch';launch.type='button';
const v116=$('v116Launch'),sidebar=$('v83EquipPanel'),top=$('v84BackupContents');if(v116)v116.after(launch);else sidebar?.prepend(launch);
const mobileBar=document.querySelector('.mobilebar');if(mobileBar){const m=el('button','v117-mobile','備份');m.type='button';m.addEventListener('click',open);mobileBar.appendChild(m);}
if(top){const direct=el('button','v117-direct','▣ V11.7 完整專案匯入／匯出');direct.type='button';direct.addEventListener('click',open);top.prepend(direct);
 const old=top.querySelector('.v92-card');if(old){const adv=el('details','v117-old'),sum=el('summary','', '舊版 .hwb 備份相容工具（點擊展開）');adv.append(sum,old);top.appendChild(adv);}}
const message=(s,bad=false)=>{$('v117Status').textContent=s;$('v117Status').dataset.error=bad?'true':'false';};
let mode='export',review=null,prepared=null,busy=false,priorFocus=null;
function counts(p){const c=core.totals(p);return `設備 ${c.devices} 台／管線 ${c.routes} 條／照片 ${c.photos} 張／照片標記 ${c.markers} 處\n系統節點 ${c.systems} 個／維修紀錄 ${c.maintenance} 筆／欄格關聯 ${c.stallLinks} 個`}
function setBusy(v){busy=!!v;ui.querySelectorAll('button').forEach(b=>{if(b.id!=='v117Close')b.disabled=busy;});$('v117Close').disabled=busy;}
function changeTab(next){if(busy)return;mode=next;review=null;prepared=null;$('v117Save').hidden=true;$('v117Review').hidden=true;$('v117ExportArea').hidden=next!=='export';$('v117ImportArea').hidden=next!=='import';$('v117ModeExport').classList.toggle('active',next==='export');$('v117ModeImport').classList.toggle('active',next==='import');$('v117Typed').value='';$('v117Agreement').checked=false;message(next==='export'?'請確認照片齊全並設定備份密碼。':'選擇 .hwpack 後先預覽，不會立刻覆蓋本機。');}
function open(){priorFocus=document.activeElement;ui.hidden=false;hw.setWorkspace('equipment');changeTab('export');try{const p=hw.getData();$('v117Current').textContent='目前裝置\n'+counts({...p,stallLinks:window.HWStallLinks?.getBackupData?.()});}catch(e){$('v117Current').textContent='無法讀取設備資料：'+e.message;}ui.querySelector('.v117-panel').focus();$('side')?.classList.remove('open');}
function close(){if(busy)return;ui.hidden=true;review=null;prepared=null;$('v117Save').hidden=true;$('v117ExportPass').value='';$('v117ExportAgain').value='';$('v117ImportPass').value='';$('v117File').value='';$('v117Typed').value='';priorFocus?.focus?.();}
launch.addEventListener('click',open);$('v117Close').onclick=close;
ui.addEventListener('click',e=>{if(e.target===ui)close();});document.addEventListener('keydown',e=>{if(!ui.hidden&&e.key==='Escape'){e.preventDefault();close();}});
$('v117ModeExport').onclick=()=>changeTab('export');$('v117ModeImport').onclick=()=>changeTab('import');$('v117File').onchange=()=>{review=null;$('v117Review').hidden=true;};
async function saveBlob(blob,name){
 // Desktop Chrome / Edge: explicitly choose a folder and filename.
 if(typeof window.showSaveFilePicker==='function'){
  const handle=await window.showSaveFilePicker({suggestedName:name,types:[{description:'虎尾場完整設備備份',accept:{'application/octet-stream':['.hwpack']}}]});
  const writable=await handle.createWritable();try{await writable.write(blob);await writable.close();}catch(e){try{await writable.abort();}catch(_){}throw e;}return'已寫入指定資料夾：'+handle.name;
 }
 // iPhone / iPad Safari: downloads go to Files / Downloads; can be moved afterwards.
 const href=URL.createObjectURL(blob);try{const a=document.createElement('a');a.href=href;a.download=name;document.body.appendChild(a);a.click();a.remove();}finally{setTimeout(()=>URL.revokeObjectURL(href),60000);}return'已啟動下載 '+name+'。請到「檔案」／下載項目確認檔案確實存在。';
}
function updater(s,n,total){message(s+(total?` （${n}/${total}）`:''));}
$('v117Export').onclick=async()=>{if(busy)return;try{
 if(hw.getRole()!=='admin')throw Error('請先切換本機管理者模式');
 const pass=$('v117ExportPass').value;if(pass!==$('v117ExportAgain').value)throw Error('兩次密碼不同');if(pass.length<12)throw Error('密碼至少 12 個字元');
 const state=hw.getStorageState?.();if(state?.dirty)message('注意：本機自動儲存失敗，將從記憶體建立緊急完整備份，完成後請立即確認下載。',true);
 prepared=null;$('v117Save').hidden=true;setBusy(true);
 const result=await core.exportArchive({project:hw.getData(),photos:media,stallCapacity:window.HWStallCapacity?.getBackupData?.(),stallLinks:window.HWStallLinks?.getBackupData?.(),password:pass,onProgress:updater});
 prepared=result;$('v117Save').hidden=false;
 $('v117ExportPass').value='';$('v117ExportAgain').value='';
 message('加密完成，請立即按 ②「儲存到我的檔案夾」。檔案大小：'+(result.blob.size/1048576).toFixed(1)+' MB；高解析原圖 '+result.master+' 張，僅縮圖 '+result.previewOnly+' 張。尚未儲存前請勿關閉此視窗。');
 }catch(e){message('匯出未完成：'+e.message,true);}finally{setBusy(false);}};
$('v117Save').onclick=async()=>{if(!prepared||busy)return;try{setBusy(true);const msg=await saveBlob(prepared.blob,prepared.name);message(msg+'\n保留密碼，並在另一台裝置測試還原後，才能視為有效備份。');}catch(e){message('尚未完成儲存：'+e.message+'；你仍可再次按下儲存按鈕。',true);}finally{setBusy(false);}};
$('v117Inspect').onclick=async()=>{if(busy)return;try{
 if(hw.getRole()!=='admin')throw Error('請先切換本機管理者模式');const file=$('v117File').files?.[0];if(!file)throw Error('請選擇 .hwpack 完整備份檔');
 setBusy(true);review=null;$('v117Review').hidden=true;
 const result=await core.inspectArchive({file,password:$('v117ImportPass').value,validateData:hw.validateData,onProgress:updater});
 review=result;$('v117ReviewText').textContent='這台裝置目前的資料：\n'+counts({...hw.getData(),stallLinks:window.HWStallLinks?.getBackupData?.()})+'\n\n即將還原的完整專案：\n'+counts({...result.validated.project,stallLinks:result.meta.project.stallLinks})+'\n\n備份日期：'+result.meta.createdAt+'\nCAD 版本指紋：'+result.meta.cadFingerprint.slice(0,16)+'…\n照片主圖與縮圖已逐項通過加密驗證及 SHA-256 驗證。';
 $('v117Agreement').checked=false;$('v117Typed').value='';$('v117Review').hidden=false;$('v117ImportPass').value='';
 message('整份備份驗證通過，目前尚未寫入任何裝置資料。');
 }catch(e){review=null;message('備份預覽失敗，原裝置資料未變動：'+e.message,true);}finally{setBusy(false);}};
$('v117Apply').onclick=async()=>{if(busy)return;try{
 if(hw.getRole()!=='admin')throw Error('請先切換本機管理者模式');if(!review)throw Error('請先重新驗證備份檔');
 if(!$('v117Agreement').checked||$('v117Typed').value.trim()!=='覆蓋')throw Error('請先勾選確認並輸入「覆蓋」');
 if($('v117File').files?.[0]!==review.file)throw Error('備份檔已更換，請重新預覽');
 setBusy(true);
 const result=await core.applyArchive(review,{importProject:data=>hw.importPrivateProject(data,'V11.7 完整可攜式備份'),restoreCapacity:window.HWStallCapacity?.restore,restoreLinks:window.HWStallLinks?.restore,onProgress:updater});
 message('已還原 '+result.devices+' 台設備、'+result.routes+' 條線路、'+result.photos+' 張照片。請關閉後開啟照片、CAD、母子系統及欄格關聯逐項核對。');review=null;$('v117Review').hidden=true;$('v117File').value='';$('v117Typed').value='';$('v117Agreement').checked=false;
 }catch(e){message('還原未完成：'+e.message+'。如曾開始寫入，請使用原裝置備份再做完整核對。',true);}finally{setBusy(false);}};
window.HWPortableUI={open,changeTab};
})();
