/* Huwei V11.10.8 – inspection/repair desk. Uses the authoritative HWEquipment project. */
(function(){'use strict';
const hw=window.HWEquipment;if(!hw)return;
const $=id=>document.getElementById(id), elt=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const conditions={unchecked:'尚未巡檢',normal:'正常',abnormal:'異常',offline:'停用',repairing:'維修中'};
const conditionColor={unchecked:'#9cafc4',normal:'#6fe2b7',abnormal:'#ff7e84',offline:'#b2bed1',repairing:'#f1b76c'};
const nowDate=()=>{const d=new Date(),offset=d.getTimezoneOffset()*60000;return new Date(d.getTime()-offset).toISOString().slice(0,10);};
const dialog=elt('section','hw108-overlay');dialog.id='hw108Overlay';dialog.hidden=true;
dialog.innerHTML=`<div class="hw108-desk" role="dialog" aria-modal="true" aria-labelledby="hw108Title" tabindex="-1">
<header class="hw108-head"><div><small>HUWEI · EQUIPMENT INSPECTIONS · V11.10.9</small><h2 id="hw108Title">設備巡檢與維修</h2><p>手動記錄現場狀態 · 同排巡檢 · 連結既有設備照片與維修工作單</p></div><button id="hw108Close" type="button" aria-label="關閉巡檢中心">✕</button></header>
<div class="hw108-overview" id="hw108Stats"></div>
<div class="hw108-controls"><label>查找設備<input id="hw108Query" type="search" placeholder="設備名稱、棟舍、編號…" autocomplete="off"/></label><label>檢視狀態<select id="hw108Filter"><option value="all">全部狀態</option><option value="unchecked">未巡檢</option><option value="normal">正常</option><option value="abnormal">異常</option><option value="offline">停用</option><option value="repairing">維修中</option></select></label><button id="hw108ChooseSelected" type="button">使用 CAD 已選設備</button></div>
<div class="hw108-columns"><section class="hw108-panel hw108-list-panel"><div class="hw108-section-head"><b>設備清單</b><small id="hw108Count"></small></div><div id="hw108DeviceList" class="hw108-device-list"></div></section>
<section class="hw108-panel hw108-form-panel"><div class="hw108-section-head"><b>現場巡檢</b><small id="hw108GroupNote">先選擇設備</small></div>
<div class="hw108-scope" id="hw108Scope"><button id="hw108Single" type="button">單台設備</button><button id="hw108Batch" type="button">同排批次巡檢</button></div>
<div class="hw108-meta"><label>巡檢日期<input id="hw108Date" type="date"/></label><label>巡檢人員<input id="hw108Inspector" type="text" maxlength="70" placeholder="請填寫現場巡檢者" autocomplete="name"/></label></div>
<p class="hw108-tip">請逐台選擇現場實際結果。未選結果的設備不會寫入紀錄；異常與停用須描述情況。</p>
<div id="hw108EntryList" class="hw108-entry-list"></div>
<div class="hw108-form-actions"><button id="hw108Preview" type="button" class="hw108-primary">檢查本次記錄</button><button id="hw108Clear" type="button">清除填寫</button></div>
<div id="hw108Review" class="hw108-review" hidden></div>
<div class="hw108-work-head"><b>這台設備的維修／巡檢歷史</b><button id="hw108CreateWork" type="button">＋ 詳細工作單</button></div><div id="hw108History" class="hw108-history"></div>
</section></div><footer class="hw108-footer"><span id="hw108Message" role="status" aria-live="polite">設備狀態來自人工巡檢，並非即時感測結果。請定期匯出 .hwpack 備份。</span></footer>
</div>`;
document.body.append(dialog);
const launch=elt('button','hw108-launch','✓ 現場巡檢與維修');launch.id='hw108Launch';launch.type='button';
const panel=$('v83EquipPanel');if(panel)panel.insertBefore(launch,panel.firstElementChild?.nextSibling||null);
const headerBtn=elt('button','hw108-header-launch','✓ 巡檢');headerBtn.type='button';headerBtn.title='開啟設備巡檢中心';
const rolebar=document.querySelector('.v82-rolebar');if(rolebar)rolebar.appendChild(headerBtn);
let opened=false,activeId='',scope='single',review=null,pending=new Map(),previousFocus=null,rendering=false;
function get(){return hw.getData();}
function status(d){return conditions[d?.condition]===undefined?'unchecked':d.condition;}
function pickDevice(id){const d=get().devices.find(x=>x.id===id);if(!d)return false;activeId=id;scope='single';review=null;pending.clear();renderAll();return true;}
function escapeDate(d){return /^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T00:00:00Z'));}
function feedback(message,error=false){const n=$('hw108Message');n.textContent=message;n.dataset.error=error?'true':'false';}
function open(id){if(!opened)previousFocus=document.activeElement;opened=true;pending.clear();review=null;dialog.hidden=false;const selected=hw.getSelected();const chosen=id||((selected?.kind==='device')?selected.id:'');if(chosen&&get().devices.some(d=>d.id===chosen)){activeId=chosen;scope='single';pending.clear();}
 if(!activeId&&get().devices.length)activeId=get().devices[0].id;
 $('hw108Date').value=nowDate();
 renderAll();dialog.querySelector('.hw108-desk').focus({preventScroll:true});}
function close(){opened=false;dialog.hidden=true;review=null;pending.clear();previousFocus?.focus?.({preventScroll:true});}
function targetDevices(){const all=get().devices,one=all.find(d=>d.id===activeId);if(!one)return[];return (scope==='batch'&&one.arrayBatchId)?all.filter(d=>d.arrayBatchId===one.arrayBatchId).sort((a,b)=>(a.arrayIndex||0)-(b.arrayIndex||0)):[one];}
function updateStats(){const data=get(),stats=$('hw108Stats');stats.replaceChildren();const counted={unchecked:0,normal:0,abnormal:0,offline:0,repairing:0};for(const d of data.devices)counted[status(d)]++;
 for(const [label,value,col] of [['已建設備',data.devices.length,'#74cce9'],['待巡檢',counted.unchecked,'#adc1d4'],['現場異常',counted.abnormal,'#ff7e84'],['停用／維修',counted.offline+counted.repairing,'#e7b57c'],['正常（上次巡檢）',counted.normal,'#74dfb7']]){const card=elt('div','hw108-stat');card.style.setProperty('--stat-color',col);card.append(elt('small','',label),elt('b','',value));stats.append(card);}}
function renderDevices(){const data=get(),q=$('hw108Query').value.trim().toLowerCase(),fil=$('hw108Filter').value,host=$('hw108DeviceList');host.replaceChildren();const devices=data.devices.filter(d=>(fil==='all'||status(d)===fil)&&(!q||[d.id,d.name,d.zone,hw.getType(d.type)?.label||'',d.arrayBatchId].join(' ').toLowerCase().includes(q)));$('hw108Count').textContent=`${devices.length}／${data.devices.length} 台`;
 for(const d of devices.slice(0,140)){const b=elt('button','hw108-device'+(d.id===activeId?' is-selected':''));b.type='button';b.append(elt('span','hw108-dot'));b.querySelector('.hw108-dot').style.background=conditionColor[status(d)];const mid=elt('span','hw108-device-text');mid.append(elt('b','',d.name),elt('small','',(d.zone||'未填棟舍')+' · '+(d.lastInspectionAt||'尚無巡檢日期')));b.append(mid,elt('span','hw108-status',conditions[status(d)]));b.onclick=()=>pickDevice(d.id);host.append(b);}
 if(!devices.length)host.append(elt('p','hw108-muted','目前沒有符合條件的設備。'));
 if(devices.length>140)host.append(elt('p','hw108-muted','結果過多，請用名稱或棟舍縮小範圍。'));
}
function getDraft(id){return pending.get(id)||{condition:'',note:'',photoId:''};}
function remember(id,field,value){const item={...getDraft(id),[field]:value};pending.set(id,item);invalidateReview();}
function invalidateReview(){review=null;$('hw108Review').hidden=true;$('hw108Review').replaceChildren();}
function renderScope(){const selected=get().devices.find(d=>d.id===activeId);$('hw108Batch').hidden=!selected?.arrayBatchId;$('hw108Batch').disabled=!selected?.arrayBatchId;$('hw108Single').classList.toggle('active',scope==='single');$('hw108Batch').classList.toggle('active',scope==='batch');$('hw108GroupNote').textContent=selected?scope==='batch'?`同排 ${targetDevices().length} 台（由原始拆分群組辨識）`:`${selected.name} · 單台`:'尚未選擇設備';
 const canEdit=hw.getRole()==='admin';$('hw108Preview').disabled=!canEdit||!selected;$('hw108CreateWork').disabled=!canEdit||!selected;
 if(!canEdit)feedback('員工檢視模式可查看紀錄；要新增巡檢請切換管理者');}
function renderEntries(){const host=$('hw108EntryList');host.replaceChildren();const canEdit=hw.getRole()==='admin';for(const d of targetDevices()){
  const section=elt('article','hw108-entry'),head=elt('div','hw108-entry-top'),badge=elt('span','hw108-entry-current',conditions[status(d)]);badge.style.color=conditionColor[status(d)];head.append(elt('b','',d.name),badge);section.append(head);
  const detail=elt('small','hw108-muted',(d.zone||'區域未填')+' · '+(d.id));section.append(detail);
  const label=elt('label','hw108-field','本次巡檢結果'),select=elt('select');select.disabled=!canEdit;for(const [v,t] of [['','— 請選擇結果（不修改）—'],['normal','✓ 正常'],['abnormal','⚠ 異常'],['offline','⏸ 停用'],['repairing','🔧 維修中']])select.append(new Option(t,v));select.value=getDraft(d.id).condition;select.onchange=()=>remember(d.id,'condition',select.value);label.append(select);section.append(label);
  const noteLabel=elt('label','hw108-field','巡檢描述／故障原因'),notes=elt('textarea');notes.rows=2;notes.maxLength=900;notes.placeholder='例如：風扇異音、無法啟動、已測試正常…';notes.disabled=!canEdit;notes.value=getDraft(d.id).note;notes.oninput=()=>remember(d.id,'note',notes.value);noteLabel.append(notes);section.append(noteLabel);
  const photoLabel=elt('label','hw108-field','現有設備照片（選填）'),photo=elt('select');photo.disabled=!canEdit;photo.append(new Option('不連結照片',''));for(const p of d.photos||[])photo.append(new Option(p.name||p.id,p.id));photo.value=getDraft(d.id).photoId;photo.onchange=()=>remember(d.id,'photoId',photo.value);photoLabel.append(photo);section.append(photoLabel);
  host.append(section);
 }
 if(!targetDevices().length)host.append(elt('p','hw108-muted','尚未建立任何設備，請先在 CAD 設備工作台新增設備。'));
}
function renderHistory(){const host=$('hw108History');host.replaceChildren();const data=get(),id=activeId;const works=data.maintenance.filter(w=>w.deviceId===id).sort((a,b)=>(b.workDate||b.createdAt||'').localeCompare(a.workDate||a.createdAt||''));if(!works.length){host.append(elt('p','hw108-muted','尚無巡檢或維修紀錄。'));return;}
 for(const work of works.slice(0,12)){const card=elt('div','hw108-history-item');const text=elt('div');text.append(elt('b','',work.title),elt('small','',(work.workDate||'日期未填')+' · '+(work.status==='done'?'已完成':work.status==='working'?'處理中':'待處理')+(work.photoId?' · 已連照片':'')));card.append(text);
 const controls=elt('div','hw108-history-actions');const view=elt('button','','查看工作單');view.type='button';view.onclick=()=>{close();window.HWFarmOpsV114?.showWork?.(work.id);};controls.append(view);
 if(work.status!=='done'&&!work.archived&&hw.getRole()==='admin'){
  const done=elt('button','','維修結案');done.type='button';done.onclick=()=>showCompletion(work);controls.append(done);
 }card.append(controls);host.append(card);
 }if(works.length>12)host.append(elt('p','hw108-muted',`另有 ${works.length-12} 筆，可從「詳細工作單」查詢。`));}
function showCompletion(work){invalidateReview();const host=$('hw108Review');host.hidden=false;host.replaceChildren();host.append(elt('h3','','人工維修結案：'+work.title));const label=elt('label','hw108-field','維修結果（必填）'),textarea=elt('textarea');textarea.rows=3;textarea.maxLength=1800;textarea.placeholder='填寫實際處理、換件、復測結果';label.append(textarea);host.append(label);
 const check=elt('label','hw108-check');const input=elt('input');input.type='checkbox';check.append(input,elt('span','','已經現場復查並確認設備正常（勾選才改為正常）'));host.append(check);
 const row=elt('div','hw108-review-actions'),confirm=elt('button','hw108-primary','確認結案'),cancel=elt('button','','取消');row.append(confirm,cancel);host.append(row);cancel.onclick=()=>{host.hidden=true;host.replaceChildren();};confirm.onclick=()=>{
  if(!window.confirm('確定結案這張工作單？請確認維修完成且紀錄正確。'))return;
  const r=hw.finishInspectionWork(work.id,{result:textarea.value,date:$('hw108Date').value,verifiedNormal:input.checked});
  if(!r.ok){feedback(r.error,true);return;}host.hidden=true;host.replaceChildren();renderAll();feedback('已記錄人工結案'+(input.checked?'，設備狀態已更新為正常':'；設備巡檢狀態未變更'));
 };host.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function renderAll(){if(!opened||rendering)return;rendering=true;try{updateStats();renderDevices();renderScope();renderEntries();renderHistory();}finally{rendering=false;}}
function preview(){if(hw.getRole()!=='admin'){feedback('請先切換管理者模式',true);return;}const all=targetDevices(),inspector=$('hw108Inspector').value.trim(),date=$('hw108Date').value;
 if(!inspector){feedback('請填寫巡檢人員',true);$('hw108Inspector').focus();return;}
 if(!escapeDate(date)){feedback('請填寫正確日期',true);return;}
 const entries=all.map(d=>({...getDraft(d.id),deviceId:d.id})).filter(v=>v.condition);
 if(!entries.length){feedback('請至少選擇一台設備的巡檢結果',true);return;}
 for(const v of entries){if(['abnormal','offline'].includes(v.condition)&&!v.note.trim()){feedback(get().devices.find(d=>d.id===v.deviceId)?.name+'：異常或停用須填原因',true);return;}}
 review={entries,date,inspector};const host=$('hw108Review');host.replaceChildren();host.hidden=false;host.append(elt('h3','',`本次記錄預覽｜${entries.length} 台`));const ul=elt('ul');for(const v of entries){const d=all.find(x=>x.id===v.deviceId);ul.append(elt('li','',`${d.name}：${conditions[v.condition]}${v.note?'｜'+v.note:''}${v.photoId?'（含既有照片連結）':''}`));}host.append(ul);
 const meta=elt('p','hw108-muted',`巡檢：${date} · ${inspector}。確認後會寫入原專案維修／巡檢歷史，並更新 CAD 狀態標記。`);host.append(meta);
 const controls=elt('div','hw108-review-actions'),yes=elt('button','hw108-primary','確認寫入巡檢紀錄'),no=elt('button','','返回修改');controls.append(yes,no);host.append(controls);no.onclick=invalidateReview;yes.onclick=()=>{
  if(!review)return;const {entries,date,inspector}=review;
  const r=hw.recordInspectionRound({entries,date,inspector});
  if(!r.ok){feedback(r.error,true);return;}pending.clear();invalidateReview();renderAll();feedback(`已建立 ${r.count} 筆現場巡檢／報修紀錄，請定期備份 .hwpack`);
 };host.scrollIntoView({block:'nearest',behavior:'smooth'});
}
launch.onclick=()=>open();headerBtn.onclick=()=>open();$('hw108Close').onclick=close;$('hw108Single').onclick=()=>{scope='single';pending.clear();invalidateReview();renderAll();};$('hw108Batch').onclick=()=>{if(!get().devices.find(d=>d.id===activeId)?.arrayBatchId){feedback('這台設備不是從陣列拆分建立的獨立設備',true);return;}scope='batch';pending.clear();invalidateReview();renderAll();};
$('hw108ChooseSelected').onclick=()=>{const s=hw.getSelected();if(s?.kind==='device'){pickDevice(s.id);}else feedback('請先在 CAD 點選一台設備',true);};
$('hw108Query').oninput=renderDevices;$('hw108Filter').onchange=renderDevices;$('hw108Preview').onclick=preview;$('hw108Clear').onclick=()=>{pending.clear();invalidateReview();renderEntries();feedback('已清除尚未儲存的巡檢輸入。');};
$('hw108Inspector').oninput=invalidateReview;$('hw108Date').onchange=invalidateReview;
$('hw108CreateWork').onclick=()=>{if(hw.getRole()!=='admin'||!activeId)return;close();window.HWFarmOpsV114?.newWork?.(activeId);};
dialog.addEventListener('pointerdown',e=>{if(e.target===dialog)close();});document.addEventListener('keydown',e=>{if(opened&&e.key==='Escape'){e.stopPropagation();close();}});
window.addEventListener('hw-v90-change',e=>{if(opened&&e.detail?.kind==='data'&&!review)renderAll();});
window.HWInspectionV11108={open,close,selected:()=>activeId,scope:()=>scope};
})();
