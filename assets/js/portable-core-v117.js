/* V11.12.1 complete portable backup, passwordless by default, no cloud requests.
 * Passwordless binary envelope: 8-byte magic + LE header size + manifest
 * & photo byte ranges hashed by SHA-256. Hashes detect accidental damage,
 * NOT deliberate tampering: unencrypted backups expose private photos & data.
 * Old HWPK117! encrypted archives remain read-only compatible with password.
 * This module does not touch project state until explicit applyArchive().
 */
(function(root){'use strict';
const MAGIC='HWPK117!', MAGIC_PLAIN='HWPN121!', VERSION=2, PLAIN_SCHEMA=3, MAX_ARCHIVE=360*1024*1024, MAX_META=14*1024*1024;
const MAX_IMAGE=20*1024*1024, MAX_PHOTOS=5000, MAX_ENTRIES=10001, MAX_HEADER=140000;
const ITERATIONS=260000;
const CAD_SHA256='341df0d8b58e880acaea0e2952d8d6d92a2239bfabe757d6697a1458993cdead';
const te=new TextEncoder(),td=new TextDecoder();
function cryptoProvider(){const c=root.crypto;if(!c?.subtle||!c.getRandomValues)throw Error('需使用 HTTPS 或 localhost 的瀏覽器，才能安全加密及解密');return c;}
function progress(fn,message,n,total){if(typeof fn==='function')fn(message,n,total);}
function b64(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));return btoa(s);}
function unb64(str){if(typeof str!=='string'||str.length>100||!/^[A-Za-z0-9+/]*={0,2}$/.test(str))throw Error('備份加密參數損壞');const s=atob(str),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a;}
function decodePhoto(dataUrl){const m=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl||'');if(!m)throw Error('照片檔案格式錯誤');const bin=atob(m[2]);const out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);if(!out.length||out.length>MAX_IMAGE)throw Error('單張照片大小超出備份限制');return{bytes:out,mime:m[1]};}
async function sha(bytes){const dig=await cryptoProvider().subtle.digest('SHA-256',bytes);return [...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function passwordKey(pass,salt,iterations=ITERATIONS){if(typeof pass!=='string'||pass.length<12)throw Error('密碼至少須 12 個字元');const subtle=cryptoProvider().subtle;const raw=await subtle.importKey('raw',te.encode(pass),'PBKDF2',false,['deriveKey']);return subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations},raw,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
function photoIds(p){const ids=[],set=new Set();for(const d of p.devices||[])for(const ph of d.photos||[]){if(typeof ph.id!=='string'||!/^[-\w]{3,100}$/.test(ph.id))throw Error('設備照片 ID 不正確');if(!set.has(ph.id)){ids.push(ph.id);set.add(ph.id);}}if(ids.length>MAX_PHOTOS)throw Error('照片超出上限 '+MAX_PHOTOS+' 張');return ids;}
function totals(p){return{devices:p.devices?.length||0,routes:p.routes?.length||0,photos:photoIds(p).length,markers:(p.devices||[]).reduce((s,d)=>s+(d.photos||[]).reduce((n,ph)=>n+(ph.markers||[]).length,0),0),systems:p.systemNodes?.length||0,maintenance:p.maintenance?.length||0,stallLinks:Object.values(p.stallLinks?.bindings||{}).reduce((n,arr)=>n+(Array.isArray(arr)?arr.length:0),0)};}
// V11.11.2: detailed coverage uses actual saved records; no inferred physical assets.
function coverage(p,stallCapacity,stallLinks){
 const devices=p.devices||[],routes=p.routes||[],works=p.maintenance||[];
 return {...totals({...p,stallLinks:stallLinks||p.stallLinks}),
  inspected:devices.filter(d=>d.condition&&d.condition!=='unchecked').length,
  abnormal:devices.filter(d=>d.condition==='abnormal').length,
  arrayMembers:devices.filter(d=>!!d.arrayBatchId).length,
  arrays:devices.filter(d=>!!d.array).length,
  segments:devices.filter(d=>!!d.segment).length,
  customTypes:(p.customTypes||[]).length,templates:(p.templates||[]).length,
  routeEndpoints:routes.filter(r=>r.fromDeviceId&&r.toDeviceId).length,
  circuitTerminals:devices.reduce((n,d)=>n+(d.terminals||[]).length,0),
  capacitySaved:!!stallCapacity,stallLinksSaved:!!stallLinks,
  workOrdersOpen:works.filter(w=>!w.archived&&w.status!=='done').length};
}
function equalExceptRootTimestamp(a,b){
 if(!a&&!b)return true;if(!a||!b)return false;
 const clean=o=>{const t=JSON.parse(JSON.stringify(o));delete t.updatedAt;return JSON.stringify(t);};
 return clean(a)===clean(b);
}
function cleanProject(project){const p=JSON.parse(JSON.stringify(project));delete p.photoAssets;delete p.photoManifest;delete p.portable;return p;}
async function encrypt(bytes,key){const iv=cryptoProvider().getRandomValues(new Uint8Array(12));const body=new Uint8Array(await cryptoProvider().subtle.encrypt({name:'AES-GCM',iv},key,bytes));return{iv:b64(iv),body};}
async function decrypt(file,offset,entry,key){const iv=unb64(entry.iv);if(iv.length!==12)throw Error('加密 IV 無效');const buf=await file.slice(offset,offset+entry.length).arrayBuffer();try{return new Uint8Array(await cryptoProvider().subtle.decrypt({name:'AES-GCM',iv},key,buf));}catch(e){throw Error('密碼錯誤、備份受損或驗證未通過（區塊 '+entry.index+'）');}}
// V11.11.9: a missing compatibility preview must not block a FULL backup
// if the authenticated master still exists. Generate an in-memory JPEG only;
// do not change IndexedDB or the original photo. Every image is hashed later.
async function recoverPreview(master,id){
 if(typeof master!=='string'||!/^data:image\/(?:jpeg|png|webp);base64,/.test(master))throw Error('照片 '+id+' 的原圖格式不支援救援');
 if(typeof root.document==='undefined')throw Error('此瀏覽器無法從原圖產生縮圖');
 const image=new Image();image.decoding='async';
 await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('照片 '+id+' 的原圖無法顯示'));image.src=master;});
 const w=image.naturalWidth,h=image.naturalHeight;
 if(!w||!h||w*h>50000000)throw Error('照片 '+id+' 的原圖尺寸無效或過大');
 const c=root.document.createElement('canvas'),scale=Math.min(1,1200/Math.max(w,h));
 c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));
 const ctx=c.getContext('2d',{alpha:false});if(!ctx)throw Error('照片縮圖轉換功能無法使用');
 ctx.drawImage(image,0,0,c.width,c.height);
 let value='';for(const q of [.78,.7,.62,.52]){value=c.toDataURL('image/jpeg',q);if(value.length<=5000000)break;}
 if(value.length>5000000)throw Error('照片 '+id+' 無法縮至備份格式上限');
 return value;
}
async function exportArchive({project,photos,stallCapacity,stallLinks,password,onProgress}){
 if(!project||project.app!=='HuweiEquipment'||!Array.isArray(project.devices)||!Array.isArray(project.routes))throw Error('不是有效的虎尾場專案');
 if(!photos?.getPreview||!photos?.getOriginal)throw Error('照片元件尚未正確載入');
 const ids=photoIds(project);
 const descriptors=[],media=[],all=ids.length,counts={master:0,previewOnly:0};let rawBytes=0;
 for(let i=0;i<ids.length;i++){
  const id=ids[i];progress(onProgress,'正在核對照片 '+(i+1)+'／'+all,i+1,all);
  let preview=null,master=null,previewError=null,masterError=null;
  try{preview=await photos.getPreview(id);}catch(e){previewError=e;}
  try{master=await photos.getOriginal(id);}catch(e){masterError=e;}
  if(!preview&&master){progress(onProgress,'從原圖臨時重建縮圖：'+id,i+1,all);preview=await recoverPreview(master,id);}
  if(!preview)throw Error('照片 '+id+' 無法讀取原圖或縮圖；縮圖：'+(previewError?.message||'不存在')+'；原圖：'+(masterError?.message||'不存在')+'。為避免遺漏照片，不能宣稱完整備份');
  for(const [kind,source] of [['preview',preview],['master',master]]){
   if(!source)continue;const{bytes,mime}=decodePhoto(source);rawBytes+=bytes.length;
   if(rawBytes>MAX_ARCHIVE-10*1024*1024)throw Error('照片總量超過 350 MB；請改在電腦分組封存');
   media.push(bytes);descriptors.push({id,kind,mime,bytes:bytes.length,sha256:await sha(bytes),index:descriptors.length+1});
  }
  if(master)counts.master++;else counts.previewOnly++;
 }
 const metadata={format:'HuweiPortableManifest',schema:2,createdAt:new Date().toISOString(),cadFingerprint:CAD_SHA256,
  project:cleanProject({...project,stallCapacity,stallLinks}),images:descriptors,summary:totals({...project,stallLinks}),coverage:coverage(project,stallCapacity,stallLinks)};
 const metaBytes=te.encode(JSON.stringify(metadata));if(metaBytes.length>MAX_META)throw Error('專案基本資料超過 14 MB');
 // V11.12.1: passwordless archive, with per-block SHA-256 checksums. No key needed.
 const plain=[metaBytes,...media],headerEntries=[];
 for(let i=0;i<plain.length;i++){
  progress(onProgress,'正在核對備份區塊 '+(i+1)+'／'+plain.length,i+1,plain.length);
  headerEntries.push({length:plain[i].length,sha256:await sha(plain[i])});
 }
 const header={format:'HuweiPortableArchive',schema:PLAIN_SCHEMA,encoding:'plain-sha256',entries:headerEntries};
 const headerBytes=te.encode(JSON.stringify(header));if(headerBytes.length>MAX_HEADER)throw Error('照片清單超出封裝限制');
 const preamble=new Uint8Array(12);preamble.set(te.encode(MAGIC_PLAIN),0);new DataView(preamble.buffer).setUint32(8,headerBytes.length,true);
 const blob=new Blob([preamble,headerBytes,...plain],{type:'application/octet-stream'});
 if(blob.size>MAX_ARCHIVE)throw Error('備份檔超過 360 MB 的安全上限');
 return{blob,name:'虎尾場_免密碼完整備份_'+new Date().toISOString().slice(0,10)+'.hwpack',summary:metadata.summary,master:counts.master,previewOnly:counts.previewOnly};
}
async function detectArchiveFormat(file){
 if(!file||typeof file.slice!=='function'||!Number.isFinite(file.size))throw Error('請選擇完整備份檔案');
 const bytes=new Uint8Array(await file.slice(0,Math.min(file.size,2048)).arrayBuffer());
 const prefix=td.decode(bytes.subarray(0,8));
 if(prefix===MAGIC_PLAIN)return 'plain';
 if(prefix===MAGIC)return 'encrypted';
 const first=td.decode(bytes).replace(/^\uFEFF/, '').trimStart();
 if(bytes[0]===0x50&&bytes[1]===0x4b)return 'zip';
 if(first.startsWith('{')){
  if(first.includes('HuweiPrivateBackup'))return 'legacy-hwb';
  if(first.includes('HuweiEquipment')||first.includes('photoAssets'))return 'legacy-json';
  return 'json-unknown';
 }
 if(first.startsWith('<!')||first.startsWith('<html'))return 'html';
 return 'unknown';
}
function incompatibleFormatError(type){
 if(type==='legacy-hwb')return Error('這是舊版加密 .hwb 備份，與新版免密碼 .hwpack 不同。請到「舊版 .hwb 相容匯入」使用當年設定的密碼還原；舊加密檔無法免密碼解密。');
 if(type==='legacy-json')return Error('這是舊版 JSON 專案檔，不是含所有照片原圖的 .hwpack。請使用原系統的「舊版 JSON 相容匯入」功能；不要直接覆蓋目前資料。');
 if(type==='zip')return Error('ZIP 內容尚未確認；請先檢查 ZIP 是否有完整 .hwpack。不要只看副檔名。');
 if(type==='html')return Error('你選的是網頁檔案，不是完整備份。請重新選擇 .hwpack。');
 return Error('無法辨識備份格式。請確認選到電腦端下載的 .hwpack，而不是 .hwb、.zip 或 JSON。檔案並未寫入手機資料。');
}
async function readHeader(file){
 if(!file||file.size<24||file.size>MAX_ARCHIVE)throw Error('備份檔案大小不符合要求（最大 360 MB）');
 const kind=await detectArchiveFormat(file);
 if(kind!=='plain'&&kind!=='encrypted')throw incompatibleFormatError(kind);
 const prefix=new Uint8Array(await file.slice(0,12).arrayBuffer());
 const length=new DataView(prefix.buffer).getUint32(8,true);
 if(length<70||length>MAX_HEADER||12+length>=file.size)throw Error('備份標頭長度異常');
 let header;try{header=JSON.parse(await file.slice(12,12+length).text());}catch(e){throw Error('備份標頭不是有效 JSON');}
 if(header.format!=='HuweiPortableArchive'||!Array.isArray(header.entries)||!header.entries.length||header.entries.length>MAX_ENTRIES)throw Error('備份標頭格式錯誤');
 if(kind==='encrypted'){
  if(header.schema!==VERSION||header.kdf!=='PBKDF2-SHA256'||header.cipher!=='AES-256-GCM'||header.iterations!==ITERATIONS||unb64(header.salt).length!==16)throw Error('舊版加密備份參數不支援');
 }else if(header.schema!==PLAIN_SCHEMA||header.encoding!=='plain-sha256')throw Error('不支援的免密碼備份版本');
 let offset=12+length;const entries=[];
 for(let i=0;i<header.entries.length;i++){
  const entry=header.entries[i],limit=(i===0?MAX_META:MAX_IMAGE)+(kind==='encrypted'?16:0);
  if(!Number.isSafeInteger(entry.length)||entry.length<1||entry.length>limit)throw Error('備份區塊尺寸異常');
  if(kind==='encrypted'){
   if(entry.length<16||unb64(entry.iv).length!==12)throw Error('舊備份 IV 不正確');
  }else if(!/^[a-f0-9]{64}$/.test(entry.sha256||''))throw Error('免密碼備份缺少完整性核對值');
  entries.push({...entry,index:i,offset});offset+=entry.length;
  if(offset>file.size)throw Error('備份區塊超過檔案尾端');
 }
 if(offset!==file.size)throw Error('備份檔有多餘或缺失資料');
 return{entries,salt:kind==='encrypted'?unb64(header.salt):null,kind};
}
async function readBlock(file,entry,parsed,key){
 if(parsed.kind==='encrypted')return decrypt(file,entry.offset,entry,key);
 const bytes=new Uint8Array(await file.slice(entry.offset,entry.offset+entry.length).arrayBuffer());
 if(bytes.length!==entry.length||await sha(bytes)!==entry.sha256)throw Error('備份區塊內容毀損（第 '+(entry.index+1)+' 塊，SHA-256 不一致）');
 return bytes;
}
function validateManifest(meta,entryCount,validateData){if(meta?.format!=='HuweiPortableManifest'||meta.schema!==2)throw Error('加密資料清單版本不符合');
 if(meta.cadFingerprint!==CAD_SHA256)throw Error('備份底圖版本不一致，為避免設備位置錯位，請使用相同 CAD 版本還原');
 if(meta.project?.app!=='HuweiEquipment'||!Array.isArray(meta.images)||meta.images.length!==entryCount-1)throw Error('專案或照片檔案清單數量不正確');
 const clean=validateData(meta.project),ids=new Set(photoIds(clean)),preview=new Set(),masters=new Set();
 for(let i=0;i<meta.images.length;i++){const item=meta.images[i];if(!ids.has(item.id)||item.index!==i+1||!['preview','master'].includes(item.kind)||!['image/jpeg','image/png','image/webp'].includes(item.mime)||!Number.isInteger(item.bytes)||item.bytes<1||item.bytes>MAX_IMAGE||!/^[a-f0-9]{64}$/.test(item.sha256))throw Error('照片項目或對應設備不正確');const set=item.kind==='preview'?preview:masters;if(set.has(item.id))throw Error('同一照片種類有重複 ID');set.add(item.id);}
 if(preview.size!==ids.size)throw Error('照片縮圖不完整；無法還原所有設備照片');
 if(meta.project.stallCapacity&&root.HWStallCapacity)root.HWStallCapacity.validateBackupData(meta.project.stallCapacity);
 if(meta.project.stallLinks&&root.HWStallLinks){root.HWStallLinks.validateBackupData(meta.project.stallLinks);const ds=new Set(clean.devices.map(d=>d.id));if(Object.keys(meta.project.stallLinks.bindings||{}).some(id=>!ds.has(id)))throw Error('欄格綁定有不存在的設備 ID');}
 return{project:clean,images:meta.images,summary:totals({...clean,stallLinks:meta.project.stallLinks})};
}
async function inspectArchive({file,password,validateData,onProgress}){
 const parsed=await readHeader(file);const key=parsed.kind==='encrypted'?await passwordKey(password,parsed.salt):null;
 progress(onProgress,'正在讀取專案索引',0,parsed.entries.length);
 const raw=await readBlock(file,parsed.entries[0],parsed,key);if(raw.length>MAX_META)throw Error('專案基本資料過大');
 let meta;try{meta=JSON.parse(td.decode(raw));}catch(e){throw Error('解密後的專案索引錯誤');}
 const validated=validateManifest(meta,parsed.entries.length,validateData);
 for(let i=0;i<validated.images.length;i++){
  const item=validated.images[i],entry=parsed.entries[i+1];progress(onProgress,'驗證照片 '+(i+1)+'／'+validated.images.length,i+1,validated.images.length);
  const plain=await readBlock(file,entry,parsed,key);
  if(plain.length!==item.bytes||await sha(plain)!==item.sha256)throw Error('照片內容驗證失敗：'+item.id+' ('+item.kind+')');
 }
 return{file,parsed,key,meta,validated};
}
async function applyArchive(ctx,{importProject,restoreCapacity,restoreLinks,onProgress}){
 if(!ctx?.validated||typeof importProject!=='function')throw Error('尚未通過完整預覽與內容核對');
 const{file,parsed,key,validated,meta}=ctx,groups=new Map();
 for(let i=0;i<validated.images.length;i++){
  const item=validated.images[i],entry=parsed.entries[i+1];progress(onProgress,'準備照片資料 '+(i+1)+'／'+validated.images.length,i+1,validated.images.length);
  const plain=await readBlock(file,entry,parsed,key);
  if(plain.length!==item.bytes||await sha(plain)!==item.sha256)throw Error('匯入前二次驗證照片失敗：'+item.id);
  const dataUrl='data:'+item.mime+';base64,'+b64(plain);
  if(!groups.has(item.id))groups.set(item.id,{id:item.id});
  groups.get(item.id)[item.kind==='preview'?'dataUrl':'originalDataUrl']=dataUrl;
 }
 const raw={...validated.project,photoAssets:[...groups.values()]};
 // Both auxiliary stores are checked before applying the main project; note that
 // localStorage and two IndexedDB stores cannot commit as one web transaction.
 if(meta.project.stallCapacity&&root.HWStallCapacity)root.HWStallCapacity.validateBackupData(meta.project.stallCapacity);
 if(meta.project.stallLinks&&root.HWStallLinks)root.HWStallLinks.validateBackupData(meta.project.stallLinks);
 progress(onProgress,'正在寫入本機專案及照片（請勿關閉）',1,1);
 const result=await importProject(raw);
 if(meta.project.stallCapacity&&restoreCapacity){const s=restoreCapacity(meta.project.stallCapacity);if(!s?.ok)throw Error('設備與照片已寫入，但欄位設定保存失敗：'+(s?.reason||''));}
 if(restoreLinks){const s=restoreLinks(meta.project.stallLinks||{bindings:{}});if(!s?.ok)throw Error('設備與照片已寫入，但欄格關聯保存失敗：'+(s?.reason||''));}
 return result;
}
// Read back the actual persistent localStorage-derived project and both IndexedDB
// photo stores after restore. This is *not* an atomic rollback mechanism: on
// failure, the user must keep the source archive and retry from a clean state.
async function verifyRestored({archive,project,photos,stallCapacity,stallLinks,onProgress}){
 if(!archive?.validated||!photos?.getPreview||!photos?.getOriginal)throw Error('缺少已通過驗證的備份或照片儲存元件');
 const expected=archive.validated.project;
 if(JSON.stringify(cleanProject(project))!==JSON.stringify(cleanProject(expected)))throw Error('還原後設備／管線／維修資料與備份不一致');
 const saved=archive.meta.project;
 if(saved.stallCapacity&&!equalExceptRootTimestamp(saved.stallCapacity,stallCapacity))throw Error('還原後欄位容量設定與備份不一致');
 if(!equalExceptRootTimestamp(saved.stallLinks||{bindings:{}},stallLinks||{bindings:{}}))throw Error('還原後設備欄格關聯與備份不一致');
 let master=0,preview=0;
 for(let i=0;i<archive.validated.images.length;i++){
  const item=archive.validated.images[i];
  progress(onProgress,'核對已還原照片 '+(i+1)+'／'+archive.validated.images.length,i+1,archive.validated.images.length);
  const url=item.kind==='master'?await photos.getOriginal(item.id):await photos.getPreview(item.id);
  if(!url)throw Error('還原後缺少'+(item.kind==='master'?'原圖':'縮圖')+'：'+item.id);
  const decoded=decodePhoto(url);
  if(decoded.mime!==item.mime||decoded.bytes.length!==item.bytes||await sha(decoded.bytes)!==item.sha256)throw Error('還原後照片驗證失敗：'+item.id+'（'+item.kind+'）');
  if(item.kind==='master')master++;else preview++;
 }
 // In a preview-only archive, an old original under the same ID must not remain
 // in the target's master store (otherwise normal photo viewing shows stale data).
 const masterIds=new Set(archive.validated.images.filter(i=>i.kind==='master').map(i=>i.id));
 for(const item of archive.validated.images.filter(i=>i.kind==='preview'&&!masterIds.has(i.id))){
  if(await photos.getOriginal(item.id))throw Error('還原後保留了其他專案的舊原圖：'+item.id);
 }
 return {...coverage(project,stallCapacity,stallLinks),verifiedPreviews:preview,verifiedMasters:master};
}
// V11.11.2: Non-destructive cross-device acceptance check. Reads local project
// and both photo stores and compares against a fully authenticated .hwpack.
// Nothing in this function modifies devices, photos, or backup files.
function stableJson(value){
 const canon=v=>{
  if(Array.isArray(v))return v.map(canon);
  if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,canon(v[k])]));
  return v;
 };
 return JSON.stringify(canon(value));
}
async function compareCurrentArchive({archive,project,photos,stallCapacity,stallLinks,onProgress}){
 if(!archive?.validated?.project||!archive?.meta?.project)throw Error('請先選擇並驗證備份檔');
 if(!project||!photos?.getPreview||!photos?.getOriginal)throw Error('無法讀取目前設備或照片資料');
 const expected=cleanProject(archive.validated.project),actual=cleanProject(project),sections=[];
 // Any additional project module must be compared, not merely the familiar counters.
 const label={devices:'設備資料（含尺寸、座標、巡檢）',routes:'水電與送料管線',maintenance:'維修與工作單',systemNodes:'設備母子系統',customTypes:'自訂設備種類',templates:'設備樣板',stallCapacity:'棟舍欄格容量',stallLinks:'設備欄格關聯'};
 const keys=[...new Set([...Object.keys(expected),...Object.keys(actual)])].sort();
 for(const key of keys){
  if(key==='photoAssets'||key==='photoManifest'||key==='portable')continue;
  const a=stableJson(actual[key]),b=stableJson(expected[key]);
  sections.push({key,label:label[key]||('其他專案設定：'+key),ok:a===b,
   localCount:Array.isArray(actual[key])?actual[key].length:null,expectedCount:Array.isArray(expected[key])?expected[key].length:null});
 }
 const saved=archive.meta.project;
 // Auxiliary stores may generate a new updatedAt on restore; their actual data
 // must still match, and a missing store is considered a mismatch.
 sections.push({key:'aux-capacity',label:'欄位容量獨立儲存區',ok:equalExceptRootTimestamp(saved.stallCapacity||null,stallCapacity||null)});
 sections.push({key:'aux-links',label:'欄格關聯獨立儲存區',ok:equalExceptRootTimestamp(saved.stallLinks||{bindings:{}},stallLinks||{bindings:{}})});
 const issues=[];let passed=0;
 const expectedMasters=new Set(archive.validated.images.filter(i=>i.kind==='master').map(i=>i.id));
 for(let i=0;i<archive.validated.images.length;i++){
  const item=archive.validated.images[i];progress(onProgress,'逐張核對目前裝置照片 '+(i+1)+'／'+archive.validated.images.length,i+1,archive.validated.images.length);
  try{
   const url=item.kind==='master'?await photos.getOriginal(item.id):await photos.getPreview(item.id);
   if(!url){issues.push({id:item.id,kind:item.kind,reason:'目前裝置缺少照片'});continue;}
   const decoded=decodePhoto(url);
   if(decoded.mime!==item.mime||decoded.bytes.length!==item.bytes||await sha(decoded.bytes)!==item.sha256){issues.push({id:item.id,kind:item.kind,reason:'照片內容或格式與備份不同'});continue;}
   passed++;
  }catch(e){issues.push({id:item.id,kind:item.kind,reason:'讀取／核對失敗：'+(e?.message||e)});}
 }
 const previewOnlyIds=new Set(archive.validated.images.filter(i=>i.kind==='preview'&&!expectedMasters.has(i.id)).map(i=>i.id));
 for(const id of previewOnlyIds){
  try{if(await photos.getOriginal(id))issues.push({id,kind:'master',reason:'備份只有縮圖，但目前裝置殘留同 ID 原圖'});}
  catch(e){issues.push({id,kind:'master',reason:'無法確認是否殘留原圖'});}
 }
 const changed=sections.filter(a=>!a.ok);
 return {ok:!changed.length&&!issues.length,sections,changed,photoIssues:issues,verifiedPhotos:passed,expectedPhotos:archive.validated.images.length,
  checkedAt:new Date().toISOString(),archiveDate:archive.meta.createdAt};
}
root.HWPortableCore={version:'11.12.15',cadFingerprint:CAD_SHA256,totals,coverage,detectArchiveFormat,readHeader,exportArchive,inspectArchive,applyArchive,verifyRestored,compareCurrentArchive};
})(typeof window==='undefined'?globalThis:window);
