/* V11.12.17 offline ZIP bridge. ZIP is never trusted by filename alone.
 * Accepts only one genuine .hwpack embedded inside ZIP, or a genuine .hwpack
 * whose suffix changed. Does not import arbitrary zip/json bundles. */
(function(root){'use strict';
 const MAX_ZIP=400*1024*1024, MAX_PORTABLE=360*1024*1024, MAX_FILES=2000;
 const MAGIC_PLAIN='HWPN121!', MAGIC_OLD='HWPK117!';
 function error(s){throw new Error(s);}
 function safeName(n){return String(n||'').replace(/[\\]/g,'/').split('/').pop().slice(0,200);}
 async function magic(blob){const b=new Uint8Array(await blob.slice(0,8).arrayBuffer());return String.fromCharCode(...b);}
 async function resolve(source){
  if(!source||typeof source.slice!=='function')error('請先選擇備份檔案');
  const sig=await magic(source);
  if(sig===MAGIC_PLAIN||sig===MAGIC_OLD)return {file:source,source,kind:sig===MAGIC_PLAIN?'plain':'encrypted',label:`已辨識完整專案備份：${safeName(source.name)}`};
  const header=new Uint8Array(await source.slice(0,4).arrayBuffer());
  if(header[0]!==80||header[1]!==75)error('無法辨識備份內容。檔名可以不同，但必須是真正的 .hwpack 或內含 .hwpack 的 ZIP。');
  if(source.size>MAX_ZIP)error('ZIP 太大（超過 400 MB）。請從電腦直接傳送 .hwpack，避免手機解壓記憶體不足。');
  if(/iPhone|iPad|Android/i.test(root.navigator?.userAgent||'')&&source.size>90*1024*1024)error('此 ZIP 超過 90 MB，手機解壓可能使 APP 因記憶體不足而關閉。請在電腦解壓後，單獨傳送裡面的 .hwpack 到手機匯入。');
  if(!root.JSZip)error('ZIP 解析元件未載入。請確認 V11.12.22 已完整部署並重新開啟 APP。');
  let zip;try{zip=await root.JSZip.loadAsync(await source.arrayBuffer());}catch(e){error('ZIP 無法讀取或已損壞：'+(e?.message||e));}
  const entries=Object.values(zip.files).filter(f=>!f.dir);if(entries.length>MAX_FILES)error('ZIP 檔案項目過多，不適合作為設備資料備份。');
  const names=entries.map(f=>f.name),lower=names.map(n=>n.toLowerCase());
  const isProgram=lower.some(n=>n==='index.html'||n.endsWith('/index.html')||n==='sw.js'||n.includes('assets/js/')||n==='.nojekyll');
  if(isProgram)error('這份 ZIP 內含 index.html／assets/js 等網站程式，是 GitHub 部署包，不是現場設備資料備份。資料未被覆蓋。');
  const candidates=entries.filter(f=>/\.hwpack$/i.test(f.name)&&!f.name.includes('__MACOSX/')&&!safeName(f.name).startsWith('._'));
  // Some phone share flows strip a suffix even for the single contained file.
  if(!candidates.length&&entries.length===1)candidates.push(entries[0]);
  if(candidates.length>1)error('ZIP 內找到 '+candidates.length+' 份 .hwpack，為避免匯錯專案，請在電腦先解壓，單獨選擇需要匯入的那份。');
  if(candidates.length===0){
   const list=names.slice(0,8).map(safeName).join('、');
   error('這份 ZIP 裡找不到 .hwpack，不能安全當成完整備份還原。內含：'+(list||'沒有檔案')+'。請保留 ZIP 原檔；若是舊版另一種備份格式，需要先確認其實際內容，不能直接改副檔名。');
  }
  const candidate=candidates[0];
  const size=candidate._data?.uncompressedSize;
  if(Number.isFinite(size)&&(size<24||size>MAX_PORTABLE))error('ZIP 內的 .hwpack 大小不符合安全限制（最多 360 MB）。');
  let bytes;try{bytes=await candidate.async('uint8array');}catch(e){error('無法從 ZIP 讀取完整備份：'+(e?.message||e));}
  if(bytes.length<24||bytes.length>MAX_PORTABLE)error('ZIP 內的備份大小異常，已拒絕匯入。');
  const nested=String.fromCharCode(...bytes.subarray(0,8));
  if(nested!==MAGIC_PLAIN&&nested!==MAGIC_OLD)error('ZIP 裡找不到有效的 .hwpack 備份（唯一檔案是 '+safeName(candidate.name)+'，內容不是虎尾場備份）。不能只改副檔名就還原。');
  const file=new File([bytes],safeName(candidate.name),{type:'application/octet-stream'});
  return{file,source,kind:nested===MAGIC_PLAIN?'plain':'encrypted',label:'✓ 從 ZIP 找到完整備份：'+safeName(candidate.name)+'（'+(file.size/1048576).toFixed(1)+' MB）',wrapped:true};
 }
 root.HWPortableZipBridge={version:'11.12.22',resolve};
})(window);
