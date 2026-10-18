/* V11.6 — independent, multi-building system graph.
 * A category is a classification; each actual system is a saved project node.
 * A node can link to multiple upstream mother systems (same discipline).
 * Device/route membership is explicit and is never inferred from CAD proximity.
 */
(()=>{'use strict';
const HW=window.HWEquipment;if(!HW)return;
const groups=[{id:'electric',label:'電力',icon:'⚡'},{id:'water',label:'供水',icon:'💧'},{id:'ventilation',label:'通風',icon:'◉'},{id:'feed',label:'飼料',icon:'▰'}];
const $=id=>document.getElementById(id);const el=(tag,cls,text)=>{const d=document.createElement(tag);if(cls)d.className=cls;if(text!==undefined)d.textContent=String(text);return d;};
let visible=false,activeId='',editId='',groupFilter='all',searchTerm='',zoneFilter='',linkSearch='',priorFocus=null;
const root=el('div','v116-overlay');root.id='v116Overlay';root.hidden=true;
root.innerHTML=`<div class="v116-window" role="dialog" aria-modal="true" aria-labelledby="v116Title" tabindex="-1">
 <header class="v116-head"><div><small>HUWEI FARM · SYSTEM STRUCTURE</small><h2 id="v116Title">全場系統架構</h2><p>母系統 → 各棟舍子系統 → 實際設備與線路；不限一類一張卡片</p></div><button type="button" id="v116Close" aria-label="關閉系統架構">✕</button></header>
 <div class="v116-filter"><label>系統類別<select id="v116Category"><option value="all">全部類別</option><option value="electric">⚡ 電力</option><option value="water">💧 供水</option><option value="ventilation">◉ 通風</option><option value="feed">▰ 飼料</option></select></label><label>棟舍／位置<input id="v116Zone" placeholder="例：妊娠 B 棟" autocomplete="off"></label><label>搜尋系統<input id="v116Search" placeholder="系統名稱、上游、區域" autocomplete="off"></label><button type="button" id="v116AddRoot" class="v116-primary">＋ 新增母系統</button></div>
 <div class="v116-main"><section class="v116-tree-pane"><div class="v116-section-title">系統關係 <span id="v116Total"></span></div><div id="v116Tree" class="v116-tree"></div></section><section class="v116-detail-pane"><div id="v116Details"></div></section></div>
 <p class="v116-message" id="v116Message" role="status" aria-live="polite"></p><footer class="v116-foot">母子關係表示手動建立的系統分組，不代表已確認通電、通水或飼料實際連通。設備與管線仍依原 CAD、端子及現場核對紀錄判定。</footer></div>`;
document.body.append(root);
const launch=el('button','v116-launch','▤ 全場系統架構・棟舍子系統');launch.type='button';launch.id='v116Launch';
// Keep it inside the existing compact equipment sidebar, not above the map.
const start=$('v95Start'),sidebar=$('v83EquipPanel');if(start)start.after(launch);else sidebar?.prepend(launch);
const mobilebar=document.querySelector('.mobilebar');let mobileBtn=null;
if(mobilebar){mobileBtn=el('button','v116-mobile','系統');mobileBtn.type='button';mobileBtn.id='v116MobileLaunch';mobileBtn.title='開啟全場母子系統架構';mobileBtn.setAttribute('aria-label','開啟全場母子系統架構');mobilebar.append(mobileBtn);}
const get=()=>HW.getData(),nodes=()=>get().systemNodes||[],nameOf=id=>nodes().find(s=>s.id===id)?.name||'已移除',groupName=id=>groups.find(g=>g.id===id)?.label||id;
function message(s,bad=false){$('v116Message').textContent=s||'';$('v116Message').dataset.error=bad?'true':'false';}
function open(){priorFocus=document.activeElement;HW.setWorkspace('equipment');visible=true;root.hidden=false;render();root.querySelector('.v116-window').focus();if(window.innerWidth<=760)$('side')?.classList.remove('open');}
function close(){visible=false;root.hidden=true;editId='';priorFocus?.focus?.();}
launch.addEventListener('click',open);mobileBtn?.addEventListener('click',open);$('v116Close').onclick=close;
root.addEventListener('click',e=>{if(e.target===root)close();});
document.addEventListener('keydown',e=>{if(visible&&e.key==='Escape'){e.stopPropagation();close();}});
$('v116Category').addEventListener('change',e=>{groupFilter=e.target.value;render();});
$('v116Zone').addEventListener('input',e=>{zoneFilter=e.target.value.trim().toLowerCase();renderTree();});
$('v116Search').addEventListener('input',e=>{searchTerm=e.target.value.trim().toLowerCase();renderTree();});
$('v116AddRoot').onclick=()=>{if(HW.getRole()!=='admin')return message('員工唯讀；請切換本機管理者模式後編輯。',true);editId='new';activeId='';renderDetail();};
function label(txt){return el('span','',txt);}
function button(txt,handler,klass=''){const b=el('button',klass,txt);b.type='button';b.addEventListener('click',handler);return b;}
function visibleMatches(item,byId){if(groupFilter!=='all'&&item.group!==groupFilter)return false;
 const chain=[];const seen=new Set();function walk(id){if(seen.has(id))return;seen.add(id);const p=byId.get(id);if(!p)return;chain.push(p.name,p.zone);p.parentIds.forEach(walk);}walk(item.id);
 const hay=chain.join(' ').toLowerCase();return(!zoneFilter||hay.includes(zoneFilter))&&(!searchTerm||hay.includes(searchTerm));}
function renderTree(){const data=get(),all=data.systemNodes||[],byId=new Map(all.map(x=>[x.id,x]));
 const list=el('div','v116-roots');const wanted=new Set(all.filter(x=>visibleMatches(x,byId)).map(x=>x.id));
 // Show ancestors too, so filtered children are never detached from mother systems.
 for(const id of [...wanted]){const visited=new Set();function up(parentId){if(visited.has(parentId))return;visited.add(parentId);if(!byId.has(parentId))return;wanted.add(parentId);byId.get(parentId).parentIds.forEach(up);}byId.get(id)?.parentIds.forEach(up);}
 for(const category of groups){if(groupFilter!=='all'&&category.id!==groupFilter)continue;
  const categoryNodes=all.filter(x=>x.group===category.id),shown=categoryNodes.filter(x=>wanted.has(x.id));
  const box=el('section','v116-category');const head=el('div','v116-group-head');head.append(el('strong','',category.icon+' '+category.label),el('small','',`${categoryNodes.length} 個系統`));box.append(head);
  if(!shown.length){box.append(el('p','v116-empty',categoryNodes.length?'沒有符合篩選的系統':'尚未建立母系統；可依各棟舍自行新增。'));}
  else{
   const primaryChildren=new Map();for(const item of categoryNodes){const parent=item.parentIds[0]||'';if(!primaryChildren.has(parent))primaryChildren.set(parent,[]);primaryChildren.get(parent).push(item);}
   const counts=new Map();for(const d of data.devices||[])for(const id of d.systemIds||[])counts.set(id,(counts.get(id)||0)+1);
   const routeCounts=new Map();for(const r of data.routes||[])for(const id of r.systemIds||[])routeCounts.set(id,(routeCounts.get(id)||0)+1);
   const visit=(item,depth=0)=>{if(!wanted.has(item.id)||depth>18)return;
    const b=button('',()=>{activeId=item.id;editId='';renderTree();renderDetail();},'v116-node'+(activeId===item.id?' selected':''));b.style.setProperty('--depth',Math.min(9,depth));
    const title=el('span','v116-node-title');title.append(el('strong','',item.name),el('small','',item.zone||'未設定棟舍'));
    b.append(el('span','v116-node-mark',depth?'↳':'◈'),title,el('span','v116-node-count',`${counts.get(item.id)||0} 設備 · ${routeCounts.get(item.id)||0} 線`));box.append(b);
    for(const ch of (primaryChildren.get(item.id)||[]))visit(ch,depth+1);
   };
   for(const item of categoryNodes.filter(x=>!x.parentIds[0]||!byId.has(x.parentIds[0])))visit(item);
  }list.append(box);
 }
 $('v116Total').textContent=all.length+' 個獨立系統';$('v116Tree').replaceChildren(list);
}
function render(){const isAdmin=HW.getRole()==='admin';$('v116AddRoot').hidden=!isAdmin;renderTree();renderDetail();}
function nodeEditor(current){const data=get(),all=data.systemNodes||[],canEdit=HW.getRole()==='admin';const isNew=!current;const d=el('section','v116-edit');
 d.append(el('h3','',isNew?'建立系統':'編輯系統資料'));
 const group=el('select');for(const cat of groups){const op=el('option','',cat.icon+' '+cat.label);op.value=cat.id;group.append(op);}group.value=current?.group||groups.find(g=>g.id===groupFilter)?.id||'water';
 const name=el('input');name.placeholder='例如：妊娠 B 棟給水分支 01';name.value=current?.name||'';name.maxLength=100;
 const zone=el('input');zone.placeholder='例如：妊娠 B 棟／第 3 排';zone.value=current?.zone||'';zone.maxLength=100;
 const note=el('textarea');note.placeholder='用途、控制區域、閥位及備註（不能代替現場核對）';note.value=current?.note||'';note.maxLength=500;note.rows=2;
 function field(t,input){const l=el('label','v116-field');l.append(el('span','',t),input);d.append(l);}
 field('系統類型',group);field('名稱',name);field('棟舍／位置',zone);
 const parents=el('div','v116-parents');const parentLabel=el('div','v116-section-title','連接上游母系統（可多選；不等於管線已連通）');d.append(parentLabel,parents);
 function renderParents(){parents.replaceChildren();const candidates=all.filter(x=>x.id!==current?.id&&x.group===group.value);if(!candidates.length){parents.append(el('small','v116-muted','此類別目前沒有其他系統；可以先建立獨立母系統。'));return;}
  for(const x of candidates){const l=el('label','v116-parent-option'),c=el('input');c.type='checkbox';c.value=x.id;c.checked=(current?.parentIds||[]).includes(x.id);l.append(c,label(x.name+(x.zone?' · '+x.zone:'')));parents.append(l);}
 }
 group.onchange=renderParents;renderParents();field('備註',note);
 const row=el('div','v116-buttons');row.append(button('取消',()=>{editId='';renderDetail();}));
 row.append(button('儲存系統',()=>{const r=HW.saveSystemNode({id:current?.id,group:group.value,name:name.value,zone:zone.value,note:note.value,parentIds:[...parents.querySelectorAll('input:checked')].map(x=>x.value)});if(!r.ok)return message(r.error,true);editId='';activeId=r.id;if(groupFilter!=='all'&&groupFilter!==group.value){groupFilter=group.value;$('v116Category').value=groupFilter;}zoneFilter='';searchTerm='';$('v116Zone').value='';$('v116Search').value='';message('系統架構已儲存（含母子關係）');render();},'v116-primary'));
 d.append(row);return d;
}
function renderDetail(){const host=$('v116Details');host.replaceChildren();const data=get(),sys=data.systemNodes||[],node=sys.find(s=>s.id===activeId),admin=HW.getRole()==='admin';
 if(editId==='new'||editId&&node&&editId===node.id){host.append(nodeEditor(editId==='new'?null:node));return;}
 if(!node){host.append(el('div','v116-welcome','請在左側選擇母系統或子系統。每種系統可依不同棟舍建立多個分支，並可共同接回上游母系統。'));return;}
 const title=el('div','v116-detail-head');title.append(el('small','',groupName(node.group)+(node.zone?' · '+node.zone:'')),el('h3','',node.name));
 if(node.note)title.append(el('p','v116-muted',node.note));host.append(title);
 const actions=el('div','v116-buttons');if(admin){actions.append(button('＋ 建立下層子系統',()=>{editId='new';activeId=node.id; // preset upstream in editor below
   renderDetailWithParent(node.id);},'v116-primary'));
 actions.append(button('編輯母系統連結',()=>{editId=node.id;renderDetail();}));
 actions.append(button('刪除空系統',()=>{if(!confirm(`確定刪除「${node.name}」？`))return;const r=HW.removeSystemNode(node.id);if(!r.ok)return message(r.error,true);activeId='';message('已刪除沒有下屬與設備關聯的空系統');render();},'v116-danger'));}
 host.append(actions);
 const meta=el('div','v116-meta');meta.append(el('b','',node.parentIds.length?'上游母系統':'系統根節點'));
 const upstream=el('div','v116-upstreams');if(!node.parentIds.length)upstream.append(el('small','v116-muted','此系統沒有上游母系統；可作為主來源。'));
 for(const id of node.parentIds){const p=sys.find(x=>x.id===id);upstream.append(button('↖ '+(p?.name||id),()=>{activeId=id;render();},'v116-chip'));}
 meta.append(upstream);host.append(meta);
 const kids=sys.filter(x=>x.parentIds.includes(node.id));const info=el('div','v116-info');info.textContent=`下屬系統 ${kids.length} 個 · 直接關聯設備 ${data.devices.filter(x=>x.systemIds?.includes(node.id)).length} 台 · 直接關聯線路 ${data.routes.filter(x=>x.systemIds?.includes(node.id)).length} 條`;host.append(info);
 const selection=HW.getSelected?.();const chosen=selection?.kind==='device'?data.devices.find(x=>x.id===selection.id):selection?.kind==='route'?data.routes.find(x=>x.id===selection.id):null;
 const selectedBox=el('div','v116-selected');selectedBox.append(el('strong','',chosen?'CAD 目前選取：'+chosen.name:'CAD 尚未選取設備或線路'));
 if(chosen){const has=(chosen.systemIds||[]).includes(node.id);selectedBox.append(button(has?'− 從此系統解除關聯':'＋ 加入目前選取的設備／線路',()=>toggleLink(selection.kind,chosen.id,node.id),has?'v116-remove':'v116-primary'));}
 else selectedBox.append(el('small','v116-muted','關閉視窗選擇 CAD 設備，再回到這裡關聯；也可從下方搜尋批次選取。'));
 host.append(selectedBox);
 const section=el('div','v116-connections');section.append(el('h4','',`設備與管線關聯`));
 const search=el('input');search.type='search';search.placeholder='找設備名稱、棟舍、管線／電力…';search.value=linkSearch;section.append(search);
 const bulk=el('div','v116-bulk');section.append(bulk);
 const items=el('div','v116-linkitems');section.append(items);
 function drawItems(){items.replaceChildren();bulk.replaceChildren();const text=search.value.trim().toLowerCase();linkSearch=search.value;
  const candidates=[...data.devices.map(x=>({...x,kind:'device'})),...data.routes.map(x=>({...x,kind:'route'}))];
  let hits=candidates.filter(x=>(x.systemIds||[]).includes(node.id)||text&&[x.name,x.zone,x.type,x.circuitName,x.id].some(z=>String(z||'').toLowerCase().includes(text)));
  hits.sort((a,b)=>Number((b.systemIds||[]).includes(node.id))-Number((a.systemIds||[]).includes(node.id)));
  const batchMatches=text.length>=2?candidates.filter(x=>[x.name,x.zone,x.type,x.circuitName,x.id].some(z=>String(z||'').toLowerCase().includes(text))):[];
  const unlinked=batchMatches.filter(x=>!(x.systemIds||[]).includes(node.id));
  if(admin&&text.length>=2&&unlinked.length){const count=Math.min(200,unlinked.length),many=button('＋ 批次關聯 '+count+' 筆符合搜尋的設備／線路',()=>{
    const refs=unlinked.slice(0,200).map(x=>({kind:x.kind,id:x.id}));
    if(!confirm(`確定把 ${refs.length} 筆搜尋結果連到「${node.name}」？此動作不代表已完成現場接線核對。`))return;
    const r=HW.bulkSystemLink(node.id,refs,'add');if(!r.ok)return message(r.error,true);
    message('已批次建立 '+r.changed+' 筆關聯；管線和實際電路仍需現場確認');render();
   },'v116-primary');bulk.append(many);if(unlinked.length>200)bulk.append(el('small','v116-muted','一次最多 200 筆；請分區域縮小搜尋再繼續。'));}
  hits=hits.slice(0,70);
  if(!hits.length)items.append(el('p','v116-muted','目前沒有已關聯設備。可在搜尋框查找並連結現有設備或線路；不會建立虛構設備。'));
  for(const x of hits){const row=el('div','v116-linkitem');const description=el('span','v116-linkcopy');description.append(el('strong','',x.name),el('small','',x.kind==='device'?(x.zone||x.type):'管線 · '+groupName(x.group)));
   const has=(x.systemIds||[]).includes(node.id);const t=button(has?'解除':'關聯',()=>toggleLink(x.kind,x.id,node.id),has?'v116-remove':'v116-primary');t.disabled=!admin;row.append(description,t);items.append(row);}
 }
 search.oninput=drawItems;drawItems();host.append(section);
}
function renderDetailWithParent(parentId){const parent=nodes().find(x=>x.id===parentId);if(!parent)return renderDetail();const host=$('v116Details');host.replaceChildren();const temporary=nodeEditor({id:'',group:parent.group,name:'',zone:parent.zone,note:'',parentIds:[parent.id]});
 // nodeEditor expects a truthy current only for updates; use new-system marker without ID by resetting fields.
 temporary.querySelector('h3').textContent='新增「'+parent.name+'」下屬子系統';
 // Ensure Save generates a new id by passing undefined rather than an existing one.
 host.append(temporary);
}
function toggleLink(kind,id,systemId){if(HW.getRole()!=='admin')return message('員工唯讀模式不能修改關聯',true);
 const item=(kind==='device'?get().devices:get().routes).find(x=>x.id===id);if(!item)return;
 const ids=new Set(item.systemIds||[]);if(ids.has(systemId))ids.delete(systemId);else ids.add(systemId);
 if(!HW.updateDetails(kind,id,{systemIds:[...ids]}))return message('無法保存關聯，請檢查儲存空間',true);
 message(`${item.name}：系統關聯已更新；此為設備分組，尚需現場確認實際接線／管線`);render();
}
window.addEventListener('hw-v90-change',e=>{if(visible&&['data','selection','role'].includes(e.detail?.kind))queueMicrotask(render);});
window.HWSystemTreeV116={open,close,getState:()=>({nodes:nodes().length,links:get().devices.reduce((n,d)=>n+(d.systemIds||[]).length,0)+get().routes.reduce((n,r)=>n+(r.systemIds||[]).length,0)})};
})();
