/* V11.12.14 — Private, one-page A4 photograph and marker legend.
   No network calls or changes to the equipment / photo data model. */
(function(){'use strict';
const api=window.HWEquipment,media=window.HWPhotoStore;
const toolbar=document.querySelector('#v90PhotoMain .v90-photo-toolbar');
if(!api||!media||!toolbar)return;
const W=2100,H=2970,M=108,CONTENT=W-2*M;
const $=id=>document.getElementById(id);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
const btn=make('button','hw-print-open','🖨 A4 標記列印');btn.type='button';btn.id='hwPhotoPrintOpen';
btn.title='列印目前照片與全部標記的 A4 單頁對照圖';
toolbar.insertBefore(btn,toolbar.querySelector('#v90RemovePhoto'));
const root=make('section','hw-print-overlay');root.id='hwPhotoPrintPreview';root.hidden=true;
root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','A4 照片標記列印預覽');
root.innerHTML=`<div class="hw-print-modal">
 <div class="hw-print-topbar"><div><strong>🖨 照片標記 · A4 單頁預覽</strong><small>只列印目前選擇的照片，照片與標記不會被上傳</small></div>
 <div class="hw-print-actions"><button id="hwPrintSavePng" type="button">儲存 A4 圖檔</button><button id="hwPrintDo" type="button" class="primary">列印／存成 PDF</button><button id="hwPrintClose" type="button" aria-label="關閉列印預覽">✕ 關閉</button></div></div>
 <p class="hw-print-status" id="hwPrintStatus" role="status"></p>
 <div class="hw-print-paper"><img id="hwPrintImage" alt="目前設備照片與標記 A4 列印版" /></div>
 <p class="hw-print-help">請在列印視窗選擇 A4、單面、比例 100%／實際大小，關閉頁首頁尾。要取得 PDF，請在印表機選擇「另存為 PDF」。</p>
 </div>`;
document.body.appendChild(root);
let currentUrl=null,currentCanvas=null,ready=false,workSeq=0,prevFocus=null;
function showStatus(s,isError){const el=$('hwPrintStatus');el.textContent=s;el.classList.toggle('error',!!isError);}
function release(){if(currentUrl){URL.revokeObjectURL(currentUrl);currentUrl=null;}currentCanvas=null;ready=false;$('hwPrintImage').removeAttribute('src');}
function close(){workSeq++;document.body.classList.remove('hw-photo-print-open');root.hidden=true;release();prevFocus?.focus?.();}
$('hwPrintClose').addEventListener('click',close);
root.addEventListener('click',e=>{if(e.target===root)close();});
window.addEventListener('keydown',e=>{if(!root.hidden&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}},true);
function source(){const selected=api.getSelected?.();if(selected?.kind!=='device')return null;
 const d=(api.getData()?.devices||[]).find(item=>item.id===selected.id);
 const photoId=$('v90PhotoMain')?.dataset.photoId;
 const ph=d?.photos?.find(item=>item.id===photoId);
 return ph?{device:d,photo:ph}:null;
}
function imageFromData(src){return new Promise((resolve,reject)=>{
 const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('照片影像無法解碼，請重新匯入完整照片備份'));
 img.src=src; if(img.decode)img.decode().then(()=>resolve(img)).catch(()=>{});
});}
function font(ctx,size,bold=false){ctx.font=(bold?'700 ':'400 ')+size+'px "Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif';}
function textLines(ctx,value,maxWidth,maxLines=999){const lines=[];const paragraphs=String(value??'').replace(/\r/g,'').split('\n');
 for(const part of paragraphs){if(!part){lines.push('');continue;}
  let line='';for(const c of Array.from(part)){const trial=line+c;if(line&&ctx.measureText(trial).width>maxWidth){lines.push(line);line=c;}else line=trial;}
  if(line)lines.push(line);
  if(lines.length>maxLines)break;
 }return lines.length?lines:[''];}
function records(d,ph){return (ph.markers||[]).map((m,i)=>{
 const t=(d.terminals||[]).find(t=>t.id===m.terminalId);
 return {index:i+1,x:clamp(Number(m.x)||0,0,100)/100,y:clamp(Number(m.y)||0,0,100)/100,
 title:String(m.title||'未命名標記').trim(),note:String(m.note||'尚未填寫功能說明').trim(),
 terminal:t?String(t.name||'未命名端子'):(m.terminalId?'端子資料已失效':'未連結端子')};
 });}
function sizedRows(ctx,recs,cols,descriptionSize){const gap=18,colWidth=(CONTENT-gap*(cols-1))/cols;
 const linesY=descriptionSize+9,titleSize=descriptionSize+6,titleStep=titleSize+10;
 const small=descriptionSize-2,smallStep=small+9,rowList=[];
 for(const r of recs){
  const width=colWidth-93;
  font(ctx,titleSize,true);const title=textLines(ctx,r.title,width);
  font(ctx,descriptionSize);const note=textLines(ctx,'功能：'+r.note,width);
  font(ctx,small);const terminal=textLines(ctx,'端子：'+r.terminal,width);
  const height=26+title.length*titleStep+7+note.length*linesY+7+terminal.length*smallStep+18;
  rowList.push({...r,titleLines:title,noteLines:note,terminalLines:terminal,height});
 }
 const heights=Array(cols).fill(0),assignments=Array.from({length:cols},()=>[]);
 for(const r of rowList){const idx=heights.indexOf(Math.min(...heights));assignments[idx].push(r);heights[idx]+=r.height+12;}
 return {assignments,heights,colWidth,gap,titleSize,titleStep,noteSize:descriptionSize,noteStep:linesY,small,smallStep};
}
function chooseLayout(ctx,recs){const candidates=[];
 for(const photoH of [1230,1120,1000,880,770,670,570]){
  const legendTop=346+photoH+146, legendBottom=2840;
  const available=legendBottom-legendTop;
  for(const cols of [2,3,4])for(const size of [48,44,40,36,34,32,30,28,26]){
   const rows=sizedRows(ctx,recs,cols,size);
   if(Math.max(...rows.heights) <= available){
    const score=photoH*0.53 + size*31 - (cols-2)*34;
    candidates.push({photoH,legendTop,available,cols,size,score,rows});
   }
  }
 }
 candidates.sort((a,b)=>b.score-a.score);
 return candidates[0]||null;
}
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function drawHeader(ctx,d,ph,total){ctx.fillStyle='#f7f9fb';ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#12334c';ctx.fillRect(0,0,W,22);
 ctx.fillStyle='#187b83';font(ctx,29,true);ctx.fillText('HUWEI FARM  /  設備照片標記對照圖',M,103);
 ctx.fillStyle='#162b3e';font(ctx,60,true);ctx.fillText(String(d.name||'未命名設備').slice(0,28),M,179);
 ctx.fillStyle='#4c6879';font(ctx,31);ctx.fillText(`${String(d.zone||'未指定區域').slice(0,40)}   ·   ${String(ph.name||'設備照片').slice(0,38)}`,M,232);
 ctx.fillStyle='#637b89';font(ctx,26);ctx.fillText(`標記 ${total} 處   ｜   列印日期 ${new Date().toLocaleDateString('zh-TW')}`,M,282);
 ctx.strokeStyle='#c6d4db';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(M,312);ctx.lineTo(W-M,312);ctx.stroke();
}
function evenlyPlaced(items,start,end,minGap){
 const arr=[...items].sort((a,b)=>a.x-b.x);if(!arr.length)return arr;
 const gap=Math.min(minGap,(end-start)/Math.max(1,arr.length-1));
 const pos=arr.map(r=>clamp(r.x,start,end));
 for(let i=1;i<pos.length;i++)pos[i]=Math.max(pos[i],pos[i-1]+gap);
 if(pos[pos.length-1]>end){const shift=pos[pos.length-1]-end;for(let i=0;i<pos.length;i++)pos[i]-=shift;}
 if(pos[0]<start){const shift=start-pos[0];for(let i=0;i<pos.length;i++)pos[i]+=shift;}
 for(let i=pos.length-2;i>=0;i--)pos[i]=Math.min(pos[i],pos[i+1]-gap);
 return arr.map((r,i)=>({...r,badgeX:pos[i]}));
}
function drawPhoto(ctx,img,recs,panelH){
 const px=M,py=346,pw=CONTENT,ph=panelH;
 ctx.fillStyle='#e7eef2';rounded(ctx,px,py,pw,ph,16);ctx.fill();
 ctx.strokeStyle='#bdd0d8';ctx.lineWidth=3;ctx.stroke();
 const cap=Math.max(1,Math.floor((pw-75)/56));
 let top=recs.filter(r=>r.y<.5),bottom=recs.filter(r=>r.y>=.5);
 // Share perimeter capacity so both rails have readable, non-overlapping badges.
 while(top.length>cap&&bottom.length<cap)bottom.unshift(top.pop());
 while(bottom.length>cap&&top.length<cap)top.push(bottom.shift());
 const tr=Math.max(1,Math.ceil(top.length/cap)),br=Math.max(1,Math.ceil(bottom.length/cap));
 const topSpace=tr*60+17,bottomSpace=br*60+17;
 const availW=pw-23,availH=ph-topSpace-bottomSpace-16;
 const iw=Math.min(availW,availH*(img.naturalWidth/img.naturalHeight));
 const ih=iw*img.naturalHeight/img.naturalWidth;
 const ix=px+(pw-iw)/2,iy=py+topSpace+(availH-ih)/2;
 ctx.fillStyle='#fff';ctx.fillRect(ix-3,iy-3,iw+6,ih+6);ctx.drawImage(img,ix,iy,iw,ih);
 ctx.strokeStyle='#8299a7';ctx.lineWidth=2;ctx.strokeRect(ix-2,iy-2,iw+4,ih+4);
 const rails=[{items:top,up:true},{items:bottom,up:false}];
 for(const rail of rails){const sorted=[...rail.items].sort((a,b)=>a.x-b.x);
  const perRow=Math.max(1,cap);
  for(let row=0;row<Math.ceil(sorted.length/perRow);row++){
   const sub=sorted.slice(row*perRow,(row+1)*perRow).map(r=>({...r,x:ix+r.x*iw}));
   const placed=evenlyPlaced(sub,px+35,px+pw-35,55);
   const by=rail.up?iy-39-60*row:iy+ih+39+60*row;
   for(const r of placed){
    const original=recs[r.index-1],sx=ix+original.x*iw,sy=iy+original.y*ih;
    ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(r.badgeX,by+(rail.up?18:-18));
    ctx.strokeStyle='rgba(255,255,255,.92)';ctx.lineWidth=7;ctx.stroke();
    ctx.strokeStyle='#1e6779';ctx.lineWidth=2.5;ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(sx,sy,7.5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#0b6576';ctx.lineWidth=3;ctx.stroke();
    ctx.beginPath();ctx.arc(r.badgeX,by,23,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
    ctx.strokeStyle='#0f6676';ctx.lineWidth=3;ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#0e3f53';font(ctx,26,true);ctx.fillText(String(r.index),r.badgeX,by+1);
    ctx.textAlign='left';ctx.textBaseline='alphabetic';
   }
  }
 }
 ctx.fillStyle='#5b7280';font(ctx,23);ctx.fillText('引導線起點 = 設備原始標記位置；外圍編號對應下方說明表',px+8,py+ph+37);
 return {imageX:ix,imageY:iy,imageW:iw,imageH:ih};
}
function drawLegend(ctx,layout,recs){
 ctx.fillStyle='#193b4c';font(ctx,38,true);ctx.fillText('標記功能對照表',M,layout.legendTop-18);
 const top=layout.legendTop+16,{rows,cols,size}=layout;
 const colW=rows.colWidth;
 for(let col=0;col<cols;col++){
  const x=M+col*(colW+rows.gap);let y=top;
  for(const r of rows.assignments[col]){
   rounded(ctx,x,y,colW,r.height-4,12);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#d5e1e6';ctx.lineWidth=2;ctx.stroke();
   ctx.beginPath();ctx.arc(x+36,y+36,23,0,Math.PI*2);ctx.fillStyle='#116d78';ctx.fill();
   ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';font(ctx,27,true);ctx.fillText(String(r.index),x+36,y+36);ctx.textAlign='left';ctx.textBaseline='alphabetic';
   let ty=y+38;ctx.fillStyle='#1a3443';font(ctx,rows.titleSize,true);for(const line of r.titleLines){ctx.fillText(line,x+76,ty);ty+=rows.titleStep;}
   ty+=4;ctx.fillStyle='#284e5b';font(ctx,rows.noteSize);for(const line of r.noteLines){ctx.fillText(line,x+76,ty);ty+=rows.noteStep;}
   ty+=3;ctx.fillStyle='#597181';font(ctx,rows.small);for(const line of r.terminalLines){ctx.fillText(line,x+76,ty);ty+=rows.smallStep;}
   y+=r.height+12;
  }
 }
 ctx.strokeStyle='#cedde3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(M,2880);ctx.lineTo(W-M,2880);ctx.stroke();
 ctx.fillStyle='#5e7583';font(ctx,24);ctx.fillText('本圖僅反映系統已建檔資訊；實際供電與管線請依現場確認。',M,2922);
 ctx.textAlign='right';ctx.fillText(`A4  ·  第 1 / 1 頁`,W-M,2922);ctx.textAlign='left';
}
async function renderSheet({device,photo},image){const recs=records(device,photo);
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('此裝置無法建立列印畫布');
 const layout=chooseLayout(ctx,recs);
 if(!layout)return {canvas:null,fit:false,count:recs.length,message:`這張照片有 ${recs.length} 處標記，說明太多或文字太長，無法在單張 A4 以可讀字級完整排版。請精簡過長的標記說明，再重新預覽。`};
 drawHeader(ctx,device,photo,recs.length);drawPhoto(ctx,image,recs,layout.photoH);drawLegend(ctx,layout,recs);
 return {canvas,fit:true,count:recs.length,columns:layout.cols,font:layout.size,message:`已排成單張 A4：${recs.length} 處標記、${layout.cols} 欄說明。照片標號不重疊，完整文字已納入。`};
}
async function open(){const src=source();if(!src){alert('請先選取一台有照片的設備，並打開想列印的照片');return;}
 prevFocus=document.activeElement;root.hidden=false;btn.disabled=true;$('hwPrintDo').disabled=true;$('hwPrintSavePng').disabled=true;
 release();showStatus('正在載入目前照片並整理標記說明…');const seq=++workSeq;
 try{const data=(await media.getOriginal?.(src.photo.id).catch(()=>null))||(await media.get(src.photo.id));
  if(!data)throw Error('目前裝置沒有這張照片的圖檔。請先還原含照片的完整備份。');
  const img=await imageFromData(data);
  const result=await renderSheet(src,img);if(seq!==workSeq)return;
  if(!result.fit){showStatus(result.message,true);return;}
  currentCanvas=result.canvas;
  const blob=await new Promise((resolve,reject)=>currentCanvas.toBlob(b=>b?resolve(b):reject(Error('無法產生列印影像')),'image/png'));
  if(seq!==workSeq)return;
  currentUrl=URL.createObjectURL(blob);const preview=$('hwPrintImage');preview.src=currentUrl;
  await new Promise((resolve,reject)=>{if(preview.complete&&preview.naturalWidth)return resolve();preview.onload=resolve;preview.onerror=()=>reject(Error('列印預覽載入失敗'));});
  ready=true;document.body.classList.add('hw-photo-print-open');$('hwPrintDo').disabled=false;$('hwPrintSavePng').disabled=false;showStatus(result.message);
 }catch(err){if(seq===workSeq)showStatus('產生列印版失敗：'+(err.message||err),true);}
 finally{btn.disabled=false;}
}
btn.addEventListener('click',open);
$('hwPrintDo').addEventListener('click',()=>{if(!ready)return;window.print();});
$('hwPrintSavePng').addEventListener('click',()=>{if(!ready||!currentUrl)return;const src=source();const name=(src?.device.name||'設備').replace(/[\\/:*?"<>|]/g,'_').slice(0,36);
 const a=make('a');a.href=currentUrl;a.download=`${name}_照片標記_A4.png`;document.body.appendChild(a);a.click();a.remove();});
window.HWPhotoPrintV111214={renderSheet,records,chooseLayout,open,close};
})();
