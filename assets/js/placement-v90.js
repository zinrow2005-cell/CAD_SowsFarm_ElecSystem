/* V9.0: quick equipment picker and live CAD placement preview.
   Adapted from the original system's choose→tap / drag→drop flow.
   Never alters or regenerates the base CAD drawing. */
(function(){'use strict';
 const api=window.HWEquipment, viewer=document.querySelector('.viewer'),map=document.getElementById('plan');
 if(!api||!viewer||!map)return;
 const $=id=>document.getElementById(id);
 const colors={water:'#65caff',electric:'#ffc96e',ventilation:'#88dfaf',equipment:'#d7a7f5'};
 const groups=[['all','全部'],['water','給排水'],['electric','電力'],['ventilation','通風'],['equipment','其他'],['favorite','★ 常用']];
 const n=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
 let open=false,filter='all',query='',chosen='waterTower',recent=[],cursor=null,pointerDrag=null,ignoreClickUntil=0;
 try{chosen=localStorage.getItem('hw-v89-last')||chosen;recent=JSON.parse(localStorage.getItem('hw-v89-recent')||'[]')||[];}catch(e){}
 const launch=n('div','v89-launch'); launch.id='v89QuickLaunch';
 const openBtn=n('button','v89-primary','＋ 放設備'),lastBtn=n('button','v89-last','再放一台'),cancelBtn=n('button','v89-hint','取消');
 const repeatLabel=n('label');const repeat=n('input');repeat.type='checkbox';repeat.id='v89Repeat';repeat.checked=$('v84Repeat')?.checked||false;repeatLabel.append(repeat,document.createTextNode('連續'));
 launch.append(openBtn,lastBtn,repeatLabel,cancelBtn); viewer.appendChild(launch);
 const hint=n('div','v89-placement-hint');hint.id='v89PlacementHint';hint.hidden=true;
 const hintName=n('strong','','點圖面放置');const hintRepeat=n('button','','連續：關');const hintCancel=n('button','cancel','取消 Esc'); hint.append(hintName,hintRepeat,hintCancel);viewer.appendChild(hint);
 const panel=n('div','v89-dock');panel.id='v89Dock';panel.hidden=true;
 const header=n('div','v89-header');const htext=n('div');htext.innerHTML='<strong>快速放置設備</strong><small>點圖標 → 點圖面，或將圖標往上拖到圖面</small>';
 const close=n('button','', '×');close.title='關閉設備圖庫';header.append(htext,close);
 const search=n('input','v89-search');search.type='search';search.placeholder='搜尋設備名稱或功能…';search.setAttribute('aria-label','搜尋設備');
 const tabs=n('div','v89-tabs');const items=n('div','v89-tiles');items.id='v89PickerItems';panel.append(header,search,tabs,items);viewer.appendChild(panel);
 const bubble=n('div','v89-drag-bubble');document.body.appendChild(bubble);
 const NS='http://www.w3.org/2000/svg';
 const ghost=document.createElementNS(NS,'g');ghost.classList.add('v89-preview');ghost.setAttribute('pointer-events','none');ghost.style.display='none';map.appendChild(ghost);
 const arr=()=>api.getTypes();
 const find=id=>api.getType(id)||api.getType('waterTower');
 const favs=()=>{try{return new Set(JSON.parse(localStorage.getItem('hw-v86-favorites')||'[]'));}catch(e){return new Set();}};
 function isReady(){return api.getRole()==='admin'&&api.getWorkspace()==='equipment';}
 function shape(t){const e=n('span','v89-graphic');e.style.setProperty('--ic',t.color||colors[t.group]);const art=window.HWIconArt?.draw(t.type,t.graphic);if(art)e.appendChild(art);else e.textContent=t.symbol||'設';return e;}
 function addRecent(id){recent=[id,...recent.filter(x=>x!==id)].slice(0,8);try{localStorage.setItem('hw-v89-recent',JSON.stringify(recent));localStorage.setItem('hw-v89-last',id);}catch(e){} }
 function choose(id){if(!isReady())return;const type=find(id);if(!type)return;chosen=id;addRecent(id);setOpen(false);api.begin(id,'place');render();}
 function setOpen(on){if(!isReady())on=false;open=!!on;panel.hidden=!open; if(open){search.value='';query='';filter='all';render();} else{bubble.style.display='none';}sync();}
 function render(){items.replaceChildren();tabs.replaceChildren();
   for(const [g,name] of groups){const b=n('button','',name);b.type='button';b.setAttribute('aria-pressed',String(filter===g));b.addEventListener('click',()=>{filter=g;render();});tabs.appendChild(b);}
   const q=query.trim().toLocaleLowerCase(),f=favs();let kinds=arr().filter(t=>(filter==='all'||filter==='favorite'&&f.has(t.type)||t.group===filter) &&(!q||[t.label,t.type,(t.keywords||[]).join(' ')].join(' ').toLocaleLowerCase().includes(q)));
   if(filter==='all'&&!q){const rank=t=>{const r=recent.indexOf(t.type);return f.has(t.type)?-20:r>=0?r-10:50};kinds.sort((a,b)=>rank(a)-rank(b));}
   for(const t of kinds){const btn=n('button','v89-pick'+(t.type===chosen?' selected':''));btn.type='button';btn.dataset.type=t.type;btn.title='點擊選擇；也可按住拖到 CAD 圖面';btn.append(shape(t),n('span','v89-name',t.label));
     btn.addEventListener('click',e=>{if(performance.now()<ignoreClickUntil)return;choose(t.type);});
     btn.addEventListener('pointerdown',e=>startDrag(e,btn,t));
     items.appendChild(btn);
   }
   if(!kinds.length)items.appendChild(n('div','v89-empty','找不到圖標；可使用左側「設計圖標」新增。'));
 }
 function sync(){const ready=isReady(),a=api.getAction(),isPlacing=ready&&a.action==='place'; launch.hidden=!ready;panel.hidden=!open||!ready;hint.hidden=!isPlacing;
   lastBtn.textContent='再放 '+(find(chosen)?.label||'設備');lastBtn.title='再次放置 '+(find(chosen)?.label||'設備');
   lastBtn.disabled=!ready;cancelBtn.hidden=!isPlacing;hintName.textContent=isPlacing?'將「'+(find(a.actionType)?.label||'設備')+'」點在底圖上':'';
   const rpt=$('v84Repeat');repeat.checked=!!rpt?.checked; hintRepeat.textContent=repeat.checked?'連續：開':'連續：關';
   if(!isPlacing||open)ghost.style.display='none';
   if(!ready&&open){open=false;panel.hidden=true;}
 }
 function pos(e){const ctm=map.getScreenCTM();if(!ctm)return null;const pt=map.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const q=pt.matrixTransform(ctm.inverse());const snap=api.getSnap?.();if(snap?.enabled&&snap.step){q.x=Math.round(q.x/snap.step)*snap.step;q.y=Math.round(q.y/snap.step)*snap.step;}return q;}
 function onMap(e){const r=map.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom&&!document.elementFromPoint(e.clientX,e.clientY)?.closest?.('.v89-dock,.v89-launch,.v89-placement-hint,.v84-canvas-tools,.v84-editor-drawer');}
 function showGhost(clientX,clientY,id){const t=find(id);if(!t)return;const p=pos({clientX,clientY});if(!p)return;const spot=api.getIconMagnetPreview?.(id,p.x,p.y)||{ok:true,...p};ghost.replaceChildren();const outer=document.createElementNS(NS,'circle');outer.setAttribute('r',String((t.size||100)/100*1.13));outer.setAttribute('fill','#0d3441');outer.setAttribute('fill-opacity','.76');outer.setAttribute('stroke',t.color||colors[t.group]);outer.setAttribute('stroke-width','.11');outer.setAttribute('stroke-dasharray','.2 .12');ghost.appendChild(outer);
   const art=window.HWIconArt?.draw(id,t.graphic);
   if(art){art.setAttribute('x','-.62');art.setAttribute('y','-.62');art.setAttribute('width','1.24');art.setAttribute('height','1.24');art.setAttribute('stroke','#d9f6f4');ghost.appendChild(art);}else{const txt=document.createElementNS(NS,'text');txt.setAttribute('y','.24');txt.setAttribute('text-anchor','middle');txt.setAttribute('font-size','.56');txt.setAttribute('fill','#d9f6f4');txt.textContent=t.symbol||'設';ghost.appendChild(txt);}
   const cx=document.createElementNS(NS,'path');cx.setAttribute('d','M-1.36 0H-1.09 M1.09 0H1.36 M0 -1.36V-1.09 M0 1.09V1.36');cx.setAttribute('stroke','#b0e8dd');cx.setAttribute('stroke-width','.08');cx.setAttribute('fill','none');ghost.appendChild(cx);
   ghost.setAttribute('transform',`translate(${spot.ok?spot.x:p.x} ${spot.ok?spot.y:p.y})`);ghost.dataset.snap=spot.snapped?'yes':'no';outer.setAttribute('stroke',!spot.ok?'#f38b81':spot.avoid?'#ffc373':spot.snapped?'#72e9c4':t.color||colors[t.group]);ghost.style.display='';
 }
 function trackPointer(e){if(pointerDrag)return;if(!isReady()||open){ghost.style.display='none';return;}const a=api.getAction();if(a.action==='place'&&onMap(e))showGhost(e.clientX,e.clientY,a.actionType);else ghost.style.display='none';}
 function startDrag(e,btn,t){if(!isReady()||e.button&&e.pointerType==='mouse')return;const o={id:e.pointerId,type:t.type,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,dragged:false};pointerDrag=o;
   // Capture on the tile so both touch and mouse follow reliably across the map.
   try{btn.setPointerCapture(e.pointerId);}catch(err){}
   const moved=ev=>{if(!pointerDrag||ev.pointerId!==o.id)return;o.x=ev.clientX;o.y=ev.clientY;if(!o.dragged&&Math.hypot(o.x-o.startX,o.y-o.startY)>11){o.dragged=true;bubble.replaceChildren(shape(t),n('span','',t.label));bubble.style.display='flex';}if(o.dragged){bubble.style.left=(o.x+13)+'px';bubble.style.top=(o.y+13)+'px';const inView=onMap(ev);if(inView)showGhost(o.x,o.y,o.type);else ghost.style.display='none';}};
   const ended=ev=>{if(ev.pointerId!==o.id)return;cleanup();ignoreClickUntil=performance.now()+350;if(o.dragged){ev.preventDefault();if(onMap(ev)){chosen=o.type;addRecent(o.type);setOpen(false);api.cancelAction();api.placeAt(o.type,ev.clientX,ev.clientY);}ghost.style.display='none';render();} else {choose(o.type);} };
   const cancel=ev=>{if(ev.pointerId!==o.id)return;cleanup();};
   function cleanup(){try{btn.releasePointerCapture(o.id);}catch(err){}btn.removeEventListener('pointermove',moved);btn.removeEventListener('pointerup',ended);btn.removeEventListener('pointercancel',cancel);pointerDrag=null;bubble.style.display='none';ghost.style.display='none';}
   btn.addEventListener('pointermove',moved);btn.addEventListener('pointerup',ended);btn.addEventListener('pointercancel',cancel);
 }
 openBtn.onclick=()=>{setOpen(!open);if(open&&window.innerWidth>760)search.focus();};close.onclick=()=>setOpen(false);
 cancelBtn.onclick=hintCancel.onclick=()=>{api.cancelAction();ghost.style.display='none';};
 lastBtn.onclick=()=>choose(chosen);
 repeat.onchange=()=>{const original=$('v84Repeat');if(original){original.checked=repeat.checked;original.dispatchEvent(new Event('change',{bubbles:true}));}else api.setRepeat(repeat.checked);sync();};
 hintRepeat.onclick=()=>{repeat.checked=!repeat.checked;repeat.dispatchEvent(new Event('change'));};
 search.oninput=()=>{query=search.value;render();};
 map.addEventListener('pointermove',trackPointer,{passive:true});map.addEventListener('pointerleave',()=>{if(!pointerDrag)ghost.style.display='none';});
 viewer.addEventListener('pointerdown',e=>{if(e.target.closest?.('.v89-launch,.v89-dock,.v89-placement-hint'))e.stopPropagation();});
 panel.addEventListener('click',e=>e.stopPropagation());
 window.addEventListener('hw-v89-ui-sync',sync);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){setOpen(false);ghost.style.display='none';}});
 render();sync();
})();
