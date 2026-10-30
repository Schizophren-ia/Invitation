'use strict';
const $ = id => document.getElementById(id);
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
let stage = 'intro', openingTimer, lastTrigger;
const overlay = $('overlay'), dialog = overlay.querySelector('[role="dialog"]');
function announce(message) { $('status').textContent = message; $('status').classList.add('visible'); clearTimeout(announce.timer); announce.timer = setTimeout(() => $('status').classList.remove('visible'), 3300); }
function setStep(n) { document.querySelectorAll('.steps i').forEach((el,i) => el.classList.toggle('active',i===n)); }
function receive(event) {
  if (stage !== 'intro') return;
  lastTrigger = event.currentTarget; stage = 'dropping';
  const sleigh = $('sleigh'), rect = sleigh.getBoundingClientRect();
  const letter = document.createElement('div'); letter.className = 'falling-letter'; letter.setAttribute('aria-hidden','true');
  letter.style.left = `${rect.left + rect.width * .25}px`; letter.style.top = `${rect.top + rect.height * .65}px`;
  letter.innerHTML = '<span>❄</span>'; document.body.append(letter);
  $('world').classList.add('delivered');
  openingTimer = setTimeout(() => {
    letter.remove(); stage = 'envelope'; overlay.hidden = false;
    $('world').inert = true; document.body.style.overflow = 'hidden';
    $('seal').disabled = true; setStep(1);
    setTimeout(() => { if (stage === 'envelope') { $('seal').disabled = false; $('seal').focus(); } }, motion.matches ? 30 : 1500);
  }, motion.matches ? 80 : 1500);
  if (!music.started && !music.userMuted) music.start();
}
$('sleigh').addEventListener('click', receive);
$('seal').addEventListener('click', () => {
  if (stage !== 'envelope') return;
  stage = 'opening'; $('seal').disabled = true; $('envelope').classList.add('opening');
  chime();
  openingTimer = setTimeout(() => {
    stage = 'card'; $('envelope-scene').hidden = true; $('card-scene').hidden = false;
    setStep(2); overlay.scrollTop = 0; document.querySelector('.invitation').focus({preventScroll:true});
  }, motion.matches ? 80 : 2450);
});
function reset() {
  clearTimeout(openingTimer); stage = 'intro'; overlay.hidden = true; $('world').inert = false;
  $('envelope-scene').hidden = false; $('card-scene').hidden = true;
  $('envelope').classList.remove('opening'); $('seal').disabled = false;
  $('world').classList.remove('delivered'); document.body.style.overflow = ''; setStep(0);
  (lastTrigger || $('sleigh')).focus({preventScroll:true});
}
$('close').addEventListener('click',reset); $('replay').addEventListener('click',reset);
document.addEventListener('keydown',e=>{
  if (overlay.hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); reset(); }
  if (e.key !== 'Tab') return;
  const focusable = [...dialog.querySelectorAll('button:not(:disabled),a[href]')].filter(el => el.getClientRects().length);
  const first=focusable[0], last=focusable.at(-1), active=document.activeElement;
  if(e.shiftKey && (active===first || !focusable.includes(active))) {e.preventDefault();last.focus();}
  else if(!e.shiftKey && (active===last || !focusable.includes(active))) {e.preventDefault();first.focus();}
});
$('calendar').addEventListener('click',()=>{
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Aristia//First Birthday//VI','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:aristia-first-birthday-20261220@invitation.local','DTSTAMP:20261029T000000Z','DTSTART:20261220T110000Z','SUMMARY:Aristia’s 1st Birthday','LOCATION:Cocotte Restaurant - SILA Urban Living\\, 21 Ngo Thoi Nhiem\\, Xuan Hoa\\, Ho Chi Minh City','DESCRIPTION:Join us to celebrate Aristia’s first birthday. 18:00 local time (GMT+7).','END:VEVENT','END:VCALENDAR',''].join('\r\n');
  const url=URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='Aristia-1st-Birthday.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);announce('Đã tải lịch hẹn · Hẹn gặp bạn lúc 18:00!');
});
// Original, browser-synthesized winter jazz demonstration.
const music={ctx:null,master:null,timer:null,started:false,playing:false,userMuted:false,beat:0,
  async start(){
    try{
      if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.2;this.master.connect(this.ctx.destination);}
      await this.ctx.resume();this.started=true;this.playing=true;this.update();
      if(!this.timer){this.tick();this.timer=setInterval(()=>this.tick(),390);}
    }catch{announce('Trình duyệt chưa phát được nhạc. Hãy thử lại.');}
  },
  stop(){this.playing=false;this.userMuted=true;if(this.ctx)this.ctx.suspend();this.update();},
  update(){$('sound').setAttribute('aria-pressed',String(this.playing));$('sound-label').textContent=this.playing?'Tắt nhạc':'Bật nhạc';$('sound').setAttribute('aria-label',this.playing?'Tắt nhạc winter jazz':'Bật nhạc winter jazz');$('sound-dialog').setAttribute('aria-pressed',String(this.playing));$('sound-dialog').textContent=this.playing?'Tắt nhạc':'Bật nhạc';},
  tick(){if(!this.playing||document.hidden)return;
    const chords=[[48,55,59,62],[45,52,55,60],[50,57,60,64],[43,53,57,62]],chord=chords[Math.floor(this.beat/8)%4],t=this.ctx.currentTime;
    if(this.beat%4===0)chord.forEach((n,i)=>tone(n,t+i*.018,1.7,.1,'triangle'));
    if(this.beat%2===0)tone(chord[this.beat%4===0?0:1]-12,t,.42,.23,'sine');
    const melody=[76,null,79,74,71,null,74,72,76,null,72,69,67,null,71,74];
    const n=melody[this.beat%melody.length];if(n)tone(n,t+(this.beat%2?.06:0),.55,.075,'triangle');
    this.beat++;
  }
};
function tone(note,time,duration,volume,type){const ctx=music.ctx;if(!ctx)return;const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.value=440*2**((note-69)/12);gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);osc.connect(gain);gain.connect(music.master);osc.start(time);osc.stop(time+duration+.02);}
function chime(){if(!music.playing||!music.ctx)return;[84,88,91,96].forEach((n,i)=>tone(n,music.ctx.currentTime+i*.09,1,.09,'sine'));}
$('sound').addEventListener('click',()=>music.playing?music.stop():music.start());
$('sound-dialog').addEventListener('click',()=>music.playing?music.stop():music.start());
// Snow remains above both the landscape and the opened invitation.
const canvas=$('snow'),ctx=canvas.getContext('2d');let flakes=[],width=0,height=0,frame,last=0;
function resize(){width=window.innerWidth;height=window.innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);flakes=Array.from({length:width<700?65:115},()=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*2+.5,speed:Math.random()*.55+.2,drift:Math.random()*1.2-.6,opacity:Math.random()*.55+.18}));draw(0);}
function draw(time){const dt=last?Math.min((time-last)/16.67,3):1;last=time;ctx.clearRect(0,0,width,height);for(const f of flakes){if(!motion.matches){f.y+=f.speed*dt;f.x+=(f.drift+Math.sin(time/3000+f.y/90)*.12)*dt;if(f.y>height+5){f.y=-5;f.x=Math.random()*width;}if(f.x>width+5)f.x=-5;if(f.x< -5)f.x=width+5;}ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fillStyle=`rgba(255,251,241,${f.opacity})`;ctx.fill();}}
function animate(time){draw(time);frame=requestAnimationFrame(animate);}
function startSnow(){cancelAnimationFrame(frame);last=0;draw(0);if(!motion.matches&&!document.hidden)frame=requestAnimationFrame(animate);}
window.addEventListener('resize',()=>{resize();startSnow();});motion.addEventListener('change',startSnow);
document.addEventListener('visibilitychange',()=>{startSnow();if(music.ctx&&music.playing){if(document.hidden)music.ctx.suspend();else music.ctx.resume().catch(()=>{});}});
resize();startSnow();
