(function(){
if (typeof window!=='undefined' && window.buildKit2) return;
const PAL16 = {
  track:'#C0563F', trackDark:'#7E3226', skinShade:'#E3A68A', grass:'#6FB24B', grassDark:'#3E7A34',
  stand:'#6F86C2', standDark:'#3D4E86', metalLight:'#D6DBE3', metal:'#959EAE', metalDark:'#545D70',
  skin:'#F7CFB2', hair:'#5B3A2B', tee:'#2E9BE0', white:'#FFFFFF', accent:'#F5C431', ink:'#1E2638'
};
const CH = {k:'ink',h:'hair',l:'trackDark',s:'skin',d:'skinShade',o:'trackDark',r:'track',t:'tee',T:'standDark',
  w:'white',e:'metalLight',m:'metal',g:'metalDark',G:'grass',D:'grassDark',b:'stand',a:'accent'};
function grid(w,h){ return {w,h,p:Array.from({length:h},()=>Array(w).fill(null))}; }
function set(g,x,y,c){ if(x>=0&&y>=0&&x<g.w&&y<g.h) g.p[y][x]=c; }
function get(g,x,y){ return (x>=0&&y>=0&&x<g.w&&y<g.h)?g.p[y][x]:null; }
function fill(g,x0,y0,x1,y1,c){ for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++) set(g,x,y,c); }
function box(g,x0,y0,x1,y1,c){ fill(g,x0,y0,x1,y0,c); fill(g,x0,y1,x1,y1,c); fill(g,x0,y0,x0,y1,c); fill(g,x1,y0,x1,y1,c); }
function fromRows(rows){ const g=grid(rows[0].length,rows.length); rows.forEach((r,y)=>{ for(let x=0;x<r.length;x++) if(r[x]!=='.') g.p[y][x]=r[x]; }); return g; }
function shiftY(g,dy){ const n=grid(g.w,g.h); for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){ const c=g.p[y][x]; if(c) set(n,x,y+dy,c);} return n; }

// ---- tiles ----
function trackTile(){ const g=grid(32,32); fill(g,0,0,31,31,'r');
  [[4,6],[20,3],[12,17],[27,22],[6,27],[23,12]].forEach(([x,y])=>set(g,x,y,'o')); return g; }
function grassTile(){ const g=grid(32,32); fill(g,0,0,31,31,'G'); return g; }
function grassDotTile(){ const g=grassTile(); set(g,14,15,'D'); set(g,16,15,'D'); set(g,15,16,'D'); return g; }
function standTile(){ const g=grid(32,32);
  for(let y=0;y<32;y++){ const A=y<16, r=y%16; for(let x=0;x<32;x++){
    let c = A?'b':'T';
    if(r===0) c = A?'T':'g';
    if(r===7 && x%4===1) c = A?'e':'b';
    g.p[y][x]=c; } }
  return g; }
const TILES={track:trackTile(),grass:grassTile(),grassDot:grassDotTile(),stand:standTile()};

// ---- structures ----
function drawArch(){ const g=grid(96,64);
  [[8,19],[76,87]].forEach(([a,b])=>{ fill(g,a,0,b,60,'m'); box(g,a,0,b,60,'g'); fill(g,a+1,1,a+1,59,'e');
    for(let y=27;y<=51;y+=8){ for(let i=0;i<7;i++){ set(g,a+2+i,y+i,'g'); set(g,b-3-i,y+i,'g'); } }
    for(let y=26;y<=58;y+=8) fill(g,a+1,y,b-1,y,'g');
    fill(g,a-2,60,b+2,62,'g'); fill(g,a-1,61,b+1,61,'m'); fill(g,a-2,63,b+2,63,'S'); });
  fill(g,4,4,91,25,'t'); box(g,4,4,91,25,'T'); fill(g,7,7,88,22,'w'); box(g,7,7,88,22,'e');
  [[5,5],[90,5],[5,24],[90,24]].forEach(([x,y])=>set(g,x,y,'e'));
  return g; }
function drawTable(){ const g=grid(64,32);
  // table
  fill(g,3,15,60,15,'m'); fill(g,4,16,59,16,'w'); fill(g,3,16,3,27,'m'); fill(g,60,16,60,27,'m');
  fill(g,4,17,59,25,'w'); for(let x=14;x<59;x+=10) fill(g,x,18,x,25,'e'); fill(g,4,26,59,26,'e'); fill(g,3,27,60,27,'m');
  fill(g,7,28,8,30,'g'); fill(g,55,28,56,30,'g'); fill(g,2,31,61,31,'S');
  // paper stack
  fill(g,9,9,22,9,'m'); fill(g,8,10,8,14,'m'); fill(g,23,10,23,14,'m'); fill(g,9,10,21,14,'w'); fill(g,22,10,22,14,'e'); fill(g,9,12,22,12,'e'); fill(g,9,14,22,14,'e');
  // single sheet + pen
  fill(g,27,12,38,12,'m'); fill(g,26,13,26,14,'m'); fill(g,39,13,39,14,'m'); fill(g,27,13,38,14,'w'); fill(g,28,13,33,13,'e');
  set(g,35,10,'t'); set(g,36,11,'t'); set(g,37,12,'T');
  // box with slot
  fill(g,43,6,54,8,'e'); box(g,42,5,55,9,'T'); fill(g,45,7,52,7,'k');
  fill(g,43,10,54,14,'b'); fill(g,42,10,42,14,'T'); fill(g,55,10,55,14,'T'); fill(g,54,10,54,14,'T');
  return g; }
function drawWater(roof,roofDark){ const g=grid(64,32);
  fill(g,3,6,3,30,'m'); fill(g,4,6,4,30,'g'); fill(g,59,6,59,30,'m'); fill(g,60,6,60,30,'g');
  for(let x=1;x<=62;x++){ const c=(Math.floor((x-1)/8)%2===0)?roof:'w'; fill(g,x,1,x,5,c);
    const k=(x-1)%8; if(k>=1&&k<=6) set(g,x,6,c); if(k>=2&&k<=5) set(g,x,7,c); }
  fill(g,1,0,62,0,roofDark); fill(g,0,1,0,5,roofDark); fill(g,63,1,63,5,roofDark);
  for(let x=1;x<=62;x++){ const k=(x-1)%8; const y=(k===0||k===7)?6:(k===1||k===6)?7:8; set(g,x,y,roofDark); if(k===0||k===7) set(g,x,6,roofDark); }
  set(g,0,6,roofDark); set(g,63,6,roofDark);
  fill(g,46,10,51,10,'w'); box(g,45,9,52,10,'m'); fill(g,46,10,51,10,'w');
  fill(g,44,11,53,17,'t'); box(g,43,11,54,18,'T'); fill(g,45,12,45,16,'w'); fill(g,53,12,53,17,'T');
  [8,14,20,26,32].forEach(x=>{ fill(g,x,12,x+3,12,'m'); fill(g,x,13,x,17,'m'); fill(g,x+3,13,x+3,17,'m');
    fill(g,x+1,13,x+2,13,'t'); fill(g,x+1,14,x+1,17,'w'); fill(g,x+2,14,x+2,17,'e'); });
  fill(g,6,19,57,19,'w'); fill(g,5,18,58,18,'m'); fill(g,5,19,5,27,'m'); fill(g,58,19,58,27,'m');
  fill(g,6,20,57,26,'w'); for(let x=13;x<57;x+=8) fill(g,x,21,x,26,'e'); fill(g,6,26,57,26,'e'); fill(g,5,27,58,27,'m');
  fill(g,9,28,10,30,'g'); fill(g,53,28,54,30,'g'); fill(g,2,31,61,31,'S');
  return g; }
function drawBoard(){ const g=grid(64,32);
  fill(g,2,0,61,21,'m'); box(g,2,0,61,21,'g'); fill(g,3,1,60,1,'e'); fill(g,3,1,3,20,'e');
  fill(g,5,3,58,18,'k'); box(g,4,2,59,19,'g');
  [[9,5,'a'],[10,5,'a'],[52,6,'w'],[30,15,'G'],[31,15,'G'],[45,12,'a'],[16,14,'w']].forEach(([x,y,c])=>set(g,x,y,c));
  [[14,16],[47,49]].forEach(([a,b])=>{ fill(g,a,22,b-1,29,'m'); fill(g,b,22,b,29,'g'); fill(g,a-2,30,b+2,30,'g'); fill(g,a-3,31,b+3,31,'S'); });
  return g; }
function drawTent(){ const g=grid(64,64);
  fill(g,6,32,57,44,'T');
  fill(g,4,32,4,62,'m'); fill(g,5,32,5,62,'g'); fill(g,58,32,58,62,'m'); fill(g,59,32,59,62,'g');
  const top=8, base=27; let pl=31, pr=32;
  for(let y=top;y<=base;y++){ const t=(y-top)/(base-top); const xl=Math.round(31-29*t), xr=Math.round(32+29*t);
    for(let x=xl;x<=xr;x++) set(g,x,y,(Math.floor((x-2)/6)%2===0)?'r':'w');
    for(let x=Math.min(xl,pl);x<=Math.max(xl,pl);x++) set(g,x,y,'o');
    for(let x=Math.min(xr,pr);x<=Math.max(xr,pr);x++) set(g,x,y,'o'); pl=xl; pr=xr; }
  for(let x=2;x<=61;x++){ const c=(Math.floor((x-2)/6)%2===0)?'r':'w'; fill(g,x,28,x,30,c); const k=(x-2)%6; if(k>=1&&k<=4) set(g,x,31,c); }
  fill(g,1,27,62,27,'o'); fill(g,1,28,1,30,'o'); fill(g,62,28,62,30,'o');
  for(let x=2;x<=61;x++){ const k=(x-2)%6; set(g,x,(k===0||k===5)?31:32,'o'); }
  set(g,1,31,'o'); set(g,62,31,'o');
  fill(g,31,2,31,7,'g'); fill(g,32,2,35,4,'a');
  fill(g,10,43,53,44,'e'); box(g,9,42,54,45,'m'); fill(g,10,43,53,44,'e');
  fill(g,10,46,53,61,'b'); box(g,9,45,54,62,'T'); fill(g,53,46,53,61,'T');
  for(let x=16;x<50;x+=12) fill(g,x,48,x,59,'T');
  fill(g,3,63,60,63,'S');
  return g; }
function drawSignal(state){ const g=grid(32,64);
  fill(g,15,45,15,61,'m'); fill(g,16,45,16,61,'g'); fill(g,12,62,19,62,'g'); fill(g,11,63,20,63,'S');
  fill(g,8,1,23,43,'g'); box(g,7,0,24,44,'k'); fill(g,8,1,8,43,'m');
  [['r',8],['a',22],['G',36]].forEach(([c,cy],i)=>{ const on = state===i+1;
    fill(g,9,cy-6,22,cy-6,'k');
    for(let y=cy-4;y<=cy+5;y++)for(let x=11;x<=20;x++){ const dx=x-15.5, dy=y-cy-0.5; if(dx*dx+dy*dy<=21) set(g,x,y,on?c:'k'); }
    if(on){ set(g,13,cy-2,'w'); set(g,14,cy-3,'w'); } else { set(g,13,cy-2,'g'); } });
  return g; }
function drawBubble(up){ const rows=[
"...mmmmmmmmmm...","..mwwwwwwwwwwm..",".mwwwwwkkwwwwwm.",".mwwwwwkkwwwwwm.",".mwwwwwkkwwwwwm.",".mwwwwwkkwwwwwm.",
".mwwwwwkkwwwwwm.",".mwwwwwwwwwwwwm.",".mwwwwwkkwwwwwm.",".meeeeeeeeeeeem.","..mmmmeeemmmmm..","......mem.......",
".......m........","................","................","................"];
  const g=fromRows(rows); return up?g:shiftY(g,1); }
function drawYear(){ const w20='w'.repeat(20); return fromRows([
"..mmmmmmmmmmmmmmmmmmmm..",".m"+w20+"m.",".m"+w20+"m.",".m"+w20+"m.",".m"+w20+"m.",".m"+w20+"m.",".m"+w20+"m.",".m"+w20+"m.",
".m"+'e'.repeat(20)+"m.","..mmmmmmmmmeemmmmmmmmm..","...........mm...........","........................"]); }
function drawPlate(){ return fromRows([".kkkkkkkkkkkkkkkkkkkkkk."].concat(Array(8).fill("k"+"w".repeat(22)+"k")).concat([".kkkkkkkkkkkkkkkkkkkkkk."])); }
function outline(g,c){ const n=grid(g.w+2,g.h+2);
  for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){ const v=g.p[y][x]; if(v) n.p[y+1][x+1]=v; }
  const solid=(x,y)=>{ const v=get(g,x,y); return v&&v!=='S'; };
  for(let y=-1;y<=g.h;y++)for(let x=-1;x<=g.w;x++){ if(solid(x,y)) continue;
    if(solid(x+1,y)||solid(x-1,y)||solid(x,y+1)||solid(x,y-1)) n.p[y+1][x+1]=c; }
  return n; }

const RUNNER = (function(){
const PAL = {
  track:'#C0563F', trackDark:'#7E3226', skinShade:'#E3A68A', grass:'#6FB24B', grassDark:'#3E7A34',
  stand:'#6F86C2', standDark:'#3D4E86', metalLight:'#D6DBE3', metal:'#959EAE', metalDark:'#545D70',
  skin:'#F7CFB2', hair:'#5B3A2B', tee:'#2E9BE0', white:'#FFFFFF', accent:'#F5C431', ink:'#1E2638'
};
const MAP = {k:'ink',h:'hair',l:'trackDark',s:'skin',d:'skinShade',o:'trackDark',r:'track',t:'tee',T:'standDark',w:'white',e:'metalLight',m:'metal',g:'metalDark'};
const W=32, H=48;
const HEAD = {
 down:["....kkkkkk....","..kkhhhhhhkk..",".khhhhllllhhk.","khhhllhhhhhhhk","khhhhhhhhhhhhk","khhhhhhhssshhk","khhsssssssshhk",
  "khskksssskkshk","khskwsssskwshk","khsrssssssrshk","khsssssosssdhk",".kosssssssdok.","...ooossdoo...",".....oddo....."],
 up:["....kkkkkk....","..kkhhhhhhkk..",".khhhhllllhhk.","khhhllhhhhhhhk","khhhhhhhhhhhhk","khhhhhhhhhhhhk","khhhhhhhhhhhhk",
  "khhhhhhhhhhhhk","khhhhhhhhhhhhk","khhhhhhhhhhhhk","khhhhhhhhhhhhk",".khhhhhhhhhhk.","..kkhhhhhhkk..",".....oddo....."],
 right:["...kkkkkk.....",".kkhhhhhhkk...","khhhhhllllhk..","khhhhllhhhhhk.","khhhhhhhhhhhhk","khhhhhhhhhhhhk","khhhhhhhsssshk",
  "khhhhhossskkso","khhhhhodsskwso","khhhhhhossrsso","khhhhhhhdssso.",".khhhhhhkddo..","..khhhhk.oo...","...kkkk.odo..."]
};
for (const k in HEAD) HEAD[k].forEach((r,i)=>{ if(r.length!==14) throw new Error('head '+k+' row '+i+' len '+r.length); });
function blank(){ return Array.from({length:H},()=>Array(W).fill('.')); }
function K(x,y){ return x+','+y; }
function seg(set,ax,ay,bx,by,r){
  ax+=.5; ay+=.5; bx+=.5; by+=.5;
  const x0=Math.floor(Math.min(ax,bx)-r-1), x1=Math.ceil(Math.max(ax,bx)+r+1), y0=Math.floor(Math.min(ay,by)-r-1), y1=Math.ceil(Math.max(ay,by)+r+1);
  const dx=bx-ax, dy=by-ay, L=dx*dx+dy*dy;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){ const px=x+.5, py=y+.5; let t=L?((px-ax)*dx+(py-ay)*dy)/L:0; t=Math.max(0,Math.min(1,t));
    const qx=ax+t*dx-px, qy=ay+t*dy-py; if(qx*qx+qy*qy<=r*r+1e-6) set.add(K(x,y)); }
  return set;
}
function rect(set,x0,y0,x1,y1){ for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++) set.add(K(x,y)); return set; }
const inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
function paint(g,set,fill,out){
  if(out) set.forEach(k=>{ const [x,y]=k.split(',').map(Number); [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,b])=>{ const nx=x+a, ny=y+b; if(!set.has(K(nx,ny))&&inb(nx,ny)) g[ny][nx]=out; }); });
  set.forEach(k=>{ const [x,y]=k.split(',').map(Number); if(inb(x,y)) g[y][x]=fill; });
}
function stamp(g,rows,x0,y0){ rows.forEach((row,y)=>{ for(let x=0;x<row.length;x++){ const c=row[x]; if(c!=='.'&&inb(x0+x,y0+y)) g[y0+y][x0+x]=c; } }); }
function shoe(g,ax,ay,side,dir){
  const s = side ? (dir>0?rect(new Set(),ax-1,ay+1,ax+2,ay+2):rect(new Set(),ax-2,ay+1,ax+1,ay+2)) : rect(new Set(),ax-1,ay+1,ax+1,ay+2);
  paint(g,s,'w','m'); s.forEach(k=>{ const [x,y]=k.split(',').map(Number); if(y===ay+2) g[y][x]='e'; });
}
function leg(g,hip,knee,ankle,side){
  const s=new Set(); seg(s,hip[0],hip[1],knee[0],knee[1],1.0); seg(s,knee[0],knee[1],ankle[0],ankle[1],1.0); paint(g,s,'s','o');
  const p=[knee[0]+(ankle[0]-knee[0])*.15, knee[1]+(ankle[1]-knee[1])*.15];
  const sk=seg(new Set(),p[0],p[1],ankle[0],ankle[1],1.0); sk.forEach(k=>{ const [x,y]=k.split(',').map(Number); if(inb(x,y)) g[y][x]='k'; });
  shoe(g,ankle[0],ankle[1],side,1);
}
function arm(g,sh,el,hd){
  const s=new Set(); seg(s,sh[0],sh[1]+1,el[0],el[1],.7); seg(s,el[0],el[1],hd[0],hd[1],.7); paint(g,s,'s','o');
  paint(g,seg(new Set(),sh[0],sh[1],sh[0],sh[1],1.5),'t','k');
}
function shade(g,cols,rows,from,to){ rows.forEach(y=>cols.forEach(x=>{ if(inb(x,y)&&g[y][x]===from) g[y][x]=to; })); }
function range(a,b){ const r=[]; for(let i=a;i<=b;i++) r.push(i); return r; }

function frontal(f, facing){
  const g=blank(); const pass=f%2===1; const b=pass?-1:0; const sw=pass?0:(f===0?1:-1);
  const liftL=f===0, liftR=f===2;
  const L = liftL ? [[13,31+b],[12,34],[12,37]] : [[13,31+b],[12,35],[12,40]];
  const R = liftR ? [[18,31+b],[19,34],[19,37]] : [[18,31+b],[19,35],[19,40]];
  const shL=[10,20+b], shR=[21,20+b];
  const fwd=(sh,dir)=>[sh,[sh[0]-dir,23+b],[sh[0]+dir*0,25+b]];
  const bk=(sh,dir)=>[sh,[sh[0]-dir,24+b],[sh[0]-dir,27+b]];
  const mid=(sh,dir)=>[sh,[sh[0]-dir,24+b],[sh[0]-dir,26+b]];
  let aL,aR; if(f===0){ aL=bk(shL,1); aR=fwd(shR,-1);} else if(f===2){ aR=bk(shR,-1); aL=fwd(shL,1);} else { aL=mid(shL,1); aR=mid(shR,-1); }
  if(facing==='up') paint(g,seg(new Set(),10,13+b,9+(sw>0?1:0),21+b,1.0),'h','k');
  leg(g,...L,false); leg(g,...R,false);
  const sh=rect(new Set(),11,28+b,20,31+b); paint(g,sh,'w','m'); shade(g,[20],range(28+b,31+b),'w','e');
  arm(g,...aL); arm(g,...aR);
  const t=rect(new Set(),11,18+b,20,27+b); t.delete(K(11,18+b)); t.delete(K(20,18+b)); paint(g,t,'t','k');
  shade(g,[20],range(19+b,27+b),'t','T'); shade(g,range(11,20),[27+b],'t','T');
  paint(g,seg(new Set(),shL[0],shL[1],shL[0],shL[1],1.5),'t','k'); paint(g,seg(new Set(),shR[0],shR[1],shR[0],shR[1],1.5),'t','k');
  
  if(facing==='down'){ paint(g,rect(new Set(),14,21+b,17,23+b),'w','e'); g[17+b+1][15]='d'; g[17+b+1][16]='d'; }
  stamp(g,HEAD[facing],9,4+b);
  if(facing==='down') paint(g,seg(new Set(),23,12+b,23+(sw>0?1:0),19+b,1.0),'h','k');
  return g;
}
function sideRight(f){
  const g=blank(); const pass=f%2===1; const b=pass?-1:0;
  const sh=[16,20+b];
  const reach={leg:[[16,31],[19,35],[21,40]]}, kick={leg:[[16,31],[14,35],[11,37]]}, plant={leg:[[16,30],[17,35],[16,40]]}, tuck={leg:[[16,30],[18,34],[14,37]]};
  const armF=[sh,[18,24+b],[21,22+b]], armB=[sh,[14,24+b],[12,27+b]], armM1=[sh,[16,25+b],[18,27+b]], armM2=[sh,[15,25+b],[16,27+b]];
  const P=[{near:reach.leg,far:kick.leg,nearArm:armB,farArm:armF},{near:plant.leg,far:tuck.leg,nearArm:armM1,farArm:armM2},
           {near:kick.leg,far:reach.leg,nearArm:armF,farArm:armB},{near:tuck.leg,far:plant.leg,nearArm:armM2,farArm:armM1}][f];
  paint(g,seg(new Set(),9,12+b,8-(pass?0:1),21+b,1.0),'h','k');
  arm(g,...P.farArm);
  leg(g,...P.far,true); leg(g,...P.near,true);
  paint(g,rect(new Set(),13,28+b,19,31+b),'w','m'); shade(g,[13],range(28+b,31+b),'w','e');
  const t=rect(new Set(),13,18+b,19,27+b); t.delete(K(13,18+b)); t.delete(K(19,18+b)); paint(g,t,'t','k');
  shade(g,[13],range(19+b,27+b),'t','T'); shade(g,range(13,19),[27+b],'t','T');
  for(let y=21;y<=23;y++) g[y+b][19]='w';
  stamp(g,HEAD.right,9,4+b);
  arm(g,...P.nearArm);
  return g;
}
const flip = g => g.map(r=>r.slice().reverse());
const FILLOF={o:['s','d'],m:['w','e'],e:['w']};
function thin(g){ for(let pass=0;pass<3;pass++) for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++){ const k=g[y][x]; if(!FILLOF[k]) continue;
  if(g[y][x+1]!==k||g[y+1][x]!==k||g[y+1][x+1]!==k) continue;
  const cand=[[x,y],[x+1,y],[x,y+1],[x+1,y+1]]; let done=false;
  for(const [cx,cy] of cand){ for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=cx+a, ny=cy+b; if(inb(nx,ny)&&FILLOF[k].includes(g[ny][nx])){ g[cy][cx]=g[ny][nx]; done=true; break; } } if(done) break; }
  if(!done) g[y+1][x+1]='.'; } return g; }
const drop = g => { g=thin(g); const n=4; return Array.from({length:n},()=>Array(W).fill('.')).concat(g.slice(0,H-n)); };
const DOWN=[0,1,2,3].map(f=>drop(frontal(f,'down')));
const UP=[0,1,2,3].map(f=>drop(frontal(f,'up')));
const RIGHT=[0,1,2,3].map(f=>drop(sideRight(f)));
const LEFT=RIGHT.map(flip);
const SETS={down:DOWN,up:UP,right:RIGHT,left:LEFT};

  return {SETS};
})();
function runnerGrid(dir,f){ return fromRows(RUNNER.SETS[dir][f].map(r=>r.join(''))); }
function drawReferee(flagUp){
  const W=32,H=48; const g=grid(W,H);
  const K=(x,y)=>x+','+y;
  function seg(set_,ax,ay,bx,by,r){ ax+=.5;ay+=.5;bx+=.5;by+=.5; const dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy;
    for(let y=Math.floor(Math.min(ay,by)-r-1);y<=Math.ceil(Math.max(ay,by)+r+1);y++)for(let x=Math.floor(Math.min(ax,bx)-r-1);x<=Math.ceil(Math.max(ax,bx)+r+1);x++){
      const px=x+.5,py=y+.5; let t=L?((px-ax)*dx+(py-ay)*dy)/L:0; t=Math.max(0,Math.min(1,t)); const qx=ax+t*dx-px,qy=ay+t*dy-py; if(qx*qx+qy*qy<=r*r+1e-6) set_.add(K(x,y)); } return set_; }
  function rc(s,x0,y0,x1,y1){ for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++) s.add(K(x,y)); return s; }
  function paint(s,f,o){ if(o) s.forEach(k=>{ const [x,y]=k.split(',').map(Number); [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,b])=>{ if(!s.has(K(x+a,y+b))) set(g,x+a,y+b,o); }); });
    s.forEach(k=>{ const [x,y]=k.split(',').map(Number); set(g,x,y,f); }); }
  const oy=4;
  // legs (ink trousers)
  [[13],[18]].forEach(([x])=>{ paint(seg(new Set(),x,31+oy,x,40+oy,1.0),'k',null); paint(rc(new Set(),x-1,41+oy,x+1,42+oy),'w','m'); });
  for(let x=12;x<=19;x++) if(get(g,x,43+oy)==='m') set(g,x,43+oy,'m');
  // trousers top
  paint(rc(new Set(),11,28+oy,20,31+oy),'k',null);
  // arms
  const armL=[[10,20+oy],[9,24+oy],[9,27+oy]];
  const armR=flagUp?[[21,20+oy],[23,16+oy],[23,12+oy]]:[[21,20+oy],[23,24+oy],[25,27+oy]];
  [armL,armR].forEach(([sh,el,hd])=>{ const s=new Set(); seg(s,sh[0],sh[1]+1,el[0],el[1],.7); seg(s,el[0],el[1],hd[0],hd[1],.7); paint(s,'s','o'); });
  // shirt
  const t=rc(new Set(),11,18+oy,20,27+oy); t.delete(K(11,18+oy)); t.delete(K(20,18+oy)); paint(t,'w','m');
  for(let y=19+oy;y<=27+oy;y++) if(get(g,20,y)==='w') set(g,20,y,'e');
  [[10,20+oy],[21,20+oy]].forEach(([x,y])=>paint(seg(new Set(),x,y,x,y,1.5),'w','m'));
  fill(g,15,19+oy,16,26+oy,'e'); set(g,15,18+oy,'d'); set(g,16,18+oy,'d');
  // head (cap)
  const head=["....kkkkkk....","..kkTTTTTTkk..",".kTTTTTTTTTTk.",".kTTTTTTTTTTk.","kkkkkkkkkkkkkk","khhsssssssshhk",
    "khskksssskkshk","khskwsssskwshk","khsssssssssdhk","khsssooossssdk",".kossssssssok.","..oosssssdoo..","....oosddoo...",".....oddo....."];
  head.forEach((r,y)=>{ for(let x=0;x<14;x++) if(r[x]!=='.') set(g,9+x,4+oy+y,r[x]); });
  // flag
  if(flagUp){ fill(g,23,4+oy,23,11+oy,'g'); box(g,24,3+oy,30,9+oy,'o'); fill(g,25,4+oy,29,8+oy,'r'); }
  else { for(let i=0;i<7;i++) set(g,25+Math.floor(i/2),28+oy+i,'g'); fill(g,27,33+oy,31,38+oy,'r'); box(g,26,32+oy,31,39+oy,'o'); fill(g,27,33+oy,30,38+oy,'r'); }
  return g; }



// ---- layout ----
const LAYOUT = {
  landscape:{ W:320,H:180, horiz:true, a:123, b:257, c:90, Ro:59, Ri:35, standsH:28,
    items:[
      {id:'waterA',x:156,y:32,label:'nanaki',lx:32,ly:8},{id:'waterB',x:228,y:32,label:'dahda',lx:32,ly:8},
      {id:'tent',x:32,y:62,label:'교육',lx:32,ly:30},
      {id:'board',x:190,y:88,label:'기술',lx:32,ly:10},
      {id:'arch',x:190,y:152,label:'소개 · 경력',lx:48,ly:15,banner:true},
      {id:'table',x:276,y:180,label:'연락 · 이력서',lx:32,ly:22},
      {id:'signal',x:44,y:180},{id:'referee',x:80,y:180}
    ], runner:{x:124,y:142,dir:'right'} },
  portrait:{ W:180,H:320, horiz:false, a:160, b:204, c:90, Ro:64, Ri:40, standsH:28,
    items:[
      {id:'tent',x:32,y:84,label:'교육',lx:32,ly:30},
      {id:'waterA',x:108,y:60,label:'nanaki',lx:32,ly:3},{id:'waterB',x:144,y:94,label:'dahda',lx:32,ly:3},
      {id:'board',x:90,y:192,label:'기술',lx:32,ly:10},
      {id:'arch',x:90,y:272,label:'소개 · 경력',lx:48,ly:15,banner:true},
      {id:'table',x:90,y:304,label:'연락 · 이력서',lx:32,ly:22},
      {id:'signal',x:24,y:312},{id:'referee',x:156,y:312}
    ], runner:{x:142,y:196,dir:'up'} }
};
function spriteFor(id,st){
  switch(id){
    case 'arch': return drawArch();
    case 'table': return drawTable();
    case 'waterA': return drawWater('b','T');
    case 'waterB': return drawWater('r','o');
    case 'board': return drawBoard();
    case 'tent': return drawTent();
    case 'signal': return drawSignal(st&&st.signal!=null?st.signal:0);
    case 'referee': return drawReferee(st?!!st.flagUp:true);
  } }
function geom(L){ const ax=L.horiz?L.a:L.c, ay=L.horiz?L.c:L.a, bx=L.horiz?L.b:L.c, by=L.horiz?L.c:L.b;
  return (x,y)=>{ const px=x+.5, py=y+.5, dx=bx-ax, dy=by-ay; let t=((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy); t=Math.max(0,Math.min(1,t)); return Math.hypot(ax+t*dx-px, ay+t*dy-py); }; }
function hash(a,b){ let h=(a*374761393 + b*668265263)|0; h=(h^(h>>>13))*1274126177|0; return (h^(h>>>16))>>>0; }
function trackBG(L){
  const g=grid(L.W,L.H), D=geom(L); const lines=[L.Ri,L.Ri+8,L.Ri+16];
  const sx = L.horiz ? Math.round((L.a+L.b)/2) : L.c;
  const isBottom=(x,y)=> L.horiz ? y>L.c : y>L.b;
  const band=Array.from({length:L.H},()=>Array(L.W).fill(false));
  for(let y=0;y<L.H;y++)for(let x=0;x<L.W;x++){
    const d=D(x,y), fd=Math.floor(d); let c;
    if(d<L.Ri) c='G';
    else if(d<L.Ro){ band[y][x]=true; if(fd===L.Ro-1) c='o'; else if(lines.includes(fd)) c='w'; else c=TILES.track.p[y%32][x%32];
      if(x===sx && isBottom(x,y) && fd<L.Ro-1) c='w'; }
    else if(y<L.standsH) c=TILES.stand.p[(y+2)%32][x%32];
    else if(y===L.standsH) c='D';
    else c='G';
    g.p[y][x]=c; }
  // lane chalk marks before the line
  [L.Ri+4,L.Ri+12,L.Ri+20].forEach(r=>{ const y = L.horiz ? L.c+r : L.b+r; for(let i=2;i<=4;i++){ if(g.p[y]&&g.p[y][sx-i]) g.p[y][sx-i]='w'; } set(g,sx+2,y,'w'); });
  // sparse grass dots: one per ~10 tiles
  for(let ty=0;ty<Math.ceil(L.H/32);ty++)for(let tx=0;tx<Math.ceil(L.W/32);tx++){ const h=hash(tx+L.W,ty+L.H); if(h%10!==0) continue;
    const x=tx*32+4+(h>>4)%24, y=ty*32+4+(h>>9)%24; if([[0,0],[2,0],[1,1]].every(([a,b])=>get(g,x+a,y+b)==='G')) [[0,0],[2,0],[1,1]].forEach(([a,b])=>set(g,x+a,y+b,'D')); }
  return {g,band}; }
function shadowFor(ground){ if(['r','o','w'].includes(ground)) return 'o'; if(['b','T','e','m','g'].includes(ground)) return 'T'; return 'D'; }
function compose(name,st){
  st=st||{}; const L=LAYOUT[name]; const {g:bg,band}=trackBG(L); const g=grid(L.W,L.H); bg.p.forEach((r,y)=>r.forEach((c,x)=>g.p[y][x]=c));
  const owner=Array.from({length:L.H},()=>Array(L.W).fill(null)); const stats={onTrack:{},overlap:[]};
  const labels=[]; const list=L.items.map(it=>Object.assign({},it,{spr:spriteFor(it.id,st)}));
  if(st.runner!==false) list.push({id:'runner',x:L.runner.x,y:L.runner.y,spr:runnerGrid(L.runner.dir,0)});
  list.sort((p,q)=>p.y-q.y);
  list.forEach(it=>{ let s=it.spr, x0=it.x-Math.floor(s.w/2), y0=it.y-s.h;
    const sel = st.outline && it.label; if(sel){ s=outline(s,'a'); x0-=1; y0-=1; }
    let on=0;
    for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){ const c=s.p[y][x]; if(!c) continue; const X=x0+x, Y=y0+y; if(X<0||Y<0||X>=L.W||Y>=L.H) continue;
      if(c!=='S'&&it.id!=='runner'){ if(band[Y][X]) on++; const o=owner[Y][X]; if(o&&o!==it.id) stats.overlap.push(o+'/'+it.id); owner[Y][X]=it.id; }
      g.p[Y][X]= c==='S'?shadowFor(bg.p[Y][X]):c; }
    if(it.id!=='runner') stats.onTrack[it.id]=on;
    if(it.label){ const bx=it.x-Math.floor(it.spr.w/2), by=it.y-it.spr.h; labels.push({text:it.label,x:bx+it.lx,y:by+it.ly,banner:!!it.banner}); }
    if(it.id==='runner'&&st.bubble){ place(g,bg.p,drawBubble(st.bubbleUp!==false),it.x-8,y0-10); } });
  stats.overlap=[...new Set(stats.overlap)];
  return {g,labels,W:L.W,H:L.H,stats}; }
function place(g,bgp,spr,x0,y0){ for(let y=0;y<spr.h;y++)for(let x=0;x<spr.w;x++){ const c=spr.p[y][x]; if(!c) continue; const X=x0+x,Y=y0+y; if(X<0||Y<0||X>=g.w||Y>=g.h) continue; g.p[Y][X]=c==='S'?shadowFor(bgp[Y][X]):c; } }
function toCanvas(g,scale,shadowGround){ scale=scale||1; const c=document.createElement('canvas'); c.width=g.w*scale; c.height=g.h*scale; const ctx=c.getContext('2d');
  for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){ let v=g.p[y][x]; if(!v) continue; if(v==='S') v=shadowGround||'D'; ctx.fillStyle=PAL16[CH[v]]; ctx.fillRect(x*scale,y*scale,scale,scale); }
  return c; }
function tileRepeat(t,nx,ny){ const g=grid(t.w*nx,t.h*ny); for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++) g.p[y][x]=t.p[y%t.h][x%t.w]; return g; }
function buildKit2(){ return {PAL16,CH,TILES,LAYOUT,spriteFor,drawBubble,drawYear,drawPlate,outline,runnerGrid,compose,toCanvas,tileRepeat,drawSignal,drawReferee}; }

if (typeof window!=='undefined') window.buildKit2 = buildKit2;
})();
