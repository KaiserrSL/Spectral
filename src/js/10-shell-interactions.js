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
let canvasRunning = false;
let lastCanvasFrame = 0;
// Touch devices: lighter background, no pointer-driven effects (saves battery/jank)
const IS_TOUCH = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let REDUCED_MOTION = reducedMotionQuery.matches;
// Lightweight mode: weak devices skip the heavy canvas/tilt/parallax work.
// The class is set super-early by boot.min.js in the document head.
function liteOn() { return document.documentElement.classList.contains('lite-mode'); }
function canvasShouldIdle() { return liteOn() || REDUCED_MOTION || window.innerWidth <= 620; }
if (!liteOn() && !REDUCED_MOTION) document.addEventListener('mouseleave', () => { mouse.active = false; });
function resizeCanvas() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    canvasWidth = canvas.width; canvasHeight = canvas.height; initParticles();
    if (REDUCED_MOTION && !liteOn()) {
        particles.forEach(p => p.draw(ctx, true));
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}
function initParticles() {
    particles = [];
    if (canvasShouldIdle()) return;
    // Fewer particles on phones/tablets — the O(n²) link drawing is the heavy part
    const cap = IS_TOUCH ? 16 : 48;
    const count = Math.min(cap, Math.floor((canvasWidth * canvasHeight) / 22000));
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(Math.random()*canvasWidth, Math.random()*canvasHeight,
            1.5+Math.random()*3.5, (Math.random()-.5)*.6, (Math.random()-.5)*.6, 210+Math.random()*120));
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
    if (elapsed < 900) return;            // warm-up grace period
    _perfFrames++;
    if (elapsed >= 4500) {                // longer sample avoids false positives during page startup
        _perfChecked = true;
        const fps = (_perfFrames * 1000) / (elapsed - 900);
        if (fps < 24 && typeof enableLiteMode === 'function') enableLiteMode(false, true);
    }
}
function animate(ts) {
    if (canvasShouldIdle() || document.hidden) { canvasRunning = false; cancelAnimationFrame(animationId); return; }
    canvasRunning = true;
    checkFps(ts || performance.now());
    const now = ts || performance.now();
    const minFrame = IS_TOUCH ? 32 : 16;
    const elapsed = lastCanvasFrame ? now - lastCanvasFrame : 16.67;
    if (elapsed < minFrame) { animationId = requestAnimationFrame(animate); return; }
    lastCanvasFrame = now;
    const frameStep = Math.min(2, elapsed / 16.67);
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
    particles.forEach(p => { p.update(canvasWidth,canvasHeight,mouse,frameStep); p.draw(ctx,IS_TOUCH); });
    animationId = requestAnimationFrame(animate);
}
window.addEventListener('resize', () => {
    clearTimeout(window._resizeTimer);
    window._resizeTimer = setTimeout(() => {
        resizeCanvas();
        if (!canvasShouldIdle() && !canvasRunning) animate(performance.now());
    }, 200);
});
resizeCanvas();
if (!canvasShouldIdle()) animate();
const handleReducedMotionChange = event => {
    REDUCED_MOTION = event.matches;
    mouse.active = false;
    cancelAnimationFrame(animationId);
    canvasRunning = false;
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
    document.querySelectorAll('.animate-on-scroll,.timeline-item').forEach(element=>element.classList.add('visible','in-view'));
    resizeCanvas();
    if (!canvasShouldIdle() && !document.hidden) animate(performance.now());
};
if (typeof reducedMotionQuery.addEventListener === 'function') reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
else if (typeof reducedMotionQuery.addListener === 'function') reducedMotionQuery.addListener(handleReducedMotionChange);

// Pause continuous canvas work in background tabs and resume with a clean frame.
document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('motion-paused', document.hidden);
    if (document.hidden) {
        canvasRunning = false;
        cancelAnimationFrame(animationId);
        return;
    }
    lastCanvasFrame = performance.now();
    if (!canvasShouldIdle() && !canvasRunning) animate(lastCanvasFrame);
});

// One shared pointer update drives the background glow without layout work.
let atmosphereRaf = null;
document.addEventListener('pointermove', e => {
    if (liteOn() || IS_TOUCH || REDUCED_MOTION) return;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    if (atmosphereRaf) return;
    atmosphereRaf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--pointer-x', `${mouse.x}px`);
        document.documentElement.style.setProperty('--pointer-y', `${mouse.y}px`);
        atmosphereRaf = null;
    });
}, { passive: true });

// ── Tab navigation ───────────────────────────────────────────
// Keep visually hidden dialogs out of keyboard and assistive-technology navigation.
const dialogOverlays = [...document.querySelectorAll('[role="dialog"]')];
const dialogStates = new WeakMap();
const DIALOG_FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
].join(',');
function dialogFocusableElements(dialog) {
    return [...dialog.querySelectorAll(DIALOG_FOCUSABLE)].filter(element => {
        const style = getComputedStyle(element);
        return !element.closest('[hidden],[inert]')
            && style.display !== 'none'
            && style.visibility !== 'hidden'
            && element.getClientRects().length > 0;
    });
}
function topOpenDialog() {
    return dialogOverlays
        .filter(dialog => dialog.classList.contains('open'))
        .sort((a, b) => (parseInt(getComputedStyle(a).zIndex, 10) || 0) - (parseInt(getComputedStyle(b).zIndex, 10) || 0))
        .pop() || null;
}
function syncDialogStackAccessibility() {
    const top = topOpenDialog();
    dialogOverlays.forEach(dialog => {
        const interactive = dialog === top;
        dialog.setAttribute('aria-hidden', String(!interactive));
        dialog.inert = !interactive;
    });
}
function syncBodyScrollLock() {
    if (topOpenDialog()) document.body.style.overflow = 'hidden';
    else if (!document.body.classList.contains('nav-menu-open')) document.body.style.overflow = '';
}
function syncDialogAccessibility(dialog) {
    const open = dialog.classList.contains('open');
    dialog.setAttribute('aria-hidden', String(!open));
    dialog.inert = !open;
    const previous = dialogStates.get(dialog);
    if (!previous) {
        dialogStates.set(dialog, { open, returnFocus: null });
        syncDialogStackAccessibility();
        return;
    }
    if (previous.open === open) {
        syncDialogStackAccessibility();
        return;
    }
    previous.open = open;
    if (open) {
        previous.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        requestAnimationFrame(() => {
            if (!dialog.classList.contains('open')) return;
            const [first] = dialogFocusableElements(dialog);
            if (first) first.focus();
            else {
                dialog.setAttribute('tabindex', '-1');
                dialog.focus();
            }
        });
    } else {
        const returnFocus = previous.returnFocus;
        previous.returnFocus = null;
        requestAnimationFrame(() => {
            const canReturn = returnFocus?.isConnected
                && typeof returnFocus.focus === 'function'
                && returnFocus.matches?.(DIALOG_FOCUSABLE)
                && !returnFocus.closest('[hidden],[inert]')
                && returnFocus.getClientRects().length > 0;
            if (canReturn) returnFocus.focus();
            else {
                const underlying = topOpenDialog();
                const [fallback] = underlying ? dialogFocusableElements(underlying) : [];
                fallback?.focus();
            }
        });
    }
    syncDialogStackAccessibility();
    syncBodyScrollLock();
}
dialogOverlays.forEach(dialog => {
    syncDialogAccessibility(dialog);
    new MutationObserver(() => syncDialogAccessibility(dialog)).observe(dialog, { attributes: true, attributeFilter: ['class'] });
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        const checkout = document.getElementById('roleCheckoutSheet');
        if (checkout && !checkout.hidden) {
            event.preventDefault();
            document.getElementById('roleCheckoutClose')?.click();
            return;
        }
        const dialog = topOpenDialog();
        if (!dialog) return;
        const dismiss = dialog.querySelector('[aria-label^="Close" i], .confirm-cancel');
        if (dismiss) {
            event.preventDefault();
            dismiss.click();
        }
        return;
    }
    if (event.key !== 'Tab') return;
    const dialog = topOpenDialog();
    if (!dialog) return;
    const focusable = dialogFocusableElements(dialog);
    if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});

let scrollObserver = null;
const navButtons = [...document.querySelectorAll('.nav-btn')];
const navIndicator = document.getElementById('navActiveIndicator');
let navIndicatorFrame = 0;
function syncNavIndicator() {
    if (!navIndicator || window.innerWidth <= 1180) return;
    const active = document.querySelector('.nav-links-container .nav-btn.active');
    if (!active) return;
    navIndicator.style.width = `${active.offsetWidth}px`;
    navIndicator.style.transform = `translate3d(${active.offsetLeft}px,0,0)`;
    navIndicator.classList.add('is-ready');
}
function scheduleNavIndicator() {
    cancelAnimationFrame(navIndicatorFrame);
    navIndicatorFrame = requestAnimationFrame(syncNavIndicator);
}
window.addEventListener('resize', scheduleNavIndicator);
if (navIndicator && 'ResizeObserver' in window) new ResizeObserver(scheduleNavIndicator).observe(navIndicator.parentElement);
document.fonts?.ready.then(scheduleNavIndicator);
const SITE_ROUTE_IDS = new Set(navButtons.map(button=>button.getAttribute('data-target')).filter(id=>id&&document.getElementById(id)));
const DEV_SECTION_IDS = new Set(['dev-pipeline','dev-systems','dev-source']);
function validSiteRoute(value){return DEV_SECTION_IDS.has(value)?'development':SITE_ROUTE_IDS.has(value)?value:'home';}
function activateSiteRoute(route,{historyMode='push',animate=true}={}){
    const targetId=validSiteRoute(route);
    const current=document.querySelector('.tab-content.active-tab');
    const next=document.getElementById(targetId);
    if(!next)return false;
    navButtons.forEach(button=>{
        const active=button.getAttribute('data-target')===targetId;
        button.classList.toggle('active',active);
        if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    scheduleNavIndicator();
    if(historyMode==='push'&&location.hash!==`#${targetId}`)history.pushState(null,'',`#${targetId}`);
    else if(historyMode==='replace'&&location.hash!==`#${targetId}`)history.replaceState(null,'',`#${targetId}`);
    if(current===next){window.scrollTo({top:0,behavior:'instant'});return true;}
    document.querySelectorAll('.tab-content').forEach(section=>{
        const active=section===next;
        section.classList.toggle('active-tab',active);
        section.classList.remove('route-enter');
        section.style.removeProperty('display');
        section.style.removeProperty('opacity');
        section.style.removeProperty('transform');
        section.setAttribute('aria-hidden',String(!active));
        section.inert=!active;
    });
    if(animate&&!liteOn()&&!REDUCED_MOTION)next.classList.add('route-enter');
    window.scrollTo({top:0,behavior:'instant'});
    reinitScrollAnimations();
    return true;
}
navButtons.forEach(button => {
    button.addEventListener('click', event => {
        event.preventDefault();
        activateSiteRoute(button.getAttribute('data-target'));
    });
});
window.addEventListener('popstate', () => {
    const hash=window.location.hash.slice(1)||'home';
    activateSiteRoute(hash,{historyMode:'none'});
    if(DEV_SECTION_IDS.has(hash))requestAnimationFrame(()=>scrollBelowNavbar(document.getElementById(hash)));
});
// Hero and footer hash links switch the SPA tab instead of scrolling to hidden content.
document.querySelectorAll('a[href^="#"]:not(.nav-btn)').forEach(link => {
    link.addEventListener('click', event => {
        const targetId = link.getAttribute('href')?.slice(1);
        const target = targetId && document.getElementById(targetId);
        if (!target?.classList.contains('tab-content')) return;
        event.preventDefault();
        activateSiteRoute(targetId);
    });
});
document.querySelectorAll('[data-af-tab]').forEach(button => {
    button.addEventListener('click', () => {
        activateSiteRoute(button.getAttribute('data-af-tab'));
    });
});

// Honour a valid route when the page is opened or refreshed with a hash.
const initialRoute = window.location.hash.slice(1);
// Supabase returns OAuth/recovery tokens in the fragment. Keep it untouched
// until the Auth client has established the session.
const isAuthRedirectHash = /(?:^|&)(?:access_token|refresh_token|error|error_code|type)=/.test(initialRoute);
if(isAuthRedirectHash)activateSiteRoute('home',{historyMode:'none',animate:false});
else if(initialRoute)activateSiteRoute(initialRoute,{historyMode:SITE_ROUTE_IDS.has(initialRoute)||DEV_SECTION_IDS.has(initialRoute)?'none':'replace',animate:false});
else activateSiteRoute('home',{historyMode:'none',animate:false});
if(DEV_SECTION_IDS.has(initialRoute))requestAnimationFrame(()=>scrollBelowNavbar(document.getElementById(initialRoute)));

// ── Scroll animations ────────────────────────────────────────
scrollObserver = (liteOn() || REDUCED_MOTION) ? null : new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (!e.isIntersecting) return;
        requestAnimationFrame(() => e.target.classList.add('visible'));
        scrollObserver.unobserve(e.target);
    });
}, { threshold:0.15, rootMargin:'0px 0px -50px 0px' });
function reinitScrollAnimations() {
    const active = document.querySelector('.tab-content.active-tab');
    if (!active) return;
    const pending = active.querySelectorAll('.animate-on-scroll:not(.visible)');
    if (!scrollObserver) pending.forEach(el => el.classList.add('visible'));
    else pending.forEach(el => scrollObserver.observe(el));
}
document.querySelectorAll('.animate-on-scroll').forEach(el => {
    if (scrollObserver) scrollObserver.observe(el);
    else el.classList.add('visible');
});

// Retarget short content changes without forcing layout between rapid clicks.
const panelChangeMotions = new WeakMap();
function revealUpdatedPanel(element) {
    if (!element || REDUCED_MOTION || liteOn() || !element.animate) return;
    panelChangeMotions.get(element)?.cancel();
    const motion = element.animate([
        { opacity: .86, transform: 'translate3d(0, 6px, 0)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' }
    ], { duration: 280, easing: 'cubic-bezier(.2, .8, .25, 1)' });
    panelChangeMotions.set(element, motion);
    motion.finished.then(() => {
        if (panelChangeMotions.get(element) === motion) panelChangeMotions.delete(element);
    }).catch(() => {});
}

// Home feature deck: deliberate click and keyboard selection avoid hover resize loops.
const homeFeatureCards = [...document.querySelectorAll('[data-home-feature]')];
function activateHomeFeature(card) {
    if (!card || card.classList.contains('is-active')) return;
    homeFeatureCards.forEach(item => {
        const active = item === card;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
        const label = item.querySelector('.feature-card-open b');
        if (label) label.textContent = active ? 'In focus' : 'Focus this tool';
    });
}
homeFeatureCards.forEach((card, index) => {
    card.addEventListener('click', () => activateHomeFeature(card));
    card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activateHomeFeature(card);
            return;
        }
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const step = event.key === 'ArrowRight' ? 1 : -1;
        const next = homeFeatureCards[(index + step + homeFeatureCards.length) % homeFeatureCards.length];
        activateHomeFeature(next);
        next.focus();
    });
});

// ── Magnetic buttons ─────────────────────────────────────────
// A single animation loop serves every magnetic control. Geometry is read once
// on pointer entry instead of on every move, avoiding layout work mid-frame.
if (!liteOn() && !REDUCED_MOTION && !IS_TOUCH) {
    const magneticStates = new WeakMap();
    const activeMagnets = new Set();
    let magneticRaf = null;

    const queueMagneticFrame = () => {
        if (!magneticRaf) magneticRaf = requestAnimationFrame(updateMagnets);
    };
    function updateMagnets() {
        let keepRunning = false;
        activeMagnets.forEach(btn => {
            const state = magneticStates.get(btn);
            const smoothing = .18;
            state.cx += (state.tx - state.cx) * smoothing;
            state.cy += (state.ty - state.cy) * smoothing;
            const moving = Math.abs(state.tx - state.cx) > .08 || Math.abs(state.ty - state.cy) > .08;
            if (moving) {
                keepRunning = true;
                btn.style.transform = `translate3d(${state.cx.toFixed(2)}px,${state.cy.toFixed(2)}px,0)`;
                return;
            }
            state.cx = state.tx;
            state.cy = state.ty;
            if (state.tx === 0 && state.ty === 0) {
                btn.style.removeProperty('transform');
                btn.classList.remove('is-magnetic');
                activeMagnets.delete(btn);
            } else {
                btn.style.transform = `translate3d(${state.cx.toFixed(2)}px,${state.cy.toFixed(2)}px,0)`;
            }
        });
        magneticRaf = keepRunning ? requestAnimationFrame(updateMagnets) : null;
    }

    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        const state = { cx: 0, cy: 0, tx: 0, ty: 0, rect: null };
        magneticStates.set(btn, state);
        btn.addEventListener('pointerenter', () => {
            state.rect = btn.getBoundingClientRect();
            btn.classList.add('is-magnetic');
        }, { passive: true });
        btn.addEventListener('pointermove', event => {
            if (liteOn()) return;
            const rect = state.rect || btn.getBoundingClientRect();
            state.rect = rect;
            state.tx = (event.clientX - rect.left - rect.width / 2) * .3;
            state.ty = (event.clientY - rect.top - rect.height / 2) * .3;
            btn.classList.add('is-magnetic');
            activeMagnets.add(btn);
            queueMagneticFrame();
        }, { passive: true });
        const releaseMagnet = () => {
            state.tx = 0;
            state.ty = 0;
            state.rect = null;
            activeMagnets.add(btn);
            queueMagneticFrame();
        };
        btn.addEventListener('pointerleave', releaseMagnet, { passive: true });
        btn.addEventListener('pointercancel', releaseMagnet, { passive: true });
    });
}

// ── 3D tilt ──────────────────────────────────────────────────
const tiltEls = document.querySelectorAll('.tilt-card-lg,.tilt-card-sm');
const tiltData = new WeakMap();
tiltEls.forEach(el => tiltData.set(el,{cx:0,cy:0,tx:0,ty:0}));
let tiltRaf=null;
const activeTilts = new Set();
function updateTilt(){
    let needs=false;
    activeTilts.forEach(el=>{
        const d=tiltData.get(el),l=.14;
        d.cx+=(d.tx-d.cx)*l; d.cy+=(d.ty-d.cy)*l;
        if(Math.abs(d.tx-d.cx)>.015||Math.abs(d.ty-d.cy)>.015) needs=true;
        else if(d.tx===0&&d.ty===0){ d.cx=0; d.cy=0; activeTilts.delete(el); el.classList.remove('is-tilting'); }
        el.style.transform=`perspective(1200px) rotateX(${d.cx}deg) rotateY(${d.cy}deg) translateZ(0)`;
    });
    if(needs) tiltRaf=requestAnimationFrame(updateTilt); else tiltRaf=null;
}
if (!liteOn() && !IS_TOUCH && !REDUCED_MOTION) tiltEls.forEach(el=>{
    let rect=null, moveRaf=null, latestEvent=null;
    const queue=()=>{ if(!tiltRaf) tiltRaf=requestAnimationFrame(updateTilt); };
    el.addEventListener('pointerenter',()=>{ rect=el.getBoundingClientRect(); el.classList.add('is-tilting'); activeTilts.add(el); queue(); },{passive:true});
    el.addEventListener('pointermove',event=>{
        latestEvent=event;
        if(moveRaf) return;
        moveRaf=requestAnimationFrame(()=>{
            moveRaf=null;
            if(!rect) rect=el.getBoundingClientRect();
            const d=tiltData.get(el), intensity=el.classList.contains('launcher-ui')?95:el.classList.contains('tilt-card-lg')?34:28;
            d.tx=((latestEvent.clientY-rect.top-rect.height/2)/intensity)*-1;
            d.ty=(latestEvent.clientX-rect.left-rect.width/2)/intensity;
            activeTilts.add(el); queue();
        });
    },{passive:true});
    el.addEventListener('pointerleave',()=>{ const d=tiltData.get(el); d.tx=0; d.ty=0; rect=null; activeTilts.add(el); queue(); },{passive:true});
});

// ── Ripple ───────────────────────────────────────────────────
document.querySelectorAll('.btn-primary,.btn-secondary,.lu-play').forEach(btn=>{btn.addEventListener('click',function(e){if(liteOn()||REDUCED_MOTION)return;const r=this.getBoundingClientRect(),sp=document.createElement('span');sp.className='ripple-effect';const keyboardClick=e.detail===0;sp.style.left=(keyboardClick?r.width/2:e.clientX-r.left)+'px';sp.style.top=(keyboardClick?r.height/2:e.clientY-r.top)+'px';this.appendChild(sp);setTimeout(()=>sp.remove(),600);});});

// ── Theme toggle ─────────────────────────────────────────────
const THEME_KEY = 'spectral_theme';
const profileThemeToggle = document.getElementById('profileThemeToggle');
const profileThemeIcon = document.getElementById('profileThemeIcon');
const profileThemeState = document.getElementById('profileThemeState');
const navThemeToggle = document.getElementById('navThemeToggle');
function commitTheme(theme) {
    SPECTRAL_LIGHT = (theme === 'light');
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        if (profileThemeIcon) profileThemeIcon.className = 'fas fa-sun';
        if (profileThemeState) profileThemeState.textContent = 'Light palette is active';
    } else {
        document.body.classList.remove('light-theme');
        if (profileThemeIcon) profileThemeIcon.className = 'fas fa-moon';
        if (profileThemeState) profileThemeState.textContent = 'Dark palette is active';
    }
    if (profileThemeToggle) profileThemeToggle.checked = (theme === 'light');
    if (navThemeToggle) {
        const nextLabel = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
        navThemeToggle.setAttribute('aria-label', nextLabel);
        navThemeToggle.setAttribute('title', nextLabel);
        navThemeToggle.setAttribute('aria-pressed', String(theme === 'light'));
    }
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === 'light' ? '#f4f6ff' : '#080a18';
}
function applyTheme(theme, animate, source) {
    if (!animate || REDUCED_MOTION || liteOn()) {
        commitTheme(theme);
        return;
    }
    if (typeof document.startViewTransition === 'function' && !document.getElementById('dashboardOverlay')?.classList.contains('open')) {
        const rect = source?.getBoundingClientRect();
        const x = rect ? rect.left + rect.width / 2 : innerWidth / 2;
        const y = rect ? rect.top + rect.height / 2 : innerHeight / 2;
        const radius = Math.max(
            Math.hypot(x, y), Math.hypot(innerWidth - x, y),
            Math.hypot(x, innerHeight - y), Math.hypot(innerWidth - x, innerHeight - y),
        );
        document.documentElement.style.setProperty('--theme-origin-x', `${x}px`);
        document.documentElement.style.setProperty('--theme-origin-y', `${y}px`);
        document.documentElement.style.setProperty('--theme-radius', `${radius}px`);
        document.startViewTransition(() => commitTheme(theme)).finished.catch(() => {}).finally(() => {
            document.documentElement.style.removeProperty('--theme-origin-x');
            document.documentElement.style.removeProperty('--theme-origin-y');
            document.documentElement.style.removeProperty('--theme-radius');
        });
        return;
    }
    document.body.classList.add('theme-switching');
    commitTheme(theme);
    setTimeout(() => document.body.classList.remove('theme-switching'), 520);
}
let initialTheme = 'dark';
try { initialTheme = localStorage.getItem(THEME_KEY) || 'dark'; } catch {}
applyTheme(initialTheme, false);
if (profileThemeToggle) {
    profileThemeToggle.addEventListener('change', event => {
        const next = profileThemeToggle.checked ? 'light' : 'dark';
        try { localStorage.setItem(THEME_KEY, next); } catch {}
        applyTheme(next, true, event.currentTarget);
    });
}
if (navThemeToggle) {
    navThemeToggle.addEventListener('click', event => {
        const next = document.body.classList.contains('light-theme') ? 'dark' : 'light';
        try { localStorage.setItem(THEME_KEY, next); } catch {}
        applyTheme(next, true, event.currentTarget);
    });
}

// ── Lightweight (performance) mode ───────────────────────────
// The <head> detector already decided the initial mode. Here we
// wire up the warning banner and the profile performance control.
const LITE_KEY = 'spectral_lite';
const LITE_BANNER_KEY = 'spectral_lite_banner_dismissed';
const profileLiteToggle = document.getElementById('profileLiteToggle');
const profileLiteIcon = document.getElementById('profileLiteIcon');
const profileLiteState = document.getElementById('profileLiteState');
const profilePerformanceNote = document.getElementById('profilePerformanceNote');

function updateLiteControl() {
    const on = liteOn();
    if (profileLiteToggle) profileLiteToggle.checked = on;
    if (profileLiteIcon) profileLiteIcon.className = on ? 'fas fa-bolt' : 'fas fa-gauge-high';
    if (profileLiteState) profileLiteState.textContent = on ? 'Optimized rendering is active' : 'Full visual quality';
    const note = profilePerformanceNote && profilePerformanceNote.querySelector('span');
    if (note) note.textContent = on
        ? (window.__SPECTRAL_LITE_AUTO
            ? 'Enabled automatically for this device. Blur, particles and continuous motion are paused.'
            : 'Blur, particles and continuous motion are paused. The page reloads once when this setting changes.')
        : 'Uses the complete visual experience. The page reloads once when this setting changes.';
}

let liteBannerEl = null;
function showLiteBanner() {
    if (liteBannerEl || !liteOn()) return;
    if (!window.__SPECTRAL_LITE_AUTO) return;
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
    document.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.add('visible'));
    updateLiteControl();
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

if (profileLiteToggle) {
    profileLiteToggle.addEventListener('change', () => { profileLiteToggle.checked ? switchToLite() : switchToFull(); });
}
updateLiteControl();
if (liteOn()) showLiteBanner();

// ── Scroll to top ────────────────────────────────────────────
const scrollTopBtn = document.getElementById('scrollToTop');
scrollTopBtn&&scrollTopBtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:(liteOn()||REDUCED_MOTION)?'auto':'smooth'}));

// ── Pulsing dot ──────────────────────────────────────────────
const pulseDot = document.querySelector('.pulse-dot');
if(pulseDot&&!liteOn()&&!REDUCED_MOTION) pulseDot.classList.add('motion-pulse');

// ── Parallax ─────────────────────────────────────────────────

// ── Navbar scroll (theme-aware) ──────────────────────────────
const navbar=document.querySelector('.navbar');let lastScroll=0;
let scrollEffectsRaf=null;
function updateScrollEffects(){
    scrollEffectsRaf=null;
    const cur=window.scrollY;
    if(scrollTopBtn) scrollTopBtn.classList.toggle('visible',cur>500);
    if(navbar){
        if(navbar.classList.contains('nav-open')){ lastScroll=cur; return; }
        if(cur>100){
            const delta=cur-lastScroll;
            if(Math.abs(delta)>=8){
                const hiding=delta>0;
                navbar.classList.toggle('is-hidden',hiding);
                navbar.classList.toggle('is-scrolled',!hiding);
                lastScroll=cur;
            }
        }else{
            navbar.classList.remove('is-hidden','is-scrolled');
            lastScroll=cur;
        }
    }else lastScroll=cur;
}
window.addEventListener('scroll',()=>{
    if(!scrollEffectsRaf) scrollEffectsRaf=requestAnimationFrame(updateScrollEffects);
},{passive:true});

// Browsers may apply native fragment scrolling after deferred scripts run.
// SPA route hashes identify sections, so direct routes still open at the top
// with primary navigation visible.
window.addEventListener('load',()=>{
    if(!SITE_ROUTE_IDS.has(location.hash.slice(1)))return;
    window.scrollTo({top:0,behavior:'instant'});
    navbar?.classList.remove('is-hidden','is-scrolled');
    lastScroll=0;
},{once:true});

// ── Mobile hamburger menu ────────────────────────────────────
const navBurger = document.getElementById('navBurger');
const navBackdrop = document.getElementById('navBackdrop');
const navLinksPanel = document.getElementById('primaryNavigation');
function syncNavAccessibility() {
    const compact = window.innerWidth <= 1180;
    const open = Boolean(navbar?.classList.contains('nav-open'));
    if (navLinksPanel) {
        navLinksPanel.setAttribute('aria-hidden', String(compact && !open));
        navLinksPanel.inert = compact && !open;
    }
    if (navBackdrop) navBackdrop.setAttribute('aria-hidden', String(!open));
}
function setNavOpen(open) {
    if (!navbar) return;
    const wasOpen=navbar.classList.contains('nav-open');
    const shouldOpen = open && window.innerWidth <= 1180;
    navbar.classList.toggle('nav-open', shouldOpen);
    document.body.classList.toggle('nav-menu-open', shouldOpen);
    if (navBackdrop) navBackdrop.classList.toggle('show', shouldOpen);
    if (navBurger) {
        navBurger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        navBurger.setAttribute('aria-label', shouldOpen ? 'Close menu' : 'Open menu');
    }
    syncNavAccessibility();
    // make sure the bar is visible when opening
    if (shouldOpen) {
        navbar.classList.remove('is-hidden');
        requestAnimationFrame(()=>navLinksPanel?.querySelector('.nav-btn')?.focus());
    } else if (wasOpen && window.innerWidth <= 1180 && navLinksPanel?.contains(document.activeElement)) {
        navBurger?.focus();
    }
}
if (navBurger) navBurger.addEventListener('click', () => setNavOpen(!navbar.classList.contains('nav-open')));
if (navBackdrop) navBackdrop.addEventListener('click', () => setNavOpen(false));
// close the menu after picking a destination
document.querySelectorAll('.nav-links-container .nav-btn').forEach(btn => {
    btn.addEventListener('click', () => setNavOpen(false));
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navbar?.classList.contains('nav-open') && !topOpenDialog()) {
        setNavOpen(false);
        navBurger?.focus();
    }
});
// auto-close if the viewport grows back to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 1180) setNavOpen(false);
    else syncNavAccessibility();
});
syncNavAccessibility();

// ── Terminal animation ───────────────────────────────────────
// Typewriter terminal: types each line character-by-character with a caret.
let _termTyping=false, _termPlayed=false;
function runTerminal(){
    const body=document.getElementById('terminalBody');
    if(!body||_termTyping||_termPlayed) return;
    const allLines=[...body.querySelectorAll('.t-line')];
    const typed=allLines.filter(l=>l.querySelector('.t-text[data-text]'));
    const cursorLine=body.querySelector('.t-cursorline');
    _termTyping=true; _termPlayed=true;
    allLines.forEach(l=>l.style.opacity='0');
    typed.forEach(l=>{const t=l.querySelector('.t-text');t.textContent='';l.classList.remove('typing');});
    let i=0;
    function typeLine(){
        if(i>=typed.length){ if(cursorLine) cursorLine.style.opacity='1'; _termTyping=false; return; }
        const line=typed[i], el=line.querySelector('.t-text');
        const chars=[...(el.getAttribute('data-text')||'')];  // spread → safe for emoji
        line.style.opacity='1'; line.classList.add('typing');
        const duration=Math.max(280,chars.length*22);
        let start=0,lastCount=-1;
        function typeFrame(ts){
            if(!start) start=ts;
            const progress=Math.min(1,(ts-start)/duration);
            const count=Math.min(chars.length,Math.ceil(progress*chars.length));
            if(count!==lastCount){ el.textContent=chars.slice(0,count).join(''); lastCount=count; }
            if(progress<1) requestAnimationFrame(typeFrame);
            else { line.classList.remove('typing'); i++; setTimeout(typeLine,120); }
        }
        requestAnimationFrame(typeFrame);
    }
    typeLine();
}
// No unobserve → replays each time the console scrolls back into view (flag guards overlap).
const termBody=document.getElementById('terminalBody');
if(termBody){
    if(liteOn()||REDUCED_MOTION){
        termBody.querySelectorAll('.t-line').forEach(line=>line.style.opacity='1');
        termBody.querySelectorAll('.t-text[data-text]').forEach(el=>el.textContent=el.getAttribute('data-text')||'');
    }else{
        const termObs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){runTerminal();termObs.unobserve(e.target);}}),{threshold:0.45});
        termObs.observe(termBody);
    }
}

// ── af-bar animation ─────────────────────────────────────────
function fillFeatureBar(fill){
    fill.style.setProperty('--bar-progress',String((Number(fill.getAttribute('data-width'))||0)/100));
    fill.classList.add('is-filled');
}
if(liteOn()||REDUCED_MOTION){
    document.querySelectorAll('.af-bar-fill').forEach(fillFeatureBar);
}else{
    const barObs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){requestAnimationFrame(()=>e.target.querySelectorAll('.af-bar-fill').forEach(fillFeatureBar));barObs.unobserve(e.target);}}),{threshold:0.3});
    document.querySelectorAll('.af-showcase').forEach(el=>barObs.observe(el));
}

// ── Counter animation ────────────────────────────────────────
function animCounter(el,target,dur=1100){let start=0,last=-1;function step(ts){if(!start)start=ts;const p=Math.min((ts-start)/dur,1);const value=Math.floor(target*(1-Math.pow(1-p,3)));if(value!==last){el.textContent=String(value);last=value;}if(p<1)requestAnimationFrame(step);else el.textContent=String(target);}requestAnimationFrame(step);}
const cntObs=(liteOn()||REDUCED_MOTION)?null:new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.querySelectorAll('.af-stat-num[data-count]').forEach(el=>animCounter(el,parseInt(el.getAttribute('data-count'))));cntObs.unobserve(e.target);}}),{threshold:0.35});
if(liteOn()||REDUCED_MOTION){
    document.querySelectorAll('.af-stat-num[data-count]').forEach(el=>{const value=parseInt(el.getAttribute('data-count'));el.textContent=value>=1000?(value/1000)+'K+':String(value);});
}else{
    document.querySelectorAll('.af-stats-strip').forEach(el=>cntObs.observe(el));
}

// ── Development explorer ─────────────────────────────────────
const DEV_CODE_NOTES = {
    launch: {
        title: 'Launch orchestration',
        description: 'Turns validated settings and an account into a prepared Minecraft process while keeping failure signals available to the UI.',
        responsibility: 'metadata → arguments → QProcess',
        tasks: ['Build the classpath and game arguments', 'Prepare native libraries', 'Forward output and failures to Console']
    },
    java: {
        title: 'Runtime selection',
        description: 'Matches the Minecraft version to a compatible Java major and chooses the best installed runtime, with download as an explicit fallback.',
        responsibility: 'MC version → Java major → runtime',
        tasks: ['Derive the required Java major', 'Scan installed runtimes', 'Return a compatible, deterministic match']
    },
    auth: {
        title: 'Stable player identity',
        description: 'Keeps local profiles predictable by generating the same vanilla-compatible offline UUID for the same Minecraft username.',
        responsibility: 'username → offline UUID → profile',
        tasks: ['Normalize the OfflinePlayer input', 'Apply the UUID v3 bit layout', 'Keep identity stable between launches']
    }
};

function activateCodeExample(key) {
    if (!DEV_CODE_NOTES[key]) return;
    document.querySelectorAll('.code-tab').forEach(tab => {
        const selected = tab.getAttribute('data-tab') === key;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.setAttribute('tabindex', selected ? '0' : '-1');
    });
    document.querySelectorAll('.code-pane').forEach(pane => {
        const show = pane.getAttribute('data-pane') === key;
        pane.style.display = show ? 'block' : 'none';
        pane.setAttribute('aria-hidden', String(!show));
        if (show) {
            revealUpdatedPanel(pane);
        }
    });
    const note = DEV_CODE_NOTES[key];
    const panel = document.querySelector('.dev-code-notes');
    const title = document.getElementById('devCodeTitle');
    const description = document.getElementById('devCodeDescription');
    const responsibility = document.getElementById('devCodeResponsibility');
    const tasks = document.getElementById('devCodeTasks');
    if (title) title.textContent = note.title;
    if (description) description.textContent = note.description;
    if (responsibility) responsibility.textContent = note.responsibility;
    if (tasks) {
        tasks.replaceChildren(...note.tasks.map(text => {
            const item = document.createElement('li');
            item.textContent = text;
            return item;
        }));
    }
    revealUpdatedPanel(panel);
}

document.querySelectorAll('.code-tab').forEach(tab => {
    tab.addEventListener('click', () => activateCodeExample(tab.getAttribute('data-tab')));
});

const DEV_STAGES = [
    {key:'profile',number:'01',icon:'sliders',accent:'139,124,255',title:'Read the selected profile',description:'Spectral gathers the instance, account, memory, window and launch preferences before touching the game files.',input:'Selected instance + player profile',output:'One validated GameSettings object',insight:'If the wrong instance opens, check the selection and account before changing Java or mods.'},
    {key:'version',number:'02',icon:'cubes-stacked',accent:'76,168,255',title:'Resolve the game version',description:'Version metadata tells the launcher which libraries, assets and inherited settings this instance actually needs.',input:'Minecraft version + instance files',output:'Resolved libraries, assets and metadata',insight:'A missing file or mismatched loader often shows up here. Reinstall the affected version before rebuilding the whole instance.'},
    {key:'java',number:'03',icon:'mug-hot',accent:'255,184,77',title:'Match a compatible Java runtime',description:'The required Java major version comes from the selected game build. Spectral looks for a runtime that meets it.',input:'Required Java major version',output:'Compatible Java executable',insight:'If Java cannot be found, check the version requirement and select or install a matching runtime.'},
    {key:'command',number:'04',icon:'list-check',accent:'255,111,207',title:'Assemble the launch command',description:'LauncherCore prepares native files, builds the classpath and passes the right game and JVM arguments to the process.',input:'Resolved files + settings + account',output:'Complete Minecraft command',insight:'A missing native or invalid argument should be diagnosed from the exact command stage, not guessed from the game window.'},
    {key:'result',number:'05',icon:'wave-square',accent:'69,214,181',title:'Observe the running process',description:'QProcess streams output and exit state into Console, so a failure remains inspectable after the game closes.',input:'Minecraft JVM process',output:'Logs, exit code and visible errors',insight:'When asking for help, share the final relevant Console lines and the selected Minecraft and Java versions.'}
];
function activateDevStage(key, focus = false) {
    const index = DEV_STAGES.findIndex(stage => stage.key === key);
    if (index < 0) return;
    const stage = DEV_STAGES[index];
    document.querySelectorAll('[data-dev-stage]').forEach(button => {
        const active = button.dataset.devStage === key;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
    });
    const panel = document.getElementById('devStagePanel');
    if (!panel) return;
    panel.setAttribute('aria-labelledby', document.querySelector(`[data-dev-stage="${key}"]`)?.id || '');
    panel.style.setProperty('--stage-rgb', stage.accent);
    const values = {devStageNumber:stage.number, devStageTitle:stage.title, devStageDescription:stage.description, devStageInput:stage.input, devStageOutput:stage.output, devStageInsight:stage.insight, devStageCounter:`${index+1} of ${DEV_STAGES.length}`, devPipelineProgress:`${stage.number} / 05`};
    Object.entries(values).forEach(([id,value]) => { const node=document.getElementById(id); if(node)node.textContent=value; });
    const icon = document.getElementById('devStageIcon');
    if (icon) icon.className = `fas fa-${stage.icon}`;
    revealUpdatedPanel(panel);
    if (focus) document.querySelector(`[data-dev-stage="${key}"]`)?.focus();
}
document.querySelectorAll('[data-dev-stage]').forEach(button => button.addEventListener('click', () => activateDevStage(button.dataset.devStage)));
document.querySelectorAll('[data-dev-stage]').forEach((button,index) => button.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? DEV_STAGES.length-1 : (index + (['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1) + DEV_STAGES.length) % DEV_STAGES.length;
    activateDevStage(DEV_STAGES[next].key, true);
}));
document.getElementById('devStagePrev')?.addEventListener('click', () => {
    const index=DEV_STAGES.findIndex(stage=>document.querySelector(`[data-dev-stage="${stage.key}"]`)?.classList.contains('active'));
    activateDevStage(DEV_STAGES[(index-1+DEV_STAGES.length)%DEV_STAGES.length].key);
});
document.getElementById('devStageNext')?.addEventListener('click', () => {
    const index=DEV_STAGES.findIndex(stage=>document.querySelector(`[data-dev-stage="${stage.key}"]`)?.classList.contains('active'));
    activateDevStage(DEV_STAGES[(index+1)%DEV_STAGES.length].key);
});

const DEV_SYSTEMS = {
    ui: {
        code: '01', accent: '126, 139, 255', icon: 'window-maximize', title: 'Qt 6 Widgets', kind: 'Presentation',
        description: 'The desktop surface for Play, Library, Accounts, Console, settings and dialog flows, with shared styling and RU / EN translation.',
        owns: 'Tabs · dialogs · interaction', connects: 'LauncherCore · managers',
        tags: ['QWidget', 'Signals', 'Qt Linguist'], flow: ['Player action', 'Qt event', 'LauncherCore'],
        tasks: ['Keeps product surfaces visually consistent', 'Translates state into clear player actions', 'Delivers accessible feedback and dialogs']
    },
    core: {
        code: '02', accent: '91, 174, 255', icon: 'code', title: 'Launcher Core', kind: 'Orchestration',
        description: 'Coordinates launch preparation, builds the final Minecraft command and owns the QProcess lifecycle exposed to the interface.',
        owns: 'Arguments · process state', connects: 'UI · Java · version data',
        tags: ['C++17', 'QProcess', 'Signals'], flow: ['GameSettings', 'LauncherCore', 'Minecraft JVM'],
        tasks: ['Builds the classpath and game arguments', 'Prepares native libraries before launch', 'Emits output, state and real failure signals']
    },
    java: {
        code: '03', accent: '240, 180, 77', icon: 'mug-hot', title: 'Java Manager', kind: 'Runtime',
        description: 'Discovers installed Java runtimes and matches them to the major version required by the selected Minecraft metadata.',
        owns: 'Discovery · compatibility', connects: 'Version metadata · LauncherCore',
        tags: ['Java major', 'Runtime scan', 'Fallback'], flow: ['Version JSON', 'JavaManager', 'Java path'],
        tasks: ['Scans available Java installations', 'Selects by required major version', 'Supports an explicit runtime download path']
    },
    content: {
        code: '04', accent: '91, 207, 166', icon: 'box-open', title: 'Versions & Mods', kind: 'Content',
        description: 'Installs Minecraft versions and manages instance content, including Modrinth discovery, version files and one-click mod updates.',
        owns: 'Versions · mods · assets', connects: 'Modrinth · instance library',
        tags: ['Modrinth', 'Version JSON', 'Updates'], flow: ['Catalog', 'Content manager', 'Instance files'],
        tasks: ['Resolves inherited version metadata', 'Keeps every instance isolated', 'Tracks installed content and available updates']
    },
    accounts: {
        code: '05', accent: '222, 113, 174', icon: 'user-shield', title: 'Accounts', kind: 'Identity',
        description: 'Manages local Minecraft profiles, stable offline UUIDs, skin previews and quick account switching for each launch.',
        owns: 'Profiles · UUIDs · skins', connects: 'UI · launch settings',
        tags: ['Offline UUID', 'Skins', 'Profiles'], flow: ['Username', 'Account model', 'Launch identity'],
        tasks: ['Keeps identity stable between sessions', 'Provides the active launch account', 'Separates profile data from instance data']
    },
    diagnostics: {
        code: '06', accent: '73, 205, 213', icon: 'terminal', title: 'Console & Logs', kind: 'Observability',
        description: 'Makes the launch process inspectable with timestamps, severity colors, filters, search, copy, export and crash-focused errors.',
        owns: 'Output · filters · export', connects: 'QProcess · launcher signals',
        tags: ['stdout', 'stderr', 'Export'], flow: ['QProcess', 'Log stream', 'Visible error'],
        tasks: ['Shows stdout and stderr in context', 'Keeps the exact failure reason visible', 'Supports fast search and log sharing']
    }
};

function activateDevSystem(key, focusPanel = false) {
    const system = DEV_SYSTEMS[key];
    if (!system) return;
    document.querySelectorAll('[data-dev-system]').forEach(button => {
        const selected = button.getAttribute('data-dev-system') === key;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-selected', String(selected));
        button.setAttribute('tabindex', selected ? '0' : '-1');
    });
    const icon = document.querySelector('#devSystemIcon i');
    const title = document.getElementById('devSystemTitle');
    const kind = document.getElementById('devSystemKind');
    const description = document.getElementById('devSystemDescription');
    const owns = document.getElementById('devSystemOwns');
    const connects = document.getElementById('devSystemConnects');
    const tasks = document.getElementById('devSystemTasks');
    const tags = document.getElementById('devSystemTags');
    const flowInput = document.getElementById('devSystemFlowInput');
    const flowCore = document.getElementById('devSystemFlowCore');
    const flowOutput = document.getElementById('devSystemFlowOutput');
    if (icon) icon.className = `fas fa-${system.icon}`;
    if (title) title.textContent = system.title;
    if (kind) kind.textContent = system.kind;
    if (description) description.textContent = system.description;
    if (owns) owns.textContent = system.owns;
    if (connects) connects.textContent = system.connects;
    if (tags) {
        tags.replaceChildren(...system.tags.map(text => {
            const tag = document.createElement('span');
            tag.textContent = text;
            return tag;
        }));
    }
    if (flowInput) flowInput.textContent = system.flow[0];
    if (flowCore) flowCore.textContent = system.flow[1];
    if (flowOutput) flowOutput.textContent = system.flow[2];
    if (tasks) {
        tasks.replaceChildren(...system.tasks.map(text => {
            const item = document.createElement('li');
            const tick = document.createElement('i');
            tick.className = 'fas fa-check';
            item.append(tick, document.createTextNode(text));
            return item;
        }));
    }
    const panel = document.querySelector('.dev-system-panel');
    if (panel) {
        panel.dataset.systemCode = system.code;
        const number = document.getElementById('devSystemNumber');
        if (number) number.textContent = system.code;
        document.querySelectorAll('[data-layer-node]').forEach(node => node.classList.toggle('active', node.dataset.layerNode === key));
        const activeTab = document.querySelector(`[data-dev-system="${key}"]`);
        if (activeTab?.id) panel.setAttribute('aria-labelledby', activeTab.id);
        panel.style.setProperty('--system-rgb', system.accent);
        revealUpdatedPanel(panel.querySelector('.dev-system-content'));
        if (focusPanel && window.innerWidth <= 560) panel.scrollIntoView({ behavior: (REDUCED_MOTION || liteOn()) ? 'auto' : 'smooth', block: 'nearest' });
    }
}

document.querySelectorAll('[data-dev-system]').forEach(button => {
    button.addEventListener('click', () => activateDevSystem(button.getAttribute('data-dev-system'), true));
});
document.querySelectorAll('[data-layer-node]').forEach(button => button.addEventListener('click', () => activateDevSystem(button.dataset.layerNode)));

document.querySelectorAll('[data-dev-target]').forEach(button => {
    button.addEventListener('click', () => {
        const target = document.querySelector(`.nav-links-container [data-target="${button.getAttribute('data-dev-target')}"]`);
        if (target) target.click();
    });
});

function scrollBelowNavbar(target, extraGap = 18) {
    if (!target) return;
    const navbar = document.querySelector('.navbar');
    const navbarHeight = navbar ? Math.ceil(navbar.getBoundingClientRect().height) : 0;
    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - navbarHeight - extraGap);
    window.scrollTo({
        top,
        behavior: (liteOn() || REDUCED_MOTION) ? 'auto' : 'smooth'
    });
}
document.querySelectorAll('.dev-document-index a[href^="#dev-"]').forEach(link=>link.addEventListener('click',event=>{
    const id=link.getAttribute('href').slice(1);
    const target=document.getElementById(id);
    if(!target)return;
    event.preventDefault();
    history.pushState(null,'',`#${id}`);
    scrollBelowNavbar(target);
}));

document.querySelectorAll('[data-dev-scroll]').forEach(button => {
    button.addEventListener('click', () => {
        const target = document.getElementById(button.getAttribute('data-dev-scroll'));
        scrollBelowNavbar(target);
    });
});

function enableHorizontalTabKeys(selector) {
    const tabs = [...document.querySelectorAll(selector)];
    tabs.forEach((tab, index) => {
        tab.addEventListener('keydown', event => {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const step = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
            const next = tabs[event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + step + tabs.length) % tabs.length];
            next.focus();
            next.click();
        });
    });
}
enableHorizontalTabKeys('[data-dev-system]');
enableHorizontalTabKeys('.code-tab');

// Code editor appearance: play the reveal on the active pane the first time it scrolls into view.
const codeEditorEl=document.querySelector('.code-editor');
if(codeEditorEl){
    if(liteOn()){
        codeEditorEl.querySelector('.code-pane.active')?.classList.add('code-pane--in');
    }else{
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
}

// ── Lightweight toast ────────────────────────────────────────
function showToast(msg, icon='circle-info'){
    let host=document.getElementById('toastHost');
    if(!host){host=document.createElement('div');host.id='toastHost';host.className='toast-host';host.setAttribute('role','status');host.setAttribute('aria-live','polite');host.setAttribute('aria-atomic','false');document.body.appendChild(host);}
    const t=document.createElement('div');t.className='toast';
    t.innerHTML=`<i class="fas fa-${icon}"></i><span></span>`;
    t.querySelector('span').textContent=msg;
    host.appendChild(t);
    requestAnimationFrame(()=>t.classList.add('show'));
    setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),420);},3800);
}

// ── FAQ accordion — smooth scrollHeight-based ────────────────
document.querySelectorAll('#faqList .faq-q').forEach((q,index) => {
    const answer=q.closest('.faq-item')?.querySelector('.faq-a');
    if(!q.id)q.id=`faqQuestion${index+1}`;
    if(answer){if(!answer.id)answer.id=`faqAnswer${index+1}`;q.setAttribute('aria-controls',answer.id);answer.setAttribute('role','region');answer.setAttribute('aria-labelledby',q.id);}
    q.setAttribute('aria-expanded', String(q.closest('.faq-item')?.classList.contains('open')));
    q.addEventListener('click', () => {
        const item = q.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('#faqList .faq-item').forEach(i => {
            if (i !== item) {
                i.classList.remove('open');
                i.querySelector('.faq-q')?.setAttribute('aria-expanded','false');
            }
        });
        item.classList.toggle('open', !isOpen);
        q.setAttribute('aria-expanded', String(!isOpen));
    });
});
