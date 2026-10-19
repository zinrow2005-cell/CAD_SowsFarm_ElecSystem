/* V10.8 — normal design layout for B-house boar pen above wastewater pit.
   CAD symbols indicate nominal position only. Never imply installation certification. */
(function(){'use strict';
const svg=document.getElementById('plan');
const item={
 version:'V11.8.6',zone:'妊娠舍 B 棟左下方',
 facilityId:'B-BOAR-PEN-UPPER',
 previousFacilityId:'B-BOAR-PEN-UPPER-PLANNED',
 layers:{boarPen:'V10.8_B棟池上公豬欄',slab:'V10.8_B棟池上混凝土樓板',pit:'V10.8_B棟污水集中抽取池'},
 upper:{type:'公豬欄',count:1,capacityHeads:1,code:'B-BOAR-UPPER-01'},
 intermediate:{type:'混凝土樓板',position:'污水集中抽取池正上方',exists:true},
 lower:{type:'污水集中抽取池',use:'污水收集與抽取，保留檢修動線'},
 relationship:'妊娠B棟第3排左端：公豬欄以原有兩格位置為右半部，向左延伸約兩格；下層污水池／既有樓板仍位於原兩格位置；B3母豬80格從右側接續排列',
 referenceMarker:{svgX:3.3000,svgY:73.0448,footprint:{x0:2.058,x1:4.542,y0:72.0848,y1:74.0048},baseFootprint:{x0:3.3,x1:4.542,y0:72.0848,y1:74.0048},isActualFootprint:false,measurementsVerified:false},
 separateFrom:'BOAR-HEAT-01',excludedFrom:{matingSowCrates:76,pregnancyBCrates:244},
 note:'這是最終設備配置視圖，不是工程進度表，也不表示公豬欄已安裝或已飼養。',
 safety:'污水池可能產生硫化氫與甲烷；使用前應確認樓板承載、池氣隔離、通風及抽取／檢修安全。'
};
const dlg=document.createElement('div');dlg.id='v108Overlay';dlg.className='v108-mask';dlg.hidden=true;
dlg.innerHTML=`<div class="v108-panel" role="dialog" aria-modal="true" aria-labelledby="v108Title" tabindex="-1">
<header><div><small>HUWEI FARM · 設施配置</small><h2 id="v108Title">妊娠 B｜污水池上方公豬欄</h2><p>公豬欄向左加寬約兩格 · 公豬 1 頭 · 母豬仍為 80 格</p></div><button data-close type="button" aria-label="關閉視窗">×</button></header>
<div class="v108-body">
<div class="v108-level v108-boar"><strong>上層 · 公豬欄</strong><span>1 欄／1 頭</span></div>
<div class="v108-level v108-slab"><strong>中間 · 混凝土樓板</strong><span>污水池上方結構</span></div>
<div class="v108-level v108-pit"><strong>下層 · 污水集中抽取池</strong><span>污水抽取及檢修</span></div>
<p class="v108-foot">與配種區左側巡情公豬欄（BOAR-HEAT-01）分開管理，不計入配種區 76 個母豬夾欄或妊娠 B 棟 244 個母豬夾欄。</p>
<p class="v108-note">公豬欄已向左延伸，右緣與第3排首格相接；原兩格位置下方是污水池及既有樓板，新增左側延伸區域的結構支撐須現場確認。圖面非實測尺寸、施工或安全認證。</p>
<details class="v108-safe"><summary>安全與檢修注意事項</summary><p>樓板結構載重、池內硫化氫／甲烷的隔離與通風、抽水設備和檢修孔的位置，仍須由合格專業人員依現場條件確認；勿自行進入污水池。</p></details>
</div></div>`;
document.body.append(dlg);
const style=document.createElement('style');style.textContent=`
.v108-mask[hidden]{display:none!important}.v108-mask{position:fixed;inset:0;z-index:18000;background:#061520db;display:flex;align-items:center;justify-content:center;padding:14px}
.v108-panel{color:#eaf3fa;background:#132838;border:1px solid #47738c;border-radius:16px;width:min(640px,100%);max-height:90vh;overflow:auto;font-family:system-ui,'Microsoft JhengHei',sans-serif;box-shadow:0 14px 56px #0009}
.v108-panel header{padding:16px 18px 12px;display:flex;align-items:start;justify-content:space-between;gap:10px;border-bottom:1px solid #ffffff24}
.v108-panel header small{color:#99d4ed;font-size:10px;letter-spacing:.6px}.v108-panel h2{font-size:20px;margin:4px 0}.v108-panel header p{font-size:13px;color:#bad6e4;margin:0}
.v108-panel [data-close]{background:#2c4556;color:white;border:1px solid #678ca2;border-radius:7px;width:34px;height:34px;font-size:23px;cursor:pointer;flex-shrink:0}
.v108-body{padding:16px 18px 19px}.v108-level{border:1px solid #608096;border-radius:10px;padding:12px;margin:8px 0;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.v108-level strong{font-size:14px}.v108-level span{font-size:12px;color:#cee4ef}.v108-boar{border-color:#c79a5b;background:#91612b2d}.v108-slab{border-color:#5eaa83;background:#36734e2c}.v108-pit{border-color:#5091b2;background:#356c8c28}
.v108-foot,.v108-note{color:#b5cbd8;font-size:12px;line-height:1.7}.v108-note{border-top:1px solid #385468;padding-top:9px}.v108-safe{border:1px solid #516e82;border-radius:9px;padding:9px 12px;font-size:12px;line-height:1.7}.v108-safe summary{cursor:pointer;color:#d8e7ef;font-weight:600}.v108-safe p{margin:7px 0 0}
.v108-quick{background:#18394b;border:1px solid #5886a0;color:#ecf8ff;border-radius:10px;padding:10px 12px;cursor:pointer;width:100%;text-align:left;font-weight:650;line-height:1.5}.v108-quick small{display:block;color:#bddeee;font-size:12px;font-weight:400}
#plan [data-facility-id]{cursor:pointer}#plan [data-facility-id]:hover{filter:drop-shadow(0 0 .055px #ffd597)} #plan [data-facility-id]:focus{outline:none!important} #plan [data-facility-id]:focus-visible rect,#plan [data-facility-id].v1181-facility-focus rect{stroke:#ffdd8b!important;stroke-width:.070!important;filter:drop-shadow(0 0 .022px #ffcc76)}
@media(max-width:520px){.v108-panel h2{font-size:17px}.v108-body{padding:12px}.v108-panel header{padding:12px}.v108-level{align-items:start}}`;
document.head.append(style);
let oldFocus=null;
function open(){hideCard();oldFocus=document.activeElement;dlg.hidden=false;dlg.querySelector('[data-close]').focus();}
function close(){dlg.hidden=true;oldFocus?.focus?.();}
dlg.querySelector('[data-close]').addEventListener('click',close);
dlg.addEventListener('click',e=>{if(e.target===dlg)close();});
dlg.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();}});
// A small non-blocking card is the first interaction; full detail is explicit.
const viewer=document.querySelector('.viewer')||document.body;
const quick=document.createElement('section');quick.id='v1181FacilityCard';quick.hidden=true;
quick.setAttribute('aria-label','池上公豬欄與污水池位置資訊');
quick.innerHTML='<div class="v1181-card-head"><strong>妊娠 B｜池上公豬欄</strong><button type="button" data-card-close aria-label="關閉小卡">×</button></div><p>從原兩格位置再往左加寬約兩格；右側仍接續 80 個母豬夾欄。</p><small>上層公豬欄 1 頭 · 原右半部下方是樓板／污水池</small><button class="v1181-card-more" type="button">查看完整設施資訊 →</button>';
viewer.append(quick);
const inlineStyle=document.createElement('style');inlineStyle.textContent=`
#v1181FacilityCard[hidden]{display:none!important}
#v1181FacilityCard{position:absolute;bottom:16px;right:17px;z-index:26;background:#112f40f8;border:1px solid #daa960;border-radius:13px;color:#e8f7f9;padding:13px;box-shadow:0 9px 27px #0009;width:min(330px,calc(100% - 28px));font:13px/1.6 system-ui,'Microsoft JhengHei',sans-serif}
#v1181FacilityCard .v1181-card-head{display:flex;justify-content:space-between;gap:10px;align-items:center;border-bottom:1px solid #44647a;padding-bottom:8px}
#v1181FacilityCard .v1181-card-head strong{font-size:14px}
#v1181FacilityCard button{border:1px solid #4b8193;border-radius:8px;color:#e6f7fa;background:#234e60;padding:8px;cursor:pointer}
#v1181FacilityCard [data-card-close]{font-size:19px;min-width:32px;line-height:18px;background:transparent}
#v1181FacilityCard p{margin:9px 0 5px}#v1181FacilityCard small{display:block;color:#b9d2db}
#v1181FacilityCard .v1181-card-more{margin-top:12px;width:100%;background:#226772;border-color:#58aaa9;font-weight:700}
@media(max-width:760px){#v1181FacilityCard{bottom:12px;right:7px;left:7px;width:auto;max-height:45vh;overflow:auto}}
body.v1181-facility-card-open .v114-fab,body.v1181-facility-card-open .v113-fab{display:none!important}
`;
document.head.append(inlineStyle);
let active=null;
function hideCard(){quick.hidden=true;document.body.classList.remove('v1181-facility-card-open');active?.classList.remove('v1181-facility-focus');active=null;}
function showCard(node){if(window.HWEquipment?.getAction?.()?.action)return false;
 hideCard();active=node||svg?.querySelector('[data-facility-id="B-BOAR-PEN-UPPER-PLANNED"]');
 active?.classList.add('v1181-facility-focus');quick.hidden=false;document.body.classList.add('v1181-facility-card-open');return true;}
quick.querySelector('[data-card-close]').addEventListener('click',hideCard);
quick.querySelector('.v1181-card-more').addEventListener('click',open);
// A captured pointer keeps its original SVG target while the CAD canvas pans.
// Treat only a short, stationary single-pointer gesture as a facility tap.
const gestures=new Map();
if(svg){
 document.addEventListener('pointerdown',e=>{
   const target=e.target.closest?.('[data-facility-id]');
   if(!target||!svg.contains(target)||e.button>0)return;
   gestures.set(e.pointerId,{node:target,x:e.clientX,y:e.clientY,multi:false,moved:false,kind:e.pointerType});
   if(gestures.size>1)for(const g of gestures.values())g.multi=true;
 },true);
 document.addEventListener('pointermove',e=>{const g=gestures.get(e.pointerId);if(!g)return;
   if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>(g.kind==='mouse'?8:12))g.moved=true;
 },true);
 document.addEventListener('pointerup',e=>{
   const g=gestures.get(e.pointerId);if(!g)return;gestures.delete(e.pointerId);
   if(!g.moved&&!g.multi&&Math.hypot(e.clientX-g.x,e.clientY-g.y)<=(g.kind==='mouse'?8:12))showCard(g.node);
 },true);
 document.addEventListener('pointercancel',e=>gestures.delete(e.pointerId),true);
 svg.addEventListener('click',e=>{const mark=e.target.closest?.('[data-facility-id]');if(!mark)return;
   if(window.HWEquipment?.getAction?.()?.action)return;e.stopPropagation();showCard(mark);
 },true);
 svg.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest?.('[data-facility-id]')){
   e.preventDefault();showCard(e.target.closest('[data-facility-id]'));
 }});
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!quick.hidden)hideCard();});
const host=document.querySelector('#v104Overlay .v104-body');
if(host){const section=document.createElement('section');section.style.cssText='margin:16px 0 6px';
const btn=document.createElement('button');btn.type='button';btn.className='v108-quick';btn.innerHTML='◈　妊娠 B · 污水池上方公豬欄<small>公豬欄 1 欄／1 頭 · 混凝土樓板 · 下層污水集中抽取池</small>';
btn.addEventListener('click',open);section.append(btn);host.append(section);}
window.HWTwoLevelPlan={version:'11.8.6',get:()=>JSON.parse(JSON.stringify(item)),open,close,showCard,hideCard};
})();