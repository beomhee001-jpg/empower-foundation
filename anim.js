/* Empower Foundation — site-wide scroll-reveal engine (clean, modern, reliable).
   Reveals every .reveal element on scroll via IntersectionObserver, with a
   scroll-sweep backup so nothing ever gets stuck (fast scroll / anchor jumps /
   slow observers). Look (fade + slide + stagger) is defined in theme.css. */
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
