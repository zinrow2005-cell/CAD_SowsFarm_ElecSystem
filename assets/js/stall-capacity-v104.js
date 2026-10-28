/* 虎尾場 V10.5 — 正式欄位容量與實際 SVG/CAD 格數一致；各欄幾何已建。 */
(function(){'use strict';
const HW=window.HWEquipment, STORE='huwei_v104_stall_capacity';
const $=id=>document.getElementById(id);
const rows=[
 {id:'MAT',zone:'配種舍夾欄區',row:'全區（未提供排別）',count:76,prefix:'MAT',unit:'夾欄'},
 {id:'BOAR',zone:'公豬巡情欄',row:'母豬夾欄左側（單獨計數）',count:1,prefix:'BOAR-HEAT',unit:'公豬欄'},
 {id:'GILT',zone:'女豬育成區',row:'14 欄（G-07 縮小，容量待核）',count:14,prefix:'G',unit:'育成欄'},
 {id:'A1',zone:'妊娠舍 A 棟',row:'第 1 排',count:84,prefix:'A-R1',unit:'夾欄'},
 {id:'A2',zone:'妊娠舍 A 棟',row:'第 2 排',count:84,prefix:'A-R2',unit:'夾欄'},
 {id:'A3',zone:'妊娠舍 A 棟',row:'第 3 排',count:84,prefix:'A-R3',unit:'夾欄'},
 {id:'B1',zone:'妊娠舍 B 棟',row:'第 1 排',count:82,prefix:'B-R1',unit:'夾欄'},
 {id:'B2',zone:'妊娠舍 B 棟',row:'第 2 排',count:82,prefix:'B-R2',unit:'夾欄'},
 {id:'B3',zone:'妊娠舍 B 棟',row:'第 3 排 · 靠水溝',count:80,prefix:'B-R3',unit:'夾欄',special:true}
];
const knownIds=new Set(rows.map(r=>r.id));
const defaults=()=>({version:'10.4',reservedGiltPens:[],pins:{},updatedAt:null});
function sanitize(incoming){
 if(!incoming||typeof incoming!=='object'||Array.isArray(incoming))throw Error('欄位配置格式錯誤');
 const p=defaults(),r=Array.isArray(incoming.reservedGiltPens)?incoming.reservedGiltPens:[];
 p.reservedGiltPens=[...new Set(r.filter(n=>Number.isInteger(n)&&n>=1&&n<=14))].slice(0,2).sort((a,b)=>a-b);
 const pin=incoming.pins&&typeof incoming.pins==='object'&&!Array.isArray(incoming.pins)?incoming.pins:{};
 for(const [key,v] of Object.entries(pin)){if(!knownIds.has(key)||!v||typeof v!=='object')continue;const x=Number(v.x),y=Number(v.y);if(Number.isFinite(x)&&Number.isFinite(y)&&x>=-10&&x<=70&&y>=-10&&y<=90)p.pins[key]={x:+x.toFixed(4),y:+y.toFixed(4)};}
 p.updatedAt=typeof incoming.updatedAt==='string'?incoming.updatedAt:null;return p;
}
let state=defaults(),dirty=false,placeId=null,highlightId=null;
try{const raw=localStorage.getItem(STORE);if(raw)state=sanitize(JSON.parse(raw));}catch(err){console.warn('V10.4 容量資料讀取失敗',err);dirty=true;}
function backupObject(){return {module:'HuweiStallCapacity',version:'10.4',officialProfile:'2026-10-17',...structured()};}
function structured(){return JSON.parse(JSON.stringify(state));}
function store(){state.updatedAt=new Date().toISOString();try{localStorage.setItem(STORE,JSON.stringify(state));dirty=false;}catch(e){dirty=true;announce('儲存失敗！請匯出欄位設定 JSON 備份：'+e.message,true);}syncAll();return !dirty;}
const fmt=n=>n.toLocaleString('zh-TW');
function admin(){return HW?.getRole?.()==='admin';}
function rowLabel(r){return (r.id==='MAT'?'配種舍':r.id==='BOAR'?'公豬巡情欄':r.id==='GILT'?'女豬育成區':r.zone.replace('妊娠舍 ','妊娠'))+' · '+r.row;}
function genCodes(){const out=[];
 for(let i=1;i<=76;i++)out.push({id:'MAT-'+String(i).padStart(3,'0'),zone:'配種舍夾欄區',row:'未指定排別',pen:i,head:'',status:'',note:''});
 out.push({id:'BOAR-HEAT-01',zone:'公豬巡情欄',row:'配種母豬夾欄左側',pen:1,head:1,status:'',note:'巡情公豬1頭；不計入76母豬夾欄'});
 for(let pen=1;pen<=14;pen++)for(let slot=1;slot<=10;slot++)out.push({id:'G-'+String(pen).padStart(2,'0')+'-'+String(slot).padStart(2,'0'),zone:'女豬育成區',row:'第 '+pen+' 欄',pen,head:slot,status:state.reservedGiltPens.includes(pen)?'預留欄':'',note:pen===7?'G-07 因母豬通道縮小，既有 10 位識別碼僅供舊資料相容；實際容量待核':''});
 for(const r of rows.filter(q=>/^([AB])\d$/.test(q.id)))for(let i=1;i<=r.count;i++)out.push({id:r.prefix+'-'+String(i).padStart(3,'0'),zone:r.zone,row:r.row,pen:i,head:'',status:'',note:r.special?'靠水溝':''});
 return out;
}
const card=document.createElement('div');card.className='v104-shortcut';card.innerHTML='<button type="button" id="v104BaseOpen" class="v104-entry"><span>▥</span><span><strong>欄位配置與容量</strong><small>76 配種 · 496 妊娠 · 140 育成設計容量</small></span><span>查看 ›</span></button>';
const base=$('v83BasePanel');if(base)base.insertBefore(card,base.children[1]||null);
const equipBtn=document.createElement('button');equipBtn.id='v104EquipOpen';equipBtn.type='button';equipBtn.className='v104-equip-link';equipBtn.textContent='▦ 欄位容量／各排編號';const equip=$('v83EquipPanel');
if(equip)equip.insertBefore(equipBtn,equip.children[1]||null);
const dialog=document.createElement('div');dialog.className='v104-overlay';dialog.id='v104Overlay';dialog.hidden=true;dialog.innerHTML=`<div class="v104-modal" role="dialog" aria-modal="true" aria-labelledby="v104Title" tabindex="-1">
 <header class="v104-header"><div><small>HUWEI FARM · VERIFIED CAPACITY</small><h2 id="v104Title">欄位配置與容量管理</h2><p>底圖已校正各欄格數；A/B 棟與上下排對應仍請現場確認</p></div><button type="button" id="v104Close" title="關閉" aria-label="關閉">×</button></header>
 <div class="v104-body">
  <div class="v104-stats"><div><small>配種夾欄</small><strong>76</strong><em>個</em></div><div><small>妊娠 A 棟</small><strong>252</strong><em>個</em></div><div><small>妊娠 B 棟</small><strong>244</strong><em>個</em></div><div><small>A＋B 妊娠夾欄</small><strong>496</strong><em>個</em></div></div>
  <div class="v104-substats"><span>配種＋妊娠合計 <b>572</b> 個母豬夾欄（另有 <b>1</b> 個巡情公豬欄）</span><span>育成原設計 <b>140</b> 頭；G-07 縮小後新總容量待核</span><span>原設計預留 2 欄時為 <b>120</b> 頭；改建後待核</span></div>
  <div class="v104-grid"><section class="v104-panel"><div class="v104-panel-header"><h3>各棟舍、各排欄數</h3><span>共 9 組資料</span></div><div id="v104Rows" class="v104-rows"></div></section>
   <section class="v104-panel"><div class="v104-panel-header"><h3>女豬育成區預留欄</h3><span id="v104ReserveCount">0／2 已指定</span></div>
    <p class="v104-help">共 14 欄；G-07 右側已規劃母豬通道並縮小，該欄實際可養頭數待核。其餘欄原設計每欄 10 頭。你只提供「可預留 2 欄」，尚未指定是哪兩欄，因此系統不會替你猜。管理者可點選下方欄位指定。</p>
    <div id="v104GiltGrid" class="v104-gilt-grid"></div><p class="v104-status" id="v104ReserveStatus"></p>
    <div class="v104-tip"><b>容量說明</b><span>改建前規劃 140 頭，預留 2 欄為 120 頭；G-07 縮小後尚未重新核定容量，不應直接採用舊總數。</span></div>
    <div class="v104-tip"><b>CAD 原始物件</b><span>V10.5 底圖已繪妊娠 496 個獨立夾欄格；原有牆線、走道及歷史備份保留。上方三排暫對應 A 棟、下方三排暫對應 B 棟，請現場核對。</span></div>
   </section></div>
  <div class="v104-tools"><div><b>欄位編號與資料匯出</b><p>可產生配種 76 個、妊娠 496 個母豬夾欄，另有 1 個巡情公豬欄，以及育成 14 欄 × 10 個頭位的識別碼；每一格已帶有 CAD 對應編號；夾欄圖面僅供定位；需查詢個別欄號請使用欄位搜尋或服務範圍管理。</p></div><div class="v104-actions"><button id="v104Csv" type="button">匯出完整欄位 CSV</button><button id="v104Backup" type="button">匯出欄位設定 JSON</button><button id="v104ImportBtn" type="button">匯入欄位設定</button><input id="v104File" type="file" accept=".json,application/json" hidden></div></div>
  <p class="v104-footer-note" id="v104SaveStatus">設定儲存在本機；使用「私人加密備份」時也會一同包含本模組。仍須在正式 HTTPS 網站驗證跨裝置還原。</p>
 </div></div>`;
document.body.append(dialog);
const rowsEl=$('v104Rows'),giltEl=$('v104GiltGrid'),saveNote=$('v104SaveStatus');
function announce(message,isError=false){if(saveNote){saveNote.textContent=message;saveNote.classList.toggle('v104-error',isError);}}
function syncAll(){const count=state.reservedGiltPens.length;const countEl=$('v104ReserveCount');if(countEl)countEl.textContent=`${count}／2 已指定`;
 const st=$('v104ReserveStatus');if(st)st.textContent=count===2?'已指定預留欄：'+state.reservedGiltPens.map(n=>'G-'+String(n).padStart(2,'0')).join('、')+'；改建後容量待核。':`尚未完成兩欄指派（目前 ${count} 欄）；舊 120 頭僅作改建前規劃參考。`;
 for(const b of giltEl.querySelectorAll('[data-pen]')){const v=state.reservedGiltPens.includes(Number(b.dataset.pen));b.classList.toggle('is-reserved',v);b.setAttribute('aria-pressed',v?'true':'false');b.title=v?'已指定預留欄':'尚未指定預留';b.disabled=!admin();}
 for(const r of rows){const e=rowsEl.querySelector(`[data-pin="${r.id}"]`);if(e){e.textContent=state.pins[r.id]?'✓ 已定位 · 修改位置':'⌖ 在 CAD 標記位置';e.disabled=!admin();}}
 const imp=$('v104ImportBtn');if(imp)imp.disabled=!admin();if(dirty)announce('本機欄位設定尚未儲存！請立即匯出 JSON，避免遺失。',true);
 drawPins();}
function renderRows(){rowsEl.innerHTML='';for(const r of rows){const item=document.createElement('div');item.className='v104-row';const label=document.createElement('div');label.className='v104-row-label';const b=document.createElement('strong');b.textContent=rowLabel(r);const sm=document.createElement('small');sm.textContent=(r.id==='BOAR'?'1 欄／巡情公豬 1 頭':r.id==='GILT'?'14 欄／新容量待核':`${r.count} 個夾欄`)+(r.special?' · 靠水溝':'');label.append(b,sm);
 const actions=document.createElement('div');actions.className='v104-row-actions';const n=document.createElement('b');n.className='v104-count';n.textContent=String(r.count);const btn=document.createElement('button');btn.type='button';btn.dataset.pin=r.id;btn.textContent='⌖ 在 CAD 標記位置';btn.addEventListener('click',()=>startPin(r.id));const list=document.createElement('button');list.type='button';list.textContent='編號';list.title='列出該組第一與最後編號';list.addEventListener('click',()=>{const first=(r.id==='BOAR'?'BOAR-HEAT-01':r.prefix+'-'+(r.id==='GILT'?'01-01':'001'));const last=(r.id==='BOAR'?'BOAR-HEAT-01':r.prefix+'-'+(r.id==='GILT'?'14-10':String(r.count).padStart(3,'0')));alert(`${rowLabel(r)}\n編號範圍：${first} ～ ${last}\nV10.5 已將編號對應至 CAD 繪出的各個欄格。`);});actions.append(n,btn,list);item.append(label,actions);rowsEl.append(item);}syncAll();}
for(let i=1;i<=14;i++){const b=document.createElement('button');b.type='button';b.dataset.pen=i;b.className='v104-pen';b.textContent='G-'+String(i).padStart(2,'0');b.title='第 '+i+' 欄'+(i===7?'（G-07 縮小，容量待核）':'，原設計 10 頭');b.addEventListener('click',()=>{if(!admin())return;const idx=state.reservedGiltPens.indexOf(i);if(idx>=0)state.reservedGiltPens.splice(idx,1);else if(state.reservedGiltPens.length<2)state.reservedGiltPens.push(i);else{announce('最多只能指定 2 個預留欄；請先取消一欄。',true);return;}store();});giltEl.append(b);}
function open(){renderRows();dialog.hidden=false;dialog.querySelector('.v104-body').scrollTop=0;document.body.classList.add('v104-modal-open');dialog.querySelector('.v104-modal').focus();}
function close(){dialog.hidden=true;document.body.classList.remove('v104-modal-open');}
$('v104BaseOpen')?.addEventListener('click',open);equipBtn.addEventListener('click',open);$('v104Close').addEventListener('click',close);dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(placeId){cancelPin();e.preventDefault();}else if(!dialog.hidden){close();e.preventDefault();}}});
function download(content,name,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);}
$('v104Csv').addEventListener('click',()=>{const cols=['編號','區域','排別／欄別','欄號','欄內頭位','指定預留','備註'],quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';const body=genCodes().map(r=>[r.id,r.zone,r.row,r.pen,r.head,r.status,r.note].map(quote).join(','));download('\uFEFF'+[cols.map(quote).join(','),...body].join('\r\n'),'虎尾場_V10.5_欄位編號_713筆_含巡情公豬.csv','text/csv;charset=utf-8');});
$('v104Backup').addEventListener('click',()=>download(JSON.stringify(backupObject(),null,2),'虎尾場_V10.4_欄位設定.json','application/json;charset=utf-8'));
$('v104ImportBtn').addEventListener('click',()=>{if(admin())$('v104File').click();});
$('v104File').addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file||!admin())return;try{if(file.size>1000000)throw Error('設定檔不能超過 1 MB');const raw=JSON.parse(await file.text());if(raw.module!=='HuweiStallCapacity')throw Error('這不是欄位配置 JSON，未匯入');const p=sanitize(raw);if(!confirm(`準備覆蓋本機欄位設定：\n預留欄 ${p.reservedGiltPens.length} 個、CAD 定位標記 ${Object.keys(p.pins).length} 個。\n設備與 CAD 圖面不受影響。是否確定？`))return;state=p;store();announce('欄位設定已匯入。');}catch(err){announce('匯入失敗：'+err.message,true);}});
const map=$('plan'),svgNS='http://www.w3.org/2000/svg';let pinLayer;
if(map){pinLayer=document.createElementNS(svgNS,'g');pinLayer.setAttribute('id','v104PinOverlay');pinLayer.setAttribute('class','v104-pin-overlay');pinLayer.setAttribute('pointer-events','none');map.append(pinLayer);}
function drawPins(){if(!pinLayer)return;pinLayer.replaceChildren();for(const r of rows){const pin=state.pins[r.id];if(!pin)continue;const g=document.createElementNS(svgNS,'g');g.setAttribute('transform',`translate(${pin.x} ${pin.y})`);g.classList.add('v104-map-pin');if(highlightId===r.id)g.classList.add('highlight');const circle=document.createElementNS(svgNS,'circle');circle.setAttribute('r','.64');const t=document.createElementNS(svgNS,'text');t.setAttribute('x','.9');t.setAttribute('y','.15');t.textContent=(r.id==='GILT'?'育成':r.id==='MAT'?'配種':r.id+'排')+' '+r.count;g.append(circle,t);const title=document.createElementNS(svgNS,'title');title.textContent=rowLabel(r)+'：'+r.count+' '+r.unit;g.append(title);pinLayer.append(g);}}
function startPin(id){if(!admin()||!knownIds.has(id))return;HW?.cancelAction?.();placeId=id;highlightId=id;drawPins();close();const note=$('v104PinHint')||document.createElement('div');note.id='v104PinHint';note.className='v104-pin-hint';note.textContent='⌖ 請在 CAD 圖上點選「'+rowLabel(rows.find(r=>r.id===id))+'」的位置 · Esc 取消';document.body.append(note);if(innerWidth<=760)$('side')?.classList.remove('open');}
function cancelPin(){placeId=null;highlightId=null;$('v104PinHint')?.remove();drawPins();}
if(map){map.addEventListener('pointerdown',e=>{if(!placeId)return;e.stopImmediatePropagation();e.preventDefault();},true);
 const capturePin=e=>{if(!placeId)return;e.stopImmediatePropagation();e.preventDefault();if(!admin()){cancelPin();return;}try{let pt=map.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const ctm=map.getScreenCTM();if(!ctm)throw Error('無法換算 CAD 座標');pt=pt.matrixTransform(ctm.inverse());const b=map.viewBox.baseVal;if(pt.x<b.x||pt.x>b.x+b.width||pt.y<b.y||pt.y>b.y+b.height)throw Error('請選在 CAD 圖面內');state.pins[placeId]={x:+pt.x.toFixed(4),y:+pt.y.toFixed(4)};const name=rowLabel(rows.find(r=>r.id===placeId));cancelPin();store();open();announce('已指定 '+name+' 的 CAD 標記位置；欄格已校正；這是排別快速標記位置。');}catch(err){alert('無法定位：'+err.message);}};
 map.addEventListener('pointerup',capturePin,true);map.addEventListener('click',capturePin,true);}
function restore(raw){try{state=sanitize(raw);const ok=store();return {ok,reason:ok?'':'本機儲存失敗'};}catch(e){return {ok:false,reason:e.message};}}
window.HWStallCapacity={version:'10.5',rows:rows.map(r=>({...r})),getSummary:()=>({mating:76,gestationA:252,gestationB:244,gestation:496,matingAndGestation:572,giltPens:14,giltDesignHeads:140,giltReferenceHeads:120,giltCapacityVerified:false,giltPen07Reduced:true,giltUpdatedTotalHeads:null,reservedPens:[...state.reservedGiltPens],pins:structured().pins,physicalMapCalibrated:false,physicalCountsMatched:true,fieldWidthsMeasured:false,boarHeatPen:1}),getState:structured,getBackupData:backupObject,validateBackupData:raw=>sanitize(raw),restore,getIdentifiers:genCodes,open,close};
window.addEventListener('hw-v90-change',syncAll);renderRows();drawPins();
})();
