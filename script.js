// ══════════════════════════════════════════════════════════════
// PARTICLE CLASS
// ══════════════════════════════════════════════════════════════
let SPECTRAL_LIGHT = false; // theme-aware flag, updated by applyTheme
class Particle {
    constructor(x, y, size, speedX, speedY, hue) {
        this.x = x; this.y = y; this.size = size; this.baseSize = size;
        this.speedX = speedX; this.speedY = speedY;
        this.hue = hue; this.hueSpeed = 0.1 + Math.random() * 0.2;
        this.saturation = 50 + Math.random() * 30;
        this.lightness = 50 + Math.random() * 20;
        this.opacity = 0.3 + Math.random() * 0.4;
    }
    update(W, H, mouse) {
        this.hue = (this.hue + this.hueSpeed) % 360;
        this.x += this.speedX; this.y += this.speedY;
        if (mouse.active) {
            const dx = this.x - mouse.x, dy = this.y - mouse.y;
            const dist = Math.sqrt(dx*dx + dy*dy), maxDist = 150;
            if (dist < maxDist && dist > 0) {
                const force = (maxDist - dist) / maxDist;
                const angle = Math.atan2(dy, dx);
                this.speedX += Math.cos(angle) * force * 0.15;
                this.speedY += Math.sin(angle) * force * 0.15;
                this.size = this.baseSize + force * 2.5;
            } else { this.size += (this.baseSize - this.size) * 0.05; }
        } else { this.size += (this.baseSize - this.size) * 0.02; }
        this.speedX *= 0.98; this.speedY *= 0.98;
        const s = Math.sqrt(this.speedX*this.speedX + this.speedY*this.speedY);
        if (s < 0.05) { const a = Math.random()*Math.PI*2; this.speedX = Math.cos(a)*0.05; this.speedY = Math.sin(a)*0.05; }
        if (s > 1.2) { this.speedX = (this.speedX/s)*1.2; this.speedY = (this.speedY/s)*1.2; }
        if (this.x > W+20) this.x = -20; if (this.x < -20) this.x = W+20;
        if (this.y > H+20) this.y = -20; if (this.y < -20) this.y = H+20;
    }
    draw(ctx) {
        // On light theme, render darker/more saturated dots so they stay visible
        const L = SPECTRAL_LIGHT ? Math.min(this.lightness, 46) : this.lightness;
        const S = SPECTRAL_LIGHT ? Math.min(this.saturation + 18, 92) : this.saturation;
        const color = `hsl(${this.hue},${S}%,${L}%)`;
        ctx.save();
        ctx.globalAlpha = SPECTRAL_LIGHT ? Math.min(this.opacity + 0.22, 0.85) : this.opacity;
        ctx.shadowBlur = SPECTRAL_LIGHT ? 6 : 15; ctx.shadowColor = color; ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
        if (!SPECTRAL_LIGHT && this.opacity > 0.25) {
            ctx.shadowBlur = 30; ctx.globalAlpha = this.opacity * 0.15;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size*3, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    }
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {

// ── Particles ────────────────────────────────────────────────
const canvas = document.getElementById('particles-canvas');
if (!canvas) return;
const ctx = canvas.getContext('2d');
let particles = [], canvasWidth, canvasHeight, animationId;
let mouse = { x: -9999, y: -9999, active: false };
// Touch devices: lighter background, no pointer-driven effects (saves battery/jank)
const IS_TOUCH = window.matchMedia('(hover: none), (pointer: coarse)').matches;
// Lightweight mode: weak devices skip the heavy canvas/tilt/parallax work.
// The class is set super-early by the inline <head> detector.
function liteOn() { return document.documentElement.classList.contains('lite-mode'); }
document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
document.addEventListener('mouseleave', () => { mouse.active = false; });
function resizeCanvas() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    canvasWidth = canvas.width; canvasHeight = canvas.height; initParticles();
}
function initParticles() {
    particles = [];
    if (liteOn()) return;                 // no particles in lightweight mode
    // Fewer particles on phones/tablets — the O(n²) link drawing is the heavy part
    const cap = IS_TOUCH ? 42 : 120;
    const count = Math.min(cap, Math.floor((canvasWidth * canvasHeight) / 10000));
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(Math.random()*canvasWidth, Math.random()*canvasHeight,
            1.5+Math.random()*3.5, (Math.random()-.5)*.6, (Math.random()-.5)*.6, 210+Math.random()*120));
    }
}
function drawLines() {
    const maxDist = 130;
    for (let i = 0; i < particles.length; i++)
        for (let j = i+1; j < particles.length; j++) {
            const dx = particles[i].x-particles[j].x, dy = particles[i].y-particles[j].y;
            const dist = dx*dx+dy*dy;
            if (dist < maxDist*maxDist) {
                const a = (1-Math.sqrt(dist)/maxDist) * (SPECTRAL_LIGHT ? 0.28 : 0.2);
                ctx.strokeStyle = SPECTRAL_LIGHT ? `rgba(99,102,241,${a})` : `rgba(255,255,255,${a})`;
                ctx.lineWidth = 0.5; ctx.beginPath();
                ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y); ctx.stroke();
            }
        }
    if (mouse.active) {
        const mmd = 180;
        for (const p of particles) {
            const dx = p.x-mouse.x, dy = p.y-mouse.y, dist = dx*dx+dy*dy;
            if (dist < mmd*mmd) {
                ctx.strokeStyle = `rgba(99,102,241,${(1-Math.sqrt(dist)/mmd)*0.2})`;
                ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(mouse.x,mouse.y); ctx.lineTo(p.x,p.y); ctx.stroke();
            }
        }
    }
}
// ── Runtime FPS watchdog ─────────────────────────────────────
// Some devices report plenty of cores yet still chug. If the canvas
// can't hold a decent frame rate during the first couple of seconds
// (and the user hasn't explicitly chosen a mode), drop to lite mode.
let _perfStart = null, _perfFrames = 0, _perfChecked = false;
function checkFps(ts) {
    if (_perfChecked || !window.__SPECTRAL_LITE_AUTO) return;
    if (_perfStart === null) { _perfStart = ts; return; }
    const elapsed = ts - _perfStart;
    if (elapsed < 600) return;            // warm-up grace period
    _perfFrames++;
    if (elapsed >= 2600) {                // ~2s sample window after warm-up
        _perfChecked = true;
        const fps = (_perfFrames * 1000) / (elapsed - 600);
        if (fps < 30 && typeof enableLiteMode === 'function') enableLiteMode(true, true);
    }
}
function animate(ts) {
    if (liteOn()) { cancelAnimationFrame(animationId); return; }   // stop in lite mode
    checkFps(ts || performance.now());
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
    particles.forEach(p => { p.update(canvasWidth,canvasHeight,mouse); p.draw(ctx); });
    drawLines();
    animationId = requestAnimationFrame(animate);
}
window.addEventListener('resize', () => { clearTimeout(window._resizeTimer); window._resizeTimer = setTimeout(resizeCanvas, 200); });
resizeCanvas();
if (!liteOn()) animate();                 // don't even start the loop on weak devices

// ── Tab navigation ───────────────────────────────────────────
const navButtons = document.querySelectorAll('.nav-btn');
let isTransitioning = false;
navButtons.forEach(btn => {
    btn.addEventListener('click', e => {
        e.preventDefault(); if (isTransitioning) return;
        const targetId = btn.getAttribute('data-target');
        if (!targetId || btn.classList.contains('active')) return;
        isTransitioning = true;
        navButtons.forEach(b => b.classList.remove('active')); btn.classList.add('active');
        const cur = document.querySelector('.tab-content.active-tab');
        const next = document.getElementById(targetId);
        if (cur && next) {
            cur.style.opacity='0'; cur.style.transform='translateY(20px) scale(0.97)';
            setTimeout(() => {
                cur.classList.remove('active-tab'); cur.style.display='none';
                next.style.display='block'; next.style.opacity='0'; next.style.transform='translateY(20px) scale(0.97)';
                void next.offsetWidth;
                requestAnimationFrame(() => {
                    next.classList.add('active-tab'); next.style.opacity='1'; next.style.transform='translateY(0) scale(1)';
                    setTimeout(() => { isTransitioning=false; reinitScrollAnimations(); }, 300);
                });
            }, 250);
        }
        history.pushState(null,'',`#${targetId}`);
    });
});
window.addEventListener('popstate', () => {
    const hash = window.location.hash.slice(1)||'home';
    const btn = document.querySelector(`[data-target="${hash}"]`);
    if (btn && !isTransitioning) btn.click();
});

// Clicking the top-left logo returns to the Home tab (or scrolls to top if already there)
const logoContainer = document.querySelector('.logo-container');
if (logoContainer) {
    logoContainer.style.cursor = 'pointer';
    logoContainer.setAttribute('role', 'button');
    logoContainer.setAttribute('aria-label', 'Go to home');
    logoContainer.addEventListener('click', () => {
        const homeBtn = document.querySelector('.nav-links-container [data-target="home"]');
        if (homeBtn && !homeBtn.classList.contains('active')) homeBtn.click();
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ── Scroll animations ────────────────────────────────────────
const scrollObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { setTimeout(()=>e.target.classList.add('visible'),80); scrollObserver.unobserve(e.target); } });
}, { threshold:0.15, rootMargin:'0px 0px -50px 0px' });
function reinitScrollAnimations() {
    const active = document.querySelector('.tab-content.active-tab');
    if (active) active.querySelectorAll('.animate-on-scroll:not(.visible)').forEach(el => scrollObserver.observe(el));
}
document.querySelectorAll('.animate-on-scroll').forEach(el => scrollObserver.observe(el));

// ── Magnetic buttons ─────────────────────────────────────────
document.querySelectorAll('.magnetic-btn').forEach(btn => {
    let d={cx:0,cy:0,tx:0,ty:0},raf=null;
    function upd(){const l=0.15;d.cx+=(d.tx-d.cx)*l;d.cy+=(d.ty-d.cy)*l;btn.style.transform=`translate(${d.cx}px,${d.cy}px)`;if(Math.abs(d.tx-d.cx)>0.1||Math.abs(d.ty-d.cy)>0.1)raf=requestAnimationFrame(upd);else raf=null;}
    btn.addEventListener('mousemove',e=>{if(liteOn())return;const r=btn.getBoundingClientRect();d.tx=(e.clientX-r.left-r.width/2)*0.3;d.ty=(e.clientY-r.top-r.height/2)*0.3;if(!raf)raf=requestAnimationFrame(upd);});
    btn.addEventListener('mouseleave',()=>{d.tx=0;d.ty=0;if(!raf)raf=requestAnimationFrame(upd);});
});

// ── 3D tilt ──────────────────────────────────────────────────
const tiltEls = document.querySelectorAll('.tilt-card-lg,.tilt-card-sm');
const tiltData = new WeakMap();
tiltEls.forEach(el => tiltData.set(el,{cx:0,cy:0,tx:0,ty:0}));
let tiltRaf=null;
function updateTilt(){let needs=false;tiltEls.forEach(el=>{const d=tiltData.get(el),l=0.1;d.cx+=(d.tx-d.cx)*l;d.cy+=(d.ty-d.cy)*l;if(Math.abs(d.tx-d.cx)>0.01||Math.abs(d.ty-d.cy)>0.01)needs=true;el.style.transform=`perspective(1200px) rotateX(${d.cx}deg) rotateY(${d.cy}deg) scale(1.01)`;});if(needs)tiltRaf=requestAnimationFrame(updateTilt);else tiltRaf=null;}
let mmThrottle=null;
document.addEventListener('mousemove',e=>{if(liteOn()||mmThrottle)return;mmThrottle=setTimeout(()=>{mmThrottle=null;},16);tiltEls.forEach(el=>{const r=el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const exp={left:r.left-80,right:r.right+80,top:r.top-80,bottom:r.bottom+80};const hover=(e.clientX>=exp.left&&e.clientX<=exp.right&&e.clientY>=exp.top&&e.clientY<=exp.bottom);const d=tiltData.get(el);const i=el.classList.contains('tilt-card-lg')?25:18;if(hover){d.tx=((y-r.height/2)/i)*-1;d.ty=(x-r.width/2)/i;}else{d.tx=0;d.ty=0;}});if(!tiltRaf)tiltRaf=requestAnimationFrame(updateTilt);});

// ── Ripple ───────────────────────────────────────────────────
document.querySelectorAll('.btn-primary,.btn-secondary,.lu-play').forEach(btn=>{btn.addEventListener('click',function(e){if(liteOn())return;const r=this.getBoundingClientRect(),sp=document.createElement('span');sp.className='ripple-effect';sp.style.left=(e.clientX-r.left)+'px';sp.style.top=(e.clientY-r.top)+'px';this.appendChild(sp);setTimeout(()=>sp.remove(),600);});});

// ── Theme toggle ─────────────────────────────────────────────
const THEME_KEY = 'spectral_theme';
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
function applyTheme(theme, animate) {
    if (animate) {
        document.body.classList.add('theme-switching');
        setTimeout(() => document.body.classList.remove('theme-switching'), 500);
    }
    SPECTRAL_LIGHT = (theme === 'light');
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        if (themeIcon) themeIcon.className = 'fas fa-moon';
    } else {
        document.body.classList.remove('light-theme');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
    }
}
applyTheme(localStorage.getItem(THEME_KEY) || 'dark', false);
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const next = document.body.classList.contains('light-theme') ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next, true);
    });
}

// ── Lightweight (performance) mode ───────────────────────────
// The <head> detector already decided the initial mode. Here we
// wire up the warning banner and the toggle FAB so the user can
// switch between the full and light versions.
const LITE_KEY = 'spectral_lite';
const LITE_BANNER_KEY = 'spectral_lite_banner_dismissed';
const liteToggleBtn = document.getElementById('liteToggleBtn');
const liteIcon = document.getElementById('liteIcon');

function updateLiteFab() {
    if (!liteToggleBtn) return;
    const on = liteOn();
    liteToggleBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    liteToggleBtn.title = on ? 'Лёгкий режим включён — нажмите для полной версии'
                             : 'Включить лёгкую версию сайта';
    if (liteIcon) liteIcon.className = on ? 'fas fa-bolt' : 'fas fa-feather';
}

let liteBannerEl = null;
function showLiteBanner() {
    if (liteBannerEl || !liteOn()) return;
    try { if (sessionStorage.getItem(LITE_BANNER_KEY) === '1') return; } catch (e) {}
    const b = document.createElement('div');
    b.className = 'lite-banner';
    b.setAttribute('role', 'status');
    b.innerHTML =
        '<i class="fas fa-feather lite-banner-icon" aria-hidden="true"></i>' +
        '<div class="lite-banner-text"><strong>Облегчённая версия.</strong> ' +
        'Для вашего устройства включён лёгкий режим — меньше нагрузки и без подтормаживаний.</div>' +
        '<div class="lite-banner-actions">' +
            '<button type="button" class="lite-banner-full">Полная версия</button>' +
            '<button type="button" class="lite-banner-close" aria-label="Скрыть"><i class="fas fa-times" aria-hidden="true"></i></button>' +
        '</div>';
    document.body.appendChild(b);
    liteBannerEl = b;
    requestAnimationFrame(() => b.classList.add('show'));
    b.querySelector('.lite-banner-full').addEventListener('click', switchToFull);
    b.querySelector('.lite-banner-close').addEventListener('click', () => {
        try { sessionStorage.setItem(LITE_BANNER_KEY, '1'); } catch (e) {}
        b.classList.remove('show');
        setTimeout(() => { b.remove(); liteBannerEl = null; }, 400);
    });
}

// Live switch to lite mode without a reload (used by the FPS watchdog)
function enableLiteMode(persist, fromWatchdog) {
    document.documentElement.classList.add('lite-mode');
    window.__SPECTRAL_LITE = true;
    if (persist) { try { localStorage.setItem(LITE_KEY, 'on'); } catch (e) {} }
    cancelAnimationFrame(animationId);
    try { ctx.clearRect(0, 0, canvasWidth, canvasHeight); } catch (e) {}
    updateLiteFab();
    showLiteBanner();
    if (fromWatchdog) console.log('%c⚡ Spectral: low FPS detected → switched to the lightweight version', 'color:#f59e0b;font-weight:bold;');
}

// Mode switches reload the page so each version starts from a clean state
function switchToFull() {
    try { localStorage.setItem(LITE_KEY, 'off'); } catch (e) {}
    location.reload();
}
function switchToLite() {
    try { localStorage.setItem(LITE_KEY, 'on'); } catch (e) {}
    try { sessionStorage.setItem(LITE_BANNER_KEY, '1'); } catch (e) {}  // user opted in, don't nag
    location.reload();
}

if (liteToggleBtn) {
    liteToggleBtn.addEventListener('click', () => { liteOn() ? switchToFull() : switchToLite(); });
}
updateLiteFab();
if (liteOn()) showLiteBanner();

// ── Scroll to top ────────────────────────────────────────────
const scrollTopBtn = document.getElementById('scrollToTop');
window.addEventListener('scroll',()=>{scrollTopBtn&&(scrollTopBtn.classList.toggle('visible',window.scrollY>500));});
scrollTopBtn&&scrollTopBtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

// ── Pulsing dot ──────────────────────────────────────────────
const pulseDot = document.querySelector('.pulse-dot');
if(pulseDot){let sc=1,dir=1;(function pulse(){if(liteOn()){pulseDot.style.transform='';return;}sc+=0.02*dir;if(sc>=1.3)dir=-1;if(sc<=1)dir=1;pulseDot.style.transform=`scale(${sc})`;requestAnimationFrame(pulse);})();}

// ── Parallax ─────────────────────────────────────────────────
const ambients = document.querySelectorAll('.ambient-light');
window.addEventListener('scroll',()=>{if(liteOn())return;const s=window.scrollY;ambients.forEach((l,i)=>{l.style.transform=`translateY(${-(s*(0.05+i*0.02))}px)`;});});

// ── Navbar scroll (theme-aware) ──────────────────────────────
const navbar=document.querySelector('.navbar');let lastScroll=0;
window.addEventListener('scroll',()=>{
    const cur=window.scrollY;
    if(!navbar){return;}
    if(navbar.classList.contains('nav-open')){ lastScroll=cur; return; } // keep bar put while menu is open
    if(cur>100){
        navbar.style.transform = cur>lastScroll ? 'translateY(-100%)' : 'translateY(0)';
        if(cur>lastScroll){
            navbar.style.background=''; navbar.style.boxShadow='';
        }else{
            // Pinned bar uses a theme-appropriate solid backdrop
            navbar.style.background = SPECTRAL_LIGHT ? 'rgba(234,236,252,0.92)' : 'rgba(5,5,7,0.95)';
            navbar.style.backdropFilter='blur(20px)';
            navbar.style.boxShadow = SPECTRAL_LIGHT ? '0 4px 30px rgba(99,102,241,0.12)' : '0 4px 30px rgba(0,0,0,0.3)';
        }
    }else{
        navbar.style.transform='translateY(0)';
        navbar.style.background=''; navbar.style.boxShadow='';
    }
    lastScroll=cur;
});

// ── Mobile hamburger menu ────────────────────────────────────
const navBurger = document.getElementById('navBurger');
const navBackdrop = document.getElementById('navBackdrop');
function setNavOpen(open) {
    if (!navbar) return;
    navbar.classList.toggle('nav-open', open);
    if (navBackdrop) navBackdrop.classList.toggle('show', open);
    if (navBurger) navBurger.setAttribute('aria-expanded', open ? 'true' : 'false');
    // make sure the bar is visible when opening
    if (open) { navbar.style.transform = 'translateY(0)'; }
}
if (navBurger) navBurger.addEventListener('click', () => setNavOpen(!navbar.classList.contains('nav-open')));
if (navBackdrop) navBackdrop.addEventListener('click', () => setNavOpen(false));
// close the menu after picking a destination
document.querySelectorAll('.nav-links-container .nav-btn').forEach(btn => {
    btn.addEventListener('click', () => setNavOpen(false));
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') setNavOpen(false); });
// auto-close if the viewport grows back to desktop
window.addEventListener('resize', () => { if (window.innerWidth > 820) setNavOpen(false); });

// ── Terminal animation ───────────────────────────────────────
// Typewriter terminal: types each line character-by-character with a caret.
let _termTyping=false;
function runTerminal(){
    const body=document.getElementById('terminalBody');
    if(!body||_termTyping) return;
    const allLines=[...body.querySelectorAll('.t-line')];
    const typed=allLines.filter(l=>l.querySelector('.t-text[data-text]'));
    const cursorLine=body.querySelector('.t-cursorline');
    _termTyping=true;
    allLines.forEach(l=>l.style.opacity='0');
    typed.forEach(l=>{const t=l.querySelector('.t-text');t.textContent='';l.classList.remove('typing');});
    let i=0;
    function typeLine(){
        if(i>=typed.length){ if(cursorLine) cursorLine.style.opacity='1'; _termTyping=false; return; }
        const line=typed[i], el=line.querySelector('.t-text');
        const chars=[...(el.getAttribute('data-text')||'')];  // spread → safe for emoji
        line.style.opacity='1'; line.classList.add('typing');
        let c=0;
        (function ch(){
            el.textContent=chars.slice(0,c).join(''); c++;
            if(c<=chars.length){ setTimeout(ch, 16+Math.random()*26); }
            else { line.classList.remove('typing'); i++; setTimeout(typeLine, 230); }
        })();
    }
    typeLine();
}
// No unobserve → replays each time the console scrolls back into view (flag guards overlap).
const termObs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)runTerminal();}),{threshold:0.5});
const termBody=document.getElementById('terminalBody');if(termBody)termObs.observe(termBody);

// ── af-bar animation ─────────────────────────────────────────
const barObs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.querySelectorAll('.af-bar-fill').forEach(f=>{const w=f.getAttribute('data-width')+'%';setTimeout(()=>{f.style.width=w;},200);});barObs.unobserve(e.target);}}),{threshold:0.3});
document.querySelectorAll('.af-showcase').forEach(el=>barObs.observe(el));

// ── Counter animation ────────────────────────────────────────
function animCounter(el,target,dur=1800){let suffix='';if(target>=1000){suffix='K+';target/=1000;}let start=null;(function step(ts){if(!start)start=ts;const p=Math.min((ts-start)/dur,1);const e2=1-Math.pow(1-p,3);const cur=target*e2;el.textContent=(Number.isInteger(target)?Math.floor(cur):cur.toFixed(1))+suffix;if(p<1)requestAnimationFrame(step);else el.textContent=(Number.isInteger(target)?target:target.toFixed(1))+suffix;})(null);}
const cntObs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.querySelectorAll('.af-stat-num[data-count]').forEach(el=>{animCounter(el,parseInt(el.getAttribute('data-count')));});cntObs.unobserve(e.target);}}),{threshold:0.4});
document.querySelectorAll('.af-stats-strip').forEach(el=>cntObs.observe(el));

// ── Code editor tabs ─────────────────────────────────────────
document.querySelectorAll('.code-tab').forEach(tab=>{tab.addEventListener('click',()=>{const p=tab.getAttribute('data-tab');document.querySelectorAll('.code-tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');document.querySelectorAll('.code-pane').forEach(pn=>{const show=pn.getAttribute('data-pane')===p;pn.style.display=show?'block':'none';if(show){pn.classList.remove('code-pane--in');void pn.offsetWidth;pn.classList.add('code-pane--in');}});});});

// Code editor appearance: play the reveal on the active pane the first time it scrolls into view.
const codeEditorEl=document.querySelector('.code-editor');
if(codeEditorEl){
    const ceObs=new IntersectionObserver(entries=>entries.forEach(e=>{
        if(!e.isIntersecting) return;
        const at=document.querySelector('.code-tab.active');
        const dp=at?at.getAttribute('data-tab'):null;
        const pane=dp?document.querySelector(`.code-pane[data-pane="${dp}"]`):document.querySelector('.code-pane');
        if(pane){ pane.classList.remove('code-pane--in'); void pane.offsetWidth; pane.classList.add('code-pane--in'); }
        ceObs.unobserve(e.target);
    }),{threshold:0.35});
    ceObs.observe(codeEditorEl);
}

// ── Tech bar animation ───────────────────────────────────────
const tbObs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.querySelectorAll('.tech-bar div').forEach(b=>{const w=b.style.width;b.style.width='0%';setTimeout(()=>{b.style.transition='width 1.2s var(--ease-smooth)';b.style.width=w;},100);});tbObs.unobserve(e.target);}}),{threshold:0.2});
document.querySelectorAll('.tech-stack-grid').forEach(el=>tbObs.observe(el));

// ── Lightweight toast ────────────────────────────────────────
function showToast(msg, icon='circle-info'){
    let host=document.getElementById('toastHost');
    if(!host){host=document.createElement('div');host.id='toastHost';host.className='toast-host';document.body.appendChild(host);}
    const t=document.createElement('div');t.className='toast';
    t.innerHTML=`<i class="fas fa-${icon}"></i><span></span>`;
    t.querySelector('span').textContent=msg;
    host.appendChild(t);
    requestAnimationFrame(()=>t.classList.add('show'));
    setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),420);},3800);
}

// ── Download CTA (no public build yet → friendly toast) ──────
const downloadBtn=document.getElementById('downloadBtn');
if(downloadBtn)downloadBtn.addEventListener('click',e=>{
    e.preventDefault();
    showToast('Desktop build is coming soon — follow updates on Discord.','circle-info');
});

// ── FAQ accordion — smooth scrollHeight-based ────────────────
document.querySelectorAll('#faqList .faq-q').forEach(q => {
    q.addEventListener('click', () => {
        const item   = q.closest('.faq-item');
        const answer = item.querySelector('.faq-a');
        const isOpen = item.classList.contains('open');

        // collapse all others
        document.querySelectorAll('#faqList .faq-item').forEach(i => {
            if (i !== item && i.classList.contains('open')) {
                i.classList.remove('open');
                const a = i.querySelector('.faq-a');
                a.style.maxHeight = a.scrollHeight + 'px';
                requestAnimationFrame(() => { a.style.maxHeight = '0px'; });
            }
        });

        if (!isOpen) {
            item.classList.add('open');
            answer.style.maxHeight = '0px';
            requestAnimationFrame(() => {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            });
        } else {
            item.classList.remove('open');
            answer.style.maxHeight = answer.scrollHeight + 'px';
            requestAnimationFrame(() => { answer.style.maxHeight = '0px'; });
        }
    });
});

// ══════════════════════════════════════════════════════════════
// STORAGE KEYS
// ══════════════════════════════════════════════════════════════
const K_USERS   = 'spectral_site_users';
const K_SESSION = 'spectral_site_session';
const K_MC_PFX  = 'spectral_launcher_';
const K_MC_ACT  = 'spectral_mc_active_';
const K_FORUM   = 'spectral_forum';
const K_NEWS    = 'spectral_news';

// ── Supabase cloud database ───────────────────────────────────
// Accounts + Minecraft profiles are mirrored to a Supabase project so they
// persist across devices and hosts (local, GitHub Pages, future launcher).
// The anon key is public by design and safe to ship in client code.
const SUPABASE_URL      = 'https://iliokfdcwdcnyjfwmbie.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsaW9rZmRjd2RjbnlqZndtYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NDY4MTYsImV4cCI6MjA5ODIyMjgxNn0.28lW48163YxtcxAuACtyXHMcj1e3SGOCmiXZq29C2Ck';
let cloud = null;
try {
    if (window.supabase && window.supabase.createClient) {
        cloud = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn('Supabase library not loaded — running in local-only mode.');
    }
} catch (e) { console.warn('Supabase init failed — running in local-only mode.', e); }
// While true, local writes are NOT pushed back to the cloud (used during the
// initial load so freshly-downloaded data is not echoed straight back up).
let cloudSyncing = false;

// ── Censorship ───────────────────────────────────────────────
const BANNED = ['fuck','shit','ass','bitch','bastard','crap','dick','cock','nigga',
    'блядь','блять','сука','пиздец','пизда','хуй','хуйня','ебать','ебал','залупа',
    'мудак','долбоёб','шлюха','пидор','ублюдок','ёбаный','похуй','нихуя','заебал'];
function censor(text) {
    let r = text;
    BANNED.forEach(w => { r = r.replace(new RegExp(w, 'gi'), '*'.repeat(w.length)); });
    return r;
}

// ── XSS protection ───────────────────────────────────────────
// Escape any user-controlled string before it is placed into innerHTML
// (both text and attribute contexts). Prevents stored XSS via forum posts,
// display names, bios, profile usernames and news entries.
function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}
// Strip control chars and clamp length for stored fields
function sanitizeField(s, max) {
    return String(s == null ? '' : s).replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, max || 200);
}

// ── Password hashing ─────────────────────────────────────────
// Passwords are never stored in plaintext. Hashed with SHA-256 (+ a fixed
// pepper) via the Web Crypto API, with a clearly-weaker fallback if Web Crypto
// is unavailable. NOTE: client-side hashing only prevents plaintext exposure in
// localStorage / password reuse — it is NOT a substitute for server-side auth.
const PW_PEPPER = 'spectral_pepper_v1:';
async function hashPassword(pw) {
    const data = new TextEncoder().encode(PW_PEPPER + pw);
    try {
        if (window.crypto && crypto.subtle) {
            const buf = await crypto.subtle.digest('SHA-256', data);
            return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
        }
    } catch {}
    // Fallback: non-cryptographic double-FNV (only used without Web Crypto)
    let h1 = 0x811c9dc5 >>> 0, h2 = 0x01234567 >>> 0;
    const s = PW_PEPPER + pw;
    for (let i = 0; i < s.length; i++) {
        h1 = Math.imul(h1 ^ s.charCodeAt(i), 0x01000193) >>> 0;
        h2 = Math.imul(h2 ^ s.charCodeAt(i), 0x85ebca77) >>> 0;
    }
    return 'w' + h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}
function looksHashed(s) { return /^[a-f0-9]{64}$/.test(s) || /^w[a-f0-9]{16}$/.test(s); }

// ══════════════════════════════════════════════════════════════
// SITE USERS (two-tier system)
// ══════════════════════════════════════════════════════════════
const DEFAULT_SITE_USERS = [
    { id:'su_dev', username:'_kaiserr_',  password:'devpass', role:'DEV',       displayName:'_kaiserr_',  bio:'Developer of Spectral',    avatar:'', registeredAt:'01.01.2026', totalTimeSec:154800, visitCount:212, lastSeen:'2026-06-28T09:10:00Z', banned:false },
    { id:'su_adm', username:'Console',    password:'1234',    role:'ADMIN',     displayName:'Console',    bio:'Keeping the servers tidy', avatar:'', registeredAt:'10.02.2024', totalTimeSec:98400,  visitCount:140, lastSeen:'2026-06-27T20:00:00Z', banned:false },
    { id:'su_mod', username:'Redstone',   password:'1234',    role:'MODERATOR', displayName:'Redstone',   bio:'Forum moderator',          avatar:'', registeredAt:'05.03.2024', totalTimeSec:61200,  visitCount:97,  lastSeen:'2026-06-26T14:30:00Z', banned:false },
    { id:'su_pro', username:'Steve_Pro',  password:'1234',    role:'PRO',       displayName:'Steve_Pro',  bio:'Minecraft enthusiast',     avatar:'', registeredAt:'15.01.2024', totalTimeSec:45720,  visitCount:64,  lastSeen:'2026-06-25T11:00:00Z', banned:false },
    { id:'su_vet', username:'Enderman42', password:'1234',    role:'VETERAN',   displayName:'Enderman42', bio:'Been here since day one',  avatar:'', registeredAt:'22.04.2024', totalTimeSec:23400,  visitCount:38,  lastSeen:'2026-06-20T18:45:00Z', banned:false },
    { id:'su_usr', username:'Alex',       password:'1234',    role:'USER',      displayName:'Alex',       bio:'Builder',                  avatar:'', registeredAt:'20.02.2024', totalTimeSec:7200,   visitCount:12,  lastSeen:'2026-06-12T08:20:00Z', banned:false }
];
const DEFAULT_MC_ACCOUNTS = {
    'su_dev': [
        { id:'la_d1', username:'_kaiserr_', type:'elyby',     addedAt:'01.01.2026', playtime:'0h',   favorite:false, password:'', uuid:offlineUuid('_kaiserr_'), lastUsed:null }
    ],
    'su_pro': [
        { id:'la_p1', username:'Steve_Pro',  type:'microsoft', addedAt:'15.01.2024', playtime:'127h', favorite:false, password:'', uuid:offlineUuid('Steve_Pro'),  lastUsed:null },
        { id:'la_p2', username:'Enderman42', type:'offline',   addedAt:'20.04.2024', playtime:'23h',  favorite:true,  password:'', uuid:offlineUuid('Enderman42'), lastUsed:null }
    ],
    'su_usr': [
        { id:'la_u1', username:'Alex',       type:'elyby',     addedAt:'20.02.2024', playtime:'43h',  favorite:false, password:'', uuid:offlineUuid('Alex'),       lastUsed:null }
    ],
    'su_adm': [
        { id:'la_a1', username:'Console',    type:'microsoft', addedAt:'10.02.2024', playtime:'88h',  favorite:false, password:'', uuid:offlineUuid('Console'),    lastUsed:null }
    ],
    'su_mod': [
        { id:'la_m1', username:'Redstone',   type:'microsoft', addedAt:'05.03.2024', playtime:'54h',  favorite:true,  password:'', uuid:offlineUuid('Redstone'),   lastUsed:null },
        { id:'la_m2', username:'TorchBearer',type:'offline',   addedAt:'06.03.2024', playtime:'9h',   favorite:false, password:'', uuid:offlineUuid('TorchBearer'),lastUsed:null }
    ],
    'su_vet': [
        { id:'la_v1', username:'Enderman42', type:'elyby',     addedAt:'22.04.2024', playtime:'31h',  favorite:false, password:'', uuid:offlineUuid('Enderman42'), lastUsed:null }
    ]
};
const DEFAULT_FORUM = [
    { id:'fp_1', authorId:'su_pro', authorName:'Steve_Pro', title:'Add 3D skin preview in launcher',
      text:'It would be great to see a 3D skin preview in the Accounts tab, similar to NameMC. Would make it much easier to see how your skin looks before launching.',
      date:'25.06.2026', upvotes:['su_usr'], approved:true, rejected:false },
    { id:'fp_2', authorId:'su_usr', authorName:'Alex', title:'Dark/Light theme toggle',
      text:'Please add an option to switch between dark and light themes. Some players prefer a lighter interface when playing during the day.',
      date:'24.06.2026', upvotes:['su_pro','su_dev'], approved:true, rejected:false }
];
const DEFAULT_NEWS = [
    { id:'news_modmanager_redesign', date:'Jun 28, 2026', title:'Mod Manager Redesign', isCurrent:true, dimmed:false, items:[
        {type:'imp',text:'Mod Manager rebuilt to match the Library layout — the mod list sits on the left, with every action grouped in a panel on the right'},
        {type:'imp',text:'Bigger window and a cleaner header bar with a segmented Installed / Discover switch'},
        {type:'imp',text:'Unified icons and styling across the dialog — removed the icon chip backings and the dark box behind the tabs'}
    ]},
    { id:'news_site_overhaul', date:'Jun 26, 2026', title:'Website 2.0 — Accounts, Forum & Themes', isCurrent:false, dimmed:false, items:[
        {type:'add',text:'Two-tier accounts: a site account now holds your own set of Minecraft launcher profiles'},
        {type:'add',text:'Community Ideas & Suggestions forum with upvotes and automatic content moderation'},
        {type:'add',text:'Admin panel to manage users, roles and forum posts — developers can publish updates right from the site'},
        {type:'add',text:'Brand-new light theme with an animated aurora background and a one-click dark/light toggle'},
        {type:'imp',text:'Polished login dialog, crisper 100px avatars and dozens of layout and colour fixes'}
    ]},
    { id:'news_1', date:'Jun 26, 2026', title:'Typography & SpectrAI Assistant', isCurrent:false, dimmed:false, items:[
        {type:'imp',text:'New refined fonts across the app — Sora for headings and Plus Jakarta Sans for the interface'},
        {type:'add',text:'Built-in SpectrAI assistant: a sliding chat panel that helps with mods, memory and launch errors'},
        {type:'imp',text:'Accounts tab rebuilt to match the Library layout — list on the left, detailed profile card on the right'}
    ]},
    { id:'news_2', date:'Jun 25, 2026', title:'Performance & Launch Reliability', isCurrent:false, dimmed:false, items:[
        {type:'fix',text:'Modded builds now auto-install their required vanilla base, so they actually start'},
        {type:'add',text:'Step-by-step console diagnostics that explain exactly why a launch failed'},
        {type:'imp',text:'Smoother animations: cached particle background and paused effects on hidden tabs'},
        {type:'imp',text:'Native libraries are cached after first launch for faster restarts'}
    ]},
    { id:'news_3', date:'Jun 24, 2026', title:'Interface, Console & Localization', isCurrent:false, dimmed:false, items:[
        {type:'add',text:'Full RU / EN coverage across every tab and dialog'},
        {type:'add',text:'Redesigned Console with colored log levels, search, copy and export'},
        {type:'imp',text:'Unified glassmorphism panels, centered titles and consistent controls'}
    ]},
    { id:'news_4', date:'Project Core', title:'Launcher Foundation', isCurrent:false, dimmed:true, items:[
        {type:'add',text:'Qt 6 / C++17 desktop app built with CMake and MinGW'},
        {type:'add',text:'Instance library, Java manager, version installer and mod manager'},
        {type:'add',text:'Discord Rich Presence, news system, settings and crash/log tooling'}
    ]}
];

// ── Storage helpers ───────────────────────────────────────────
function loadSiteUsers()  { try{const r=localStorage.getItem(K_USERS); return r?JSON.parse(r):null;}catch{return null;} }
function saveSiteUsers(u) { try{localStorage.setItem(K_USERS,JSON.stringify(u));}catch{} cloudPushUsers(u); }
function loadSession()    { return localStorage.getItem(K_SESSION)||null; }
function saveSession(id)  { try{if(id)localStorage.setItem(K_SESSION,id);else localStorage.removeItem(K_SESSION);}catch{} }
function loadMcAccounts(uid)   { try{const r=localStorage.getItem(K_MC_PFX+uid);return r?JSON.parse(r):null;}catch{return null;} }
function saveMcAccounts(uid,a) { try{localStorage.setItem(K_MC_PFX+uid,JSON.stringify(a));}catch{} cloudPushMc(uid); }
function loadActiveMc(uid)     { return localStorage.getItem(K_MC_ACT+uid)||null; }
function saveActiveMc(uid,id)  { try{if(id)localStorage.setItem(K_MC_ACT+uid,id);else localStorage.removeItem(K_MC_ACT+uid);}catch{} cloudPushMc(uid); }

// ── Cloud sync: push helpers ──────────────────────────────────
// Mirror the just-written local state up to Supabase. Fire-and-forget: any
// failure is logged but never blocks the UI, so the site keeps working offline.
function cloudPushUsers(users) {
    if (!cloud || cloudSyncing || !Array.isArray(users)) return;
    const rows = users.map(u => ({
        id: u.id, username: u.username, email: u.email || '', password_hash: u.password || '',
        role: u.role || 'USER', display_name: u.displayName || u.username,
        bio: u.bio || '', avatar: u.avatar || '', registered_at: u.registeredAt || '',
        total_time_sec: Math.round(u.totalTimeSec || 0), visit_count: u.visitCount || 0,
        last_seen: u.lastSeen || null, banned: !!u.banned
    }));
    cloud.from('site_users').upsert(rows)
        .then(({ error }) => { if (error) console.warn('[cloud] users push:', error.message); });
}
function cloudPushMc(uid) {
    if (!cloud || cloudSyncing || !uid) return;
    const arr      = loadMcAccounts(uid) || [];
    const activeId = loadActiveMc(uid) || '';
    const rows = arr.map(a => ({
        id: a.id, user_id: uid, username: a.username,
        display_name: a.displayName || a.username, type: a.type || 'offline',
        uuid: a.uuid || '', added_at: a.addedAt || '', playtime: a.playtime || '0h',
        favorite: !!a.favorite, last_used: a.lastUsed || null,
        mc_password: a.password || '', is_active: a.id === activeId
    }));
    if (rows.length) {
        cloud.from('mc_accounts').upsert(rows)
            .then(({ error }) => { if (error) console.warn('[cloud] mc push:', error.message); });
    }
    // Drop any cloud rows for this user that no longer exist locally (deletions).
    const keepIds = arr.map(a => a.id);
    let del = cloud.from('mc_accounts').delete().eq('user_id', uid);
    if (keepIds.length) del = del.not('id', 'in', '(' + keepIds.join(',') + ')');
    del.then(({ error }) => { if (error) console.warn('[cloud] mc delete:', error.message); });
}

// ── Cloud sync: initial load ──────────────────────────────────
// Pull everything from Supabase into local state, then re-render. If the cloud
// is empty (first ever run) we seed it with whatever we have locally.
async function cloudBootstrap() {
    if (!cloud) return;
    let hadUsers = false;
    cloudSyncing = true;
    try {
        const [usersRes, mcRes] = await Promise.all([
            cloud.from('site_users').select('*'),
            cloud.from('mc_accounts').select('*')
        ]);
        if (usersRes.error) throw usersRes.error;
        if (mcRes.error)    throw mcRes.error;

        const users = usersRes.data || [];
        hadUsers = users.length > 0;
        if (hadUsers) {
            siteUsers = users.map(r => ({
                id: r.id, username: r.username, email: r.email || '', password: r.password_hash,
                role: r.role || 'USER', displayName: r.display_name || r.username,
                bio: r.bio || '', avatar: r.avatar || '', registeredAt: r.registered_at || '',
                totalTimeSec: r.total_time_sec || 0, visitCount: r.visit_count || 0,
                lastSeen: r.last_seen || null, banned: !!r.banned
            }));
            try { localStorage.setItem(K_USERS, JSON.stringify(siteUsers)); } catch {}
        }

        const byUser = {};
        (mcRes.data || []).forEach(r => { (byUser[r.user_id] = byUser[r.user_id] || []).push(r); });
        Object.keys(byUser).forEach(uid => {
            const arr = byUser[uid].map(r => ({
                id: r.id, username: r.username, displayName: r.display_name || r.username,
                type: r.type || 'offline', uuid: r.uuid || offlineUuid(r.username),
                addedAt: r.added_at || '', playtime: r.playtime || '0h',
                favorite: !!r.favorite, lastUsed: r.last_used, password: r.mc_password || ''
            }));
            try { localStorage.setItem(K_MC_PFX + uid, JSON.stringify(arr)); } catch {}
            const act = byUser[uid].find(r => r.is_active);
            try { if (act) localStorage.setItem(K_MC_ACT + uid, act.id); } catch {}
        });

        // Drop a stale session if that user no longer exists in the cloud.
        if (currentUserId && !siteUsers.find(u => u.id === currentUserId)) {
            currentUserId = null; saveSession(null);
        }
    } catch (e) {
        console.warn('[cloud] load failed, using local data:', e.message || e);
        cloudSyncing = false;
        return; // keep local state untouched
    }
    cloudSyncing = false;

    if (!hadUsers) {
        // First run against an empty database — seed it with current local data.
        cloudPushUsers(siteUsers);
        siteUsers.forEach(u => cloudPushMc(u.id));
    }
    reloadMcAccounts();
    renderAll();
    if (currentUserId) beginUserSession();
}
function loadForum()   { try{const r=localStorage.getItem(K_FORUM);return r?JSON.parse(r):null;}catch{return null;} }
function saveForum(p)  { try{localStorage.setItem(K_FORUM,JSON.stringify(p));}catch{} }
function loadNews()    { try{const r=localStorage.getItem(K_NEWS);return r?JSON.parse(r):null;}catch{return null;} }
function saveNews(n)   { try{localStorage.setItem(K_NEWS,JSON.stringify(n));}catch{} }

// ── UUID generator ────────────────────────────────────────────
function offlineUuid(username) {
    const s='OfflinePlayer:'+(username||'');
    const bytes=[];let h=0x811c9dc5>>>0;
    for(let pass=0;pass<4;pass++){let x=(h^(pass*0x9e3779b9))>>>0;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,0x01000193)>>>0;}bytes.push((x>>>24)&255,(x>>>16)&255,(x>>>8)&255,x&255);h=x;}
    const b=bytes.slice(0,16);b[6]=(b[6]&0x0f)|0x30;b[8]=(b[8]&0x3f)|0x80;
    const hex=b.map(v=>v.toString(16).padStart(2,'0')).join('');
    return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20,32);
}

// ── State ─────────────────────────────────────────────────────
let siteUsers    = loadSiteUsers() || DEFAULT_SITE_USERS.map(u=>({...u}));
let currentUserId = loadSession();
let mcAccounts   = [];
let activeMcId   = null;
let forumPosts   = loadForum() || DEFAULT_FORUM.map(p=>({...p}));
let newsItems    = loadNews()  || DEFAULT_NEWS.map(n=>({...n}));

// Seed: inject any new default update entries into existing stored news (without
// wiping user/DEV-created ones). Bump NEWS_SEED_VERSION when adding new defaults.
const NEWS_SEED_VERSION = 3;
(function seedNews(){
    try {
        const seeded = parseInt(localStorage.getItem('spectral_news_seed') || '0', 10);
        if (seeded < NEWS_SEED_VERSION) {
            const have = new Set(newsItems.map(n => n.id));
            const fresh = DEFAULT_NEWS.filter(n => !have.has(n.id));
            if (fresh.length) {
                newsItems.forEach(n => { n.isCurrent = false; });
                newsItems = [...fresh.map(n => ({...n})), ...newsItems];
                saveNews(newsItems);
            }
            localStorage.setItem('spectral_news_seed', String(NEWS_SEED_VERSION));
        }
    } catch {}
})();

// Validate session
if (currentUserId && !siteUsers.find(u=>u.id===currentUserId)) { currentUserId=null; saveSession(null); }

// Init default MC accounts for default users
DEFAULT_SITE_USERS.forEach(u => {
    if (!loadMcAccounts(u.id) && DEFAULT_MC_ACCOUNTS[u.id]) {
        saveMcAccounts(u.id, DEFAULT_MC_ACCOUNTS[u.id]);
    }
});

// ── Load MC accounts for current site user ────────────────────
function reloadMcAccounts() {
    if (!currentUserId) { mcAccounts=[]; activeMcId=null; return; }
    mcAccounts = loadMcAccounts(currentUserId) || [];
    activeMcId = loadActiveMc(currentUserId) || (mcAccounts.length>0 ? mcAccounts[0].id : null);
    if (activeMcId) saveActiveMc(currentUserId, activeMcId);
}

// ── Session time tracking ─────────────────────────────────────
// Accumulates real time-on-site for the logged-in user (active tab only),
// persisted to localStorage + Supabase so DEV analytics can show averages.
let _timeTick = null, _lastTickTs = Date.now(), _pendingTime = 0, _visitBumpedFor = null;
function beginUserSession() {
    const u = siteUsers.find(x => x.id === currentUserId);
    // Count one visit per logged-in user per page load (avoids double-counting
    // when cloudBootstrap re-runs this after the initial render).
    if (u && _visitBumpedFor !== u.id) {
        _visitBumpedFor = u.id;
        u.visitCount = (u.visitCount || 0) + 1; u.lastSeen = new Date().toISOString();
        saveSiteUsers(siteUsers);
    }
    startTimeTracking();
}
function startTimeTracking() {
    _lastTickTs = Date.now();
    if (_timeTick) return;
    _timeTick = setInterval(() => {
        const now = Date.now();
        if (document.hidden || !currentUserId) { _lastTickTs = now; return; }
        const delta = Math.min((now - _lastTickTs) / 1000, 120); // seconds, cap stray gaps
        _lastTickTs = now;
        _pendingTime += delta;
        const u = siteUsers.find(x => x.id === currentUserId);
        if (u) u.totalTimeSec = (u.totalTimeSec || 0) + delta;
    }, 5000);
    setInterval(flushSessionTime, 30000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flushSessionTime(); _lastTickTs = Date.now(); });
    window.addEventListener('beforeunload', flushSessionTime);
}
function flushSessionTime() {
    if (!currentUserId || _pendingTime < 1) return;
    const u = siteUsers.find(x => x.id === currentUserId);
    if (u) { u.lastSeen = new Date().toISOString(); saveSiteUsers(siteUsers); }
    _pendingTime = 0;
}

// ── Avatar URL ────────────────────────────────────────────────
function avatarUrl(username) { return `https://minotar.net/avatar/${encodeURIComponent(username)}/100`; }
function siteAvatarUrl(user) { return user.avatar || avatarUrl(user.displayName||user.username); }

// ── Roles (data-driven hierarchy) ─────────────────────────────
// rank drives permissions; higher rank = more power. Add a role here and it
// automatically appears in badges, the admin role picker and the stats charts.
const ROLES = {
    USER:      { label:'Player',    rank:0, icon:'fas fa-user',          color:'#9ca3af', grad:'linear-gradient(135deg,#6b7280,#4b5563)' },
    VETERAN:   { label:'Veteran',   rank:1, icon:'fas fa-shield-halved', color:'#2dd4bf', grad:'linear-gradient(135deg,#14b8a6,#0d9488)' },
    PRO:       { label:'Pro',       rank:2, icon:'fas fa-star',          color:'#fbbf24', grad:'linear-gradient(135deg,#f59e0b,#d97706)' },
    MODERATOR: { label:'Moderator', rank:3, icon:'fas fa-gavel',         color:'#60a5fa', grad:'linear-gradient(135deg,#3b82f6,#2563eb)' },
    ADMIN:     { label:'Admin',     rank:4, icon:'fas fa-user-shield',   color:'#f87171', grad:'linear-gradient(135deg,#ef4444,#dc2626)' },
    DEV:       { label:'Developer', rank:5, icon:'fas fa-code',          color:'#f472b6', grad:'linear-gradient(135deg,#ec4899,#f43f5e)' }
};
const ROLE_ORDER = Object.keys(ROLES);
function roleInfo(role)  { return ROLES[role] || ROLES.USER; }
function roleRank(role)  { return roleInfo(role).rank; }
// Permission helpers — pass a user (or use the current viewer)
function canAccessAdmin(u) { return !!u && roleRank(u.role) >= ROLES.MODERATOR.rank; }
function canModerate(u)    { return !!u && roleRank(u.role) >= ROLES.MODERATOR.rank; }
function canManageUsers(u) { return !!u && roleRank(u.role) >= ROLES.ADMIN.rank; }
function isDev(u)          { return !!u && u.role === 'DEV'; }

// ── Role badge HTML ───────────────────────────────────────────
function roleBadgeHtml(role) {
    // Whitelist roles so a tampered value can't inject markup
    if (!ROLE_ORDER.includes(role) || role === 'USER') return '';
    const r = ROLES[role];
    return `<span class="role-badge role-${role.toLowerCase()}"><i class="${r.icon}"></i> ${r.label}</span>`;
}

// ── Type helpers ──────────────────────────────────────────────
function typeLabel(t){ return {microsoft:'Microsoft',elyby:'Ely.by',offline:'Offline'}[t]||t; }
function typeIcon(t) { return {microsoft:'fab fa-microsoft',elyby:'fas fa-cloud',offline:'fas fa-user-shield'}[t]||'fas fa-user'; }

// ══════════════════════════════════════════════════════════════
// RENDER FUNCTIONS
// ══════════════════════════════════════════════════════════════
function renderAll() {
    reloadMcAccounts();
    renderNavbar();
    renderLauncherNotice();
    renderActiveMcBanner();
    renderMcGrid();
    renderDevWriteBtn();
    renderNewsTimeline();
    renderForum();
}

// ── Navbar ────────────────────────────────────────────────────
function renderNavbar() {
    const user = siteUsers.find(u=>u.id===currentUserId);
    const accText = document.getElementById('accountText');
    const circle  = document.getElementById('navAvatarCircle');
    if (user) {
        if (accText) accText.textContent = user.displayName||user.username;
        if (circle) { circle.innerHTML=`<img src="${esc(siteAvatarUrl(user))}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" onerror="this.onerror=null;this.src='${avatarUrl('steve')}'">`; }
        document.getElementById('launcherUsername').textContent = (mcAccounts.find(a=>a.id===activeMcId)||{displayName:user.displayName}).displayName || user.username;
    } else {
        if (accText) accText.textContent = 'Sign In';
        if (circle) circle.innerHTML = '<i class="fas fa-user"></i>';
        document.getElementById('launcherUsername').textContent = 'Guest';
    }
}

// ── Launcher notice ───────────────────────────────────────────
function renderLauncherNotice() {
    const notice = document.getElementById('launcherNotice');
    if (notice) notice.style.display = currentUserId ? 'none' : 'flex';
    // When logged out, hide the banner + toolbar so the notice stands alone
    const banner  = document.getElementById('activeAccountBanner');
    const toolbar = document.querySelector('#accounts .accounts-toolbar');
    const show = currentUserId ? '' : 'none';
    if (banner)  banner.style.display = currentUserId ? 'flex' : 'none';
    if (toolbar) toolbar.style.display = show;
}

// ── Active MC banner ──────────────────────────────────────────
function renderActiveMcBanner() {
    const banner    = document.getElementById('activeAccountBanner');
    const leftSec   = banner&&banner.querySelector('.active-account-left');
    const statsSec  = banner&&banner.querySelector('.active-account-stats');
    const noMsg     = document.getElementById('noAccountsMsg');
    if (!banner) return;

    const active = mcAccounts.find(a=>a.id===activeMcId);
    if (!active) {
        if (leftSec)  leftSec.style.display='none';
        if (statsSec) statsSec.style.display='none';
        if (noMsg)    noMsg.style.display='flex';
        return;
    }
    if (leftSec)  leftSec.style.display='flex';
    if (statsSec) statsSec.style.display='flex';
    if (noMsg)    noMsg.style.display='none';

    const img = document.getElementById('activeAvatarImg');
    if (img){ img.src=avatarUrl(active.username); img.onerror=function(){this.onerror=null;this.src=avatarUrl('steve');}; }
    const nameEl = document.getElementById('activeAccountName');
    if (nameEl) nameEl.textContent = active.displayName||active.username;
    const typeEl = document.getElementById('activeAccountType');
    if (typeEl) { typeEl.className=`active-account-type type-${active.type}`; typeEl.innerHTML=`<i class="${typeIcon(active.type)}"></i> ${typeLabel(active.type)}`; }
    const timeEl = document.getElementById('activeAccountTime');
    if (timeEl) timeEl.textContent = active.playtime||'0h';
    const dateEl = document.getElementById('activeAccountDate');
    if (dateEl) dateEl.textContent = active.addedAt||'—';
    const uuidEl = document.getElementById('activeUuidText');
    if (uuidEl) uuidEl.textContent = active.uuid||offlineUuid(active.username);
}

// ── MC Accounts grid ──────────────────────────────────────────
let accFilter='all', accSearch='', accSort='recent';
function getFilteredMc() {
    let list = mcAccounts.slice();
    if (accSearch) { const q=accSearch.toLowerCase(); list=list.filter(a=>(a.displayName||a.username).toLowerCase().includes(q)||a.username.toLowerCase().includes(q)); }
    if (accFilter==='favorite') list=list.filter(a=>a.favorite);
    else if (accFilter!=='all') list=list.filter(a=>a.type===accFilter);
    const pt=a=>parseFloat(String(a.playtime).replace(/[^0-9.]/g,''))||0;
    const pd=a=>{const p=String(a.addedAt||'').split('.');return p.length===3?new Date(+p[2],+p[1]-1,+p[0]).getTime():0;};
    if(accSort==='name')list.sort((a,b)=>(a.displayName||a.username).localeCompare(b.displayName||b.username));
    else if(accSort==='playtime')list.sort((a,b)=>pt(b)-pt(a));
    else if(accSort==='added')list.sort((a,b)=>pd(b)-pd(a));
    else list.sort((a,b)=>{const la=a.lastUsed?Date.parse(a.lastUsed):0,lb=b.lastUsed?Date.parse(b.lastUsed):0;return lb-la;});
    list.sort((a,b)=>(b.favorite?1:0)-(a.favorite?1:0));
    return list;
}
function renderMcGrid() {
    const grid = document.getElementById('accountsGrid');
    const empty = document.getElementById('accountsEmpty');
    const emptyTxt = document.getElementById('accountsEmptyText');
    if (!grid) return;
    grid.innerHTML='';

    if (!currentUserId) {
        if (empty) empty.style.display='block';
        if (emptyTxt) emptyTxt.textContent='Sign in to your site account to see your Minecraft profiles';
        return;
    }
    const list = getFilteredMc();
    if (list.length===0) {
        if (empty) empty.style.display='block';
        if (emptyTxt) emptyTxt.textContent = mcAccounts.length===0 ? 'No Minecraft profiles yet' : 'No profiles match your filters';
        return;
    }
    if (empty) empty.style.display='none';
    grid.onclick = e => {
        const fav=e.target.closest('.acc-fav'); if(fav&&grid.contains(fav)){e.preventDefault();e.stopPropagation();toggleMcFav(fav.dataset.id);return;}
        const del=e.target.closest('.acc-btn-delete'); if(del&&grid.contains(del)){e.preventDefault();e.stopPropagation();const card=del.closest('.account-card');const id=del.dataset.id||(card&&card.dataset.id);if(id)deleteMcAccount(id,card);return;}
        const sel=e.target.closest('.acc-btn-select'); if(sel&&grid.contains(sel)){e.preventDefault();e.stopPropagation();if(sel.dataset.id)selectMcAccount(sel.dataset.id);return;}
        const card=e.target.closest('.account-card'); if(card&&grid.contains(card)&&card.dataset.id)selectMcAccount(card.dataset.id);
    };
    list.forEach((acc, idx) => {
        const isActive = acc.id===activeMcId;
        const card = document.createElement('div');
        card.className=`account-card glass${isActive?' is-active':''}${acc.favorite?' is-fav':''}`;
        card.dataset.id=acc.id;
        card.style.setProperty('--i', idx);
        card.innerHTML=`
            <button class="acc-fav${acc.favorite?' on':''}" data-id="${acc.id}" title="Favorite" type="button"><i class="fas fa-star"></i></button>
            ${isActive?'<span class="acc-active-tag"><span class="acc-active-dot"></span> Active</span>':''}
            <div class="acc-avatar">
                <img src="${avatarUrl(acc.username)}" alt="${esc(acc.username)}" loading="lazy" onerror="this.onerror=null;this.src='${avatarUrl('steve')}';">
            </div>
            <div class="acc-card-info">
                <div class="acc-card-name">${esc(acc.displayName||acc.username)}</div>
                <span class="active-account-type type-${acc.type}" style="font-size:0.72rem;padding:3px 10px;"><i class="${typeIcon(acc.type)}"></i> ${typeLabel(acc.type)}</span>
                <div class="acc-card-meta">
                    <span title="Time in game"><i class="fas fa-clock"></i> ${acc.playtime||'0h'}</span>
                    <span title="Date added"><i class="fas fa-calendar-alt"></i> ${acc.addedAt||'—'}</span>
                </div>
                <div class="acc-card-actions">
                    <button class="acc-btn-select${isActive?' selected':''}" data-id="${acc.id}" type="button">${isActive?'<i class="fas fa-check"></i> Active':'<i class="fas fa-play"></i> Select'}</button>
                    <button class="acc-btn-delete" data-id="${acc.id}" type="button" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}
function toggleMcFav(id){const a=mcAccounts.find(a=>a.id===id);if(!a)return;a.favorite=!a.favorite;saveMcAccounts(currentUserId,mcAccounts);renderMcGrid();}
function selectMcAccount(id){if(activeMcId===id)return;const a=mcAccounts.find(a=>a.id===id);if(a)a.lastUsed=new Date().toISOString();activeMcId=id;saveActiveMc(currentUserId,id);saveMcAccounts(currentUserId,mcAccounts);renderAll();}
function deleteMcAccount(id, cardEl) {
    const a=mcAccounts.find(a=>a.id===id);if(!a)return;
    showConfirm(`Delete Minecraft profile "${a.displayName||a.username}"?`,()=>{
        if(cardEl)cardEl.classList.add('removing');
        setTimeout(()=>{mcAccounts=mcAccounts.filter(a=>a.id!==id);saveMcAccounts(currentUserId,mcAccounts);if(activeMcId===id){activeMcId=mcAccounts.length>0?mcAccounts[0].id:null;saveActiveMc(currentUserId,activeMcId||'');}renderAll();},300);
    });
}
function addMcAccount(username, type, password='') {
    if (!currentUserId) { openDashboard(); return; }
    const today=new Date();
    const dateStr=`${String(today.getDate()).padStart(2,'0')}.${String(today.getMonth()+1).padStart(2,'0')}.${today.getFullYear()}`;
    const acc={id:'la_'+Date.now(),username:username.trim(),displayName:username.trim(),type,addedAt:dateStr,playtime:'0h',lastUsed:null,favorite:false,password:password.trim(),uuid:offlineUuid(username.trim())};
    mcAccounts.unshift(acc);saveMcAccounts(currentUserId,mcAccounts);
    activeMcId=acc.id;saveActiveMc(currentUserId,activeMcId);renderAll();
}

// Search / filter / sort listeners
const accSearchEl=document.getElementById('accountSearch');
if(accSearchEl)accSearchEl.addEventListener('input',e=>{accSearch=e.target.value.trim();renderMcGrid();});
const accSortEl=document.getElementById('accountSort');
if(accSortEl)accSortEl.addEventListener('change',e=>{accSort=e.target.value;renderMcGrid();});
document.querySelectorAll('#accFilterChips .acc-chip').forEach(chip=>{chip.addEventListener('click',()=>{document.querySelectorAll('#accFilterChips .acc-chip').forEach(c=>c.classList.remove('active'));chip.classList.add('active');accFilter=chip.dataset.filter;renderMcGrid();});});

// UUID copy
const uuidBtn=document.getElementById('activeAccountUuid');
if(uuidBtn)uuidBtn.addEventListener('click',()=>{const a=mcAccounts.find(a=>a.id===activeMcId);if(!a)return;const uuid=a.uuid||offlineUuid(a.username);const span=document.getElementById('activeUuidText');const done=()=>{uuidBtn.classList.add('copied');if(span)span.textContent='Copied!';setTimeout(()=>{uuidBtn.classList.remove('copied');if(span)span.textContent=uuid;},1200);};if(navigator.clipboard)navigator.clipboard.writeText(uuid).then(done).catch(done);else done();});

// ── Launcher notice sign in button ────────────────────────────
const noticeBtn=document.getElementById('noticeSignInBtn');
if(noticeBtn)noticeBtn.addEventListener('click',()=>openDashboard());

// ══════════════════════════════════════════════════════════════
// SITE ACCOUNT DASHBOARD MODAL
// ══════════════════════════════════════════════════════════════
const dashOverlay  = document.getElementById('dashboardOverlay');
const authView     = document.getElementById('authView');
const registerView = document.getElementById('registerView');
const profileView  = document.getElementById('profileView');
const recoveryView = document.getElementById('recoveryView');
function hideAllAuthViews(){ [authView,registerView,profileView,recoveryView].forEach(v=>{ if(v)v.style.display='none'; }); }

function openDashboard() {
    if (!dashOverlay) return;
    dashOverlay.classList.add('open');
    document.body.style.overflow='hidden';
    if (currentUserId) showProfileView();
    else showAuthView();
}
function closeDashboard() {
    if (!dashOverlay) return;
    dashOverlay.classList.remove('open');
    document.body.style.overflow='';
}
function showAuthView() { hideAllAuthViews(); if(authView)authView.style.display='block'; }
function showRegisterView() { hideAllAuthViews(); if(registerView)registerView.style.display='block'; }
function showRecoveryView() { hideAllAuthViews(); if(recoveryView)recoveryView.style.display='block'; if(dashOverlay){dashOverlay.classList.add('open');document.body.style.overflow='hidden';} }
function showProfileView() {
    hideAllAuthViews(); if(profileView)profileView.style.display='block';
    const user = siteUsers.find(u=>u.id===currentUserId);
    if (!user) return;
    const canAdmin = canAccessAdmin(user);
    const adminTab = document.getElementById('adminPanelTab');
    if (adminTab) adminTab.style.display = canAdmin?'':'none';
    loadProfileViewData(user);
}

document.getElementById('openDashboardBtn').addEventListener('click', openDashboard);
const closeDashBtn = document.getElementById('closeDashboardBtn');
if (closeDashBtn) closeDashBtn.addEventListener('click', closeDashboard);
if (dashOverlay) dashOverlay.addEventListener('click', e=>{ if(e.target===dashOverlay)closeDashboard(); });

document.getElementById('switchToRegisterBtn')&&document.getElementById('switchToRegisterBtn').addEventListener('click',showRegisterView);
document.getElementById('switchToLoginBtn')&&document.getElementById('switchToLoginBtn').addEventListener('click',showAuthView);

// ══════════════════════════════════════════════════════════════
// SUPABASE AUTH  (email + Google + password recovery)
// Layered on top of the local system: when the Supabase client is
// available, these provide real authentication; otherwise everything
// falls back to the legacy username/password records on this device.
// ══════════════════════════════════════════════════════════════
const authAvailable = () => !!(cloud && cloud.auth);
const isFileProtocol = location.protocol === 'file:'; // OAuth/email links need http(s)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function todayStr(){ const d=new Date(); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`; }
function authMsg(id,msg){ const el=document.getElementById(id); if(el){ el.textContent=msg; el.style.display='block'; } }
function clearAuthMsgs(){ ['loginError','loginNote','registerError','registerNote','recoveryError','recoveryNote'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';}); }
function authRedirectTo(){ return location.origin + location.pathname; }

// Find-or-create the local/cloud profile row for a Supabase Auth user.
function ensureProfileFor(authUser){
    let u = siteUsers.find(x=>x.id===authUser.id);
    if(!u){
        const meta = authUser.user_metadata || {};
        const uname = sanitizeField(meta.username || meta.full_name || (authUser.email||'player').split('@')[0], 20) || 'player';
        u = { id:authUser.id, username:uname, email:authUser.email||'', password:'', role:'USER',
              displayName: meta.full_name||uname, bio:'Minecraft player',
              avatar: meta.avatar_url||meta.picture||'', registeredAt:todayStr(),
              totalTimeSec:0, visitCount:0, lastSeen:new Date().toISOString(), banned:false };
        siteUsers.push(u); saveSiteUsers(siteUsers);
        saveMcAccounts(u.id,[]); saveActiveMc(u.id,'');
    } else if(authUser.email && u.email!==authUser.email){
        u.email = authUser.email; saveSiteUsers(siteUsers);
    }
    return u;
}
// Apply a verified Supabase session to the app.
function applyAuthUser(authUser){
    if(!authUser) return false;
    const profile = ensureProfileFor(authUser);
    if(profile.banned){ if(authAvailable())cloud.auth.signOut(); authMsg('loginError','This account has been banned'); return false; }
    currentUserId = profile.id; saveSession(profile.id);
    clearAuthMsgs(); beginUserSession(); renderAll();
    if(dashOverlay && dashOverlay.classList.contains('open')) showProfileView();
    return true;
}
async function initSupabaseAuth(){
    if(!authAvailable()) return;
    cloud.auth.onAuthStateChange((event, session)=>{
        if(event==='PASSWORD_RECOVERY'){ showRecoveryView(); return; }
        if((event==='SIGNED_IN'||event==='INITIAL_SESSION') && session && session.user){ applyAuthUser(session.user); }
    });
    try{
        const { data } = await cloud.auth.getSession();
        if(data && data.session && data.session.user) applyAuthUser(data.session.user);
    }catch(e){ console.warn('[auth] session restore failed:', e.message||e); }
    if(/type=recovery/.test(location.hash)) showRecoveryView();
}

// ── Login ─────────────────────────────────────────────────────
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const login = document.getElementById('loginInput').value.trim();
        const pass  = document.getElementById('passwordInput').value;
        clearAuthMsgs();
        const fail  = msg => authMsg('loginError', msg||'Invalid email/username or password');

        // Email + Supabase Auth path
        if (authAvailable() && EMAIL_RE.test(login)) {
            const { data, error } = await cloud.auth.signInWithPassword({ email:login, password:pass });
            if (error) { fail(error.message); return; }
            applyAuthUser(data.user);
            return;
        }
        // Legacy local path (username or email stored in our table)
        const user = siteUsers.find(u=>u.username===login || (u.email&&u.email===login));
        let ok = false;
        if (user && user.password) {
            if (looksHashed(user.password)) ok = (await hashPassword(pass)) === user.password;
            else { ok = (user.password === pass); if (ok){ user.password = await hashPassword(pass); saveSiteUsers(siteUsers); } }
        }
        if (!ok) { fail(); return; }
        if (user.banned) { fail('This account has been banned'); return; }
        currentUserId=user.id; saveSession(user.id);
        beginUserSession(); renderAll(); showProfileView();
    });
}

// ── Register ──────────────────────────────────────────────────
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    // Создать запись аккаунта прямо в site_users (ник + SHA-256(pepper+пароль)
    // [+ необязательная почта]) и войти. saveSiteUsers → cloudPushUsers пушит её в
    // Supabase, поэтому вход по нику потом работает и на сайте, и в лаунчере
    // (одинаковый pepper + SHA-256). Используется и для «без почты», и для оффлайн-фолбэка.
    async function createLocalAccount(username, email, pass) {
        const newUser = { id:'su_'+Date.now(), username, email:email||'', password:await hashPassword(pass),
            role:'USER', displayName:username, bio:'Minecraft player', avatar:'', registeredAt:todayStr(),
            totalTimeSec:0, visitCount:0, lastSeen:new Date().toISOString(), banned:false };
        siteUsers.push(newUser); saveSiteUsers(siteUsers);
        saveMcAccounts(newUser.id, []); saveActiveMc(newUser.id, '');
        currentUserId = newUser.id; saveSession(newUser.id);
        beginUserSession(); registerForm.reset();
        renderAll(); showProfileView();
    }

    registerForm.addEventListener('submit', async e => {
        e.preventDefault();
        const username = sanitizeField(document.getElementById('regUsername').value, 20);
        const email    = (document.getElementById('regEmail').value||'').trim();
        const pass     = document.getElementById('regPassword').value;
        const passC    = document.getElementById('regPasswordConfirm').value;
        clearAuthMsgs();
        const showErr  = msg => authMsg('registerError', msg);
        if (!username||username.length<3) return showErr('Username must be 3–20 characters');
        if (!/^[A-Za-z0-9 _.\-]+$/.test(username)) return showErr('Username may use letters, numbers, spaces and _ . - only');

        // Почта теперь НЕОБЯЗАТЕЛЬНА: пустое поле → регистрация по одному нику.
        const noEmail = email.length === 0;
        if (!noEmail && !EMAIL_RE.test(email)) return showErr('Enter a valid email address');

        if (siteUsers.find(u=>u.username.toLowerCase()===username.toLowerCase())) return showErr('Username already taken');
        const minLen = (!noEmail && authAvailable()) ? 6 : 4;
        if (!pass||pass.length<minLen) return showErr(`Password must be at least ${minLen} characters`);
        if (pass.length>128) return showErr('Password is too long');
        if (pass!==passC) return showErr('Passwords do not match');

        // ── Регистрация БЕЗ почты — только ник + пароль ─────────────────────
        // Пишем напрямую в site_users, без GoTrue и подтверждения почты. Это тот
        // же способ входа по нику, что уже поддерживают login-форма и лаунчер.
        if (noEmail) {
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            try {
                // Проверяем занятость ника ещё и в облаке — дубли ломают вход по нику.
                if (cloud) {
                    const { data, error } = await cloud.from('site_users')
                        .select('id').eq('username', username).limit(1);
                    if (!error && data && data.length) return showErr('Username already taken');
                }
                await createLocalAccount(username, '', pass);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
            return;
        }

        // Real account via Supabase Auth (enables Google + password recovery)
        if (authAvailable()) {
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            if(submitBtn) submitBtn.disabled = true;
            const { data, error } = await cloud.auth.signUp({
                email, password:pass, options:{ data:{ username }, emailRedirectTo: authRedirectTo() }
            });
            if(submitBtn) submitBtn.disabled = false;
            if (error) return showErr(error.message);
            if (data.session && data.user) {            // email confirmation is OFF → straight in
                const p = ensureProfileFor(data.user);
                if(email) { p.email=email; saveSiteUsers(siteUsers); }
                registerForm.reset();
                currentUserId=p.id; saveSession(p.id);
                beginUserSession(); renderAll(); showProfileView();
            } else {                                    // email confirmation is ON
                registerForm.reset();
                authMsg('registerNote','Almost done — check your inbox to confirm your email, then sign in.');
            }
            return;
        }

        // Local fallback (offline / file://) — keeps the demo working
        await createLocalAccount(username, email, pass);
    });
}

// ── Google sign-in (login + register buttons) ─────────────────
async function startGoogleSignIn(){
    clearAuthMsgs();
    if(isFileProtocol){ authMsg('loginError','Google sign-in needs the site served over http(s) — use a local server or GitHub Pages, not a file:// page.'); return; }
    if(!authAvailable()){ authMsg('loginError','Google sign-in is unavailable (Supabase not connected).'); return; }
    const { error } = await cloud.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: authRedirectTo() } });
    if(error) authMsg('loginError', error.message);
}
['googleLoginBtn','googleRegisterBtn'].forEach(id=>{ const b=document.getElementById(id); if(b)b.addEventListener('click',startGoogleSignIn); });

// ── Forgot password ───────────────────────────────────────────
const forgotBtn = document.getElementById('forgotPasswordBtn');
if(forgotBtn){
    forgotBtn.addEventListener('click', async ()=>{
        clearAuthMsgs();
        const email=(document.getElementById('loginInput').value||'').trim();
        if(!EMAIL_RE.test(email)){ authMsg('loginError','Type your account email in the field above, then click “Forgot password?”.'); document.getElementById('loginInput').focus(); return; }
        if(isFileProtocol){ authMsg('loginError','Password recovery needs the site served over http(s), not a file:// page.'); return; }
        if(!authAvailable()){ authMsg('loginError','Password recovery is unavailable (Supabase not connected).'); return; }
        const { error } = await cloud.auth.resetPasswordForEmail(email, { redirectTo: authRedirectTo() });
        if(error){ authMsg('loginError', error.message); return; }
        authMsg('loginNote','Recovery link sent! Check your email and follow the link to set a new password.');
    });
}

// ── Recovery form (set a new password) ────────────────────────
const recoveryForm = document.getElementById('recoveryForm');
if(recoveryForm){
    recoveryForm.addEventListener('submit', async e=>{
        e.preventDefault();
        clearAuthMsgs();
        const p1=document.getElementById('recoveryPassword').value;
        const p2=document.getElementById('recoveryPasswordConfirm').value;
        if(!p1||p1.length<6) return authMsg('recoveryError','Password must be at least 6 characters');
        if(p1!==p2) return authMsg('recoveryError','Passwords do not match');
        if(!authAvailable()) return authMsg('recoveryError','Recovery is unavailable (Supabase not connected).');
        const { error } = await cloud.auth.updateUser({ password:p1 });
        if(error) return authMsg('recoveryError', error.message);
        recoveryForm.reset();
        authMsg('recoveryNote','Password updated! Signing you in…');
        const { data } = await cloud.auth.getSession();
        if(data && data.session && data.session.user) setTimeout(()=>applyAuthUser(data.session.user), 600);
    });
}

// ── Profile tabs ──────────────────────────────────────────────
// Expand the dashboard window when the Admin panel is open (more room for data),
// collapse back to the compact width for the regular profile view.
function setDashboardWide(wide) {
    const modal = dashOverlay && dashOverlay.querySelector('.dashboard-modal');
    if (modal) modal.classList.toggle('admin-wide', !!wide);
}
document.querySelectorAll('.profile-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
        const target=tab.getAttribute('data-ptab');
        document.querySelectorAll('.profile-tab').forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.ptab-content').forEach(c=>{c.style.display=c.getAttribute('data-ptab-content')===target?'block':'none';});
        setDashboardWide(target==='admin-panel');
        if(target==='admin-panel') renderAdminPanel();
    });
});

// ── Load profile data ─────────────────────────────────────────
function loadProfileViewData(user) {
    const img = document.getElementById('profileAvatarImg');
    if(img){img.src=siteAvatarUrl(user);img.onerror=function(){this.onerror=null;this.src=avatarUrl('steve');};}
    const un = document.getElementById('profileUsername'); if(un)un.textContent=user.username;
    const rb = document.getElementById('profileRoleBadge'); if(rb){const ri=roleInfo(user.role);rb.innerHTML=`<i class="${ri.icon}"></i> ${ri.label}`;rb.className='badge-pro';rb.style.background=ri.grad;rb.style.color='#fff';}
    const dn = document.getElementById('profileDisplayName'); if(dn)dn.value=user.displayName||user.username;
    const bio= document.getElementById('profileBio'); if(bio)bio.value=user.bio||'';
    // switch to profile tab
    document.querySelectorAll('.profile-tab').forEach(t=>t.classList.toggle('active',t.getAttribute('data-ptab')==='my-profile'));
    document.querySelectorAll('.ptab-content').forEach(c=>{c.style.display=c.getAttribute('data-ptab-content')==='my-profile'?'block':'none';});
    setDashboardWide(false);
}

// ── Save profile ──────────────────────────────────────────────
const saveProfileBtn=document.getElementById('saveProfileBtn');
if(saveProfileBtn){saveProfileBtn.addEventListener('click',()=>{const user=siteUsers.find(u=>u.id===currentUserId);if(!user)return;const dn=document.getElementById('profileDisplayName');const bio=document.getElementById('profileBio');const img=document.getElementById('profileAvatarImg');user.displayName=sanitizeField(dn?dn.value:'',24)||user.username;user.bio=sanitizeField(bio?bio.value:'',120);const src=img?img.src:'';user.avatar=/^(data:image\/|https?:\/\/)/.test(src)?src:'';saveSiteUsers(siteUsers);renderNavbar();saveProfileBtn.textContent='Saved!';setTimeout(()=>{saveProfileBtn.innerHTML='<i class="fas fa-save"></i> Save Changes';},1500);});}

// ── Avatar upload ─────────────────────────────────────────────
const avatarUpload=document.getElementById('avatarUpload');
if(avatarUpload){avatarUpload.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const img=document.getElementById('profileAvatarImg');if(img)img.src=ev.target.result;};r.readAsDataURL(f);});}

// ── Logout ────────────────────────────────────────────────────
const logoutBtn=document.getElementById('logoutBtn');
if(logoutBtn){logoutBtn.addEventListener('click',()=>{flushSessionTime();_visitBumpedFor=null;if(authAvailable())cloud.auth.signOut();currentUserId=null;saveSession(null);renderAll();showAuthView();});}

// ── Launcher info tab ─────────────────────────────────────────
function renderLauncherInfoTab() {
    const el=document.getElementById('launcherProfileCount');
    if(el)el.textContent=mcAccounts.length;
}
const goAccBtn=document.getElementById('goToAccountsBtn');
if(goAccBtn){goAccBtn.addEventListener('click',()=>{closeDashboard();document.querySelector('[data-target="accounts"]').click();});}

// ── Admin Panel ───────────────────────────────────────────────
document.querySelectorAll('.admin-stab').forEach(stab=>{
    stab.addEventListener('click',()=>{
        const t=stab.getAttribute('data-stab');
        document.querySelectorAll('.admin-stab').forEach(s=>s.classList.remove('active'));stab.classList.add('active');
        document.querySelectorAll('.admin-stab-content').forEach(c=>{c.style.display=c.getAttribute('data-stab-content')===t?'block':'none';});
        if(t==='site-stats')renderAdminStats();
        if(t==='forum')renderAdminForum();
    });
});

const adminSearchInput=document.getElementById('adminUserSearch');
if(adminSearchInput)adminSearchInput.addEventListener('input',()=>renderAdminUsers(adminSearchInput.value.trim().toLowerCase()));
const adminRoleFilter=document.getElementById('adminRoleFilter');
if(adminRoleFilter)adminRoleFilter.addEventListener('change',()=>renderAdminUsers(adminSearchInput?adminSearchInput.value.trim().toLowerCase():''));

// ── Admin helpers ─────────────────────────────────────────────
function formatDuration(sec){
    sec=Math.round(sec||0);
    if(sec<60)return sec+'s';
    const m=Math.floor(sec/60); if(m<60)return m+'m';
    const h=Math.floor(m/60), mm=m%60; if(h<24)return mm?`${h}h ${mm}m`:`${h}h`;
    const d=Math.floor(h/24); return `${d}d ${h%24}h`;
}
function timeAgo(iso){
    if(!iso)return 'never';
    const t=new Date(iso).getTime(); if(isNaN(t))return 'never';
    const m=Math.floor((Date.now()-t)/60000);
    if(m<1)return 'just now'; if(m<60)return m+'m ago';
    const h=Math.floor(m/60); if(h<24)return h+'h ago';
    const d=Math.floor(h/24); if(d<30)return d+'d ago';
    return Math.floor(d/30)+'mo ago';
}
function parseRegDate(s){
    if(!s)return 0;
    const m=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s);
    if(m)return new Date(+m[3],+m[2]-1,+m[1]).getTime();
    const t=new Date(s).getTime(); return isNaN(t)?0:t;
}
function registeredWithinDays(s,days){ const t=parseRegDate(s); return !!t && (Date.now()-t)<=days*86400000; }
function isRecentlyActive(iso,days){ if(!iso)return false; const t=new Date(iso).getTime(); return !isNaN(t)&&(Date.now()-t)<=days*86400000; }

function deleteUserAccount(uid){
    siteUsers=siteUsers.filter(u=>u.id!==uid);
    saveSiteUsers(siteUsers);
    try{ localStorage.removeItem(K_MC_PFX+uid); localStorage.removeItem(K_MC_ACT+uid); }catch{}
    if(cloud){ cloud.from('site_users').delete().eq('id',uid)
        .then(({error})=>{ if(error)console.warn('[cloud] user delete:',error.message); }); }
}
function exportDatabase(){
    const data={ exportedAt:new Date().toISOString(), users:siteUsers.map(u=>{const c={...u};delete c.password;return c;}), mcAccounts:{}, forum:forumPosts, news:newsItems };
    siteUsers.forEach(u=>{ data.mcAccounts[u.id]=loadMcAccounts(u.id)||[]; });
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='spectral-db-'+new Date().toISOString().slice(0,10)+'.json';
    a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function refreshAdmin(){
    const s=document.getElementById('adminUserSearch');
    renderAdminUsers(s?s.value.trim().toLowerCase():'');
    renderAdminStats();
}

function renderAdminPanel() {
    document.querySelectorAll('.admin-stab').forEach((s,i)=>s.classList.toggle('active',i===0));
    document.querySelectorAll('.admin-stab-content').forEach((c,i)=>{c.style.display=i===0?'block':'none';});
    renderAdminUsers('');
}
function renderAdminUsers(search) {
    const list=document.getElementById('adminUsersList');if(!list)return;
    const viewer=siteUsers.find(u=>u.id===currentUserId);
    const mayManage=canManageUsers(viewer);  // ADMIN+
    const mayDev=isDev(viewer);              // DEV only
    const roleFilterEl=document.getElementById('adminRoleFilter');
    const roleFilter=roleFilterEl?roleFilterEl.value:'';
    let users=siteUsers.slice().sort((a,b)=>roleRank(b.role)-roleRank(a.role)||(a.username||'').localeCompare(b.username||''));
    if(search)users=users.filter(u=>u.username.toLowerCase().includes(search)||(u.displayName||'').toLowerCase().includes(search));
    if(roleFilter)users=users.filter(u=>u.role===roleFilter);
    list.innerHTML='';
    if(!users.length){list.innerHTML='<p class="admin-empty">No users match your filters.</p>';return;}
    users.forEach(u=>{
        const isSelf=u.id===currentUserId;
        const mcCount=(loadMcAccounts(u.id)||[]).length;
        const allowedRoles=mayDev?ROLE_ORDER:ROLE_ORDER.filter(r=>r!=='DEV');
        const roleOpts=allowedRoles.map(r=>`<option value="${r}"${u.role===r?'selected':''}>${ROLES[r].label}</option>`).join('');
        const roleControl=(mayManage&&!isSelf)
            ? `<select class="admin-role-select" data-uid="${u.id}">${roleOpts}</select>`
            : (u.banned?'':roleBadgeHtml(u.role));
        const actions=[];
        if(mayManage&&!isSelf)actions.push(`<button class="admin-act-btn ${u.banned?'unban':'ban'}" data-act="ban"><i class="fas fa-${u.banned?'unlock':'ban'}"></i> ${u.banned?'Unban':'Ban'}</button>`);
        if(mayDev&&!isSelf)actions.push(`<button class="admin-act-btn del" data-act="del"><i class="fas fa-trash-alt"></i></button>`);
        const badge=u.banned?'<span class="role-badge role-banned"><i class="fas fa-ban"></i> Banned</span>':roleBadgeHtml(u.role);
        const row=document.createElement('div');
        row.className='admin-user-row'+(u.banned?' is-banned':'');
        row.innerHTML=`
            <img class="admin-user-avatar" src="${esc(siteAvatarUrl(u))}" onerror="this.onerror=null;this.src='${avatarUrl('steve')}'" alt="">
            <div class="admin-user-main">
                <div class="admin-user-name">${esc(u.displayName||u.username)} ${badge}</div>
                <div class="admin-user-bio">${esc(u.bio||'No bio')} · ${mcCount} MC · since ${esc(u.registeredAt||'?')}</div>
                <div class="admin-user-stats">
                    <span title="Total time on site"><i class="fas fa-clock"></i> ${formatDuration(u.totalTimeSec)}</span>
                    <span title="Visits"><i class="fas fa-right-to-bracket"></i> ${u.visitCount||0}</span>
                    <span title="Last seen"><i class="fas fa-eye"></i> ${timeAgo(u.lastSeen)}</span>
                </div>
            </div>
            <div class="admin-user-controls">${roleControl}<div class="admin-user-actions">${actions.join('')}</div></div>`;
        const sel=row.querySelector('.admin-role-select');
        if(sel)sel.addEventListener('change',()=>{const t=siteUsers.find(x=>x.id===u.id);if(t){t.role=sel.value;saveSiteUsers(siteUsers);refreshAdmin();if(u.id===currentUserId){renderAll();showProfileView();}}});
        const banBtn=row.querySelector('[data-act="ban"]');
        if(banBtn)banBtn.addEventListener('click',()=>{const t=siteUsers.find(x=>x.id===u.id);if(!t)return;if(!t.banned){showConfirm(`Ban "${t.username}"? They won't be able to log in.`,()=>{t.banned=true;saveSiteUsers(siteUsers);refreshAdmin();});}else{t.banned=false;saveSiteUsers(siteUsers);refreshAdmin();}});
        const delBtn=row.querySelector('[data-act="del"]');
        if(delBtn)delBtn.addEventListener('click',()=>{showConfirm(`Permanently delete "${u.username}" and all their data?`,()=>{deleteUserAccount(u.id);refreshAdmin();});});
        list.appendChild(row);
    });
}
function renderAdminForum() {
    const list=document.getElementById('adminForumList');if(!list)return;
    list.innerHTML='';
    if(forumPosts.length===0){list.innerHTML='<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:20px;">No forum posts yet</p>';return;}
    forumPosts.forEach(p=>{
        const item=document.createElement('div');item.className='admin-forum-item';
        const statusClass=p.rejected?'afs-rejected':p.approved?'afs-approved':'afs-pending';
        const statusLabel=p.rejected?'Rejected':p.approved?'Approved':'Pending';
        item.innerHTML=`
            <div style="display:flex;align-items:center;gap:8px;">
                <div class="admin-forum-title">${esc(p.title)}</div>
                <span class="admin-forum-status ${statusClass}">${statusLabel}</span>
            </div>
            <div class="admin-forum-meta">by ${esc(p.authorName)} · ${esc(p.date)} · ${p.upvotes.length} upvote${p.upvotes.length!==1?'s':''}</div>
            <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:8px;line-height:1.5;">${esc(p.text.slice(0,120))}${p.text.length>120?'…':''}</div>
            <div class="admin-forum-actions">
                ${!p.approved&&!p.rejected?`<button class="admin-forum-approve" data-id="${p.id}"><i class="fas fa-check"></i> Approve</button>`:''}
                ${!p.rejected?`<button class="admin-forum-reject" data-id="${p.id}"><i class="fas fa-times"></i> Reject</button>`:''}
                ${p.rejected?`<button class="admin-forum-approve" data-id="${p.id}">Restore</button>`:''}
                <button class="admin-forum-reject" data-id="${p.id}" data-del="1" style="background:rgba(239,68,68,0.2);">Delete</button>
            </div>`;
        item.querySelectorAll('.admin-forum-approve').forEach(btn=>btn.addEventListener('click',()=>{const post=forumPosts.find(x=>x.id===btn.dataset.id);if(post){post.approved=true;post.rejected=false;saveForum(forumPosts);renderAdminForum();renderForum();}}));
        item.querySelectorAll('.admin-forum-reject:not([data-del])').forEach(btn=>btn.addEventListener('click',()=>{const post=forumPosts.find(x=>x.id===btn.dataset.id);if(post){post.approved=false;post.rejected=true;saveForum(forumPosts);renderAdminForum();renderForum();}}));
        item.querySelectorAll('.admin-forum-reject[data-del]').forEach(btn=>btn.addEventListener('click',()=>{showConfirm('Delete this idea permanently?',()=>{forumPosts=forumPosts.filter(x=>x.id!==btn.dataset.id);saveForum(forumPosts);renderAdminForum();renderForum();});}));
        list.appendChild(item);
    });
}
function renderAdminStats() {
    const grid=document.getElementById('adminStatsGrid');if(!grid)return;
    const viewer=siteUsers.find(u=>u.id===currentUserId);
    const dev=isDev(viewer);

    const totalUsers=siteUsers.length;
    const totalMc=siteUsers.reduce((s,u)=>s+(loadMcAccounts(u.id)||[]).length,0);
    const totalIdeas=forumPosts.length;
    const approved=forumPosts.filter(p=>p.approved).length;
    const pending=forumPosts.filter(p=>!p.approved&&!p.rejected).length;
    const totalTime=siteUsers.reduce((s,u)=>s+(u.totalTimeSec||0),0);
    const withTime=siteUsers.filter(u=>(u.totalTimeSec||0)>0);
    const avgTime=withTime.length?totalTime/withTime.length:0;
    const totalVisits=siteUsers.reduce((s,u)=>s+(u.visitCount||0),0);
    const active7=siteUsers.filter(u=>isRecentlyActive(u.lastSeen,7)).length;
    const banned=siteUsers.filter(u=>u.banned).length;
    const newThisWeek=siteUsers.filter(u=>registeredWithinDays(u.registeredAt,7)).length;

    const boxes=[
        {val:totalUsers,                 label:'Site Users',         icon:'fas fa-users'},
        {val:formatDuration(avgTime),    label:'Avg Time / User',    icon:'fas fa-hourglass-half'},
        {val:totalMc,                    label:'Minecraft Profiles', icon:'fas fa-cube'},
        {val:approved,                   label:'Ideas Approved',     icon:'fas fa-lightbulb'}
    ];
    grid.innerHTML=boxes.map(s=>`<div class="admin-stat-box"><div class="admin-stat-ico"><i class="${s.icon}"></i></div><div class="admin-stat-val">${s.val}</div><div class="admin-stat-label">${s.label}</div></div>`).join('');

    const extra=document.getElementById('adminStatsExtra');
    if(!extra)return;
    if(!dev){ extra.innerHTML='<p class="admin-empty">Advanced analytics are available to Developers only.</p>'; return; }

    // ── Secondary metrics ──
    const sec=[
        {val:formatDuration(totalTime),                         label:'Total Time on Site'},
        {val:totalVisits,                                       label:'Total Visits'},
        {val:active7,                                           label:'Active (7 days)'},
        {val:newThisWeek,                                       label:'New This Week'},
        {val:totalUsers?(totalMc/totalUsers).toFixed(1):'0',    label:'Avg MC / User'},
        {val:pending,                                           label:'Ideas Pending'},
        {val:banned,                                            label:'Banned Users'},
        {val:totalIdeas,                                        label:'Total Ideas'}
    ];

    // ── Role distribution ──
    const roleCounts={}; ROLE_ORDER.forEach(r=>roleCounts[r]=0);
    siteUsers.forEach(u=>{ roleCounts[ROLE_ORDER.includes(u.role)?u.role:'USER']++; });
    const roleBars=ROLE_ORDER.slice().reverse().map(r=>{
        const c=roleCounts[r], pct=totalUsers?Math.round(c/totalUsers*100):0;
        return `<div class="dist-row"><span class="dist-label"><i class="${ROLES[r].icon}" style="color:${ROLES[r].color}"></i> ${ROLES[r].label}</span><div class="dist-bar"><div class="dist-fill" style="width:${pct}%;background:${ROLES[r].grad}"></div></div><span class="dist-val">${c}</span></div>`;
    }).join('');

    // ── Account type distribution ──
    const typeCounts={microsoft:0,elyby:0,offline:0};
    siteUsers.forEach(u=>(loadMcAccounts(u.id)||[]).forEach(a=>{ if(typeCounts[a.type]!==undefined)typeCounts[a.type]++; }));
    const typeColors={microsoft:'linear-gradient(135deg,#3b82f6,#2563eb)',elyby:'linear-gradient(135deg,#22d3ee,#0891b2)',offline:'linear-gradient(135deg,#a78bfa,#7c3aed)'};
    const typeBars=Object.keys(typeCounts).map(t=>{
        const c=typeCounts[t], pct=totalMc?Math.round(c/totalMc*100):0;
        return `<div class="dist-row"><span class="dist-label"><i class="${typeIcon(t)}"></i> ${typeLabel(t)}</span><div class="dist-bar"><div class="dist-fill" style="width:${pct}%;background:${typeColors[t]}"></div></div><span class="dist-val">${c}</span></div>`;
    }).join('');

    // ── Leaderboards ──
    const top=siteUsers.slice().sort((a,b)=>(b.totalTimeSec||0)-(a.totalTimeSec||0)).slice(0,5);
    const topRows=top.map((u,i)=>`<div class="lead-row"><span class="lead-rank">#${i+1}</span><img class="lead-av" src="${esc(siteAvatarUrl(u))}" onerror="this.onerror=null;this.src='${avatarUrl('steve')}'"><span class="lead-name">${esc(u.displayName||u.username)} ${roleBadgeHtml(u.role)}</span><span class="lead-time">${formatDuration(u.totalTimeSec)}</span></div>`).join('');
    const recent=siteUsers.slice().sort((a,b)=>parseRegDate(b.registeredAt)-parseRegDate(a.registeredAt)).slice(0,5);
    const recentRows=recent.map(u=>`<div class="lead-row"><img class="lead-av" src="${esc(siteAvatarUrl(u))}" onerror="this.onerror=null;this.src='${avatarUrl('steve')}'"><span class="lead-name">${esc(u.displayName||u.username)} ${roleBadgeHtml(u.role)}</span><span class="lead-time">${esc(u.registeredAt||'?')}</span></div>`).join('');

    extra.innerHTML=`
        <div class="admin-stats-grid secondary">${sec.map(s=>`<div class="admin-stat-box sm"><div class="admin-stat-val">${s.val}</div><div class="admin-stat-label">${s.label}</div></div>`).join('')}</div>
        <div class="dev-panels">
            <div class="dev-card"><h4><i class="fas fa-id-badge"></i> Role Distribution</h4>${roleBars}</div>
            <div class="dev-card"><h4><i class="fas fa-layer-group"></i> Account Types</h4>${typeBars||'<p class="admin-empty">No profiles yet</p>'}</div>
            <div class="dev-card"><h4><i class="fas fa-trophy"></i> Top Time on Site</h4>${topRows||'<p class="admin-empty">No data</p>'}</div>
            <div class="dev-card"><h4><i class="fas fa-user-plus"></i> Recent Signups</h4>${recentRows}</div>
        </div>
        <div class="dev-tools">
            <h4><i class="fas fa-screwdriver-wrench"></i> Developer Tools</h4>
            <div class="dev-tools-row">
                <button class="dev-tool-btn" id="devExportBtn"><i class="fas fa-file-export"></i> Export Database</button>
                <button class="dev-tool-btn" id="devReloadBtn"><i class="fas fa-rotate"></i> Reload from Cloud</button>
                <button class="dev-tool-btn danger" id="devResetBtn"><i class="fas fa-triangle-exclamation"></i> Reset Local Data</button>
            </div>
            <p class="dev-tools-note">Cloud database: <code>${cloud?'connected':'offline — local only'}</code></p>
        </div>`;

    const ex=document.getElementById('devExportBtn'); if(ex)ex.addEventListener('click',exportDatabase);
    const rl=document.getElementById('devReloadBtn'); if(rl)rl.addEventListener('click',()=>{ rl.disabled=true; rl.innerHTML='<i class="fas fa-rotate fa-spin"></i> Reloading...'; Promise.resolve(cloudBootstrap()).then(()=>{ if(dashOverlay&&dashOverlay.classList.contains('open')){renderAdminPanel();document.querySelectorAll('.admin-stab').forEach(s=>s.classList.toggle('active',s.dataset.stab==='site-stats'));document.querySelectorAll('.admin-stab-content').forEach(c=>c.style.display=c.dataset.stabContent==='site-stats'?'block':'none');renderAdminStats();} }); });
    const rs=document.getElementById('devResetBtn'); if(rs)rs.addEventListener('click',()=>{ showConfirm('Clear ALL local data on this device? Cloud data is kept and reloads on refresh.',()=>{ try{Object.keys(localStorage).filter(k=>k.startsWith('spectral_')).forEach(k=>localStorage.removeItem(k));}catch{} location.reload(); }); });
}

document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
        if(dashOverlay&&dashOverlay.classList.contains('open'))closeDashboard();
        const co=document.getElementById('confirmOverlay');if(co&&co.classList.contains('open'))hideConfirm();
        const neo=document.getElementById('newsEditorOverlay');if(neo&&neo.classList.contains('open'))closeNewsEditor();
        const fpo=document.getElementById('forumPostOverlay');if(fpo&&fpo.classList.contains('open'))closeForumPost();
    }
});

// ══════════════════════════════════════════════════════════════
// ADD MC ACCOUNT MODAL
// ══════════════════════════════════════════════════════════════
const addAccOverlay = document.getElementById('addAccountOverlay');
// The accounts <section> has a CSS transform, which would trap this position:fixed
// overlay inside it. Re-parent to <body> so it centres against the viewport.
if (addAccOverlay && addAccOverlay.parentElement !== document.body) document.body.appendChild(addAccOverlay);
const openAddBtn    = document.getElementById('openAddAccountBtn');
const closeAddBtn   = document.getElementById('closeAddAccountBtn');

function openAddAccount() {
    if (!currentUserId) { openDashboard(); return; }
    if (!addAccOverlay) return;
    addAccOverlay.classList.add('open'); document.body.style.overflow='hidden';
    switchAccType('microsoft');
    document.querySelectorAll('.acc-type-card').forEach(c=>c.classList.toggle('active',c.dataset.type==='microsoft'));
    ['elybyLogin','elybyPassword','offlineUsername','offlinePassword'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    const ml=document.getElementById('msLoading'),bml=document.getElementById('btnMsLogin');
    if(ml)ml.style.display='none';if(bml)bml.style.display='flex';
}
function closeAddAccount() {
    if (!addAccOverlay) return;
    addAccOverlay.classList.remove('open'); document.body.style.overflow='';
}
function switchAccType(type) {
    ['microsoft','elyby','offline'].forEach(t=>{const el=document.getElementById('form'+t.charAt(0).toUpperCase()+t.slice(1));if(el)el.style.display=t===type?'block':'none';});
}
if(openAddBtn)openAddBtn.addEventListener('click',openAddAccount);
if(closeAddBtn)closeAddBtn.addEventListener('click',closeAddAccount);
if(addAccOverlay)addAccOverlay.addEventListener('click',e=>{if(e.target===addAccOverlay)closeAddAccount();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&addAccOverlay&&addAccOverlay.classList.contains('open'))closeAddAccount();});

document.querySelectorAll('.acc-type-card').forEach(card=>{card.addEventListener('click',()=>{document.querySelectorAll('.acc-type-card').forEach(c=>c.classList.remove('active'));card.classList.add('active');switchAccType(card.dataset.type);});});

const btnMs=document.getElementById('btnMsLogin'),msLoad=document.getElementById('msLoading');
if(btnMs){btnMs.addEventListener('click',()=>{btnMs.style.display='none';if(msLoad)msLoad.style.display='flex';setTimeout(()=>{const names=['Notch_Legacy','DiamondMiner','CreeperKing','Enderman42','IronGolem'];addMcAccount(names[Math.floor(Math.random()*names.length)],'microsoft','ms_pass');closeAddAccount();},2500);});}

const btnElyby=document.getElementById('btnElybySubmit');
if(btnElyby){btnElyby.addEventListener('click',()=>{const l=document.getElementById('elybyLogin'),p=document.getElementById('elybyPassword');const login=l?l.value.trim():'';if(!login){if(l)l.focus();return;}const orig=btnElyby.innerHTML;btnElyby.disabled=true;btnElyby.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> Authenticating...';setTimeout(()=>{btnElyby.disabled=false;btnElyby.innerHTML=orig;addMcAccount(login,'elyby',p?p.value.trim():'');closeAddAccount();},2000);});}

const btnOffline=document.getElementById('btnOfflineSubmit');
if(btnOffline){btnOffline.addEventListener('click',()=>{const u=document.getElementById('offlineUsername'),p=document.getElementById('offlinePassword');const user=u?u.value.trim():'';if(!user||user.length<3){if(u)u.focus();return;}const orig=btnOffline.innerHTML;btnOffline.disabled=true;btnOffline.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> Creating...';setTimeout(()=>{btnOffline.disabled=false;btnOffline.innerHTML=orig;addMcAccount(user,'offline',p?p.value.trim():'');closeAddAccount();},800);});}

// ══════════════════════════════════════════════════════════════
// CONFIRM MODAL
// ══════════════════════════════════════════════════════════════
const confirmOverlay=document.getElementById('confirmOverlay');
let confirmCb=null;
function showConfirm(text,cb){const el=document.getElementById('confirmText');if(el)el.textContent=text;confirmCb=cb;if(confirmOverlay){confirmOverlay.classList.add('open');document.body.style.overflow='hidden';}}
function hideConfirm(){if(confirmOverlay){confirmOverlay.classList.remove('open');document.body.style.overflow='';}}
document.getElementById('confirmCancel')&&document.getElementById('confirmCancel').addEventListener('click',()=>{hideConfirm();confirmCb=null;});
const confirmDelBtn=document.getElementById('confirmDeleteBtn');
if(confirmDelBtn){confirmDelBtn.addEventListener('click',()=>{if(confirmCb){const cb=confirmCb;confirmCb=null;hideConfirm();cb();}else hideConfirm();});}
if(confirmOverlay)confirmOverlay.addEventListener('click',e=>{if(e.target===confirmOverlay){hideConfirm();confirmCb=null;}});

// ══════════════════════════════════════════════════════════════
// NEWS SYSTEM (DEV editable)
// ══════════════════════════════════════════════════════════════
function renderDevWriteBtn() {
    const btn=document.getElementById('devWriteNewsBtn');if(!btn)return;
    const user=siteUsers.find(u=>u.id===currentUserId);
    btn.style.display=(user&&user.role==='DEV')?'inline-flex':'none';
}
function renderNewsTimeline() {
    const timeline=document.getElementById('updatesTimeline');if(!timeline)return;
    timeline.innerHTML='<div class="timeline-line" aria-hidden="true"></div>';
    const user=siteUsers.find(u=>u.id===currentUserId);
    const isDev=user&&user.role==='DEV';
    newsItems.forEach((item,idx)=>{
        const article=document.createElement('article');
        article.className=`timeline-item animate-on-scroll delay-${(idx%4)+1}`;
        const delBtnHtml=isDev?`<button class="timeline-delete-btn" data-id="${item.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>`:'';
        const tagHtml=item.isCurrent?'<span class="tag new">CURRENT</span>':'';
        const itemsHtml=item.items.map(i=>`<li class="${['add','imp','fix'].includes(i.type)?i.type:'add'}">${esc(i.text)}</li>`).join('');
        article.innerHTML=`
            <div class="date-badge">${esc(item.date)}</div>
            <div class="timeline-card glass tilt-card-sm${item.dimmed?' dimmed':''}${item.isCurrent?' is-current':''}">
                <div class="card-title" style="display:flex;align-items:center;gap:10px;">
                    <h3>${esc(item.title)}</h3>${tagHtml}${delBtnHtml}
                </div>
                <ul class="changelog">${itemsHtml}</ul>
            </div>`;
        if(isDev){const db=article.querySelector('.timeline-delete-btn');if(db){db.addEventListener('click',e=>{e.stopPropagation();showConfirm(`Delete update "${item.title}"?`,()=>{newsItems=newsItems.filter(n=>n.id!==item.id);saveNews(newsItems);renderNewsTimeline();});});}}
        timeline.appendChild(article);
    });
    reinitScrollAnimations();
}

// News editor modal
const newsEditorOverlay=document.getElementById('newsEditorOverlay');
function openNewsEditor(){if(!newsEditorOverlay)return;newsEditorOverlay.classList.add('open');document.body.style.overflow='hidden';const td=document.getElementById('newsDate');if(td){const now=new Date();td.value=now.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}const tt=document.getElementById('newsTitle');if(tt)tt.value='';const rows=document.getElementById('newsItemRows');if(rows){rows.innerHTML=`<div class="news-item-row"><select class="nie-type"><option value="add">+ Added</option><option value="imp">↑ Improved</option><option value="fix">✧ Fixed</option></select><input type="text" class="nie-text" placeholder="Describe the change..."><button type="button" class="nie-remove" title="Remove"><i class="fas fa-times"></i></button></div>`;bindNieRemove(rows.querySelector('.nie-remove'));}}
function closeNewsEditor(){if(!newsEditorOverlay)return;newsEditorOverlay.classList.remove('open');document.body.style.overflow='';}
function bindNieRemove(btn){if(!btn)return;btn.addEventListener('click',()=>{const row=btn.closest('.news-item-row');const rows=document.getElementById('newsItemRows');if(rows&&rows.children.length>1)row.remove();});}

document.getElementById('devWriteNewsBtn')&&document.getElementById('devWriteNewsBtn').addEventListener('click',openNewsEditor);
document.getElementById('closeNewsEditorBtn')&&document.getElementById('closeNewsEditorBtn').addEventListener('click',closeNewsEditor);
if(newsEditorOverlay)newsEditorOverlay.addEventListener('click',e=>{if(e.target===newsEditorOverlay)closeNewsEditor();});

document.getElementById('addNewsItemRowBtn')&&document.getElementById('addNewsItemRowBtn').addEventListener('click',()=>{const rows=document.getElementById('newsItemRows');if(!rows)return;const div=document.createElement('div');div.className='news-item-row';div.innerHTML=`<select class="nie-type"><option value="add">+ Added</option><option value="imp">↑ Improved</option><option value="fix">✧ Fixed</option></select><input type="text" class="nie-text" placeholder="Describe the change..."><button type="button" class="nie-remove" title="Remove"><i class="fas fa-times"></i></button>`;bindNieRemove(div.querySelector('.nie-remove'));rows.appendChild(div);div.querySelector('.nie-text').focus();});

const newsEditorForm=document.getElementById('newsEditorForm');
if(newsEditorForm){newsEditorForm.addEventListener('submit',e=>{e.preventDefault();const date=document.getElementById('newsDate').value.trim();const title=document.getElementById('newsTitle').value.trim();if(!date||!title)return;const rows=document.querySelectorAll('#newsItemRows .news-item-row');const items=[];rows.forEach(row=>{const type=row.querySelector('.nie-type');const text=row.querySelector('.nie-text');if(text&&text.value.trim())items.push({type:type?type.value:'add',text:text.value.trim()});});if(items.length===0)return;// Set previous 'current' to false
newsItems.forEach(n=>n.isCurrent=false);const newItem={id:'news_'+Date.now(),date,title,isCurrent:true,dimmed:false,items};newsItems.unshift(newItem);saveNews(newsItems);closeNewsEditor();renderNewsTimeline();});}

// ══════════════════════════════════════════════════════════════
// FORUM
// ══════════════════════════════════════════════════════════════
function renderForum() {
    const list  = document.getElementById('forumPostsList');
    const empty = document.getElementById('forumEmpty');
    const writeBtn = document.getElementById('forumWriteBtn');
    if (!list) return;
    list.innerHTML='';

    const user=siteUsers.find(u=>u.id===currentUserId);
    const isAdmin=canModerate(user);
    // Button stays visible; when logged out it shows a hint instead of the editor
    if(writeBtn)writeBtn.classList.toggle('locked', !currentUserId);
    const loginHint=document.getElementById('forumLoginHint');
    if(loginHint)loginHint.style.display=currentUserId?'none':'inline-flex';

    // Admins see pending posts (awaiting review) on top, then all approved posts
    const visible=[...forumPosts.filter(p=>!p.approved&&!p.rejected&&isAdmin),...forumPosts.filter(p=>p.approved)];

    if(visible.length===0){if(empty)empty.style.display='block';return;}
    if(empty)empty.style.display='none';

    visible.forEach(p=>{
        const card=document.createElement('div');
        card.className='forum-post-card'+(p.approved?'':' pending');
        const hasVoted=currentUserId&&p.upvotes.includes(currentUserId);
        const pendingBadge=!p.approved&&!p.rejected?'<span class="fp-status fp-pending">Pending review</span>':'';
        card.innerHTML=`
            <div class="fp-header">
                <img class="fp-avatar" src="${avatarUrl(p.authorName)}" onerror="this.onerror=null;this.src='${avatarUrl('steve')}'" alt="">
                <div class="fp-meta">
                    <div class="fp-author">by ${esc(p.authorName)}${roleBadgeHtml(siteUsers.find(u=>u.id===p.authorId)?.role||'USER')}</div>
                    <div class="fp-title">${esc(p.title)}</div>
                </div>
                ${pendingBadge}
            </div>
            <div class="fp-text">${esc(p.text)}</div>
            <div class="fp-footer">
                <button class="fp-upvote${hasVoted?' voted':''}" data-id="${p.id}"><i class="fas fa-arrow-up"></i> ${p.upvotes.length}</button>
                <span class="fp-date">${p.date}</span>
            </div>`;
        const upvoteBtn=card.querySelector('.fp-upvote');
        upvoteBtn.addEventListener('click',()=>{
            if(!currentUserId){openDashboard();return;}
            const post=forumPosts.find(x=>x.id===p.id);if(!post)return;
            const idx=post.upvotes.indexOf(currentUserId);
            if(idx>=0)post.upvotes.splice(idx,1);else post.upvotes.push(currentUserId);
            saveForum(forumPosts);renderForum();
        });
        list.appendChild(card);
    });
}

// Forum post modal
const forumPostOverlay=document.getElementById('forumPostOverlay');
function openForumPost(){
    if(!currentUserId){openDashboard();return;}
    if(!forumPostOverlay)return;
    forumPostOverlay.classList.add('open');document.body.style.overflow='hidden';
    const f=document.getElementById('forumPostForm');if(f)f.reset();
    const cc=document.getElementById('forumCharCount');if(cc)cc.textContent='0';
    const err=document.getElementById('forumPostError');if(err)err.style.display='none';
}
function closeForumPost(){if(!forumPostOverlay)return;forumPostOverlay.classList.remove('open');document.body.style.overflow='';}

document.getElementById('forumWriteBtn')&&document.getElementById('forumWriteBtn').addEventListener('click',openForumPost);
document.getElementById('forumLoginHint')&&document.getElementById('forumLoginHint').addEventListener('click',openDashboard);
document.getElementById('closeForumPostBtn')&&document.getElementById('closeForumPostBtn').addEventListener('click',closeForumPost);
if(forumPostOverlay)forumPostOverlay.addEventListener('click',e=>{if(e.target===forumPostOverlay)closeForumPost();});

const forumTextarea=document.getElementById('forumPostText');
if(forumTextarea){forumTextarea.addEventListener('input',()=>{const cc=document.getElementById('forumCharCount');if(cc)cc.textContent=forumTextarea.value.length;});}

const forumPostForm=document.getElementById('forumPostForm');
if(forumPostForm){
    forumPostForm.addEventListener('submit',e=>{
        e.preventDefault();
        const titleEl=document.getElementById('forumPostTitle');
        const textEl=document.getElementById('forumPostText');
        const errEl=document.getElementById('forumPostError');
        const title=sanitizeField(censor(titleEl?titleEl.value:''), 80);
        const text=sanitizeField(censor(textEl?textEl.value:''), 500);
        if(!title){if(errEl){errEl.textContent='Please enter a title';errEl.style.display='block';}return;}
        if(!text){if(errEl){errEl.textContent='Please describe your idea';errEl.style.display='block';}return;}
        if(errEl)errEl.style.display='none';
        const user=siteUsers.find(u=>u.id===currentUserId);
        const today=new Date();
        const dateStr=`${String(today.getDate()).padStart(2,'0')}.${String(today.getMonth()+1).padStart(2,'0')}.${today.getFullYear()}`;
        const post={id:'fp_'+Date.now(),authorId:currentUserId,authorName:user?user.displayName||user.username:'?',title,text,date:dateStr,upvotes:[],approved:false,rejected:false};
        forumPosts.unshift(post);saveForum(forumPosts);closeForumPost();
        renderForum();
        // notify user
        setTimeout(()=>{alert('Your idea has been submitted and is pending review by moderators. Thank you!');},200);
    });
}

// ══════════════════════════════════════════════════════════════
// INITIAL RENDER
// ══════════════════════════════════════════════════════════════
renderAll();
if (currentUserId) beginUserSession();

// Pull the latest accounts from Supabase and re-render once they arrive,
// then restore any active Supabase Auth session (email/Google login).
cloudBootstrap().then(initSupabaseAuth);

console.log('%c🚀 Spectral Launcher Website', 'color:#6366f1;font-size:20px;font-weight:bold;');
console.log('%cTwo-tier accounts system active', 'color:#10b981;font-size:13px;');

}); // DOMContentLoaded
