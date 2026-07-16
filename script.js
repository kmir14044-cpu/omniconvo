
function showPlans(id, btn){
  document.querySelectorAll('.pgroup').forEach(g=>g.classList.remove('on'));
  document.getElementById('pg-'+id).classList.add('on');
  document.querySelectorAll('.ptab').forEach(t=>t.classList.remove('on'));
  btn.classList.add('on');
}

/* ---------- Content calendar: live cycling status (dynamic, not static) ---------- */
(function(){
  const cal = document.querySelector('.cal');
  if(!cal) return;
  const grid = cal.querySelector('.cal-grid');
  if(grid){
    Array.from(grid.children).forEach((cell,i)=> cell.style.setProperty('--i', i));
  }
  const rows = cal.querySelectorAll('.cal-item');
  if(!rows.length) return;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dot = document.createElement('div');
  dot.className = 'cal-live-dot';
  cal.appendChild(dot);
  let idx = 0;
  function activate(i){
    rows.forEach(r=>r.classList.remove('active'));
    const row = rows[i];
    row.classList.add('active');
    dot.classList.add('on');
    dot.style.top = (row.offsetTop + row.offsetHeight / 2 - 4) + 'px';
  }
  activate(0);
  if(!reduceMotion){
    setInterval(()=>{
      idx = (idx + 1) % rows.length;
      activate(idx);
    }, 2200);
  }
})();

/* ---------- Scroll reveal (fade/slide up on entering viewport) ---------- */
(function(){
  const targets = document.querySelectorAll('.reveal, .reveal-stagger');
  if(!('IntersectionObserver' in window)){
    targets.forEach(el=>el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, {threshold:0.15, rootMargin:'0px 0px -40px 0px'});
  targets.forEach(el=>io.observe(el));
})();

/* ---------- Count-up numbers (dashboard stats + platform stats) ---------- */
(function(){
  const els = document.querySelectorAll('[data-count-to]');
  if(!els.length) return;
  const animate = (el)=>{
    const target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    const dur = 1400;
    const start = performance.now();
    function tick(now){
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if(p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };
  if(!('IntersectionObserver' in window)){
    els.forEach(animate);
  } else {
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.4});
    els.forEach(el=>io.observe(el));
  }
})();

/* ---------- Cursor spotlight in hero ---------- */
(function(){
  const hero = document.querySelector('.hero');
  const spot = document.getElementById('spotlight');
  if(!hero || !spot) return;
  hero.addEventListener('mousemove', (e)=>{
    const r = hero.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    spot.style.setProperty('--sx', x + '%');
    spot.style.setProperty('--sy', y + '%');
  });
})();

/* ---------- 3D tilt on service & pricing cards ---------- */
(function(){
  const cards = document.querySelectorAll('.svc, .plan');
  const isTouch = matchMedia('(hover:none)').matches;
  if(isTouch) return;
  cards.forEach(card=>{
    card.addEventListener('mousemove', (e)=>{
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${px * 6}deg) rotateX(${py * -6}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', ()=>{
      card.style.transform = '';
    });
  });
})();
/* ---------- Animated particle-network background canvas ---------- */
(function(){
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function initCanvas(canvas, opts){
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, dots = [];
    const density = opts.density || 55;
    const linkDist = opts.linkDist || 130;
    const color = opts.color || '96,165,250';
    const color2 = opts.color2 || '124,92,255';

    function resize(){
      const rect = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = rect.width;
      h = canvas.height = rect.height;
      const count = Math.min(70, Math.max(18, Math.round((w*h)/(density*1000))));
      dots = Array.from({length:count}, ()=>({
        x: Math.random()*w, y: Math.random()*h,
        vx: (Math.random()-0.5)*0.35, vy: (Math.random()-0.5)*0.35,
        c: Math.random() > 0.5 ? color : color2
      }));
    }
    resize();
    window.addEventListener('resize', resize);

    if(reduceMotion){
      // draw one static frame, no animation loop
      drawFrame();
      return;
    }

    let running = true;
    document.addEventListener('visibilitychange', ()=>{ running = !document.hidden; });

    function drawFrame(){
      ctx.clearRect(0,0,w,h);
      for(let i=0;i<dots.length;i++){
        const d = dots[i];
        d.x += d.vx; d.y += d.vy;
        if(d.x < 0 || d.x > w) d.vx *= -1;
        if(d.y < 0 || d.y > h) d.vy *= -1;
        for(let j=i+1;j<dots.length;j++){
          const o = dots[j];
          const dx = d.x-o.x, dy = d.y-o.y;
          const dist = Math.sqrt(dx*dx+dy*dy);
          if(dist < linkDist){
            ctx.strokeStyle = `rgba(${d.c},${(1-dist/linkDist)*0.25})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(d.x,d.y); ctx.lineTo(o.x,o.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(${d.c},0.7)`;
        ctx.beginPath();
        ctx.arc(d.x,d.y,1.6,0,Math.PI*2);
        ctx.fill();
      }
    }
    function loop(){
      if(running) drawFrame();
      requestAnimationFrame(loop);
    }
    loop();
  }
  function initSmoke(canvas){
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, blobs;
    const palette = ['59,130,246', '124,92,255', '45,212,191', '96,165,250'];

    function resize(){
      const rect = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = rect.width;
      h = canvas.height = rect.height;
      blobs = Array.from({length:6}, (_,i)=>({
        x: w*(0.15 + Math.random()*0.7),
        y: h*(0.1 + Math.random()*0.6),
        r: Math.min(w,h) * (0.32 + Math.random()*0.28),
        c: palette[i % palette.length],
        a: 0.16 + Math.random()*0.1,
        speed: 0.15 + Math.random()*0.2,
        phase: Math.random()*Math.PI*2,
        driftX: 30 + Math.random()*50,
        driftY: 20 + Math.random()*40
      }));
    }
    resize();
    window.addEventListener('resize', resize);

    if(reduceMotion){
      drawSmokeFrame(0);
      return;
    }
    let running = true;
    document.addEventListener('visibilitychange', ()=>{ running = !document.hidden; });

    function drawSmokeFrame(t){
      ctx.clearRect(0,0,w,h);
      ctx.globalCompositeOperation = 'lighter';
      blobs.forEach(b=>{
        const x = b.x + Math.sin(t*0.00012*b.speed + b.phase)*b.driftX;
        const y = b.y + Math.cos(t*0.00016*b.speed + b.phase)*b.driftY;
        const pulse = 1 + Math.sin(t*0.0002*b.speed + b.phase)*0.12;
        const grad = ctx.createRadialGradient(x,y,0,x,y,b.r*pulse);
        grad.addColorStop(0, `rgba(${b.c},${b.a})`);
        grad.addColorStop(1, `rgba(${b.c},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x,y,b.r*pulse,0,Math.PI*2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }
    function loop(t){
      if(running) drawSmokeFrame(t || 0);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
  initSmoke(document.getElementById('hero-canvas'));
  initCanvas(document.getElementById('pipeline-canvas'), {density:70, linkDist:110, color:'124,92,255', color2:'96,165,250'});
})();

/* ---------- Hero dashboard: live chat feed cycling + typing indicator ---------- */
(function(){
  const feed = document.getElementById('chat-feed');
  if(!feed) return;
  const rows = Array.from(feed.querySelectorAll('.chat-row'));
  const pool = [
    {a:'H', bg:'rgba(59,130,246,.18)', fg:'#60a5fa', name:'Hina Malik', msg:'Do you have this in size medium?', tag:'WA', tagClass:'t-wa'},
    {a:'U', bg:'rgba(34,197,94,.18)', fg:'#4ade80', name:'Usman Tariq', msg:'Order #4482 — asking for delivery ETA', tag:'WA', tagClass:'t-wa'},
    {a:'F', bg:'rgba(217,70,239,.18)', fg:'#e879f9', name:'Fatima N.', msg:'DM: loved the new Reel, is it available?', tag:'IG', tagClass:'t-ig'},
    {a:'K', bg:'rgba(59,130,246,.18)', fg:'#60a5fa', name:'Kamran S.', msg:'Comment auto-DM sent · pricing info', tag:'FB', tagClass:'t-fb'},
    {a:'✓', bg:'rgba(34,197,94,.16)', fg:'#4ade80', name:'CRM Engine', msg:'Lead scored HOT → assigned to sales', tag:'AI', tagClass:'t-tt'},
    {a:'R', bg:'rgba(245,158,11,.16)', fg:'#fbbf24', name:'Reel Scheduler', msg:'Next Reel queued for 6:00 PM today', tag:'AI', tagClass:'t-tt'},
  ];
  let poolIdx = 0;

  function cycleRow(row){
    const next = pool[poolIdx % pool.length];
    poolIdx++;
    row.classList.add('fading');
    setTimeout(()=>{
      row.querySelector('.avat').style.background = next.bg;
      row.querySelector('.avat').style.color = next.fg;
      row.querySelector('.avat').textContent = next.a;
      row.querySelector('.meta b').textContent = next.name;
      row.querySelector('.meta span').textContent = next.msg;
      const tagEl = row.querySelector('.tag');
      tagEl.textContent = next.tag;
      tagEl.className = 'tag ' + next.tagClass;
      row.classList.remove('fading');
    }, 350);
  }

  if(!reduceMotionCheck()){
    let i = 0;
    setInterval(()=>{
      const row = rows[i % rows.length];
      cycleRow(row);
      i++;
    }, 3200);
  }
  function reduceMotionCheck(){ return matchMedia('(prefers-reduced-motion: reduce)').matches; }
})();

