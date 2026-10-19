/* V10.3: separate high-resolution photo master from small legacy-compatible preview. */
(function(){'use strict';
const old=window.HWPhotoStore;if(!old)return;
const DB='HuweiFarmPhotoMastersV103',STORE='masters',LIMIT=17_000_000;
let dbp;
function db(){if(!dbp)dbp=new Promise((resolve,reject)=>{if(!indexedDB)return reject(Error('此瀏覽器不支援 IndexedDB'));
 const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{req.result.createObjectStore(STORE);};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('高畫質照片資料庫無法開啟'));});return dbp;}
function read(id){return db().then(database=>new Promise((resolve,reject)=>{const req=database.transaction(STORE,'readonly').objectStore(STORE).get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);}));}
function writeMany(assets,purgeIds=[]){if(!assets.length&&!purgeIds.length)return Promise.resolve();return db().then(database=>new Promise((resolve,reject)=>{const tx=database.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);for(const id of purgeIds)store.delete(id);for(const a of assets)store.put(a.originalDataUrl,a.id);tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||Error('高畫質照片儲存失敗'));tx.onerror=()=>{};}));}
function imageFrom(file){return new Promise((resolve,reject)=>{if(!file||!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)&&!/\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name||''))return reject(Error('請選擇 JPG、PNG 或 WebP 照片'));
 const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('無法讀取這張照片，請轉為 JPG 或 PNG'))};img.src=url;});}
function encodeCanvas(canvas,quality){return canvas.toDataURL('image/jpeg',quality);}
async function convert(file,maxside,quality,maxurl){if(file.size>20_000_000)throw Error('照片原始檔超過 20 MB');
 const img=await imageFrom(file);const ratio=Math.min(1,maxside/Math.max(img.naturalWidth,img.naturalHeight));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
 const cx=canvas.getContext('2d',{alpha:false});if(!cx)throw Error('無法取得照片轉換畫布');cx.drawImage(img,0,0,canvas.width,canvas.height);
 let q=quality,value=encodeCanvas(canvas,q);while(value.length>maxurl&&q>.65){q-=.07;value=encodeCanvas(canvas,q);}
 if(value.length>maxurl)throw Error('影像容量過大，請縮小原始照片或改用 JPEG');return value;}
const baseGet=old.get.bind(old),basePut=old.put.bind(old),baseIngest=old.ingest.bind(old),baseAssets=old.withAssets.bind(old);
old.compress=file=>convert(file,1200,.76,5_000_000);
old.prepareOriginal=file=>convert(file,4096,.93,LIMIT);
old.putOriginal=async(id,file)=>{if(!/^[\w-]{3,100}$/.test(id))throw Error('照片 ID 不合法');const result=await old.prepareOriginal(file);await writeMany([{id,originalDataUrl:result}]);return {id,bytes:Math.round(result.length*.75)};};
old.getOriginal=read;
old.get=async id=>(await read(id).catch(()=>null))||(await baseGet(id));
old.getPreview=baseGet;
old.withAssets=async project=>{
 // Repair a missing compatibility preview from an available master before export.
 const ids=[...new Set((project.devices||[]).flatMap(d=>(d.photos||[]).map(ph=>ph.id)))];
 for(const id of ids){if(!await baseGet(id)){const master=await read(id);if(!master)throw Error('照片主圖與縮圖皆缺失：'+id);
 const blob=await (await fetch(master)).blob();const file=new File([blob],id+'.jpg',{type:'image/jpeg'});await basePut(id,await old.compress(file));}}
 const out=await baseAssets(project);for(const a of out.photoAssets){const master=await read(a.id);if(master)a.originalDataUrl=master;}
 out.version='V10.3';return out;};
old.ingest=async assets=>{if(!Array.isArray(assets))throw Error('照片備份格式無效');const originals=[];for(const a of assets){if(a.originalDataUrl!=null){if(typeof a.originalDataUrl!=='string'||a.originalDataUrl.length>LIMIT||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(a.originalDataUrl))throw Error('高解析照片格式或容量不符合限制：'+a.id);originals.push(a);}}
 // Validate previews & originals before starting writes; each IndexedDB transaction is atomic.
 for(const a of assets){if(!a||typeof a.id!=='string'||!/^[\w-]{3,100}$/.test(a.id)||typeof a.dataUrl!=='string'||a.dataUrl.length>5_000_000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(a.dataUrl))throw Error('縮圖備份內容不正確');}
 // A preview-only restored photo must not display a *stale* master from an older
 // project with the same photo ID. Purge only matching IDs, not unrelated media.
 const previewOnlyIds=assets.filter(a=>a.originalDataUrl==null).map(a=>a.id);
 await writeMany(originals,previewOnlyIds);await baseIngest(assets);
};
old.audit=async project=>{const ids=[...new Set((project.devices||[]).flatMap(d=>(d.photos||[]).map(ph=>ph.id)))];let missing=0,master=0,previewOnly=0;const problems=[];
 for(const id of ids){const preview=await baseGet(id).catch(()=>null),original=await read(id).catch(()=>null);if(!preview&&!original){missing++;problems.push(id);}else if(original)master++;else previewOnly++;}
 return {total:ids.length,master,previewOnly,missing,problems};};
window.HWPhotoMasterV103={read,writeMany,convert};
})();