/* V11.10.9 — visual-only status navigation; never modifies authoritative device data. */
(function(){'use strict';
const hw=window.HWEquipment,viewer=document.querySelector('.viewer'),icons=document.getElementById('eqIcons');
if(!hw||!viewer||!icons)return;
const config={unchecked:['未巡檢','#91aabe'],normal:['正常','#64dbaf'],abnormal:['異常','#ff727b'],repairing:['維修中','#f4b76c'],offline:['停用','#adb9cc']};
let filter='all',query='',opened=false,targetId='',peekId='';
const make=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;};
const state=d=>config[d.condition]?d.condition:'unchecked';
const deviceList=()=>{const data=hw.getData();return Array.isArray(data.devices)?data.devices:[];};
const toggle=make('button','','設備狀態');toggle.id='hw109Toggle';toggle.type='button';toggle.setAttribute('aria-controls','hw109Panel');toggle.setAttribute('aria-expanded','false');toggle.title='開啟全場人工巡檢狀態清單';
const alertCount=make('span','hw109-alert-count');alertCount.hidden=true;toggle.append(alertCount);
const panel=make('section');panel.id='hw109Panel';panel.hidden=true;panel.setAttribute('aria-label','CAD 設備狀態');
panel.innerHTML=`<div class="hw109-panel-head"><div><strong>全場設備狀態</strong><small>來自人工巡檢紀錄，非即時監測</small></div><button type="button" id="hw109Close" aria-label="關閉設備狀態">✕</button></div>
<div class="hw109-summary" id="hw109Summary"></div><div class="hw109-filters" id="hw109Filters" role="group" aria-label="狀態篩選"></div>
<div class="hw109-controls"><input id="hw109Query" type="search" placeholder="搜尋設備、棟舍、編號" aria-label="篩選設備名稱或棟舍" autocomplete="off"></div>
<div class="hw109-list" id="hw109List" aria-live="polite"></div><div class="hw109-foot">篩選只淡化不符合的圖示，不會隱藏、移動或修改 CAD 設備。未巡檢不代表正常。</div>`;
const peek=make('aside');peek.id='hw109Peek';peek.hidden=true;peek.setAttribute('aria-label','設備定位資訊');
peek.innerHTML='<div class="hw109-peek-copy"><b id="hw109PeekName"></b><small id="hw109PeekMeta"></small></div><button type="button" id="hw109PeekHistory">查看巡檢</button><button type="button" id="hw109PeekClose" aria-label="關閉定位資訊">✕</button>';
viewer.append(toggle,panel,peek);
const el=id=>document.getElementById(id);
function apply(){const devices=deviceList(),byId=new Map(devices.map(d=>[d.id,d]));const needle=query.trim().toLocaleLowerCase();
 for(const g of icons.querySelectorAll('[data-eq-device]')){
  const d=byId.get(g.getAttribute('data-eq-device'));if(!d)continue;
  const matches=filter==='all'||state(d)===filter;
  const searchable=[d.name,d.zone,d.id,hw.getType?.(d.type)?.label].join(' ').toLocaleLowerCase().includes(needle);
  g.classList.toggle('hw109-muted',!matches||!searchable);
  g.classList.toggle('hw109-target',g.getAttribute('data-eq-device')===targetId);
 }
}
function close(){opened=false;panel.hidden=true;document.body.classList.remove('hw109-panel-open');toggle.setAttribute('aria-expanded','false');query='';el('hw109Query').value='';apply();toggle.focus({preventScroll:true});}
function hidePeek(){peek.hidden=true;peekId='';}
function visible(){return !(document.body.classList.contains('v119-home-open')||document.body.classList.contains('v1194-hub-open'));}
function locate(id){const data=deviceList(),d=data.find(d=>d.id===id);if(!d)return;
 const group=hw.getType?.(d.type)?.group;if(group&&hw.getVisibility?.()[group]===false){hw.setVisibility?.(group,true);}
 if(!visible()){window.HWWorkspaceHubV1194?.close?.();window.HWHomeV119?.hide?.();}
 const where=hw.getVisualPlacement?.(id)?.icon||{x:d.displayX??d.x,y:d.displayY??d.y};
 hw.focus?.(where.x,where.y);if(el('eqDetails'))el('eqDetails').hidden=true;targetId=id;close();apply();peekId=id;el('hw109PeekName').textContent=d.name;el('hw109PeekMeta').textContent=(d.zone||'未設定棟舍')+' · '+config[state(d)][0]+' · 原始紀錄可進巡檢中心查看';peek.hidden=false;
}
function openInspection(id){hidePeek();close();window.HWInspectionV11108?.open?.(id);}
function stats(){const list=deviceList(),counts={unchecked:0,normal:0,abnormal:0,repairing:0,offline:0};for(const d of list)counts[state(d)]++;return {total:list.length,counts};}
function drawSummary(){const {total,counts}=stats(),root=el('hw109Summary');root.replaceChildren();for(const [label,n,col] of [['設備總數',total,'#83cde5'],['異常待修',counts.abnormal,'#ff727b'],['維修中',counts.repairing,'#f4b76c']]){const box=make('div');const b=make('b','',String(n));b.style.color=col;box.append(b,make('small','',label));root.append(box);}const n=counts.abnormal+counts.repairing;alertCount.textContent=n;alertCount.hidden=n===0;toggle.setAttribute('aria-label',`設備狀態，異常與維修中共 ${n} 台`);}
function drawFilters(){toggle.firstChild.textContent=filter==='all'?'設備狀態':'狀態：'+config[filter][0];const root=el('hw109Filters');root.replaceChildren();const {total,counts}=stats();for(const [key,label,col,count] of [['all','全部','#8fdfe8',total],...Object.entries(config).map(([k,v])=>[k,v[0],v[1],counts[k]])]){const btn=make('button','',label+' '+count);btn.type='button';btn.dataset.status=key;btn.setAttribute('aria-pressed',String(filter===key));const dot=make('i','hw109-filter-dot');dot.style.background=col;btn.prepend(dot);root.append(btn);}}
function drawList(){const root=el('hw109List');root.replaceChildren();const q=query.trim().toLocaleLowerCase();let matches=deviceList().filter(d=>(filter==='all'||state(d)===filter)&&[d.name,d.zone,d.id,hw.getType?.(d.type)?.label].join(' ').toLocaleLowerCase().includes(q));
 const priority={abnormal:0,repairing:1,offline:2,unchecked:3,normal:4};matches.sort((a,b)=>priority[state(a)]-priority[state(b)]||String(a.name).localeCompare(String(b.name),'zh-Hant'));
 if(!matches.length){root.append(make('p','', '目前沒有符合條件的設備。'));return;}
 for(const d of matches.slice(0,80)){const r=make('div','hw109-row');const dot=make('i','hw109-row-bullet');dot.style.background=config[state(d)][1];const copy=make('span','hw109-row-main');copy.append(make('b','',d.name),make('small','',(d.zone||'未填棟舍')+' · '+config[state(d)][0]+(d.lastInspectionAt?' · '+d.lastInspectionAt:'')));const actions=make('span','hw109-row-actions');for(const [a,label] of [['locate','定位'],['history','紀錄']]){const b=make('button','',label);b.type='button';b.dataset.action=a;b.dataset.id=d.id;actions.append(b);}r.append(dot,copy,actions);root.append(r);}
 if(matches.length>80)root.append(make('p','',`另有 ${matches.length-80} 台，請輸入名稱縮小範圍。`));
}
function refresh(){drawSummary();drawFilters();if(opened)drawList();apply();}
toggle.addEventListener('click',()=>{opened=!opened;panel.hidden=!opened;document.body.classList.toggle('hw109-panel-open',opened);toggle.setAttribute('aria-expanded',String(opened));if(opened){hidePeek();refresh();el('hw109Query').focus({preventScroll:true});}});
el('hw109Close').addEventListener('click',close);
el('hw109Query').addEventListener('input',e=>{query=e.target.value;drawList();apply();});
el('hw109Filters').addEventListener('click',e=>{const b=e.target.closest('button[data-status]');if(!b)return;filter=b.dataset.status;drawFilters();drawList();apply();});
el('hw109List').addEventListener('click',e=>{const btn=e.target.closest('button[data-action]');if(!btn)return;if(btn.dataset.action==='history')openInspection(btn.dataset.id);else locate(btn.dataset.id);});
el('hw109PeekHistory').onclick=()=>{if(peekId)openInspection(peekId);};el('hw109PeekClose').onclick=hidePeek;
for(const child of [panel,toggle,peek])child.addEventListener('pointerdown',e=>e.stopPropagation());
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){e.stopPropagation();close();}});
window.addEventListener('hw-v90-change',e=>{if(['data','workspace','role','selection'].includes(e.detail?.kind)){refresh();Promise.resolve().then(apply);}});
window.HWStatusMapV11109={open:()=>{if(!opened)toggle.click();},close,locate,setFilter:k=>{if(k==='all'||config[k]){filter=k;refresh();}},getFilter:()=>filter,getCounts:()=>stats().counts,refresh};
refresh();
})();