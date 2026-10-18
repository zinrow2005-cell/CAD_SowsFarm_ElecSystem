/* V11.7 portable encrypted whole-project archive. Offline, no cloud requests.
 * Binary AES-256-GCM envelope: 8-byte magic + LE uint32 header length +
 * JSON structural header (random PBKDF2 salt + random per-entry IVs) +
 * independently authenticated ciphertexts: encrypted project manifest, then
 * encrypted JPEG/PNG/WebP previews and optional masters.
 * This module does not touch project state until explicit applyArchive().
 */
(function(root){'use strict';
const MAGIC='HWPK117!', VERSION=2, MAX_ARCHIVE=360*1024*1024, MAX_META=14*1024*1024;
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
function cleanProject(project){const p=JSON.parse(JSON.stringify(project));delete p.photoAssets;delete p.photoManifest;delete p.portable;return p;}
async function encrypt(bytes,key){const iv=cryptoProvider().getRandomValues(new Uint8Array(12));const body=new Uint8Array(await cryptoProvider().subtle.encrypt({name:'AES-GCM',iv},key,bytes));return{iv:b64(iv),body};}
async function decrypt(file,offset,entry,key){const iv=unb64(entry.iv);if(iv.length!==12)throw Error('加密 IV 無效');const buf=await file.slice(offset,offset+entry.length).arrayBuffer();try{return new Uint8Array(await cryptoProvider().subtle.decrypt({name:'AES-GCM',iv},key,buf));}catch(e){throw Error('密碼錯誤、備份受損或驗證未通過（區塊 '+entry.index+'）');}}
async function exportArchive({project,photos,stallCapacity,stallLinks,password,onProgress}){
 if(!project||project.app!=='HuweiEquipment'||!Array.isArray(project.devices)||!Array.isArray(project.routes))throw Error('不是有效的虎尾場專案');
 if(!photos?.getPreview||!photos?.getOriginal)throw Error('照片元件尚未正確載入');
 const ids=photoIds(project),salt=cryptoProvider().getRandomValues(new Uint8Array(16));const key=await passwordKey(password,salt);
 const descriptors=[],media=[],all=ids.length,counts={master:0,previewOnly:0};let rawBytes=0;
 for(let i=0;i<ids.length;i++){
  const id=ids[i];progress(onProgress,'正在核對照片 '+(i+1)+'／'+all,i+1,all);
  let preview=await photos.getPreview(id);const master=await photos.getOriginal(id);
  if(!preview){throw Error('照片 '+id+' 缺少縮圖，請先執行照片完整性檢查或使用舊版修復功能');}
  for(const [kind,source] of [['preview',preview],['master',master]]){
   if(!source)continue;const{bytes,mime}=decodePhoto(source);rawBytes+=bytes.length;
   if(rawBytes>MAX_ARCHIVE-10*1024*1024)throw Error('照片總量超過 350 MB；請改在電腦分組封存');
   media.push(bytes);descriptors.push({id,kind,mime,bytes:bytes.length,sha256:await sha(bytes),index:descriptors.length+1});
  }
  if(master)counts.master++;else counts.previewOnly++;
 }
 const metadata={format:'HuweiPortableManifest',schema:2,createdAt:new Date().toISOString(),cadFingerprint:CAD_SHA256,
  project:cleanProject({...project,stallCapacity,stallLinks}),images:descriptors,summary:totals({...project,stallLinks})};
 const metaBytes=te.encode(JSON.stringify(metadata));if(metaBytes.length>MAX_META)throw Error('專案基本資料超過 14 MB');
 const plain=[metaBytes,...media],encrypted=[],headerEntries=[];
 for(let i=0;i<plain.length;i++){
  progress(onProgress,'正在加密區塊 '+(i+1)+'／'+plain.length,i+1,plain.length);
  const item=await encrypt(plain[i],key);encrypted.push(item.body);headerEntries.push({iv:item.iv,length:item.body.length});
 }
 const header={format:'HuweiPortableArchive',schema:VERSION,kdf:'PBKDF2-SHA256',iterations:ITERATIONS,
  cipher:'AES-256-GCM',salt:b64(salt),entries:headerEntries};
 const headerBytes=te.encode(JSON.stringify(header));if(headerBytes.length>MAX_HEADER)throw Error('照片清單超出封裝限制');
 const preamble=new Uint8Array(12);preamble.set(te.encode(MAGIC),0);new DataView(preamble.buffer).setUint32(8,headerBytes.length,true);
 const blob=new Blob([preamble,headerBytes,...encrypted],{type:'application/octet-stream'});
 if(blob.size>MAX_ARCHIVE)throw Error('備份檔超過 360 MB 的安全上限');
 return{blob,name:'虎尾場_完整設備照片備份_'+new Date().toISOString().slice(0,10)+'.hwpack',summary:metadata.summary,master:counts.master,previewOnly:counts.previewOnly};
}
async function readHeader(file){if(!file||file.size<80||file.size>MAX_ARCHIVE)throw Error('備份檔案大小不符合要求（最大 360 MB）');
 const prefix=new Uint8Array(await file.slice(0,12).arrayBuffer());if(td.decode(prefix.subarray(0,8))!==MAGIC)throw Error('檔案不是 V11.7 完整備份 .hwpack');
 const length=new DataView(prefix.buffer).getUint32(8,true);if(length<80||length>MAX_HEADER||12+length>=file.size)throw Error('備份標頭長度異常');
 let header;try{header=JSON.parse(await file.slice(12,12+length).text());}catch(e){throw Error('備份標頭不是有效 JSON');}
 if(header.format!=='HuweiPortableArchive'||header.schema!==VERSION||header.kdf!=='PBKDF2-SHA256'||header.cipher!=='AES-256-GCM'||header.iterations!==ITERATIONS||!Array.isArray(header.entries)||!header.entries.length||header.entries.length>MAX_ENTRIES||unb64(header.salt).length!==16)throw Error('不支援的備份格式或加密參數');
 let offset=12+length;const entries=[];
 for(let i=0;i<header.entries.length;i++){const entry=header.entries[i];if(!Number.isSafeInteger(entry.length)||entry.length<16||entry.length>MAX_IMAGE+16&&i!==0||entry.length>MAX_META+16&&i===0||unb64(entry.iv).length!==12)throw Error('加密區塊尺寸或 IV 不正確');entries.push({...entry,index:i,offset});offset+=entry.length;if(offset>file.size)throw Error('加密區塊超過檔案尾端');}
 if(offset!==file.size)throw Error('備份檔有多餘或缺失資料');return{entries,salt:unb64(header.salt)};
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
 const parsed=await readHeader(file);const key=await passwordKey(password,parsed.salt);
 progress(onProgress,'正在解密專案索引',0,parsed.entries.length);
 const raw=await decrypt(file,parsed.entries[0].offset,parsed.entries[0],key);if(raw.length>MAX_META)throw Error('專案基本資料過大');
 let meta;try{meta=JSON.parse(td.decode(raw));}catch(e){throw Error('解密後的專案索引錯誤');}
 const validated=validateManifest(meta,parsed.entries.length,validateData);
 for(let i=0;i<validated.images.length;i++){
  const item=validated.images[i],entry=parsed.entries[i+1];progress(onProgress,'驗證照片 '+(i+1)+'／'+validated.images.length,i+1,validated.images.length);
  const plain=await decrypt(file,entry.offset,entry,key);
  if(plain.length!==item.bytes||await sha(plain)!==item.sha256)throw Error('照片內容驗證失敗：'+item.id+' ('+item.kind+')');
 }
 return{file,parsed,key,meta,validated};
}
async function applyArchive(ctx,{importProject,restoreCapacity,restoreLinks,onProgress}){
 if(!ctx?.validated||typeof importProject!=='function')throw Error('尚未通過完整預覽與內容核對');
 const{file,parsed,key,validated,meta}=ctx,groups=new Map();
 for(let i=0;i<validated.images.length;i++){
  const item=validated.images[i],entry=parsed.entries[i+1];progress(onProgress,'準備照片資料 '+(i+1)+'／'+validated.images.length,i+1,validated.images.length);
  const plain=await decrypt(file,entry.offset,entry,key);
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
root.HWPortableCore={version:'11.7',cadFingerprint:CAD_SHA256,totals,readHeader,exportArchive,inspectArchive,applyArchive};
})(typeof window==='undefined'?globalThis:window);
