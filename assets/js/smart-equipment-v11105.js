/* V11.10.5 Repeating shapes render in CAD units. No stretched bitmaps and no actual line/device connections. */
(function(){'use strict';
 const colors={curtain:'#7fe6d8',ventWall:'#8cdaec',airInlet:'#6be2b8',airOutlet:'#efa67e',feedLine:'#e9b281',feedAuger:'#d3a8f4',feedTrough:'#e8c17d',mist:'#8de5f6',cableTrunk:'#ffe090',warningZone:'#f6c77d'};
 const N=(node,tag,a)=>node(tag,a);
 const line=(node,g,x1,y1,x2,y2,c,w=.06,attrs={})=>g.appendChild(N(node,'line',{x1,y1,x2,y2,stroke:c,'stroke-width':w,'stroke-linecap':'round',...attrs}));
 const rect=(node,g,x,y,w,h,c,fill='none',r=.03,sw=.06)=>g.appendChild(N(node,'rect',{x,y,width:w,height:h,rx:r,fill,stroke:c,'stroke-width':sw}));
 const circle=(node,g,x,y,r,c,fill='none',sw=.05)=>g.appendChild(N(node,'circle',{cx:x,cy:y,r,stroke:c,fill,'stroke-width':sw}));
 const arrow=(node,g,x,y,dir,c,sc=.24)=>{line(node,g,x-.38*sc,y,x+.38*sc*dir,y,c,.035);g.appendChild(N(node,'path',{d:`M ${x+.42*sc*dir} ${y} l ${-.2*sc*dir} ${-.18*sc} m ${.2*sc*dir} ${.18*sc} l ${-.2*sc*dir} ${.18*sc}`,stroke:c,fill:'none','stroke-width':'.035'}));};
 function fan(node,g,x,y,r,c){rect(node,g,x-r,y-r,r*2,r*2,c,'#153a4b',.07,.048);circle(node,g,x,y,r*.78,c,'none',.045);for(let k=0;k<4;k++){const a=k*Math.PI/2,ca=Math.cos(a),sa=Math.sin(a);g.appendChild(N(node,'path',{d:`M ${x} ${y} Q ${x+r*.68*ca-r*.25*sa} ${y+r*.68*sa+r*.25*ca} ${x+r*.69*ca} ${y+r*.69*sa} Q ${x+r*.88*ca+r*.18*sa} ${y+r*.88*sa-r*.18*ca} ${x} ${y}`,fill:c,opacity:'.78'}));}circle(node,g,x,y,.055,'#e8fdff','#e8fdff',.015);}
 function glyph(node,g,type,x,y,r,c){if(['fan','smallFan','guideFan','ceilingFan','roofFan'].includes(type))fan(node,g,x,y,r,c);
 else if(type==='lighting'){rect(node,g,x-r*.86,y-r*.62,r*1.72,r*1.24,c,'#153749',.08,.06);line(node,g,x-r*.53,y,x+r*.53,y,'#fff5c9',.18);line(node,g,x-r*.46,y-r*.25,x+r*.46,y-r*.25,c,.06);}
 else if(type==='drinker'){circle(node,g,x,y-r*.20,r*.43,c,'#174454',.055);line(node,g,x,y+r*.15,x,y+r*.60,c,.09);g.appendChild(N(node,'path',{d:`M ${x-r*.30} ${y+r*.62} Q ${x} ${y+r*.9} ${x+r*.30} ${y+r*.62}`,fill:'none',stroke:c,'stroke-width':'.06'}));}
 else if(type==='sprayer'){line(node,g,x-r*.70,y-r*.45,x+r*.70,y-r*.45,c,.09);line(node,g,x,y-r*.45,x,y-r*.08,c,.06);for(const a of [-.5,0,.5])circle(node,g,x+a*r,y+.40*r,.045,c,c,.01);}}
 function drawSegment(g,d,s,type,node){const L=s.length,H=s.thickness,h=L/2,top=-H/2,c=d.color||colors[d.type]||'#8de6df';
 const kind=d.type, style=(s.pattern==='auto'||!s.pattern||s.pattern==='grille'&&kind!=='curtain')?'auto':s.pattern;
 const cap=s.cap==='round'?Math.min(H*.45,.18):.025;
 rect(node,g,-h,top,L,H,c,'#102f40',cap,.085);
 const room=Math.max(.08,H*.20);
 if(style!=='auto'){
  if(style==='solid'){rect(node,g,-h+.12,top+.1,Math.max(.1,L-.24),Math.max(.02,H-.2),c,c,.02,.01);}
  else if(style==='dashes')line(node,g,-h+.15,0,h-.15,0,c,Math.min(.13,H*.25),{'stroke-dasharray':'.32 .2'});
  else {const step=style==='bars'?.45:.22;for(let x=-h+.18;x<h-.12;x+=step)line(node,g,x,top+room,x,-top-room,c,style==='bars'?.09:.057);}
 }else if(kind==='curtain'){
  for(let x=-h+.18;x<h-.14;x+=.21){line(node,g,x,top+room,x,-top-room,c,.066);}
  line(node,g,-h+.08,0,h-.08,0,'#e4fff7',.022,{opacity:'.7'});
 }else if(kind==='ventWall'){
  const count=Math.max(1,Math.min(55,Math.floor((L-.30)/Math.max(.58,H*.9))));
  for(let k=0;k<count;k++){const x=-h+(k+.5)*L/count;fan(node,g,x,0,Math.min(.35,H*.40,(L/count)*.41),c);}
 }else if(kind==='airInlet'||kind==='airOutlet'){
  const direction=kind==='airInlet'?-1:1;
  for(let x=-h+.18;x<h-.15;x+=.4)line(node,g,x-.08,top+room,x+.08,-top-room,c,.065);
  for(let x=-h+.70;x<h-.45;x+=1.75)arrow(node,g,x,0,direction,'#e6fdf2',Math.max(.48,Math.min(1,H*1.2)));
 }else if(kind==='feedAuger'){
  const wave=Math.max(.07,H*.29),pts=[];for(let k=0;k<=Math.min(300,Math.ceil(L/.075));k++){const x=-h+.12+(L-.24)*k/Math.min(300,Math.ceil(L/.075));pts.push(x.toFixed(3)+','+(Math.sin((x+h)*14)*wave).toFixed(3));}
  g.appendChild(N(node,'polyline',{points:pts.join(' '),stroke:c,'stroke-width':'.075',fill:'none'}));
 }else if(kind==='feedTrough'){
  const yTop=top+room*.55,yBottom=-top-room*.55;for(const y of [yTop,yBottom])line(node,g,-h+.12,y,h-.12,y,c,.075);for(let x=-h+.28;x<h-.18;x+=.55)line(node,g,x,yTop,x,yBottom,c,.045);
 }else if(kind==='feedLine'){
  line(node,g,-h+.1,0,h-.1,0,c,.10);
  for(let x=-h+.65;x<h-.25;x+=1.30){g.appendChild(N(node,'path',{d:`M ${x-.14} -.14 L ${x+.16} 0 L ${x-.14} .14`,stroke:'#ffead8','stroke-width':'.065',fill:'none'}));}
 }else if(kind==='mist'){
  line(node,g,-h+.08,-H*.14,h-.08,-H*.14,c,.06);
  for(let x=-h+.45;x<h-.2;x+=.85){line(node,g,x,-H*.14,x,H*.04,c,.06);for(const dx of [-.13,0,.13])circle(node,g,x+dx,H*.24,.028,c,c,.012);}
 }else if(kind==='cableTrunk'){
  const gap=Math.min(.13,H*.20);for(const y of [-gap,gap])line(node,g,-h+.12,y,h-.12,y,c,.077);
  for(let x=-h+.35;x<h-.2;x+=.76)line(node,g,x,-gap*1.7,x,gap*1.7,c,.045);
 }else if(kind==='warningZone'){
  const step=Math.max(.18,H*.38);for(let x=-h+.08;x<h-.07;x+=step){const x1=x,y1=top+.05,y2=-top-.05,dx=Math.min(step*.66,H*.4);line(node,g,x1,y2,Math.min(h-.08,x1+dx),y1,c,.055);}
 }else{for(let x=-h+.2;x<h-.15;x+=.32)line(node,g,x,top+room,x,-top-room,c,.05);}
 if(s.centerGlyph){rect(node,g,-.22,-.2,.44,.4,c,'#112839',.07,.05);g.appendChild(N(node,'text',{'text-anchor':'middle',y:'.1','font-size':'.25',fill:'#fff'},String(type.symbol||'段').slice(0,2)));}
 g.appendChild(N(node,'rect',{x:-h,y:top,width:L,height:H,fill:'transparent',class:'hit'}));
 }
 function drawArray(g,d,a,type,node){const count=Math.max(2,Math.min(20,Math.round(a.count||3))),spacing=Math.max(1.3,Math.min(25,Number(a.spacing)||2.3)),L=1.65+(count-1)*spacing,c=d.color||'#85ddea';
 const grp=N(node,'g',{'pointer-events':'none'});g.appendChild(grp);
 // One visual group; the repeated symbols are not independently editable/numbered assets.
 line(node,grp,-L/2+.2,0,L/2-.2,0,c,.05,{'stroke-dasharray':'.20 .16',opacity:'.54'});
 for(let k=0;k<count;k++){const x=(k-(count-1)/2)*spacing;glyph(node,grp,d.type,x,0,.68,c);}
 g.appendChild(N(node,'rect',{x:-L/2,y:-.825,width:L,height:1.65,fill:'transparent',class:'hit'}));
 }
 window.HWSmartEquipment={drawSegment,drawArray};
})();
