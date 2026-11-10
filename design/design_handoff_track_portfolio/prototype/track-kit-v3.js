(function(){
if (window.buildKit3) return;
function need(){ return window.buildKit2 && window.buildKit2(); }
function make(){
const K2=need(); const {PAL16,CH,TILES,toCanvas,outline,drawBubble,drawPlate,drawYear,drawSignal,drawReferee,runnerGrid,tileRepeat}=K2;
function grid(w,h){ return {w,h,p:Array.from({length:h},()=>Array(w).fill(null))}; }
function set(g,x,y,c){ if(x>=0&&y>=0&&x<g.w&&y<g.h) g.p[y][x]=c; }
function get(g,x,y){ return (x>=0&&y>=0&&x<g.w&&y<g.h)?g.p[y][x]:null; }
function fill(g,x0,y0,x1,y1,c){ for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++) set(g,x,y,c); }
function box(g,x0,y0,x1,y1,c){ fill(g,x0,y0,x1,y0,c); fill(g,x0,y1,x1,y1,c); fill(g,x0,y0,x0,y1,c); fill(g,x1,y0,x1,y1,c); }
function clone(s){ const g=grid(s.w,s.h); s.p.forEach((r,y)=>r.forEach((c,x)=>g.p[y][x]=c)); return g; }
function ell(g,cx,cy,rx,ry,c,o){ const pts=[]; for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){ const dx=(x+.5-cx)/rx, dy=(y+.5-cy)/ry; if(dx*dx+dy*dy<=1) pts.push([x,y]); }
  const S=new Set(pts.map(p=>p+'')); pts.forEach(([x,y])=>set(g,x,y,c));
  if(o) pts.forEach(([x,y])=>{ if(!S.has([x+1,y]+'')||!S.has([x-1,y]+'')||!S.has([x,y+1]+'')||!S.has([x,y-1]+'')) set(g,x,y,o); }); }

// water stations: recolor roof rows only
function water(roof,dark){ const g=clone(K2.spriteFor('waterA')); for(let y=0;y<=8;y++)for(let x=0;x<64;x++){ const c=g.p[y][x]; if(c==='b') g.p[y][x]=roof; else if(c==='T') g.p[y][x]=dark; } return g; }

// ---- props 32×32 ----
const PROPS=[
 ['bench','벤치',g=>{ fill(g,6,11,25,13,'b'); box(g,5,10,26,14,'T'); fill(g,7,15,7,16,'g'); fill(g,24,15,24,16,'g'); fill(g,6,18,25,20,'b'); box(g,5,17,26,21,'T'); fill(g,7,22,7,27,'g'); fill(g,24,22,24,27,'g'); fill(g,4,28,27,28,'S'); }],
 ['cone','콘',g=>{ fill(g,15,10,16,10,'h'); for(let y=11;y<=24;y++){ const h=Math.round((y-11)*0.42)+1, xl=16-h, xr=15+h; fill(g,xl,y,xr,y,(y===17||y===18)?'w':'a'); set(g,xl,y,'h'); set(g,xr,y,'h'); }
   fill(g,8,25,23,26,'a'); box(g,7,25,24,27,'h'); fill(g,7,28,24,28,'S'); }],
 ['bottle','물통',g=>{ fill(g,14,8,17,10,'w'); box(g,13,7,18,10,'T'); fill(g,13,12,18,26,'t'); box(g,12,11,19,27,'T'); fill(g,13,17,18,19,'w'); fill(g,14,13,14,15,'w'); fill(g,11,28,20,28,'S'); }],
 ['bag','가방',g=>{ fill(g,12,11,19,11,'T'); fill(g,12,12,12,16,'T'); fill(g,19,12,19,16,'T'); fill(g,7,17,24,26,'b'); box(g,6,16,25,27,'T'); fill(g,9,17,9,26,'T'); fill(g,22,17,22,26,'T'); fill(g,10,19,21,19,'e'); fill(g,6,28,25,28,'S'); }],
 ['towel','수건 걸이',g=>{ fill(g,7,7,24,8,'m'); fill(g,7,8,24,8,'g'); fill(g,8,9,8,26,'m'); fill(g,9,9,9,26,'g'); fill(g,23,9,23,26,'m'); fill(g,24,9,24,26,'g');
   fill(g,11,9,20,21,'w'); box(g,11,9,20,22,'e'); fill(g,12,19,19,19,'e'); fill(g,6,27,10,27,'g'); fill(g,21,27,25,27,'g'); fill(g,5,28,26,28,'S'); }],
 ['grassA','잔디 패치 1',g=>{ ell(g,16,21.5,11,6,'D'); const t=(x,y)=>{ set(g,x,y,'G'); set(g,x-1,y-1,'D'); set(g,x+1,y-1,'D'); set(g,x-2,y-2,'D'); set(g,x+2,y-2,'D'); set(g,x,y-3,'D'); }; t(10,21); t(17,24); t(23,20); }],
 ['grassB','잔디 패치 2',g=>{ const t=(x,y)=>{ set(g,x,y,'D'); set(g,x-1,y-1,'D'); set(g,x+1,y-1,'D'); set(g,x,y-2,'D'); }; t(9,24); t(22,25);
   [[14,16],[20,19]].forEach(([x,y])=>{ set(g,x,y,'a'); set(g,x-1,y,'w'); set(g,x+1,y,'w'); set(g,x,y-1,'w'); set(g,x,y+1,'w'); }); }],
 ['cooler','아이스박스',g=>{ fill(g,8,14,23,17,'t'); box(g,7,13,24,17,'T'); fill(g,8,18,23,26,'w'); fill(g,7,18,7,27,'e'); fill(g,24,18,24,27,'e'); fill(g,7,27,24,27,'e'); fill(g,13,11,18,11,'T'); fill(g,13,12,13,12,'T'); fill(g,18,12,18,12,'T'); fill(g,6,28,25,28,'S'); }]
];
const PROP_SPR={}; PROPS.forEach(([id,,fn])=>{ const g=grid(32,32); fn(g); PROP_SPR[id]=g; });
function propSheet(cols){ cols=cols||7; const rows=Math.ceil(PROPS.length/cols); const g=grid(32*cols,32*rows);
  PROPS.forEach(([id],i)=>{ const s=PROP_SPR[id], ox=(i%cols)*32, oy=Math.floor(i/cols)*32; for(let y=0;y<32;y++)for(let x=0;x<32;x++) if(s.p[y][x]) g.p[oy+y][ox+x]=s.p[y][x]; }); return g; }

// ---- world ----
const W=640,H=360, STANDS=32, c=180, Ro=116, Ri=84, a=180, b=460, LINES=[Ri,Ri+10,Ri+21], SX=320;
const ITEMS=[
  {id:'tent',x:40,y:98,label:'SKILL'},
  {id:'waterA',x:224,y:64,label:'PROJECT 1'},{id:'waterB',x:416,y:64,label:'PROJECT 2'},
  {id:'board',x:320,y:140,label:'CAREER'},
  {id:'arch',x:320,y:299,label:'ABOUT',banner:'START'},
  {id:'table',x:216,y:340,label:'RESUME'},
  {id:'signal',x:392,y:360},{id:'referee',x:428,y:356}
];
function drawBoardWide(blank){ const g=grid(96,32), R=93;
  fill(g,2,0,R,21,'m'); box(g,2,0,R,21,'g'); fill(g,3,1,R-1,1,'e'); fill(g,3,1,3,20,'e');
  fill(g,5,3,R-3,18,'k'); box(g,4,2,R-2,19,'g');
  if(!blank) [[9,5,'a'],[10,5,'a'],[30,15,'G'],[31,15,'G'],[52,6,'w'],[70,12,'a'],[84,7,'w'],[16,14,'w']].forEach(([x,y,c])=>set(g,x,y,c));
  [[20,23],[72,75]].forEach(([p,q])=>{ fill(g,p,22,q-1,29,'m'); fill(g,q,22,q,29,'g'); fill(g,p-2,30,q+2,30,'g'); fill(g,p-3,31,q+3,31,'S'); });
  return g; }
function sprite(id,st){ st=st||{};
  switch(id){ case 'waterA': return water('t','T'); case 'waterB': return water('a','h');
    case 'board': return drawBoardWide(false);
    case 'signal': return drawSignal(st.signal!=null?st.signal:0); case 'referee': return drawReferee(st.flagUp!==false);
    default: return K2.spriteFor(id); } }
function dist(x,y){ const px=x+.5, py=y+.5; const t=Math.max(a,Math.min(b,px)); return Math.hypot(t-px,c-py); }
function hash(x,y){ let h=(x*374761393 + y*668265263)|0; h=(h^(h>>>13))*1274126177|0; return (h^(h>>>16))>>>0; }
function isStand(x,y,d){ return y<STANDS || x>=592 || (x>=512&&y<64&&d>=Ro+8) || (x<48&&y>=128); }
function worldBG(){
  const g=grid(W,H), band=Array.from({length:H},()=>Array(W).fill(false));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){ const d=dist(x,y), fd=Math.floor(d); let v;
    if(d<Ri) v='G';
    else if(d<Ro){ band[y][x]=true; if(fd===Ro-1) v='o'; else if(LINES.includes(fd)) v='w'; else v=TILES.track.p[y%32][x%32]; if(x===SX&&y>c&&fd<Ro-1) v='w'; }
    else if(isStand(x,y,d)) v=TILES.stand.p[y%32][x%32];
    else v='G';
    g.p[y][x]=v; }
  const SM=g.p.map((r,y)=>r.map((v,x)=>isStand(x,y,dist(x,y))&&dist(x,y)>=Ro));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){ if(SM[y][x]||g.p[y][x]!=='G') continue; if((y>0&&SM[y-1][x])||(x>0&&SM[y][x-1])||(x<W-1&&SM[y][x+1])) g.p[y][x]='D'; }
  [Ri+5,Ri+16,Ri+27].forEach(r=>{ const y=c+r; for(let i=2;i<=4;i++) set(g,SX-i,y,'w'); set(g,SX+2,y,'w'); });
  for(let ty=0;ty<Math.ceil(H/32);ty++)for(let tx=0;tx<W/32;tx++){ const h=hash(tx+77,ty+31); if(h%10!==0) continue;
    const x=tx*32+4+(h>>4)%24, y=ty*32+4+(h>>9)%24; const pts=[[0,0],[2,0],[1,1]]; if(pts.every(([p,q])=>get(g,x+p,y+q)==='G')) pts.forEach(([p,q])=>set(g,x+p,y+q,'D')); }
  return {g,band}; }
const BG=worldBG();
function bboxOf(it,spr){ const x0=it.x-Math.floor(spr.w/2), y0=it.y-spr.h; return {x0,y0,x1:x0+spr.w-1,y1:it.y-1}; }
const ITEM_BOX={}; ITEMS.forEach(it=>{ const bb=bboxOf(it,sprite(it.id)); if(it.label) bb.y0-=12; ITEM_BOX[it.id]=bb; });
function gap(A,B){ return Math.max(B.x0-A.x1-1, A.x0-B.x1-1, B.y0-A.y1-1, A.y0-B.y1-1); }
function region(bx){ const cx=bx.x0+16, cy=bx.y0+16; if(dist(cx,cy)<Ri) return 'infield'; if(bx.y0<STANDS+40) return 'stands'; return 'outer'; }
// prop placement: 16px candidate grid, hashed order, strict rules
const PLACED=(function(){
  const cand=[]; for(let y=STANDS+1;y<=H-32;y+=16)for(let x=0;x<=W-32;x+=16) cand.push({x0:x,y0:y,x1:x+31,y1:y+31});
  cand.sort((p,q)=>hash(p.x0+3,p.y0+11)-hash(q.x0+3,q.y0+11));
  const out=[], order=['bench','grassA','cone','bag','bottle','grassB','towel','cooler'];
  for(const bx of cand){ if(out.length>=18) break;
    let ok=true; for(let y=bx.y0;y<=bx.y1&&ok;y++)for(let x=bx.x0;x<=bx.x1;x++){ const v=BG.g.p[y][x]; if(v!=='G'&&v!=='D'){ ok=false; break; } }
    if(!ok) continue;
    if(Object.values(ITEM_BOX).some(B=>gap(bx,B)<64)) continue;
    if(out.some(o=>gap(bx,o)<16)) continue;
    out.push(Object.assign({},bx)); }
  out.sort((p,q)=>p.y0-q.y0||p.x0-q.x0).forEach((o,i)=>{ o.id=order[i%order.length]; o.region=region(o); });
  return out; })();
// ---- spectators 16×16 ----
function spectator(shirt,dark,hair,up){ const g=grid(16,16);
  fill(g,6,2,10,2,hair); fill(g,5,3,11,3,hair); fill(g,6,4,10,7,'s'); set(g,5,4,hair); set(g,11,4,hair); set(g,5,5,'o'); set(g,11,5,'o'); set(g,5,6,'o'); set(g,11,6,'o');
  set(g,7,5,'k'); set(g,9,5,'k'); set(g,6,7,'o'); set(g,10,7,'o');
  fill(g,5,8,11,15,shirt); fill(g,4,9,4,15,dark); fill(g,12,9,12,15,dark); fill(g,11,9,11,15,dark); fill(g,6,8,10,8,shirt);
  if(up){ fill(g,3,2,3,8,'s'); fill(g,13,2,13,8,'s'); set(g,3,1,'o'); set(g,13,1,'o'); set(g,4,8,shirt); set(g,12,8,shirt); }
  else { fill(g,2,9,3,10,'s'); fill(g,13,9,14,10,'s'); set(g,1,8,'s'); set(g,15,8,'s'); }
  return g; }
const SPECT_KINDS=[['t','T','h'],['a','h','k'],['r','o','h'],['w','e','k']];
const SPECT_SPR=SPECT_KINDS.map(([a,b,h])=>[spectator(a,b,h,true),spectator(a,b,h,false)]);
const SPECTS=(function(){ const out=[];
  for(let y=0;y<=H-16;y+=16)for(let x=0;x<=W-16;x+=16){
    let ok=true; for(let yy=y;yy<y+16&&ok;yy++)for(let xx=x;xx<x+16;xx++){ if(!(isStand(xx,yy,dist(xx,yy))&&dist(xx,yy)>=Ro)){ ok=false; break; } }
    if(!ok) continue; const bx={x0:x,y0:y,x1:x+15,y1:y+15};
    if(Object.values(ITEM_BOX).some(B=>gap(bx,B)<2)) continue;
    const h=hash(x+5,y+9); if(h%100>=58) continue;
    out.push({x,y,kind:h%4,phase:(h>>>8)%2}); }
  return out; })();
function spectSheet(){ const g=grid(16*4,32); SPECT_SPR.forEach((fr,i)=>fr.forEach((s,j)=>{ for(let y=0;y<16;y++)for(let x=0;x<16;x++) if(s.p[y][x]) g.p[j*16+y][i*16+x]=s.p[y][x]; })); return g; }
// ---- intro helpers ----
const RM=100, LEN=1188;
function trackParam(x,y){ x+=.5; y+=.5;
  if(x>=a&&x<=b){ if(y>=c) return x>=SX?x-SX:LEN-(SX-x); return 140+Math.PI*RM+(b-x); }
  if(x>b){ const t=Math.atan2(y-c,x-b); return 140+(Math.PI/2-t)*RM; }
  const t=Math.atan2(y-c,x-a); const phi=t<0?-t:2*Math.PI-t; return 140+Math.PI*RM+(b-a)+(phi-Math.PI/2)*RM; }
function posAt(s){ s=((s%LEN)+LEN)%LEN; const L1=140, C=Math.PI*RM;
  if(s<L1) return {x:SX+s,y:c+RM,dir:'right'};
  if(s<L1+C){ const t=Math.PI/2-(s-L1)/RM; return {x:b+RM*Math.cos(t),y:c+RM*Math.sin(t),dir:t>Math.PI/4?'right':t<-Math.PI/4?'left':'up'}; }
  if(s<L1+C+(b-a)) return {x:b-(s-L1-C),y:c-RM,dir:'left'};
  if(s<L1+2*C+(b-a)){ const phi=Math.PI/2+(s-L1-C-(b-a))/RM; return {x:a+RM*Math.cos(-phi),y:c+RM*Math.sin(-phi),dir:phi<3*Math.PI/4?'left':phi>5*Math.PI/4?'right':'down'}; }
  return {x:a+(s-L1-2*C-(b-a)),y:c+RM,dir:'right'}; }
function revealMask(P,S){ const cv=document.createElement('canvas'); cv.width=W*S; cv.height=H*S; const ctx=cv.getContext('2d'); ctx.fillStyle='#000';
  for(let y=0;y<H;y++)for(let x=0;x<W;x++) if(trackParam(x,y)<=P) ctx.fillRect(x*S,y*S,S,S); return cv; }
function segS(set_,ax,ay,bx,by,r){ ax+=.5;ay+=.5;bx+=.5;by+=.5; const dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy;
  for(let y=Math.floor(Math.min(ay,by)-r-1);y<=Math.ceil(Math.max(ay,by)+r+1);y++)for(let x=Math.floor(Math.min(ax,bx)-r-1);x<=Math.ceil(Math.max(ax,bx)+r+1);x++){
    const px=x+.5,py=y+.5; let t=L?((px-ax)*dx+(py-ay)*dy)/L:0; t=Math.max(0,Math.min(1,t)); const qx=ax+t*dx-px,qy=ay+t*dy-py; if(qx*qx+qy*qy<=r*r+1e-6) set_.add(x+','+y); } return set_; }
function waveFrame(f){ const g=clone(runnerGrid('down',1));
  for(let y=20;y<=33;y++)for(let x=21;x<=26;x++){ const v=get(g,x,y); if(v==='s'||v==='o') g.p[y][x]=null; }
  const hand=f?[27,13]:[25,12]; const S_=new Set(); segS(S_,21,23,24,18,.7); segS(S_,24,18,hand[0],hand[1],.7);
  S_.forEach(k=>{ const [x,y]=k.split(',').map(Number); [[1,0],[-1,0],[0,1],[0,-1]].forEach(([p,q])=>{ if(!S_.has((x+p)+','+(y+q))&&!get(g,x+p,y+q)) set(g,x+p,y+q,'o'); }); });
  S_.forEach(k=>{ const [x,y]=k.split(',').map(Number); set(g,x,y,'s'); });
  fill(g,hand[0]-1,hand[1]-1,hand[0],hand[1],'s'); return g; }
function keycap(pressed){ const g=grid(16,16); const t=pressed?3:1;
  fill(g,1,t,14,14,'w'); box(g,0,t,15,15,'g'); set(g,0,t,null); set(g,15,t,null); set(g,0,15,null); set(g,15,15,null); fill(g,1,15,14,15,'g');
  fill(g,1,t+(pressed?9:10),14,14,'e'); fill(g,1,14,14,14,'m'); fill(g,1,t+(pressed?9:10),14,t+(pressed?9:10),'e'); return g; }
function speechPlate(){ const g=grid(24,18); fill(g,1,1,22,12,'w'); fill(g,2,0,21,0,'m'); fill(g,2,13,21,13,'m'); fill(g,0,2,0,11,'m'); fill(g,23,2,23,11,'m');
  set(g,1,1,'m'); set(g,22,1,'m'); set(g,1,12,'m'); set(g,22,12,'m'); fill(g,2,12,21,12,'e');
  fill(g,10,13,13,13,'w'); fill(g,11,14,12,14,'w'); set(g,9,13,'m'); set(g,14,13,'m'); set(g,10,14,'m'); set(g,13,14,'m'); set(g,11,15,'m'); set(g,12,15,'m'); return g; }
function boardBlank(){ return drawBoardWide(true); }
function shadowFor(v){ if(['r','o','w'].includes(v)) return 'o'; if(['b','T','e','m','g'].includes(v)) return 'T'; return 'D'; }
function compose(st){ st=st||{};
  const g=grid(W,H); BG.g.p.forEach((r,y)=>r.forEach((v,x)=>g.p[y][x]=v));
  const owner=Array.from({length:H},()=>Array(W).fill(null)), stats={onTrack:{},overlap:[]}, labels=[];
  SPECTS.forEach(p=>{ const spr=SPECT_SPR[p.kind][((st.cheer||0)+p.phase)%2]; for(let y=0;y<16;y++)for(let x=0;x<16;x++){ const v=spr.p[y][x]; if(v) g.p[p.y+y][p.x+x]=v; } });
  const list=ITEMS.filter(it=>!(st.hide||[]).includes(it.id)).map(it=>Object.assign({},it,{spr:(it.id==='board'&&st.boardBlank)?boardBlank():sprite(it.id,st)}));
  PLACED.forEach((p,i)=>list.push({id:'prop'+i,x:p.x0+16,y:p.y0+32,spr:PROP_SPR[p.id],prop:true}));
  const R=st.runner||{x:256,y:286,dir:'right'}; if(st.runner!==false) list.push({id:'runner',x:R.x,y:R.y,spr:R.spr||runnerGrid(R.dir,R.f||0),runner:true,sortY:R.top?9999:R.y});
  list.sort((p,q)=>(p.sortY||p.y)-(q.sortY||q.y));
  list.forEach(it=>{ let s=it.spr, x0=it.x-Math.floor(s.w/2), y0=it.y-s.h; const top=y0;
    if(st.outline&&it.label){ s=outline(s,'a'); x0--; y0--; }
    let on=0;
    for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){ const v=s.p[y][x]; if(!v) continue; const X=x0+x,Y=y0+y; if(X<0||Y<0||X>=W||Y>=H) continue;
      if(v!=='S'&&!it.runner){ if(BG.band[Y][X]) on++; const o=owner[Y][X]; if(o&&o!==it.id) stats.overlap.push(o+'/'+it.id); owner[Y][X]=it.id; }
      g.p[Y][X]= v==='S'?shadowFor(BG.g.p[Y][X]):v; }
    if(!it.runner) stats.onTrack[it.id]=on;
    if(it.label){ const w=it.label.length*8+6; const cx=Math.max(w/2+2,Math.min(W-w/2-2,it.x)); labels.push({kind:'plate',text:it.label,cx,cy:top-7});
      if(it.banner) labels.push({kind:'banner',text:it.banner,cx:it.x,cy:top+15}); }
    if(it.runner&&st.bubble){ const bb=drawBubble(st.bubbleUp!==false); for(let y=0;y<16;y++)for(let x=0;x<16;x++){ const v=bb.p[y][x]; if(v) set(g,it.x-8+x,y0-10+y,v); } } });
  stats.overlap=[...new Set(stats.overlap)];
  return {g,labels,stats}; }
return {isStandAt:(x,y)=>{ const d=dist(x,y); return isStand(x,y,d)&&d>=Ro; },SPECTS,SPECT_SPR,spectSheet,trackParam,posAt,revealMask,waveFrame,keycap,speechPlate,boardBlank,runnerGrid,LEN,BOARD_SCREEN:{x:277,y:111,w:86,h:16},PAL16,CH,TILES,W,H,ITEMS,ITEM_BOX,PLACED,PROPS,PROP_SPR,BG,c,Ri,Ro,dist,gap,sprite,propSheet,compose,toCanvas,tileRepeat,outline,drawBubble,drawPlate,drawYear,drawSignal,drawReferee};
}
let cache=null; window.buildKit3=function(){ if(!need()) return null; return cache||(cache=make()); };
})();
