/* 虎尾母豬場 V9.4 - optional encrypted cloud snapshots via Firebase.
 * Google sign-in + Firestore ACL + Storage; all plaintext stays on device.
 * Cloud is opt-in. Without a Firebase project V9.2's offline features remain unchanged.
 */
(function(){'use strict';
const hw=window.HWEquipment,media=window.HWPhotoStore,crypt=window.HWSecureTransfer;
const host=document.getElementById('v83EquipPanel');
if(!host||!hw||!media||!crypt)return;
const $=id=>document.getElementById(id);
const enc=new TextEncoder();
const cfgKey='hw-v93-firebase-config',ownerKey='hw-v93-owner-uid';
const section=document.createElement('section');section.className='v93-cloud';section.innerHTML=`
 <div class="v93-heading"><span class="v93-ico">☁</span><div><h3>V9.4 安全雲端協作</h3><p>雲端更新提醒 · 版本衝突防護 · 加密自動快照 · 離線仍可用</p></div></div>
 <div class="v93-status" id="v93Status" role="status">未連接雲端｜本機功能可正常使用</div>
 <details id="v93Setup" class="v93-config"><summary>① 初次設定 Firebase 專案</summary>
 <p>先在 Firebase 建立網頁應用程式，啟用 Google 登入、Firestore、Storage，並部署隨壓縮檔提供的兩份安全規則。下方填入網頁設定 JSON（不是管理員私密金鑰）。</p>
 <label>Firebase 網頁設定 JSON<textarea rows="4" id="v93Config" spellcheck="false" placeholder='{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","appId":"..."}'></textarea></label>
 <button id="v93SaveConfig" type="button">儲存並初始化 Firebase</button>
 <p class="v93-hint">須先在 Firebase Authentication 加入你的 GitHub Pages 網域為 Authorized domains。Firebase 設定不是密碼，但請勿在此填入 serviceAccount 私密金鑰。</p></details>
 <div class="v93-account"><button type="button" id="v93Login">使用 Google 帳號登入</button><button type="button" id="v93Logout" hidden>登出</button><small id="v93Identity">尚未登入</small></div>
 <label class="v93-owner">② 工作區（管理者填自己的 UID；員工填管理者提供的 UID）
 <input id="v93Workspace" placeholder="工作區擁有者 UID" autocomplete="off" maxlength="128"/></label>
 <div class="v93-buttons"><button type="button" id="v93Create">建立我的私人工作區</button><button type="button" id="v93Connect">進入工作區</button></div>
 <div id="v93WorkspaceInfo" class="v93-hint">尚未連接工作區。</div>
 <section id="v94SyncPanel" class="v94-sync-panel" hidden aria-label="雲端同步狀態">
  <div class="v94-sync-head"><strong>V9.4 版本同步與防衝突</strong><span id="v94SyncBadge">檢查中</span></div>
  <p id="v94SyncMessage" class="v94-sync-message" role="status">連接後檢查本機與雲端版本。</p>
  <div class="v94-version-row"><span>本機上次核對：<b id="v94LocalVersion">尚未建立基準</b></span><span>雲端主版本：<b id="v94RemoteVersion">讀取中</b></span></div>
  <div class="v94-sync-buttons"><button type="button" id="v94CheckRemote">檢查雲端更新</button><button type="button" id="v94Acknowledge">我已核對，設為同步基準</button></div>
  <label class="v94-auto"><input id="v94Auto" type="checkbox"/> 本分頁啟用加密自動備份（僅管理者）</label>
  <p class="v93-hint">啟用前須填寫下方兩次加密密碼。密碼只保留於目前頁面的記憶體，重新開啟必須再次輸入；遇到雲端版本變動立即暫停上傳，絕不自動還原覆蓋本機。</p>
  <div class="v94-auto-actions"><button id="v94StopAuto" type="button" hidden>停止本次自動備份</button><small id="v94AutoHint">尚未開啟自動備份</small></div>
 </section>
 <div class="v93-work" id="v93Work" hidden>
  <div class="v93-summary-row"><strong>③ 加密雲端快照</strong><button type="button" id="v93Refresh">更新清單</button></div>
  <div class="v93-upload" id="v93OwnerActions" hidden>
   <label>加密密碼（至少 12 字元，不會上傳至 Firebase）<input id="v93EncryptPass" type="password" minlength="12" autocomplete="new-password" placeholder="本次快照的私人密碼"/></label>
   <label>再次確認密碼<input id="v93EncryptAgain" type="password" minlength="12" autocomplete="new-password" placeholder="再次輸入"/></label>
   <button type="button" id="v93Upload" class="v93-primary">↑ 將完整照片與迴路加密上傳</button>
   <p class="v93-hint">每次上傳都建立獨立快照，不會覆蓋舊版本。若照片原檔缺失，會拒絕上傳。</p>
  </div>
  <div id="v93Snapshots" class="v93-snapshots">尚無快照資訊。</div>
  <div class="v93-restore" id="v93Restore" hidden>
   <strong id="v93RestoreTitle">還原雲端快照</strong>
   <label>此快照的解密密碼<input id="v93RestorePass" type="password" autocomplete="off" placeholder="備份時設定的密碼"/></label>
   <button type="button" id="v93PreviewRestore">下載、解密並核對內容</button>
   <div id="v93Compare" class="v93-compare" hidden></div>
   <label id="v93AgreementWrap" hidden><input id="v93Agreement" type="checkbox"/> 我已另行備份目前裝置資料，並確認整份覆蓋，不自動合併不同裝置的修改。</label>
   <div class="v93-buttons"><button type="button" id="v93Apply" disabled class="v93-primary">確認還原到此裝置</button><button type="button" id="v93Cancel">取消</button></div>
  </div>
  <details id="v93Members" class="v93-config" hidden><summary>④ 授權員工唯讀存取</summary>
   <p>請員工先使用 Google 登入，再請他提供畫面上的 UID。只有受邀者能讀取加密快照；修改權只屬於建立工作區的管理者。</p>
   <label>員工 UID<input id="v93MemberUid" autocomplete="off" placeholder="貼上員工 Firebase UID"/></label><button type="button" id="v93Invite">新增／啟用唯讀員工</button>
   <div id="v93MemberList"></div></details>
 </div>
 <p class="v93-hint v93-bottom">雲端資料一律先在瀏覽器加密。Firebase 只保存密文與非敏感時間／檔案大小資訊。沒有雲端設定時可繼續用 V9.2 加密備份。</p>`;
const cloudPanel=document.createElement('details');cloudPanel.id='v93CloudPanel';cloudPanel.className='v93-cloud-panel';cloudPanel.innerHTML='<summary>☁ 雲端資料與授權 <small>Google 登入／加密快照</small></summary>';cloudPanel.appendChild(section);host.prepend(cloudPanel);

let fb=null,app=null,auth=null,db=null,storage=null,user=null,workspace='',isOwner=false,accepted=false,busy=false,currentSnapshot=null,previewData=null,previewSignature='';
let listCached=[];
// V9.4: append-only immutable snapshots + a transaction-guarded latest-version pointer.
// Passwords are never persisted. Older V9.3 snapshots remain readable.
let headId='',headRevision=0,legacyBase='',knownBase=null,autoPassword='',autoEnabled=false,lastLocalSignature='',lastUploadedSignature='',autoLastAt=0,autoSaving=false,polling=null,observedWorkspace='';
let pendingConflict=false;
const localBaseKey=()=>`hw-v94-sync-base:${workspace}:${user?.uid||''}`;
const localSigKey=()=>`hw-v94-sync-signature:${workspace}:${user?.uid||''}`;
const baseTitle=id=>id?id.slice(0,14):'尚無雲端版本';
const getSignature=()=>{const d=hw.getData(),cap=window.HWStallCapacity?.getState?.();return [d.updatedAt||'',d.devices?.length||0,d.routes?.length||0,d.templates?.length||0,cap?.updatedAt||'',window.HWStallLinks?.getState?.().updatedAt||''].join('|');};
function readBase(){try{return localStorage.getItem(localBaseKey());}catch(_){return null;}}
function rememberBase(id,signature=getSignature()){knownBase=id;lastUploadedSignature=signature;try{localStorage.setItem(localBaseKey(),id);localStorage.setItem(localSigKey(),signature);}catch(_){} renderSync();}
function disableAuto(reason){autoEnabled=false;autoPassword='';$('v94Auto').checked=false;$('v94StopAuto').hidden=true;$('v94AutoHint').textContent=reason||'自動備份已停止';}
function syncMismatch(){return knownBase!==null && knownBase!==headId;}
function renderSync(){const panel=$('v94SyncPanel');panel.hidden=!accepted;const disconnected=!accepted;const unknown=knownBase===null;
 const conflict=accepted&&(syncMismatch()||pendingConflict);const localChanged=getSignature()!==lastUploadedSignature;
 $('v94LocalVersion').textContent=unknown?'尚未核對':baseTitle(knownBase);
 $('v94RemoteVersion').textContent=accepted?baseTitle(headId):'尚未連接';
 $('v94SyncBadge').textContent=disconnected?'離線':conflict?'版本衝突':unknown&&headId?'需先核對':unknown?'尚未建檔':localChanged?'本機待備份':'已核對';
 $('v94SyncBadge').dataset.state=conflict?'conflict':unknown&&headId?'review':localChanged?'dirty':'ok';
 $('v94SyncMessage').textContent=disconnected?'尚未連接工作區。':conflict?'偵測到其他裝置上傳新版，已封鎖本裝置後續上傳。請先查看快照及差異，必要時先備份本機，再決定使用哪個基準。':unknown&&headId?'首次在本裝置連線，尚未建立共同版本；請先開啟雲端快照核對，或明確確認基準。':localChanged?'目前本機資料與上次上傳／還原時間不同，雲端尚未更新。':'本裝置已記錄目前雲端版本；如有照片改動，仍需另行備份核對。';
 $('v94Acknowledge').hidden=disconnected||(!conflict&&!unknown);
 $('v94Acknowledge').disabled=!isOwner;
 $('v94Auto').disabled=!accepted||!isOwner;
 $('v94AutoHint').textContent=autoEnabled?'自動備份已啟用：有本機變更時，至少間隔 5 分鐘嘗試上傳；密碼僅保留在本分頁。':$('v94AutoHint').textContent||'尚未開啟自動備份';
}
async function getRemoteHead(){if(!accepted)return;const ref=fb.c.doc(db,'workspaces',workspace,'syncState','main');const state=await fb.c.getDoc(ref);
 headId=state.exists()?(state.data().headId||''):(listCached[0]?.id||'');headRevision=state.exists()?(state.data().revision||0):0;
 legacyBase=state.exists()?'':headId;
 if(syncMismatch()){pendingConflict=true;disableAuto('其他裝置已發布新版，自動備份已暫停');}
 renderSync();
}
function guardUpload(){if(!accepted||!isOwner)throw Error('僅工作區管理者可上傳');if(knownBase===null&&headId)throw Error('請先核對雲端快照並建立同步基準，避免覆蓋其他裝置的進度');if(syncMismatch()||pendingConflict)throw Error('雲端已出現不同版本，停止上傳；先核對新快照與本機資料');}

const notice=(s)=>{$('v93Status').textContent=s;};
const clean=(s)=>String(s||'').trim();
const prettyDate=(v)=>{if(!v)return'尚未記錄';const dt=typeof v.toDate==='function'?v.toDate():new Date(v);return isNaN(+dt)?'尚未記錄':dt.toLocaleString('zh-TW',{hour12:false});};
function buttonBusy(val){busy=val;['v93Upload','v93PreviewRestore','v93Apply','v93Create','v93Connect','v93Invite'].forEach(id=>{const e=$(id);if(e)e.disabled=val||(id==='v93Apply'&&(!previewData||!$('v93Agreement').checked));});}
function readConfig(){try{return JSON.parse(localStorage.getItem(cfgKey)||'null');}catch(e){return null;}}
function checkConfig(v){if(!v||typeof v!=='object'||['apiKey','authDomain','projectId','storageBucket','appId'].some(k=>typeof v[k]!=='string'||!v[k].trim()))throw Error('Firebase 設定缺少 apiKey、authDomain、projectId、storageBucket 或 appId');if(v.private_key||v.client_email||v.type==='service_account')throw Error('禁止使用或儲存 Service Account 私密金鑰');return Object.fromEntries(['apiKey','authDomain','projectId','storageBucket','appId','messagingSenderId','measurementId'].filter(k=>v[k]).map(k=>[k,v[k]]));}
async function libraries(){if(fb)return fb;const base='https://www.gstatic.com/firebasejs/12.19.0/';
 const [a,b,c,d]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js'),import(base+'firebase-storage.js')]);fb={a,b,c,d};return fb;
}
async function init(){const cfg=readConfig();if(!cfg){notice('尚未設定 Firebase，離線功能不受影響');return;}
 try{const lib=await libraries();app=lib.a.getApps().find(x=>x.name==='huwei-cloud-v93')||lib.a.initializeApp(cfg,'huwei-cloud-v93');auth=lib.b.getAuth(app);db=lib.c.getFirestore(app);storage=lib.d.getStorage(app);
 lib.b.onAuthStateChanged(auth,async next=>{user=next;accepted=false;workspace='';isOwner=false;previewData=null;currentSnapshot=null;$('v93Restore').hidden=true;disableAuto('登入狀態改變，已停止自動備份');render();renderSync();if(user){notice('已登入：'+(user.email||user.uid)+'。請選擇工作區。');}else notice('Firebase 已初始化，尚未登入 Google。');});
 }catch(err){notice('Firebase 初始化失敗：'+err.message);}
}
function render(){ $('v93Login').hidden=!!user;$('v93Logout').hidden=!user;$('v93Identity').textContent=user?`${user.email||'已登入'} · UID：${user.uid}`:'尚未登入';$('v93Work').hidden=!accepted; $('v93OwnerActions').hidden=!isOwner;$('v93Members').hidden=!isOwner;$('v93Create').hidden=!user; $('v93WorkspaceInfo').textContent=accepted?`工作區：${workspace} · ${isOwner?'管理者，可上傳與授權':'授權員工，唯讀快照'}`:'尚未進入工作區';}
const validUid=s=>/^[A-Za-z0-9:_-]{6,128}$/.test(s);
function requireSigned(){if(!auth||!user)throw Error('請先連接 Firebase 並使用 Google 帳號登入');}
function cloudRefs(id){const {c}=fb;return{ref:c.doc(db,'workspaces',id),snap:c.collection(db,'workspaces',id,'snapshots'),members:c.collection(db,'workspaces',id,'members')};}
async function useWorkspace(uid){requireSigned();if(!validUid(uid))throw Error('工作區 UID 格式不正確');const r=cloudRefs(uid),doc=await fb.c.getDoc(r.ref);if(!doc.exists())throw Error('查無可存取的工作區，請先建立，或請管理者授權此 UID');workspace=uid;isOwner=user.uid===uid;accepted=true;previewData=null;currentSnapshot=null;$('v93Restore').hidden=true;knownBase=readBase();pendingConflict=false;observedWorkspace=uid;try{lastUploadedSignature=localStorage.getItem(localSigKey())||'';}catch(_){lastUploadedSignature='';}disableAuto('須自行啟用本分頁自動備份');try{localStorage.setItem(ownerKey,uid);}catch(e){} render();await refresh();renderSync();if(isOwner)await refreshMembers();notice('已進入雲端工作區：'+(isOwner?'管理者':'授權唯讀'));
}
async function refresh(){if(!accepted)return;const q=fb.c.query(cloudRefs(workspace).snap,fb.c.orderBy('createdAt','desc'),fb.c.limit(25));const qs=await fb.c.getDocs(q);listCached=qs.docs.map(d=>({id:d.id,...d.data()}));const dest=$('v93Snapshots');dest.replaceChildren();if(!listCached.length){dest.textContent='此工作區尚無加密快照。';await getRemoteHead();return;}
 for(const snap of listCached){const wrap=document.createElement('div');wrap.className='v93-snapshot';const details=document.createElement('div');const title=document.createElement('strong');title.textContent=prettyDate(snap.createdAt);const info=document.createElement('small');info.textContent='加密檔 · '+Math.round((snap.bytes||0)/1024)+' KB · '+(snap.id===headId?'主版本':'歷史／分支備份');details.append(title,info);const open=document.createElement('button');open.type='button';open.textContent='查看／還原';open.addEventListener('click',()=>{currentSnapshot=snap;previewData=null;previewSignature='';$('v93Restore').hidden=false;$('v93RestoreTitle').textContent='快照 '+prettyDate(snap.createdAt);$('v93Compare').hidden=true;$('v93AgreementWrap').hidden=true;$('v93Agreement').checked=false;$('v93RestorePass').value='';$('v93Apply').disabled=true;$('v93Restore').scrollIntoView({block:'nearest',behavior:'smooth'});});wrap.append(details,open);dest.appendChild(wrap);}
 await getRemoteHead();
}
async function refreshMembers(){if(!isOwner)return;const qs=await fb.c.getDocs(cloudRefs(workspace).members);const host=$('v93MemberList');host.replaceChildren();if(qs.empty){host.textContent='尚未邀請員工。';return;}
 qs.docs.forEach(d=>{const row=document.createElement('div');row.className='v93-member';const label=document.createElement('span');label.textContent=d.id.slice(0,12)+'… · '+(d.data().active?'可讀取':'已停用');const b=document.createElement('button');b.textContent=d.data().active?'停用':'啟用';b.addEventListener('click',async()=>{if(!confirm('確定要'+(d.data().active?'停用':'啟用')+'此員工的雲端讀取權限？'))return;await fb.c.setDoc(fb.c.doc(cloudRefs(workspace).members,d.id),{role:'viewer',active:!d.data().active,changedAt:fb.c.serverTimestamp()});await refreshMembers();});row.append(label,b);host.appendChild(row);});
}
async function waitCrypto(){if(!window.isSecureContext||!crypto?.subtle)throw Error('加密功能只支援 HTTPS/localhost 安全瀏覽器');}
function countSummary(p){const s=crypt.counts(p);return`設備 ${s.devices}、線路 ${s.routes}、端子 ${s.terminals}、照片 ${s.photos}、照片標記 ${s.pins}、模板 ${s.templates}`;}
function validPhotoSet(project){const ids=[...new Set(project.devices.flatMap(d=>(d.photos||[]).map(p=>p.id)))];const got=new Set((project.photoAssets||[]).map(a=>a.id));if(ids.some(id=>!got.has(id)))throw Error('雲端資料缺少照片原檔，拒絕還原');}
async function upload(overridePass){
 requireSigned();await waitCrypto();guardUpload();
 const pass=overridePass||$('v93EncryptPass').value;
 if(pass.length<12)throw Error('加密密碼至少 12 字元');
 if(!overridePass&&pass!==$('v93EncryptAgain').value)throw Error('兩次密碼不一致');
 if(autoSaving)throw Error('已有備份在進行中');
 autoSaving=true;const before=getSignature(),expected=headId;
 try{
  // Re-fetch immediately before starting expensive upload, so another device cannot be silently overwritten.
  await refresh();guardUpload();
  const raw=await media.withAssets(hw.getData());if(window.HWStallCapacity)raw.stallCapacity=window.HWStallCapacity.getBackupData();if(window.HWStallLinks)raw.stallLinks=window.HWStallLinks.getBackupData();validPhotoSet(raw);const body=JSON.stringify(raw);
  if(enc.encode(body).length>80*1024*1024)throw Error('照片備份超過 80 MB，請先整理照片');
  const cipher=await crypt.seal(body,pass);
  const id=new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)+'-'+crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  const file=id+'.hwb',path=`workspaces/${workspace}/snapshots/${file}`;
  notice('已加密，正在上傳不可覆寫的快照…');
  await fb.d.uploadBytes(fb.d.ref(storage,path),new Blob([cipher],{type:'application/octet-stream'}),{contentType:'application/octet-stream'});
  await fb.c.setDoc(fb.c.doc(cloudRefs(workspace).snap,id),{file,bytes:enc.encode(cipher).length,createdAt:fb.c.serverTimestamp(),byUid:user.uid});
  // Atomically advance latest head only if it still matches the expected remote version.
  const stateRef=fb.c.doc(db,'workspaces',workspace,'syncState','main');
  try{await fb.c.runTransaction(db,async tx=>{
    const state=await tx.get(stateRef);const live=state.exists()?(state.data().headId||''):legacyBase;
    if(live!==expected)throw Error('衝突：另一台裝置已更新主版本；此份加密快照保留為分支，未覆寫主版本');
    const rev=state.exists()?(Number(state.data().revision)||0):0;
    tx.set(stateRef,{headId:id,revision:rev+1,baseId:expected,updatedAt:fb.c.serverTimestamp(),byUid:user.uid});
  });}catch(err){pendingConflict=true;disableAuto('版本衝突，已停止自動上傳');await refresh().catch(()=>{});throw err;}
  headId=id;headRevision++;pendingConflict=false;rememberBase(id,before);autoLastAt=Date.now();
  if(getSignature()!==before){notice('上傳完成，但過程中本機又有修改，仍有待備份資料。');}
  else notice('已安全建立加密主版本：'+id+'；原有快照保留。');
  if(!autoEnabled){$('v93EncryptPass').value='';$('v93EncryptAgain').value='';}
  await refresh();
 }finally{autoSaving=false;renderSync();}
}

function diffSummary(local,remote){
 function delta(a,b){const x=new Map(a.map(v=>[v.id,JSON.stringify(v)])),y=new Map(b.map(v=>[v.id,JSON.stringify(v)]));
 let adds=0,removes=0,modified=0;for(const [id,str] of y){if(!x.has(id))adds++;else if(x.get(id)!==str)modified++;}
 for(const id of x.keys())if(!y.has(id))removes++;return`雲端新增 ${adds}、雲端缺少 ${removes}、同 ID 內容不同 ${modified}`;}
 return`設備差異：${delta(local.devices||[],remote.devices||[])}\n線路差異：${delta(local.routes||[],remote.routes||[])}\n母子系統差異：${delta(local.systemNodes||[],remote.systemNodes||[])}\n提示：同 ID 內容差異可能是照片標記、迴路或位置；資料比較不會代替現場核對。`;
}
async function previewRestore(){requireSigned();await waitCrypto();if(!accepted||!currentSnapshot)throw Error('請先選擇一份雲端快照');const pass=$('v93RestorePass').value;if(!pass)throw Error('請輸入此快照的加密密碼');
 const file=currentSnapshot.file;if(!/^[a-zA-Z0-9_-]{8,80}\.hwb$/.test(file))throw Error('雲端快照檔名不正確');
 notice('下載加密快照中…');const blob=await fb.d.getBlob(fb.d.ref(storage,`workspaces/${workspace}/snapshots/${file}`),125*1024*1024);
 const plain=await crypt.unseal(await blob.text(),pass);if(enc.encode(plain).length>80*1024*1024)throw Error('解密後內容超出 80 MB');
 const raw=JSON.parse(plain);if(raw.app!=='HuweiEquipment'||!Array.isArray(raw.photoAssets))throw Error('不是完整的虎尾場私人備份');const valid=hw.validateData(raw);validPhotoSet(raw);if(raw.stallCapacity&&window.HWStallCapacity)window.HWStallCapacity.validateBackupData(raw.stallCapacity);if(raw.stallLinks&&window.HWStallLinks){window.HWStallLinks.validateBackupData(raw.stallLinks);const ids=new Set(valid.devices.map(d=>d.id));if(Object.keys(raw.stallLinks.bindings||{}).some(id=>!ids.has(id)))throw Error('雲端欄格關聯指向不存在的設備');}
 const current=hw.getData(),same=JSON.stringify(current)===JSON.stringify(valid);previewData=raw;previewSignature=currentSnapshot.id;
 $('v93Compare').textContent='目前裝置：'+countSummary(current)+'\n\n雲端快照：'+countSummary(valid)+'\n\n'+diffSummary(current,valid)+'\n\n'+(same?'設備資料相同（照片仍需現場核對）。':'設備資料不同：此還原將整份覆蓋目前裝置；不會自動合併兩邊變更。');
 $('v93Compare').hidden=false;$('v93AgreementWrap').hidden=false;$('v93Agreement').checked=false;$('v93Apply').disabled=true;notice('雲端快照已解密並通過格式驗證。尚未改動本機資料。');
}
async function applyRestore(){if(!previewData||!currentSnapshot||currentSnapshot.id!==previewSignature)throw Error('請重新下載並核對快照');if(!$('v93Agreement').checked)throw Error('請確認已另外備份本機資料及同意覆蓋');
 const target=previewData;
 // Import is complete local transaction where possible. Staff can browse cloud data but not upload.
 const result=await (isOwner?hw.importPrivateProject(target,'V9.3 雲端加密快照'):hw.importCloudReadOnlyProject(target,'V9.3 員工唯讀雲端快照'));
 if(target.stallCapacity&&window.HWStallCapacity){const restored=window.HWStallCapacity.restore(target.stallCapacity);if(!restored.ok)throw Error('設備已還原，但欄位設定無法儲存：'+restored.reason);}
 if(window.HWStallLinks){const restored=window.HWStallLinks.restore(target.stallLinks||{bindings:{}});if(!restored.ok)throw Error('設備已還原，但欄格關聯無法儲存：'+restored.reason);}
 rememberBase(currentSnapshot.id);pendingConflict=false;previewData=null;previewSignature='';$('v93Restore').hidden=true;renderSync();$('v93RestorePass').value='';notice(`已從雲端還原：${result.devices} 台設備、${result.routes} 條線路、${result.photos} 張照片。`);
}
$('v93SaveConfig').addEventListener('click',async()=>{try{const cfg=checkConfig(JSON.parse($('v93Config').value));localStorage.setItem(cfgKey,JSON.stringify(cfg));notice('Firebase 設定已儲存；將重新載入以建立連線。');location.reload();}catch(e){notice('設定錯誤：'+e.message);}});
$('v93Login').addEventListener('click',async()=>{try{if(!auth)throw Error('請先在上方填入 Firebase 設定');if(window.innerWidth<=760){await fb.b.signInWithRedirect(auth,new fb.b.GoogleAuthProvider());}else await fb.b.signInWithPopup(auth,new fb.b.GoogleAuthProvider());}catch(e){notice('Google 登入失敗：'+e.message);}});
$('v93Logout').addEventListener('click',async()=>{try{await fb.b.signOut(auth);accepted=false;workspace='';previewData=null;render();}catch(e){notice('登出失敗：'+e.message);}});
$('v93Create').addEventListener('click',async()=>{try{requireSigned();buttonBusy(true);const ref=cloudRefs(user.uid).ref;const exists=await fb.c.getDoc(ref);if(!exists.exists())await fb.c.setDoc(ref,{ownerUid:user.uid,createdAt:fb.c.serverTimestamp(),displayName:'虎尾場設備配置'});$('v93Workspace').value=user.uid;await useWorkspace(user.uid);}catch(e){notice('建立工作區失敗：'+e.message);}finally{buttonBusy(false);}});
$('v93Connect').addEventListener('click',async()=>{try{buttonBusy(true);await useWorkspace(clean($('v93Workspace').value));}catch(e){notice('進入工作區失敗：'+e.message);}finally{buttonBusy(false);}});
$('v93Refresh').addEventListener('click',async()=>{try{await refresh();notice('雲端快照清單已更新');}catch(e){notice('讀取快照失敗：'+e.message);}});
$('v93Upload').addEventListener('click',async()=>{try{buttonBusy(true);await upload();}catch(e){notice('上傳失敗：'+e.message);}finally{buttonBusy(false);}});
$('v93PreviewRestore').addEventListener('click',async()=>{try{buttonBusy(true);await previewRestore();}catch(e){previewData=null;notice('雲端解密／預覽失敗：'+e.message);}finally{buttonBusy(false);}});
$('v93Agreement').addEventListener('change',()=>{$('v93Apply').disabled=!previewData||!$('v93Agreement').checked;});
$('v93Apply').addEventListener('click',async()=>{try{buttonBusy(true);await applyRestore();}catch(e){notice('雲端資料還原未完成：'+e.message);}finally{buttonBusy(false);}});
$('v93Cancel').addEventListener('click',()=>{previewData=null;currentSnapshot=null;$('v93Restore').hidden=true;$('v93RestorePass').value='';});
$('v93Invite').addEventListener('click',async()=>{try{requireSigned();if(!isOwner)throw Error('僅工作區擁有者可授權');const uid=clean($('v93MemberUid').value);if(!validUid(uid)||uid===workspace)throw Error('員工 UID 格式不符');buttonBusy(true);await fb.c.setDoc(fb.c.doc(cloudRefs(workspace).members,uid),{role:'viewer',active:true,changedAt:fb.c.serverTimestamp()});$('v93MemberUid').value='';await refreshMembers();notice('已將員工加入雲端唯讀名單');}catch(e){notice('授權失敗：'+e.message);}finally{buttonBusy(false);}});

$('v94CheckRemote').addEventListener('click',async()=>{try{await refresh();notice('已重新檢查雲端版本');}catch(err){notice('檢查雲端失敗：'+err.message);}});
$('v94Acknowledge').addEventListener('click',()=>{
 if(!accepted||!isOwner)return;
 const warning='此操作只表示你已自行核對雲端主版本，並將它設為此裝置的下一次上傳基準；不會下載或合併雲端內容。\n若兩台裝置都修改過，建議先下載並備份兩邊資料。確定已核對嗎？';
 if(!confirm(warning))return;
 pendingConflict=false;rememberBase(headId);notice('已明確設為目前雲端同步基準；本機資料未遭覆蓋。');
});
$('v94Auto').addEventListener('change',e=>{
 if(!e.target.checked){disableAuto('你已停止本分頁自動備份');renderSync();return;}
 const pass=$('v93EncryptPass').value,again=$('v93EncryptAgain').value;
 if(!accepted||!isOwner||pass.length<12||pass!==again||knownBase===null&&headId||syncMismatch()||pendingConflict){
  disableAuto('無法啟用：請先登入管理者、填寫兩次相同密碼並核對雲端版本');notice('無法啟用自動備份：確認密碼和同步基準');renderSync();return;
 }
 autoPassword=pass;autoEnabled=true;$('v94StopAuto').hidden=false;$('v93EncryptPass').value='';$('v93EncryptAgain').value='';renderSync();notice('已啟用本分頁加密自動備份；關閉頁面即停止。');
});
$('v94StopAuto').addEventListener('click',()=>{disableAuto('本分頁自動備份已停止');renderSync();});
// Poll only while page open and visible. No password or private project is sent until owner opts in.
let lastRefresh=0;
setInterval(async()=>{
 if(!accepted||document.hidden||autoSaving||busy)return;
 try{
  if(Date.now()-lastRefresh>=90000){lastRefresh=Date.now();await refresh();}
  const signature=getSignature();if(signature!==lastLocalSignature){lastLocalSignature=signature;renderSync();}
  if(autoEnabled&&autoPassword&&isOwner&&knownBase!==null&&!syncMismatch()&&!pendingConflict&&signature!==lastUploadedSignature&&Date.now()-autoLastAt>=5*60*1000){
   buttonBusy(true);
   try{await upload(autoPassword);}catch(err){disableAuto('加密自動備份失敗，已暫停：'+err.message);notice('自動備份暫停：'+err.message);}finally{buttonBusy(false);}
  }
 }catch(err){disableAuto('雲端狀態檢查失敗，已停止自動備份');notice('連線檢查失敗：'+err.message);}
},15000);
window.addEventListener('focus',()=>{if(accepted&&!autoSaving)refresh().catch(err=>notice('雲端檢查失敗：'+err.message));});
// Optional protection for signed-in viewers: local editing UI is disabled; Firestore/Storage rules are the actual security barrier.
document.addEventListener('click',e=>{if(accepted&&!isOwner&&e.target.closest('.role-switch[data-role="admin"]')){e.stopImmediatePropagation();e.preventDefault();hw.setRole('staff');notice('此帳號僅具有雲端唯讀權限；管理者授權才可上傳。');}},true);
try{const c=readConfig();if(c){$('v93Config').value=JSON.stringify(c,null,2);$('v93Workspace').value=localStorage.getItem(ownerKey)||'';init();}else render();}catch(e){render();}
window.HWCloudV94={diffSummary,getState:()=>({configured:!!readConfig(),signedIn:!!user,connected:accepted,role:isOwner?'owner':'viewer',workspace:accepted?workspace:'',headId,knownBase,autoEnabled,pendingConflict})};
})();
