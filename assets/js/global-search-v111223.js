/* V11.12.23 — CAD top-center universal local search. Read-only; reuses the existing CAD locator. */
(function(){
'use strict';
const api=window.HWEquipment,locateApi=window.HWQuickLocateV1192,viewer=document.querySelector('.viewer');
if(!api||!locateApi||!viewer)return;
const $=id=>document.getElementById(id);
const search=document.createElement('section');
search.id='v1223Search';search.setAttribute('role','search');search.setAttribute('aria-label','搜尋全系統設備、管線及設備相關紀錄');
search.innerHTML=`<div class="v1223-query-row">
  <span class="v1223-mag" aria-hidden="true">⌕</span>
  <label class="v1223-sr" for="v1223Input">搜尋設備、名稱、位置、照片、開關端子和維修資料</label>
  <input id="v1223Input" type="search" autocomplete="off" spellcheck="false" placeholder="搜尋設備、名稱、棟舍、端子…" aria-controls="v1223List" aria-expanded="false" aria-autocomplete="list">
  <button type="button" id="v1223Clear" title="清除搜尋" aria-label="清除搜尋" hidden>×</button>
  <button type="button" id="v1223More" title="完整搜尋與條件篩選" aria-label="開啟完整搜尋">進階</button>
</div>
<div id="v1223List" class="v1223-list" hidden role="listbox" aria-label="設備搜尋建議">
 <div class="v1223-list-head" id="v1223Count" aria-live="polite">搜尋本機設備資料</div>
 <div id="v1223Items"></div>
 <button type="button" class="v1223-all" id="v1223All">開啟完整搜尋與分類篩選 ↗</button>
 <p id="v1223Message" class="v1223-message" role="status" hidden></p>
</div>`;
viewer.appendChild(search);
const input=$('v1223Input'),list=$('v1223List'),host=$('v1223Items'),message=$('v1223Message');
let results=[],active=-1,showing=false;
const norm=v=>String(v??'').normalize('NFKC').toLocaleLowerCase('zh-TW');
const flatten=v=>Array.isArray(v)?v.map(flatten).join(' '):v&&typeof v==='object'?Object.values(v).map(flatten).join(' '):String(v??'');
const hasTerms=(hay,tokens)=>tokens.every(w=>hay.includes(w));
function index(){
  const data=api.getData(),devices=Array.isArray(data.devices)?data.devices:[],routes=Array.isArray(data.routes)?data.routes:[];
  const works=Array.isArray(data.maintenance)?data.maintenance:[];
  const byDevice=new Map();for(const job of works){if(job.deviceId){if(!byDevice.has(job.deviceId))byDevice.set(job.deviceId,[]);byDevice.get(job.deviceId).push(job);}}
  const all=devices.map(d=>{
    const type=api.getType(d.type)||{};
    const primary=[d.name,d.id,d.zone,type.label,d.type,flatten(d.fields),d.note,d.status,d.condition].map(norm).join(' ');
    const details=[];
    for(const ph of d.photos||[]){details.push({label:'照片',text:ph.name||''});for(const m of ph.markers||[])details.push({label:'照片標記',text:[m.title,m.note,m.terminalId].join(' ')});}
    for(const t of d.terminals||[])details.push({label:'開關／端子',text:[t.name,t.purpose,t.controls,t.note,t.direction,t.feedsFrom].join(' ')});
    for(const job of byDevice.get(d.id)||[])details.push({label:'維修／巡檢',text:[job.title,job.description,job.result,job.assignee,job.reporter,job.kind].join(' ')});
    return {kind:'device',id:d.id,title:d.name||'未命名設備',subtitle:[d.zone||'未指定棟舍',type.label||d.type||'設備'].join(' · '),primary,details,full:primary+' '+details.map(x=>norm(x.text)).join(' ')};
  });
  for(const r of routes){const grp={water:'水管',electric:'電力線路',feed:'飼料管',ventilation:'通風線路'}[r.group]||'管線';
    const ends=devices.filter(d=>[r.fromDeviceId,r.toDeviceId].includes(d.id)).map(d=>d.name);
    const fields=[r.id,r.name,r.note,r.purpose,r.circuitName,r.cableSpec,r.group,r.fromDeviceId,r.toDeviceId,...ends];
    const primary=fields.map(norm).join(' ');
    all.push({kind:'route',id:r.id,title:r.name||r.circuitName||'未命名線路',subtitle:grp+' · '+ends.join(' → '),primary,details:[],full:primary});
  }
  return all;
}
function ranked(row,q,tokens){const t=norm(row.title),id=norm(row.id),subtitle=norm(row.subtitle);
  if(t===q||id===q)return 0;if(t.startsWith(q))return 1;if(t.includes(q))return 2;if(id.includes(q))return 3;
  if(subtitle.includes(q))return 4;if(hasTerms(row.primary,tokens))return 5;return 6;
}
function find(){
 const q=norm(input.value.trim()).replace(/\s+/g,' '),tokens=q.split(' ').filter(Boolean);
 if(!tokens.length)return [];
 return index().filter(row=>hasTerms(row.full,tokens)).sort((a,b)=>ranked(a,q,tokens)-ranked(b,q,tokens)||a.title.localeCompare(b.title,'zh-Hant'));
}
function setOpen(yes){showing=!!yes;list.hidden=!showing;input.setAttribute('aria-expanded',String(showing));if(!yes){active=-1;input.removeAttribute('aria-activedescendant');}}
function describe(row,q,tokens){
 if(row.kind==='route')return row.subtitle;
 const match=row.details.find(x=>hasTerms(norm(x.text),tokens));
 return match?(row.subtitle+' · '+match.label+'：'+String(match.text).slice(0,65)):row.subtitle;
}
function render(){
 const q=norm(input.value.trim()).replace(/\s+/g,' '),tokens=q.split(' ').filter(Boolean);
 $('v1223Clear').hidden=!q;message.hidden=true;message.textContent='';host.replaceChildren();results=find();active=-1;
 if(!q){setOpen(false);return;}
 setOpen(true);
 $('v1223Count').textContent=`找到 ${results.length} 筆相關設備／管線`+(results.length>8?' · 顯示前 8 筆':'');
 if(!results.length){const empty=document.createElement('p');empty.className='v1223-empty';empty.textContent='沒有符合的設備或線路，請更換名稱、編號或棟舍關鍵字。';host.appendChild(empty);return;}
 for(const [i,row] of results.slice(0,8).entries()){
   const line=document.createElement('div');line.className='v1223-item';line.dataset.index=String(i);
   const button=document.createElement('button');button.type='button';button.className='v1223-hit';button.dataset.index=String(i);button.id='v1223Result'+i;button.setAttribute('role','option');button.setAttribute('aria-selected','false');
   const symbol=document.createElement('span');symbol.className='v1223-kind';symbol.textContent=row.kind==='route'?'⌁':'⚙';
   const content=document.createElement('span');content.className='v1223-content';const title=document.createElement('strong');title.textContent=row.title;const desc=document.createElement('small');desc.textContent=describe(row,q,tokens);
   content.append(title,desc);button.append(symbol,content);
   line.append(button);
   if(row.kind==='device'){
      const record=document.createElement('button');record.type='button';record.className='v1223-open-record';record.dataset.index=String(i);record.setAttribute('aria-label','定位並開啟 '+row.title+' 的設備檔案');record.title='開啟設備檔案';record.textContent='檔案';line.append(record);
   }
   host.append(line);
 }
}
function notify(text){message.textContent=text;message.hidden=false;}
function choose(index,openRecord=false){const row=results[index];if(!row)return;
 if(!locateApi.locate(row.kind,row.id)){notify('目前正在編輯或繪製線路，請先完成或關閉編輯視窗，再定位搜尋結果。');return;}
 setOpen(false);input.blur();
 if(openRecord && row.kind==='device'){
   try{api.openEditor();}catch(e){console.warn('設備檔案開啟失敗',e);}
 }
}
function setActive(i){if(!results.length)return;active=Math.max(0,Math.min(results.length-1, i));
 for(const el of host.querySelectorAll('.v1223-hit')){const selected=Number(el.dataset.index)===active;el.setAttribute('aria-selected',String(selected));}
 const hit=$('v1223Result'+active);if(hit){input.setAttribute('aria-activedescendant',hit.id);hit.scrollIntoView({block:'nearest'});}
}
input.addEventListener('input',render);
input.addEventListener('focus',()=>{if(input.value.trim())render();});
input.addEventListener('keydown',e=>{
 if(e.key==='ArrowDown'){e.preventDefault();setActive(active+1);return;}
 if(e.key==='ArrowUp'){e.preventDefault();setActive(active<=0?0:active-1);return;}
 if(e.key==='Enter'&&results.length){e.preventDefault();choose(active<0?0:active);return;}
 if(e.key==='Escape'){e.stopPropagation();if(input.value){input.value='';render();}else{setOpen(false);input.blur();}}
});
host.addEventListener('click',e=>{const target=e.target.closest('button[data-index]');if(!target)return;choose(Number(target.dataset.index),target.classList.contains('v1223-open-record'));});
$('v1223Clear').addEventListener('click',()=>{input.value='';render();input.focus();});
function more(){const q=input.value;setOpen(false);locateApi.search(q);}
$('v1223More').addEventListener('click',more);$('v1223All').addEventListener('click',more);
document.addEventListener('pointerdown',e=>{if(!search.contains(e.target))setOpen(false);});
window.addEventListener('hw-v90-change',e=>{if(e.detail?.kind==='data'&&showing)render();});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!e.target?.closest?.('input,textarea,[contenteditable]')){e.preventDefault();input.focus();input.select();render();}},true);
window.HWGlobalSearchV111223={getResults:q=>{input.value=q;render();return results.map(x=>({kind:x.kind,id:x.id,title:x.title}));},close:()=>setOpen(false),open:()=>input.focus()};
})();
