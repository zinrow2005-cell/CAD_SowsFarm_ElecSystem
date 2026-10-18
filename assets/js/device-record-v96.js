/* V9.6: one streamlined device record entry point. Existing CAD and data schema unchanged. */
(function(){'use strict';
const api=window.HWEquipment,media=window.HWPhotoStore;
const $=id=>document.getElementById(id);
const drawer=$('v84Drawer'),editor=$('eqEditor'),routeEditor=$('eqRouteEditor'),footer=$('v84DrawerFooter');
if(!api||!drawer||!editor||!routeEditor||!footer)return;
const make=(tag,cls,content)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(content!=null)e.textContent=content;return e;};
const deviceNow=()=>{const sel=api.getSelected();return sel?.kind==='device'?api.getData().devices.find(d=>d.id===sel.id):null;};
let tab='basic',viewDevice='',lastMode='',thumbSeq=0,isShowing=false,readOnly=false;

// Keep the original, fully functional detailed editor inside a progressive-disclosure section.
// Re-home action buttons outside collapsible editor sections; their original listeners remain.
for(const id of ['eqSaveDevice','eqRemoveDevice','eqSaveRoute','eqRemoveRoute']){const b=$(id);if(b)footer.appendChild(b);}
const pane=make('div','v96-pane');pane.id='v96Pane';
const summary=make('div','v96-summary');summary.id='v96Summary';
const tabs=make('nav','v96-tabs');tabs.id='v96Tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','設備檔案分類');
for(const [name,label] of [['basic','基本資料'],['photos','照片標記'],['links','連接關係']]){
 const b=make('button','v96-tab',label);b.type='button';b.dataset.tab=name;b.setAttribute('role','tab');b.setAttribute('aria-controls','v96-'+name);b.addEventListener('click',()=>showTab(name));tabs.appendChild(b);
}
const basic=make('section','v96-section');basic.id='v96-basic';basic.setAttribute('role','tabpanel');
const quick=make('div','v96-quick');quick.innerHTML=`<div class="v96-section-head"><b>常用資料</b><span>先填主要資訊，其他設定可展開</span></div>
<div class="v96-fields"><label>設備名稱<input id="v96Name" maxlength="80" autocomplete="off" placeholder="例如：產房 B 配電箱"></label>
<label>所屬區域<input id="v96Zone" maxlength="80" autocomplete="off" placeholder="例如：產房 B"></label>
<label>設備狀態<select id="v96Status"><option value="planned">規劃中</option><option value="installed">已安裝</option><option value="maintenance">維修中</option></select></label>
<label class="v96-full">設備功能與備註<textarea id="v96Note" rows="3" maxlength="900" placeholder="用途、控制區域、設備編號、維修說明…"></textarea></label></div>`;
const readDetails=make('div','v96-read');readDetails.id='v96Read';
const advanced=make('details','v96-advanced');advanced.id='v96Advanced';const advancedHead=make('summary','', '更多設定：圖標、座標、水源、規格欄位');advanced.appendChild(advancedHead);advanced.appendChild(editor);
basic.append(quick,readDetails,advanced);
const photos=make('section','v96-section');photos.id='v96-photos';photos.setAttribute('role','tabpanel');
photos.innerHTML=`<div class="v96-section-head"><b>設備照片與圖片標記</b><span id="v96PhotoCount">0 張</span></div>
<p class="v96-note">點照片可查看開關、端子標記；拍照與上傳由原本的照片工具處理，照片資料仍儲存在本機照片庫。</p>
<div id="v96Gallery" class="v96-gallery"></div>
<button type="button" class="v96-action v96-primary" id="v96ManagePhotos">開啟照片／拍照／新增標記 <span aria-hidden="true">↗</span></button>`;
const links=make('section','v96-section');links.id='v96-links';links.setAttribute('role','tabpanel');
links.innerHTML=`<div class="v96-section-head"><b>連接關係與迴路</b><span id="v96LinkCount">0 條</span></div>
<p class="v96-note">以下只顯示已建檔的設備與線路關聯。沒有填寫端子或尚未現場核對時，不能視為已確認的供電來源。</p>
<div class="v96-link-actions"><button type="button" class="v96-action" id="v96Terminals">開關／端子清單 ↗</button><button type="button" class="v96-action v96-primary" id="v96Trace">查上游／下游 ↗</button></div>
<div id="v96Connections" class="v96-connections"></div>`;
const wrap=make('div','v96-record');wrap.id='v96Record';wrap.append(summary,tabs,basic,photos,links);
drawer.insertBefore(wrap,routeEditor);
const deviceRecordButton=make('button','v82-btn primary','查看設備檔案');deviceRecordButton.type='button';deviceRecordButton.id='v96StaffRecord';deviceRecordButton.hidden=true;$('eqDetails')?.append(deviceRecordButton);

const mapping=[['v96Name','eqName'],['v96Zone','eqZone'],['v96Status','eqStatusSelect'],['v96Note','eqNote']];
for(const [a,b] of mapping){
 $(a).addEventListener('input',()=>{if($(b))$(b).value=$(a).value;});
 $(b)?.addEventListener('input',()=>{if($(a))$(a).value=$(b).value;});
}
function fillQuick(d){const fields=[['v96Name',d.name],['v96Zone',d.zone||''],['v96Status',d.status||'planned'],['v96Note',d.note||'']];for(const [id,value] of fields)$(id).value=value;}
function openRecord(roleStaff=false){const d=deviceNow();if(!d)return;
 readOnly=roleStaff||api.getRole()!=='admin';isShowing=true;tab='basic';viewDevice=d.id;advanced.open=false;
 drawer.hidden=false;drawer.classList.add('open');routeEditor.hidden=true;wrap.hidden=false;footer.hidden=readOnly;
 for(const id of ['eqSaveDevice','eqRemoveDevice'])$(id).hidden=readOnly;
 for(const id of ['eqSaveRoute','eqRemoveRoute'])$(id).hidden=true;
 $('v84DrawerTitle').textContent='設備檔案';$('side')?.classList.remove('open');draw(d);showTab('basic');
 drawer.scrollTop=0;
}
function draw(d){const type=api.getType(d.type);summary.replaceChildren();
 const title=make('div','v96-name');title.append(make('strong','',d.name),make('small','', [type?.label||'設備',d.zone||'尚未設定區域'].join(' · ')));
 const statusText={planned:'規劃中',installed:'已安裝',maintenance:'維修中'}[d.status]||'未設定';const status=make('span','v96-status '+(d.status||''),statusText);
 const counts=make('div','v96-badges');const n=(d.photos||[]).length,t=(d.terminals||[]).length;
 counts.append(make('span','',n+' 張照片'),make('span','',t+' 個端子'),make('span','',d.locked?'位置已鎖定':'可調整位置'));
 summary.append(title,status,counts);
 fillQuick(d);quick.hidden=readOnly;advanced.hidden=readOnly;readDetails.hidden=!readOnly;
 if(readOnly){readDetails.replaceChildren();const rows=[['區域',d.zone||'未設定'],['狀態',statusText],['用途／備註',d.note||'尚無備註'],['圖面座標',`${Number(d.x).toFixed(2)}, ${Number(d.y).toFixed(2)}`]];for(const [label,value] of rows){const row=make('div','v96-read-row');row.append(make('span','',label),make('strong','',value));readDetails.append(row);}}
}
function showTab(which){tab=['basic','photos','links'].includes(which)?which:'basic';for(const b of tabs.children){const yes=b.dataset.tab===tab;b.classList.toggle('active',yes);b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;}
 for(const [id,node] of [['basic',basic],['photos',photos],['links',links]])node.hidden=id!==tab;
 footer.hidden=readOnly||tab!=='basic';
 if(tab==='photos')renderPhotos();if(tab==='links')renderLinks();drawer.scrollTop=0;
}
async function renderPhotos(){const d=deviceNow();if(!d)return;const seq=++thumbSeq,gallery=$('v96Gallery');gallery.replaceChildren();$('v96PhotoCount').textContent=(d.photos||[]).length+' 張照片';
 if(!d.photos?.length){gallery.append(make('p','v96-empty','尚未上傳照片。可先拍攝配電箱、風扇或設備銘牌。'));return;}
 for(const ph of d.photos){const btn=make('button','v96-photo-tile');btn.type='button';const tile=make('span','v96-photo-image');tile.append(make('span','v96-photo-fallback','載入照片…'));btn.append(tile,make('strong','',ph.name||'設備照片'),make('small','',(ph.markers||[]).length+' 處標記'));
 btn.addEventListener('click',()=>window.HWDeviceRecords?.open('photos',ph.id));gallery.append(btn);
 if(media?.get){media.get(ph.id).then(src=>{if(seq!==thumbSeq||!btn.isConnected)return;tile.replaceChildren();if(src){const img=document.createElement('img');img.src=src;img.alt=ph.name||'設備照片';img.loading='lazy';tile.append(img);}else tile.append(make('span','v96-photo-fallback','本裝置沒有照片原檔'));}).catch(()=>{if(seq===thumbSeq&&btn.isConnected){tile.replaceChildren(make('span','v96-photo-fallback','照片載入失敗'));}});}
 }
}
function routeDeviceMatch(r,id){return r.fromDeviceId===id||r.toDeviceId===id||r.points?.some(p=>p.deviceId===id);}
function renderLinks(){const d=deviceNow();if(!d)return;const all=api.getData(),container=$('v96Connections');container.replaceChildren();const routes=(all.routes||[]).filter(r=>routeDeviceMatch(r,d.id));$('v96LinkCount').textContent=routes.length+' 條相關線路';
 if(!routes.length){container.append(make('div','v96-empty','尚未將此設備連到水管、電線或飼料管。請從 CAD 繪製線路，再設定起點、終點和端子。'));return;}
 for(const r of routes){const from=all.devices.find(e=>e.id===r.fromDeviceId),to=all.devices.find(e=>e.id===r.toDeviceId),electric=r.group==='electric';
 const card=make('article','v96-link-card');const head=make('div','v96-link-heading');head.append(make('strong','',r.circuitName||r.name|| (electric?'電線':r.group==='feed'?'飼料管':r.group==='water'?'水管':'舊示意線')),
 make('span','v96-link-state '+(electric&&r.confirmed&&from&&to?'verified':'pending'),electric?(r.confirmed&&from&&to?'已標記核對':'待現場核對'):r.group==='feed'?(r.confirmed?'飼料路徑已核對':'飼料路徑待核對'):'線路記錄'));
 const info=make('div','v96-endpoints');info.append(make('span','',from?.name||'起點未指定'),make('b','', '→'),make('span','',to?.name||'終點未指定'));
 card.append(head,info);
 if(r.purpose)card.append(make('p','',r.purpose));
 if(electric)card.append(make('small','v96-link-detail',`端子：${r.fromTerminalId?'已指定上游':'上游待補'} ／ ${r.toTerminalId?'已指定下游':'下游待補'}${r.cableSpec?' · '+r.cableSpec:''}`));
 const inspect=make('button','v96-link-inspect','選取線路並查看詳細資料 ↗');inspect.type='button';inspect.addEventListener('click',()=>{api.select('route',r.id);if(api.getRole()==='admin')api.openEditor();else api.closeEditor();});card.append(inspect);container.append(card);
 }
}
function closeRecord(){isShowing=false;thumbSeq++;wrap.hidden=true;}
function sync(event){const d=deviceNow();if(!d){deviceRecordButton.hidden=true;if(isShowing){closeRecord();drawer.hidden=true;}return;}
 const nameChanged=viewDevice!==d.id;
 if(isShowing){readOnly=api.getRole()!=='admin';footer.hidden=readOnly||tab!=='basic';for(const id of ['eqSaveDevice','eqRemoveDevice'])$(id).hidden=readOnly;if(nameChanged){viewDevice=d.id;showTab('basic');advanced.open=false;}draw(d);if(tab==='photos' && event?.detail?.kind==='data')renderPhotos();if(tab==='links' && event?.detail?.kind==='data')renderLinks();}
 deviceRecordButton.hidden=false;
}
$('v96ManagePhotos').addEventListener('click',()=>window.HWDeviceRecords?.open('photos'));
$('v96Terminals').addEventListener('click',()=>window.HWDeviceRecords?.open('terminals'));
$('v96Trace').addEventListener('click',()=>window.HWDeviceRecords?.open('trace'));
deviceRecordButton.addEventListener('click',()=>openRecord(true));
// Existing button continues to call api.openEditor; the standard editor opens first and this
// wrapper categorizes its fields, without duplicating or replacing data-write handlers.
window.addEventListener('hw-v90-change',e=>{
 if(e.detail?.kind==='editorOpen'){const sel=api.getSelected();if(sel?.kind==='device'){openRecord(false);}else{closeRecord();footer.hidden=false;routeEditor.hidden=false;}}
 else if(e.detail?.kind==='editorClose'){closeRecord();}
 else if(['selection','data','role'].includes(e.detail?.kind)){sync(e);if(e.detail?.kind==='selection' && deviceNow() && api.getRole()==='staff' && api.getWorkspace()==='equipment' && !api.getAction().action && !isShowing)openRecord(true);}
});
const originalClose=$('v84DrawerClose');originalClose?.addEventListener('click',closeRecord);
// A single call-to-action instead of two competing "photos / details" buttons.
const legacyPhotoBtn=document.querySelector('.v84-selection-buttons .v90-open-btn');if(legacyPhotoBtn)legacyPhotoBtn.hidden=true;
const legacyStaff=$('v90StaffOpen');if(legacyStaff)legacyStaff.hidden=true;
const quickEdit=$('v84EditNow');if(quickEdit)quickEdit.textContent='設備檔案';
const oldOpen=$('eqOpenEditor');if(oldOpen)oldOpen.textContent='查看／編輯設備檔案';
// Simplifies staff view, while keeping older reader actions working for compatibility.
window.addEventListener('hw-v90-photo-updated',()=>{if(isShowing&&tab==='photos')renderPhotos();});
window.HWDeviceRecordV96={open:openRecord,tab:showTab};
})();
