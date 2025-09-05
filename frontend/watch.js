// Params
const ps = new URLSearchParams(location.search);
const id = ps.get('id');
const room = ps.get('room') || '';
const src = ps.get('src'); // если есть прямая ссылка — используем HTML5-плеер

// Elements
const frame = document.getElementById('kpFrame');
const video = document.getElementById('nativeVideo');
const inviteBtn = document.getElementById('inviteBtn');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resyncBtn = document.getElementById('resyncBtn');
const countdownEl = document.getElementById('countdown');
const presenceBadge = document.getElementById('presence');
const roomBadge = document.getElementById('roomBadge');

// Init player
if(src){
  // Native mode (full sync possible)
  frame.style.display='none'; video.style.display='block';
  video.src = src; // must be CORS-enabled public URL
}else{
  frame.src = `https://api1690380040.atomics.ws/embed/kp/${id}`;
}

// Show invite if room exists
if(room){
  inviteBtn.style.display='inline-block';
  roomBadge.textContent = 'Комната: '+room;
}

// Transport
let ws=null, bc=null;
const peers = new Set();
function connect(){
  if(WS_URL){
    ws = new WebSocket(WS_URL + (WS_URL.includes('?')?'&':'?') + 'room=' + encodeURIComponent(room||'solo'));
    ws.onopen = ()=> pushSys('Подключено к серверу');
    ws.onmessage = (e)=> handle(JSON.parse(e.data));
    ws.onclose = ()=> pushSys('Отключено от сервера');
  }
  if(room){
    bc = new BroadcastChannel('kf_'+room);
    bc.onmessage = (e)=> handle(e.data);
  }
}
function send(evt){
  if(ws && ws.readyState===1) ws.send(JSON.stringify(evt));
  if(bc) bc.postMessage(evt);
}
connect();

// Chat
const chatList=document.getElementById('chatList');
const nick=document.getElementById('nick');
const msg=document.getElementById('msg');
document.getElementById('send').onclick = ()=>{
  const text=msg.value.trim(); if(!text) return;
  const n=nick.value.trim()||'Гость';
  const evt={type:'chat', room, from:n, text, ts:Date.now()};
  send(evt); pushMsg(n, text);
  msg.value='';
};

function pushMsg(from,text){ chatList.insertAdjacentHTML('beforeend', `<div class="msg"><b>${from}:</b> ${text}</div>`); chatList.scrollTop=chatList.scrollHeight; }
function pushSys(text){ chatList.insertAdjacentHTML('beforeend', `<div class="msg sys">${text}</div>`); chatList.scrollTop=chatList.scrollHeight; }

// Presence (server-computed if WS, else client-side heuristic)
let count=1; presenceBadge.textContent=count;
handle({type:'presence', count}); // initial

// Controls / Sync
inviteBtn.onclick = ()=>{
  const url = location.href;
  navigator.clipboard.writeText(url).then(()=>{
    inviteBtn.textContent='Скопировано';
    setTimeout(()=>inviteBtn.textContent='Пригласить',1200);
  });
};

startBtn.onclick = ()=>{
  const startAt = Date.now()+3000;
  send({type:'start', id, startAt});
  startCountdown(startAt);
  playAt(startAt);
};
pauseBtn.onclick = ()=>{
  const ts = Date.now();
  send({type:'pause', id, ts});
  if(src){ video.pause(); } // iframe: нет api
};
resyncBtn.onclick = ()=>{
  const startAt = Date.now()+3000;
  const t = src ? (video.currentTime||0) : 0;
  send({type:'resync', id, startAt, t});
  startCountdown(startAt);
  if(src){ setTimeout(()=>{ video.currentTime = t; video.play(); }, Math.max(0,startAt-Date.now())); }
  else { reloadFrameAutoplay(); }
};

function reloadFrameAutoplay(){ frame.src = `https://api1690380040.atomics.ws/embed/kp/${id}?autoplay=1`; }

function startCountdown(at){
  countdownEl.style.display='inline-block';
  const raf=()=>{
    const d = Math.ceil((at - Date.now())/1000);
    countdownEl.textContent = d>0? d : '0';
    if(Date.now()>=at){ countdownEl.style.display='none'; return; }
    requestAnimationFrame(raf);
  };
  raf();
}
function playAt(at){
  if(src){
    const delay = Math.max(0, at - Date.now());
    setTimeout(()=> video.play(), delay);
  }else{
    const delay = Math.max(0, at - Date.now());
    setTimeout(()=> reloadFrameAutoplay(), delay);
  }
}

function handle(evt){
  if(!evt) return;
  if(evt.type==='chat'){ pushMsg(evt.from, evt.text); }
  else if(evt.type==='presence'){ presenceBadge.textContent = evt.count||1; }
  else if(evt.type==='start'){ startCountdown(evt.startAt); playAt(evt.startAt); }
  else if(evt.type==='pause'){ if(src) video.pause(); }
  else if(evt.type==='resync'){
    startCountdown(evt.startAt);
    if(src){
      setTimeout(()=>{ video.currentTime = evt.t||0; video.play(); }, Math.max(0,evt.startAt-Date.now()));
    }else{
      setTimeout(()=> reloadFrameAutoplay(), Math.max(0,evt.startAt-Date.now()));
    }
  }
}
