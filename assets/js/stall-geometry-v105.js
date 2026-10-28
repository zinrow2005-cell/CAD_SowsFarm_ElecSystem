/* V10.5 真實欄格索引和點選檢視；不更動原有設備坐標。 */
(function(){'use strict';
 const svg=document.getElementById('plan');if(!svg)return;
 const cells=[...svg.querySelectorAll('[data-stall-id]')], counts={};
 cells.forEach(g=>{const row=g.dataset.rowId;counts[row]=(counts[row]||0)+1;});
 const expected={MAT:76,GILT:14,A1:84,A2:84,A3:84,B1:82,B2:82,B3:80,BOAR:1};
 for(const [key,n] of Object.entries(expected))if(counts[key]!==n)console.error('CAD欄格數與正式數量不符',key,counts[key],n);
 let active=null;
 const bar=document.createElement('div');bar.id='v105StallInspector';bar.setAttribute('role','status');bar.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;max-width:90vw;padding:12px 16px;border-radius:12px;background:#143044;border:1px solid #6bafbd;box-shadow:0 8px 30px #0006;color:#f2f8fc;font-size:14px;display:none';
 document.body.append(bar);
 function clear(){if(active)active.classList.remove('v105-stall-focus');active=null;bar.style.display='none';}
 let tipTimeout=null;
 svg.addEventListener('click',function(ev){
  const g=ev.target.closest&&ev.target.closest('[data-stall-id]');if(!g)return;
  const status=window.HWEquipment?.getAction?.();if(status?.action)return;
  // V11.7.1: a stall is interactive only in explicitly selected inspect mode.
  if(window.HWStallNavigation?.handlesTap)return; // V11.8.5 handles genuine taps on pointerup; don't double-open.
  clear();active=g;g.classList.add('v105-stall-focus');
  const id=g.getAttribute('data-stall-id');if(window.HWStallNavigation?.showStall){window.HWStallNavigation.showStall(id,g);return;}if(window.HWStallLinks?.handleStallClick){window.HWStallLinks.handleStallClick(id,g);return;}const boar=id==='BOAR-HEAT-01';
  const title=boar?'公豬巡情欄（1頭）':id==='G-07'?'女豬育成 G-07（縮小，容量待核）':id.startsWith('G-')?'女豬育成欄（原設計每欄10頭）':id.startsWith('MAT-')?'配種母豬夾欄':'妊娠舍夾欄';
  bar.textContent=title+'　'+id+'　｜點其他位置可關閉';bar.style.display='block';
  clearTimeout(tipTimeout);tipTimeout=setTimeout(clear,7000);
 });
 svg.addEventListener('click',function(ev){if(!ev.target.closest?.('[data-stall-id]'))clear();});
 const style=document.createElement('style');style.textContent='.v105-stall-focus>path{stroke:#ffdb7a!important;stroke-width:.18!important;filter:drop-shadow(0 0 .15px #ffcf40)}';document.head.append(style);
 window.HWStallGeometry={version:'10.5',getCounts:()=>({...counts}),expected,validate:()=>Object.keys(expected).every(k=>counts[k]===expected[k]),find:(id)=>svg.querySelector('[data-stall-id="'+String(id).replace(/[^A-Za-z0-9-]/g,'')+'"]'),clear};
})();