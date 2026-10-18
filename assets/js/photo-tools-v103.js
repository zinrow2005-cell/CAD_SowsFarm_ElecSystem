/* V10.3 photo zoom/pan/full-screen + high resolution / preview integrity status.
   All markers stay in original percent coordinates; transforms affect photo & pins together. */
(function(){'use strict';
const api=window.HWEquipment,store=window.HWPhotoStore;
const $=id=>document.getElementById(id);if(!api||!store||!$('v90Stage')||!$('v90PhotoMain'))return;
const stage=$('v90Stage'),wrap=$('v90ImageWrap'),toolbar=$('v90PhotoMain').querySelector('.v90-photo-toolbar');
const controls=document.createElement('div');controls.id='v103PhotoControls';controls.className='v103-photo-controls';
controls.innerHTML='<button id="v103ZoomOut" type="button" aria-label="縮小照片">－</button><output id="v103ZoomValue">100%</output><button id="v103ZoomIn" type="button" aria-label="放大照片">＋ 放大</button><button id="v103ZoomReset" type="button">重設</button><button id="v103Fullscreen" class="v103-fullscreen-button" type="button">⛶ 全螢幕標記</button>';
toolbar.insertAdjacentElement('afterend',controls);
const full=document.createElement('section');full.id='v103FullscreenPanel';full.className='v103-immersive';full.hidden=true;full.setAttribute('aria-label','全螢幕設備照片');
full.innerHTML='<div class="v103-fullscreen-head"><strong>設備照片 · 雙指放大、拖動查看開關</strong><button id="v103FullscreenClose" type="button">✕ 返回設備檔案</button></div>';
document.body.appendChild(full);
const originalParent=stage.parentNode,originalAfter=stage.nextSibling;
let zoom=1,tx=0,ty=0,suppressClick=false,lastImage='',fullscreen=false;
const pointers=new Map();let pinchStart=null;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
function draw(){zoom=clamp(zoom,1,8);const rect=stage.getBoundingClientRect();const boundX=Math.max(0,(zoom-1)*rect.width*.5),boundY=Math.max(0,(zoom-1)*rect.height*.5);
 tx=clamp(tx,-boundX,boundX);ty=clamp(ty,-boundY,boundY);
 wrap.style.transform=`translate(${tx}px, ${ty}px) scale(${zoom})`;
 stage.classList.toggle('v103-zoomed',zoom>1.005);
 $('v103ZoomValue').textContent=Math.round(zoom*100)+'%';
}
function setZoom(v){zoom=clamp(v,1,8);if(zoom===1){tx=0;ty=0;}draw();}
function reset(){zoom=1;tx=0;ty=0;draw();}
$('v103ZoomIn').onclick=()=>setZoom(zoom*1.5);$('v103ZoomOut').onclick=()=>setZoom(zoom/1.5);$('v103ZoomReset').onclick=reset;
function closeFull(){if(!fullscreen)return;fullscreen=false;full.hidden=true;$('v103Fullscreen').hidden=false;if(originalAfter&&originalAfter.parentNode===originalParent)originalParent.insertBefore(stage,originalAfter);else originalParent.appendChild(stage);
 originalParent.insertBefore(controls,stage);reset();}
function openFull(){if(fullscreen)return;fullscreen=true;full.hidden=false;full.appendChild(stage);full.appendChild(controls);$('v103Fullscreen').hidden=true;reset();}
$('v103Fullscreen').onclick=openFull;$('v103FullscreenClose').onclick=closeFull;
const oldClose=$('v90Close');oldClose?.addEventListener('click',closeFull);
window.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&fullscreen){ev.preventDefault();ev.stopImmediatePropagation();closeFull();}},true);
function isMarker(ev){return !!ev.target.closest?.('.v90-pin');}
function addPointer(ev){pointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});if(pointers.size===2){const list=[...pointers.values()];pinchStart={dist:Math.hypot(list[0].x-list[1].x,list[0].y-list[1].y),zoom};}}
stage.addEventListener('pointerdown',ev=>{if(isMarker(ev))return;addPointer(ev);if(zoom>1||pointers.size>1){try{stage.setPointerCapture(ev.pointerId);}catch(_e){}}},true);
stage.addEventListener('pointermove',ev=>{if(!pointers.has(ev.pointerId))return;const previous=pointers.get(ev.pointerId);pointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
 if(pointers.size===2&&pinchStart){const a=[...pointers.values()];const distance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);setZoom(pinchStart.zoom*distance/Math.max(1,pinchStart.dist));suppressClick=true;ev.preventDefault();return;}
 if(zoom>1&&!isMarker(ev)) {tx+=ev.clientX-previous.x;ty+=ev.clientY-previous.y;draw();if(Math.hypot(ev.clientX-previous.x,ev.clientY-previous.y)>1)suppressClick=true;ev.preventDefault();}
},true);
function dropPointer(ev){pointers.delete(ev.pointerId);pinchStart=null;if(!pointers.size&&suppressClick){setTimeout(()=>suppressClick=false,150);}}
stage.addEventListener('pointerup',dropPointer,true);stage.addEventListener('pointercancel',dropPointer,true);
stage.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();}},true);
stage.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey||zoom>1){e.preventDefault();setZoom(zoom*(e.deltaY<0?1.13:1/1.13));}},{passive:false});
// Reset when the active image changes; image marker coordinates remain normalized.
new MutationObserver(()=>{const src=$('v90Image')?.getAttribute('src')||'';if(src!==lastImage){lastImage=src;reset();}}).observe($('v90Image'),{attributes:true,attributeFilter:['src']});
// Local-only audit. Privacy: never uploads images or records.
const auditBox=document.createElement('section');auditBox.className='v103-audit';auditBox.innerHTML='<div class="v103-audit-header"><strong>照片完整性</strong><button id="v103Audit" type="button">檢查本機照片</button></div><p id="v103AuditResult">高解析主圖與縮圖分開儲存，請定期建立加密完整備份。</p>';
$('v90Photos').querySelector('.v90-actions').insertAdjacentElement('afterend',auditBox);
$('v103Audit').addEventListener('click',async()=>{const b=$('v103Audit');b.disabled=true;try{
 const report=await store.audit(api.getData());$('v103AuditResult').textContent=`設備照片共 ${report.total} 張\n高解析主圖：${report.master} 張｜舊版僅縮圖：${report.previewOnly} 張｜缺失：${report.missing} 張`+(report.missing?'\n缺失照片：'+report.problems.slice(0,3).join('、'):'')+'\n舊版照片無法從縮圖自動復原高清畫質。';
 }catch(e){$('v103AuditResult').textContent='檢查失敗：'+(e?.message||e);}finally{b.disabled=false;}});
window.HWPhotoToolsV103={setZoom,reset,openFull,closeFull,report:()=>store.audit(api.getData())};
})();
