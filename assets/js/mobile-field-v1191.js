/* HUWEI V11.9.2 — CAD field controls. UI only; no equipment/CAD storage migration. */
(function () {
  'use strict';
  const api = window.HWEquipment;
  const home = window.HWHomeV119;
  const $ = id => document.getElementById(id);
  const viewer = document.querySelector('.viewer');
  const sidebar = $('side');
  if (!viewer || !sidebar || !api || !home) return;
  const compact = () => window.matchMedia('(max-width:760px), (max-width:1024px) and (pointer:coarse)').matches;

  // The shade is deliberately outside the SVG to avoid intercepting CAD taps.
  const shade = document.createElement('button');
  shade.type = 'button';
  shade.id = 'v1191Shade';
  shade.hidden = true;
  shade.setAttribute('aria-label','關閉側邊設定選單');
  document.getElementById('app').appendChild(shade);

  const dock = document.createElement('nav');
  dock.id = 'v1191Dock';
  dock.setAttribute('aria-label','手機平板 CAD 快捷工具列');
  dock.innerHTML = `
    <button type="button" data-field="home" aria-label="返回首頁"><span aria-hidden="true">⌂</span><small>首頁</small></button>
    <button type="button" data-field="layers" aria-label="開啟圖層設定"><span aria-hidden="true">▦</span><small>圖層</small></button>
    <button type="button" data-field="equipment" aria-label="開啟設備工具"><span aria-hidden="true">⚙</span><small>設備</small></button>
    <button type="button" data-field="fit" aria-label="恢復全場圖面"><span aria-hidden="true">⌗</span><small>全場</small></button>
    <button type="button" data-field="zoom-in" aria-label="放大圖面"><span aria-hidden="true">＋</span><small>放大</small></button>
    <button type="button" data-field="zoom-out" aria-label="縮小圖面"><span aria-hidden="true">−</span><small>縮小</small></button>`;
  viewer.appendChild(dock);

  // Only appears during an active placement/route operation; never writes data itself.
  const actionBar = document.createElement('section');
  actionBar.id = 'v1191ActionBar';
  actionBar.hidden = true;
  actionBar.setAttribute('aria-label','進行中的 CAD 操作');
  actionBar.innerHTML = `<div class="v1191-action-copy"><b id="v1191ActionTitle">正在操作</b><small id="v1191ActionSubtitle"></small></div>
    <div class="v1191-action-buttons">
      <button type="button" data-field="back-point" id="v1191BackPoint" hidden>撤銷節點</button>
      <button type="button" data-field="finish-route" id="v1191Finish" hidden>完成線路</button>
      <button type="button" data-field="cancel" class="v1191-cancel">取消</button>
    </div>`;
  viewer.appendChild(actionBar);

  const selected = document.createElement('div');
  selected.id = 'v1191Selected';
  selected.hidden = true;
  selected.setAttribute('role','status');
  selected.innerHTML = `<span id="v1191SelectedText"></span><button type="button" data-field="dismiss-selection" aria-label="取消設備選取">×</button>`;
  viewer.appendChild(selected);

  function syncDrawer() {
    const open = compact() && sidebar.classList.contains('open') && !document.body.classList.contains('v119-home-open');
    shade.hidden = !open;
    document.body.classList.toggle('v1193-drawer-open',open);
    $('menuOpen')?.setAttribute('aria-expanded',String(open));
  }
  function closeDrawer() { sidebar.classList.remove('open'); syncDrawer(); }
  function openDrawer(workspace) {
    if (workspace) api.setWorkspace(workspace);
    if (compact()) {
      sidebar.classList.add('open');
      sidebar.scrollTop = 0;
      syncDrawer();
      // Avoid forced-focus scrolling while on a mobile CAD canvas.
    } else if (workspace) {
      sidebar.scrollTop = 0;
    }
  }
  shade.addEventListener('click',closeDrawer);
  sidebar.addEventListener('keydown',event=>{if(event.key==='Escape' && compact()){closeDrawer();$('menuOpen')?.focus();}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && !shade.hidden){closeDrawer();$('menuOpen')?.focus();}});
  new MutationObserver(syncDrawer).observe(sidebar,{attributes:true,attributeFilter:['class']});

  function act(type) {
    switch(type) {
      case 'home': closeDrawer();home.show();break;
      case 'layers': openDrawer('base');break;
      case 'equipment': openDrawer('equipment');break;
      case 'fit': $('fit')?.click();break;
      case 'zoom-in': $('zoomIn')?.click();break;
      case 'zoom-out': $('zoomOut')?.click();break;
      case 'back-point': api.removeLastPoint();break;
      case 'finish-route': if(api.getAction().count>=2) api.finishRoute();break;
      case 'cancel': api.cancelAction();break;
      case 'dismiss-selection': $('eqCloseDetail')?.click();break;
    }
    sync();
  }
  [dock,actionBar,selected].forEach(el=>{
    el.addEventListener('pointerdown',e=>e.stopPropagation());
    el.addEventListener('click', e=>{
      const btn=e.target.closest('button[data-field]');
      if(!btn||btn.disabled)return;
      e.stopPropagation();act(btn.dataset.field);
    });
  });
  function sync() {
    const view = compact();
    const state = api.getAction();
    const active = Boolean(state.action);
    const workspace = api.getWorkspace();
    const role = api.getRole();
    const editor = $('v84Drawer');
    const editing = editor && !editor.hidden;
    dock.hidden = !view || editing;
    actionBar.hidden = !view || !active || editing;
    dock.querySelectorAll('[data-field="layers"], [data-field="equipment"]').forEach(button=>{
      const isCurrent = button.dataset.field === (workspace==='base'?'layers':'equipment');
      button.setAttribute('aria-pressed',String(isCurrent));
    });
    const isRoute = state.action==='route';
    $('v1191ActionTitle').textContent = isRoute?'正在繪製線路':'正在放置設備';
    const typeLabel = api.getType(state.actionType)?.label || state.actionType || '設備';
    $('v1191ActionSubtitle').textContent = isRoute?'已選 '+state.count+' 個節點 · 完成需至少 2 個節點':`目前類型：${typeLabel} · 點圖面定位`;
    $('v1191BackPoint').hidden = !isRoute;
    $('v1191BackPoint').disabled = !isRoute || state.count===0;
    $('v1191Finish').hidden = !isRoute;
    $('v1191Finish').disabled = !isRoute || state.count<2;
    const item=api.getSelected();
    const adminSelection=$('v84Selection');
    const isAdminSelectionVisible=adminSelection && !adminSelection.hidden;
    selected.hidden = !view || !item || active || editing || isAdminSelectionVisible;
    viewer.classList.toggle('v1191-action-active',view && active && !editing);
    viewer.classList.toggle('v1191-selected-active',view && Boolean(item) && !editing && !active);
    if(item && !selected.hidden) {
      const data=api.getData();
      const record=(item.kind==='device'?data.devices:data.routes)?.find(x=>x.id===item.id);
      $('v1191SelectedText').textContent=record ? (item.kind==='device'?'設備：':'管線：')+(record.name||'未命名') : '已選取項目';
    }
  }
  window.addEventListener('hw-v90-change',sync);
  // Workbench dispatches this for action and route-point changes (which lack hw-v90-change).
  window.addEventListener('hw-v89-ui-sync',sync);
  window.addEventListener('resize',()=>{if(!compact())closeDrawer();syncDrawer();sync();});
  window.addEventListener('orientationchange',()=>{syncDrawer();sync();});
  new MutationObserver(sync).observe($('v84Drawer')||viewer,{attributes:true,attributeFilter:['hidden']});
  window.HWMobileFieldV1191={sync,openDrawer,closeDrawer,act};
  syncDrawer();sync();
})();
