/* 虎尾豬場設備配置 V10.2: independent overlay; no original CAD objects are changed. */
(function(){'use strict';
const NS='http://www.w3.org/2000/svg';
const groups={water:{name:'給排水',color:'#65caff'},electric:{name:'電力',color:'#ffc96e'},ventilation:{name:'通風（既有示意線）',color:'#88dfaf'},feed:{name:'飼料輸送',color:'#c592f4'},equipment:{name:'其他設備',color:'#d7a7f5'}};
const catalogue=[
  {"type": "waterTower", "group": "water", "label": "水塔", "symbol": "塔", "keywords": ["儲水", "高架", "供水"], "shape": "circle"},
  {"type": "waterTank", "group": "water", "label": "儲水桶／水箱", "symbol": "箱", "keywords": ["蓄水", "水箱"], "shape": "circle"},
  {"type": "groundwater", "group": "water", "label": "地下水井", "symbol": "井", "keywords": ["抽水井", "地下水", "井水"], "shape": "circle"},
  {"type": "tap", "group": "water", "label": "自來水進水", "symbol": "水", "keywords": ["自來水", "進水點"], "shape": "circle"},
  {"type": "threeWay", "group": "water", "label": "三向閥", "symbol": "閥", "keywords": ["切換", "雙水源", "水塔", "地下水", "自來水"], "shape": "hex"},
  {"type": "manualValve", "group": "water", "label": "手動閥門", "symbol": "手閥", "keywords": ["開關閥", "管線"], "shape": "hex"},
  {"type": "autoValve", "group": "water", "label": "自動閥門", "symbol": "自閥", "keywords": ["電磁閥", "自動控制"], "shape": "hex"},
  {"type": "filter", "group": "water", "label": "過濾器", "symbol": "濾", "keywords": ["淨水", "過濾"], "shape": "circle"},
  {"type": "pump", "group": "water", "label": "加壓泵", "symbol": "泵", "keywords": ["泵浦", "加壓馬達"], "shape": "circle"},
  {"type": "meter", "group": "water", "label": "水表", "symbol": "表", "keywords": ["流量", "計量"], "shape": "circle"},
  {"type": "manifold", "group": "water", "label": "分水器", "symbol": "分水", "keywords": ["分流", "支管"], "shape": "square"},
  {"type": "waterPoint", "group": "water", "label": "給水接點", "symbol": "給", "keywords": ["出水", "飲水點"], "shape": "circle"},
  {"type": "drainPoint", "group": "water", "label": "排水點", "symbol": "排", "keywords": ["排水", "落水"], "shape": "circle"},
  {"type": "flushPoint", "group": "water", "label": "沖洗點", "symbol": "沖", "keywords": ["清洗", "沖水"], "shape": "circle"},
  {"type": "panel", "group": "electric", "label": "主配電箱", "symbol": "主盤", "keywords": ["總電源", "主盤"], "shape": "diamond"},
  {"type": "subPanel", "group": "electric", "label": "區域分電盤", "symbol": "分盤", "keywords": ["分盤", "區域配電"], "shape": "diamond"},
  {"type": "controlBox", "group": "electric", "label": "控制箱", "symbol": "控", "keywords": ["控制盤", "控制器"], "shape": "diamond"},
  {"type": "generator", "group": "electric", "label": "備援發電機", "symbol": "發", "keywords": ["柴油發電機", "備援"], "shape": "diamond"},
  {"type": "ats", "group": "electric", "label": "ATS 自動切換", "symbol": "切", "keywords": ["切換器", "自動切換"], "shape": "diamond"},
  {"type": "socket", "group": "electric", "label": "用電接點", "symbol": "電", "keywords": ["插座", "插頭"], "shape": "diamond"},
  {"type": "switch", "group": "electric", "label": "電源開關", "symbol": "開", "keywords": ["開關", "控制"], "shape": "diamond"},
  {"type": "lighting", "group": "electric", "label": "照明", "symbol": "燈", "keywords": ["燈具", "照明"], "shape": "diamond"},
  {"type": "motorPower", "group": "electric", "label": "馬達電源", "symbol": "馬", "keywords": ["馬達", "動力"], "shape": "diamond"},
  {"type": "alarm", "group": "electric", "label": "警報器", "symbol": "警", "keywords": ["蜂鳴器", "異常警示"], "shape": "diamond"},
  {"type": "ups", "group": "electric", "label": "備援電源 UPS", "symbol": "UPS", "keywords": ["不斷電", "備援電源"], "shape": "diamond"},
  {"type": "ventWall", "group": "ventilation", "label": "排風牆區段", "symbol": "風牆", "keywords": ["排風牆", "牆面", "區段標記"], "shape": "square"},
  {"type": "cableTrunk", "group": "electric", "label": "電纜幹線區段", "symbol": "幹線", "keywords": ["幹線", "電纜", "區段標記"], "shape": "square"},
  {"type": "warningZone", "group": "equipment", "label": "走道警示區段", "symbol": "警示", "keywords": ["警示", "區段", "走道"], "shape": "square"},
  {"type": "curtain", "group": "ventilation", "label": "水簾", "symbol": "簾", "keywords": ["濕簾", "降溫"], "shape": "square"},
  {"type": "fan", "group": "ventilation", "label": "大型排風扇", "symbol": "大扇", "keywords": ["排風", "42吋"], "shape": "square"},
  {"type": "smallFan", "group": "ventilation", "label": "小型通風扇", "symbol": "小扇", "keywords": ["小風扇", "循環"], "shape": "square"},
  {"type": "guideFan", "group": "ventilation", "label": "導引扇", "symbol": "導", "keywords": ["導風", "中繼風扇"], "shape": "square"},
  {"type": "ceilingFan", "group": "ventilation", "label": "天花循環扇", "symbol": "頂扇", "keywords": ["循環扇", "天花"], "shape": "square"},
  {"type": "roofFan", "group": "ventilation", "label": "屋頂抽風機", "symbol": "屋", "keywords": ["屋頂", "抽風"], "shape": "square"},
  {"type": "airInlet", "group": "ventilation", "label": "進氣口", "symbol": "進", "keywords": ["進風", "進氣"], "shape": "square"},
  {"type": "airOutlet", "group": "ventilation", "label": "排氣口", "symbol": "排氣", "keywords": ["排風口", "出口"], "shape": "square"},
  {"type": "sensor", "group": "ventilation", "label": "溫濕度感測器", "symbol": "測", "keywords": ["溫度", "濕度", "感測"], "shape": "square"},
  {"type": "controller", "group": "ventilation", "label": "溫控控制器", "symbol": "溫控", "keywords": ["溫控", "控制器"], "shape": "square"},
  {"type": "mist", "group": "ventilation", "label": "噴霧降溫", "symbol": "霧", "keywords": ["噴霧", "降溫"], "shape": "square"},
  {"type": "feedSilo", "group": "feed", "label": "飼料塔／大型料塔", "symbol": "塔", "keywords": ["飼料塔", "飼料桶", "筒倉", "料源"], "shape": "hex"},
  {"type": "feedBin", "group": "feed", "label": "飼料桶／緩衝桶", "symbol": "料", "keywords": ["料桶", "儲料"], "shape": "hex"},
  {"type": "feedLine", "group": "feed", "label": "末端料線", "symbol": "線", "keywords": ["送料", "飼料線", "主料線"], "shape": "hex"},
  {"type": "feedAuger", "group": "feed", "label": "絞龍輸送機", "symbol": "絞", "keywords": ["絞龍", "螺旋輸送", "輸送管"], "shape": "hex"},
  {"type": "feedMotor", "group": "feed", "label": "送料馬達", "symbol": "馬", "keywords": ["送料", "馬達", "動力"], "shape": "hex"},
  {"type": "feedDistributor", "group": "feed", "label": "分料器／分流器", "symbol": "分", "keywords": ["分料", "分岐", "分流"], "shape": "hex"},
  {"type": "feedValve", "group": "feed", "label": "送料切換閥", "symbol": "閥", "keywords": ["三通", "切換", "分流閥"], "shape": "hex"},
  {"type": "feedDrop", "group": "feed", "label": "落料口", "symbol": "落", "keywords": ["落料", "下料", "出料口"], "shape": "hex"},
  {"type": "feedSensor", "group": "feed", "label": "料位感測器", "symbol": "測", "keywords": ["料位", "缺料", "滿料"], "shape": "hex"},
  {"type": "feedControl", "group": "feed", "label": "送料控制箱", "symbol": "控", "keywords": ["飼料控制", "送料控制"], "shape": "hex"},
  {"type": "feedTrough", "group": "feed", "label": "飼料槽／落料終點", "symbol": "槽", "keywords": ["料槽", "餵料", "飼槽"], "shape": "hex"},
  {"type": "feedService", "group": "feed", "label": "料管檢修／清理點", "symbol": "修", "keywords": ["檢修", "清理", "保養"], "shape": "hex"},
  {"type":"waterJunction","group":"water","label":"水管分支接點","symbol":"分","keywords":["接點","水管分支","T接"],"shape":"circle"},
  {"type":"electricJunction","group":"electric","label":"電線分支接點","symbol":"接","keywords":["接線盒","分支","接點"],"shape":"circle"},
  {"type":"feedJunction","group":"feed","label":"飼料管分流接點","symbol":"分","keywords":["分支","接頭","分流"],"shape":"circle"},
  {"type": "drinker", "group": "equipment", "label": "飲水器", "symbol": "飲", "keywords": ["喝水", "飲水嘴"], "shape": "hex"},
  {"type": "sprayer", "group": "equipment", "label": "噴灑設備", "symbol": "噴", "keywords": ["噴頭", "清洗"], "shape": "hex"},
  {"type": "camera", "group": "equipment", "label": "監視器", "symbol": "監", "keywords": ["攝影機", "監控"], "shape": "hex"},
  {"type": "gate", "group": "equipment", "label": "門禁／開關點", "symbol": "門", "keywords": ["門禁", "出入口"], "shape": "hex"},
  {"type": "washUnit", "group": "equipment", "label": "洗消設備", "symbol": "洗", "keywords": ["清潔", "消毒"], "shape": "hex"},
  {"type": "repairPoint", "group": "equipment", "label": "維修點", "symbol": "修", "keywords": ["保養", "維修"], "shape": "hex"},
  {"type": "reservePoint", "group": "equipment", "label": "預留點", "symbol": "預", "keywords": ["預留", "未來擴充"], "shape": "hex"},
  {"type": "other", "group": "equipment", "label": "其他設備", "symbol": "設", "keywords": ["其他"], "shape": "hex"}
];
const builtins=Object.fromEntries(catalogue.map(x=>[x.type,{...x,size:100,color:groups[x.group].color}]));
const validShape=v=>['circle','square','diamond','hex'].includes(v)?v:'circle';
const validColor=(v,defaultColor)=>/^#[a-f0-9]{6}$/i.test(v||'')?v:defaultColor;
const validSize=v=>Math.max(50,Math.min(300,Number(v)||100));
// Per-icon local-axis width and height multipliers (legacy projects default to 100%).
const validAxis=v=>v==null||v===''?100:Math.max(30,Math.min(300,Math.round(Number(v)||100)));
const iconAxis=(d,k)=>validAxis(d[k])/100;
const ARRAY_TYPES=new Set(['fan','smallFan','guideFan','ceilingFan','roofFan','lighting','drinker','sprayer']);
const validArray=raw=>{if(!raw||typeof raw!=='object'||raw.enabled!==true)return null;const num=(v,a,b,d)=>Number.isFinite(Number(v))?Math.min(b,Math.max(a,Number(v))):d;return{enabled:true,count:Math.round(num(raw.count,2,20,3)),spacing:num(raw.spacing,1.3,6,2.3),labelPosition:['top','bottom','off'].includes(raw.labelPosition)?raw.labelPosition:'bottom'};};
const arrayLength=a=>a?1.65+(a.count-1)*a.spacing:0;
const SEGMENT_TYPES=new Set(['curtain','airInlet','airOutlet','feedLine','feedAuger','feedTrough','mist','ventWall','cableTrunk','warningZone']);
const validSegment=raw=>{if(!raw||typeof raw!=='object'||raw.enabled!==true)return null;
 const clamp=(v,lo,hi,def)=>Number.isFinite(Number(v))?Math.max(lo,Math.min(hi,Number(v))):def;
 return {enabled:true,length:clamp(raw.length,.6,45,6),thickness:clamp(raw.thickness,.18,4,.65),
 pattern:['auto','grille','bars','solid','dashes'].includes(raw.pattern)?raw.pattern:'auto',
 cap:raw.cap==='flat'?'flat':'round',labelPosition:['top','bottom','off'].includes(raw.labelPosition)?raw.labelPosition:'bottom',
 centerGlyph:!!raw.centerGlyph};};
const segmentLabelPosition=(d,seg)=>{const a=(Number(d.rotation)||0)*Math.PI/180;const r=(seg.thickness/2+.57)*(seg.labelPosition==='top'?-1:1);return{x:-Math.sin(a)*r,y:Math.cos(a)*r};};
const segmentColor=t=>({'curtain':'#86eddf','airInlet':'#88dfaf','airOutlet':'#e6ad79','feedLine':'#daa4f5','feedAuger':'#d1a3ff','feedTrough':'#e8c17d','ventWall':'#81dbf8','cableTrunk':'#fbd48c','warningZone':'#f8ba72'})[t]||'#85e2dd';


let byType={...builtins};
function rebuildTypes(){byType={...builtins};for(const x of data.customTypes||[]){byType[x.type]={type:x.type,group:x.group,label:x.label,symbol:x.symbol,shape:validShape(x.shape),color:validColor(x.color,groups[x.group].color),size:validSize(x.size),graphic:x.graphic||'text',defaultNote:x.defaultNote,defaultFields:x.defaultFields};}}
function validFields(raw,max=30){const fields=Array.isArray(raw)?raw:[];return fields.slice(0,max).map(f=>({key:str(f?.key,40),value:str(f?.value,220)})).filter(f=>f.key);}
function fieldsFromText(txt){return String(txt||'').split(/\r?\n/).slice(0,30).map(line=>{const i=line.indexOf('=');return{key:str(i<0?line:line.slice(0,i),40),value:str(i<0?'':line.slice(i+1),220)};}).filter(x=>x.key);}
function typeFieldsText(fields){return validFields(fields).map(x=>x.key+'='+x.value).join('\n');}
const $=(id)=>document.getElementById(id);
const map=$('plan'),canvas=$('canvas'),icons=$('eqIcons'),routesSvg=$('eqRoutes'),preview=$('eqPreview');
const initial={app:'HuweiEquipment',version:'V11.6',updatedAt:'',customTypes:[],devices:[],routes:[],templates:[],maintenance:[],systemNodes:[]};
let data=JSON.parse(JSON.stringify(initial));
let currentRole='staff', selected=null, action=null, actionType='',drawing=[], segmentHover=null, pointerDown=null, loadSource='尚未設定';
let history=[],historyIndex=-1,orthogonal=false,repeatPlacement=false,editorOpened=false;
let placementSources=[],activeTemplate=null;
let multiSelectMode=false, selectedIds=new Set(), snapEnabled=false, snapStep=0.25;
let showAnchorGuides=false;try{showAnchorGuides=localStorage.getItem('hw-v1199-anchor-guides')==='on';}catch(_){}
let deviceLabelMode='smart';try{const v=localStorage.getItem('hw-v88-device-label-mode');if(['smart','all','off'].includes(v))deviceLabelMode=v;}catch(e){}
const roundPos=n=>Math.round(n*10000)/10000;
function snapPos(n){return snapEnabled?roundPos(Math.round(n/snapStep)*snapStep):roundPos(n);}
function inMap(x,y){const v=map.viewBox.baseVal;return Number.isFinite(x)&&Number.isFinite(y)&&x>=-10&&x<=75&&y>=-10&&y<=90;}
let iconMagnetEnabled=true;try{iconMagnetEnabled=localStorage.getItem('hw-v100-icon-magnet')!=='off';}catch(e){}
function visual(d){
 const chosen=(selected?.kind==='device'&&selected.id===d.id)||selectedIds.has(d.id)||d.id==='preview-v100';
 return {...d,x:Number.isFinite(d.displayX)?d.displayX:d.x,y:Number.isFinite(d.displayY)?d.displayY:d.y,
  __selected:chosen,
  __nameplateVisible:visibility.labels&&d.showLabel!==false&&(deviceLabelMode==='all'||(deviceLabelMode==='smart'&&chosen))};
}
function iconX(d){return Number.isFinite(d.displayX)?d.displayX:d.x;}
function iconY(d){return Number.isFinite(d.displayY)?d.displayY:d.y;}
function magnetSolve(p,d,devices=data.devices){return window.HWIconMagnet.solve(p,visual(d),devices.map(visual),id=>byType[id],{enabled:iconMagnetEnabled});}
function magnetAllowed(list){if(!iconMagnetEnabled)return true;const positions=list.map(visual);return positions.every(d=>!data.devices.some(x=>!positions.some(z=>z.id===x.id)&&window.HWIconMagnet.collision(d,visual(x),id=>byType[id])))&&positions.every((d,i)=>positions.every((o,j)=>i===j||!window.HWIconMagnet.collision(d,o,id=>byType[id])));} 
function fitIcon(d){const spot=magnetSolve({x:iconX(d),y:iconY(d)},d);if(!spot.ok)return false;d.displayX=spot.x;d.displayY=spot.y;return true;}
function setActualPoint(d,x,y){const dx=x-d.x,dy=y-d.y;d.x=roundPos(x);d.y=roundPos(y);d.displayX=roundPos(iconX(d)+dx);d.displayY=roundPos(iconY(d)+dy);}


function editableSelection(){return data.devices.filter(d=>(multiSelectMode?selectedIds.has(d.id):selected?.kind==='device'&&selected.id===d.id)&&!d.locked);}
function getSelectionIds(){return multiSelectMode?[...selectedIds]:selected?.kind==='device'?[selected.id]:[];}
function clearMany(){selectedIds.clear();fire('selection');renderIcons();}
function setMultiMode(on){if(currentRole!=='admin')return;cancelAction();multiSelectMode=!!on;selectedIds.clear();if(multiSelectMode&&selected?.kind==='device')selectedIds.add(selected.id);selected=null;showInspector();renderAll();fire('selection');}
function toggleMany(id){if(!multiSelectMode||currentRole!=='admin')return;if(selectedIds.has(id))selectedIds.delete(id);else selectedIds.add(id);renderIcons();fire('selection');}
function moveSelected(dx,dy){if(currentRole!=='admin'||action)return 0;const targets=editableSelection();if(!targets.length){notify('請先選擇未鎖定的設備');return 0;}if(targets.some(d=>!inMap(iconX(d)+dx,iconY(d)+dy))){notify('移動位置超出圖面操作範圍');return 0;}const shifted=targets.map(d=>({...d,displayX:roundPos(iconX(d)+dx),displayY:roundPos(iconY(d)+dy)}));if(!magnetAllowed(shifted)){notify('移動位置已有設備，請拖曳圖標讓磁吸自動避讓');return 0;}for(let i=0;i<targets.length;i++){targets[i].displayX=shifted[i].displayX;targets[i].displayY=shifted[i].displayY;}save();renderAll();showInspector();return targets.length;}
function alignSelected(axis){if(!multiSelectMode||selectedIds.size<2){notify('請在多選模式選取至少 2 台設備');return 0;}const targets=editableSelection();if(targets.length<2){notify('可編輯設備不足 2 台');return 0;}const anchor=targets[0];const proposed=targets.map(d=>({...d}));for(const d of proposed){if(axis==='horizontal')d.displayY=iconY(anchor);else if(axis==='vertical')d.displayX=iconX(anchor);else return 0;}if(!magnetAllowed(proposed)){notify('對齊後會讓圖標重疊，請先拉開間距或縮小圖標');return 0;}proposed.forEach((p,i)=>{targets[i].displayX=p.displayX;targets[i].displayY=p.displayY;});save();renderAll();notify('已對齊 '+targets.length+' 台設備');return targets.length;}
function distributeSelected(axis){if(!multiSelectMode||selectedIds.size<3){notify('等距分布需選擇至少 3 台設備');return 0;}const targets=editableSelection();if(targets.length!==selectedIds.size){notify('請先排除鎖定設備再等距分布');return 0;}const key=axis==='horizontal'?'x':axis==='vertical'?'y':null;if(!key)return 0;const ordered=[...targets].sort((a,b)=>visual(a)[key]-visual(b)[key]);if(ordered.length<3){notify('至少選 3 台設備');return 0;}const first=visual(ordered[0])[key],last=visual(ordered[ordered.length-1])[key];if(last-first<.0001){notify('起點與終點重疊，請先拉開兩端設備');return 0;}const displayKey=key==='x'?'displayX':'displayY';const proposed=ordered.map((d,i)=>({...d,[displayKey]:roundPos(first+(last-first)*i/(ordered.length-1))}));if(!magnetAllowed(proposed)){notify('目前間距不足，等距分布會重疊圖標');return 0;}proposed.forEach((p,i)=>{ordered[i].displayX=p.displayX;ordered[i].displayY=p.displayY;});save();renderAll();notify('已等距分布 '+targets.length+' 台設備');return targets.length;}
function arrayCopy(count,dx,dy){if(currentRole!=='admin'||action)return 0;const ids=getSelectionIds();if(ids.length!==1){notify('請先選擇 1 台設備作為排列起點');return 0;}const d=data.devices.find(x=>x.id===ids[0]);if(!d){notify('找不到起始設備');return 0;}count=Number(count);dx=Number(dx);dy=Number(dy);if(!Number.isInteger(count)||count<1||count>50||!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)>40||Math.abs(dy)>40||(dx===0&&dy===0)){notify('數量須為 1～50，間距不得同時為 0');return 0;}if(data.devices.length+count>2000){notify('設備總數不得超過 2000');return 0;}const points=Array.from({length:count},(_,i)=>({x:roundPos(d.x+(i+1)*dx),y:roundPos(d.y+(i+1)*dy)}));if(points.some(p=>!inMap(p.x,p.y))){notify('排列結果超出圖面操作範圍，請調整數量或間距');return 0;}const added=[];for(const [i,pos] of points.entries()){
 // Array spacing defines the real CAD locations; collision avoidance may ONLY offset the icons.
 const item=clone(d);item.id=newId('d');item.name=(d.name+' '+(i+2)).slice(0,80);item.locked=false;item.photos=[];item.terminals=[];
 item.arrayBatchId='';item.arraySourceId='';item.arrayIndex=0;item.arrayTotal=0;item.condition='unchecked';item.lastInspectionAt='';
 item.x=pos.x;item.y=pos.y;
 const shift=i+1, desired={x:roundPos(iconX(d)+shift*dx),y:roundPos(iconY(d)+shift*dy)};
 const location=magnetSolve(desired,item);if(!location.ok)break;
 item.displayX=location.x;item.displayY=location.y;
 data.devices.push(item);added.push(item.id);
}selectedIds.clear();if(multiSelectMode){added.forEach(id=>selectedIds.add(id));selected=null;}else selected=added.length?{kind:'device',id:added[added.length-1]}:selected;if(!added.length)return 0;save();renderAll();showInspector();notify('成功新增 '+added.length+'／'+count+' 台'+(added.length<count?'，其餘因空間不足略過':'')+'；可按復原');return added.length;}
 // selected source combination and equipment template used for new placements
const hooks={};function fire(name){try{hooks[name]?.();}catch(e){console.error('V9.0 hook',e);}if(['data','selection','role','workspace','editorOpen','editorClose'].includes(name)){window.dispatchEvent(new CustomEvent('hw-v90-change',{detail:{kind:name}}));}}
let visibility={water:true,electric:true,ventilation:true,feed:true,equipment:true,labels:true};
function clone(o){return JSON.parse(JSON.stringify(o));}
function str(v,n=140){return String(v??'').trim().slice(0,n);}
function num(v,def=0){const n=Number(v);return Number.isFinite(n)&&Math.abs(n)<10000?n:def;}
function newId(prefix){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);}
function loadVisibility(){try{const v=JSON.parse(localStorage.getItem('hw-v83-equipment-visible')||localStorage.getItem('hw-v82-equipment-visible')||'null');if(v&&typeof v==='object')for(const k in visibility)if(typeof v[k]==='boolean')visibility[k]=v[k];}catch(e){}}
function saveVisibility(){try{localStorage.setItem('hw-v83-equipment-visible',JSON.stringify(visibility));}catch(e){}}
function sanitize(src){if(!src||typeof src!=='object'||Array.isArray(src)||!Array.isArray(src.devices)||!Array.isArray(src.routes))throw Error('設備檔案格式不正確');if(src.devices.length>2000||src.routes.length>2000)throw Error('設備或線路超出限制');
 const customTypes=[],typeSet=new Set(Object.keys(builtins));
 if(src.customTypes!=null&&!Array.isArray(src.customTypes))throw Error('自訂設備種類格式有誤');
 for(const item of (src.customTypes||[]).slice(0,150)){
  const type=str(item?.type,100),label=str(item?.label,36),symbol=str(item?.symbol,4)||'設',group=groups[item?.group]?item.group:'equipment';
  if(!/^custom-[a-z0-9-]{4,90}$/i.test(type)||typeSet.has(type)||!label)continue;
  typeSet.add(type);customTypes.push({type,group,label,symbol,graphic:(window.HWIconArt?.key(null,item?.graphic)?item.graphic:'text'),shape:validShape(item?.shape),size:validSize(item?.size),color:validColor(item?.color,groups[group].color),defaultNote:str(item?.defaultNote,400),defaultFields:validFields(item?.defaultFields)});
 }
 // V11.6: physical system hierarchy is a real project entity, not a four-card type palette.
 // A system may connect to several upstream systems of the same discipline.
 if(src.systemNodes!=null&&!Array.isArray(src.systemNodes))throw Error('系統架構資料格式錯誤');
 if((src.systemNodes||[]).length>800)throw Error('系統節點最多 800 筆');
 const sysSet=new Set(),systemNodes=[];
 for(const [i,x] of (src.systemNodes||[]).entries()){
  if(!x||typeof x!=='object'||Array.isArray(x))throw Error('系統節點格式錯誤');
  const id=str(x.id,100)||'sys-'+i;
  if(sysSet.has(id))throw Error('系統節點 ID 重複');sysSet.add(id);
  const group=['electric','water','ventilation','feed'].includes(x.group)?x.group:'electric';
  systemNodes.push({id,group,name:str(x.name,100)||'未命名子系統',zone:str(x.zone,100),note:str(x.note,500),parentIds:Array.isArray(x.parentIds)?[...new Set(x.parentIds.map(v=>str(v,100)).filter(Boolean))].slice(0,8):[]});
 }
 const sysById=new Map(systemNodes.map(x=>[x.id,x]));
 for(const node of systemNodes){node.parentIds=node.parentIds.filter(id=>id!==node.id&&sysById.get(id)?.group===node.group);}
 const sysVisited=new Set(),sysActive=new Set();
 function checkSys(id){if(sysActive.has(id))throw Error('系統母子關聯不能形成循環');if(sysVisited.has(id))return;sysActive.add(id);for(const p of sysById.get(id)?.parentIds||[])checkSys(p);sysActive.delete(id);sysVisited.add(id);}
 for(const id of sysSet)checkSys(id);
 const linkedSystems=raw=>Array.isArray(raw)?[...new Set(raw.map(v=>str(v,100)).filter(id=>sysSet.has(id)))].slice(0,24):[];
 const kinds={...builtins,...Object.fromEntries(customTypes.map(x=>[x.type,x]))};
 const idSet=new Set();
 const validTerminals=raw=>(Array.isArray(raw)?raw:[]).slice(0,80).map((t,i)=>({id:str(t.id,80)||('p-'+i),name:str(t.name,70)||'未命名端子',direction:['input','output','both'].includes(t.direction)?t.direction:'both',feedsFrom:str(t.feedsFrom,80),purpose:str(t.purpose,200),controls:str(t.controls,200),note:str(t.note,300),breakerKind:['mccb','mcb','rcbo','rcd','contactor','relay','fuse','terminal','other'].includes(t.breakerKind)?t.breakerKind:'terminal',ratedAmps:(/^\d{1,4}(?:\.\d{1,2})?$/.test(String(t.ratedAmps||''))&&Number(t.ratedAmps)<=2000)?String(t.ratedAmps):'',poleCount:['1','2','3','4'].includes(String(t.poleCount))?String(t.poleCount):'',circuitTag:str(t.circuitTag,60)}));
 const validPhotos=raw=>(Array.isArray(raw)?raw:[]).slice(0,32).map((ph,i)=>({id:str(ph.id,80)||('photo-'+i),name:str(ph.name,120)||'設備照片',createdAt:str(ph.createdAt,60),markers:(Array.isArray(ph.markers)?ph.markers:[]).slice(0,80).map((m,j)=>({id:str(m.id,80)||('marker-'+j),x:Math.min(100,Math.max(0,num(m.x,50))),y:Math.min(100,Math.max(0,num(m.y,50))),title:str(m.title,100),note:str(m.note,500),terminalId:str(m.terminalId,80)}))}));
 const devices=src.devices.map((d,i)=>{const t=kinds[d.type]||builtins.other;let id=str(d.id,100)||'d-'+i;if(idSet.has(id))throw Error('設備 ID 重複');idSet.add(id);return{id,type:t.type,x:num(d.x),y:num(d.y),displayX:d.displayX==null?num(d.x):num(d.displayX,num(d.x)),displayY:d.displayY==null?num(d.y):num(d.displayY,num(d.y)),name:str(d.name,80)||t.label,zone:str(d.zone,80),status:['planned','installed','maintenance'].includes(d.status)?d.status:'planned',condition:['normal','abnormal','offline','repairing'].includes(d.condition)?d.condition:'unchecked',lastInspectionAt:str(d.lastInspectionAt,10),rotation:num(d.rotation),note:str(d.note,900),waterSources:Array.isArray(d.waterSources)?['tower','groundwater','tap'].filter(v=>d.waterSources.includes(v)):[],valveSelection:['tower','groundwater','tap','closed','unknown'].includes(d.valveSelection)?d.valveSelection:'unknown',fields:validFields(d.fields),shape:d.shape?validShape(d.shape):null,color:d.color?validColor(d.color,null):null,size:d.size?validSize(d.size):null,widthScale:validAxis(d.widthScale),heightScale:validAxis(d.heightScale),segment:SEGMENT_TYPES.has(t.type)?validSegment(d.segment):null,array:ARRAY_TYPES.has(t.type)?validArray(d.array):null,arrayBatchId:str(d.arrayBatchId,100),arraySourceId:str(d.arraySourceId,100),arrayIndex:d.arrayBatchId?Math.max(1,Math.min(20,Math.round(num(d.arrayIndex,1)))):0,arrayTotal:d.arrayBatchId?Math.max(1,Math.min(20,Math.round(num(d.arrayTotal,1)))):0,locked:!!d.locked,showLabel:d.showLabel!==false,systemIds:linkedSystems(d.systemIds),terminals:validTerminals(d.terminals),photos:validPhotos(d.photos)};});
 const templateIds=new Set();
 const templates=(Array.isArray(src.templates)?src.templates:[]).slice(0,100).map((t,i)=>{
  const id=str(t?.id,90)||'t-'+i;
  if(templateIds.has(id))return null;templateIds.add(id);
  const type=kinds[t?.type]?t.type:'other';
  return{id,name:str(t?.name,50)||'未命名模板',type,shape:validShape(t?.shape||kinds[type].shape),color:validColor(t?.color,kinds[type].color),size:validSize(t?.size),widthScale:validAxis(t?.widthScale),heightScale:validAxis(t?.heightScale),segment:SEGMENT_TYPES.has(type)?validSegment(t?.segment):null,array:ARRAY_TYPES.has(type)?validArray(t?.array):null,showLabel:t?.showLabel!==false,note:str(t?.note,900),waterSources:Array.isArray(t?.waterSources)?['tower','groundwater','tap'].filter(x=>t.waterSources.includes(x)):[],fields:validFields(t?.fields)};
 }).filter(Boolean);
 const routes=src.routes.map((r,i)=>{const group=groups[r.group]?r.group:'water';if(!Array.isArray(r.points)||r.points.length<2||r.points.length>100)throw Error('線路節點應有 2 至 100 點');let id=str(r.id,100)||'r-'+i;if(idSet.has(id))throw Error('線路 ID 重複');idSet.add(id);const fromDeviceId=str(r.fromDeviceId||r.points[0]?.deviceId,100),toDeviceId=str(r.toDeviceId||r.points[r.points.length-1]?.deviceId,100);
 const from=idSet.has(fromDeviceId)?fromDeviceId:'',to=idSet.has(toDeviceId)?toDeviceId:'';
 const ft=str(r.fromTerminalId,80),tt=str(r.toTerminalId,80),a=devices.find(d=>d.id===from),b=devices.find(d=>d.id===to);
 const validEnd=!!(a&&b&&(!ft||a.terminals.some(t=>t.id===ft))&&(!tt||b.terminals.some(t=>t.id===tt)));
 return{id,group,name:str(r.name,80)||groups[group].name+'線路',note:str(r.note,900),points:r.points.map(p=>({x:num(p.x),y:num(p.y),...(p.deviceId&&idSet.has(String(p.deviceId))?{deviceId:String(p.deviceId)}:{})})),fromDeviceId:from,toDeviceId:to,fromTerminalId:ft,toTerminalId:tt,circuitName:str(r.circuitName,80),purpose:str(r.purpose,400),cableSpec:str(r.cableSpec,120),feedSpec:str(r.feedSpec,120),feedMode:['auger','chain','pneumatic','other'].includes(r.feedMode)?r.feedMode:'auger',waterSource:['tower','groundwater','tap','unknown'].includes(r.waterSource)?r.waterSource:'unknown',flowDirection:['forward','reverse','unknown'].includes(r.flowDirection)?r.flowDirection:'unknown',pipeDiameter:str(r.pipeDiameter,55),pipeMaterial:str(r.pipeMaterial,80),verifiedBy:str(r.verifiedBy,80),verifiedAt:str(r.verifiedAt,40),verificationNote:str(r.verificationNote,500),evidencePhotoId:str(r.evidencePhotoId,100),systemIds:linkedSystems(r.systemIds),confirmed:!!r.confirmed&&validEnd};});
 // V11.4 maintenance records belong to the same project, so JSON, encrypted photo backup,
 // Firebase snapshots and undo/redo cannot silently omit them. Preserve historical work orders
 // even if a referenced device is later removed; the audit view flags the orphan instead.
 if(src.maintenance!=null&&!Array.isArray(src.maintenance))throw Error('維修紀錄必須是陣列');
 if((src.maintenance||[]).length>1200)throw Error('維修紀錄最多 1200 筆');
 const workIds=new Set();
 const maintenance=(src.maintenance||[]).map((m,i)=>{
  if(!m||typeof m!=='object'||Array.isArray(m))throw Error('維修紀錄格式錯誤');
  const id=str(m.id,100)||'work-'+i;
  if(workIds.has(id))throw Error('維修紀錄 ID 重複');workIds.add(id);
  const kind=['fault','repair','inspection','replacement'].includes(m.kind)?m.kind:'inspection';
  const status=['open','working','done'].includes(m.status)?m.status:'open';
  const priority=['high','normal','low'].includes(m.priority)?m.priority:'normal';
  const safeDate=v=>{const txt=str(v,10);return /^\d{4}-\d{2}-\d{2}$/.test(txt)&&!Number.isNaN(Date.parse(txt+'T00:00:00Z'))?txt:'';};
  return{id,deviceId:str(m.deviceId,100),routeId:str(m.routeId,100),kind,status,priority,
   title:str(m.title,120)||'未命名工作單',description:str(m.description,1800),result:str(m.result,1800),
   reporter:str(m.reporter,70),assignee:str(m.assignee,70),workDate:safeDate(m.workDate),dueDate:safeDate(m.dueDate),
   completedAt:safeDate(m.completedAt),cost:Math.max(0,Math.min(100000000,Number(m.cost)||0)),
   photoId:str(m.photoId,100),inspectionCondition:['normal','abnormal','offline','repairing'].includes(m.inspectionCondition)?m.inspectionCondition:'',inspectionRoundId:str(m.inspectionRoundId,100),createdAt:str(m.createdAt,40),updatedAt:str(m.updatedAt,40),archived:!!m.archived};
 });
 return{app:'HuweiEquipment',version:'V11.6',updatedAt:str(src.updatedAt,60),customTypes,devices,routes,templates,maintenance,systemNodes};}

function snapshot(){const serial=JSON.stringify(data);if(historyIndex>=0&&history[historyIndex]===serial)return;history=history.slice(0,historyIndex+1);history.push(serial);if(history.length>41)history.shift();historyIndex=history.length-1;fire('history');}
let storageDirty=false,storageLastError='',lastSavedAt='';
function persist(){try{localStorage.setItem('hw-v94-project',JSON.stringify(data));storageDirty=false;storageLastError='';lastSavedAt=new Date().toISOString();loadSource='本機草稿';return true;}
 catch(e){storageDirty=true;storageLastError=e?.message||'瀏覽器儲存失敗';loadSource='尚未成功儲存';notify('⚠️ 設備變更未儲存，請立即下載緊急備份');return false;}}
function save(){data.updatedAt=new Date().toISOString();const ok=persist();snapshot();updateFooter();fire('data');window.dispatchEvent(new CustomEvent('hw-v101-storage',{detail:{ok,dirty:storageDirty,error:storageLastError}}));return ok;}
window.addEventListener('beforeunload',e=>{if(storageDirty){e.preventDefault();e.returnValue='';}});

function timeTravel(step){const index=historyIndex+step;if(index<0||index>=history.length)return;historyIndex=index;data=sanitize(JSON.parse(history[index]));rebuildTypes();updateCatalogue();const oldSelection=selected;selected=oldSelection&&(oldSelection.kind==='device'?data.devices:data.routes).some(x=>x.id===oldSelection.id)?oldSelection:null;selectedIds=new Set([...selectedIds].filter(id=>data.devices.some(d=>d.id===id)));cancelAction();editorOpened=false;persist();renderAll();showInspector();fire('history');window.dispatchEvent(new CustomEvent('hw-v101-storage',{detail:{dirty:storageDirty,error:storageLastError}}));fire('data');notify(step<0?'已復原上一個操作':'已重做上一個操作');}

function updateFooter(){const c={water:0,electric:0,ventilation:0,feed:0,equipment:0};data.devices.forEach(d=>c[byType[d.type]?.group||'equipment']++);data.routes.forEach(r=>c[r.group]++);
 for(const k of Object.keys(groups)){const el=$('eqCount-'+k);if(el)el.textContent=String(c[k]);}
 $('eqTotal').textContent=data.devices.length+' 台／點 · '+data.routes.length+' 條線';$('eqStorage').textContent=(storageDirty?'⚠️ 尚未成功儲存！請下載緊急備份或重試。':'✓ 已存本機 · ')+ '資料來源：'+loadSource+'；設備配置僅儲存本機';
 $('eqStatus').textContent='設備 '+data.devices.length+'　線路 '+data.routes.length+'　｜'+(currentRole==='admin'?'本機編輯':'員工檢視');
}
function node(tag,attrs,text){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,String(attrs[k]));if(text!=null)e.textContent=text;return e;}
function groupVisible(k){return !!visibility[k];}
function routePoint(p){if(p.deviceId){const d=data.devices.find(x=>x.id===p.deviceId);if(d)return{x:d.x,y:d.y};}return{x:p.x,y:p.y};}
function pathCoords(pts){return pts.map(p=>{const a=routePoint(p);return a.x.toFixed(4)+','+a.y.toFixed(4);}).join(' ');}
function renderRoutes(){routesSvg.replaceChildren();data.routes.forEach(r=>{if(!groupVisible(r.group))return;const g=node('g',{'data-eq-route':r.id,'data-water-source':r.group==='water'?(r.waterSource||'unknown'):'','data-flow-direction':r.flowDirection||'unknown'});const points=pathCoords(r.points),selectedRoute=selected?.kind==='route'&&selected.id===r.id;
 g.appendChild(node('polyline',{points,stroke:groups[r.group].color,'stroke-dasharray':r.group==='feed'?'0.18 0.10':'0.42 0.22',class:'route-line'+(selectedRoute?' selected-route':'')}));
 g.appendChild(node('polyline',{points,class:'routehit'}));g.addEventListener('click',e=>{
 if(!action&&e.detail!==0)return; // V11.8.5 pointerup handles single click/tap after pan detection.
 e.stopPropagation();if(action==='route'){addRoutePoint(e);return;}select('route',r.id);});routesSvg.appendChild(g);
 if(visibility.labels&&(deviceLabelMode==='all'||(deviceLabelMode==='smart'&&selectedRoute))){const pts=r.points.map(routePoint),mid=pts[Math.floor(pts.length/2)];const t=node('text',{x:mid.x,y:mid.y-.33,'font-size':'.63','text-anchor':'middle',fill:groups[r.group].color,stroke:'#091b2d','stroke-width':'.08','paint-order':'stroke fill'},r.group==='ventilation'?'氣流示意 · '+r.name:r.name);routesSvg.appendChild(t);}
 });}
const v115IconById=new Map();
// Visual nameplates never block equipment snapping. Instead choose an unoccupied
// side for the selected label using the current icon-only collision geometry.
function nameplateLocation(d,sizeX,sizeY,width){
 const x=iconX(d),y=iconY(d);
 const placements=[
  {x:0,y:1.34*sizeY},
  {x:0,y:-1.36*sizeY},
  {x:1.12*sizeX+width/2+.17*sizeX,y:0},
  {x:-1.12*sizeX-width/2-.17*sizeX,y:0}
 ];
 const others=data.devices.filter(q=>{
  if(q.id===d.id || !groupVisible((byType[q.type]||builtins.other).group))return false;
  const type=byType[q.type]||builtins.other,neighborScale=(q.size||type.size||100)/100;
  const neighborSpan=neighborScale*Math.max(iconAxis(q,'widthScale'),iconAxis(q,'heightScale'));
  // Avoid repeated SVG geometry calculation for distant devices, especially
  // on tablets displaying hundreds of equipment labels at once.
  return Math.abs(iconX(q)-x)<=width/2+2*sizeX+2*neighborSpan &&
   Math.abs(iconY(q)-y)<=2.3*sizeY+2*neighborSpan;
 });
 const h=.35;
 let best=placements[0],lowest=Infinity;
 for(const spot of placements){
  const area={x0:x+spot.x-width/2,y0:y+spot.y-h,x1:x+spot.x+width/2,y1:y+spot.y+h};
  let penalty=0;
  for(const q of others){
   const box=window.HWIconMagnet.dims(visual(q),id=>byType[id]);
   const qx=iconX(q),qy=iconY(q);
   const widthOverlap=Math.max(0,Math.min(area.x1,qx+box.maxX)-Math.max(area.x0,qx+box.minX));
   const heightOverlap=Math.max(0,Math.min(area.y1,qy+box.maxY)-Math.max(area.y0,qy+box.minY));
   penalty+=widthOverlap*heightOverlap;
  }
  if(penalty<.0001)return spot;
  if(penalty<lowest){lowest=penalty;best=spot;}
 }
 return best;
}
function renderIcons(){icons.replaceChildren();v115IconById.clear();for(const d of data.devices){const type=byType[d.type]||builtins.other,gname=type.group;if(!groupVisible(gname))continue;
 const selectedIcon=(selected?.kind==='device'&&selected.id===d.id)||selectedIds.has(d.id);
 const size=(d.size||type.size||100)/100,sizeX=size*iconAxis(d,'widthScale'),sizeY=size*iconAxis(d,'heightScale'),shape=d.shape||type.shape||'circle',color=d.color||type.color||groups[gname].color;
 const dx=iconX(d),dy=iconY(d);
 if(showAnchorGuides&&Math.hypot(dx-d.x,dy-d.y)>.11){const leader=node('g',{class:'v101-anchor-link','pointer-events':'none','aria-hidden':'true'});leader.appendChild(node('line',{x1:d.x,y1:d.y,x2:dx,y2:dy,stroke:'#65c5bc','stroke-width':'.065','stroke-dasharray':'.18 .14',opacity:'.72'}));leader.appendChild(node('circle',{cx:d.x,cy:d.y,r:'.135',fill:'#0b3241',stroke:'#63e5bd','stroke-width':'.065'}));icons.appendChild(leader);}
 const g=node('g',{'data-eq-device':d.id,class:'v82-equip v88-device hw109-'+(['normal','abnormal','offline','repairing'].includes(d.condition)?d.condition:'unchecked')+(selectedIcon?' is-selected':'')+(d.locked?' is-locked':''),transform:`translate(${dx} ${dy})`});
 g.appendChild(node('title',{},d.name+' · '+(type.label||'設備')));
 const seg=validSegment(d.segment),arr=validArray(d.array);
 const visualLength=seg?.length||arrayLength(arr),visualThickness=seg?.thickness||(arr?1.65:0);
 if(selectedIcon){const halo=(seg||arr)?node('rect',{x:(-visualLength/2-.16).toFixed(3),y:(-visualThickness/2-.16).toFixed(3),width:(visualLength+.32).toFixed(3),height:(visualThickness+.32).toFixed(3),rx:'.21',transform:`rotate(${d.rotation||0})`,fill:'none',stroke:'#a8f5e0','stroke-width':'.10','stroke-dasharray':'.18 .11',class:'v88-selection-halo'}):node('ellipse',{rx:(1.21*sizeX).toFixed(3),ry:(1.21*sizeY).toFixed(3),transform:`rotate(${d.rotation||0})`,fill:'none',stroke:'#a8f5e0','stroke-width':'.10','stroke-dasharray':'.18 .11',class:'v88-selection-halo'});g.appendChild(halo);}

 const rotate=node('g',{transform:(seg||arr)?`rotate(${d.rotation||0})`:`rotate(${d.rotation||0}) scale(${sizeX} ${sizeY})`});
 if(seg){
  if(window.HWSmartEquipment)window.HWSmartEquipment.drawSegment(rotate,d,seg,type,node);
 }else if(arr){
  if(window.HWSmartEquipment)window.HWSmartEquipment.drawArray(rotate,d,arr,type,node);
 }else{
 let base;
 if(shape==='square')base=node('rect',{x:'-.91',y:'-.91',width:'1.82',height:'1.82',rx:'.26',fill:'#0f2939',stroke:color,'stroke-width':'.11',class:'ring'});
 else if(shape==='diamond')base=node('path',{d:'M0 -1.13 L1.13 0 L0 1.13 L-1.13 0 Z',fill:'#0f2939',stroke:color,'stroke-width':'.11',class:'ring'});
 else if(shape==='hex')base=node('path',{d:'M-.96 -.54 L0 -1.08 L.96 -.54 L.96 .54 L0 1.08 L-.96 .54 Z',fill:'#0f2939',stroke:color,'stroke-width':'.11',class:'ring'});
 else base=node('circle',{r:'.92',fill:'#0f2939',stroke:color,'stroke-width':'.11',class:'ring'});
 rotate.appendChild(base);
 const art=window.HWIconArt?.draw(d.type,type.graphic);
 if(art){art.setAttribute('x','-.64');art.setAttribute('y','-.64');art.setAttribute('width','1.28');art.setAttribute('height','1.28');art.style.color='#e2f5f8';art.setAttribute('pointer-events','none');rotate.appendChild(art);}
 else {const s=[...String(type.symbol||'設')].slice(0,3).join('');rotate.appendChild(node('text',{'text-anchor':'middle',y:'.22','font-size':s.length>2?'.49':s.length>1?'.61':'.78',fill:'#e2f5f8','font-weight':'650',class:'v88-letter-glyph'},s));}
 rotate.appendChild(node('circle',{r:'1.12',class:'hit'}));}
 g.appendChild(rotate);
 // V11.10.9 manual-condition visual contour. This SVG is decorative/noninteractive.
 if(['abnormal','repairing','offline'].includes(d.condition)){
  const col={abnormal:'#ff626e',repairing:'#f2b76a',offline:'#aab7c9'}[d.condition];
  const contour=(seg||arr)?node('rect',{x:(-visualLength/2-.11).toFixed(3),y:(-visualThickness/2-.11).toFixed(3),width:(visualLength+.22).toFixed(3),height:(visualThickness+.22).toFixed(3),rx:'.18',transform:`rotate(${d.rotation||0})`,fill:'none',stroke:col,'stroke-width':'.10','stroke-dasharray':d.condition==='offline'?'.22 .15':'none',class:'hw109-condition-halo'}):node('ellipse',{rx:(1.10*sizeX).toFixed(3),ry:(1.10*sizeY).toFixed(3),transform:`rotate(${d.rotation||0})`,fill:'none',stroke:col,'stroke-width':'.11',class:'hw109-condition-halo'});
  contour.setAttribute('pointer-events','none');g.appendChild(contour);
 }
 const stateColor={planned:'#c7a366',installed:'#55c6a1',maintenance:'#ec877b'}[d.status]||'#c7a366';

 // Condition is a *manual inspection record*, separate from installed/planned status.
 // Pointer events disabled so existing device dragging & selection remain unchanged.
 const inspectionBadge={normal:['#62e0b1','✓'],abnormal:['#ff7578','!'],offline:['#a3afc1','×'],repairing:['#fbb968','修']}[d.condition];
 if(inspectionBadge){
  const bx=(seg||arr)?visualLength/2-.08:.82*sizeX,by=(seg||arr)?-visualThickness/2-.15:-.82*sizeY;
  const b=node('g',{transform:`translate(${bx.toFixed(3)} ${by.toFixed(3)})`,'pointer-events':'none',class:'hw-inspection-badge','aria-hidden':'true'});
  b.appendChild(node('circle',{r:'.23',fill:'#092131',stroke:inspectionBadge[0],'stroke-width':'.09'}));
  b.appendChild(node('text',{'text-anchor':'middle',y:'.10','font-size':inspectionBadge[1]==='修'?'.24':'.35','font-weight':'850',fill:inspectionBadge[0]},inspectionBadge[1]));
  g.appendChild(b);
 }
 g.appendChild(node('circle',{cx:(seg||arr)?(-visualLength/2+.14).toFixed(3):(-.70*sizeX).toFixed(3),cy:(seg||arr)?(-visualThickness/2-.13).toFixed(3):(-.70*sizeY).toFixed(3),r:(seg||arr)?'.11':(.155*Math.min(sizeX,sizeY)).toFixed(3),fill:stateColor,stroke:'#0b2232','stroke-width':'.09',class:'v88-state-dot'}));
 if(d.type==='threeWay'&&d.waterSources?.length){
  const colors={tower:'#72b9f1',groundwater:'#6bd4b4',tap:'#f6d391'},letters={tower:'T',groundwater:'G',tap:'C'};
  const sources=['tower','groundwater','tap'].filter(s=>d.waterSources.includes(s));
  const gap=.49*sizeX,start=-gap*(sources.length-1)/2;
  sources.forEach((s,i)=>{const badge=node('g',{class:'v86-source-badge v88-source-chip','data-source':s,transform:`translate(${(start+gap*i).toFixed(3)} ${(-1.24*sizeY).toFixed(3)}) scale(${size})`});
   badge.appendChild(node('rect',{x:'-.20',y:'-.24',width:'.40',height:'.48',rx:'.16',fill:'#102d40',stroke:colors[s],'stroke-width':'.09'}));
   badge.appendChild(node('text',{x:'0',y:'.115','text-anchor':'middle','font-size':'.29','font-weight':'750',fill:colors[s]},letters[s]));g.appendChild(badge);});
 }
 // Smart mode prevents dozens of repeated labels from obscuring beds and walls.
 if(visibility.labels&&d.showLabel!==false&&(deviceLabelMode==='all'||(deviceLabelMode==='smart'&&selectedIcon))){
  const label=[...String(d.name||type.label)].slice(0,14).join('')+([...(d.name||type.label)].length>14?'…':'');
  const width=Math.max(.9,Array.from(label).reduce((v,ch)=>v+(/[\x00-\x7f]/.test(ch)?.35:.59),0)+.45);
  const position=(seg||arr)?((seg?.labelPosition||arr?.labelPosition)==='off'?null:segmentLabelPosition(d,{thickness:visualThickness,labelPosition:seg?.labelPosition||arr?.labelPosition})):nameplateLocation(d,sizeX,sizeY,width);
  if(position){const labelG=node('g',{class:'v88-nameplate','pointer-events':'none',transform:`translate(${position.x.toFixed(3)} ${position.y.toFixed(3)})`});
  labelG.appendChild(node('rect',{x:(-width/2).toFixed(3),y:'-.35',width:width.toFixed(3),height:'.68',rx:'.19',fill:'#0c2838',stroke:'#426477','stroke-width':'.047'}));
  labelG.appendChild(node('text',{x:'0',y:'.12','text-anchor':'middle','font-size':'.54',fill:'#e6f7fb','font-weight':'600'},label));g.appendChild(labelG);}
 }
 if(d.locked){const lock=node('g',{transform:`translate(${(.79*sizeX).toFixed(3)} ${(-.73*sizeY).toFixed(3)})`});lock.appendChild(node('rect',{x:'-.13',y:'-.01',width:'.26',height:'.19',rx:'.035',fill:'#9bb5c5'}));lock.appendChild(node('path',{d:'M-.08 -.01v-.10a.08 .08 0 0 1 .16 0v.10',stroke:'#9bb5c5','stroke-width':'.04',fill:'none'}));g.appendChild(lock);}
 g.addEventListener('click',e=>{
 if(!action&&e.detail!==0)return; // V11.8.5 pointerup handles single click/tap after pan detection.
 e.stopPropagation();if(action==='route'){addRoutePoint(e,d.id);return;}if(action==='place')return;if(multiSelectMode||(currentRole==='admin'&&e.shiftKey)){if(!multiSelectMode)setMultiMode(true);toggleMany(d.id);return;}select('device',d.id);});
 g.addEventListener('pointerdown',e=>{
 // V11.9.5: admin + unlocked equipment -> ordinary mouse/stylus/touch drag.
 // Panning on empty CAD remains unchanged; locked objects and staff still pan.
 if(currentRole!=='admin'||action||d.locked||multiSelectMode||e.shiftKey||e.button!==0||e.isPrimary===false)return;
 e.preventDefault();e.stopPropagation();
 const start={x:e.clientX,y:e.clientY},offset=svgPoint(e),orig={x:iconX(d),y:iconY(d)};
 let moved=false,accepted=false,rejected=false,finished=false;
 // Capture on the persistent canvas, since select() may re-render this SVG group.
 try{canvas.setPointerCapture(e.pointerId);}catch(_){}
 select('device',d.id);
 const activeIcon=()=>v115IconById.get(d.id);
 canvas.classList.add('hw-device-dragging');
 function move(ev){
  if(ev.pointerId!==e.pointerId||finished)return;
  if(!moved&&Math.hypot(ev.clientX-start.x,ev.clientY-start.y)<6)return;
  moved=true;
  const target=data.devices.find(item=>item.id===d.id);
  if(!target||target.locked||currentRole!=='admin')return;
  const pt=svgPoint(ev),requested={x:snapPos(orig.x+pt.x-offset.x),y:snapPos(orig.y+pt.y-offset.y)};
  if(!inMap(requested.x,requested.y)){rejected=true;return;}
  const result=magnetSolve(requested,target);
  if(!result.ok){rejected=true;return;}
  target.displayX=result.x;target.displayY=result.y;
  accepted=accepted||Math.hypot(result.x-orig.x,result.y-orig.y)>.0001;
  const icon=activeIcon();if(icon){
   icon.setAttribute('transform',`translate(${result.x} ${result.y})`);
   const label=icon.querySelector('.v88-nameplate');
   if(label){
    const type=byType[target.type]||builtins.other;
    const displayed=[...String(target.name||type.label)].slice(0,14).join('')+([...(target.name||type.label)].length>14?'…':'');
    const width=Math.max(.9,Array.from(displayed).reduce((v,ch)=>v+(/[\x00-\x7f]/.test(ch)?.35:.59),0)+.45);
    const factor=(target.size||type.size||100)/100;
    const sg=validSegment(target.segment),ag=validArray(target.array);const pos=sg?segmentLabelPosition(target,sg):(ag?segmentLabelPosition(target,{thickness:1.65,labelPosition:ag.labelPosition}):nameplateLocation(target,factor*iconAxis(target,'widthScale'),factor*iconAxis(target,'heightScale'),width));
    label.setAttribute('transform',`translate(${pos.x.toFixed(3)} ${pos.y.toFixed(3)})`);
   }
  }
  window.dispatchEvent(new CustomEvent('hw-v100-magnet',{detail:{...result,mode:'drag',type:target.type}}));
 }
 function end(ev){
  if(ev.pointerId!==e.pointerId||finished)return;
  finished=true;
  window.removeEventListener('pointermove',move);
  window.removeEventListener('pointerup',end);
  window.removeEventListener('pointercancel',cancel);
  canvas.classList.remove('hw-device-dragging');
  try{if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}catch(_){}
  const target=data.devices.find(item=>item.id===d.id);
  if(accepted&&target){save();fillEditor();}
  else if(target){target.displayX=orig.x;target.displayY=orig.y;if(moved&&rejected)notify('該位置無法放置圖示，請避開其他設備或調整吸附設定');}
  window.dispatchEvent(new CustomEvent('hw-v100-magnet',{detail:{mode:'end'}}));
  renderAll();
 }
 function cancel(ev){if(ev.pointerId!==e.pointerId||finished)return;accepted=false;end(ev);}
 window.addEventListener('pointermove',move);
 window.addEventListener('pointerup',end);
 window.addEventListener('pointercancel',cancel);
 });icons.appendChild(g);v115IconById.set(d.id,g);
 }
 // Preserve foreground selection even after layer toggles, edits and full rerenders.
 if(selected?.kind==='device'){const active=v115IconById.get(selected.id);if(active&&active.parentNode===icons)icons.appendChild(active);}
 }
function renderPreview(){preview.replaceChildren();
 if((action==='segment'||action==='array')&&drawing.length&&segmentHover){const a=drawing[0],b=segmentHover;const l=Math.hypot(b.x-a.x,b.y-a.y);if(l>.1){preview.appendChild(node('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#7de9d5','stroke-width':'.38','stroke-opacity':'.38'}));preview.appendChild(node('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#d9fff5','stroke-width':'.06','stroke-dasharray':'.26 .12'}));preview.appendChild(node('circle',{cx:a.x,cy:a.y,r:'.19',fill:'#8cf4d9'}));preview.appendChild(node('circle',{cx:b.x,cy:b.y,r:'.19',fill:'#8cf4d9'}));}return;}
 if(action!=='route'||!drawing.length)return;preview.appendChild(node('polyline',{points:pathCoords(drawing),fill:'none',stroke:groups[actionType].color,'stroke-width':'.18','stroke-dasharray':'.35 .2'}));drawing.forEach(p=>{const q=routePoint(p);preview.appendChild(node('circle',{cx:q.x,cy:q.y,r:'.22',fill:groups[actionType].color}));});}
function updateCatalogue(){const list=[...catalogue,...(data.customTypes||[])];const drop=$('eqType');const old=drop.value;drop.replaceChildren();for(const t of list){const op=document.createElement('option');op.value=t.type;op.textContent=groups[t.group].name+'｜'+t.label+(t.type.startsWith('custom-')?' ★':'');drop.appendChild(op);}if(byType[old])drop.value=old;
 const ch=$('eqChangeType');if(ch){const selected=ch.value;ch.replaceChildren();for(const t of list){const op=document.createElement('option');op.value=t.type;op.textContent=groups[t.group].name+'｜'+t.label;ch.appendChild(op);}if(byType[selected])ch.value=selected;}}
function resetTypeForm(){editingTypeId=null;$('eqCustomLabel').value='';$('eqCustomSymbol').value='';$('eqCustomGroup').value='water';$('eqCustomNote').value='';$('eqCustomFields').value='';$('eqCustomShape').value='circle';$('eqCustomColor').value='#65caff';$('eqCustomSize').value='100';$('eqCustomGraphic').value='text';$('eqSaveType').textContent='＋ 儲存設備種類';}
function typeIntoForm(t){editingTypeId=t.type;$('eqCustomLabel').value=t.label;$('eqCustomSymbol').value=t.symbol;$('eqCustomGroup').value=t.group;$('eqCustomNote').value=t.defaultNote||'';$('eqCustomFields').value=typeFieldsText(t.defaultFields);$('eqCustomShape').value=t.shape||'circle';$('eqCustomColor').value=t.color||groups[t.group].color;$('eqCustomSize').value=t.size||100;$('eqCustomGraphic').value=t.graphic||'text';$('eqSaveType').textContent='儲存修改設備種類';setWorkspace('equipment');fire('designerOpen');$('eqCustomLabel').scrollIntoView({block:'nearest',behavior:'smooth'});}
function renderTypeList(){const el=$('eqCustomTypeList');el.replaceChildren();for(const t of data.customTypes||[]){const wrap=document.createElement('div');wrap.className='v83-type-item';const chip=document.createElement('span');chip.className='v83-type-symbol';chip.style.background=groups[t.group].color;chip.textContent=t.symbol;const text=document.createElement('span');text.className='v83-type-text';text.textContent=t.label;const meta=document.createElement('small');meta.textContent=groups[t.group].name+' · '+(t.defaultFields?.length||0)+' 種規格';text.appendChild(meta);const edit=document.createElement('button');edit.type='button';edit.className='v82-btn';edit.textContent='修改';edit.addEventListener('click',()=>typeIntoForm(t));const del=document.createElement('button');del.type='button';del.className='v82-btn danger';del.textContent='刪除';del.addEventListener('click',()=>{if(data.devices.some(d=>d.type===t.type)){notify('此種類已有設備使用，請先變更或刪除那些設備');return;}if(!confirm('刪除自訂設備種類「'+t.label+'」？'))return;data.customTypes=data.customTypes.filter(x=>x.type!==t.type);if(editingTypeId===t.type)resetTypeForm();rebuildTypes();save();renderAll();notify('已刪除設備種類');});wrap.append(chip,text,edit,del);el.appendChild(wrap);}
 if(!el.childElementCount){const p=document.createElement('p');p.className='v82-hint';p.textContent='尚無自訂設備種類，可以在上方新增。';el.appendChild(p);}}
function addFieldRow(key='',value=''){const area=$('eqDeviceFields');if(area.children.length>=30){notify('每台設備最多 30 項規格');return;}const row=document.createElement('div');row.className='v83-field-row';const name=document.createElement('input');name.className='v82-input';name.maxLength=40;name.placeholder='欄位名稱';name.setAttribute('aria-label','規格欄位名稱');name.value=key;const val=document.createElement('input');val.className='v82-input';val.maxLength=220;val.placeholder='規格內容';val.setAttribute('aria-label','規格欄位內容');val.value=value;const del=document.createElement('button');del.type='button';del.className='v82-btn danger';del.textContent='×';del.title='刪除此規格欄位';del.addEventListener('click',()=>row.remove());row.append(name,val,del);area.appendChild(row);}
function editorFields(){const result=[];for(const row of $('eqDeviceFields').children){const key=str(row.children[0]?.value,40);if(key)result.push({key,value:str(row.children[1]?.value,220)});}return result;}
let editingTypeId=null,workspace='base';
function setWorkspace(which){workspace=which==='equipment'?'equipment':'base';for(const el of document.querySelectorAll('[data-workspace]')){const on=el.dataset.workspace===workspace;el.classList.toggle('active',on);el.setAttribute('aria-selected',String(on));}const base=workspace==='base';$('v83BasePanel').hidden=!base;$('v83EquipPanel').hidden=base;$('v83BaseQuick').hidden=!base;$('v83EquipmentQuick').hidden=base;try{localStorage.setItem('hw-v83-workspace',workspace);}catch(e){}fire('workspace');}
function renderAll(){renderRoutes();renderIcons();renderPreview();renderList();renderTypeList();syncLayerChecks();updateFooter();fire('data');}
function notify(msg){const el=$('toast');el.textContent=msg;el.style.display='block';clearTimeout(notify.t);notify.t=setTimeout(()=>{el.style.display='none';},2700);}
function svgPoint(e){const ctm=map.getScreenCTM();if(!ctm)return{x:0,y:0};const v=map.createSVGPoint();v.x=e.clientX;v.y=e.clientY;return v.matrixTransform(ctm.inverse());}
function clientDistance(a,b){
 const m=map.getScreenCTM();if(!m)return Infinity;
 const p=map.createSVGPoint();p.x=a.x;p.y=a.y;const v=p.matrixTransform(m);p.x=b.x;p.y=b.y;const w=p.matrixTransform(m);
 return Math.hypot(v.x-w.x,v.y-w.y);
}
function smartSnap(pt,group,includeRoutes=true){
 let device=null,distance=19;
 for(const d of data.devices){if(!groupVisible(byType[d.type]?.group||'equipment'))continue;
  const dd=clientDistance(pt,d);if(dd<distance){device=d;distance=dd;}}
 if(device)return{kind:'device',x:device.x,y:device.y,deviceId:device.id,name:device.name,distance};
 if(!includeRoutes)return null;
 let candidate=null;distance=15;
 for(const r of data.routes){if(r.group!==group||!groupVisible(r.group))continue;
  for(let i=0;i<r.points.length-1;i++){
   const a=routePoint(r.points[i]),b=routePoint(r.points[i+1]);
   const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;if(length<.00001)continue;
   const t=Math.min(1,Math.max(0,((pt.x-a.x)*dx+(pt.y-a.y)*dy)/length));
   if(t<=.035||t>=.965)continue;
   const snapped={x:roundPos(a.x+t*dx),y:roundPos(a.y+t*dy)};
   const dd=clientDistance(pt,snapped);
   if(dd<distance){distance=dd;candidate={kind:'junction',...snapped,routeId:r.id,segment:i,distance,name:r.name};}
  }
 }
 return candidate;
}
function splitAtJunction(candidate){
 const r=data.routes.find(x=>x.id===candidate.routeId);
 if(!r||r.points.length<2||r.group!==actionType)return null;
 const junctionType={water:'waterJunction',electric:'electricJunction',feed:'feedJunction'}[r.group];if(!junctionType)return null;
 // Split into genuine graph edges; never silently mark the new electrical connection verified.
 const device={id:newId('d'),type:junctionType,x:candidate.x,y:candidate.y,name:groups[r.group].name+'分支點',zone:'',status:'planned',rotation:0,note:'V9.8 建立的線路分支點；須現場核對',waterSources:[],fields:[],locked:false,showLabel:false,photos:[],terminals:[]};
 const fromId=r.fromDeviceId||r.points[0]?.deviceId||'',toId=r.toDeviceId||r.points.at(-1)?.deviceId||'';
 const i=candidate.segment,joined={x:device.x,y:device.y,deviceId:device.id};
 const first=r.points.slice(0,i+1).map(q=>({...q})),second=r.points.slice(i+1).map(q=>({...q}));
 if(!first.length||!second.length)return null;
 first.push({...joined});second.unshift({...joined});
 const part={...clone(r),id:newId('r'),name:(r.name||groups[r.group].name+'線路')+' · 下游支段',points:second,fromDeviceId:device.id,toDeviceId:toId,fromTerminalId:'',toTerminalId:r.toTerminalId||'',confirmed:false};
 r.points=first;r.fromDeviceId=fromId;r.toDeviceId=device.id;r.toTerminalId='';r.confirmed=false;
 data.devices.push(device);data.routes.push(part);save();renderAll();
 notify('已建立分支接點並將舊管線分段，3 條相關路徑須重新現場核對');
 return device;
}
function nearest(pt){return smartSnap(pt,actionType,false)?.deviceId?data.devices.find(d=>d.id===smartSnap(pt,actionType,false).deviceId):null;}
function addRoutePoint(e,explicitId){
 if(currentRole!=='admin'||action!=='route')return;
 const p=svgPoint(e);let device=explicitId?data.devices.find(x=>x.id===explicitId):null;
 const suggestion=device?{kind:'device',deviceId:device.id,x:device.x,y:device.y,name:device.name}:smartSnap(p,actionType,true);
 if(!device&&suggestion?.kind==='device')device=data.devices.find(x=>x.id===suggestion.deviceId);
 if(!device&&suggestion?.kind==='junction'){
  const yes=confirm('要在「'+suggestion.name+'」建立分支接點嗎？\n\n原管線將拆為上游、下游兩段，並標記為待現場核對。\n此動作可以按復原還原。');
  if(!yes)return;
  device=splitAtJunction(suggestion);
 }
 let q={x:roundPos(p.x),y:roundPos(p.y)};
 if(orthogonal&&drawing.length&&!device){const a=routePoint(drawing[drawing.length-1]);if(Math.abs(q.x-a.x)>Math.abs(q.y-a.y))q.y=a.y;else q.x=a.x;}
 const point=device?{x:device.x,y:device.y,deviceId:device.id}:q;
 const previous=drawing.at(-1);
 if(previous&&Math.hypot(previous.x-point.x,previous.y-point.y)<.0001)return;
 drawing.push(point);renderPreview();$('eqRoutePoints').textContent=drawing.length+' 個節點';$('eqFinishRoute').disabled=drawing.length<2;
 notify(device?'已吸附：'+device.name:'已增加路徑節點 '+drawing.length);
 fire('action');
 if(drawing.length>=2&&drawing[0]?.deviceId&&point.deviceId&&drawing[0].deviceId!==point.deviceId){
  $('eqFinishRoute').click();notify('已連接起訖設備並儲存線路；連接狀態待現場核對');
 }
}
function cancelAction(){action=null;actionType='';drawing=[];segmentHover=null;$('eqPlaceTip').hidden=true;$('eqAddDevice').classList.remove('active');$('eqStartRoute').classList.remove('active');$('eqFinishRoute').disabled=true;$('eqRoutePoints').textContent='0 個節點';renderPreview();fire('action');}
function roleSet(role){currentRole=role==='admin'?'admin':'staff';document.querySelectorAll('.role-switch').forEach(el=>{const on=el.dataset.role===currentRole;el.classList.toggle('is-active',on);el.setAttribute('aria-pressed',String(on));});$('eqAdmin').hidden=currentRole!=='admin';$('eqRoleNote').textContent=currentRole==='admin'?'管理者本機編輯：可增修圖上設備；這不是帳號驗證，發佈仍須 GitHub 權限。':'員工檢視：可勾選所有圖層、查看設備資料，不可透過此畫面增修。';if(currentRole!=='admin'){cancelAction();multiSelectMode=false;selectedIds.clear();}editorOpened=false;showInspector();updateFooter();fire('role');}
function syncLayerChecks(){document.querySelectorAll('[data-eq-toggle]').forEach(el=>{el.checked=!!visibility[el.dataset.eqToggle];});}
function renderList(){const ul=$('eqList');ul.replaceChildren();const q=$('eqSearch').value.trim().toLowerCase();const entries=[];data.devices.forEach(d=>{const t=byType[d.type];if([d.name,d.zone,d.note,t.label].join(' ').toLowerCase().includes(q))entries.push({kind:'device',id:d.id,label:d.name,info:t.label+(d.zone?' · '+d.zone:''),color:groups[t.group].color,symbol:t.symbol});});data.routes.forEach(r=>{if([r.name,r.note,groups[r.group].name].join(' ').toLowerCase().includes(q))entries.push({kind:'route',id:r.id,label:r.name,info:groups[r.group].name+' · '+r.points.length+' 個節點',color:groups[r.group].color,symbol:'線'});});if(!entries.length){const el=document.createElement('div');el.className='v82-empty';el.textContent=data.devices.length?'找不到符合的設備／線路':'目前尚未放置設備。管理者可先選擇設備類型，再點擊底圖定位。';ul.appendChild(el);return;}
 if(entries.length>100){const tip=document.createElement('div');tip.className='v115-more';tip.textContent=`共 ${entries.length} 筆符合資料，先顯示前 100 筆；請繼續輸入關鍵字縮小範圍。`;ul.appendChild(tip);}
 for(const item of entries.slice(0,100)){const b=document.createElement('button');b.type='button';b.className='equipment-list-item'+(selected?.id===item.id?' active':'');const icon=document.createElement('span');icon.className='itemicon';icon.style.background=item.color;icon.textContent=item.symbol;const contents=document.createElement('span');contents.style.minWidth='0';contents.textContent=item.label;const sub=document.createElement('span');sub.className='minor';sub.textContent=item.info;contents.appendChild(sub);b.append(icon,contents);b.addEventListener('click',()=>{select(item.kind,item.id);const d=item.kind==='device'?data.devices.find(x=>x.id===item.id):null;if(d)focus(d.x,d.y);if(matchMedia('(max-width:760px), (max-width:1024px) and (pointer:coarse)').matches)$('side').classList.remove('open');fire('action');});ul.appendChild(b);}
}
function focus(x,y){const vb=map.viewBox.baseVal;const w=vb.width,h=vb.height;map.setAttribute('viewBox',[x-w/2,y-h/2,w,h].join(' '));}
// V10.3: choosing an existing device does not reconstruct hundreds of SVG markers.
// Only the old/new visual selection and its nameplate are updated; data mutations
// still use renderAll() so changed positions and routes always redraw accurately.
function fastSelectDevice(id,previous){
 const d=data.devices.find(x=>x.id===id);if(!d||!groupVisible(byType[d.type]?.group||'equipment'))return false;
 const target=v115IconById.get(id);if(!target)return false;
 // SVG paint order is DOM order: raise the currently selected marker above all other markers.
 if(target.parentNode===icons&&icons.lastElementChild!==target)icons.appendChild(target);
 const previousEl=previous?.kind==='device'?v115IconById.get(previous.id):null;
 if(previousEl&&previousEl!==target){previousEl.classList.remove('is-selected');previousEl.querySelectorAll('.v88-selection-halo,.v88-nameplate').forEach(n=>n.remove());}
 for(const g of [target]){
  const isActive=true;g.classList.toggle('is-selected',isActive);
  g.querySelectorAll('.v88-selection-halo').forEach(n=>n.remove());
  if(deviceLabelMode==='smart')g.querySelectorAll('.v88-nameplate').forEach(n=>n.remove());
  if(!isActive)continue;
  const t=byType[d.type]||builtins.other,size=(d.size||t.size||100)/100;
  const sizeX=size*iconAxis(d,'widthScale'),sizeY=size*iconAxis(d,'heightScale');
  const halo=node('ellipse',{rx:(1.21*sizeX).toFixed(3),ry:(1.21*sizeY).toFixed(3),transform:`rotate(${d.rotation||0})`,fill:'none',stroke:'#a8f5e0','stroke-width':'.10','stroke-dasharray':'.18 .11',class:'v88-selection-halo'});
  const rotate=[...g.children].find(el=>el.tagName.toLowerCase()==='g'&&el.hasAttribute('transform'));
  if(rotate)g.insertBefore(halo,rotate);else g.appendChild(halo);
  if(deviceLabelMode==='smart'&&visibility.labels&&d.showLabel!==false){
   const full=String(d.name||t.label),label=Array.from(full).slice(0,14).join('')+(Array.from(full).length>14?'…':'');
   const width=Math.max(.9,Array.from(label).reduce((v,ch)=>v+(/[\x00-\x7f]/.test(ch)?.35:.59),0)+.45);
   const platePos=nameplateLocation(d,sizeX,sizeY,width);
   const plate=node('g',{class:'v88-nameplate','pointer-events':'none',transform:`translate(${platePos.x.toFixed(3)} ${platePos.y.toFixed(3)})`});
   plate.appendChild(node('rect',{x:(-width/2).toFixed(3),y:'-.35',width:width.toFixed(3),height:'.68',rx:'.19',fill:'#0c2838',stroke:'#426477','stroke-width':'.047'}));
   plate.appendChild(node('text',{x:'0',y:'.12','text-anchor':'middle','font-size':'.54',fill:'#e6f7fb','font-weight':'600'},label));g.appendChild(plate);
  }
 }
 if(previous?.kind==='route')renderRoutes();
 renderList();updateFooter();fire('data');
 return true;
}
function select(kind,id){const previous=selected;if(!multiSelectMode)selectedIds.clear();selected={kind,id};showInspector();
 if(kind==='device'&&!multiSelectMode&&fastSelectDevice(id,previous))return;
 renderAll();}
function showInspector(){const device=selected?.kind==='device'?data.devices.find(d=>d.id===selected.id):null;const route=selected?.kind==='route'?data.routes.find(r=>r.id===selected.id):null;
 if(!device&&!route)selected=null;const details=$('eqDetails');details.hidden=!device&&!route;
 if(device){const t=byType[device.type];$('eqDetailTitle').textContent=device.name;$('eqDetailMeta').textContent=groups[t.group].name+' · '+t.label+' · '+({planned:'規劃中',installed:'已安裝',maintenance:'維修中'}[device.status]);$('eqDetailText').textContent=(device.zone?'區域：'+device.zone+'\n':'')+(device.note?'說明：'+device.note+'\n':'')+(device.fields?.length?'規格：\n'+device.fields.map(f=>'・'+f.key+'：'+f.value).join('\n')+'\n':'')+(device.type==='threeWay'?'水源：'+(device.waterSources.map(x=>({tower:'水塔',groundwater:'地下水',tap:'自來水'}[x])).join('＋')||'待設定')+'\n':'')+(device.arrayBatchId?'原陣列：第 '+device.arrayIndex+'/'+device.arrayTotal+' 台\n':'')+'圖面座標：'+device.x.toFixed(2)+'，'+device.y.toFixed(2);}
 else if(route){$('eqDetailTitle').textContent=route.name;$('eqDetailMeta').textContent=groups[route.group].name+'線路 · '+route.points.length+' 個路徑節點';$('eqDetailText').textContent=route.note||'尚未填寫線路說明';}
 $('eqOpenEditor').hidden=!(currentRole==='admin'&&device);$('eqEditor').hidden=!(currentRole==='admin'&&device);$('eqRouteEditor').hidden=!(currentRole==='admin'&&route);
 if(currentRole==='admin'&&device)fillEditor();if(currentRole==='admin'&&route){$('eqRouteName').value=route.name;$('eqRouteNote').value=route.note;}fire('selection');
}
function fillEditor(){const d=selected?.kind==='device'?data.devices.find(x=>x.id===selected.id):null;if(!d)return;$('eqChangeType').value=d.type;$('eqName').value=d.name;$('eqZone').value=d.zone;$('eqNote').value=d.note;$('eqStatusSelect').value=d.status;$('eqRotation').value=d.rotation;$('eqX').value=d.x.toFixed(4);$('eqY').value=d.y.toFixed(4);$('eqWaterSources').hidden=d.type!=='threeWay';$('eqSourceTower').checked=d.waterSources.includes('tower');$('eqSourceGround').checked=d.waterSources.includes('groundwater');$('eqSourceTap').checked=d.waterSources.includes('tap');$('eqDeviceFields').replaceChildren();(d.fields||[]).forEach(f=>addFieldRow(f.key,f.value));$('eqIconShape').value=d.shape||byType[d.type].shape||'circle';$('eqIconColor').value=d.color||byType[d.type].color||groups[byType[d.type].group].color;$('eqIconSize').value=d.size||byType[d.type].size||100;$('eqIconWidth').value=validAxis(d.widthScale);$('eqIconHeight').value=validAxis(d.heightScale);const seg=validSegment(d.segment),arr=validArray(d.array);if($('hwSegmentMode')){$('hwSegmentMode').value=seg?'bar':'icon';$('hwSegmentLength').value=seg?.length??6;$('hwSegmentThickness').value=seg?.thickness??.65;$('hwSegmentPattern').value=seg?.pattern||'auto';$('hwSegmentCap').value=seg?.cap||'round';$('hwSegmentLabel').value=seg?.labelPosition||'bottom';$('hwSegmentGlyph').checked=!!seg?.centerGlyph;const box=$('hwSegmentParams');if(box)box.hidden=!seg;const mode=$('hwSegmentBox');if(mode)mode.hidden=!SEGMENT_TYPES.has(d.type);}if($('hwArrayBox')){$('hwArrayBox').hidden=!ARRAY_TYPES.has(d.type);$('hwArrayMode').value=arr?'array':'icon';$('hwArrayParams').hidden=!arr;$('hwArrayCount').value=arr?.count||3;$('hwArraySpacing').value=arr?.spacing||2.3;$('hwArrayLabel').value=arr?.labelPosition||'bottom';const splitCount=$('hwSplitCount');if(splitCount)splitCount.textContent=arr?'目前 '+arr.count+' 台':'尚未建立陣列';}syncSegmentSizeFields();$('eqIconLocked').checked=!!d.locked;$('eqIconLabel').checked=d.showLabel!==false;}
function syncSegmentSizeFields(){
 const isSegment=$('hwSegmentMode')?.value==='bar';
 const axisRow=$('eqIconWidth')?.closest('.v11103-size-grid');
 const overall=$('eqIconSize')?.closest('label');
 if(axisRow)axisRow.style.display=isSegment?'none':'';
 if(overall)overall.style.display=isSegment?'none':'';
}
function setData(raw,source,store=false){if(raw&&Array.isArray(raw.photoAssets))window.HWPhotoStore?.ingest(raw.photoAssets).catch(err=>notify('照片資料匯入失敗：'+err.message));data=sanitize(raw);rebuildTypes();updateCatalogue();loadSource=source;selected=null;selectedIds.clear();multiSelectMode=false;cancelAction();history=[];historyIndex=-1; if(store)save();else snapshot();renderAll();showInspector();}
function downloadable(filename,obj){const blob=new Blob([JSON.stringify(obj,null,2)+'\n'],{type:'application/json;charset=utf-8'});const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function addNew(type,p,segmentSpec=null,arraySpec=null){const t=byType[type];if(!t)return;
 const preset=activeTemplate&&data.templates.find(x=>x.id===activeTemplate&&x.type===type);
 const d={id:newId('d'),type,x:snapPos(p.x),y:snapPos(p.y),name:preset?.name||t.label,zone:'',status:'planned',rotation:0,note:preset?.note||t.defaultNote||'',waterSources:type==='threeWay'?[...(preset?.waterSources||placementSources)]:[],valveSelection:'unknown',fields:clone(preset?.fields||t.defaultFields||[]),shape:preset?.shape||null,color:preset?.color||null,size:preset?.size||null,widthScale:validAxis(preset?.widthScale),heightScale:validAxis(preset?.heightScale),segment:SEGMENT_TYPES.has(type)?validSegment(segmentSpec||preset?.segment):null,array:ARRAY_TYPES.has(type)?validArray(arraySpec||preset?.array):null,locked:false,showLabel:preset?.showLabel!==false};
 if((segmentSpec||arraySpec)&&typeof (segmentSpec||arraySpec).rotation==='number')d.rotation=(segmentSpec||arraySpec).rotation;const spot=(segmentSpec||arraySpec)?{ok:true,x:d.x,y:d.y}:magnetSolve({x:d.x,y:d.y},d);if(!spot.ok){notify('附近圖標過密，請選擇其他位置放置');return;}d.displayX=spot.x;d.displayY=spot.y;window.dispatchEvent(new CustomEvent('hw-v100-magnet',{detail:{...spot,mode:'place',type}}));
 data.devices.push(d);save();const repeated=repeatPlacement&&action!=='segment'&&action!=='array';if(!repeated)cancelAction();select('device',d.id);notify('已放置 '+t.label+(repeated?'，可繼續點圖新增':'，點選可編輯或複製'));}
// V11.10.6: atomically replace a visual array with separately editable physical devices.
// Group's existing photos, terminals, routes and work orders must be reviewed, not guessed.
function arraySplitPreview(){
 const source=selectedDevice(),a=source&&validArray(source.array);
 if(currentRole!=='admin'||!source||!a)return {ok:false,reason:'請先以管理者模式選取一組設備陣列'};
 if(action)return {ok:false,reason:'請先結束正在進行的放置或繪線操作'};
 if(source.locked)return {ok:false,reason:'陣列已鎖定，請先解除鎖定'};
 const links=data.routes.filter(r=>r.fromDeviceId===source.id||r.toDeviceId===source.id||r.points.some(p=>p.deviceId===source.id)).length;
 const jobs=(data.maintenance||[]).filter(m=>m.deviceId===source.id).length;
 if(links||jobs||(source.photos||[]).length||(source.terminals||[]).length)return {ok:false,reason:'這組陣列已有 '+links+' 條管線、'+jobs+' 筆維修、'+(source.photos||[]).length+' 張照片或 '+(source.terminals||[]).length+' 個端子。為避免資料關聯遺失，請先處理群組資料後再拆分。'};
 if(data.devices.length-1+a.count>2000)return {ok:false,reason:'拆分會超過系統 2000 台設備的限制'};
 const theta=(num(source.rotation)||0)*Math.PI/180,c=Math.cos(theta),si=Math.sin(theta);
 const offsetX=iconX(source)-source.x,offsetY=iconY(source)-source.y;
 const other=data.devices.filter(d=>d.id!==source.id);
 const batchId=newId('arraybatch'),staged=[];
 for(let i=0;i<a.count;i++){
  const delta=(i-(a.count-1)/2)*a.spacing;
  const px=roundPos(source.x+delta*c),py=roundPos(source.y+delta*si);
  if(!inMap(px,py))return {ok:false,reason:'第 '+(i+1)+' 台超出 CAD 允許範圍，請先調整陣列位置或間距'};
  const item=clone(source);
  item.id=newId('d');item.name=(source.name+' '+String(i+1).padStart(2,'0')).slice(0,80);
  item.x=px;item.y=py;item.displayX=roundPos(px+offsetX);item.displayY=roundPos(py+offsetY);
  item.array=null;item.segment=null;item.locked=false;item.photos=[];item.terminals=[];item.condition='unchecked';item.lastInspectionAt='';
  item.arrayBatchId=batchId;item.arraySourceId=source.id;item.arrayIndex=i+1;item.arrayTotal=a.count;
  // Place each icon against existing devices AND earlier candidate members, without mutating project.
  const proposed={x:item.displayX,y:item.displayY};
  const snapped=magnetSolve(proposed,item,[...other,...staged]);
  if(!snapped.ok)return {ok:false,reason:'第 '+(i+1)+' 台附近空間不足，請調整數量、間距或周邊圖示後重試'};
  item.displayX=roundPos(snapped.x);item.displayY=roundPos(snapped.y);
  if(!inMap(item.displayX,item.displayY))return {ok:false,reason:'第 '+(i+1)+' 台的顯示位置超出圖面範圍'};
  staged.push(item);
 }
 return {ok:true,count:a.count,sourceId:source.id,sourceName:source.name,spacing:a.spacing,rotation:source.rotation||0,items:staged};
}
function splitArraySelected(){
 const plan=arraySplitPreview();
 if(!plan.ok){notify(plan.reason);return {ok:false,reason:plan.reason};}
 // One undo snapshot; reject if any step failed before changing the data array.
 const old=data.devices.length;
 data.devices=data.devices.filter(d=>d.id!==plan.sourceId).concat(plan.items);
 selected={kind:'device',id:plan.items[0].id};selectedIds.clear();multiSelectMode=false;
 save();renderAll();showInspector();
 notify('已拆分 '+plan.count+' 台獨立設備（原陣列標示已取代）；可復原操作');
 return {ok:true,count:plan.count,batchId:plan.items[0].arrayBatchId,previousCount:old,currentCount:data.devices.length};
}
// V11.10.7: update shared attributes across members of the same split array.
// A batch edit NEVER changes IDs, coordinates, route links, photos, terminals or maintenance.
function arrayBatchPreview(raw={}){
 if(currentRole!=='admin')return {ok:false,reason:'請切換為管理者模式'};
 if(action)return {ok:false,reason:'請先結束放置或繪線操作'};
 const source=selectedDevice();
 if(!source||!source.arrayBatchId)return {ok:false,reason:'請先選取由陣列拆分出來的一台設備'};
 const batch=data.devices.filter(x=>x.arrayBatchId===source.arrayBatchId).sort((a,b)=>(a.arrayIndex||0)-(b.arrayIndex||0));
 if(!batch.length||batch.some(x=>x.type!==source.type))return {ok:false,reason:'群組內有不同設備類型，請逐台確認後再編輯'};
 const indices=batch.map(x=>x.arrayIndex);
 if(new Set(indices).size!==indices.length||indices.some(x=>!Number.isInteger(x)||x<1))return {ok:false,reason:'群組排列序號異常，已停止批次操作以免誤改'};
 const editable=batch.filter(x=>!x.locked),locked=batch.filter(x=>x.locked);
 if(!editable.length)return {ok:false,reason:'同排設備全部已鎖定，沒有可修改的設備'};
 const options=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const changes={},summary=[];
 if(options.setStatus===true){
  if(!['planned','installed','maintenance'].includes(options.status))return {ok:false,reason:'安裝狀態不正確'};
  changes.status=options.status;summary.push('安裝狀態：'+({planned:'規劃中',installed:'已安裝',maintenance:'維修中'}[options.status]));
 }
 if(options.setZone===true){
  if(typeof options.zone!=='string'||options.zone.length>80)return {ok:false,reason:'棟舍／區域名稱不得超過 80 字'};
  changes.zone=options.zone.trim();summary.push('棟舍／區域：'+(changes.zone||'清空'));
 }
 if(options.setNote===true){
  if(typeof options.note!=='string'||options.note.length>900)return {ok:false,reason:'共同備註不得超過 900 字'};
  changes.note=options.note.trim();summary.push('共同備註：'+(changes.note?'以新文字取代':'清空'));
 }
 if(options.setSpecs===true){
  if(!Array.isArray(options.specs)||options.specs.length<1||options.specs.length>12)return {ok:false,reason:'請輸入 1～12 項規格'};
  const names=new Set();changes.specs=[];
  for(const spec of options.specs){
   if(!spec||typeof spec.key!=='string'||typeof spec.value!=='string')return {ok:false,reason:'規格內容格式不正確'};
   const key=spec.key.trim(),value=spec.value.trim();
   if(!key||key.length>40||value.length>220||names.has(key.toLowerCase()))return {ok:false,reason:'規格名稱不可空白、重複或超過長度上限'};
   names.add(key.toLowerCase());changes.specs.push({key,value});
  }
  for(const member of editable){
   const keys=new Set((member.fields||[]).map(f=>f.key.toLowerCase()));
   const newCount=changes.specs.filter(f=>!keys.has(f.key.toLowerCase())).length;
   if((member.fields||[]).length+newCount>30)return {ok:false,reason:'「'+member.name+'」的規格欄位將超過 30 項限制'};
  }
  summary.push('共同規格：'+changes.specs.map(f=>f.key+' = '+(f.value||'（空值）')).join('；'));
 }
 if(!summary.length)return {ok:false,reason:'請至少勾選一項要修改的欄位'};
 return {ok:true,batchId:source.arrayBatchId,sourceId:source.id,type:source.type,total:batch.length,expectedTotal:Math.max(...batch.map(x=>x.arrayTotal||0)),count:editable.length,lockedCount:locked.length,lockedNames:locked.map(x=>x.name),memberIds:editable.map(x=>x.id),memberNames:editable.map(x=>x.name),changes,summary};
}
function applyArrayBatch(raw,expectedIds){
 const plan=arrayBatchPreview(raw);
 if(!plan.ok){notify(plan.reason);return plan;}
 if(!Array.isArray(expectedIds)||JSON.stringify(plan.memberIds)!==JSON.stringify(expectedIds)){
  return {ok:false,reason:'群組選取或鎖定狀態已改變，請重新預覽後再確認'};
 }
 // Validate every new record before mutating real data, then commit in one save/undo step.
 const updated=new Map();
 for(const id of plan.memberIds){
  const existing=data.devices.find(x=>x.id===id),next=clone(existing),c=plan.changes;
  for(const key of ['status','zone','note'])if(Object.prototype.hasOwnProperty.call(c,key))next[key]=c[key];
  if(c.specs){
   const fields=clone(next.fields||[]);
   for(const spec of c.specs){const idx=fields.findIndex(f=>f.key.toLowerCase()===spec.key.toLowerCase());
    if(idx>=0)fields[idx].value=spec.value;else fields.push({...spec});}
   next.fields=fields;
  }
  updated.set(id,next);
 }
 data.devices=data.devices.map(d=>updated.get(d.id)||d);
 const saved=save();renderAll();showInspector();
 notify('已批次更新 '+plan.count+' 台設備'+(plan.lockedCount?'；略過鎖定 '+plan.lockedCount+' 台':'')+(saved?'，已存本機':'，尚未成功存檔，請立即備份'));
 return {ok:true,updated:plan.count,skippedLocked:plan.lockedCount,saved};
}
function selectedDevice(){return selected?.kind==='device'?data.devices.find(x=>x.id===selected.id):null;}
function templateFromDevice(d,name){const meta=byType[d.type]||builtins.other;return{id:newId('template'),name:str(name,50)||d.name,type:d.type,shape:d.shape||meta.shape,color:d.color||meta.color,size:d.size||meta.size||100,widthScale:validAxis(d.widthScale),heightScale:validAxis(d.heightScale),segment:validSegment(d.segment),array:validArray(d.array),showLabel:d.showLabel!==false,note:d.note||'',fields:clone(d.fields||[]),waterSources:clone(d.waterSources||[])};}
function saveSelectedTemplate(name){if(currentRole!=='admin')return false;const d=selectedDevice();if(!d){notify('請先選擇一台設備');return false;}if(data.templates.length>=100){notify('最多可儲存 100 個模板');return false;}data.templates.push(templateFromDevice(d,name));save();notify('已儲存設備模板');return true;}
function applyTemplate(id,scope='selected'){
 if(currentRole!=='admin')return 0;const t=data.templates.find(x=>x.id===id);if(!t)return 0;let targets=[];
 if(scope==='sameType')targets=data.devices.filter(d=>d.type===t.type&&!d.locked);
 else {const d=selectedDevice();if(d&&!d.locked&&d.type===t.type)targets=[d];}
 let applied=0,skipped=0;for(const d of targets){const before=clone(d);d.shape=t.shape;d.color=t.color;d.size=t.size;d.widthScale=validAxis(t.widthScale);d.heightScale=validAxis(t.heightScale);d.segment=validSegment(t.segment);d.array=validArray(t.array);d.showLabel=t.showLabel;
   // Resized templates use the same adaptive edge layout as direct size editing.
   // Never change physical CAD coordinates or move locked neighboring icons.
   if(iconMagnetEnabled&&data.devices.some(other=>other.id!==d.id&&window.HWIconMagnet.collision(visual(d),visual(other),id=>byType[id]))&&!fitIcon(d)){Object.assign(d,before);skipped++;continue;}
   if(scope==='selected'){d.waterSources=[...t.waterSources];d.fields=clone(t.fields);d.note=t.note;}applied++;}
 if(applied){save();renderAll();showInspector();notify('已套用 '+applied+' 台設備'+(skipped?'；'+skipped+' 台因圖標空間不足而保留原樣':'')+'，原位置不變');}else notify(skipped?'目前圖標間距不足，無法套用新大小':'沒有符合的未鎖定同類設備');return applied;
}
function deleteTemplate(id){if(currentRole!=='admin')return false;const n=data.templates.length;data.templates=data.templates.filter(x=>x.id!==id);if(n===data.templates.length)return false;if(activeTemplate===id)activeTemplate=null;save();return true;}

function addArrayPoint(e){
 if(action!=='array'||currentRole!=='admin')return;
 let pt=svgPoint(e);if(!inMap(pt.x,pt.y)){notify('請在 CAD 圖面範圍內放置');return;}
 if(!drawing.length){drawing=[pt];$('eqPlaceTip').textContent='陣列放置｜已設定起點，請點終點（Esc 可取消）';renderPreview();fire('action');return;}
 const start=drawing[0];pt=wallAlignedEnd(start,pt);const distance=Math.hypot(pt.x-start.x,pt.y-start.y);
 if(distance<2.6||distance>45){notify('陣列區段長度需介於 2.6～45 CAD 單位');return;}
 const count=Math.min(20,Math.max(2,Math.round((distance-1.65)/2.3)+1));
 const angle=(Math.atan2(pt.y-start.y,pt.x-start.x)*180/Math.PI+360)%360;
 const spec={enabled:true,count,spacing:Math.max(1.3,Math.min(6,(distance-1.65)/(count-1))),rotation:angle,labelPosition:'bottom'};
 const center={x:(start.x+pt.x)/2,y:(start.y+pt.y)/2},type=actionType;
 cancelAction();addNew(type,center,null,spec);
 notify('陣列是一組配置標示；如每台需獨立維修檔案，請逐台建立設備');
}
function addSegmentPoint(e){
 if(action!=='segment'||currentRole!=='admin')return;
 let pt=svgPoint(e);
 if(!inMap(pt.x,pt.y)){notify('區段端點需在 CAD 圖面內');return;}
 if(!drawing.length){drawing=[{x:pt.x,y:pt.y}];$('eqPlaceTip').textContent='區段放置｜已設定起點，請沿牆面點選終點（Esc 取消）';renderPreview();fire('action');return;}
 const start=drawing[0];pt=wallAlignedEnd(start,pt);
 const len=Math.hypot(pt.x-start.x,pt.y-start.y);
 if(len<.6){notify('區段長度至少 0.6 CAD 單位');return;}
 if(len>45){notify('區段長度最多 45 CAD 單位，請縮短範圍');return;}
 const midpoint={x:(start.x+pt.x)/2,y:(start.y+pt.y)/2};
 const rotation=(Math.atan2(pt.y-start.y,pt.x-start.x)*180/Math.PI+360)%360;
 const type=actionType, seg={enabled:true,length:len,thickness:type==='curtain'?.65:.52,pattern:'auto',cap:'flat',labelPosition:'bottom',centerGlyph:false,rotation};
 // Creation uses a single existing equipment record, not an extra electrical/feed route.
 cancelAction();addNew(type,midpoint,seg);
}
const walls=()=>{
 const result=[];
 for(const path of map.querySelectorAll('.cad-layer[data-category="wall"] path,.cad-layer[data-category="partition"] path')){
  const d=path.getAttribute('d')||'';
  const matches=[...d.matchAll(/([ML])\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/ig)];
  let prev=null;
  for(const m of matches){const pt={x:Number(m[2]),y:Number(m[3])};if(prev&&m[1].toUpperCase()==='L'){result.push([prev,pt]);}prev=pt;}
 }
 return result;
};
let cachedWalls=null;
function wallAlignedEnd(start,end){
 if(!$('hwWallSnap')?.checked)return end;
 if(!cachedWalls)cachedWalls=walls();
 const desired=Math.atan2(end.y-start.y,end.x-start.x),L=Math.hypot(end.x-start.x,end.y-start.y);
 let best=null;
 for(const [a,b] of cachedWalls){const wx=b.x-a.x,wy=b.y-a.y,wl=Math.hypot(wx,wy);if(wl<.4)continue;
  const nx=wx/wl,ny=wy/wl,ang=Math.atan2(wy,wx);
  const delta=Math.acos(Math.min(1,Math.max(-1,Math.abs(Math.cos(desired-ang)))));
  if(delta>Math.PI/12)continue;
  const dist=Math.abs((start.x-a.x)*ny-(start.y-a.y)*nx);
  if(dist>1.8)continue;
  const score=dist+delta*2;
  if(!best||score<best.score)best={score,nx,ny};
 }
 if(!best)return end;
 const sign=(end.x-start.x)*best.nx+(end.y-start.y)*best.ny>=0?1:-1;
 return {x:start.x+best.nx*L*sign,y:start.y+best.ny*L*sign};
}
function begin(type,mode){if(currentRole!=='admin')return;if(mode==='array'&&!ARRAY_TYPES.has(type)){notify('此設備不支援陣列標示');return;}if(mode==='segment'&&!SEGMENT_TYPES.has(type)){notify('這個設備不支援區段標示');return;}if(mode==='route'&&!['water','electric','feed','ventilation'].includes(type)){cancelAction();notify('請選擇水管、電線、飼料管或通風氣流示意線；通風線不代表供電電線');return;}cancelAction();if(multiSelectMode){multiSelectMode=false;selectedIds.clear();fire('selection');}action=mode;actionType=type;if(mode==='place'&&activeTemplate&&data.templates.find(x=>x.id===activeTemplate)?.type!==type)activeTemplate=null;if(mode==='array'){$('eqPlaceTip').textContent='陣列放置｜點選起點，再點選終點；會建立一組可編輯數量與間距的標示';}else if(mode==='segment'){$('eqPlaceTip').textContent='區段放置｜在 CAD 上點選起點，再點選終點；Esc 可取消';$('eqPlaceTip').hidden=false;}else if(mode==='place'){$('eqPlaceTip').textContent='定位中｜在 CAD 底圖點一下放置 '+byType[type].label+'（按取消可結束）';$('eqAddDevice').classList.add('active');}else if(mode==='route'){$('eqPlaceTip').textContent='畫線中｜依序點選路徑，點擊設備可連接端點；最後按「完成線路」。';$('eqStartRoute').classList.add('active');}$('eqPlaceTip').hidden=false;if(matchMedia('(max-width:760px), (max-width:1024px) and (pointer:coarse)').matches)$('side').classList.remove('open');fire('action');}
function setup(){
 updateCatalogue();document.querySelectorAll('.v83-tab').forEach(btn=>btn.addEventListener('click',()=>setWorkspace(btn.dataset.workspace)));
 let ws='base';try{ws=localStorage.getItem('hw-v83-workspace')||'base';}catch(e){}setWorkspace(ws);
 // Dedicated quick visibility toggles and sidebar toggles share the same state.
 document.querySelectorAll('[data-eq-toggle]').forEach(el=>el.addEventListener('change',()=>{visibility[el.dataset.eqToggle]=el.checked;saveVisibility();renderAll();}));
 document.querySelectorAll('.role-switch').forEach(el=>el.addEventListener('click',()=>roleSet(el.dataset.role)));
 $('eqSaveType').addEventListener('click',()=>{if(currentRole!=='admin')return;const label=str($('eqCustomLabel').value,36);if(!label){notify('請先填寫設備種類名稱');return;}const group=$('eqCustomGroup').value,symbol=str($('eqCustomSymbol').value,4)||'設',shape=validShape($('eqCustomShape').value),color=validColor($('eqCustomColor').value,groups[group].color),size=validSize($('eqCustomSize').value),defaultNote=str($('eqCustomNote').value,400),defaultFields=fieldsFromText($('eqCustomFields').value),graphic=$('eqCustomGraphic').value||'text';if(!groups[group])return;const duplicate=[...catalogue,...data.customTypes].some(t=>t.label===label&&t.type!==editingTypeId);if(duplicate){notify('已有相同名稱的設備種類');return;}
 if(editingTypeId){const t=data.customTypes.find(x=>x.type===editingTypeId);if(!t){resetTypeForm();return;}Object.assign(t,{label,group,symbol,shape,color,size,graphic,defaultNote,defaultFields});}
 else{if(data.customTypes.length>=150){notify('自訂設備種類最多 150 個');return;}data.customTypes.push({type:newId('custom'),label,group,symbol,shape,color,size,graphic,defaultNote,defaultFields});}
 resetTypeForm();rebuildTypes();updateCatalogue();save();renderAll();notify('設備種類已儲存，可在放置設備選單選取');});
 $('eqResetType').addEventListener('click',resetTypeForm);
 $('eqAddField').addEventListener('click',()=>addFieldRow());
 $('eqOpenEditor').addEventListener('click',()=>{if(currentRole!=='admin')return;setWorkspace('equipment');editorOpened=true;fire('editorOpen');});
 
 $('eqAddDevice').addEventListener('click',()=>{if(action==='place')cancelAction();else {const type=$('eqType').value;if(window.HWEquipmentGuide)window.HWEquipmentGuide.request(type,()=>begin(type,'place'));else begin(type,'place');}});
 $('eqStartRoute').addEventListener('click',()=>{if(action==='route')cancelAction();else begin($('eqRouteType').value,'route');});
 $('eqFinishRoute').addEventListener('click',()=>{if(action!=='route'||drawing.length<2)return;const type=actionType;data.routes.push({id:newId('r'),group:type,name:groups[type].name+'線路',note:'',points:clone(drawing),fromDeviceId:drawing[0]?.deviceId||'',toDeviceId:drawing[drawing.length-1]?.deviceId||'',fromTerminalId:'',toTerminalId:'',circuitName:'',purpose:'',cableSpec:'',feedSpec:'',feedMode:'auger',waterSource:'unknown',flowDirection:'unknown',pipeDiameter:'',pipeMaterial:'',confirmed:false});save();const r=data.routes[data.routes.length-1];cancelAction();select('route',r.id);notify('已新增線路，可在編輯區填寫名稱與說明');});
 $('eqCancelMode').addEventListener('click',cancelAction);
 let v115SearchTimer=0;$('eqSearch').addEventListener('input',()=>{clearTimeout(v115SearchTimer);v115SearchTimer=setTimeout(renderList,120);});
 $('eqCloseDetail').addEventListener('click',()=>{selectedIds.clear();selected=null;editorOpened=false;fire('editorClose');showInspector();renderAll();});
 $('hwArrayMode')?.addEventListener('change',()=>{$('hwArrayParams').hidden=$('hwArrayMode').value!=='array';});
 $('hwSegmentMode')?.addEventListener('change',()=>{$('hwSegmentParams').hidden=$('hwSegmentMode').value!=='bar';syncSegmentSizeFields();});
 $('eqChangeType')?.addEventListener('change',()=>{if($('hwSegmentBox'))$('hwSegmentBox').hidden=!SEGMENT_TYPES.has($('eqChangeType').value);if($('hwArrayBox'))$('hwArrayBox').hidden=!ARRAY_TYPES.has($('eqChangeType').value);});
 $('eqSaveDevice').addEventListener('click',()=>{const d=data.devices.find(x=>x.id===selected?.id);if(!d||currentRole!=='admin')return;const before=clone(d);d.type=byType[$('eqChangeType').value]?.type||d.type;d.name=str($('eqName').value,80)||byType[d.type].label;d.zone=str($('eqZone').value,80);d.note=str($('eqNote').value,900);d.status=$('eqStatusSelect').value;d.rotation=num($('eqRotation').value);const realX=num($('eqX').value,d.x),realY=num($('eqY').value,d.y);const oldDx=iconX(d)-d.x,oldDy=iconY(d)-d.y;d.x=realX;d.y=realY;d.displayX=roundPos(realX+oldDx);d.displayY=roundPos(realY+oldDy);d.waterSources=['tower','groundwater','tap'].filter(x=>$({tower:'eqSourceTower',groundwater:'eqSourceGround',tap:'eqSourceTap'}[x]).checked);d.fields=editorFields();d.shape=$('eqIconShape').value||null;d.color=$('eqIconColor').value||null;d.size=validSize($('eqIconSize').value);d.widthScale=validAxis($('eqIconWidth').value);d.heightScale=validAxis($('eqIconHeight').value);d.segment=SEGMENT_TYPES.has(d.type)&&$('hwSegmentMode')?.value==='bar'?validSegment({enabled:true,length:$('hwSegmentLength').value,thickness:$('hwSegmentThickness').value,pattern:$('hwSegmentPattern').value,cap:$('hwSegmentCap').value,labelPosition:$('hwSegmentLabel').value,centerGlyph:$('hwSegmentGlyph').checked}):null;d.array=ARRAY_TYPES.has(d.type)&&$('hwArrayMode')?.value==='array'?validArray({enabled:true,count:$('hwArrayCount').value,spacing:$('hwArraySpacing').value,labelPosition:$('hwArrayLabel').value}):null;d.locked=$('eqIconLocked').checked;d.showLabel=$('eqIconLabel').checked;
 const actualMoved=changedPhysical(before,d);
 if((actualMoved||changedGeometry(before,d))&&!fitIcon(d)){Object.assign(d,before);notify('圖標位置空間不足，請調整大小或座標');return;}
 const waterConfigChanged=JSON.stringify(before.waterSources||[])!==JSON.stringify(d.waterSources||[]);
 const linesToReview=(actualMoved||waterConfigChanged)?requireRouteRecheck(d.id,actualMoved?'設備實際位置已改變':'三向閥可接入的水源已改變'):0;
 save();renderAll();select('device',d.id);editorOpened=false;fire('editorClose');notify('設備資料已儲存於本機'+(linesToReview?'，'+linesToReview+' 條相關線路待重新核對':''));});
 $('eqRemoveDevice').addEventListener('click',()=>{
 const d=data.devices.find(x=>x.id===selected?.id);if(!d||currentRole!=='admin')return;
 const related=data.routes.filter(r=>r.fromDeviceId===d.id||r.toDeviceId===d.id||r.points.some(p=>p.deviceId===d.id));
 const count=related.length;const msg='確定刪除「'+d.name+'」？\n\n'+(count?'將影響 '+count+' 條水管／電線／飼料管。線條位置保留，但來源或去向改為待指定，核對狀態清除。':'目前沒有連接管線。')+'\n刪除後可以按「復原」。';
 if(!confirm(msg))return;
 for(const r of related){
  for(const p of r.points){if(p.deviceId===d.id){p.x=d.x;p.y=d.y;delete p.deviceId;}}
  if(r.fromDeviceId===d.id){r.fromDeviceId='';r.fromTerminalId='';}
  if(r.toDeviceId===d.id){r.toDeviceId='';r.toTerminalId='';}
  r.confirmed=false;
  r.note=[r.note,'V9.8：連接設備已移除，需重新核對來源／去向。'].filter(Boolean).join(' | ').slice(0,900);
 }
 data.devices=data.devices.filter(x=>x.id!==d.id);selected=null;save();renderAll();showInspector();notify('設備已刪除；'+count+' 條關聯線路改為待核對');
 });
 $('eqSaveRoute').addEventListener('click',()=>{const r=data.routes.find(x=>x.id===selected?.id);if(!r||currentRole!=='admin')return;r.name=str($('eqRouteName').value,80)||groups[r.group].name+'線路';r.note=str($('eqRouteNote').value,900);save();select('route',r.id);notify('線路資料已儲存');});
 $('eqRemoveRoute').addEventListener('click',()=>{const r=data.routes.find(x=>x.id===selected?.id);if(!r||currentRole!=='admin')return;if(!confirm('確認刪除線路「'+r.name+'」？'))return;data.routes=data.routes.filter(x=>x.id!==r.id);selected=null;save();renderAll();showInspector();});
 $('eqExport').addEventListener('click',async()=>{try{const payload=window.HWPhotoStore?await window.HWPhotoStore.withAssets(clone(data)):clone(data);downloadable('equipment-private-backup.json',payload);notify('已匯出私人完整備份，請勿公開發布含設備照片的檔案');}catch(err){notify('備份失敗：'+err.message);}});
 $('eqImport').addEventListener('click',()=>$('eqImportFile').click());
 $('eqImportFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>80*1024*1024)throw Error('備份大於 80 MB，請分批整理照片');const loaded=JSON.parse(await file.text());
 if(Array.isArray(loaded.photoAssets)||loaded.devices?.some(d=>d.photos?.length)){
   if(!Array.isArray(loaded.photoAssets))throw Error('檔案含照片標記但沒有照片原檔；請匯入完整私人備份');
   await window.HWSecureTransfer?.verifyPhotoManifest(loaded);
   await importPrivateProject(loaded,'已匯入完整私人 JSON 備份');
 }else setData(loaded,'匯入的本機專案',true);
 notify('已載入 '+data.devices.length+' 個設備、'+data.routes.length+' 條線路');}catch(err){notify('匯入失敗：'+err.message);}finally{e.target.value='';}});
 $('eqRestorePublished').addEventListener('click',async()=>{if(currentRole!=='admin')return;if(!confirm('將以 GitHub 發布的設備資料覆蓋本機編輯內容，確定嗎？'))return;try{const r=await fetch('./equipment-data.json?refresh='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('找不到發布檔');setData(await r.json(),'網站已發布版本',true);notify('已還原網站版本');}catch(err){notify('無法還原：'+err.message);}});
 $('eqClear').addEventListener('click',()=>{if(currentRole!=='admin'||!confirm('確定清除本機全部設備與管線？請先匯出備份。'))return;setData(clone(initial),'空白本機專案',true);notify('本機設備圖層已清空，CAD 底圖未更動');});
 $('eqSaveVisibility').addEventListener('click',()=>notify('設備圖層的勾選狀態已自動保存在本機'));
 canvas.addEventListener('pointerdown',e=>{if(!action)return;pointerDown={x:e.clientX,y:e.clientY};e.stopImmediatePropagation();},true);
 map.addEventListener('pointermove',e=>{if((action==='segment'||action==='array')&&drawing.length){segmentHover=wallAlignedEnd(drawing[0],svgPoint(e));renderPreview();}},{passive:true});
 map.addEventListener('click',e=>{if(currentRole!=='admin'||!action)return;const down=pointerDown;pointerDown=null;if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>9)return;e.stopImmediatePropagation();e.preventDefault();if(action==='place')addNew(actionType,svgPoint(e));else if(action==='route')addRoutePoint(e);else if(action==='segment')addSegmentPoint(e);else if(action==='array')addArrayPoint(e);},true);
 document.addEventListener('keydown',e=>{if(currentRole==='admin'&&workspace==='equipment'&&!action&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)&&!e.ctrlKey&&!e.metaKey&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){const unit=e.shiftKey?1:.1;const d={ArrowLeft:[-unit,0],ArrowRight:[unit,0],ArrowUp:[0,-unit],ArrowDown:[0,unit]}[e.key];if(getSelectionIds().length){e.preventDefault();moveSelected(...d);}}if(e.key==='Escape'){cancelAction();if(multiSelectMode){selectedIds.clear();renderIcons();fire('selection');}editorOpened=false;fire('editorClose');}if((e.ctrlKey||e.metaKey)&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){if(e.key.toLowerCase()==='z'){e.preventDefault();timeTravel(e.shiftKey?1:-1);}else if(e.key.toLowerCase()==='y'){e.preventDefault();timeTravel(1);}}});
 roleSet('staff');loadVisibility();renderAll();
 // Device-specific local edits override the JSON published with the website.
 let local=null,fromV82=false,migrating=false;
 try{local=localStorage.getItem('hw-v94-project');if(!local){local=localStorage.getItem('hw-v93-project');migrating=!!local;}if(!local){local=localStorage.getItem('hw-v92-project');migrating=!!local;}if(!local){local=localStorage.getItem('hw-v91-project')||localStorage.getItem('hw-v90-project')||localStorage.getItem('hw-v89-project')||localStorage.getItem('hw-v88-project');migrating=!!local;}if(!local){local=localStorage.getItem('hw-v87-project')||localStorage.getItem('hw-v86-project')||localStorage.getItem('hw-v85-project')||localStorage.getItem('hw-v84-project')||localStorage.getItem('hw-v83-project');migrating=!!local;}if(!local){local=localStorage.getItem('hw-v82-project');fromV82=!!local;migrating=fromV82;}}catch(e){}
 if(local){try{setData(JSON.parse(local),fromV82?'已沿用 V8.2 本機資料':'本機草稿',migrating);return;}catch(err){notify('本機資料異常，改讀取網站設備資料');}}
 if(location.protocol==='file:'){setData(initial,'離線空白範本');return;}
 fetch('./equipment-data.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(d=>{if(!local)setData(d,'網站已發布版本');}).catch(()=>{if(!local)setData(initial,'空白範本');});
}
async function importPrivateProject(raw,source='已匯入加密私人備份',allowReadOnly=false){
 if(currentRole!=='admin'&&!allowReadOnly)throw Error('請先切換管理者本機編輯模式');
 const validated=sanitize(raw); // Validate before replacing current state or writing photos
 const referenced=[...new Set(validated.devices.flatMap(d=>(d.photos||[]).map(ph=>ph.id)))];
 const assets=raw.photoAssets;
 if(referenced.length){
  if(!Array.isArray(assets))throw Error('備份不含照片原檔，不能作為完整私人備份還原');
  const got=new Set();
  for(const a of assets){if(!a||typeof a.id!=='string'||got.has(a.id))throw Error('照片備份有重複或不正確的 ID');got.add(a.id);}
  if(referenced.some(id=>!got.has(id)))throw Error('備份缺少照片原檔，已取消匯入，原有資料保留');
 }
 if(!window.HWPhotoStore)throw Error('照片儲存元件未載入');
 const serialized=JSON.stringify(validated);
 // Storage write is attempted before any in-memory project replacement.
 const prev=localStorage.getItem('hw-v94-project');
 try{localStorage.setItem('hw-v94-project',serialized);}catch(err){throw Error('此裝置的專案儲存空間不足，未覆蓋原資料');}
 try{
   await window.HWPhotoStore.ingest(Array.isArray(assets)?assets:[]);
   for(const id of referenced){const stored=await window.HWPhotoStore.getPreview(id);const original=assets.find(a=>a.id===id);if(!stored||stored!==original?.dataUrl)throw Error('照片縮圖寫入後驗證不一致：'+id);}
 }catch(err){
   try{if(prev===null)localStorage.removeItem('hw-v94-project');else localStorage.setItem('hw-v94-project',prev);}catch(_e){}
   throw Error('照片匯入失敗，未切換專案：'+err.message);
 }
 setData(validated,source,false);
 snapshot();
 return{devices:validated.devices.length,routes:validated.routes.length,photos:referenced.length};
}
// V10.2: every line connected to a physically moved equipment must be rechecked.
// This does not modify its geometry, circuit metadata or historic inspection notes.
function touchingRoutes(deviceId){return data.routes.filter(r=>r.fromDeviceId===deviceId||r.toDeviceId===deviceId||r.points.some(p=>p.deviceId===deviceId));}
function requireRouteRecheck(deviceId,reason,onlyPorts){
 let affected=0;
 for(const r of touchingRoutes(deviceId)){
  if(onlyPorts){const affectedPort=!!((r.fromDeviceId===deviceId&&r.fromTerminalId&&onlyPorts.has(r.fromTerminalId))||(r.toDeviceId===deviceId&&r.toTerminalId&&onlyPorts.has(r.toTerminalId)));if(!affectedPort)continue;}
  r.confirmed=false;affected++;
 }
 if(affected)notify(reason+'；已將 '+affected+' 條相關線路標為待現場核對');
 return affected;
}
function changedGeometry(before,after){return ['size','widthScale','heightScale','rotation','type','shape','displayX','displayY'].some(k=>before[k]!==after[k])||JSON.stringify(before.segment||null)!==JSON.stringify(after.segment||null)||JSON.stringify(before.array||null)!==JSON.stringify(after.array||null);}
function changedPhysical(before,after){return before.x!==after.x||before.y!==after.y;}
function updateDetails(kind,id,patch){
 if(currentRole!=='admin')return false;
 const list=kind==='device'?data.devices:kind==='route'?data.routes:null;
 if(!list)return false;
 const item=list.find(d=>d.id===id);if(!item)return false;
 const before=clone(item);
 Object.assign(item,clone(patch));
 if(kind==='device'){
  const moved=changedPhysical(before,item);
  if(moved){const physicalDx=item.x-before.x,physicalDy=item.y-before.y;
   if(!('displayX' in patch))item.displayX=roundPos(iconX(before)+physicalDx);
   if(!('displayY' in patch))item.displayY=roundPos(iconY(before)+physicalDy);
  }
  // Only geometry changes may invoke icon collision resolution. Text, status,
  // notes, photos, terminal edits must NEVER silently move the displayed icon.
  if(moved||changedGeometry(before,item)){
   if(!fitIcon(item)){Object.assign(item,before);notify('附近沒有足夠空間容納圖標，請縮小或調整顯示位置');return false;}
  }
  if(moved)requireRouteRecheck(item.id,'設備實際位置已改變');
  if(('valveSelection' in patch&&before.valveSelection!==item.valveSelection)||('waterSources' in patch&&JSON.stringify(before.waterSources)!==JSON.stringify(item.waterSources)))requireRouteRecheck(item.id,'水源或三向閥設定改變');
  if('terminals' in patch){
   const existingIds=new Set((item.terminals||[]).map(t=>t.id));
   const removed=new Set((before.terminals||[]).map(t=>t.id).filter(t=>!existingIds.has(t)));
   if(removed.size)requireRouteRecheck(item.id,'配電端子已移除',removed);
   // Electrical breaker or internal-supply topology changes invalidate prior field checks,
   // but only for electric routes attached to this equipment; no unrelated water/feed lines.
   const prior=new Map((before.terminals||[]).map(t=>[t.id,t]));
   const changed=(item.terminals||[]).some(t=>{const old=prior.get(t.id);return old&&['feedsFrom','direction','breakerKind','ratedAmps','poleCount','circuitTag'].some(k=>String(old[k]||'')!==String(t[k]||''));});
   if(changed)for(const r of data.routes){if(r.group!=='electric'||!r.confirmed)continue;
     if(r.fromDeviceId===item.id||r.toDeviceId===item.id||r.points.some(p=>p.deviceId===item.id))r.confirmed=false;
   }
  }
 }else if(kind==='route'){
  if(['fromDeviceId','toDeviceId','fromTerminalId','toTerminalId','points','group','waterSource','flowDirection','pipeDiameter','pipeMaterial'].some(k=>k in patch&&JSON.stringify(before[k])!==JSON.stringify(item[k])))item.confirmed=false;
 }
 data=sanitize(data);save();renderAll();showInspector();return true;
}
// V11.10.8: one save / one undo point for an inspection round. Never touch geometry.
function recordInspectionRound(payload){
 if(currentRole!=='admin')return {ok:false,error:'請先切換管理者模式'};
 const records=payload?.entries;
 if(!Array.isArray(records)||records.length<1||records.length>80)return {ok:false,error:'每次請選取 1～80 台設備'};
 const date=str(payload.date,10),inspector=str(payload.inspector,70),roundId=newId('round');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)return {ok:false,error:'請輸入有效的巡檢日期'};
 if(!inspector)return {ok:false,error:'請填寫巡檢人員'};
 if(data.maintenance.length+records.length>1200)return {ok:false,error:'維修／巡檢記錄上限 1200 筆，請先備份並整理'};
 const next=clone(data),seen=new Set(),ts=new Date().toISOString(),statusNames={normal:'正常',abnormal:'異常',offline:'停用',repairing:'維修中'};
 for(const r of records){
  const id=str(r?.deviceId,100),d=next.devices.find(x=>x.id===id),condition=str(r?.condition,20),note=str(r?.note,900),photoId=str(r?.photoId,100);
  if(!d)return {ok:false,error:'巡檢設備不存在：'+id};
  if(seen.has(id))return {ok:false,error:'本次巡檢清單重複設備'};seen.add(id);
  if(!statusNames[condition])return {ok:false,error:'請為「'+d.name+'」選擇巡檢結果'};
  if(photoId&&!d.photos?.some(p=>p.id===photoId))return {ok:false,error:d.name+'：佐證照片不屬於此設備'};
  if((condition==='abnormal'||condition==='offline')&&!note)return {ok:false,error:d.name+'：異常或停用請填寫情況'};
  d.condition=condition;d.lastInspectionAt=date;
  next.maintenance.push({id:newId('work'),deviceId:id,routeId:'',kind:condition==='normal'?'inspection':condition==='repairing'?'repair':'fault',status:condition==='normal'?'done':condition==='repairing'?'working':'open',priority:condition==='abnormal'?'high':'normal',title:d.name+'｜'+statusNames[condition]+'巡檢',description:note||('現場巡檢結果：'+statusNames[condition]),result:condition==='normal'?'本次巡檢正常':'',reporter:inspector,assignee:'',workDate:date,dueDate:'',completedAt:condition==='normal'?date:'',cost:0,photoId,inspectionCondition:condition,inspectionRoundId:roundId,createdAt:ts,updatedAt:ts,archived:false});
 }
 let clean;try{clean=sanitize(next);}catch(e){return {ok:false,error:e.message};}
 // Validate before committing; one state transition and one undo entry.
 data=clean;const stored=save();renderIcons();
 return {ok:stored,count:records.length,roundId,error:stored?'':'資料已更新但無法存入本機！請立即匯出 .hwpack 備份'};
}
function finishInspectionWork(id,options){
 if(currentRole!=='admin')return {ok:false,error:'請先切換管理者模式'};
 const work=data.maintenance.find(w=>w.id===id&&!w.archived),device=data.devices.find(d=>d.id===work?.deviceId);
 if(!work||!device||work.status==='done')return {ok:false,error:'找不到待結案的有效工作單'};
 const result=str(options?.result,1800),date=str(options?.date,10);
 if(!result)return {ok:false,error:'請填寫實際維修結果'};
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)return {ok:false,error:'日期格式錯誤'};
 // Only change equipment condition when the user explicitly confirms a passing field retest.
 work.status='done';work.completedAt=date;work.result=result;work.updatedAt=new Date().toISOString();
 if(options?.verifiedNormal===true){device.condition='normal';device.lastInspectionAt=date;}
 const stored=save();renderIcons();return {ok:stored,error:stored?'':'本機儲存失敗，請備份資料'};
}
function workOrderAction(op,id,fields){
 if(currentRole!=='admin')return {ok:false,error:'員工檢視模式不可修改工作單'};
 const next=clone(data);let resultId='';
 const hasDevice=q=>next.devices.some(x=>x.id===q);
 const hasRoute=q=>next.routes.some(x=>x.id===q);
 if(op==='create'){
  if(next.maintenance.length>=1200)return {ok:false,error:'維修紀錄已達 1200 筆上限'};
  const item={...(fields||{}),id:newId('work'),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  if(!item.deviceId||!hasDevice(String(item.deviceId)))return {ok:false,error:'請先選擇存在的設備'};
  if(item.routeId&&!hasRoute(String(item.routeId)))return {ok:false,error:'選取的線路不存在'};
  if(!String(item.title||'').trim())return {ok:false,error:'請輸入工作單主旨'};
  next.maintenance.push(item);resultId=item.id;
 }else{
  const old=next.maintenance.find(x=>x.id===id);
  if(!old)return {ok:false,error:'查無工作單'};
  if(op==='archive')Object.assign(old,{archived:true,updatedAt:new Date().toISOString()});
  else if(op==='update'){
   if(fields?.deviceId&&!hasDevice(String(fields.deviceId)))return {ok:false,error:'選取的設備不存在'};
   if(fields?.routeId&&!hasRoute(String(fields.routeId)))return {ok:false,error:'選取的線路不存在'};
   if(fields&&Object.prototype.hasOwnProperty.call(fields,'id'))return {ok:false,error:'不可修改工作單 ID'};
   Object.assign(old,fields||{}, {updatedAt:new Date().toISOString()});
   if(!String(old.title||'').trim())return {ok:false,error:'請輸入工作單主旨'};
  }else return {ok:false,error:'未知操作'};
  resultId=old.id;
 }
 let clean;try{clean=sanitize(next);}catch(e){return {ok:false,error:e.message};}
 data=clean;
 const stored=save();
 return {ok:stored,id:resultId,error:stored?'':'本機儲存失敗：請立即匯出私人備份'};
}
// V11.6: sub-systems are saved with the regular project, including Undo, encrypted
// backups and optional cloud snapshots. Never infer a real connection from proximity.
function saveSystemNode(spec){
 if(currentRole!=='admin')return {ok:false,error:'員工唯讀模式不能編輯系統架構'};
 const old=clone(data),id=str(spec?.id,100)||newId('sys');
 const node={id,group:spec?.group,name:str(spec?.name,100),zone:str(spec?.zone,100),note:str(spec?.note,500),parentIds:Array.isArray(spec?.parentIds)?[...new Set(spec.parentIds.map(v=>str(v,100)).filter(Boolean))].slice(0,8):[]};
 if(!['electric','water','ventilation','feed'].includes(node.group)||!node.name)return {ok:false,error:'請選擇類別並輸入系統名稱'};
 const at=data.systemNodes.findIndex(x=>x.id===id);
 if(at<0&&data.systemNodes.length>=800)return {ok:false,error:'已達 800 個系統節點上限'};
 if(at>=0)data.systemNodes[at]=node;else data.systemNodes.push(node);
 try{data=sanitize(data);}catch(e){data=old;return {ok:false,error:e.message};}
 save();return {ok:true,id};
}
function bulkSystemLink(id,refs,mode='add'){
 if(currentRole!=='admin')return {ok:false,error:'員工唯讀模式不能批次修改'};
 if(!data.systemNodes.some(x=>x.id===id))return {ok:false,error:'指定的子系統不存在'};
 if(!Array.isArray(refs)||!refs.length||refs.length>200)return {ok:false,error:'一次最多處理 200 筆設備或管線'};
 if(!['add','remove'].includes(mode))return {ok:false,error:'批次動作錯誤'};
 const found=new Set(),objects=[];
 for(const ref of refs){const kind=ref?.kind,record=(kind==='device'?data.devices:kind==='route'?data.routes:[]).find(x=>x.id===ref?.id);
  if(!record)return {ok:false,error:'批次名單包含不存在的設備或管線'};
  const k=kind+':'+record.id;if(found.has(k))continue;found.add(k);objects.push(record);
  if(mode==='add'&&!(record.systemIds||[]).includes(id)&&(record.systemIds||[]).length>=24)return {ok:false,error:record.name+'：已達最多 24 個系統關聯'};
 }
 let changed=0;
 for(const record of objects){const before=record.systemIds||[],after=mode==='add'?[...new Set([...before,id])]:before.filter(x=>x!==id);
  if(after.length!==before.length){record.systemIds=after;changed++;}}
 if(changed)save();return {ok:true,changed};
}
function removeSystemNode(id){
 if(currentRole!=='admin')return {ok:false,error:'員工唯讀'};
 const target=data.systemNodes.find(x=>x.id===id);if(!target)return {ok:false,error:'找不到系統'};
 const depend=data.systemNodes.filter(x=>x.parentIds.includes(id));
 const devices=data.devices.filter(x=>x.systemIds?.includes(id));
 const routes=data.routes.filter(x=>x.systemIds?.includes(id));
 // Removal is deliberately blocked, rather than silently disconnecting existing physical relations.
 if(depend.length||devices.length||routes.length)return {ok:false,error:`尚有 ${depend.length} 個下屬、${devices.length} 台設備、${routes.length} 條線路；請先移轉關聯`};
 data.systemNodes=data.systemNodes.filter(x=>x.id!==id);save();return {ok:true};
}
window.HWEquipment={
getAnchorGuides:()=>showAnchorGuides,
setAnchorGuides:(enabled)=>{showAnchorGuides=!!enabled;try{localStorage.setItem('hw-v1199-anchor-guides',showAnchorGuides?'on':'off');}catch(_){}renderIcons();return showAnchorGuides;},
setIconStretch:(width,height)=>{if(currentRole!=='admin'||selected?.kind!=='device')return false;const d=data.devices.find(q=>q.id===selected.id);if(!d||d.locked)return false;return updateDetails('device',d.id,{widthScale:validAxis(width),heightScale:validAxis(height)});},
setRotation:(angle)=>{if(currentRole!=='admin'||selected?.kind!=='device')return false;const d=data.devices.find(q=>q.id===selected.id);if(!d||d.locked)return false;const n=Number(angle);if(!Number.isFinite(n))return false;const normalized=((Math.round(n)%360)+360)%360;if(((Math.round(Number(d.rotation)||0)%360)+360)%360===normalized)return true;return updateDetails('device',d.id,{rotation:normalized});},
saveSystemNode,removeSystemNode,bulkSystemLink,manageWorkOrder:workOrderAction,recordInspectionRound,finishInspectionWork,getStorageState:()=>({dirty:storageDirty,error:storageLastError,lastSavedAt}),retryStorageSave:()=>{const ok=persist();updateFooter();window.dispatchEvent(new CustomEvent('hw-v101-storage',{detail:{ok,dirty:storageDirty,error:storageLastError}}));return ok;},resetIconPosition:(id)=>{if(currentRole!=='admin')return false;const d=data.devices.find(q=>q.id===id);if(!d||d.locked)return false;const old={x:d.displayX,y:d.displayY};d.displayX=d.x;d.displayY=d.y;if(iconMagnetEnabled&&data.devices.some(other=>other.id!==d.id&&window.HWIconMagnet.collision(visual(d),visual(other),id=>byType[id]))){d.displayX=old.x;d.displayY=old.y;notify('定位點上已有其他圖標，請先移開或關閉吸附');return false;}save();renderAll();return true;},previewArraySplit:arraySplitPreview,splitArraySelected,previewArrayBatch:arrayBatchPreview,applyArrayBatch,getVisualPlacement:(id)=>{const d=data.devices.find(q=>q.id===id);return d?{physical:{x:d.x,y:d.y},icon:{x:iconX(d),y:iconY(d)}}:null;},getIconMagnetEnabled:()=>iconMagnetEnabled,setIconMagnetEnabled:enabled=>{iconMagnetEnabled=!!enabled;try{localStorage.setItem('hw-v100-icon-magnet',enabled?'on':'off');}catch(e){}window.dispatchEvent(new CustomEvent('hw-v100-magnet',{detail:{mode:'toggle',enabled:iconMagnetEnabled}}));return iconMagnetEnabled;},getIconMagnetPreview:(type,x,y)=>{const t=byType[type];if(!t)return {ok:false};const preset=activeTemplate&&data.templates.find(z=>z.id===activeTemplate&&z.type===type);return magnetSolve({x:snapPos(x),y:snapPos(y)},{id:'preview-v100',type,name:preset?.name||t.label,size:preset?.size||t.size||100,widthScale:validAxis(preset?.widthScale),heightScale:validAxis(preset?.heightScale),shape:preset?.shape||t.shape,showLabel:preset?.showLabel!==false});},getSmartSnap:(x,y,group,includeRoutes=true)=>smartSnap({x,y},group,includeRoutes),updateDetails,importPrivateProject,importCloudReadOnlyProject:(raw,source)=>importPrivateProject(raw,source,true),validateData:raw=>sanitize(raw),getData:()=>clone(data),getSelected:()=>selected?clone(selected):null,getRole:()=>currentRole,getWorkspace:()=>workspace,getAction:()=>({action,actionType,count:drawing.length}),getHistory:()=>({index:historyIndex,length:history.length}),getTypes:()=>[...catalogue,...data.customTypes].map(t=>({...byType[t.type]})),getType:id=>byType[id],setHook:(k,fn)=>{hooks[k]=fn;},setRole:roleSet,setWorkspace,select,cancelAction,begin,placeAt:(type,clientX,clientY)=>{if(currentRole==='admin'&&byType[type])addNew(type,svgPoint({clientX,clientY}));},setRepeat:v=>{repeatPlacement=!!v;},setOrtho:v=>{orthogonal=!!v;},setPlacementSources:sources=>{placementSources=['tower','groundwater','tap'].filter(k=>Array.isArray(sources)&&sources.includes(k));activeTemplate=null;fire('action');},getPlacementSources:()=>[...placementSources],saveSelectedTemplate,applyTemplate,deleteTemplate,setActiveTemplate:id=>{activeTemplate=data.templates.some(x=>x.id===id)?id:null;fire('action');},getActiveTemplate:()=>activeTemplate,getMultiMode:()=>multiSelectMode,setMultiMode,getSelectionIds,clearMany,moveSelected,alignSelected,distributeSelected,arrayCopy,setSnap:(enabled,step)=>{snapEnabled=!!enabled;snapStep=[.1,.25,.5,1].includes(Number(step))?Number(step):.25;fire('selection');},getSnap:()=>({enabled:snapEnabled,step:snapStep}),undo:()=>timeTravel(-1),redo:()=>timeTravel(1),finishRoute:()=> $('eqFinishRoute').click(),removeLastPoint:()=>{if(action==='route'&&drawing.length){drawing.pop();$('eqRoutePoints').textContent=drawing.length+' 個節點';$('eqFinishRoute').disabled=drawing.length<2;renderPreview();fire('action');}},duplicate:()=>{if(currentRole!=='admin'||selected?.kind!=='device')return;const d=data.devices.find(x=>x.id===selected.id);if(!d)return;const b=clone(d);b.id=newId('d');b.name=d.name+' 副本';b.x=+(b.x+1.8).toFixed(4);b.y=+(b.y+1.8).toFixed(4);b.displayX=+(iconX(d)+1.8).toFixed(4);b.displayY=+(iconY(d)+1.8).toFixed(4);b.locked=false;b.photos=[];b.terminals=[];b.arrayBatchId='';b.arraySourceId='';b.arrayIndex=0;b.arrayTotal=0;b.condition='unchecked';b.lastInspectionAt='';const spot=magnetSolve({x:b.displayX,y:b.displayY},b);if(!spot.ok){notify('周邊空間不足，無法複製設備');return;}b.displayX=spot.x;b.displayY=spot.y;data.devices.push(b);save();select('device',b.id);notify('已複製設備；可從設備位置欄位調整，或以滑鼠／手指直接拖曳未鎖定圖標');},rotate:()=>{if(currentRole!=='admin'||selected?.kind!=='device')return false;const d=data.devices.find(x=>x.id===selected.id);return d&&!d.locked?window.HWEquipment.setRotation((d.rotation||0)+90):false;},toggleLock:()=>{if(currentRole!=='admin'||selected?.kind!=='device')return;const d=data.devices.find(x=>x.id===selected.id);if(!d)return;d.locked=!d.locked;save();select('device',d.id);},openEditor:()=>{if(currentRole!=='admin'||!selected)return;editorOpened=true;fire('editorOpen');},closeEditor:()=>{editorOpened=false;fire('editorClose');},setVisibility:(k,v)=>{if(k in visibility){visibility[k]=!!v;saveVisibility();renderAll();}},getVisibility:()=>({...visibility}),getLabelMode:()=>deviceLabelMode,setLabelMode:mode=>{if(!['smart','all','off'].includes(mode))return;deviceLabelMode=mode;try{localStorage.setItem('hw-v88-device-label-mode',mode);}catch(e){}renderIcons();renderRoutes();},getDrawing:()=>clone(drawing),focus};
setup();
})();
