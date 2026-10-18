
(function(){'use strict';
var api=window.HWViewer;if(!api)return;
var annotations=['building','zone','area','dimension','notes','bedid','penid'];
var presets={clean:{building:false,zone:false,area:false,dimension:false,notes:false,bedid:false,penid:false},simple:{building:true,zone:true,area:true,dimension:false,notes:false,bedid:false,penid:false},full:{building:true,zone:true,area:true,dimension:true,notes:true,bedid:false,penid:false}};
var scale=document.getElementById('labelScale'),value=document.getElementById('scaleValue');
var textNodes=Array.from(document.querySelectorAll('#plan text'));
textNodes.forEach(function(t){t.dataset.baseFontSize=t.getAttribute('font-size')||'0.35';});
var fontScale=100;try{fontScale=Number(localStorage.getItem('huwei_v81_text_scale'))||100;}catch(e){};
function setScale(v){v=Math.max(70,Math.min(160,Number(v)||100));fontScale=v;scale.value=String(v);value.textContent=v+'%';textNodes.forEach(function(t){t.setAttribute('font-size',(Number(t.dataset.baseFontSize)*v/100).toFixed(4));});try{localStorage.setItem('huwei_v81_text_scale',String(v));}catch(e){}}
scale.addEventListener('input',function(){setScale(this.value);});document.getElementById('scaleReset').addEventListener('click',function(){setScale(100);});setScale(fontScale);
var search=document.getElementById('layerSearch'),only=document.getElementById('onlyVisible'),count=document.getElementById('filterCount');
var rows=Array.from(document.querySelectorAll('#indiv label.toggle'));
function filterRows(){var q=search.value.trim().toLowerCase(),visible=api.getState(),n=0;rows.forEach(function(row){var input=row.querySelector('input[data-layer]');var name=input.getAttribute('data-layer');var match=name.toLowerCase().includes(q)&&(!only.checked||visible[name]);row.hidden=!match;row.style.display=match?'':'none';if(match)n++;});count.textContent=n+' / '+rows.length+' 層';}
search.addEventListener('input',filterRows);only.addEventListener('change',filterRows);
var modeBtns=Array.from(document.querySelectorAll('.mode-btn'));
function updateMode(){var current=api.getState();modeBtns.forEach(function(btn){var p=presets[btn.dataset.mode],matches=api.layers.filter(function(l){return Object.prototype.hasOwnProperty.call(p,l.category);}).every(function(l){return current[l.id]===p[l.category];});btn.classList.toggle('active',matches);btn.setAttribute('aria-pressed',matches?'true':'false');});}
modeBtns.forEach(function(btn){btn.addEventListener('click',function(){api.setAnnotations(presets[btn.dataset.mode]);});});
Array.from(document.querySelectorAll('[data-quick]')).forEach(function(cb){cb.addEventListener('change',function(){api.setCategory(cb.dataset.quick,cb.checked);});});
function sync(){var current=api.getState();Array.from(document.querySelectorAll('[data-quick]')).forEach(function(cb){var category=cb.dataset.quick,ls=api.layers.filter(function(l){return l.category===category;});cb.checked=ls.length>0&&ls.every(function(l){return current[l.id];});cb.indeterminate=ls.some(function(l){return current[l.id];})&&!cb.checked;});updateMode();filterRows();}
window.addEventListener('hw-layer-change',sync);sync();
function toast(msg){var el=document.getElementById('toast');el.textContent=msg;el.style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(function(){el.style.display='none';},2400);}
function download(name,body){var blob=new Blob([body],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},500);}
document.getElementById('downloadPrefs').addEventListener('click',function(){download('虎尾場CAD_V8.1_顯示設定.json',JSON.stringify({app:'Huwei2DCAD',version:'V8.1',layerState:api.getState(),textScale:fontScale},null,2));toast('已匯出顯示設定');});
var picker=document.getElementById('prefsFile');document.getElementById('loadPrefs').addEventListener('click',function(){picker.click();});
picker.addEventListener('change',async function(){if(!picker.files||!picker.files.length)return;try{var raw=await picker.files[0].text();if(raw.length>200000)throw new Error('檔案太大');var data=JSON.parse(raw);var state=data.layerState||data;if(data.app&&data.app!=='Huwei2DCAD')throw new Error('不是虎尾場的顯示設定');var n=api.loadState(state);if(data.textScale!=null)setScale(data.textScale);toast('已匯入 '+n+' 個圖層設定');}catch(e){toast('匯入失敗：'+e.message);}finally{picker.value='';}});
})();