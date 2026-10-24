/* V11.12.6 — Single responsive docking area for legacy floating CAD tools.
   Reparent existing controls so their original click handlers and IDs keep working. */
(()=>{'use strict';
  const viewer=document.querySelector('.viewer');
  const toolbar=document.querySelector('.viewer .toolbar');
  const search=document.getElementById('v1192DesktopSearch');
  const status=document.getElementById('hw109Toggle');
  const trace=document.getElementById('hw110Launch');
  if(!viewer||!toolbar||!status||!trace||document.getElementById('hw125Dock'))return;
  const dock=document.createElement('nav');dock.id='hw125Dock';dock.className='hw125-dock';dock.setAttribute('aria-label','CAD 快速控制與查詢');
  const menu=document.createElement('button');menu.id='hw125Menu';menu.type='button';menu.textContent='⌕ 查詢工具';
  menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-controls','hw125Actions');
  menu.setAttribute('aria-label','展開設備狀態、水電關聯、設備與維修及配電迴路工具');
  const actions=document.createElement('div');actions.id='hw125Actions';actions.className='hw125-actions';
  if(search){search.title='搜尋設備與線路';}
  dock.append(toolbar);
  if(search)dock.append(search);
  dock.append(menu,actions);
  actions.append(status,trace);
  // Reuse existing repair-search and circuit tools on phones instead of
  // rendering two extra fixed-position FABs above the bottom toolbar.
  const records=document.getElementById('v114Fab');
  const circuit=document.getElementById('v113Fab');
  if(records){records.textContent='⌕ 設備與維修';actions.append(records);}
  if(circuit){circuit.textContent='⚡ 配電迴路';actions.append(circuit);}
  viewer.append(dock);
  function closeMenu(){dock.classList.remove('hw125-open');menu.setAttribute('aria-expanded','false');}
  menu.addEventListener('click',()=>{const open=dock.classList.toggle('hw125-open');menu.setAttribute('aria-expanded',String(open));});
  actions.addEventListener('click',e=>{if(e.target.closest('button'))closeMenu();});
  document.addEventListener('pointerdown',e=>{if(!dock.contains(e.target))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dock.classList.contains('hw125-open')){closeMenu();menu.focus({preventScroll:true});}});
  window.addEventListener('resize',()=>{if(window.innerWidth>760)closeMenu();},{passive:true});
  // When overlays/panels are open, the tool launcher is suppressed by CSS, not removed.
})();
