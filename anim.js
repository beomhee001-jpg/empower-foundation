/* Empower Foundation — site-wide motion engine (clean, modern, reliable).
   1) Scroll-reveal: reveals every .reveal element via IntersectionObserver with a
      scroll-sweep backup so nothing ever gets stuck (look is in theme.css).
   2) 3D tilt: glass cards lean toward the cursor (pointer + rAF, fine pointers only).
   3) Magnetic CTAs: primary buttons drift toward the cursor.
   4) Scroll-to-top orb with a live conic progress ring (injected, every page).
   Every module is isolated so a failure in one can't break the others. */

/* ---------- 1) Scroll reveal ---------- */
(function(){
  function run(){
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if(!reveals.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if(reduce || !('IntersectionObserver' in window)){
      reveals.forEach(function(el){ el.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    reveals.forEach(function(el){ io.observe(el); });

    // backup: reveal anything at/above the trigger line so it never gets stuck
    var vh = function(){ return window.innerHeight || document.documentElement.clientHeight; };
    var sweep = function(){
      for(var i = 0; i < reveals.length; i++){
        var el = reveals[i];
        if(el.classList.contains('in')) continue;
        if(el.getBoundingClientRect().top < vh() * 0.92){ el.classList.add('in'); io.unobserve(el); }
      }
    };
    window.addEventListener('scroll', sweep, { passive: true });
    window.addEventListener('load', sweep);
    setTimeout(sweep, 400);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

/* ---------- 2) 3D tilt on glass cards ---------- */
(function(){
  var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!fine || reduce) return;

  function init(){
    // every glass card / stat, but not the ones other scripts already drive (hub boxes)
    var cards = document.querySelectorAll('.card, .stat');
    Array.prototype.forEach.call(cards, function(el){
      if(el.closest('.hub')) return;
      var raf = null, tx = 0, ty = 0, tl = 0;
      function apply(){
        raf = null;
        el.style.transform = 'perspective(900px) rotateX(' + ty + 'deg) rotateY(' + tx + 'deg) translateY(' + tl + 'px)';
      }
      el.addEventListener('pointermove', function(e){
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width  - 0.5;   // -0.5 .. 0.5
        var py = (e.clientY - r.top)  / r.height - 0.5;
        tx = px * 9;            // rotateY
        ty = -py * 9;           // rotateX
        tl = -6;                // subtle lift
        el.classList.add('tilting');
        if(!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener('pointerleave', function(){
        tx = ty = 0; tl = 0;
        el.classList.remove('tilting');
        el.style.transform = '';   // hand back to CSS
      });
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ---------- 3) Magnetic primary CTAs ---------- */
(function(){
  var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!fine || reduce) return;

  function init(){
    var btns = document.querySelectorAll('.btn-primary, .btn-accent');
    Array.prototype.forEach.call(btns, function(el){
      if(el.closest('.bento-tile, .hub')) return;
      el.setAttribute('data-magnetic', '');
      var raf = null, mx = 0, my = 0;
      function apply(){ raf = null; el.style.transform = 'translate(' + mx + 'px,' + (my - 2) + 'px)'; }
      el.addEventListener('pointermove', function(e){
        var r = el.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width  - 0.5) * 14;
        my = ((e.clientY - r.top)  / r.height - 0.5) * 12;
        if(!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener('pointerleave', function(){ mx = my = 0; el.style.transform = ''; });
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ---------- 4) Scroll-to-top orb + progress ring ---------- */
(function(){
  function init(){
    if(document.getElementById('toTop')) return;
    var btn = document.createElement('button');
    btn.id = 'toTop';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    btn.addEventListener('click', function(){
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(btn);

    var ticking = false;
    function paint(){
      ticking = false;
      var st = window.pageYOffset || document.documentElement.scrollTop || 0;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(st / h, 1) : 0;
      btn.style.setProperty('--p', (p * 100).toFixed(1) + '%');
      btn.classList.toggle('show', st > 420);
    }
    function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(paint); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    paint();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
