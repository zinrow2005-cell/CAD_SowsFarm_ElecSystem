/* V9.0 photo media storage — photo binary lives in IndexedDB, never in localStorage. */
(function(){'use strict';
const DB='HuweiFarmDevicePhotosV90', STORE='images';let dbPromise=null;
function openDB(){if(!window.indexedDB)return Promise.reject(new Error('此瀏覽器無法使用照片儲存空間'));if(!dbPromise){dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('無法開啟照片資料庫'));});}return dbPromise;}
async function put(id,url){if(!/^[\w-]{3,100}$/.test(id)||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(url)||url.length>5_000_000)throw Error('照片格式或容量不符合限制');const db=await openDB();return new Promise((resolve,reject)=>{const t=db.transaction(STORE,'readwrite');t.objectStore(STORE).put(url,id);t.oncomplete=()=>{window.dispatchEvent(new Event('hw-v90-photo-updated'));resolve();};t.onerror=()=>reject(t.error);});}
async function get(id){const db=await openDB();return new Promise((resolve,reject)=>{const q=db.transaction(STORE,'readonly').objectStore(STORE).get(id);q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error);});}
async function remove(id){const db=await openDB();return new Promise((resolve,reject)=>{const t=db.transaction(STORE,'readwrite');t.objectStore(STORE).delete(id);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);});}
function imageLoad(file){return new Promise((resolve,reject)=>{if(!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)&&!/\.(jpe?g|png|webp|heic)$/i.test(file.name))return reject(new Error('請選擇照片檔'));const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('無法讀取照片，請轉為 JPG 或 PNG'));};img.src=url;});}
async function compress(file){if(file.size>20*1024*1024)throw Error('單張原始照片上限 20 MB');const img=await imageLoad(file);const scale=Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));canvas.getContext('2d',{alpha:false}).drawImage(img,0,0,canvas.width,canvas.height);const result=canvas.toDataURL('image/jpeg',.79);if(result.length>5_000_000)throw Error('照片壓縮後仍過大，請降低解析度');return result;}
async function withAssets(data){const photos=(data.devices||[]).flatMap(d=>d.photos||[]);const unique=[...new Set(photos.map(p=>p.id))],assets=[];for(const id of unique){const image=await get(id);if(!image)throw Error('找不到照片 '+id+'，請先補齊照片後再備份');assets.push({id,dataUrl:image});}return {...data,version:data.version||'V10.2',photoAssets:assets};}
async function ingest(assets){
 if(!Array.isArray(assets))throw Error('照片清單格式有誤');
 if(!assets.length)return;
 const ids=new Set();
 for(const a of assets){
  if(!a||typeof a.id!=='string'||!/^[-\w]{3,100}$/.test(a.id)||ids.has(a.id))throw Error('照片編號錯誤或重複');
  if(typeof a.dataUrl!=='string'||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(a.dataUrl)||a.dataUrl.length>5_000_000)throw Error('照片資料格式或容量不正確');
  ids.add(a.id);
 }
 const db=await openDB();
 await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');const store=tx.objectStore(STORE);for(const a of assets)store.put(a.dataUrl,a.id);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||new Error('裝置照片儲存空間不足'));tx.onerror=()=>{};});
 window.dispatchEvent(new Event('hw-v90-photo-updated'));
}
window.HWPhotoStore={put,get,remove,compress,withAssets,ingest};
})();
