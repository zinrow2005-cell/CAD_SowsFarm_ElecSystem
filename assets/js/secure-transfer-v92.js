/* V9.2: authenticated, password-encrypted manual handoff. No server, no credentials in app. */
(function(){'use strict';
const api=window.HWEquipment,photos=window.HWPhotoStore;
const host=document.getElementById('v84BackupContents');
if(!api||!photos||!host)return;
const $=id=>document.getElementById(id);
const enc=new TextEncoder(),dec=new TextDecoder();
const ui=document.createElement('section');ui.className='v92-card';
ui.innerHTML=`<h3>🔐 V9.2 私人加密備份與跨裝置交接</h3><p>將設備、迴路、照片、照片標記與 V10.4 欄位配置一起加密，手動帶到另一台裝置還原。不需要帳號，但也不是雲端即時同步。密碼僅在這次操作使用，不會儲存。</p>
<div class="v92-actions"><button id="v92Check" type="button">檢查照片與迴路</button><button class="v92-primary" id="v92Export" type="button">↓ 加密完整備份</button><button id="v92Import" type="button">↑ 匯入加密備份</button></div><div class="v92-summary" id="v92Summary" role="status">按「檢查照片與迴路」可查看目前本機資料完整度。</div>
<p class="v92-warning">重要：請勿將私人備份、密碼或設備照片上傳公開 GitHub。匯入會取代本裝置的整份設備專案；請先備份目前資料。忘記密碼無法解密。</p>
<input type="file" id="v92File" accept=".hwb,.json,application/json" hidden>`;
host.prepend(ui);
// Keep backward compatibility without presenting plaintext exports as the safe default.
const legacyExport=$('eqExport'),legacyImport=$('eqImport'),legacyFile=$('eqImportFile');
if(legacyExport&&legacyImport){
 const advanced=document.createElement('details');advanced.className='v92-legacy';
 advanced.innerHTML='<summary>進階：舊版未加密 JSON（僅供相容）</summary><p>以下檔案未加密，可能含照片與配電資訊。避免公開傳送；優先使用上方加密備份。</p>';
 host.appendChild(advanced);
 advanced.appendChild(legacyExport);advanced.appendChild(legacyImport);
 if(legacyFile)advanced.appendChild(legacyFile);
}

const modal=document.createElement('div');modal.id='v92Modal';modal.className='v92-dialog';modal.hidden=true;
modal.innerHTML=`<section class="v92-dialog-content" role="dialog" aria-modal="true" aria-labelledby="v92Title">
<h2 id="v92Title">私人備份</h2><p id="v92Intro"></p>
<div id="v92PasswordArea"><label for="v92Password">加密密碼（至少 12 個字元）</label><input id="v92Password" type="password" autocomplete="off" maxlength="200" placeholder="請輸入本次備份的私人密碼"/>
<div id="v92ConfirmArea"><label for="v92PasswordAgain">再次輸入密碼</label><input id="v92PasswordAgain" type="password" autocomplete="off" maxlength="200" placeholder="再輸入一次，確保不會輸錯"/></div></div>
<div id="v92Preview" class="v92-conflicts" hidden></div>
<label id="v92UnderstandRow" hidden><input type="checkbox" id="v92Understand"/> 我已備份本機目前資料，並確認要用匯入檔案「整份覆蓋」目前設備、迴路與照片記錄。</label>
<div id="v92Progress" class="v92-message" role="status"></div>
<div class="v92-footer"><button type="button" id="v92Cancel">取消</button><button type="button" class="primary" id="v92Confirm">繼續</button></div>
</section>`;
document.body.appendChild(modal);
let mode='',file=null,payload=null,busy=false;
const MAX_FILE=125*1024*1024,MAX_PLAIN=80*1024*1024;
function counts(project){const devices=project?.devices||[],routes=project?.routes||[];return{devices:devices.length,routes:routes.length,terminals:devices.reduce((n,d)=>n+(d.terminals||[]).length,0),photos:devices.reduce((n,d)=>n+(d.photos||[]).length,0),pins:devices.reduce((n,d)=>n+(d.photos||[]).reduce((m,p)=>m+(p.markers||[]).length,0),0),templates:(project?.templates||[]).length,systems:(project?.systemNodes||[]).length};}
function fmt(c){return`設備 ${c.devices} 台／點 · 管線 ${c.routes} 條\n開關與端子 ${c.terminals} 個 · 設備照片 ${c.photos} 張 · 照片標記 ${c.pins} 個 · 設備樣式模板 ${c.templates} 個 · 母子系統 ${c.systems||0} 個`;}
function setMsg(str){$('v92Progress').textContent=str;}
function busyMode(on){busy=on;$('v92Confirm').disabled=on;$('v92Cancel').disabled=on;}
function clearSecrets(){$('v92Password').value='';$('v92PasswordAgain').value='';payload=null;file=null;$('v92File').value='';}
function close(){if(busy)return;modal.hidden=true;clearSecrets();}
function show(next){mode=next;modal.hidden=false;busyMode(false);setMsg('');$('v92Preview').hidden=true;$('v92UnderstandRow').hidden=true;$('v92Understand').checked=false;$('v92PasswordArea').hidden=false;
 $('v92ConfirmArea').hidden=next!=='export';$('v92Title').textContent=next==='export'?'建立加密私人備份':next==='import'?'解密私人備份':'確認整份覆蓋本機專案';$('v92Confirm').textContent=next==='export'?'加密並下載':next==='import'?'解密與預覽':'確認覆蓋匯入';
 $('v92Intro').textContent=next==='export'?'檔案包含照片、開關、端子及迴路等完整私有資料。請設定長密碼並在安全位置記住；密碼不會傳至任何伺服器。':next==='import'?'先輸入加密備份密碼，系統解密後會顯示數量比對，不會立刻覆蓋資料。':'請仔細比對來源與本機資料，整份覆蓋後才能使用匯入的點位和照片。';
 if(next==='review')$('v92PasswordArea').hidden=true;
 setTimeout(()=>(next==='review'?'v92Confirm':'v92Password')&&$(next==='review'?'v92Confirm':'v92Password').focus(),0);
}
const safeCrypto=()=>!!(window.crypto&&window.crypto.subtle&&window.crypto.getRandomValues)&&window.isSecureContext;
function asB64(bytes){const chunk=16384;let parts=[];for(let i=0;i<bytes.length;i+=chunk)parts.push(String.fromCharCode(...bytes.subarray(i,i+chunk)));return btoa(parts.join(''));}
function fromB64(s){if(typeof s!=='string'||s.length>MAX_FILE*2)throw Error('加密資料長度異常');const str=atob(s),a=new Uint8Array(str.length);for(let i=0;i<str.length;i++)a[i]=str.charCodeAt(i);return a;}
async function key(pass,salt,iterations){const source=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},source,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function seal(body,pass){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),iterations=260000;
 const k=await key(pass,salt,iterations),cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,enc.encode(body)));
 return JSON.stringify({format:'HuweiPrivateBackup',schema:1,kdf:'PBKDF2-SHA256',iterations,salt:asB64(salt),cipher:'AES-256-GCM',iv:asB64(iv),payload:asB64(cipher)});
}
async function unseal(raw,pass){let e;try{e=JSON.parse(raw);}catch(_err){throw Error('這不是有效的 V9.2 加密備份檔');}
 if(e?.format!=='HuweiPrivateBackup'||e.schema!==1||e.kdf!=='PBKDF2-SHA256'||e.cipher!=='AES-256-GCM'||e.iterations!==260000)throw Error('不支援或不完整的加密備份格式');
 const salt=fromB64(e.salt),iv=fromB64(e.iv),blob=fromB64(e.payload);if(salt.length!==16||iv.length!==12||blob.length>MAX_PLAIN+4096)throw Error('備份檔案的加密參數異常');
 try{const k=await key(pass,salt,e.iterations);return dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},k,blob));}catch(_err){throw Error('密碼錯誤、檔案損毀，或加密驗證未通過');}
}
function download(textBody,name){const blob=new Blob([textBody],{type:'application/octet-stream'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);}
// V10.2: conservative audit — invalid references never count as a verified connection.
function inspect(project){
 let badTerminal=0,badPhotoMarker=0,badEndpoints=0,unverified=0,routePointMismatch=0,duplicatePhotoIds=0;
 const ds=new Map(project.devices.map(d=>[d.id,d]));const photoIds=new Set();
 for(const d of project.devices){
  const ports=d.terminals||[],terminals=new Set(ports.map(t=>t.id));
  for(const ph of d.photos||[]){
   if(photoIds.has(ph.id))duplicatePhotoIds++;photoIds.add(ph.id);
   for(const mark of ph.markers||[])if(mark.terminalId&&!terminals.has(mark.terminalId))badPhotoMarker++;
  }
  for(const t of ports)if(t.feedsFrom&&(!terminals.has(t.feedsFrom)||t.feedsFrom===t.id))badTerminal++;
 }
 for(const r of project.routes){
  const from=ds.get(r.fromDeviceId),to=ds.get(r.toDeviceId);
  if(!from||!to||(r.fromTerminalId&&!from.terminals?.some(t=>t.id===r.fromTerminalId))||(r.toTerminalId&&!to.terminals?.some(t=>t.id===r.toTerminalId)))badEndpoints++;
  if(r.points?.length){
   const first=r.points[0],last=r.points[r.points.length-1];
   if(first.deviceId&&r.fromDeviceId&&first.deviceId!==r.fromDeviceId||last.deviceId&&r.toDeviceId&&last.deviceId!==r.toDeviceId)routePointMismatch++;
  }
  if(!r.confirmed)unverified++;
 }
 return{badTerminal,badPhotoMarker,badEndpoints,unverified,routePointMismatch,duplicatePhotoIds};
}
async function checkLocal(){
 const p=api.getData(),s=counts(p),issues=inspect(p);let missing=0,complete=0;
 for(const d of p.devices)for(const ph of d.photos||[]){const img=await photos.get(ph.id).catch(()=>null);if(img)complete++;else missing++;}
 const photoAudit=photos.audit?await photos.audit(p):null;const message=`${fmt(s)}\n照片：${photoAudit?`${photoAudit.master} 張高解析主圖、${photoAudit.previewOnly} 張舊版縮圖、${photoAudit.missing} 張缺檔`:`${complete} 張可讀、${missing} 張缺檔`}\n照片標記缺少端子：${issues.badPhotoMarker} · 端子內部來源問題：${issues.badTerminal}\n線路設備／端子缺漏：${issues.badEndpoints} · 線路兩端 ID 不一致：${issues.routePointMismatch}\n照片 ID 重複：${issues.duplicatePhotoIds} · 待現場核對線路：${issues.unverified}\n未核對線路可備份，但絕不可視為現場已確認。`;
 $('v92Summary').textContent=message;return{missing,issues};
}
async function sha256(value){const bytes=enc.encode(value);const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));return Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');}
async function makePhotoManifest(project){const results=[];for(const a of project.photoAssets||[])results.push({id:a.id,sha256:await sha256(a.dataUrl),...(a.originalDataUrl?{originalSha256:await sha256(a.originalDataUrl)}:{})});return results;}
async function verifyPhotoManifest(project){
 if(!Array.isArray(project.photoManifest))return; // Accept older V9.2-V10.1 backups.
 const manifest=new Map();for(const a of project.photoManifest){if(typeof a?.id!=='string'||!/^[a-f0-9]{64}$/.test(a.sha256)||manifest.has(a.id))throw Error('照片完整性清單錯誤或重複');if(a.originalSha256!==undefined&&!/^[a-f0-9]{64}$/.test(a.originalSha256))throw Error('主圖雜湊格式錯誤');manifest.set(a.id,{sha256:a.sha256,originalSha256:a.originalSha256});}
 const assets=project.photoAssets||[];
 if(manifest.size!==assets.length)throw Error('照片清單數量與雜湊核對不一致');
 for(const a of assets){const record=manifest.get(a.id);if(!record||await sha256(a.dataUrl)!==record.sha256)throw Error('縮圖完整性驗證失敗：'+a.id);if(record.originalSha256&&(typeof a.originalDataUrl!=='string'||await sha256(a.originalDataUrl)!==record.originalSha256))throw Error('高解析照片完整性驗證失敗：'+a.id);if(a.originalDataUrl&&!record.originalSha256)throw Error('高解析照片缺少完整性雜湊：'+a.id);}
}
$('v92Check').addEventListener('click',async()=>{const b=$('v92Check');b.disabled=true;try{await checkLocal();}catch(e){$('v92Summary').textContent='檢查失敗：'+e.message;}finally{b.disabled=false;}});
$('v92Export').addEventListener('click',()=>{if(api.getRole()!=='admin'){alert('請先切換管理者本機編輯模式');return;}if(!safeCrypto()){alert('加密備份需要 HTTPS 或 localhost 瀏覽器環境；請使用 GitHub Pages HTTPS 網址。');return;}show('export');});
$('v92Import').addEventListener('click',()=>{if(api.getRole()!=='admin'){alert('請先切換管理者本機編輯模式');return;}if(!safeCrypto()){alert('加密備份需要 HTTPS 或 localhost 瀏覽器環境');return;}$('v92File').click();});
$('v92File').addEventListener('change',e=>{file=e.target.files?.[0]||null;if(!file)return;if(file.size>MAX_FILE){alert('備份檔案過大（上限 125 MB）');file=null;return;}show('import');});
$('v92Cancel').addEventListener('click',close);modal.addEventListener('click',e=>{if(e.target===modal)close();});
modal.addEventListener('keydown',e=>{if(e.key==='Escape'&&!busy){e.preventDefault();e.stopPropagation();close();}if(e.key==='Enter'&&e.target.tagName==='INPUT'&&!busy){e.preventDefault();$('v92Confirm').click();}});
$('v92Confirm').addEventListener('click',async()=>{if(busy)return;try{
 if(mode==='export'){
  const pass=$('v92Password').value,again=$('v92PasswordAgain').value;if(pass.length<12)throw Error('加密密碼至少要有 12 個字元');if(pass!==again)throw Error('兩次輸入的密碼不一致');
  busyMode(true);setMsg('正在檢查照片並建立加密檔案…');
  const report=await checkLocal();if(report.missing||report.issues.duplicatePhotoIds)throw Error('照片原檔缺失或編號重複，請先修正後再備份');
  const data=await photos.withAssets(api.getData());if(window.HWStallCapacity)data.stallCapacity=window.HWStallCapacity.getBackupData();if(window.HWStallLinks)data.stallLinks=window.HWStallLinks.getBackupData();data.photoManifest=await makePhotoManifest(data);await verifyPhotoManifest(data);const text=JSON.stringify(data);if(enc.encode(text).length>MAX_PLAIN)throw Error('包含照片的備份超過 80 MB，請分批整理照片');
  setMsg('正在以 AES-256-GCM 加密（此動作只在本裝置執行）…');const sealed=await seal(text,pass);
  download(sealed,'虎尾場_私人加密備份_V9.2_'+new Date().toISOString().slice(0,10)+'.hwb');$('v92Summary').textContent='已啟動加密私人備份檔案下載：'+fmt(counts(data))+'\n請把檔案與密碼分開保管。';busyMode(false);close();
 }else if(mode==='import'){
  const pass=$('v92Password').value;if(!pass)throw Error('請輸入備份密碼');if(!file)throw Error('未選擇加密備份');
  busyMode(true);setMsg('正在驗證檔案並解密…');const plain=await unseal(await file.text(),pass);if(enc.encode(plain).length>MAX_PLAIN)throw Error('解密資料過大');
  let parsed;try{parsed=JSON.parse(plain);}catch(_e){throw Error('解密內容不是有效 JSON');}
  if(parsed.app!=='HuweiEquipment'||!Array.isArray(parsed.photoAssets))throw Error('備份不含完整私人照片清單或專案格式錯誤');
  const sanitized=api.validateData(parsed);
  const expected=[...new Set(sanitized.devices.flatMap(d=>(d.photos||[]).map(p=>p.id)))];const backed=new Map();for(const a of parsed.photoAssets){if(!a||typeof a.id!=='string'||backed.has(a.id))throw Error('照片資料重複或異常');backed.set(a.id,a);}
  if(expected.some(id=>!backed.has(id))||backed.size!==expected.length)throw Error('備份照片編號與設備照片清單不完全一致，已拒絕匯入');
  await verifyPhotoManifest(parsed);
  if(parsed.stallCapacity&&window.HWStallCapacity)window.HWStallCapacity.validateBackupData(parsed.stallCapacity);
  if(parsed.stallLinks&&window.HWStallLinks){window.HWStallLinks.validateBackupData(parsed.stallLinks);const all=new Set(sanitized.devices.map(d=>d.id));if(Object.keys(parsed.stallLinks.bindings||{}).some(id=>!all.has(id)))throw Error('欄格綁定指向備份內不存在的設備，拒絕還原');}
  payload=parsed;const before=counts(api.getData()),after=counts(sanitized);
  $('v92Preview').textContent='本機目前資料：\n'+fmt(before)+'\n\n解密後備份資料：\n'+fmt(after)+'\n\n欄位配置：'+(parsed.stallCapacity?'含 V10.4 2 欄預留與手動排別定位':'舊版備份不含欄位配置，原本本機欄位設定會保留')+'\n\n欄格設備關聯：'+(parsed.stallLinks?'含 V10.9 欄格與設備關聯':'舊版備份不含 V10.9 關聯，還原後會清空本機關聯，避免錯連')+'\n\n備份更新時間：'+(sanitized.updatedAt||'未記錄')+'\n\n注意：此操作「整份覆蓋」，不會自動合併兩台裝置的不同修改。';
  $('v92Preview').hidden=false;mode='review';$('v92Title').textContent='匯入前確認資料';$('v92Intro').textContent='備份已成功解密，但還沒有更動本機資料。請確認資料數量並先為本機另存一份備份。';$('v92PasswordArea').hidden=true;$('v92UnderstandRow').hidden=false;$('v92Confirm').textContent='確認整份覆蓋匯入';setMsg('解密驗證完成，請核對備份與本機資料。');busyMode(false);
 }else if(mode==='review'){
  if(!$('v92Understand').checked)throw Error('請先確認已備份並同意整份覆蓋');if(!payload)throw Error('備份資料已失效，請重新匯入');
  busyMode(true);setMsg('正在保存照片與專案，請勿關閉視窗…');const result=await api.importPrivateProject(payload);
  if(payload.stallCapacity&&window.HWStallCapacity){const status=window.HWStallCapacity.restore(payload.stallCapacity);if(!status.ok)throw Error('設備已還原，但欄位設定未能保存：'+status.reason);}
  if(window.HWStallLinks){const status=window.HWStallLinks.restore(payload.stallLinks||{bindings:{}});if(!status.ok)throw Error('設備已還原，但欄格關聯儲存失敗：'+status.reason);}
  $('v92Summary').textContent='已還原加密私人備份：設備 '+result.devices+'、管線 '+result.routes+'、照片 '+result.photos+'。請再按「檢查照片與迴路」確認。';busyMode(false);close();
 }
 }catch(err){busyMode(false);setMsg('操作未完成：'+err.message);}
});
window.HWSecureTransfer={counts,inspect,seal,unseal,checkLocal,makePhotoManifest,verifyPhotoManifest};
})();
