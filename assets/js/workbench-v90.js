/* V9.0 equipment workbench — redesigned around a searchable icon palette, direct canvas actions and compact editing. */
(function(){'use strict';
const api=window.HWEquipment; if(!api)return;
const $=id=>document.getElementById(id);
const groups={water:{label:'給排水',color:'#65caff'},electric:{label:'電力',color:'#ffc96e'},ventilation:{label:'通風',color:'#88dfaf'},feed:{label:'飼料',color:'#c592f4'},equipment:{label:'其他',color:'#d7a7f5'}};
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
let groupFilter='all',search='',favorites=new Set(),recentTypes=[],paletteType='waterTower',designOpen=false,inspectorOpen=false;
try{recentTypes=JSON.parse(localStorage.getItem('hw-v86-recent-types')||localStorage.getItem('hw-v85-recent-types')||'[]').filter(Boolean).slice(0,10);}catch(e){recentTypes=[];}
try{favorites=new Set(JSON.parse(localStorage.getItem('hw-v86-favorites')||localStorage.getItem('hw-v85-favorites')||localStorage.getItem('hw-v84-favorites')||'[]'));}catch(e){}
const equip=$('v83EquipPanel'),admin=$('eqAdmin'),viewer=document.querySelector('.viewer');
const layers=[...equip.querySelectorAll('.equipment-layer-row')];
const oldTypes=admin.querySelector('.v83-library');
const oldGroups=[...admin.children];
const savedEditors={eqEditor:$('eqEditor'),eqRouteEditor:$('eqRouteEditor')};
const savedBackup=Object.fromEntries(['eqExport','eqImport','eqImportFile','eqRestorePublished','eqClear'].map(id=>[id,$(id)]));
const oldEquipmentNodes=[...equip.childNodes];
// Replace the old long configuration column with a curated set of short, task-oriented panels.
const sheet=el('div','v84-workbench');
sheet.innerHTML=`
  <div class="v84-intro"><div><span class="v84-kicker">EQUIPMENT STUDIO · V11.1</span><h2>設備圖標工作台</h2><p>選圖標 → 點底圖定位 → 點圖標編輯；不修改 CAD 原始線條。</p></div><span class="v84-intro-count" id="v84Count">0 個設備</span></div>
  <div class="v84-ro-notice" id="v84ReadOnly" hidden>目前是員工檢視。可篩選圖層、搜尋設備及點圖查看資料。</div>
  <div id="v84Admin">
    <div class="v84-section-label"><strong>快速放置</strong><span>點選設備圖標後到圖上定位</span></div>
    <div class="v84-palette-tools"><input id="v84PaletteSearch" type="search" placeholder="搜尋水塔、風扇、配電箱或自訂圖標…" aria-label="搜尋設備圖標" autocomplete="off"/><button id="v84CreateIcon" type="button" class="v84-new-icon">＋ 設計圖標</button></div>
    <div class="v84-categories" id="v84Categories" role="group" aria-label="設備類型篩選"></div>
    <div class="v84-quickzone v86-pinned-zone"><div class="v84-chip-title">★ 固定常用圖標</div><div class="v84-recent" id="v86Pinned"></div></div>
    <div class="v86-water-presets" id="v86WaterPresets"><div class="v84-chip-title">三向閥供水來源（放置時套用）</div><div class="v86-source-help">角標：T 水塔水 · G 地下水 · C 自來水</div><div class="v86-water-choices" id="v86WaterChoices"></div></div>
    <div class="v84-quickzone"><div class="v84-chip-title">最近使用</div><div class="v84-recent" id="v84Recent"></div></div>
    <div class="v84-palette" id="v84Palette" aria-label="可使用的設備圖標"></div>
    <label class="v84-repeat"><input type="checkbox" id="v84Repeat"/> 連續放置相同圖標 <span>（適合多台風扇、分電盤）</span></label>
    <div class="hw-segment-quick"><strong>區段型設備｜自由角度・兩點放置</strong><p>水簾不再硬拉長圖示。點起點、點終點，產生獨立長條設備。</p><div class="hw-segment-actions"><button type="button" id="hwCurtainSegment">▥ 兩點放置水簾</button><button type="button" id="hwFanArray">◉ 兩點排列風扇</button><label><input type="checkbox" id="hwWallSnap"> 自行選擇沿牆吸附（預設關閉，約 ±5°）</label></div></div>
    <div class="v84-route-tile"><div class="v84-section-label"><strong>繪製水管／電線</strong><span>依序點圖面，建立起訖連接</span></div><div class="v84-route-actions">
      <button type="button" data-start-route="water">水管</button><button type="button" data-start-route="electric">電線</button><button type="button" data-start-route="feed">飼料管</button></div><label class="v84-repeat"><input type="checkbox" id="v84Ortho"/> 水平／垂直轉折優先</label></div>
  </div>
  <details class="v87-placement" id="v87Placement" open><summary>📐 精準佈點與批次排列 <span>選取 · 等距 · 對齊</span></summary><div class="v87-panel">
    <label class="v87-toggle"><input id="v87Multi" type="checkbox"/> 多選設備 <small>開啟後在圖上點多個圖標</small></label>
    <div class="v87-selected"><strong id="v87SelectionCount">尚未選取設備</strong><button id="v87ClearSelection" type="button">清除選取</button></div>
    <div class="v87-snap"><label><input id="v87Snap" type="checkbox"/> 拖曳／放置吸附格點</label><select id="v87SnapStep" aria-label="吸附格點間距"><option value="0.1">0.1</option><option value="0.25" selected>0.25</option><option value="0.5">0.5</option><option value="1">1</option></select></div>
    <div class="v87-label">位置微調 <small>單位為 CAD 圖面座標；鍵盤方向鍵 0.1、Shift＋方向鍵 1</small></div>
    <div class="v87-nudge"><button type="button" data-v87-move="-1,0" title="向左微調">←</button><button type="button" data-v87-move="0,-1" title="向上微調">↑</button><button type="button" data-v87-move="0,1" title="向下微調">↓</button><button type="button" data-v87-move="1,0" title="向右微調">→</button><select id="v87MoveStep" aria-label="每次微調量"><option value="0.1">0.1</option><option value="0.25">0.25</option><option value="0.5">0.5</option><option value="1">1</option></select></div>
    <div class="v87-label">對齊與等距 <small>至少選取 2 台／等距至少 3 台</small></div>
    <div class="v87-command-grid"><button type="button" data-v87-align="horizontal">水平對齊</button><button type="button" data-v87-align="vertical">垂直對齊</button><button type="button" data-v87-dist="horizontal">水平等距</button><button type="button" data-v87-dist="vertical">垂直等距</button></div>
    <div class="v87-label">連續複製成排 <small>先選一台設備；數量不含原件</small></div>
    <div class="v87-array-grid"><label>新增台數<input id="v87Count" type="number" value="3" min="1" max="50"/></label><label>水平間距<input id="v87Dx" type="number" value="2" step="0.1"/></label><label>垂直間距<input id="v87Dy" type="number" value="0" step="0.1"/></label></div>
    <button class="v87-main" type="button" id="v87CopyArray">依間距產生設備</button>
    <p>每次動作都會存入復原紀錄；管線若已連接原設備，移動時端點會跟著更新。複製設備不會複製原設備的管線。</p>
  </div></details>
  <details class="v84-fold" id="v84Layers"><summary>圖層顯示與設備名稱 <span>獨立控制</span></summary><div class="v84-fold-body" id="v84LayersContents"></div></details>
  <details class="v84-fold" id="v84Items"><summary>設備與線路搜尋 <span id="v84ListCount">0 項</span></summary><div class="v84-fold-body" id="v84ItemsContents"></div></details>
  <div id="v84AdminLower"><details class="v84-fold" id="v84Designer"><summary>我的圖標設計室 <span>形狀／顏色／文字／規格</span></summary><div class="v84-fold-body" id="v84DesignerContents"></div></details>
  <details class="v84-fold" id="v86Templates"><summary>我的設備模板 <span>儲存／放置／批次套用</span></summary>
    <div class="v84-fold-body"><p class="v86-template-note">選取圖上設備後可儲存為模板；模板包含外型、規格、備註與水源。批次套用只更新同類型未鎖定設備的「外觀」，保留位置和各自的水源設定。</p>
    <div class="v86-template-save"><input type="text" id="v86TemplateName" maxlength="50" placeholder="模板名稱（例如：妊娠舍雙水源三向閥）" aria-label="模板名稱"/><button type="button" id="v86SaveTemplate">儲存所選設備</button></div>
    <div id="v86TemplateList" class="v86-template-list"></div></div>
  </details>
  <details class="v84-fold" id="v84Backup"><summary>資料備份與發布 <span>JSON</span></summary><div class="v84-fold-body" id="v84BackupContents"></div></details></div>
  <p id="v84StorageNote" class="v84-storage"></p>`;
equip.replaceChildren(sheet); // old panels are moved below, no extra broken controls.
// Keep precision controls near the top, before the long equipment icon library.
$('v84Admin').insertBefore($('v87Placement'), $('v84Palette'));
const legacyHost=el('div','v84-legacy-host');legacyHost.hidden=true;sheet.appendChild(legacyHost);oldEquipmentNodes.forEach(n=>legacyHost.appendChild(n));
$('v84AdminLower').appendChild(admin);
$('hwFanArray')?.addEventListener('click',()=>{if(api.getRole()!=='admin')return;window.HWEquipmentGuide?.request('fan',()=>api.begin('fan','array'),{preferArray:true})||api.begin('fan','array');});
$('hwCurtainSegment')?.addEventListener('click' ,()=>{if(api.getRole()!=='admin')return;window.HWEquipmentGuide?.request('curtain',()=>api.begin('curtain','segment'),{preferSegment:true})||api.begin('curtain','segment');});
$('hwWallSnap')?.addEventListener('change',e=>api.setSegmentWallSnap?.(e.target.checked));
const readonly=$('v84ReadOnly'),baseAdmin=$('v84Admin'),lower=$('v84AdminLower');
layers.forEach(n=>$('v84LayersContents').appendChild(n));
const modes=el('div','v88-label-control');modes.innerHTML='<div class="v88-label-head"><strong>圖面設備標示</strong><small>只改顯示，不修改設備資料</small></div><div class="v88-label-options" role="group" aria-label="設備名稱顯示模式"><button type="button" data-v88-label="smart">智慧顯示</button><button type="button" data-v88-label="all">全部名稱</button><button type="button" data-v88-label="off">僅圖標</button></div>';
$('v84LayersContents').prepend(modes);
modes.querySelectorAll('[data-v88-label]').forEach(b=>b.addEventListener('click',()=>{api.setLabelMode(b.dataset.v88Label);updateLabelButtons();}));
function updateLabelButtons(){modes.querySelectorAll('[data-v88-label]').forEach(b=>{const active=b.dataset.v88Label===api.getLabelMode();b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
updateLabelButtons();
const visSave=$('eqSaveVisibility');if(visSave)$('v84LayersContents').appendChild(visSave);
$('v84DesignerContents').appendChild(oldTypes);
// Transfer V8.3's DOM and event bindings without duplicating data logic.
const compat=el('div','v84-compat'); compat.hidden=true;
for(const n of oldGroups){
 if(n===oldTypes||n.id==='eqEditor'||n.id==='eqRouteEditor')continue;
 if(n.classList?.contains('section')&&n.textContent.includes('設備資料備份'))continue;
 if(n.id==='eqExport'||n.id==='eqImport'||n.id==='eqImportFile'||n.id==='eqRestorePublished'||n.id==='eqClear')continue;
 compat.appendChild(n);
}
// Backup buttons, now located in a compact accordion.
const backup=$('v84BackupContents');
for(const id of ['eqExport','eqImport','eqImportFile','eqRestorePublished','eqClear']){
 const n=savedBackup[id];if(n)backup.appendChild(n);
}
const backupHint=el('p','v82-hint','資料只會儲存於這台裝置；匯出 equipment-data.json 並與網站一起發布後，員工才能取得更新。請先備份再清除。'); backup.appendChild(backupHint);
admin.replaceChildren(compat);
// Recreate the equipment list and search in an expandable drawer.
const originalSearch=$('eqSearch'),originalList=$('eqList'),originalStorage=$('eqStorage');
if(originalSearch)$('v84ItemsContents').appendChild(originalSearch);
if(originalList)$('v84ItemsContents').appendChild(originalList);
if(originalStorage){$('v84StorageNote').after(originalStorage);originalStorage.hidden=true;}
// Editor is moved out of the sidebar: its controls are unchanged, but now it opens at the map edge.
const drawer=el('div','v84-editor-drawer');drawer.id='v84Drawer';drawer.hidden=true;
const head=el('div','v84-drawer-head');head.innerHTML='<div><span>直接編輯</span><strong id="v84DrawerTitle">設備資料</strong></div><button type="button" id="v84DrawerClose" aria-label="關閉編輯視窗">×</button>';
drawer.appendChild(head);
for(const id of ['eqEditor','eqRouteEditor']){const n=savedEditors[id];if(n){n.classList.add('v84-in-drawer');drawer.appendChild(n);}}
const drawerFooter=el('div','v84-drawer-footer');drawerFooter.id='v84DrawerFooter';
for(const id of ['eqSaveDevice','eqRemoveDevice','eqSaveRoute','eqRemoveRoute']){const b=$(id);if(b)drawerFooter.appendChild(b);}
drawer.appendChild(drawerFooter);
viewer.appendChild(drawer);
// Additional controls in the device editor; no changes to the underlying CAD file.
const iconEdit=el('details','v84-icon-overrides');iconEdit.id='v1222Appearance';iconEdit.innerHTML=`<summary>圖標外觀（單一設備）<span>形狀、顏色、大小與比例</span></summary><div class="v1222-appearance-body">
  <div class="v84-edit-grid"><label>形狀<select id="eqIconShape"><option value="circle">● 圓形</option><option value="square">■ 方形</option><option value="diamond">◆ 菱形</option><option value="hex">⬡ 六角形</option></select></label><label>顏色<input id="eqIconColor" type="color" value="#65caff"/></label></div><input id="eqIconSize" type="hidden" value="75"/><input id="hwLiveSize" type="hidden" value="75"/>
  <div class="v11117-live-size">
  <div class="v11103-size-grid"><label>↔ 左右寬度 (%)<input id="eqIconWidth" aria-label="圖示左右寬度百分比" type="number" inputmode="numeric" min="30" max="300" step="5" value="100"/><input id="hwLiveWidth" type="range" min="30" max="300" step="5" value="100" aria-label="寬度即時預覽"/></label><label>↕ 上下高度 (%)<input id="eqIconHeight" aria-label="圖示上下高度百分比" type="number" inputmode="numeric" min="30" max="300" step="5" value="100"/><input id="hwLiveHeight" type="range" min="30" max="300" step="5" value="100" aria-label="高度即時預覽"/></label></div>
  <small id="hwLiveAppearanceHint" hidden>● 形狀、顏色及寬高比例即時預覽，按「儲存修改」才會套用；整體大小滑桿放開即儲存。</small></div>
  <div id="hwSegmentBox" class="hw-segment-editor" hidden>
    <label class="hw-segment-title">區段設備顯示模式<select id="hwSegmentMode"><option value="icon">一般圖示</option><option value="bar">長條標示（圖案不拉伸）</option></select></label>
    <div id="hwSegmentParams" hidden>
      <div class="hw-segment-grid"><label>長度（CAD 座標）<input id="hwSegmentLength" type="number" inputmode="decimal" min="0.6" max="45" step="0.1" value="6"></label><label>厚度（CAD 座標）<input id="hwSegmentThickness" type="number" inputmode="decimal" min="0.18" max="4" step="0.05" value="0.65"></label></div>
      <div class="hw-segment-grid"><label>中間紋理<select id="hwSegmentPattern"><option value="auto">自動（依設備類型）</option><option value="grille">水簾柵格</option><option value="bars">疏格線條</option><option value="dashes">虛線區段</option><option value="solid">純色長條</option></select></label><label>端頭<select id="hwSegmentCap"><option value="round">圓角</option><option value="flat">平角</option></select></label></div>
      <div class="hw-segment-grid"><label>名稱位置<select id="hwSegmentLabel"><option value="bottom">下側</option><option value="top">上側</option><option value="off">隱藏</option></select></label><label class="hw-segment-check"><input id="hwSegmentGlyph" type="checkbox"> 顯示中央小符號</label></div>
      <p class="hw-segment-hint">長度和厚度彼此獨立，圖案不會被拉伸。旋轉仍由上方角度設定；這是設備區段標記，不代表實際管線連接。</p>
    </div>
  </div>
  <div id="hwArrayBox" class="hw-segment-editor" hidden>
    <label class="hw-segment-title">設備陣列顯示模式<select id="hwArrayMode"><option value="icon">單一設備圖示</option><option value="array">等距陣列標示（單一群組紀錄）</option></select></label>
    <div id="hwArrayParams" hidden><div class="hw-segment-grid"><label>圖示數量<input type="number" id="hwArrayCount" min="2" max="20" step="1" value="3"/></label><label>中心間距（CAD 單位）<input type="number" id="hwArraySpacing" min="1.3" max="25" step="0.05" value="2.3"/></label></div><div class="hw-segment-grid"><label>↕ 整排總長度（CAD 單位）<input type="number" id="hwArraySpan" min="3.2" max="65" step="0.05" value="6.25"/></label><div class="hw-array-hint">直接拉圖面上選取陣列的兩端圓點，即可調整上下長度。風扇大小固定，只改中心間距；另一端會固定。</div></div>
    <label>名稱位置<select id="hwArrayLabel"><option value="bottom">下方</option><option value="top">上方</option><option value="off">隱藏</option></select></label>
    <div class="hw-split-box" id="hwSplitBox"><div class="hw-split-head"><strong>拆成每台獨立設備</strong><span id="hwSplitCount">目前 3 台</span></div><p>保留這一排的 CAD 座標、旋轉與間距；拆分後每台都有獨立編號、照片及維修紀錄。原陣列標示將被取代，可使用復原。</p><button type="button" class="hw-split-button" id="hwSplitArray">拆分並建立獨立設備</button><small id="hwSplitWarning">請先儲存目前的陣列數量、間距與角度，再執行拆分。</small></div></div>
  </div>
  <p class="v11103-size-note">整體大小請使用上方的「設備圖標大小」即時滑桿。寬度、長度可分別調整，100% 為原比例。</p>
  <div class="v84-check-grid"><label><input id="eqIconLabel" type="checkbox" checked/> 顯示名稱</label><label><input id="eqIconLocked" type="checkbox"/> 鎖定位置</label></div></div>`;
// Keep size controls immediately visible in the edit drawer. Other advanced
// device details stay in their existing collapsible section.
drawer.insertBefore(iconEdit,drawer.children[1]);
iconEdit.open=false;
const batchDrawerButton=el('button','v11107-drawer-entry','同排設備｜批次更新共同規格');batchDrawerButton.type='button';batchDrawerButton.id='v11107BatchDrawer';batchDrawerButton.hidden=true;iconEdit.querySelector('.v1222-appearance-body').prepend(batchDrawerButton);
// V11.11.7: change any size input or slider, reflect the paired control.
for(const [numberId,rangeId] of [['eqIconWidth','hwLiveWidth'],['eqIconHeight','hwLiveHeight']]){
 const number=$(numberId),range=$(rangeId);
 if(!number||!range)continue;
 range.addEventListener('input',()=>{number.value=range.value;number.dispatchEvent(new Event('input',{bubbles:true}));});
 number.addEventListener('input',()=>{const n=Number(number.value);if(Number.isFinite(n))range.value=String(Math.max(Number(range.min),Math.min(Number(range.max),n)));});
}
$('hwSplitArray')?.addEventListener('click',()=>{
 const check=api.previewArraySplit?.();
 if(!check?.ok){window.alert(check?.reason||'無法拆分，請先選取陣列');return;}
 const message=`將「${check.sourceName}」拆成 ${check.count} 台獨立設備？\n\n每台建立自己的設備 ID、名稱與 CAD 座標。\n原陣列標示會移除，不會複製原群組的照片、維修或管線。\n可利用「復原」回到拆分前。`;
 if(!window.confirm(message))return;
 api.splitArraySelected?.();
});
$('hwArrayCount')?.addEventListener('input',()=>{const n=$('hwSplitCount');if(n)n.textContent='目前 '+($('hwArrayCount').value||'—')+' 台（尚未儲存）';});

// Add custom type visual designer before original notes and specs.
const iconDesign=el('div','v84-icon-design');iconDesign.innerHTML=`<div class="v84-design-visual"><div class="v84-design-preview" id="v84DesignPreview">閥</div><div><b>圖標即時預覽</b><small>建立後可重複放置，也能單獨調整每個圖標</small></div></div>
<div class="v84-edit-grid"><label>外框形狀<select id="eqCustomShape"><option value="circle">● 圓形</option><option value="square">■ 圓角方形</option><option value="diamond">◆ 菱形</option><option value="hex">⬡ 六角形</option></select></label><label>標記顏色<input id="eqCustomColor" type="color" value="#65caff"/></label><label>預設尺寸 (%)<input id="eqCustomSize" type="number" min="50" max="300" step="5" value="75"/></label></div>
<div class="v84-symbols"><span>常用符號：</span><div id="v84SymbolSuggestions"></div></div>`;
const note=$('eqCustomNote');note.parentNode.insertBefore(iconDesign,note);
const vectorSelect=el('label','v88-vector-select');vectorSelect.textContent='圖標中心符號';const vectorOptions=el('select','');vectorOptions.id='eqCustomGraphic';for(const [k,label] of window.HWIconArt.options){const option=el('option','',label);option.value=k;vectorOptions.appendChild(option);}vectorSelect.appendChild(vectorOptions);iconDesign.appendChild(vectorSelect);

$('eqCustomSymbol').maxLength=4;
// Overlay toolbar: always visible while editing equipment, even when the sidebar is closed on mobile.
const toolbar=el('div','v84-canvas-tools');toolbar.id='v84CanvasTools';toolbar.hidden=true;
toolbar.innerHTML=`<div class="v84-tool-left"><span class="v84-tool-brand">設備編輯</span>
<button type="button" id="v87MultiTool" class="v84-tool" title="多選設備">☑ <span>多選</span></button><button type="button" id="v84Select" class="v84-tool active" title="選取設備 / 取消工具">↖ <span>選取</span></button><button type="button" id="v84Add" class="v84-tool" title="選取圖標並放置">＋ <span>放圖標</span></button><button type="button" id="v84Line" class="v84-tool" title="繪製管線">⌁ <span>畫管線</span></button>
<button type="button" id="v84Finish" class="v84-tool primary" hidden>✓ <span>完成線路</span></button><button type="button" id="v84BackPoint" class="v84-tool" hidden title="移除最後一個節點">↶</button>
</div><div class="v84-tool-right"><button type="button" id="v84Undo" class="v84-tool icon-only" title="復原 Ctrl+Z">↶</button><button type="button" id="v84Redo" class="v84-tool icon-only" title="重做 Ctrl+Y">↷</button><button type="button" id="v84ToolLayers" class="v84-tool icon-only" title="圖層顯示">☷</button></div>`;
viewer.appendChild(toolbar);
const selectionBar=el('div','v84-selection');selectionBar.id='v84Selection';selectionBar.hidden=true;
selectionBar.innerHTML=`<div class="v84-selected-meta"><strong id="v84SelectedName">未選取設備</strong><small id="v84SelectedSubtitle"></small></div>
<div class="v84-selection-buttons"><button type="button" id="v84EditNow" class="primary">編輯內容</button><button type="button" id="v11107BatchEntry" hidden>同排批次</button><button type="button" id="v84Duplicate">複製</button><button type="button" id="v84Rotate" aria-haspopup="true" aria-expanded="false">旋轉 °</button><button type="button" id="v84Lock">鎖定</button><button type="button" id="v84Deselection" title="取消選取">×</button></div>`;
viewer.appendChild(selectionBar);
// V11.9.9: continuous 0–359° rotation control; no project writes during preview.
const anglePanel=el('section','v1199-rotation-panel');anglePanel.id='v1199RotationPanel';anglePanel.hidden=true;
anglePanel.setAttribute('role','group');anglePanel.setAttribute('aria-label','設備任意角度旋轉');
anglePanel.innerHTML=`<div class="v1199-rotation-head"><strong>↻ 任意角度旋轉</strong><span id="v1199AngleLive">0°</span></div>
<div class="v1199-rotation-row"><input id="v1199AngleRange" aria-label="旋轉角度滑桿" type="range" min="0" max="359" value="0" step="1"/><label><input id="v1199AngleNumber" aria-label="旋轉角度數值" inputmode="numeric" type="number" min="0" max="359" step="1" value="0"/> °</label></div>
<div class="v1199-rotation-buttons"><button type="button" data-v1199-step="-15">−15°</button><button type="button" data-v1199-step="-1">−1°</button><button type="button" data-v1199-reset>歸零</button><button type="button" data-v1199-step="1">＋1°</button><button type="button" data-v1199-step="15">＋15°</button></div>
<div class="v1199-rotation-footer"><span>滑動可預覽，放開即儲存；CAD 座標不變</span><button type="button" id="v1199CloseRotation">完成</button></div>`;
selectionBar.appendChild(anglePanel);
// V11.10.7: independent confirmation dialog with no space consumed in the CAD or editor.
const batchOverlay=el('div','v11107-batch-backdrop');batchOverlay.id='v11107BatchOverlay';batchOverlay.hidden=true;
batchOverlay.innerHTML=`<section class="v11107-batch-dialog" role="dialog" aria-modal="true" aria-labelledby="v11107BatchTitle" tabindex="-1">
  <div class="v11107-batch-head"><div><span class="v11107-batch-kicker">ARRAY · BATCH EDIT</span><h2 id="v11107BatchTitle">同排設備批次編輯</h2></div><button type="button" id="v11107BatchClose" aria-label="關閉批次編輯">✕</button></div>
  <div class="v11107-batch-summary" id="v11107BatchSummary"></div>
  <p class="v11107-batch-help">只有勾選的欄位會套用；個別名稱、CAD 位置、照片、維修、管線與設備 ID 都不會改動。已鎖定設備會略過。</p>
  <div class="v11107-batch-options">
    <label class="v11107-batch-line"><span><input type="checkbox" id="v11107SetStatus"> 批次設定狀態</span><select id="v11107Status"><option value="planned">規劃中</option><option value="installed">已安裝</option><option value="maintenance">維修中</option></select></label>
    <label class="v11107-batch-line"><span><input type="checkbox" id="v11107SetZone"> 批次設定區域</span><input id="v11107Zone" type="text" maxlength="80" placeholder="例如：妊娠舍 A 棟"/></label>
    <label class="v11107-batch-line v11107-batch-stack"><span><input type="checkbox" id="v11107SetSpecs"> 批次設定共同規格</span><textarea id="v11107Specs" rows="3" placeholder="每行一項：電壓=220V\n額定功率=0.75kW\n風扇尺寸=42吋"></textarea><small>已有同名規格只更新數值，其他個別規格保留；最多 12 項。</small></label>
    <label class="v11107-batch-line v11107-batch-stack"><span><input type="checkbox" id="v11107SetNote"> 批次取代備註</span><textarea id="v11107Note" rows="2" maxlength="900" placeholder="只有勾選後才會覆寫每台既有備註"></textarea><small>注意：會取代個別備註，若有個別維修說明請勿勾選。</small></label>
  </div>
  <div id="v11107BatchPreview" class="v11107-batch-preview" aria-live="polite">先勾選修改欄位，再點「預覽影響」。</div>
  <div class="v11107-batch-actions"><button type="button" id="v11107BatchCancel">取消</button><button type="button" id="v11107BatchReview">預覽影響</button><button type="button" id="v11107BatchApply" disabled>確認套用</button></div>
</section>`;
document.body.appendChild(batchOverlay);
let batchPlan=null,batchOptions=null,batchFocus=null;
const batchDialog=batchOverlay.querySelector('.v11107-batch-dialog');
const batchPreviewEl=$('v11107BatchPreview');
function batchReadOptions(){
 const specs=$('v11107Specs').value.trim().split(/\r?\n/).filter(v=>v.trim()).map(line=>{const idx=line.indexOf('=');return {key:idx<0?line.trim():line.slice(0,idx).trim(),value:idx<0?'':line.slice(idx+1).trim()};});
 return {setStatus:$('v11107SetStatus').checked,status:$('v11107Status').value,setZone:$('v11107SetZone').checked,zone:$('v11107Zone').value,setNote:$('v11107SetNote').checked,note:$('v11107Note').value,setSpecs:$('v11107SetSpecs').checked,specs};
}
function batchInvalidate(){batchPlan=null;batchOptions=null;$('v11107BatchApply').disabled=true;batchPreviewEl.textContent='設定已變更，請重新預覽影響後再確認。';}
function batchClose(){batchOverlay.hidden=true;batchPlan=null;batchOptions=null;$('v11107BatchApply').disabled=true;batchFocus?.focus?.();}
function batchOpen(){const sel=api.getSelected(),dev=api.getData().devices.find(x=>x.id===sel?.id);
 if(api.getRole()!=='admin'||!dev?.arrayBatchId)return;
 batchFocus=document.activeElement;batchPlan=null;batchOptions=null;
 for(const id of ['v11107SetStatus','v11107SetZone','v11107SetSpecs','v11107SetNote'])$(id).checked=false;
 $('v11107Status').value=dev.status;$('v11107Zone').value=dev.zone||'';$('v11107Specs').value='';$('v11107Note').value='';
 const batch=api.getData().devices.filter(x=>x.arrayBatchId===dev.arrayBatchId),locked=batch.filter(x=>x.locked).length;
 $('v11107BatchSummary').textContent='目前選取：'+dev.name+' · 同排 '+batch.length+' 台 · 未鎖定 '+(batch.length-locked)+' 台 · 鎖定 '+locked+' 台';
 batchPreviewEl.textContent='先勾選修改欄位，再點「預覽影響」。';$('v11107BatchApply').disabled=true;
 batchOverlay.hidden=false;batchDialog.focus();
}
$('v11107BatchEntry').addEventListener('click',batchOpen);batchDrawerButton.addEventListener('click',batchOpen);
$('v11107BatchClose').addEventListener('click',batchClose);$('v11107BatchCancel').addEventListener('click',batchClose);
batchOverlay.addEventListener('pointerdown',e=>e.stopPropagation());
batchOverlay.addEventListener('click',e=>{if(e.target===batchOverlay)batchClose();});
document.addEventListener('keydown',e=>{if(batchOverlay.hidden)return;if(e.key==='Escape'){e.preventDefault();batchClose();}if(e.key==='Tab'){const focusable=[...batchDialog.querySelectorAll('button:not([disabled]),input,textarea,select')];if(focusable.length){const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}});
batchOverlay.querySelector('.v11107-batch-options').addEventListener('input',batchInvalidate);
batchOverlay.querySelector('.v11107-batch-options').addEventListener('change',batchInvalidate);
$('v11107BatchReview').addEventListener('click',()=>{
 batchOptions=batchReadOptions();batchPlan=api.previewArrayBatch(batchOptions);
 batchPreviewEl.replaceChildren();
 if(!batchPlan?.ok){batchPreviewEl.textContent=batchPlan?.reason||'無法預覽';$('v11107BatchApply').disabled=true;return;}
 const title=el('strong','','將更新 '+batchPlan.count+' 台｜跳過鎖定 '+batchPlan.lockedCount+' 台');batchPreviewEl.appendChild(title);
 const details=el('p','',batchPlan.summary.join('；'));batchPreviewEl.appendChild(details);
 const roster=el('p','','受影響：'+batchPlan.memberNames.join('、'));batchPreviewEl.appendChild(roster);
 if(batchPlan.lockedNames.length)batchPreviewEl.appendChild(el('p','v11107-warning','不修改鎖定：'+batchPlan.lockedNames.join('、')));
 if(batchPlan.expectedTotal>batchPlan.total)batchPreviewEl.appendChild(el('p','v11107-warning','原始陣列應有 '+batchPlan.expectedTotal+' 台，目前只找到 '+batchPlan.total+' 台；只更新仍存在的設備。'));
 $('v11107BatchApply').disabled=false;
 batchPreviewEl.scrollIntoView({block:'center',behavior:'auto'});
});
$('v11107BatchApply').addEventListener('click',()=>{
 if(!batchPlan?.ok||!batchOptions)return;
 const result=api.applyArrayBatch(batchOptions,batchPlan.memberIds);
 if(!result?.ok){batchPreviewEl.textContent=result?.reason||'更新失敗，請重新預覽';$('v11107BatchApply').disabled=true;batchPlan=null;return;}
 batchClose();
});
let rotationOpen=false,rotatingDeviceId='';
const normalizeAngle=(v)=>((Math.round(Number(v)||0)%360)+360)%360;
const editableRotationDevice=()=>{const s=api.getSelected();if(s?.kind!=='device'||api.getRole()!=='admin'||api.getWorkspace()!=='equipment')return null;const d=api.getData().devices.find(x=>x.id===s.id);return d&&!d.locked?d:null;};
function previewRotation(angle){const d=editableRotationDevice();if(!d)return;const g=[...document.querySelectorAll('#eqIcons [data-eq-device]')].find(el=>el.dataset.eqDevice===d.id);const rotate=[...(g?.children||[])].find(el=>el.tagName.toLowerCase()==='g'&&el.hasAttribute('transform'));if(rotate){const type=api.getType(d.type);rotate.setAttribute('transform',d.segment?.enabled?`rotate(${normalizeAngle(angle)})`:`rotate(${normalizeAngle(angle)}) scale(${((d.size||type?.size||100)/100)*(Number(d.widthScale??100)/100)} ${((d.size||type?.size||100)/100)*(Number(d.heightScale??100)/100)})`);}}
function updateAngleInputs(deg){const n=normalizeAngle(deg);$('v1199AngleRange').value=String(n);$('v1199AngleNumber').value=String(n);$('v1199AngleLive').textContent=n+'°';}
function closeRotation(){rotationOpen=false;anglePanel.hidden=true;$('v84Rotate').setAttribute('aria-expanded','false');}
function syncRotationPanel(){const d=editableRotationDevice();if(!d||!rotationOpen||d.id!==rotatingDeviceId){closeRotation();return;}anglePanel.hidden=false;updateAngleInputs(d.rotation);}
function saveRotation(angle){const d=editableRotationDevice();if(!d){closeRotation();return;}const old=normalizeAngle(d.rotation),next=normalizeAngle(angle);if(next!==old&&!api.setRotation(next)){updateAngleInputs(old);previewRotation(old);return;}syncRotationPanel();}
$('v1199AngleRange').addEventListener('input',e=>{const n=normalizeAngle(e.target.value);updateAngleInputs(n);previewRotation(n);});
$('v1199AngleRange').addEventListener('change',e=>saveRotation(e.target.value));
$('v1199AngleNumber').addEventListener('input',e=>{if(e.target.value==='')return;const n=normalizeAngle(e.target.value);$('v1199AngleRange').value=n;$('v1199AngleLive').textContent=n+'°';previewRotation(n);});
$('v1199AngleNumber').addEventListener('change',e=>saveRotation(e.target.value));
$('v1199AngleNumber').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}});
anglePanel.querySelectorAll('[data-v1199-step]').forEach(btn=>btn.addEventListener('click',()=>{const d=editableRotationDevice();if(d)saveRotation(normalizeAngle(d.rotation)+Number(btn.dataset.v1199Step));}));
anglePanel.querySelector('[data-v1199-reset]').addEventListener('click',()=>saveRotation(0));
$('v1199CloseRotation').addEventListener('click',closeRotation);

// V11.10.2: CAD stays unobstructed when no equipment has been placed.
// Tiny touch-safe status for active placement modes.
const banner=el('div','v84-active-hint');banner.id='v84ActiveHint';banner.hidden=true;viewer.appendChild(banner);
// Keep source selection reachable on mobile after the icon sidebar collapses.
const floatingWater=el('div','v86-floating-water');floatingWater.id='v86FloatingWater';floatingWater.hidden=true;
floatingWater.innerHTML='<div class="v86-floating-header">三向閥供水 <span>T 水塔 · G 地下 · C 自來水</span></div><div id="v86FloatingChoices" class="v86-floating-choices"></div>';
viewer.appendChild(floatingWater);
const categories=[['all','全部'],['favorite','★ 常用'],['water','水路'],['electric','電力'],['feed','飼料'],['ventilation','通風'],['equipment','其他']];
for(const [value,label] of categories){const b=el('button','v84-cat'+(value===groupFilter?' active':''),label);b.type='button';b.dataset.group=value;b.addEventListener('click',()=>{groupFilter=value;renderPalette();});$('v84Categories').appendChild(b);}
const typeMeta=(t)=>({color:t.color||groups[t.group]?.color||'#c9b6ee',shape:t.shape||'circle',symbol:t.symbol||'設'});
function styledIcon(t){const m=typeMeta(t),v=el('span','v84-item-icon v88-pictogram');v.style.setProperty('--v88-icon-color',m.color);v.classList.add('shape-'+m.shape);const graphic=window.HWIconArt?.draw(t.type,t.graphic);
 if(graphic){graphic.classList.add('v88-art');v.appendChild(graphic);}else v.appendChild(el('span','v84-item-glyph',m.symbol));return v;}
function keywordsText(t){return [t.label,t.type,groups[t.group]?.label,(t.keywords||[]).join(' ')].join(' ').toLocaleLowerCase();}
function markRecent(type){recentTypes=[type,...recentTypes.filter(x=>x!==type)].slice(0,10);try{localStorage.setItem('hw-v86-recent-types',JSON.stringify(recentTypes));}catch(e){}}
function renderRecent(types){const host=$('v84Recent');host.replaceChildren();const items=recentTypes.map(id=>types.find(t=>t.type===id)).filter(Boolean).slice(0,6);if(!items.length){host.appendChild(el('span','v84-chip-empty','尚未放置圖標'));return;}
 for(const t of items){const btn=el('button','v84-recent-chip');btn.type='button';btn.title='快速放置 '+t.label;btn.appendChild(styledIcon(t));btn.appendChild(el('span','',t.label));btn.addEventListener('click',()=>{paletteType=t.type;api.begin(t.type,'place');renderPalette();});host.appendChild(btn);} }
function renderPinned(types){const host=$('v86Pinned');host.replaceChildren();const items=types.filter(t=>favorites.has(t.type));
 if(!items.length){host.appendChild(el('span','v84-chip-empty','點圖標右上角 ☆ 即可固定在這裡'));return;}
 items.forEach(t=>{const b=el('button','v84-recent-chip');b.type='button';b.title='快速放置 '+t.label;b.append(styledIcon(t),el('span','',t.label));b.addEventListener('click',()=>{paletteType=t.type;markRecent(t.type);api.setActiveTemplate(null);api.begin(t.type,'place');renderPalette();});host.appendChild(b);});}
const sourcePresets=[{title:'未設定',sources:[]},{title:'水塔＋地下',sources:['tower','groundwater']},{title:'水塔＋自來水',sources:['tower','tap']},{title:'地下＋自來水',sources:['groundwater','tap']},{title:'三水源',sources:['tower','groundwater','tap']}];
sourcePresets.forEach(p=>{
 for(const id of ['v86WaterChoices','v86FloatingChoices']){
  const b=el('button','v86-water-btn',p.title);b.type='button';b.dataset.sources=p.sources.join(',');
  b.addEventListener('click',()=>{api.setPlacementSources(p.sources);paletteType='threeWay';api.begin('threeWay','place');renderPalette();});$(id).appendChild(b);
 }
});
function renderWaterButtons(){const current=api.getPlacementSources().join(',');document.querySelectorAll('.v86-water-btn').forEach(b=>b.classList.toggle('active',b.dataset.sources===current));}
function renderTemplates(){const root=$('v86TemplateList'),templates=api.getData().templates||[];root.replaceChildren();
 if(!templates.length){root.appendChild(el('p','v86-template-note','尚無設備模板。先在圖上選取一個設備，再輸入名稱儲存。'));return;}
 for(const t of templates){const card=el('div','v86-template-card');const name=el('strong','',t.name);const type=api.getType(t.type);const sub=el('small','',(type?.label||'設備')+' · '+t.fields.length+' 項規格'+(t.waterSources.length?' · '+t.waterSources.join('／'):'') );
 const label=el('div','v86-template-meta');label.append(name,sub);const actions=el('div','v86-template-actions');
 const place=el('button','','放到圖上');place.type='button';place.addEventListener('click',()=>{paletteType=t.type;markRecent(t.type);api.setActiveTemplate(t.id);api.begin(t.type,'place');if(innerWidth<=760)$('side').classList.remove('open');});
 const apply=el('button','','套用到所選');apply.type='button';apply.addEventListener('click',()=>api.applyTemplate(t.id,'selected'));
 const batch=el('button','','同類外觀批次套用');batch.type='button';batch.title='不改變現有設備名稱、位置、水源或規格';batch.addEventListener('click',()=>{const count=api.getData().devices.filter(d=>d.type===t.type&&!d.locked).length;if(!count){api.applyTemplate(t.id,'sameType');return;}if(confirm('確定將模板「'+t.name+'」的圖標外觀套用到 '+count+' 台未鎖定同類設備？設備名稱、座標、水源與規格保持不變。'))api.applyTemplate(t.id,'sameType');});
 const del=el('button','v86-danger','刪除');del.type='button';del.addEventListener('click',()=>{if(confirm('確定刪除設備模板「'+t.name+'」？既有設備不受影響。'))api.deleteTemplate(t.id);});
 actions.append(place,apply,batch,del);card.append(label,actions);root.appendChild(card);}}
$('v86SaveTemplate').addEventListener('click',()=>{if(api.saveSelectedTemplate($('v86TemplateName').value.trim()))$('v86TemplateName').value='';});
function renderPalette(){const types=api.getTypes(),grid=$('v84Palette');const previousScroll=grid.scrollTop;grid.replaceChildren();renderRecent(types);renderPinned(types);$('v86WaterPresets').hidden=paletteType!=='threeWay'||api.getRole()!=='admin';
 const needle=search.toLocaleLowerCase().trim();
 const matches=types.filter(t=>(groupFilter==='all'||(groupFilter==='favorite'?favorites.has(t.type):t.group===groupFilter))&&(!needle||keywordsText(t).includes(needle)));
 for(const t of matches){const tile=el('div','v84-device-tile'+(paletteType===t.type&&api.getAction().action==='place'?' active':''));tile.title=t.label+'（點選後在 CAD 圖上放置）';
 const pick=el('button','v84-tile-pick');pick.type='button';pick.draggable=true;pick.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/hw-equipment-type',t.type);e.dataTransfer.effectAllowed='copy';});pick.appendChild(styledIcon(t));pick.appendChild(el('span','v84-tile-name',t.label));pick.addEventListener('click',()=>{paletteType=t.type;markRecent(t.type);api.begin(t.type,'place');renderPalette();});
 const meta=el('span','v84-tile-meta',(t.keywords||[]).slice(0,2).join(' · ')||groups[t.group]?.label||'');pick.appendChild(meta);
 const fav=el('button','v84-tile-fav'+(favorites.has(t.type)?' is-fav':''),favorites.has(t.type)?'★':'☆');fav.type='button';fav.title='加入或取消常用圖標';fav.addEventListener('click',()=>{favorites.has(t.type)?favorites.delete(t.type):favorites.add(t.type);localStorage.setItem('hw-v86-favorites',JSON.stringify([...favorites]));renderPalette();});
 tile.append(pick,fav);grid.appendChild(tile);
 }
 renderWaterButtons();
 if(!matches.length){const no=el('div','v84-no-results','沒有符合的圖標，可以點「設計圖標」建立。');grid.appendChild(no);}grid.scrollTop=previousScroll;
 $('v84Count').textContent=api.getData().devices.length+' 個設備';
}
function updatePreview(){const color=$('eqCustomColor').value,shape=$('eqCustomShape').value,pr=$('v84DesignPreview');const graphic=window.HWIconArt.draw(null,$('eqCustomGraphic').value);pr.replaceChildren(graphic||el('span','v84-item-glyph',$('eqCustomSymbol').value||'設'));pr.style.setProperty('--v88-icon-color',color);pr.style.background='#0f2939';pr.className='v84-design-preview v88-pictogram shape-'+shape;if(graphic)graphic.classList.add('v88-art');}
function openDesigner(){api.setWorkspace('equipment');if(api.getRole()!=='admin'){return;}const details=$('v84Designer');details.open=true;details.scrollIntoView({block:'nearest',behavior:'smooth'});updatePreview();}
for(const [name,sym] of [['塔','塔'],['箱','箱'],['井','井'],['閥','閥'],['手閥','手閥'],['自閥','自閥'],['泵','泵'],['分水','分水'],['主盤','主盤'],['分盤','分盤'],['發','發'],['大扇','大扇'],['小扇','小扇'],['導','導'],['簾','簾'],['測','測'],['料','料'],['飲','飲'],['監','監'],['預','預']]){const b=el('button','v84-symbol',sym);b.type='button';b.title='使用 '+name;b.addEventListener('click',()=>{$('eqCustomSymbol').value=sym;updatePreview();});$('v84SymbolSuggestions').appendChild(b);}
for(const id of ['eqCustomColor','eqCustomShape','eqCustomSymbol','eqCustomGroup','eqCustomSize','eqCustomGraphic'])$(id).addEventListener('input',updatePreview);
$('v84PaletteSearch').addEventListener('input',e=>{search=e.target.value;renderPalette();});
$('v84CreateIcon').addEventListener('click',openDesigner);
$('v84Repeat').addEventListener('change',e=>api.setRepeat(e.target.checked));
$('v84Ortho').addEventListener('change',e=>api.setOrtho(e.target.checked));
function chooseRoute(g){api.begin(g,'route');$('eqRouteType').value=g;}
document.querySelectorAll('[data-start-route]').forEach(b=>b.addEventListener('click',()=>chooseRoute(b.dataset.startRoute)));
$('v84Select').addEventListener('click',()=>{api.cancelAction();if(api.getMultiMode())api.setMultiMode(false);});
$('v87Multi').addEventListener('change',e=>api.setMultiMode(e.target.checked));
$('v87MultiTool').addEventListener('click',()=>api.setMultiMode(!api.getMultiMode()));
$('v87ClearSelection').addEventListener('click',()=>{api.clearMany();if(!api.getMultiMode())$('eqCloseDetail').click();});
for(const btn of document.querySelectorAll('[data-v87-move]'))btn.addEventListener('click',()=>{const [x,y]=btn.dataset.v87Move.split(',').map(Number),step=Number($('v87MoveStep').value);api.moveSelected(x*step,y*step);});
for(const btn of document.querySelectorAll('[data-v87-align]'))btn.addEventListener('click',()=>api.alignSelected(btn.dataset.v87Align));
for(const btn of document.querySelectorAll('[data-v87-dist]'))btn.addEventListener('click',()=>api.distributeSelected(btn.dataset.v87Dist));
$('v87CopyArray').addEventListener('click',()=>api.arrayCopy(Number($('v87Count').value),Number($('v87Dx').value),Number($('v87Dy').value)));
function updateSnap(){api.setSnap($('v87Snap').checked,$('v87SnapStep').value);}
$('v87Snap').addEventListener('change',updateSnap);$('v87SnapStep').addEventListener('change',updateSnap);
$('v84Add').addEventListener('click',()=>{api.setWorkspace('equipment');api.begin(paletteType,'place');});
$('v84Line').addEventListener('click',()=>chooseRoute($('eqRouteType').value||'water'));
$('v84Finish').addEventListener('click',()=>api.finishRoute());
$('v84BackPoint').addEventListener('click',()=>api.removeLastPoint());
$('v84Undo').addEventListener('click',()=>api.undo());$('v84Redo').addEventListener('click',()=>api.redo());
$('v84ToolLayers').addEventListener('click',()=>{if(window.innerWidth<=760)$('side').classList.add('open');$('v84Layers').open=true;$('v84Layers').scrollIntoView({block:'nearest'});});
$('v84EditNow').addEventListener('click',()=>api.openEditor());
$('v84Duplicate').addEventListener('click',()=>api.duplicate());
$('v84Rotate').addEventListener('click',()=>{const d=editableRotationDevice();if(!d)return;if(rotationOpen){closeRotation();return;}rotatingDeviceId=d.id;rotationOpen=true;anglePanel.hidden=false;updateAngleInputs(d.rotation);$('v84Rotate').setAttribute('aria-expanded','true');});
$('v84Lock').addEventListener('click',()=>{closeRotation();api.toggleLock();});
$('v84Deselection').addEventListener('click',()=>{$('eqCloseDetail').click();});
$('v84DrawerClose').addEventListener('click',()=>api.closeEditor());
// Selecting an item in the inventory auto-focuses the CAD, while the sheet stays out of the way on a phone.
const routeBtns=[...document.querySelectorAll('[data-start-route]')];
function sync(){const data=api.getData(),a=api.getAction(),role=api.getRole(),ws=api.getWorkspace(),sel=api.getSelected(),dev=sel?.kind==='device'?data.devices.find(d=>d.id===sel.id):null,route=sel?.kind==='route'?data.routes.find(r=>r.id===sel.id):null;
 const isEdit=role==='admin'&&ws==='equipment';const isMulti=api.getMultiMode(),pickIds=api.getSelectionIds();$('v87Multi').checked=isMulti;$('v87MultiTool').classList.toggle('active',isMulti);$('v87SelectionCount').textContent=pickIds.length?'已選 '+pickIds.length+' 台設備':'尚未選取設備';$('menuOpen').textContent=ws==='equipment'?'☰ 設備工具':'☰ 圖面設定';viewer.classList.toggle('v84-admin-mode',isEdit);toolbar.hidden=!isEdit; selectionBar.hidden=!isEdit||!sel||!!a.action||isMulti;readonly.hidden=role==='admin';baseAdmin.hidden=role!=='admin';lower.hidden=role!=='admin';
 $('v84Count').textContent=data.devices.length+' 設備';$('v84ListCount').textContent=(data.devices.length+data.routes.length)+' 項';
 $('v84Select').classList.toggle('active',!a.action);$('v84Add').classList.toggle('active',a.action==='place');$('v84Line').classList.toggle('active',a.action==='route');
 $('v84Finish').hidden=a.action!=='route';$('v84BackPoint').hidden=a.action!=='route';$('v84Finish').disabled=a.count<2;$('v84BackPoint').disabled=a.count<1;
 $('v84Undo').disabled=api.getHistory().index<=0;$('v84Redo').disabled=api.getHistory().index>=api.getHistory().length-1;
 routeBtns.forEach(b=>b.classList.toggle('active',a.action==='route'&&a.actionType===b.dataset.startRoute));
 $('v84Selection').hidden=!isEdit||!sel||!!a.action||isMulti; $('v11107BatchEntry').hidden=!(isEdit&&dev?.arrayBatchId); batchDrawerButton.hidden=!(isEdit&&dev?.arrayBatchId);if(sel){$('v84SelectedName').textContent=dev?.name||route?.name||'未選取';$('v84SelectedSubtitle').textContent=dev?(groups[api.getType(dev.type)?.group]?.label||'設備')+(dev.zone?' · '+dev.zone:''):route?'路徑節點：'+route.points.length:'';
 ['v84Duplicate','v84Rotate','v84Lock'].forEach(id=>$(id).hidden=!dev);$('v84Lock').textContent=dev?.locked?'解鎖':'鎖定';$('v84Rotate').disabled=!!dev?.locked;
 }
 $('v84ActiveHint').hidden=!isEdit||!a.action;
 $('v86FloatingWater').hidden=!isEdit||a.action!=='place'||a.actionType!=='threeWay';
 $('v84ActiveHint').textContent=a.action==='place'?'在底圖點一下放置「'+(api.getType(a.actionType)?.label||'設備')+'」'+($('v84Repeat').checked?' · 可連續放置':'')+' · 選取可取消':'點選底圖新增管線節點（'+a.count+' 個） · 點「完成線路」結束';
 $('v84StorageNote').textContent='內建 '+api.getTypes().filter(t=>!String(t.type).startsWith('custom-')).length+' 個設備圖標；可再自訂圖標並儲存在本機瀏覽器。';
 renderPalette();renderTemplates();
 window.dispatchEvent(new Event('hw-v89-ui-sync'));
}
window.addEventListener('hw-v90-change',e=>{if(['selection','role','workspace','data','action'].includes(e.detail?.kind))syncRotationPanel();});
window.addEventListener('hw-v90-change',e=>{if(!batchOverlay.hidden&&['role','workspace','selection'].includes(e.detail?.kind))batchClose();});
api.setHook('history',sync);api.setHook('role',sync);api.setHook('workspace',sync);api.setHook('action',sync);api.setHook('data',sync);api.setHook('selection',()=>{const sel=api.getSelected();const data=api.getData();if(sel?.kind==='device'){const d=data.devices.find(x=>x.id===sel.id);if(d)markRecent(d.type);}sync();});
api.setHook('editorOpen',()=>{
 for(const [numberId,rangeId] of [['eqIconWidth','hwLiveWidth'],['eqIconHeight','hwLiveHeight']]){if($(numberId)&&$(rangeId))$(rangeId).value=$(numberId).value;}
if(api.getRole()!=='admin')return;inspectorOpen=true;drawer.hidden=false;drawer.classList.add('open');const item=api.getSelected();$('v84DrawerTitle').textContent=item?.kind==='route'?'編輯路徑':'編輯設備';iconEdit.hidden=item?.kind!=='device';iconEdit.open=false;drawer.scrollTop=0;['eqSaveDevice','eqRemoveDevice'].forEach(id=>$(id).hidden=item?.kind!=='device');['eqSaveRoute','eqRemoveRoute'].forEach(id=>$(id).hidden=item?.kind!=='route');if(matchMedia('(max-width:760px), (max-width:1024px) and (pointer:coarse)').matches)$('side').classList.remove('open');});
api.setHook('editorClose',()=>{api.discardAppearancePreview?.();inspectorOpen=false;drawer.hidden=true;drawer.classList.remove('open');});
api.setHook('designerOpen',openDesigner);
// Desktop drag-and-drop, in addition to touch-friendly 'choose then tap'.
$('canvas').addEventListener('dragover',e=>{if(api.getRole()!=='admin'||api.getWorkspace()!=='equipment')return;e.preventDefault();e.dataTransfer.dropEffect='copy';});
$('canvas').addEventListener('drop',e=>{const type=e.dataTransfer.getData('text/hw-equipment-type');if(!type||api.getRole()!=='admin'||api.getWorkspace()!=='equipment')return;e.preventDefault();e.stopPropagation();api.placeAt(type,e.clientX,e.clientY);});
// Monitor original built-in event handles while preventing a menu from covering the map on touch devices.
$('v83TabBase').addEventListener('click',()=>{drawer.hidden=true;});
$('eqSaveType').addEventListener('click',()=>{updatePreview();renderPalette();});
// Ensure clicks on the floating UI never start CAD panning or equipment placement.
[toolbar,drawer,selectionBar,floatingWater].forEach(n=>n.addEventListener('pointerdown',e=>e.stopPropagation()));
updatePreview();sync();
})();
