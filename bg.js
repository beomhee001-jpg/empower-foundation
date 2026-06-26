/* Empower Foundation — ambient drifting-particle background (green/white).
   Self-contained: builds its own fixed canvas behind all content, sprite-based
   (fast) glowing green motes + soft bokeh orbs that slowly drift. */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var c = document.createElement('canvas');
  c.id = 'bgfx';
  c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none';

  var ctx, W, H, dpr, motes, orbs, sprite, raf = null, t = 0;

  function rnd(a, b){ return a + Math.random() * (b - a); }

  // pre-render one soft green glow sprite (cheap drawImage instead of per-frame gradients)
  function buildSprite(){
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    var s = sprite.getContext('2d');
    var g = s.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0,   'rgba(46,205,127,1)');
    g.addColorStop(0.35,'rgba(26,176,99,0.55)');
    g.addColorStop(1,   'rgba(22,163,94,0)');
    s.fillStyle = g; s.fillRect(0, 0, 64, 64);
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
        sw: rnd(0.15, 0.55)
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
    motes = makeSet(Math.round(78 * dense), { r0: 1.4, r1: 4.6, a0: 0.20, a1: 0.66, v: 0.000055 });
    orbs  = makeSet(Math.round(8  * dense), { r0: 80,  r1: 180, a0: 0.06, a1: 0.16, v: 0.00003  });
  }

  function blit(p, sway){
    var d = p.r * dpr * 2;
    ctx.globalAlpha = p.a;
    ctx.drawImage(sprite, p.x * W + sway - d / 2, p.y * H - d / 2, d, d);
  }

  function draw(){
    ctx.clearRect(0, 0, W, H);
    var i;
    for (i = 0; i < orbs.length; i++) blit(orbs[i], 0);
    for (i = 0; i < motes.length; i++){
      var p = motes[i];
      blit(p, Math.sin(t * p.sw + p.ph) * 10 * dpr);
    }
    ctx.globalAlpha = 1;
  }

  function step(set, m){
    for (var i = 0; i < set.length; i++){
      var p = set[i];
      p.x += p.vx; p.y += p.vy;
      if (p.y < -m) p.y = 1 + m;
      if (p.x < -m) p.x = 1 + m; else if (p.x > 1 + m) p.x = -m;
    }
  }

  function loop(){
    t += 0.016;
    step(motes, 0.06); step(orbs, 0.25);
    draw();
    raf = window.requestAnimationFrame(loop);
  }

  function start(){
    ctx = c.getContext('2d');
    buildSprite(); resize(); spawn();
    window.addEventListener('resize', function(){ resize(); spawn(); if (reduce) draw(); }, { passive: true });
    if (reduce){ draw(); return; }                       // static field, no motion
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
