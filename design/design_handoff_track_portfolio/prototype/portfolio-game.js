// 트랙 월드 게임 엔진 (프레임워크 없음). 캔버스 2장(흑백 아래층 + 컬러 위층)에 그리고,
// HTML로 얹을 UI 상태(제목 판, HUD, 전광판, 말풍선 등)는 onUpdate 콜백으로 내보낸다.
(function(){
if (window.PortfolioGame) return;
// 인트로 A: 신호 → 한 바퀴(전광판 경력 3단계) → 줌인 인사 → 평소 화면
const TA = { RED:0.6, YEL:1.2, GO:1.8, BIN:2.2, ENTRY:1.8, RUN_END:10.0, ZIN:10.8, GREET_END:13.6, END:14.3 };
TA.BOUT = TA.BIN + TA.ENTRY*4;
const SPEED = 110, AUTO = 1.6, OPEN_DELAY = 0.35, EXTRA = 80;
const blobURL=c=>{ const d=c.toDataURL('image/png'); const b=atob(d.split(',')[1]); const u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return URL.createObjectURL(new Blob([u],{type:'image/png'})); };
const ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
const lerp=(a,b,k)=>a+(b-a)*k, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// 이정표 48×50 (오른쪽·왼쪽·오른쪽 화살표 판 3장)
function signGrid(){ const w=48,h=50, p=Array.from({length:h},()=>Array(w).fill(null)); const s=(x,y,c)=>{ if(x>=0&&y>=0&&x<w&&y<h) p[y][x]=c; };
  for(let x=14;x<=33;x++) s(x,h-1,'D'); for(let x=17;x<=30;x++) s(x,h-2,'D');
  for(let x=22;x<=26;x++) s(x,1,'k');
  for(let y=2;y<h-1;y++){ s(22,y,'k'); s(23,y,'r'); s(24,y,'r'); s(25,y,'o'); s(26,y,'k'); }
  [[5,'R'],[18,'L'],[31,'R']].forEach(([y0,d])=>{ for(let r=0;r<11;r++){ const tip=5-Math.abs(r-5); const xl=d==='R'?1:6-tip, xr=d==='R'?41+tip:46;
    for(let x=xl;x<=xr;x++){ const edge=r===0||r===10||x===xl||x===xr; s(x,y0+r,edge?'k':(r===9?'e':'w')); } } });
  return {w,h,p}; }
function create(opts){
  const K = window.buildKit3(); const W=K.W, H=K.H, LEN=K.LEN, TOTAL=LEN+EXTRA;
  const content = opts.content;
  const T = TA, TOT = TOTAL;
  const mk=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
  const toC=g=>K.toCanvas(g,1);
  const base=[0,1].map(f=>K.compose({runner:false,cheer:f,boardBlank:true,hide:['signal','referee']}));
  const worldC=base.map(r=>toC(r.g));
  const signG=signGrid(), signC=toC(signG), SIGN={x0:200,y0:186,w:signG.w,h:signG.h}; SIGN.x1=SIGN.x0+SIGN.w-1; SIGN.y1=SIGN.y0+SIGN.h-1;
  worldC.forEach(c=>c.getContext('2d').drawImage(signC,SIGN.x0,SIGN.y0));
  const itemOf=id=>K.ITEMS.find(i=>i.id===id);
  const rectOf=(id,g)=>{ const it=itemOf(id); const x0=it.x-Math.floor(g.w/2), y0=it.y-g.h; return {x0,y0,x1:x0+g.w-1,y1:it.y-1,w:g.w,h:g.h}; };
  const sigG=[0,1,2,3].map(i=>K.drawSignal(i)), sigC=sigG.map(toC), sigR=rectOf('signal',sigG[0]);
  const refG=[K.drawReferee(true),K.drawReferee(false)], refC=refG.map(toC), refR=rectOf('referee',refG[0]);
  const archG=K.sprite('arch'), archC=toC(archG), archR=rectOf('arch',archG);
  const RECT={}, outC={};
  ['arch','board','waterA','waterB','tent','table'].forEach(id=>{ const g=K.sprite(id); RECT[id]=rectOf(id,g); outC[id]={c:toC(K.outline(g,'a')),x:RECT[id].x0-1,y:RECT[id].y0-1}; });
  const SOLID=[RECT.board,RECT.waterA,RECT.waterB,RECT.tent,RECT.table,sigR,refR,SIGN].map(r=>({x0:r.x0-8,x1:r.x1+8,y0:r.y0-2,y1:r.y1+3}));
  const blocked=(x,y)=>SOLID.some(b=>x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1)||[x-6,x,x+6].some(px=>K.isStandAt(Math.round(px),Math.round(y)))||K.isStandAt(Math.round(x),Math.round(y-6));
  const INLAB={arch:{dx:48,dy:15,fs:8,color:'#1E2638'},board:{dx:48,dy:11,fs:8,color:'#F5C431',glow:true},waterA:{dx:32,dy:22,fs:5,color:'#1E2638'},waterB:{dx:32,dy:22,fs:5,color:'#1E2638'},tent:{dx:32,dy:54,fs:7,color:'#FFFFFF'},table:{dx:32,dy:21,fs:6,color:'#1E2638'}};
  const PIX="'Press Start 2P',monospace", KR='Galmuri11,monospace';
  const SIGN_LAB=(content.sign||[]).slice(0,3).map((text,i)=>({text,dx:i===1?26.5:21.5,dy:10.5+13*i}));
  const runC={}; const runner=(dir,f)=>{ const k=dir+f; return runC[k]||(runC[k]=toC(K.runnerGrid(dir,f))); };
  const waveC=[toC(K.waveFrame(0)),toC(K.waveFrame(1))];
  const bubC=[toC(K.drawBubble(true)),toC(K.drawBubble(false))];
  const keyURL=[K.keycap(false),K.keycap(true)].map(g=>blobURL(toC(g)));
  const boardURL=blobURL(toC(K.boardBlank()));
  // 흑백→컬러: 트랙 중심에서 부채꼴(시계 초침)로 쓸어 나간다. 값 = 출발선(아래)에서 달리는 방향으로 잰 각도
  const TAU=Math.PI*2, angOf=(x,y)=>{ let a=Math.PI/2-Math.atan2(y-K.c,x-320); return ((a%TAU)+TAU)%TAU; };
  const PM=new Float32Array(W*H); for(let y=0;y<H;y++)for(let x=0;x<W;x++) PM[y*W+x]=angOf(x+.5,y+.5);
  const sweep=()=>{ if(st.s>=LEN) return TAU+1; let a=angOf(st.x,st.y-12); if(st.s>LEN*0.75&&a<1) a=TAU; if(st.s<LEN*0.25&&a>5) a=0; return a; };
  const maskC=mk(W,H), mctx=maskC.getContext('2d'), mimg=mctx.createImageData(W,H);
  function buildMask(P){ const d=mimg.data; for(let i=0;i<PM.length;i++) d[i*4+3]=PM[i]<=P?255:0; mctx.putImageData(mimg,0,0); }
  const fw=mk(W,H), fctx=fw.getContext('2d');
  const mini=mk(160,90); { const m=mini.getContext('2d'); m.imageSmoothingEnabled=true; m.drawImage(worldC[0],0,0,160,90); }
  const miniURL=blobURL(mini), worldURL=blobURL(worldC[0]);
  const lanePt=s=>{ const p=K.posAt(s); return {x:p.x,y:p.y+12}; };
  const laneS=id=>{ const it=itemOf(id); if(id==='arch') return 0; return Math.round(K.trackParam(it.x, K.c+(it.y<K.c?-100:100))); };
  const ST=content.stations.map(s=>{ const ls=laneS(s.item); const front=s.item==='tent'?{x:86,y:106}:lanePt(ls); const R=RECT[s.item];
    const zn={x0:Math.min(R.x0-20,front.x-14),x1:Math.max(R.x1+20,front.x+14),y0:Math.min(R.y0-20,front.y-14),y1:Math.max(R.y1+22,front.y+14)};
    return Object.assign({},s,{s:ls,front,zone:zn,cx:(R.x0+R.x1)/2,cy:(R.y0+R.y1)/2}); });
  const ORDER=ST.slice().sort((p,q)=>p.s-q.s);
  const wrap=v=>((v%LEN)+LEN)%LEN, sdist=(a,b)=>{ let d=wrap(b-a); if(d>LEN/2) d-=LEN; return d; };

  const fresh=()=>({ phase:'intro', t:0, s:0, x:320, y:292, dir:'right', anim:0, mv:{x:0,y:0}, moving:false, auto:null, zone:null, open:null, dismissed:null, idle:0, firstInput:false });
  let st=fresh();
  let w=1280,h=720,mobile=false, raf=0, last=0, tick=0;
  const bot=opts.bottom, top=opts.top, bctx=bot.getContext('2d'), tctx=top.getContext('2d');
  function toReady(){ const E=lanePt(TOT); st.phase='ready'; st.t=T.END; st.s=TOT; st.x=E.x; st.y=E.y; st.dir='down'; try{ localStorage.setItem('pcr_intro_seen','1'); }catch(e){} }
  if(opts.skipIntro) toReady();
  function input(){ if(st.phase==='intro') return false; if(st.phase==='ready') st.phase='play'; st.firstInput=true; return true; }
  function openStation(id){ st.open=id; st.auto=null; st.idle=0; st.mv={x:0,y:0}; emit(); }
  function zoneAt(x,y){ let best=null,bd=1e9; ST.forEach(p=>{ const z=p.zone; if(x>=z.x0&&x<=z.x1&&y>=z.y0&&y<=z.y1){ const d=Math.hypot(x-p.cx,y-p.cy); if(d<bd){bd=d;best=p;} } }); return best; }
  const dirOf=(vx,vy)=>Math.abs(vx)>=Math.abs(vy)?(vx>0?'right':'left'):(vy>0?'down':'up');
  function planAuto(p){ const legs=[]; const d=Math.hypot(st.x-p.front.x,st.y-p.front.y);
    if(d<90){ legs.push({pt:p.front}); }
    else { const s0=wrap(K.trackParam(st.x,st.y-12)); legs.push({pt:lanePt(s0)}); legs.push({lane:true,s:s0,to:s0+sdist(s0,p.s)}); if(p.item==='tent') legs.push({pt:p.front}); }
    st.auto={id:p.id,legs}; }
  function stepAuto(dt){ const A=st.auto, L=A.legs[0]; if(!L){ const id=A.id; st.auto=null; openStation(id); return; }
    let step=SPEED*AUTO*dt;
    if(L.pt){ const dx=L.pt.x-st.x, dy=L.pt.y-st.y, d=Math.hypot(dx,dy); if(d<=step){ st.x=L.pt.x; st.y=L.pt.y; A.legs.shift(); } else { st.x+=dx/d*step; st.y+=dy/d*step; st.dir=dirOf(dx,dy); } }
    else { const dd=L.to-L.s; if(Math.abs(dd)<=step){ L.s=L.to; A.legs.shift(); } else L.s+=Math.sign(dd)*step;
      const p=K.posAt(L.s); st.x=p.x; st.y=p.y+12; st.dir=dd>0?p.dir:({right:'left',left:'right',up:'down',down:'up'})[p.dir]; }
    st.anim+=step; st.moving=true; }
  function step(dt){
    tick+=dt;
    if(st.phase==='intro'){ st.t+=dt; const t=st.t;
      if(t<T.GO) st.s=0;
      else if(t<T.RUN_END){ const p=(t-T.GO)/(T.RUN_END-T.GO), k=TOT/0.925; const prev=st.s; st.s = p<0.85 ? k*p : k*(0.85+(p-0.85)-Math.pow(p-0.85,2)/0.3); st.anim+=st.s-prev; }
      else st.s=TOT;
      const p=K.posAt(st.s); st.x=p.x; st.y=p.y+12; st.dir = t>=T.RUN_END ? 'down' : p.dir;
      if(t>=T.END) toReady(); return; }
    if(st.open) return;
    st.moving=false;
    if(st.auto) stepAuto(dt);
    else if(st.mv.x||st.mv.y){ const L=Math.hypot(st.mv.x,st.mv.y), dx=st.mv.x/L*SPEED*dt, dy=st.mv.y/L*SPEED*dt;
      const nx=clamp(st.x+dx,10,630), ny=clamp(st.y+dy,48,358);
      if(!blocked(nx,st.y)) st.x=nx; if(!blocked(st.x,ny)) st.y=ny;
      st.dir=dirOf(st.mv.x,st.mv.y); st.anim+=SPEED*dt; st.moving=true; }
    const z=zoneAt(st.x,st.y); st.zone=z?z.id:null; if(!z) st.dismissed=null;
  }
  function camera(){
    const Sg = mobile?2:Math.max(2,Math.floor(Math.min(w/320,h/180))), Sz=mobile?3:Sg+2, Si=Math.min(w/W,h/H);
    const fx=st.x, fy=st.y-24, t=st.t, intro=st.phase==='intro';
    let S, cxw, cyw;
    if(intro&&t<T.RUN_END){ S=Si; cxw=W/2; cyw=H/2; }
    else if(intro&&t<T.ZIN){ const e=ease((t-T.RUN_END)/(T.ZIN-T.RUN_END)); S=lerp(Si,Sz,e); cxw=lerp(W/2,fx,e); cyw=lerp(H/2,fy-8,e); }
    else if(intro&&t<T.GREET_END){ S=Sz; cxw=fx; cyw=fy-8; }
    else if(intro){ const e=ease((t-T.GREET_END)/(T.END-T.GREET_END)); S=lerp(Sz,Sg,e); cxw=fx; cyw=lerp(fy-8,fy,e); }
    else { S=Sg; cxw=fx; cyw=fy; }
    const vw=w/S, vh=h/S; const cl=(c,v,M)=> v>=M ? (M-v)/2 : clamp(c-v/2,0,M-v);
    let cx=cl(cxw,vw,W), cy=cl(cyw,vh,H); if(Number.isInteger(S)){ cx=Math.round(cx); cy=Math.round(cy); }
    return {S,cx,cy,vw,vh};
  }
  function draw(cam){
    fctx.clearRect(0,0,W,H); fctx.drawImage(worldC[Math.floor(tick/0.45)%2],0,0);
    const intro=st.phase==='intro', t=st.t;
    fctx.drawImage(sigC[intro?(t<T.RED?1:t<T.YEL?2:3):0],sigR.x0,sigR.y0); fctx.drawImage(refC[intro&&t<T.GO?0:1],refR.x0,refR.y0);
    const zi=!intro&&st.zone?ST.find(p=>p.id===st.zone).item:null;
    if(zi&&zi!=='arch'){ const o=outC[zi]; fctx.drawImage(o.c,o.x,o.y); }
    let spr;
    if(intro&&t>=T.ZIN&&t<T.GREET_END) spr=waveC[Math.floor(t*4)%2];
    else if((intro&&t>=T.GO&&t<T.RUN_END)||(!intro&&st.moving)) spr=runner(st.dir,Math.floor(st.anim/7)%4);
    else spr=runner(st.dir,1);
    const rx=Math.round(st.x), ry=Math.round(st.y);
    fctx.drawImage(spr,rx-16,ry-48);
    if(Math.abs(rx-320)<56&&ry<299&&ry>archR.y0){ const o=zi==='arch'?outC.arch:{c:archC,x:archR.x0,y:archR.y0}; fctx.drawImage(o.c,o.x,o.y); }
    if(zi&&!st.open) fctx.drawImage(bubC[Math.floor(tick/0.42)%2],rx-8,ry-58);
    const gray=intro&&t<T.RUN_END;
    bot.style.display=gray?'block':'none';
    [[bctx,gray],[tctx,true]].forEach(([ctx,on])=>{ if(!on) return; ctx.imageSmoothingEnabled=false; ctx.fillStyle='#6FB24B'; ctx.fillRect(0,0,top.width,top.height); });
    const blit=(ctx,src)=>{ const sx=Math.max(0,cam.cx), sy=Math.max(0,cam.cy), ex=Math.min(W,cam.cx+cam.vw), ey=Math.min(H,cam.cy+cam.vh);
      ctx.drawImage(src,sx,sy,ex-sx,ey-sy,(sx-cam.cx)*cam.S,(sy-cam.cy)*cam.S,(ex-sx)*cam.S,(ey-sy)*cam.S); };
    if(gray){ blit(bctx,fw); buildMask(t<T.GO?-1:sweep()); tctx.clearRect(0,0,top.width,top.height); blit(tctx,fw); tctx.globalCompositeOperation='destination-in'; blit(tctx,maskC); tctx.globalCompositeOperation='source-over'; }
    else blit(tctx,fw);
  }
  function emit(){
    const cam=camera(); const {S,cx,cy}=cam; const X=x=>(x-cx)*S, Y=y=>(y-cy)*S;
    const intro=st.phase==='intro', t=st.t;
    let big=null, dots=null;
    if(intro&&t>=T.GO&&t<T.RUN_END){
      const g=ease(t<T.BIN?(t-T.GO)/(T.BIN-T.GO):t>T.BOUT?1-(t-T.BOUT)/(T.RUN_END-T.BOUT):1);
      const B=RECT.board, k=Math.max(2,Math.floor(Math.min(w*0.56,h*0.62*3)/96));
      const bw=96*k, bh=32*k, sx=X(B.x0), sy=Y(B.y0), sw=B.w*S, sh=B.h*S;
      big={x:lerp(sx,w/2-bw/2,g), y:lerp(sy,h/2-bh/2,g), w:lerp(sw,bw,g), h:lerp(sh,bh,g), url:boardURL, show:false};
      if(t>=T.BIN&&t<T.BOUT){ const n=content.board.length, i=Math.min(n-1,Math.floor((t-T.BIN)/T.ENTRY)), lt=(t-T.BIN)-i*T.ENTRY;
        const flick=lt<0.28?[1,0,1,0,0,1,1][Math.floor(lt/0.04)]:lt>T.ENTRY-0.14?0:1;
        Object.assign(big,{show:true,on:flick,l2:content.board[i],steps:(content.boardSteps||[]).map((w,j)=>({text:w,on:i>=n-1||j===i}))});
        dots=content.board.map((_,j)=>j<=i); }
    }
    const done=!(intro&&t<T.END-0.3);
    const labs=[];
    ST.forEach(p=>{ const L=INLAB[p.item], Rr=RECT[p.item]; let text=p.menu, fs=L.fs, color=L.color, glow=!!L.glow;
      if(p.item==='arch'&&!done) text='START'; if(p.item==='board'&&!done) text='';
      if(text) labs.push({text,x:X(Rr.x0+L.dx),y:Y(Rr.y0+L.dy),fs:fs*S,color,glow,ff:PIX,fw:'400'}); });
    SIGN_LAB.forEach(l=>labs.push({text:l.text,x:X(SIGN.x0+l.dx),y:Y(SIGN.y0+l.dy),fs:Math.max(10,4.4*S),color:'#1E2638',glow:false,ff:KR,fw:'700'}));
    const band = intro ? (t<T.RED?'ON YOUR MARKS':t<T.YEL?'SET':t<T.GO+0.4?'GO':null) : null;
    const hudK = intro ? clamp((t-T.GREET_END)/(T.END-T.GREET_END),0,1) : 1;
    const greet = intro&&t>=T.ZIN&&t<T.GREET_END ? {x:X(st.x),y:Y(st.y-46)} : null;
    const ph=Math.floor(tick/0.45)%4;
    const keys = st.phase==='ready'&&!st.firstInput ? [[st.x-36,st.y-34,'←'],[st.x-8,st.y-70,'↑'],[st.x+20,st.y-34,'→'],[st.x-8,st.y+2,'↓']].map(([x,y,a],i)=>({x:X(x),y:Y(y),size:16*S,arrow:a,url:keyURL[ph===i?1:0],pressed:ph===i})) : null;
    opts.onUpdate({
      S, mobile, phase:st.phase, intro, gray:intro&&t<T.RUN_END, grayLabels:intro&&t<T.RUN_END,
      labels: labs, space: st.zone&&!st.open&&!intro ? {x:X(st.x+10),y:Y(st.y-50)} : null,
      big, dots, band, hudK, greet, keys, hint: st.phase==='ready'&&!st.firstInput ? Math.floor(tick/0.45)%2 : -1, skip: intro,
      zone: st.zone, open: st.open,
      mini: {url:miniURL, vx:cx/4, vy:cy/4, vw:cam.vw/4, vh:cam.vh/4, rx:st.x/4, ry:(st.y-24)/4}
    });
    return cam;
  }
  let lastRun=0, dead=false;
  function run(now){ const dt=Math.min(0.05,last?(now-last)/1000:0); last=now; lastRun=now; step(dt); const cam=emit(); draw(cam); }
  function frame(){ if(dead) return; run(performance.now()); raf=requestAnimationFrame(frame); }
  raf=requestAnimationFrame(frame);
  const wd=setInterval(()=>{ const n=performance.now(); if(n-lastRun>120) run(n); },50);
  const goTo=id=>{ if(st.phase==='intro') toReady(); input(); const p=ST.find(s=>s.id===id); if(!p) return; st.open=null; st.mv={x:0,y:0};
    if(Math.hypot(st.x-p.front.x,st.y-p.front.y)<=4){ openStation(id); return; } planAuto(p); };
  return {
    stations: ST, T, worldURL, rects: RECT, pos:()=>({x:st.x,y:st.y}),
    resize(nw,nh,mob){ w=Math.max(1,Math.round(nw)); h=Math.max(1,Math.round(nh)); mobile=!!mob; [bot,top].forEach(c=>{ c.width=w; c.height=h; }); },
    move(dx,dy){ if(st.open) return; if((dx||dy)&&!input()) return; if(dx||dy) st.auto=null; st.mv={x:dx,y:dy}; },
    goTo,
    stepStation(d){ if(st.phase==='intro') toReady(); const cur=st.zone?ST.find(p=>p.id===st.zone).s:wrap(K.trackParam(st.x,st.y-12));
      let n; if(d>0) n=ORDER.find(p=>p.s>cur+4)||ORDER[0]; else n=ORDER.slice().reverse().find(p=>p.s<cur-4)||ORDER[ORDER.length-1]; goTo(n.id); },
    confirm(){ if(st.zone&&!st.open&&input()) openStation(st.zone); },
    close(){ if(!st.open) return; st.dismissed=st.zone||st.open; st.open=null; emit(); },
    stepOpen(d){ if(!st.open) return; const i=ST.findIndex(s=>s.id===st.open); const n=ST[(i+d+ST.length)%ST.length]; st.x=n.front.x; st.y=n.front.y; st.zone=n.id; st.dismissed=n.id; st.dir='down'; openStation(n.id); },
    clickWorld(px,py){ const cam=camera(); const x=cam.cx+px/cam.S, y=cam.cy+py/cam.S;
      const hit=ST.find(s=>{ const R=RECT[s.item]; return x>=R.x0&&x<=R.x1&&y>=R.y0-12&&y<=R.y1; }); if(hit) goTo(hit.id); else input(); },
    skip(){ if(st.phase==='intro') toReady(); },
    replay(){ st=fresh(); },
    destroy(){ dead=true; cancelAnimationFrame(raf); clearInterval(wd); }
  };
}
window.PortfolioGame={create,T:TA,blobURL,signGrid,SIGN_POS:{x0:200,y0:186}};
})();
