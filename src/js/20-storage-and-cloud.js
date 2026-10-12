// ══════════════════════════════════════════════════════════════
// STORAGE KEYS
// ══════════════════════════════════════════════════════════════
// Support diagnostic workspace: one symptom drives one focused solution.
const supportFixButtons=[...document.querySelectorAll('[data-support-fix]')];
const supportFixPanels=[...document.querySelectorAll('[data-support-panel]')];
function activateSupportFix(key){
    if(!key)return;
    const briefIssue=document.getElementById('supportBriefIssue');
    const issueForFix={crash:'Game crashes or freezes',loader:'Fabric or Forge fails',performance:'Low FPS or stutter',account:'Account or offline play'};
    if(briefIssue && issueForFix[key]) { briefIssue.value=issueForFix[key]; updateSupportBrief(); }
    supportFixButtons.forEach(button=>{
        const active=button.dataset.supportFix===key;
        button.classList.toggle('active',active);
        button.setAttribute('aria-selected',String(active));
        button.tabIndex=active?0:-1;
    });
    supportFixPanels.forEach(panel=>{
        const active=panel.dataset.supportPanel===key;
        panel.hidden=!active;
        panel.classList.toggle('active',active);
    });
    updateSupportChecklist();
}
function updateSupportChecklist(){
    const panel=supportFixPanels.find(item=>!item.hidden);
    const checks=[...(panel?.querySelectorAll('.support-checklist input')||[])];
    const done=checks.filter(check=>check.checked).length;
    const count=document.getElementById('supportChecklistCount');
    const fill=document.getElementById('supportProgressFill');
    if(count)count.textContent=`${done} / ${checks.length}`;
    if(fill)fill.style.transform=`scaleX(${checks.length?done/checks.length:0})`;
    panel?.classList.toggle('is-complete',done===checks.length&&checks.length>0);
}
supportFixButtons.forEach(button=>{
    button.addEventListener('click',()=>activateSupportFix(button.dataset.supportFix));
    button.addEventListener('keydown',event=>{
        if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
        event.preventDefault();
        const step=['ArrowDown','ArrowRight'].includes(event.key)?1:-1;
        const available=supportFixButtons.filter(item=>!item.classList.contains('is-filtered-out'));
        const current=available.indexOf(button);
        const next=available[(current+step+available.length)%available.length];
        if(next){activateSupportFix(next.dataset.supportFix);next.focus();}
    });
});
if(supportFixButtons.length)activateSupportFix(supportFixButtons.find(button=>button.classList.contains('active'))?.dataset.supportFix||supportFixButtons[0].dataset.supportFix);
document.querySelectorAll('.support-checklist input').forEach(check=>check.addEventListener('change',updateSupportChecklist));
document.querySelectorAll('.support-reset-checks').forEach(button=>button.addEventListener('click',()=>{
    button.closest('[data-support-panel]')?.querySelectorAll('.support-checklist input').forEach(check=>{check.checked=false;});
    updateSupportChecklist();
}));
document.querySelectorAll('[data-support-jump]').forEach(button=>button.addEventListener('click',()=>scrollBelowNavbar(document.getElementById(button.dataset.supportJump))));

const supportSearchInput=document.getElementById('supportSearchInput');
const supportSearchStatus=document.getElementById('supportSearchStatus');
const supportActionButtons=[...document.querySelectorAll('.support-fix-actions [data-support-question]')];
const supportTopicButtons=[...document.querySelectorAll('.support-topic-strip [data-support-topic]')];
let activeSupportTopic='all';
function filterSupportKnowledge(){
    const query=(supportSearchInput?.value||'').trim().toLowerCase();
    const faqItems=[...document.querySelectorAll('#faqList .faq-item')];
    let faqMatches=0;
    faqItems.forEach(item=>{
        const match=(!query||item.textContent.toLowerCase().includes(query))&&(activeSupportTopic==='all'||item.dataset.supportTopic===activeSupportTopic);
        item.classList.toggle('is-filtered-out',!match);
        if(match)faqMatches++;
    });
    supportActionButtons.forEach(button=>{
        const match=!query||button.textContent.toLowerCase().includes(query);
        button.classList.toggle('is-filtered-out',!match);
    });
    supportFixButtons.forEach(button=>{
        const panel=document.querySelector(`[data-support-panel="${button.dataset.supportFix}"]`);
        const match=!query||`${button.textContent} ${panel?.textContent||''}`.toLowerCase().includes(query);
        button.classList.toggle('is-filtered-out',!match);
    });
    const visibleFix=supportFixButtons.find(button=>!button.classList.contains('is-filtered-out'));
    const activeFix=supportFixButtons.find(button=>button.classList.contains('active'));
    const faqVisibleCount=document.getElementById('faqVisibleCount');
    const supportNoResults=document.getElementById('supportNoResults');
    const faqList=document.getElementById('faqList');
    if(faqVisibleCount)faqVisibleCount.textContent=`${faqMatches} ${faqMatches===1?'guide':'guides'}`;
    if(supportNoResults)supportNoResults.hidden=faqMatches>0;
    faqList?.classList.toggle('is-empty',faqMatches===0);
    document.querySelector('.support-diagnostic-workspace')?.classList.toggle('no-diagnostic-match',!visibleFix);
    if(visibleFix&&activeFix?.classList.contains('is-filtered-out'))activateSupportFix(visibleFix.dataset.supportFix);
    if(supportSearchStatus){
        supportSearchStatus.textContent=query
            ? `${faqMatches} ${faqMatches===1?'guide':'guides'} found${activeSupportTopic==='all'?'':` in ${activeSupportTopic}`}`
            : `${faqMatches} ${faqMatches===1?'guide':'guides'}${activeSupportTopic==='all'?` and ${supportActionButtons.length+supportFixButtons.length} guided checks`:` in ${activeSupportTopic}`}`;
    }
}
supportSearchInput?.addEventListener('input',filterSupportKnowledge);
supportTopicButtons.forEach(button=>button.addEventListener('click',()=>{
    activeSupportTopic=button.dataset.supportTopic;
    supportTopicButtons.forEach(item=>{
        const active=item===button;
        item.classList.toggle('active',active);
        item.setAttribute('aria-pressed',String(active));
    });
    filterSupportKnowledge();
}));
document.addEventListener('keydown',event=>{
    if(event.key!=='/'||event.ctrlKey||event.metaKey||event.altKey)return;
    const target=event.target;
    if(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target?.isContentEditable)return;
    const supportTab=document.getElementById('support');
    if(!supportTab?.classList.contains('active-tab'))return;
    event.preventDefault();supportSearchInput?.focus();
});
document.querySelectorAll('[data-support-question]').forEach(button=>button.addEventListener('click',()=>{
    const query=(button.dataset.supportQuestion||'').toLowerCase();
    if(supportSearchInput){supportSearchInput.value='';filterSupportKnowledge();}
    const item=[...document.querySelectorAll('#faqList .faq-item')].find(entry=>entry.textContent.toLowerCase().includes(query));
    if(!item){showToast('Open the Console guide for the full diagnostic path','circle-info');return;}
    if(!item.classList.contains('open'))item.querySelector('.faq-q')?.click();
    const scrollTarget=window.innerWidth>=900?item.closest('.support-knowledge-studio'):item;
    requestAnimationFrame(()=>scrollBelowNavbar(scrollTarget));
}));
document.querySelectorAll('[data-support-guide]').forEach(button=>button.addEventListener('click',()=>{
    const item=document.querySelector(`#faqList [data-support-id="${button.dataset.supportGuide}"]`);
    if(!item)return;
    if(supportSearchInput)supportSearchInput.value='';
    activeSupportTopic='all';
    supportTopicButtons.forEach(topic=>{
        const active=topic.dataset.supportTopic==='all';
        topic.classList.toggle('active',active);
        topic.setAttribute('aria-pressed',String(active));
    });
    filterSupportKnowledge();
    if(!item.classList.contains('open'))item.querySelector('.faq-q')?.click();
    requestAnimationFrame(()=>scrollBelowNavbar(item));
}));

// The support note stays local until the visitor explicitly copies it.
const supportBriefForm=document.getElementById('supportBriefForm');
function buildSupportBrief(){
    const value=id=>document.getElementById(id)?.value.trim()||'';
    return [
        'Spectral support note',
        `Issue: ${value('supportBriefIssue')}`,
        `Minecraft version: ${value('supportBriefVersion')||'Not provided'}`,
        `Java version: ${value('supportBriefJava')||'Not provided'}`,
        `Error or observation: ${value('supportBriefError')||'Not provided'}`
    ].join('\n');
}
function updateSupportBrief(){
    const preview=document.getElementById('supportBriefPreview');
    if(preview)preview.textContent=buildSupportBrief();
    const status=document.getElementById('supportBriefStatus');
    if(status)status.textContent='';
}
supportBriefForm?.addEventListener('input',updateSupportBrief);
supportBriefForm?.addEventListener('change',updateSupportBrief);
supportBriefForm?.addEventListener('reset',()=>requestAnimationFrame(updateSupportBrief));
document.getElementById('supportBriefCopy')?.addEventListener('click',async()=>{
    const status=document.getElementById('supportBriefStatus');
    try {
        await navigator.clipboard.writeText(buildSupportBrief());
        if(status)status.textContent='Copied. Review it before sharing.';
    } catch {
        if(status)status.textContent='Copy unavailable here. Select the preview text instead.';
        window.getSelection()?.selectAllChildren(document.getElementById('supportBriefPreview'));
    }
});
updateSupportBrief();

const K_USERS   = 'spectral_site_users';
const K_SESSION = 'spectral_site_session';
const K_MC_PFX  = 'spectral_launcher_';
const K_MC_ACT  = 'spectral_mc_active_';
const K_FORUM   = 'spectral_forum';
const K_NEWS    = 'spectral_news';
const K_FRIENDS = 'spectral_friends';
const K_ROLE_ORDERS = 'spectral_role_orders';
const K_PROFILE_STYLES = 'spectral_profile_styles';
const K_DEV_ROLE_PREVIEWS = 'spectral_dev_role_previews';

// CSP-compatible image fallback handling for static and dynamically rendered
// images. Inline event-handler attributes are intentionally not used.
document.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    if (image.hasAttribute('data-hide-on-error')) {
        image.hidden = true;
        const fallbackIcon = image.nextElementSibling;
        if (fallbackIcon instanceof HTMLElement) fallbackIcon.style.display = 'flex';
        return;
    }
    if (image.hasAttribute('data-avatar-fallback') && image.dataset.fallbackApplied !== 'true') {
        image.dataset.fallbackApplied = 'true';
        image.src = 'assets/avatar-placeholder.svg';
    }
}, true);

// ── Optional Supabase authentication + owner-scoped sync ─────
// The project URL and publishable key identify the browser client. Table access
// must be protected by the RLS policies in supabase/security_hardening.sql.
const SUPABASE_URL = document.querySelector('meta[name="spectral-supabase-url"]')?.content.trim() || '';
const SUPABASE_PUBLIC_KEY = document.querySelector('meta[name="spectral-supabase-publishable-key"]')?.content.trim()
    || document.querySelector('meta[name="spectral-supabase-anon-key"]')?.content.trim() || '';
const SUPABASE_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.0/dist/umd/supabase.min.js';
const SUPABASE_SCRIPT_INTEGRITY = 'sha384-De+l/Df7qym5QBDVocD3+gW1S7IjR3epf+6KbRDjB3FCCzM/LqVTwqckT6FhFar8';
let cloud = null;
let cloudAuthUserId = null;

function validSupabaseConfig() {
    if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) return false;
    try {
        const url = new URL(SUPABASE_URL);
        return url.protocol === 'https:'
            && /^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname)
            && (/^sb_publishable_[A-Za-z0-9_-]+$/.test(SUPABASE_PUBLIC_KEY)
                || /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(SUPABASE_PUBLIC_KEY));
    } catch {
        return false;
    }
}

async function loadSupabaseLibrary() {
    if (window.supabase?.createClient) return;
    await new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${SUPABASE_SCRIPT_URL}"]`);
        if (existing) {
            existing.addEventListener('load', resolve, { once:true });
            existing.addEventListener('error', () => reject(new Error('Authentication library unavailable')), { once:true });
            return;
        }
        const script = document.createElement('script');
        script.src = SUPABASE_SCRIPT_URL;
        script.integrity = SUPABASE_SCRIPT_INTEGRITY;
        script.crossOrigin = 'anonymous';
        script.referrerPolicy = 'no-referrer';
        script.addEventListener('load', resolve, { once:true });
        script.addEventListener('error', () => reject(new Error('Authentication library unavailable')), { once:true });
        document.head.appendChild(script);
    });
}

async function initCloudClient() {
    if (cloud) return cloud;
    if (!validSupabaseConfig()) return null;
    try {
        await loadSupabaseLibrary();
        cloud = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
            auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
        });
        return cloud;
    } catch (error) {
        console.warn('[auth] Optional cloud connection is unavailable; local data remains available.');
        return null;
    }
}
// While true, local writes are NOT pushed back to the cloud (used during the
// initial load so freshly-downloaded data is not echoed straight back up).
let cloudSyncing = false;
let cloudRetryAfter = 0;
let cloudNetworkWarningShown = false;
function cloudReady() {
    return Boolean(cloud && cloudAuthUserId && !cloudSyncing && navigator.onLine !== false && Date.now() >= cloudRetryAfter);
}
function handleCloudError(area, error) {
    const message = error?.message || String(error || 'Unknown cloud error');
    if (/failed to fetch|network|load failed/i.test(message)) {
        cloudRetryAfter = Date.now() + 5 * 60 * 1000;
        if (!cloudNetworkWarningShown) {
            cloudNetworkWarningShown = true;
            console.warn('[cloud] offline — local data remains available; sync will retry later.');
        }
        return;
    }
    console.warn(`[cloud] ${area}:`, message);
}
window.addEventListener('online', () => {
    cloudRetryAfter = 0;
    cloudNetworkWarningShown = false;
});

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

function safeIdentifier(value, fallback = '') {
    const normalized = String(value == null ? '' : value).trim();
    return /^[A-Za-z0-9_-]{1,64}$/.test(normalized) ? normalized : fallback;
}

const AVATAR_DATA_RE = /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/i;
function safeAvatarUrl(value, fallback = '') {
    const candidate = String(value == null ? '' : value).trim();
    if (!candidate) return fallback;
    if (candidate.length <= 1_500_000 && AVATAR_DATA_RE.test(candidate)) return candidate;
    try {
        const url = new URL(candidate);
        const allowedHost = url.hostname === 'minotar.net'
            || url.hostname === 'lh3.googleusercontent.com'
            || url.hostname.endsWith('.googleusercontent.com');
        if (url.protocol === 'https:' && !url.username && !url.password && allowedHost) return url.href;
    } catch {}
    return fallback;
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
