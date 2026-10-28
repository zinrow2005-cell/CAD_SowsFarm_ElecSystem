/* V9.9: direct camera capture and approachable per-device icon resizing.
   No CAD layer or persisted schema migration; device.size is the existing field. */
(function(){'use strict';
const api=window.HWEquipment, records=window.HWDeviceRecords;
const $=id=>document.getElementById(id);
if(!api||!records||!$('v90Photos')||!$('v96-basic'))return;
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const selectedDevice=()=>{const selected=api.getSelected();return selected?.kind==='device'?api.getData().devices.find(x=>x.id===selected.id):null;};
const allowedSize=v=>Math.max(50,Math.min(300,Math.round((Number(v)||100)/5)*5));
const sizeUI=make('section','v99-size-panel');sizeUI.id='v99SizePanel';
sizeUI.innerHTML=`<div class="v99-size-head"><strong>整體大小・即時預覽</strong><output id="v99SizeNumber" for="v99SizeSlider">100%</output></div>
<div class="v99-size-controls"><button type="button" id="v99SizeDown" aria-label="縮小圖標 10%">−</button><input id="v99SizeSlider" aria-label="設備圖標大小，50% 到 300%" type="range" min="50" max="300" step="5" value="100"><button id="v99SizeUp" type="button" aria-label="放大圖標 10%">＋</button></div>
<div class="v99-size-presets"><button type="button" data-size="75">小 75%</button><button type="button" data-size="100">標準 100%</button><button type="button" data-size="150">大 150%</button><button type="button" data-size="200">特大 200%</button></div>
<p>調整時即時預覽，放開滑桿後自動儲存到這台設備。只改圖標大小，不影響 CAD 尺寸或管線連接。</p>`;
const appearanceBody=$('v1222Appearance')?.querySelector('.v1222-appearance-body');
const appearanceGrid=appearanceBody?.querySelector('.v84-edit-grid');
if(appearanceBody&&appearanceGrid)appearanceGrid.insertAdjacentElement('afterend',sizeUI);
else $('v96-basic').querySelector('.v96-quick')?.append(sizeUI);
const slider=$('v99SizeSlider'),number=$('v99SizeNumber');
let sizeDeviceId='',previewing=false;
function showSize(d){if(!d)return;const t=api.getType(d.type);const n=allowedSize(d.size||t?.size||100);sizeDeviceId=d.id;slider.value=n;number.value=n+'%';$('v99SizePanel').hidden=api.getRole()!=='admin';}
function previewSize(n){const d=selectedDevice();if(!d||api.getRole()!=='admin')return;number.value=n+'%';$('eqIconSize').value=n;
 const g=[...document.querySelectorAll('[data-eq-device]')].find(e=>e.getAttribute('data-eq-device')===d.id);
 if(g){const rotate=[...g.children].find(e=>e.tagName.toLowerCase()==='g'&&e.hasAttribute('transform'));if(rotate)rotate.setAttribute('transform',`rotate(${d.rotation||0}) scale(${n/100})`);const halo=g.querySelector('.v88-selection-halo');if(halo)halo.setAttribute('r',(1.21*n/100).toFixed(3));}
}
function sizeCommit(value){const d=selectedDevice();if(!d||api.getRole()!=='admin')return;const n=allowedSize(value);previewing=false;slider.value=n;number.value=n+'%';if(d.size===n)return;
 // Preserve unsaved basic text edits when the older data API repaints the drawer.
 const inputIds=['v96Name','v96Zone','v96Status','v96Note','eqName','eqZone','eqStatusSelect','eqNote',
  'eqIconShape','eqIconColor','eqIconWidth','eqIconHeight','eqIconLabel','eqIconLocked','eqRotation','eqX','eqY',
  'eqChangeType','eqSourceTower','eqSourceGround','eqSourceTap'];
 const drafts=inputIds.map(id=>{const node=$(id);return node?[id,node.value,node.type==='checkbox'?node.checked:null]:null;}).filter(Boolean);
 const saved=api.updateDetails('device',d.id,{size:n});
 if(saved){for(const [id,value,checked] of drafts){const node=$(id);if(!node)continue;node.value=value;if(checked!==null)node.checked=checked;}
  $('eqIconSize').value=n;window.dispatchEvent(new CustomEvent('hw-v1222-size-committed',{detail:{deviceId:d.id,size:n}}));}
 else {showSize(d);$('eqIconSize').value=d.size||n;}
}
slider.addEventListener('input',()=>{previewing=true;previewSize(allowedSize(slider.value));});
slider.addEventListener('change',()=>sizeCommit(slider.value));
$('v99SizeDown').addEventListener('click',()=>sizeCommit(allowedSize(Number(slider.value)-10)));
$('v99SizeUp').addEventListener('click',()=>sizeCommit(allowedSize(Number(slider.value)+10)));
sizeUI.querySelectorAll('[data-size]').forEach(b=>b.addEventListener('click',()=>sizeCommit(Number(b.dataset.size))));
$('eqIconSize')?.addEventListener('input',e=>{const d=selectedDevice();if(d&&!previewing){number.value=allowedSize(e.target.value)+'%';slider.value=allowedSize(e.target.value);}});
window.addEventListener('hw-v90-change',e=>{
 if(!['selection','editorOpen','data','role'].includes(e.detail?.kind))return;
 const d=selectedDevice();if(!d||($('v96Record')?.hidden&&e.detail?.kind!=='editorOpen'))return;
 if(previewing && e.detail?.kind==='data')return;
 showSize(d);
});
// Photo tab: one-tap camera access without entering another upload picker.
const cameraShortcut=make('button','v96-action v96-primary','📷 現場拍照（開啟鏡頭）');cameraShortcut.id='v99RecordCamera';cameraShortcut.type='button';
$('v96ManagePhotos')?.parentNode.insertBefore(cameraShortcut,$('v96ManagePhotos'));
$('v96ManagePhotos').textContent='🖼️ 照片管理／相簿上傳／新增標記 ↗';
const photosTab=$('v96-photos');photosTab?.classList.add('v99-photos-tab');
// Direct camera controls in the existing photo & annotation panel.
const photoSection=$('v90Photos');const panel=make('section','v99-camera-stage');panel.id='v99CameraStage';panel.hidden=true;
panel.innerHTML=`<div class="v99-camera-top"><strong>📷 現場即時拍照</strong><button type="button" id="v99CloseCamera" aria-label="關閉攝影機">✕</button></div>
<div class="v99-camera-screen"><video id="v99Video" autoplay muted playsinline aria-label="現場攝影機即時預覽"></video><p id="v99CameraStatus" role="status">準備開啟攝影機…</p></div>
<div class="v99-camera-actions"><button type="button" id="v99SwitchCamera">↻ 切換前後鏡頭</button><button type="button" id="v99Shutter" class="v99-shutter">◉ 拍攝並儲存</button><button type="button" id="v99CancelCamera">取消</button></div>
<p class="v99-camera-help">首次拍照請允許攝影機權限。照片會存入目前設備，之後可點圖片標示開關與迴路。若攝影機無法使用，可改選「使用系統相機」。</p>`;
const photoActions=photoSection.querySelector('.v90-actions');photoActions.insertAdjacentElement('afterend',panel);
const v=$('v99Video'),hint=$('v99CameraStatus');let stream=null,camGeneration=0,facing='environment',opening=false,busy=false,photographDevice='';
const fallback=$('v99NativeFallback');
function say(t){hint.textContent=t;hint.hidden=false;}
function showNativeFallback(show=true){fallback.hidden=!show||api.getRole()!=='admin';}
function stopCamera(){camGeneration++;opening=false;busy=false;
 if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
 if(v.srcObject){v.pause();v.srcObject=null;}panel.hidden=true;$('v99Shutter').disabled=false;
}
async function cameraOpen(){if(api.getRole()!=='admin')return;const d=selectedDevice();if(!d)return;stopCamera();photographDevice=d.id;
 panel.hidden=false;opening=true;say('正在請求攝影機權限…');const token=++camGeneration;
 const gum=navigator.mediaDevices?.getUserMedia;
 if(!window.isSecureContext||!gum){opening=false;say('此網址不能使用網頁即時攝影機。請以 HTTPS 開啟網站，或點「使用系統相機」。');showNativeFallback();return;}
 try{const newStream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:3840},height:{ideal:2160}}});
 if(token!==camGeneration||panel.hidden){newStream.getTracks().forEach(t=>t.stop());return;}
 stream=newStream;v.srcObject=stream;await v.play();if(token!==camGeneration){newStream.getTracks().forEach(t=>t.stop());return;}hint.hidden=true;opening=false;}
 catch(err){if(token!==camGeneration)return;opening=false;
 const reason=err?.name==='NotAllowedError'?'攝影機權限未允許，請到瀏覽器網站權限設定開啟攝影機。':err?.name==='NotFoundError'?'找不到可使用的攝影機。':err?.name==='NotReadableError'?'攝影機可能被其他應用程式使用。':'開啟攝影機失敗：'+(err?.message||'不明錯誤');
 say(reason+' 也可以使用系統相機拍照。');showNativeFallback();}
}
async function photoShutter(){if(opening||busy||!stream||!v.videoWidth||!v.videoHeight)return;say('正在擷取畫面並儲存…');busy=true;$('v99Shutter').disabled=true;
 try{const d=selectedDevice();if(!d||photographDevice!==d.id)throw Error('設備已切換，請重新開啟攝影機');
 const ratio=Math.min(1,4096/Math.max(v.videoWidth,v.videoHeight));const canvas=document.createElement('canvas');canvas.width=Math.round(v.videoWidth*ratio);canvas.height=Math.round(v.videoHeight*ratio);
 canvas.getContext('2d',{alpha:false}).drawImage(v,0,0,canvas.width,canvas.height);
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('擷取失敗')),'image/jpeg',.93));
 const file=new File([blob],`現場拍照_${new Date().toISOString().replace(/[:.]/g,'-')}.jpg`,{type:'image/jpeg'});
 const ok=await records.addPhoto(file);if(!ok)throw Error('照片未能儲存，請檢查裝置空間與照片權限');stopCamera();
 }catch(e){busy=false;$('v99Shutter').disabled=false;say('拍照失敗：'+(e?.message||e));}
}
$('v99OpenCamera').addEventListener('click',cameraOpen);
cameraShortcut.addEventListener('click',()=>{if(api.getRole()!=='admin')return;records.open('photos');cameraOpen();});
$('v99Shutter').addEventListener('click',photoShutter);
$('v99CloseCamera').addEventListener('click',stopCamera);$('v99CancelCamera').addEventListener('click',stopCamera);
$('v99SwitchCamera').addEventListener('click',()=>{facing=facing==='environment'?'user':'environment';cameraOpen();});
window.addEventListener('pagehide',stopCamera);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')stopCamera();});
window.HWLiveCameraV99={open:cameraOpen,stop:stopCamera};
function photoRole(){cameraShortcut.hidden=api.getRole()!=='admin';$('v99OpenCamera').hidden=api.getRole()!=='admin';showNativeFallback(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia);}
photoRole();window.addEventListener('hw-v90-change',e=>{if(e.detail?.kind==='role'){photoRole();if(api.getRole()!=='admin')stopCamera();}if(e.detail?.kind==='selection'&&photographDevice&&selectedDevice()?.id!==photographDevice)stopCamera();});
})();
