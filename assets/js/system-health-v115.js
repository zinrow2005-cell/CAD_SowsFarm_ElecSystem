/* V11.5 system health desk: read-only project validation, photo audit and quick actions.
 * No CAD geometry, device coordinates, or field verification flags are modified here.
 */
(function(){'use strict';
const hw=window.HWEquipment, photos=window.HWPhotoStore, stall=window.HWStallLinks;
if(!hw)return;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const today=()=>new Date().toISOString().slice(0,10);
const ui=el('div','v115-modal');ui.id='v115Modal';ui.hidden=true;
ui.innerHTML=`<section class="v115-panel" role="dialog" aria-modal="true" aria-labelledby="v115Title" tabindex="-1">
 <header class="v115-head"><div><small>HUWEI FARM · V11.5</small><h2 id="v115Title">系統健檢與快速作業</h2><p>確認本機資料、照片與設備關聯；不自動修改現場配置</p></div><button type="button" id="v115Close" aria-label="關閉系統健檢">✕</button></header>
 <div class="v115-stats" id="v115Stats"></div>
 <div class="v115-status" id="v115Storage" role="status"></div>
 <div class="v115-actions"><button id="v115Scan" type="button" class="v115-primary">⟳ 重新檢查關聯</button><button id="v115Photos" type="button">▣ 檢查本機照片</button><button id="v115Export" type="button">↓ 匯出健檢報告</button><button id="v115Retry" type="button">重試本機儲存</button><button id="v115Backup" type="button">🔐 加密完整備份</button><button id="v115Emergency" type="button" hidden>⚠ 緊急設備 JSON（不含照片）</button></div>
 <div class="v115-cols"><section><h3>資料異常與待核對項目</h3><div id="v115Issues" class="v115-issues"></div></section>
 <section><h3>現場快捷操作</h3><div id="v115Shortcuts"></div><h3>照片與備份狀態</h3><div id="v115PhotoStatus" class="v115-photo">照片存於本機 IndexedDB，請按「檢查本機照片」取得結果。</div></section></div>
 <footer class="v115-foot" id="v115Note">資料健檢不等於現場接線、供水、飼料管及施工安全已核對。員工模式只有檢視權限；管理者切換不是正式身分驗證。</footer>
 </section>`;
document.body.append(ui);
const $=id=>document.getElementById(id),btn=(label,action,cl)=>{const b=el('button',cl,label);b.type='button';b.addEventListener('click',action);return b;};
const aside=document.querySelector('.topline')||document.getElementById('side');
const entry=btn('✚ 系統健檢',()=>open(),'v115-open');entry.id='v115Launch';aside?.append(entry);
const mobile=document.querySelector('.mobilebar');if(mobile){const b=btn('健檢',()=>open(),'v115-mobilebtn');b.id='v115MobileLaunch';mobile.append(b);}
let visible=false,last=null,photoReport=null,lastFocus=null,photoBusy=false;
const addIssue=(problems,severity,code,text,kind,id)=>problems.push({severity,code,text,kind:kind||'',id:id||''});
function scanProject(project){
 const problems=[];const devices=project.devices||[],routes=project.routes||[],works=project.maintenance||[];
 const deviceIds=new Map(devices.map(d=>[d.id,d])),routeIds=new Map(routes.map(r=>[r.id,r]));
 const photoIds=new Map(),counts={devices:devices.length,routes:routes.length,maintenance:works.length,photos:0,unverified:0,linkedStalls:0};
 for(const d of devices){const terms=d.terminals||[],termIds=new Set();
  for(const t of terms){if(termIds.has(t.id))addIssue(problems,'error','DUPLICATE_TERMINAL',`${d.name}：端子編號重複 ${t.id}`,'device',d.id);termIds.add(t.id);}
  for(const t of terms)if(t.feedsFrom&&(!termIds.has(t.feedsFrom)||t.feedsFrom===t.id))addIssue(problems,'error','BROKEN_TERMINAL',`${d.name}：端子 ${t.name} 的箱內供電來源無效`,'device',d.id);
  // Directed cycles make a panel's internal supply impossible to trace reliably.
  const portMap=new Map(terms.map(t=>[t.id,t]));const colors=new Map();let cycle=false;
  function visit(id){const color=colors.get(id)||0;if(color===1){cycle=true;return;}if(color===2)return;colors.set(id,1);const next=portMap.get(id)?.feedsFrom;if(next&&portMap.has(next))visit(next);colors.set(id,2);}
  for(const id of portMap.keys())visit(id);
  if(cycle)addIssue(problems,'error','TERMINAL_CYCLE',`${d.name}：端子內部供電形成循環`,'device',d.id);
  for(const ph of d.photos||[]){counts.photos++;const owner=photoIds.get(ph.id);if(owner)addIssue(problems,'error','DUPLICATE_PHOTO',`照片 ${ph.id} 在不同設備重複引用`,'device',d.id);photoIds.set(ph.id,d.id);
   for(const mark of ph.markers||[])if(mark.terminalId&&!termIds.has(mark.terminalId))addIssue(problems,'error','PHOTO_MARKER',`${d.name}：照片標記連結已不存在的端子 ${mark.terminalId}`,'device',d.id);
  }
 }
 for(const r of routes){const a=deviceIds.get(r.fromDeviceId),b=deviceIds.get(r.toDeviceId);if(!a||!b)addIssue(problems,'error','ROUTE_ENDPOINT',`${r.name}：起點或終點設備不存在`,'route',r.id);
  if(a&&r.fromTerminalId&&!a.terminals?.some(t=>t.id===r.fromTerminalId))addIssue(problems,'error','ROUTE_PORT',`${r.name}：起點端子不存在`,'route',r.id);
  if(b&&r.toTerminalId&&!b.terminals?.some(t=>t.id===r.toTerminalId))addIssue(problems,'error','ROUTE_PORT',`${r.name}：終點端子不存在`,'route',r.id);
  const points=r.points||[];if(points[0]?.deviceId&&points[0].deviceId!==r.fromDeviceId||points.at(-1)?.deviceId&&points.at(-1).deviceId!==r.toDeviceId)addIssue(problems,'error','ROUTE_ANCHOR',`${r.name}：圖面兩端 ID 與設備關聯不一致`,'route',r.id);
  if(!r.confirmed){counts.unverified++;if(['water','electric','feed'].includes(r.group))addIssue(problems,'review','UNVERIFIED_ROUTE',`${r.name}：待現場核對`,'route',r.id);}
  else if(r.group==='electric'&&(!r.verifiedBy||!r.verifiedAt))addIssue(problems,'review','UNSIGNED_ROUTE',`${r.name}：標示已核對但未填核對人或日期`,'route',r.id);
 }
 for(const w of works){if(w.deviceId&&!deviceIds.has(w.deviceId))addIssue(problems,'error','WORK_DEVICE',`${w.title}：維修單引用已刪除設備`,'work',w.id);
  if(w.routeId&&!routeIds.has(w.routeId))addIssue(problems,'error','WORK_ROUTE',`${w.title}：維修單引用已刪除管線`,'work',w.id);
  if(w.photoId&&!deviceIds.get(w.deviceId)?.photos?.some(p=>p.id===w.photoId))addIssue(problems,'error','WORK_PHOTO',`${w.title}：維修佐證照片不存在於關聯設備`,'work',w.id);
  if(!w.archived&&w.status!=='done'&&w.dueDate&&w.dueDate<today())addIssue(problems,'review','OVERDUE_WORK',`${w.title}：維修單已逾期`,'work',w.id);
 }
 const s=stall?.getState?.();if(s?.bindings){const validStalls=new Set(stall.getKnownIds?.()||[]);
  for(const [id,ids] of Object.entries(s.bindings)){if(!deviceIds.has(id))addIssue(problems,'error','STALL_DEVICE',`欄格綁定引用不存在設備 ${id}`,'device',id);
   for(const stallId of ids){counts.linkedStalls++;if(!validStalls.has(stallId))addIssue(problems,'error','STALL_ID',`設備 ${deviceIds.get(id)?.name||id} 綁定未知欄格 ${stallId}`,'device',id);}
  }
 }
 const state=hw.getStorageState?.()||{};
 if(state.dirty)addIssue(problems,'error','UNSAVED_PROJECT','瀏覽器本機儲存失敗，最新更動尚未保存');
 return {version:'V11.5',checkedAt:new Date().toISOString(),counts,storage:state,problems};
}
function display(){if(!last)return;const n=last.counts,errors=last.problems.filter(i=>i.severity==='error').length,reviews=last.problems.filter(i=>i.severity==='review').length;
 $('v115Stats').replaceChildren();for(const [count,label] of [[n.devices,'設備'],[n.routes,'管線'],[n.maintenance,'工作單'],[n.photos,'照片索引'],[errors,'資料異常'],[reviews,'待核對']]){const card=el('div','v115-stat');card.append(el('strong','',count),el('small','',label));$('v115Stats').append(card);}
 const storage=last.storage||{};const saved=storage.lastSavedAt?new Date(storage.lastSavedAt).toLocaleString('zh-TW'):'尚未記錄本次儲存時間';$('v115Storage').textContent=storage.dirty?'⚠️ 本機儲存失敗：'+(storage.error||'未知原因')+'。請勿關閉，先使用私人完整備份。':'✓ 本機資料未被標記為儲存失敗；最近一次寫入：'+saved+'。請定期以加密檔案離線備份。';$('v115Storage').dataset.dirty=storage.dirty?'true':'false';$('v115Emergency').hidden=!storage.dirty||hw.getRole()!=='admin';
 const issues=$('v115Issues');issues.replaceChildren();if(!last.problems.length)issues.append(el('p','v115-empty','目前未發現程式可辨識的資料關聯異常。這不代表現場設備及管線已完成核對。'));
 for(const i of last.problems.slice(0,60)){const b=btn(`${i.severity==='error'?'⚠':'○'} ${i.text}`,()=>locate(i),'v115-issue '+(i.severity==='error'?'v115-error':'v115-review'));issues.append(b);}
 if(last.problems.length>60)issues.append(el('p','v115-muted',`只顯示前 60 項，共 ${last.problems.length} 項；可匯出完整報告。`));
 const short=$('v115Shortcuts');short.replaceChildren();const sel=hw.getSelected();const canEdit=hw.getRole()==='admin';const selected=sel?.kind==='device'&&hw.getData().devices.some(d=>d.id===sel.id);
 const chosen=selected?hw.getData().devices.find(d=>d.id===sel.id):null;const quick=btn(chosen?'＋ 為「'+chosen.name+'」建立維修單':'＋ 建立維修／巡檢單',()=>{if(!canEdit)return;close();if(selected)window.HWFarmOpsV114?.newWork?.(sel.id);else window.HWFarmOpsV114?.open?.();},'v115-primary');quick.disabled=!canEdit;short.append(quick);
 short.append(btn('⌕ 全場設備搜尋',()=>{close();window.HWFarmOpsV114?.open?.();}));
 short.append(btn('○ 前往 CAD 圖面',()=>{close();hw.setWorkspace?.('equipment');}));
 if(!canEdit)short.append(el('p','v115-muted','員工檢視模式無法建立工作單或匯入資料。'));
 $('v115Export').disabled=!canEdit;
}
function locate(issue){close();if(issue.kind==='work')return window.HWFarmOpsV114?.showWork?.(issue.id);
 if(issue.kind==='device'){const data=hw.getData(),d=data.devices.find(x=>x.id===issue.id);if(!d)return window.HWFarmOpsV114?.open?.();hw.setWorkspace?.('equipment');hw.select('device',d.id);hw.focus(d.x,d.y);return;}
 if(issue.kind==='route'){const r=hw.getData().routes.find(x=>x.id===issue.id);if(!r)return;hw.setWorkspace?.('equipment');hw.select('route',r.id);const p=r.points[Math.floor(r.points.length/2)];if(p)hw.focus(p.x,p.y);}
}
function scan(){last=scanProject(hw.getData());display();return last;}
function open(){lastFocus=document.activeElement;visible=true;ui.hidden=false;scan();ui.querySelector('.v115-panel').focus();}
function close(){visible=false;ui.hidden=true;lastFocus?.focus?.();}
async function auditPhotos(){if(photoBusy)return;photoBusy=true;$('v115Photos').disabled=true;$('v115PhotoStatus').textContent='正在逐張檢查本機照片主圖及縮圖…';
 try{if(!photos?.audit)throw Error('照片檢查模組未載入');photoReport=await photos.audit(hw.getData());$('v115PhotoStatus').textContent=`照片索引 ${photoReport.total} 張：高解析主圖 ${photoReport.master}、舊版縮圖 ${photoReport.previewOnly}、缺失 ${photoReport.missing}。`+(photoReport.missing?' ⚠ 部分照片在本裝置找不到，勿認為備份已完整。':' 本機照片可讀，不代表其他裝置已同步。');}
 catch(e){photoReport={error:e.message};$('v115PhotoStatus').textContent='⚠ 檢查失敗：'+e.message;}finally{photoBusy=false;$('v115Photos').disabled=false;}
}
function saveReport(){if(!last||hw.getRole()!=='admin')return;const report={...last,photoAudit:photoReport,notice:'僅為已建檔資料核對，不代表已確認現場接線、管線或設備狀態。'};
 const blob=new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='虎尾場_V11.5_全系統健檢_'+today()+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),8000);}
$('v115Close').onclick=close;ui.addEventListener('click',e=>{if(e.target===ui)close();});
window.addEventListener('keydown',e=>{if(visible&&e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}});
$('v115Scan').onclick=()=>{photoReport=null;$('v115PhotoStatus').textContent='資料已重新掃描。照片仍需按「檢查本機照片」檢測。';scan();};
$('v115Photos').onclick=auditPhotos;$('v115Export').onclick=saveReport;
$('v115Retry').onclick=()=>{if(hw.getRole()!=='admin'){alert('請先切換管理者本機編輯模式');return;}hw.retryStorageSave?.();scan();};
$('v115Backup').onclick=()=>{if(hw.getRole()!=='admin'){alert('請先切換管理者本機編輯模式');return;}close();if(window.HWPortableUI?.open)window.HWPortableUI.open();else document.getElementById('v92Export')?.click();};
$('v115Emergency').onclick=()=>{
 if(hw.getRole()!=='admin'||!hw.getStorageState()?.dirty)return;
 if(!confirm('緊急 JSON 是「未加密」且「不包含照片原檔」，不可放到公開 GitHub。此檔只用來保存當前尚未成功寫入本機的設備、管線及工單資料，不能取代私人完整加密備份。確定下載？'))return;
 const raw=hw.getData();raw.stallCapacity=window.HWStallCapacity?.getBackupData?.();raw.stallLinks=stall?.getBackupData?.();
 const blob=new Blob([JSON.stringify(raw,null,2)+'\n'],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),link=el('a');link.href=url;link.download='虎尾場_緊急設備資料_無照片_未加密_'+today()+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 $('v115Storage').textContent='已啟動緊急設備 JSON 下載；此檔不含照片、不加密。請確認下載成功並另行保存私人完整備份。';
};
window.addEventListener('hw-v101-storage',()=>{if(visible)scan();});
window.HWSystemHealthV115={version:'11.5',open,close,scan,scanProject,auditPhotos,getReport:()=>last?JSON.parse(JSON.stringify({...last,photoAudit:photoReport})):null};
})();
