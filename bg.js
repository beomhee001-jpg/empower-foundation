/* Empower Foundation — scroll-reactive ambient particle field (emerald + electric blue).
   Self-contained: builds its own fixed canvas behind all content, sprite-based
   (fast) glowing motes + soft bokeh orbs that slowly drift, gently parallax with
   the page scroll, and streak/accelerate with scroll velocity. Runs on one rAF
   loop, GPU-friendly drawImage only — designed to stay buttery on every page. */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var c = document.createElement('canvas');
  c.id = 'bgfx';
  c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none';

  var ctx, W, H, dpr, motes, orbs, spriteG, spriteB, raf = null, t = 0;
  // scroll state (smoothed) — drives parallax + velocity streak
  var sY = 0, sTarget = 0, sLast = 0, vel = 0;

  function rnd(a, b){ return a + Math.random() * (b - a); }
  function mod(n, m){ return ((n % m) + m) % m; }

  // pre-render two soft glow sprites (cheap drawImage instead of per-frame gradients)
  function buildSprite(stops){
    var s = document.createElement('canvas');
    s.width = s.height = 64;
    var g2 = s.getContext('2d');
    var g = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    g2.fillStyle = g; g2.fillRect(0, 0, 64, 64);
    return s;
  }

  function makeSet(n, conf){
    var a = [];
    for (var i = 0; i < n; i++){
      a.push({
        x: Math.random(), y: Math.random(),
        r: rnd(conf.r0, conf.r1),
        a: rnd(conf.a0, conf.a1),
        vx: rnd(-conf.v, conf.v),
        vy: rnd(-conf.v * 1.5, -conf.v * 0.2),   // gentle upward drift
        ph: Math.random() * Math.PI * 2,
        sw: rnd(0.15, 0.55),
        depth: rnd(conf.d0, conf.d1),            // parallax depth (px shift per px scroll)
        blue: Math.random() < (conf.blue || 0)   // a fraction render in electric blue
      });
    }
    return a;
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = c.width  = Math.floor(window.innerWidth  * dpr);
    H = c.height = Math.floor(window.innerHeight * dpr);
  }

  function spawn(){
    var dense = window.innerWidth < 720 ? 0.55 : 1;
    motes = makeSet(Math.round(80 * dense), { r0: 1.4, r1: 4.6, a0: 0.22, a1: 0.7,  v: 0.000115, d0: 0.04, d1: 0.16, blue: 0.34 });
    orbs  = makeSet(Math.round(9  * dense), { r0: 80,  r1: 190, a0: 0.06, a1: 0.17, v: 0.00006,  d0: 0.10, d1: 0.26, blue: 0.40 });
  }

  function blit(p, sway, stretch){
    var spr = p.blue ? spriteB : spriteG;
    var d = p.r * dpr * 2;
    // parallax: shift opposite to scroll, wrapped so the field never empties
    var py = mod(p.y * H - sY * p.depth * dpr, H + d) - d / 2;
    ctx.globalAlpha = p.a;
    ctx.drawImage(spr, p.x * W + sway - d / 2, py, d, d * stretch);
  }

  function draw(){
    ctx.clearRect(0, 0, W, H);
    var i, str = 1 + Math.min(Math.abs(vel) * 0.018, 0.85);   // vertical streak on fast scroll
    for (i = 0; i < orbs.length; i++) blit(orbs[i], 0, 1);
    for (i = 0; i < motes.length; i++){
      var p = motes[i];
      blit(p, Math.sin(t * p.sw + p.ph) * 10 * dpr, str);
    }
    ctx.globalAlpha = 1;
  }

  function step(set, m){
    var boost = 1 + Math.min(Math.abs(vel) * 0.02, 1.1);      // particles hurry while scrolling
    for (var i = 0; i < set.length; i++){
      var p = set[i];
      p.x += p.vx; p.y += p.vy * boost;
      if (p.y < -m) p.y = 1 + m;
      if (p.x < -m) p.x = 1 + m; else if (p.x > 1 + m) p.x = -m;
    }
  }

  function loop(){
    t += 0.016;
    sY += (sTarget - sY) * 0.085;                              // ease scroll toward target
    vel += ((sTarget - sLast) - vel) * 0.12; sLast = sTarget;  // smoothed scroll velocity
    if (Math.abs(vel) < 0.01) vel = 0;
    step(motes, 0.06); step(orbs, 0.25);
    draw();
    raf = window.requestAnimationFrame(loop);
  }

  function onScroll(){ sTarget = window.pageYOffset || document.documentElement.scrollTop || 0; }

  function start(){
    ctx = c.getContext('2d');
    spriteG = buildSprite([[0,'rgba(178,245,205,1)'],[0.35,'rgba(74,222,128,0.6)'],[1,'rgba(34,197,110,0)']]);
    spriteB = buildSprite([[0,'rgba(199,225,255,1)'],[0.35,'rgba(96,165,250,0.6)'],[1,'rgba(37,99,235,0)']]);
    resize(); spawn(); onScroll(); sY = sLast = sTarget;
    window.addEventListener('resize', function(){ resize(); spawn(); if (reduce) draw(); }, { passive: true });
    if (reduce){ draw(); return; }                            // static field, no motion
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', function(){
      if (document.hidden){ if (raf){ cancelAnimationFrame(raf); raf = null; } }
      else if (!raf){ loop(); }
    });
    loop();
  }

  function mount(){
    if (document.body){ document.body.appendChild(c); start(); }
    else window.requestAnimationFrame(mount);
  }
  mount();
})();
