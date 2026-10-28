/* V10.1 device true CAD coordinates vs display coordinates, and persistent dirty-state recovery. */
(()=>{'use strict';
const api=window.HWEquipment;
if(!api)return;
const $=id=>document.getElementById(id);
const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
const target=()=>{const s=api.getSelected();return s?.kind==='device'?api.getData().devices.find(d=>d.id===s.id):null;};
const parent=$('v96-basic')?.querySelector('.v96-quick');
if(parent){
 const box=el('details','v101-locate');box.id='v101Locate';box.hidden=true;box.open=false;
 box.innerHTML=`<summary>設備實際位置與圖標<span>座標與定位輔助</span></summary><div class="v101-locate-body">
 <div class="v101-coordinates"><div><span>真實設備定位點</span><strong id="v101Physical"></strong></div><div><span>圖標顯示位置</span><strong id="v101Display"></strong></div></div>
 <div class="v101-locate-buttons"><button type="button" id="v101ResetIcon">圖標回到定位點</button><button type="button" id="v101EditAnchor">修改實際位置 ↗</button></div>
 <label class="v1199-anchor-toggle"><input type="checkbox" id="v1199ShowAnchorGuides"/> 顯示原始定位點連線（綠色圈圈與虛線）</label>
 <small class="v101-help">拖曳圖示僅改變顯示位置，不會改動真正的設備座標或已連接的管線端點。定位輔助線預設隱藏；需要核對時再勾選顯示。</small></div>`;
 const appearance=$('v1222Appearance');
 if(appearance?.parentNode===$('v96-basic'))appearance.insertAdjacentElement('afterend',box);
 else parent.appendChild(box);
 function updatePosition(){const d=target();box.hidden=!d||api.getRole()!=='admin';if(!d)return;
 const placement=api.getVisualPlacement(d.id);$('v101Physical').textContent=`${placement.physical.x.toFixed(2)}, ${placement.physical.y.toFixed(2)}`;
 $('v101Display').textContent=`${placement.icon.x.toFixed(2)}, ${placement.icon.y.toFixed(2)}`;
 }
 $('v1199ShowAnchorGuides').checked=api.getAnchorGuides();
 $('v1199ShowAnchorGuides').addEventListener('change',e=>{api.setAnchorGuides(e.currentTarget.checked);});
 $('v101ResetIcon').onclick=()=>{const d=target();if(d)api.resetIconPosition(d.id);updatePosition();};
 $('v101EditAnchor').onclick=()=>{const adv=$('v96Advanced');if(adv)adv.open=true;const field=$('eqX');field?.scrollIntoView({block:'center',behavior:'smooth'});field?.focus({preventScroll:true});};
 window.addEventListener('hw-v90-change',e=>{if(['selection','editorOpen','data','role'].includes(e.detail?.kind))updatePosition();});
 updatePosition();
}
const alert=el('aside','v101-save-alert');alert.id='v101SaveAlert';alert.hidden=true;
alert.setAttribute('role','alert');alert.innerHTML=`<strong>⚠️ 設備修改尚未儲存到本機</strong><span id="v101SaveMessage">儲存空間可能不足。請不要關閉此頁。</span><div><button type="button" id="v101RetrySave">重試儲存</button><button type="button" id="v101PrivateBackup">加密私人備份</button><button type="button" id="v101EmergencyBackup">緊急 JSON 備份</button></div>`;
document.body.appendChild(alert);
function refresh(){const s=api.getStorageState();alert.hidden=!s.dirty;if(s.dirty)$('v101SaveMessage').textContent='儲存失敗：'+(s.error||'可能超過可用儲存空間')+'。請先備份，勿離開頁面。';}
$('v101RetrySave').onclick=()=>{if(api.retryStorageSave())refresh();};
$('v101PrivateBackup').onclick=()=>{const b=$('v92Export');if(b){b.click();return;}alert('完整加密備份工具尚未就緒，請使用緊急 JSON 備份。');};
$('v101EmergencyBackup').onclick=()=>{if(!window.confirm('緊急 JSON 只包含設備、管線及照片標記等資料，不含攝影原始影像，而且沒有加密。請將檔案放在私人安全位置。確定下載？'))return;
const data=api.getData(),file=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
const a=document.createElement('a'),url=URL.createObjectURL(file);a.href=url;a.download='虎尾場_緊急設備備份_不含照片原檔_'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
};
window.addEventListener('hw-v101-storage',refresh);refresh();
window.HWPrecisionV101={refresh};
})();
