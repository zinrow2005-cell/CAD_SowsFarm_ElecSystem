/* V11.12.15 – Self-contained CAD exchange center. No network, no state writes.
 * SVG is the canonical snapshot; DXF exports vector geometry with named layers,
 * PNG/PDF render that snapshot and can be shared with other applications.
 */
(function(root){'use strict';
const NS='http://www.w3.org/2000/svg', api=root.HWEquipment;
const $=id=>document.getElementById(id);
if(!api||!$('plan')||!$('v84BackupContents'))return;
const COLORS={electric:'#ffc96e',water:'#65caff',feed:'#c592f4',ventilation:'#88dfaf',equipment:'#d7a7f5'};
const GROUPNAME={electric:'電線',water:'水管',feed:'送料管',ventilation:'通風線',equipment:'設備'};
const LIMIT=2000;
const el=(tag,attrs={},text)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>{if(v!==undefined&&v!==null)n.setAttribute(k,String(v));});if(text!=null)n.textContent=String(text);return n;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const number=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const round=n=>Math.round(n*10000)/10000;
const safeText=(v,n=100)=>(String(v??'').replace(/[\r\n\t]/g,' ').trim().slice(0,n));
const blankGroup=()=>el('g',{});
function geomBounds(){const plan=$('plan'),r=plan.querySelector(':scope > rect');if(r){return {x:number(r.getAttribute('x')),y:number(r.getAttribute('y')),w:number(r.getAttribute('width'),70),h:number(r.getAttribute('height'),80)};}const b=plan.viewBox.baseVal;return {x:b.x,y:b.y,w:b.width,h:b.height};}
function isVisible(n){let t=n;while(t&&t!==$('plan')){if(t.nodeType===1){const s=getComputedStyle(t);if(s.display==='none'||s.visibility==='hidden'||s.opacity==='0')return false;}t=t.parentElement;}return true;}
function typeFor(t){return api.getType(t)||{group:'equipment',shape:'circle',label:'設備'};}
function buildBase(out,opts){const src=$('plan');let count=0;for(const g of src.querySelectorAll(':scope > g.cad-layer')){
 if(!opts.includeHidden&&!isVisible(g))continue;
 const copy=g.cloneNode(true);copy.removeAttribute('id');copy.removeAttribute('class');copy.removeAttribute('tabindex');copy.removeAttribute('role');copy.removeAttribute('aria-hidden');copy.removeAttribute('style');copy.setAttribute('data-cad-export-layer',safeText(g.dataset.layer||'BASE',70));
 // Remove every hidden-state style only when hidden layer export is explicitly requested.
 if(opts.includeHidden){copy.querySelectorAll('[style]').forEach(ch=>{ch.style.removeProperty('display');ch.style.removeProperty('visibility');});}
 copy.querySelectorAll('title,script,foreignObject').forEach(n=>n.remove());
 out.appendChild(copy);count++;
 }return count;
}
function dimensions(d){const g=typeFor(d.type),a=root.HWRouteAnchorsV111213;
 if(a?.dims)return a.dims({...d,defaultShape:g.shape});
 const scale=number(d.size,75)/100;return{x:number(d.displayX,d.x),y:number(d.displayY,d.y),rx:scale,ry:scale,rotation:number(d.rotation)*Math.PI/180,shape:d.shape||g.shape||'circle'};
}
function linkedPoint(p,near,devices){const d=p.deviceId&&devices.get(p.deviceId),anchors=root.HWRouteAnchorsV111213;
 if(!d)return{x:number(p.x),y:number(p.y)};
 const formal={...d,defaultShape:typeFor(d.type).shape};
 if(anchors){if(p.edge){const q=anchors.resolve(formal,p.edge);if(q)return q;}
  return anchors.boundary(formal,near||{x:number(p.x),y:number(p.y)});}
 return{x:number(d.displayX,d.x),y:number(d.displayY,d.y)};
}
function routeCoords(r,devices){return (r.points||[]).map((p,i,arr)=>{
 const near=arr[i===arr.length-1?i-1:i+1]||p,n=near.deviceId&&devices.get(near.deviceId);
 return linkedPoint(p,n?{x:number(n.displayX,n.x),y:number(n.displayY,n.y)}:{x:number(near.x),y:number(near.y)},devices);
 });}
function addRoutes(out,project,opts){const vis=api.getVisibility?.()||{},devices=new Map(project.devices.map(d=>[d.id,d]));let n=0;
 for(const r of project.routes){if(opts.mode==='visible'&&vis[r.group]===false)continue;
  const coords=routeCoords(r,devices);if(coords.length<2)continue;
  const g=el('g',{'data-cad-export-layer':'ROUTE_'+(r.group||'other').toUpperCase(),'data-eq-route':r.id});
  const color=COLORS[r.group]||'#a4daca';
  g.appendChild(el('polyline',{points:coords.map(p=>`${round(p.x)},${round(p.y)}`).join(' '),fill:'none',stroke:color,'stroke-width':'.19','stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':r.group==='feed'?'.18 .1':'.42 .22'}));
  if(opts.labels&&(opts.mode!=='visible'||vis.labels!==false)){const p=coords[Math.floor(coords.length/2)];g.appendChild(el('text',{x:round(p.x),y:round(p.y-.38),fill:color,'font-size':'.48','text-anchor':'middle'},safeText(r.name,55)));}
  out.appendChild(g);n++;
 }return n;}
function outlineShape(g,d,sz){const color=d.color||COLORS[typeFor(d.type).group]||'#82bfd8',attrs={fill:'#123146',stroke:color,'stroke-width':'.12'};let s;
 switch(sz.shape){case 'square':case 'rect':s=el('rect',{x:-sz.rx,y:-sz.ry,width:sz.rx*2,height:sz.ry*2,rx:Math.min(.16,sz.ry/4),...attrs});break;
 case 'diamond':s=el('path',{d:`M0 ${-sz.ry} L${sz.rx} 0 L0 ${sz.ry} L${-sz.rx} 0 Z`,...attrs});break;
 case 'hex':s=el('path',{d:`M0 ${-sz.ry} L${sz.rx} ${-sz.ry*.5} L${sz.rx} ${sz.ry*.5} L0 ${sz.ry} L${-sz.rx} ${sz.ry*.5} L${-sz.rx} ${-sz.ry*.5} Z`,...attrs});break;
 default:s=el('ellipse',{rx:sz.rx,ry:sz.ry,...attrs});break;
 }g.appendChild(s);
}
function addEquipment(out,project,opts){const vis=api.getVisibility?.()||{};let count=0;
 for(const d of project.devices){const type=typeFor(d.type);if(opts.mode==='visible'&&vis[type.group]===false)continue;
  const sz=dimensions(d),color=d.color||COLORS[type.group]||'#d7a7f5';
  const group=el('g',{'data-cad-export-layer':'DEVICE_'+(type.group||'equipment').toUpperCase(),'data-eq-device':d.id});
  const moved=el('g',{transform:`translate(${round(sz.x)} ${round(sz.y)}) rotate(${round(number(d.rotation))})`});
  outlineShape(moved,d,sz);
  const symbol=String(type.symbol||type.label||'設備').slice(0,4);
  moved.appendChild(el('text',{'text-anchor':'middle',y:'.17','font-size':clamp(Math.min(sz.rx,sz.ry)*.68,.23,.73),fill:'#e8f7ff','font-weight':'650'},symbol));
  group.appendChild(moved);
  if(opts.labels&&d.showLabel!==false&&(opts.mode!=='visible'||vis.labels!==false)){group.appendChild(el('text',{x:round(sz.x),y:round(sz.y+sz.ry+.56),'text-anchor':'middle','font-size':'.46',fill:color},safeText(d.name,65)));}
  out.appendChild(group);count++;
 }return count;}
function snapshot(options={}){
 const opts={mode:options.mode||'full',includeHidden:!!options.includeHidden,labels:options.labels!==false,background:options.background||'dark'};
 if(!['base','full','visible'].includes(opts.mode))throw Error('圖面範圍不正確');
 const bounds=geomBounds();if(bounds.w<=0||bounds.h<=0)throw Error('CAD 視圖尺寸不正確');
 const svg=el('svg',{xmlns:NS,viewBox:`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`,width:`${bounds.w*15}mm`,height:`${bounds.h*15}mm`,style:'font-family:Arial, "Noto Sans TC", "Microsoft JhengHei", sans-serif;'});
 const bg=opts.background==='light'?'#ffffff':'#0b1d2a';svg.appendChild(el('rect',{x:bounds.x,y:bounds.y,width:bounds.w,height:bounds.h,fill:bg,'data-export-background':'true'}));
 const baseCount=buildBase(svg,opts);
 let deviceCount=0,routeCount=0;
 if(opts.mode!=='base'){
  const project=api.getData();
  if(project.devices.length>LIMIT||project.routes.length>LIMIT)throw Error('設備或線路數量超出可匯出範圍');
  routeCount=addRoutes(svg,project,opts);deviceCount=addEquipment(svg,project,opts);
 }
 if(opts.background==='light'){
  // Recolor the predominantly light-on-dark base layers for legible white-paper export.
  svg.querySelectorAll('[data-cad-export-layer]').forEach(g=>{
   if(!g.getAttribute('data-cad-export-layer').startsWith('ROUTE_')&&!g.getAttribute('data-cad-export-layer').startsWith('DEVICE_')){
    const col=g.getAttribute('stroke');if(col&&/^#[a-f0-9]{6}$/i.test(col)){
      const vals=[1,3,5].map(i=>parseInt(col.slice(i,i+2),16));
      if(Math.min(...vals)>140)g.setAttribute('stroke','#476279');
    }
    if(g.getAttribute('fill')&&/#[bcdef][0-9a-f]{5}/i.test(g.getAttribute('fill')))g.setAttribute('fill','#1f3f54');
    g.querySelectorAll('text').forEach(t=>{const c=t.getAttribute('fill');if(c&&/^#[a-f0-9]{6}$/i.test(c)&&parseInt(c.slice(1,3),16)>150)t.setAttribute('fill','#20445d');});
   }
  });
 }
 return{svg,bounds,summary:{baseLayers:baseCount,devices:deviceCount,routes:routeCount,mode:opts.mode}};
}
function svgString(snap){return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(snap.svg);}
function encodeUtf8(t){return new TextEncoder().encode(t);}
function saveBlob(blob,name){const href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),60000);}
function shapePaths(svg){const root=svg,items=[];
 const mult=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
 const transform=n=>{let m=[1,0,0,1,0,0],list=[],p=n;while(p&&p!==root){list.unshift(p);p=p.parentNode;}for(const k of list){const t=k.transform?.baseVal?.consolidate?.();if(t){const a=t.matrix;m=mult(m,[a.a,a.b,a.c,a.d,a.e,a.f]);}}return m;};
 const proj=(m,p)=>({x:m[0]*p.x+m[2]*p.y+m[4],y:m[1]*p.x+m[3]*p.y+m[5]});
 for(const n of svg.querySelectorAll('path,line,rect,circle,ellipse,polyline,polygon,text')){
  if(n.closest('[data-export-background]'))continue;
  if(n.closest('defs,clipPath,mask,symbol'))continue;
  const layer=n.closest('[data-cad-export-layer]')?.getAttribute('data-cad-export-layer')||'CAD_BASE';
  const m=transform(n),tag=n.localName;
  if(tag==='text'){
   const text=safeText(n.textContent,255);if(!text)continue;const p=proj(m,{x:number(n.getAttribute('x')),y:number(n.getAttribute('y'))});
   items.push({layer,text,p,font:number(n.getAttribute('font-size'),.4)*Math.hypot(m[2],m[3]),angle:-Math.atan2(m[1],m[0])*180/Math.PI});continue;
  }
  if(n.getAttribute('stroke')==='none'&&n.getAttribute('fill')==='none')continue;
  const emit=(points,closed=false)=>{if(points.length<2)return;const transformed=points.map(p=>proj(m,p));items.push({layer,points:transformed,closed});};
  if(tag==='line'){emit([{x:number(n.getAttribute('x1')),y:number(n.getAttribute('y1'))},{x:number(n.getAttribute('x2')),y:number(n.getAttribute('y2'))}]);continue;}
  if(tag==='rect'){const x=number(n.getAttribute('x')),y=number(n.getAttribute('y')),w=number(n.getAttribute('width')),h=number(n.getAttribute('height'));if(w>0&&h>0)emit([{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}],true);continue;}
  if(tag==='ellipse'||tag==='circle'){const cx=number(n.getAttribute('cx')),cy=number(n.getAttribute('cy')),rx=tag==='circle'?number(n.getAttribute('r')):number(n.getAttribute('rx')),ry=tag==='circle'?rx:number(n.getAttribute('ry'));if(rx>0&&ry>0){const p=[];for(let i=0;i<48;i++){const a=2*Math.PI*i/48;p.push({x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry});}emit(p,true);}continue;}
  if(tag==='polyline'||tag==='polygon'){
   const pts=String(n.getAttribute('points')||'').match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[];
   const p=[];for(let j=0;j+1<pts.length;j+=2)p.push({x:Number(pts[j]),y:Number(pts[j+1])});emit(p,tag==='polygon');continue;
  }
  if(tag==='path'){
   const d=n.getAttribute('d')||'',tokens=d.match(/[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[];
   // Most CAD paths use line commands; keep distinct subpaths separate.
   if(/[cCsSqQtTaA]/.test(d)){
     const length=n.getTotalLength?.()||0,steps=clamp(Math.ceil(length/.12),2,400);const pts=[];
     for(let i=0;i<=steps;i++){const p=n.getPointAtLength(length*i/steps);pts.push({x:p.x,y:p.y});}emit(pts,/z\s*$/i.test(d));continue;
   }
   let cmd='',i=0,x=0,y=0,start=null,pts=[];
   const flush=(closed=false)=>{emit(pts,closed);pts=[];};
   let guard=0;
   while(i<tokens.length&&guard++<20000){if(/^[a-zA-Z]$/.test(tokens[i]))cmd=tokens[i++];if(!cmd)break;
    const rel=cmd===cmd.toLowerCase(),c=cmd.toUpperCase();if(c==='Z'){flush(true);if(start){x=start.x;y=start.y;}cmd='';continue;}
    const need=c==='H'||c==='V'?1:2;if(i+need>tokens.length||/^[a-zA-Z]$/.test(tokens[i])){cmd='';continue;}
    const a=Number(tokens[i++]),b=need===2?Number(tokens[i++]):0;
    if(c==='M'){if(pts.length)flush();x=rel?x+a:a;y=rel?y+b:b;start={x,y};pts.push({x,y});cmd=rel?'l':'L';continue;}
    if(c==='L'){x=rel?x+a:a;y=rel?y+b:b;}else if(c==='H')x=rel?x+a:a;else if(c==='V')y=rel?y+a:a;else{cmd='';continue;}pts.push({x,y});
   }if(pts.length)flush();
  }
 }
 return items;
}
function dxfString(snap){const objects=shapePaths(snap.svg),unique=[...new Set(objects.map(o=>o.layer))];
 const slug=s=>String(s||'CAD').replace(/[<>/\\":;?*|=\r\n\x00-\x1f]/g,'_').slice(0,100)||'CAD';
 const layerNames=new Map(unique.map(l=>[l,slug(l)]));const lines=[];const p=(...a)=>lines.push(...a.map(String));
 p(0,'SECTION',2,'HEADER',9,'$ACADVER',1,'AC1021',9,'$DWGCODEPAGE',3,'UTF-8',9,'$INSUNITS',70,6,0,'ENDSEC');
 p(0,'SECTION',2,'TABLES',0,'TABLE',2,'LAYER',70,unique.length);
 unique.forEach((l,i)=>{const c=/ELECTRIC$/.test(l)?2:/WATER$/.test(l)?4:/FEED$/.test(l)?6:/VENTILATION$/.test(l)?3:/EQUIPMENT$/.test(l)?5:7;p(0,'LAYER',2,layerNames.get(l),70,0,62,c,6,'CONTINUOUS');});
 p(0,'ENDTAB',0,'ENDSEC',0,'SECTION',2,'ENTITIES');
 for(const o of objects){const layer=layerNames.get(o.layer);
  if(o.text){p(0,'TEXT',100,'AcDbEntity',8,layer,100,'AcDbText',10,round(o.p.x),20,round(-o.p.y),30,0,40,round(clamp(o.font,.05,100)),1,o.text,50,round(o.angle||0));continue;}
  if(o.points.length<2)continue;
  p(0,'LWPOLYLINE',100,'AcDbEntity',8,layer,100,'AcDbPolyline',90,o.points.length,70,o.closed?1:0);
  o.points.forEach(q=>p(10,round(q.x),20,round(-q.y)));
 }
 p(0,'ENDSEC',0,'EOF');
 return lines.join('\r\n')+'\r\n';
}
async function renderCanvas(snap,pixels=2200){const {w,h}=snap.bounds;const scale=clamp(pixels/Math.max(w,h),1,4096/Math.max(w,h));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
 const svg=svgString(snap);const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob);
 try{const img=new Image();img.decoding='sync';await new Promise((yes,no)=>{img.onload=yes;img.onerror=()=>no(Error('SVG 圖面無法轉換成圖片'));img.src=url;});const ctx=canvas.getContext('2d');if(!ctx)throw Error('圖片繪製資源不足');ctx.drawImage(img,0,0,canvas.width,canvas.height);return canvas;}finally{URL.revokeObjectURL(url);}
}
function toBlob(canvas,type='image/png',quality){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('圖片轉換失敗')),type,quality));}
function binaryPDF(jpeg,pw,ph){ // One-page ISO A4 PDF, rendered image with white margins.
 const portrait=ph>=pw, W=portrait?595.276:841.890,H=portrait?841.890:595.276;
 const margin=23,ratio=Math.min((W-margin*2)/pw,(H-margin*2)/ph),w=pw*ratio,h=ph*ratio,x=(W-w)/2,y=(H-h)/2;
 const b=new Uint8Array(jpeg),encoder=new TextEncoder(),parts=[],offset=[0],version=encodeUtf8('%PDF-1.4\n');let pos=0;
 const push=bytes=>{parts.push(bytes);pos+=bytes.length;};const line=str=>push(encoder.encode(str));
 push(version);
 const obj=(i,body)=>{offset[i]=pos;line(`${i} 0 obj\n${body}\nendobj\n`);};
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
 offset[4]=pos;line(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pw} /Height ${ph} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${b.length} >>\nstream\n`);push(b);line('\nendstream\nendobj\n');
 const cmd=`q\n${w.toFixed(3)} 0 0 ${h.toFixed(3)} ${x.toFixed(3)} ${y.toFixed(3)} cm\n/Im0 Do\nQ\n`;
 obj(5,`<< /Length ${encoder.encode(cmd).length} >>\nstream\n${cmd}endstream`);
 const xref=pos;line('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)line(String(offset[i]).padStart(10,'0')+' 00000 n \n');line(`trailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n${xref}\n%%EOF\n`);
 return new Blob(parts,{type:'application/pdf'});
}
async function createFile(format,options={}){const snap=snapshot(options),stamp=new Date().toISOString().slice(0,10),name=`虎尾場_CAD_${snap.summary.mode}_${stamp}`;
 if(format==='svg')return{blob:new Blob([svgString(snap)],{type:'image/svg+xml;charset=utf-8'}),name:name+'.svg',summary:snap.summary};
 if(format==='dxf')return{blob:new Blob([dxfString(snap)],{type:'application/dxf;charset=utf-8'}),name:name+'.dxf',summary:snap.summary};
 if(format==='png'){const canvas=await renderCanvas(snap,options.pixels||2400);return{blob:await toBlob(canvas),name:name+'.png',summary:snap.summary};}
 if(format==='pdf'){const canvas=await renderCanvas(snap,options.pixels||2400);const jpeg=await toBlob(canvas,'image/jpeg',.94);return{blob:binaryPDF(await jpeg.arrayBuffer(),canvas.width,canvas.height),name:name+'.pdf',summary:snap.summary};}
 throw Error('不支援的格式');
}
const button=document.createElement('button');button.type='button';button.id='v111215Open';button.className='v82-btn primary';button.textContent='▣ 匯出 CAD 圖（DXF／SVG／PNG／PDF）';
const group=document.createElement('div');group.className='v82-actions';group.appendChild(button);$('v84BackupContents').prepend(group);
const overlay=document.createElement('div');overlay.id='v111215ExportOverlay';overlay.hidden=true;overlay.innerHTML=`<section class="v111215-export-modal" role="dialog" aria-modal="true" aria-labelledby="v111215Title">
 <header><div><small>HUWEI FARM · CAD EXCHANGE</small><h2 id="v111215Title">CAD 圖面匯出中心</h2><p>把目前的 CAD、設備、電線、水管及送料管匯出給其他系統</p></div><button id="v111215Close" type="button" aria-label="關閉匯出中心">✕</button></header>
 <div class="v111215-body"><label>圖面範圍<select id="v111215Mode"><option value="full">完整配置（底圖＋所有設備與線路）</option><option value="base">僅 CAD 底圖</option><option value="visible">只匯出目前開啟的圖層／設備類別</option></select></label>
 <label>檔案格式<select id="v111215Format"><option value="dxf">DXF — 可供 CAD 軟體繼續編輯</option><option value="svg">SVG — 網頁與向量設計系統</option><option value="png">PNG — 圖片／其他管理系統底圖</option><option value="pdf">PDF — 閱讀、列印與分享</option></select></label>
 <div class="v111215-opts"><label><input id="v111215Labels" type="checkbox" checked/> 包含設備名稱／線路名稱</label><label><input id="v111215Hidden" type="checkbox"/> 另外包含隱藏的 CAD 底圖圖層</label><label><input id="v111215Light" type="checkbox"/> 白底（適合列印）</label></div>
 <div id="v111215Status" role="status" aria-live="polite">匯出的資料直接取自這台裝置目前的系統，沒有上傳到伺服器。</div>
 <p class="v111215-note">DXF：CAD 線條與設備示意符號分圖層，可再次編輯；複雜曲線採分段近似。SVG：向量原圖；PNG/PDF：影像輸出。DXF 座標將 SVG Y 軸反向以符合常見 CAD 笛卡兒座標。照片及私人維修紀錄不會包含在 CAD 圖內。</p>
 </div><footer><button type="button" id="v111215Preview">預覽圖面</button><button type="button" id="v111215Download" class="primary">下載匯出檔</button></footer>
 <div id="v111215PreviewHost" hidden><div class="v111215-previewhead"><strong>圖面預覽</strong><button id="v111215PreviewClose" type="button">關閉預覽</button></div><div id="v111215PreviewImage"></div></div>
 </section>`;
document.body.appendChild(overlay);
const options=()=>({mode:$('v111215Mode').value,includeHidden:$('v111215Hidden').checked,labels:$('v111215Labels').checked,background:$('v111215Light').checked?'light':'dark'});
let busy=false;
function status(t,isError=false){$('v111215Status').textContent=t;$('v111215Status').classList.toggle('error',isError);}
function open(){overlay.hidden=false;status('直接匯出目前裝置上已儲存的設備與管線資料；不會改動現有 CAD 或備份。');}
function close(){if(busy)return;overlay.hidden=true;$('v111215PreviewHost').hidden=true;$('v111215PreviewImage').replaceChildren();}
button.addEventListener('click',open);$('v111215Close').addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
$('v111215PreviewClose').addEventListener('click',()=>{$('v111215PreviewHost').hidden=true;$('v111215PreviewImage').replaceChildren();});
$('v111215Preview').addEventListener('click',async()=>{if(busy)return;busy=true;try{const snap=snapshot(options());const holder=$('v111215PreviewImage');holder.replaceChildren();const container=document.createElement('div');container.innerHTML=svgString(snap).replace(/^<\?xml[^>]*>\s*/,'');const svg=container.firstElementChild;svg.removeAttribute('width');svg.removeAttribute('height');svg.style.width='100%';svg.style.height='auto';svg.style.maxHeight='55vh';holder.appendChild(svg);$('v111215PreviewHost').hidden=false;status(`預覽完成：底圖 ${snap.summary.baseLayers} 層、設備 ${snap.summary.devices} 件、線路 ${snap.summary.routes} 條。`);}catch(e){status('預覽失敗：'+e.message,true);}finally{busy=false;}});
$('v111215Download').addEventListener('click',async()=>{if(busy)return;busy=true;const btn=$('v111215Download');btn.disabled=true;status('正在製作匯出檔…');try{const result=await createFile($('v111215Format').value,options());saveBlob(result.blob,result.name);status(`已產生 ${result.name}（底圖 ${result.summary.baseLayers} 層、設備 ${result.summary.devices} 件、線路 ${result.summary.routes} 條）。請檢查瀏覽器下載清單。`);}catch(e){status('匯出失敗：'+e.message,true);}finally{busy=false;btn.disabled=false;}});
root.HWCADExportV111215={snapshot,svgString,dxfString,shapePaths,renderCanvas,binaryPDF,createFile,open};
})(window);
