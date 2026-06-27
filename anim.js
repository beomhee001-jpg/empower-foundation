/* Empower Foundation — site-wide motion engine (clean, modern, reliable).
   1) Scroll-reveal: reveals every .reveal element via IntersectionObserver with a
      scroll-sweep backup so nothing ever gets stuck (look is in theme.css).
   2) 3D tilt: glass cards lean toward the cursor (pointer + rAF, fine pointers only).
   3) Magnetic CTAs: primary buttons drift toward the cursor.
   4) Scroll-to-top orb with a live conic progress ring (injected, every page).
   Every module is isolated so a failure in one can't break the others. */

/* ---------- 0) Section choreographer ----------
   Give every section its own signature entrance by tagging its .reveal
   children with a rotating variant class, so no two adjacent sections
   animate the same way. Runs first so tags exist before anything reveals. */
(function(){
  var VARIANTS = ['v-rise','v-left','v-zoom','v-flip','v-right','v-skew','v-rotate','v-unfold','v-drop'];

  // pick sensible things to animate when a section has no .reveal of its own
  function promoteTargets(sec){
    var list = Array.prototype.slice.call(sec.querySelectorAll(
      '.section-head, .card, .partner-card, .stat, .ph-tile, .partner-copy, .quote'));
    if(!list.length){
      var cont = sec.querySelector('.container') || sec;
      list = Array.prototype.filter.call(cont.children, function(ch){
        var t = ch.tagName.toLowerCase();
        return t !== 'script' && t !== 'style' &&
          !ch.classList.contains('slide-bg') && !ch.classList.contains('bg-paths');
      });
    }
    // drop any candidate that contains another candidate (avoid double-wrapped fades)
    return list.filter(function(a){
      return !list.some(function(b){ return b !== a && a.contains(b); });
    });
  }

  function init(){
    // Phase A — make sure every section has *something* to animate.
    var nodes = document.querySelectorAll(
      'main > section, main > .section, .page-head, .rotate-band, .photo-showcase, .partner');
    var seen = [];
    Array.prototype.forEach.call(nodes, function(sec){
      if(seen.indexOf(sec) !== -1) return; seen.push(sec);
      if(sec.classList.contains('journey')) return;          // self-scrubbed; leave it alone
      if(sec.querySelector('.reveal')) return;                // author already chose what reveals
      promoteTargets(sec).forEach(function(el){ el.classList.add('reveal'); });
    });

    // Phase B — assign a signature entrance per content cluster, in document order,
    // so the look keeps changing as you scroll even within one long section.
    var reveals = document.querySelectorAll('.reveal');
    var lastParent = null, gi = -1, gidx = 0;
    Array.prototype.forEach.call(reveals, function(el){
      if(el.closest('.journey')) return;
      // new cluster whenever the parent changes (e.g. a fresh grid of cards)
      if(el.parentNode !== lastParent){ gi++; gidx = 0; lastParent = el.parentNode; }
      var v = VARIANTS[gi % VARIANTS.length];
      el.classList.remove('from-left','from-right','zoom-in');
      el.classList.add(v);
      // gentle cascade within a cluster, unless the page already staggers it
      if(!el.hasAttribute('data-d') && !el.style.transitionDelay &&
         !el.closest('.gallery-grid') && gidx > 0 && gidx < 7){
        el.style.transitionDelay = (gidx * 0.07) + 's';
      }
      gidx++;
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

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
    var cards = document.querySelectorAll('.card, .stat, .partner-card');
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
        // feed the pointer-tracking glow (CSS radial follows these)
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        el.classList.add('tilting');
        if(!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener('pointerleave', function(){
        tx = ty = 0; tl = 0;
        el.classList.remove('tilting');
        el.style.transform = '';   // hand back to CSS
        el.style.removeProperty('--mx');
        el.style.removeProperty('--my');
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

/* ---------- 3b) Cursor spotlight + film grain ---------- */
(function(){
  var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(){
    if(reduce || !fine) return;

    // cursor spotlight that eases toward the pointer
    var spot = document.createElement('div');
    spot.id = 'fx-cursor'; spot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spot);

    var tx = window.innerWidth / 2, ty = window.innerHeight / 2, cx = tx, cy = ty, raf = null, shown = false;
    function frame(){
      cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
      spot.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      if(Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4){ raf = requestAnimationFrame(frame); }
      else raf = null;
    }
    window.addEventListener('pointermove', function(e){
      if(e.pointerType === 'touch') return;
      tx = e.clientX; ty = e.clientY;
      if(!shown){ shown = true; spot.classList.add('on'); }
      if(!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
    document.addEventListener('mouseleave', function(){ spot.classList.remove('on'); shown = false; });
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
