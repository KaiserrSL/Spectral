// ══════════════════════════════════════════════════════════════
// SITE ACCOUNT DASHBOARD MODAL
// ══════════════════════════════════════════════════════════════
const dashOverlay  = document.getElementById('dashboardOverlay');
const authView     = document.getElementById('authView');
const registerView = document.getElementById('registerView');
const profileView  = document.getElementById('profileView');
const recoveryView = document.getElementById('recoveryView');
const dashboardViews = [authView, registerView, profileView, recoveryView].filter(Boolean);
let dashboardOpenFrame = 0;

function showDashboardView(activeView) {
    dashboardViews.forEach(view => {
        const active = view === activeView;
        view.hidden = !active;
        view.style.removeProperty('display');
        view.setAttribute('aria-hidden', String(!active));
    });
}

function revealDashboard() {
    if (!dashOverlay || dashOverlay.classList.contains('open') || dashboardOpenFrame) return;
    document.body.style.overflow = 'hidden';
    dashboardOpenFrame = requestAnimationFrame(() => {
        dashboardOpenFrame = 0;
        dashOverlay.classList.add('open');
    });
}

function setProfileModalWide(wide) {
    const modal = dashOverlay && dashOverlay.querySelector('.dashboard-modal');
    if (modal) modal.classList.toggle('profile-wide', !!wide);
}

function openDashboard() {
    if (!dashOverlay) return;
    if (currentUserId) showProfileView();
    else showAuthView();
    revealDashboard();
}
function closeDashboard() {
    if (!dashOverlay) return;
    if (dashboardOpenFrame) {
        cancelAnimationFrame(dashboardOpenFrame);
        dashboardOpenFrame = 0;
    }
    dashOverlay.classList.remove('open');
    syncBodyScrollLock();
    const modal = dashOverlay.querySelector('.dashboard-modal');
    if (modal) modal.classList.remove('profile-replay', 'profile-opening', 'dashboard-morphing');
    const studio=document.getElementById('profileIdentityStudio');
    if(studio){
        studio.classList.remove('open');
        studio.hidden=true;
    }
}
function showAuthView() { setProfileModalWide(false); showDashboardView(authView); }
function showRegisterView() { setProfileModalWide(false); showDashboardView(registerView); }
function showRecoveryView() { setProfileModalWide(false); showDashboardView(recoveryView); revealDashboard(); }
function showProfileView() {
    const user = siteUsers.find(u=>u.id===currentUserId);
    if (!user) return;
    setProfileModalWide(true);
    showDashboardView(profileView);
    const canAdmin = canAccessAdmin(user);
    const adminTab = document.getElementById('adminPanelTab');
    if (adminTab) {
        adminTab.hidden = !canAdmin;
        adminTab.style.removeProperty('display');
    }
    loadProfileViewData(user, { resetTab: false });
    activateProfileTabV2('my-profile');
    const modal = dashOverlay.querySelector('.dashboard-modal');
    if (modal) modal.scrollTop = 0;
    triggerProfileMenuEntrance(user, false);
}

document.getElementById('openDashboardBtn').addEventListener('click', openDashboard);
const closeDashBtn = document.getElementById('closeDashboardBtn');
if (closeDashBtn) closeDashBtn.addEventListener('click', closeDashboard);
if (dashOverlay) dashOverlay.addEventListener('click', e=>{ if(e.target===dashOverlay)closeDashboard(); });

document.getElementById('switchToRegisterBtn')&&document.getElementById('switchToRegisterBtn').addEventListener('click',showRegisterView);
document.getElementById('switchToLoginBtn')&&document.getElementById('switchToLoginBtn').addEventListener('click',showAuthView);

// ══════════════════════════════════════════════════════════════
// SUPABASE AUTH  (nickname, email, Google and password recovery)
// Layered on top of the local system: when the Supabase client is
// available, these provide real authentication; otherwise everything
// falls back to the legacy username/password records on this device.
// ══════════════════════════════════════════════════════════════
const authAvailable = () => !!(cloud && cloud.auth);
const isFileProtocol = location.protocol === 'file:'; // OAuth/email links need http(s)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function updateAuthModeUi(){
    const connected=authAvailable();
    const configured=validSupabaseConfig();
    const note=document.getElementById('authModeNote');
    if(note){
        note.classList.toggle('is-cloud',connected);
        const icon=note.querySelector('i');if(icon)icon.className=connected?'fas fa-shield-halved':'fas fa-hard-drive';
        const text=note.querySelector('span');if(text)text.textContent=connected
            ? 'Authenticated mode: remote data is limited to your account by Row Level Security.'
            : configured?'Connection unavailable. Reconnect to sign in to your cloud account.':'Local demo mode: account data stays in this browser. Do not reuse a password from another service.';
    }
    const email=document.getElementById('regEmail');if(email){email.required=false;email.placeholder=' ';}
    const emailLabel=document.querySelector('label[for="regEmail"]');if(emailLabel)emailLabel.textContent=configured?'Email address (optional)':'Email saved only on this device (optional)';
    const emailHint=document.getElementById('regEmailHintText');if(emailHint)emailHint.textContent=configured?'Leave this blank to create an account with only a username and password. Without email, password recovery is unavailable.':'Without configured cloud authentication, this creates a device-local demo account only.';
    const loginLabel=document.querySelector('label[for="loginInput"]');if(loginLabel)loginLabel.textContent='Email or username';
    const providerHint=document.getElementById('authProviderHint');if(providerHint)providerHint.hidden=!configured;
    ['googleLoginBtn','googleRegisterBtn','forgotPasswordBtn'].forEach(id=>{const button=document.getElementById(id);if(button)button.hidden=!configured;});
}
updateAuthModeUi();
function todayStr(){ const d=new Date(); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`; }
function authMsg(id,msg){ const el=document.getElementById(id); if(el){ el.textContent=msg; el.style.display='block'; } }
function clearAuthMsgs(){ ['loginError','loginNote','registerError','registerNote','recoveryError','recoveryNote'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';}); }
function authRedirectTo(){ return location.origin + location.pathname; }
async function usernameAuth(action, username, password){
    const response=await fetch(`${SUPABASE_URL}/functions/v1/username-auth`,{
        method:'POST',
        headers:{'Content-Type':'application/json',apikey:SUPABASE_PUBLIC_KEY},
        body:JSON.stringify({action,username,password})
    });
    let result={};
    try{result=await response.json();}catch{}
    if(!response.ok)throw new Error(result.error||'Account service unavailable. Try again.');
    if(!result.access_token||!result.refresh_token)throw new Error('Account service returned an incomplete session.');
    const {data,error}=await cloud.auth.setSession({access_token:result.access_token,refresh_token:result.refresh_token});
    if(error||!data?.user)throw new Error('Sign-in could not be completed. Try again.');
    await restoreVerifiedAccount(data.user);
}

// Find-or-create the local/cloud profile row for a Supabase Auth user.
let freshAuthProfileId = null;
function ensureProfileFor(authUser){
    let u = siteUsers.find(x=>x.id===authUser.id);
    if(!u){
        const meta = authUser.user_metadata || {};
        const uname = sanitizeField(meta.username || meta.full_name || (authUser.email||'player').split('@')[0], 20) || 'player';
        u = { id:authUser.id, username:uname, email:/@users\.spectral\.invalid$/i.test(authUser.email||'')?'':sanitizeField(authUser.email,254), password:'', role:'USER',
              displayName: sanitizeField(meta.full_name||uname,24)||uname, bio:'Minecraft player',
              avatar: safeAvatarUrl(meta.avatar_url||meta.picture), registeredAt:todayStr(),
              totalTimeSec:0, visitCount:0, lastSeen:new Date().toISOString(), banned:false,
              status:'', mcTimeSec:0 };
        siteUsers.push(u); saveSiteUsers(siteUsers);
        saveMcAccounts(u.id,[]); saveActiveMc(u.id,'');
        freshAuthProfileId = u.id;
    } else if(authUser.email && !/@users\.spectral\.invalid$/i.test(authUser.email) && u.email!==authUser.email){
        u.email = authUser.email; saveSiteUsers(siteUsers);
    }
    return u;
}
// Apply a verified Supabase session to the app.
function applyAuthUser(authUser){
    if(!authUser) return false;
    const profile = ensureProfileFor(authUser);
    if(profile.banned){ if(authAvailable())cloud.auth.signOut().catch(error=>console.warn('[auth] sign out failed:',error.message||error)); authMsg('loginError','This account has been banned'); return false; }
    currentUserId = profile.id; saveSession(profile.id);
    clearAuthMsgs(); beginUserSession(); renderAll();
    if(dashOverlay && dashOverlay.classList.contains('open')) showProfileView();
    if(freshAuthProfileId === profile.id) {
        freshAuthProfileId = null;
        showRegistrationWelcome(profile);
    }
    return true;
}
let authGeneration=0;
let authRestorePromise=null;
function clearAccountSession(){
    authGeneration++;stopTimeTracking();_visitBumpedFor=null;
    profileDrafts.clear();cloudAuthUserId=null;currentUserId=null;saveSession(null);
    if(validSupabaseConfig())loadCommunityCloud();
    closeRoleCheckout();adminSelectedUserIds.clear();cancelAdminAction();
    renderAll();if(dashOverlay?.classList.contains('open'))showAuthView();
}
async function signOutAccount(){
    const button=document.getElementById('logoutBtn');if(button.disabled)return;button.disabled=true;
    const remote=currentUserId===cloudAuthUserId&&authAvailable();
    try{
        if(remote){const {error}=await cloud.auth.signOut();if(error)throw error;}
        clearAccountSession();showAuthView();showToast('Signed out.','right-from-bracket');
    }catch{showToast('Sign-out failed. Check your connection and try again.','triangle-exclamation');}
    finally{button.disabled=false;}
}
async function restoreVerifiedAccount(authUser){
    if(authRestorePromise)return authRestorePromise;
    const generation=authGeneration;
    authRestorePromise=(async()=>{
        cloudAuthUserId=authUser.id;
        const synced=await cloudBootstrap(authUser);
        if(generation!==authGeneration)return false;
        if(!synced){cloudAuthUserId=null;throw new Error('Account data could not be verified. Please retry.');}
        await loadCommunityCloud();
        return applyAuthUser(authUser);
    })();
    try{return await authRestorePromise;}finally{authRestorePromise=null;}
}
async function initSupabaseAuth(){
    await initCloudClient();updateAuthModeUi();if(!authAvailable())return;
    cloud.auth.onAuthStateChange((event,session)=>{
        if(event==='SIGNED_OUT'){clearAccountSession();return;}
        // Defer auth API work until outside the Supabase callback/lock.
        if(event==='PASSWORD_RECOVERY'){cloudAuthUserId=session?.user?.id||null;showRecoveryView();return;}
        if(event==='SIGNED_IN'&&session?.user)setTimeout(()=>{
            if(currentUserId===session.user.id)return;
            restoreVerifiedAccount(session.user).catch(error=>authMsg('loginError',error.message));
        },0);
    });
    try{const {data,error}=await cloud.auth.getSession();if(error)throw error;if(data?.session?.user)await restoreVerifiedAccount(data.session.user);else await loadCommunityCloud();}catch(error){authMsg('loginError',error.message||'Session could not be restored.');}
    if(/type=recovery/.test(location.hash))showRecoveryView();
}

// ── Login ─────────────────────────────────────────────────────
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const login = document.getElementById('loginInput').value.trim();
        const pass  = document.getElementById('passwordInput').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        clearAuthMsgs();
        const fail  = msg => authMsg('loginError', msg||'Invalid email/username or password');

        if(submitBtn?.disabled)return;
        if(submitBtn)submitBtn.disabled=true;
        try {
            if(validSupabaseConfig()&&!authAvailable()){fail('Connection unavailable. Please reconnect.');return;}
            if (authAvailable()) {
                if(EMAIL_RE.test(login)){
                    const { data, error } = await cloud.auth.signInWithPassword({ email:login, password:pass });
                    if(error){fail();return;}
                    await restoreVerifiedAccount(data.user);
                }else{
                    await usernameAuth('login',login,pass);
                }
                return;
            }
            // Legacy local path (username or email stored in our table)
            const normalizedLogin=login.toLowerCase();
            const user = siteUsers.find(u=>u.username.toLowerCase()===normalizedLogin || (u.email&&u.email.toLowerCase()===normalizedLogin));
            let ok = false;
            if (user && user.password) {
                if (looksHashed(user.password)) ok = (await hashPassword(pass)) === user.password;
                else { ok = (user.password === pass); if (ok){ user.password = await hashPassword(pass); saveSiteUsers(siteUsers); } }
            }
            if (!ok) { fail(); return; }
            if (user.banned) { fail('This account has been banned'); return; }
            currentUserId=user.id; saveSession(user.id);
            beginUserSession(); renderAll(); showProfileView();
        } catch (error) {
            console.warn('[auth] sign in failed:', error.message||error);
            const message=error?.message==='Incorrect username or password. If you used Google, choose Google sign-in.'
                ? error.message:'Sign-in is temporarily unavailable. Please try again.';
            fail(message);
        } finally {
            if(submitBtn)submitBtn.disabled=false;
        }
    });
}

// ── Register ──────────────────────────────────────────────────
const registerForm = document.getElementById('registerForm');
if(registerForm){
    registerForm.addEventListener('submit',async event=>{
        event.preventDefault();const button=registerForm.querySelector('button[type="submit"]');if(button.disabled)return;
        clearAuthMsgs();const showErr=message=>authMsg('registerError',message);
        const username=sanitizeField(document.getElementById('regUsername').value,20);
        const email=document.getElementById('regEmail').value.trim();
        const pass=document.getElementById('regPassword').value,confirm=document.getElementById('regPasswordConfirm').value;
        const minLen=10;
        if(username.length<3||! /^[A-Za-z0-9 _.\-]+$/.test(username))return showErr('Use 3–20 letters, numbers, spaces or _ . - for your username.');
        if(email&&!EMAIL_RE.test(email))return showErr('Enter a valid email address or leave the field empty.');
        if(pass.length<minLen||pass.length>128)return showErr('Use a password with 10–128 characters.');
        if(pass!==confirm)return showErr('Passwords do not match.');
        if(validSupabaseConfig()&&!authAvailable())return showErr('Connection unavailable. Reconnect to create your account.');
        if(!validSupabaseConfig()&&siteUsers.some(user=>user.username.toLowerCase()===username.toLowerCase()||(email&&user.email?.toLowerCase()===email.toLowerCase())))return showErr('This username or email is already used on this device.');
        button.disabled=true;
        try{
            if(validSupabaseConfig()&&!email){
                await usernameAuth('register',username,pass);
                registerForm.reset();
            }else if(validSupabaseConfig()){
                const {data,error}=await cloud.auth.signUp({email,password:pass,options:{data:{username},emailRedirectTo:authRedirectTo()}});
                if(error)throw new Error('Account could not be created. Check your details and try again.');
                registerForm.reset();
                if(data.session&&data.user)await restoreVerifiedAccount(data.user);
                else authMsg('registerNote','Check your inbox to confirm your email, then sign in.');
            }else{
                const user={id:'su_'+crypto.randomUUID().replace(/-/g,''),username,email,password:await hashPassword(pass),role:roleForRegistration(),roleSource:'registration',displayName:username,bio:'',avatar:'',registeredAt:todayStr(),totalTimeSec:0,visitCount:0,lastSeen:new Date().toISOString(),banned:false,status:'',mcTimeSec:0};
                if(!saveSiteUsers([...siteUsers,user]))throw new Error('This browser cannot save your account. Free some storage and try again.');
                siteUsers.push(user);saveMcAccounts(user.id,[]);currentUserId=user.id;saveSession(user.id);beginUserSession();registerForm.reset();renderAll();showProfileView();showRegistrationWelcome(user);
            }
        }catch(error){showErr(error.message||'Account could not be created. Try again.');}
        finally{button.disabled=false;}
    });
}

// ── Google sign-in (login + register buttons) ─────────────────
async function startGoogleSignIn(){
    clearAuthMsgs();
    if(isFileProtocol){ authMsg('loginError','Google sign-in needs the site served over http(s) — use a local server or GitHub Pages, not a file:// page.'); return; }
    if(!authAvailable()){ authMsg('loginError','Google sign-in is unavailable (Supabase not connected).'); return; }
    try {
        const { error } = await cloud.auth.signInWithOAuth({
            provider:'google',
            options:{ redirectTo: authRedirectTo(), queryParams:{ prompt:'select_account' } }
        });
        if(error) authMsg('loginError', error.message);
    } catch (error) {
        console.warn('[auth] Google sign in failed:', error.message||error);
        authMsg('loginError','Google sign-in is temporarily unavailable. Please try again.');
    }
}
['googleLoginBtn','googleRegisterBtn'].forEach(id=>{ const b=document.getElementById(id); if(b)b.addEventListener('click',startGoogleSignIn); });

// ── Forgot password ───────────────────────────────────────────
const forgotBtn = document.getElementById('forgotPasswordBtn');
if(forgotBtn){
    forgotBtn.addEventListener('click', async ()=>{
        clearAuthMsgs();
        const email=(document.getElementById('loginInput').value||'').trim();
        if(!EMAIL_RE.test(email)){ authMsg('loginError','Password recovery needs a real email. For a username-only account, keep your password safe; Google accounts should use Google sign-in.'); document.getElementById('loginInput').focus(); return; }
        if(isFileProtocol){ authMsg('loginError','Password recovery needs the site served over http(s), not a file:// page.'); return; }
        if(!authAvailable()){ authMsg('loginError','Password recovery is unavailable (Supabase not connected).'); return; }
        try {
            const { error } = await cloud.auth.resetPasswordForEmail(email, { redirectTo: authRedirectTo() });
            if(error) console.warn('[auth] recovery request was not accepted:', error.message||error);
            authMsg('loginNote','If an account exists for that email, a recovery link will arrive shortly.');
        } catch (error) {
            console.warn('[auth] password recovery failed:', error.message||error);
            authMsg('loginNote','If an account exists for that email, a recovery link will arrive shortly.');
        }
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
        if(!p1||p1.length<10||p1.length>128) return authMsg('recoveryError','Password must be at least 10 characters');
        if(p1!==p2) return authMsg('recoveryError','Passwords do not match');
        if(!authAvailable()) return authMsg('recoveryError','Recovery is unavailable (Supabase not connected).');
        try {
            const { error } = await cloud.auth.updateUser({ password:p1 });
            if(error) return authMsg('recoveryError', error.message);
            recoveryForm.reset();
            authMsg('recoveryNote','Password updated! Signing you in…');
            const { data } = await cloud.auth.getSession();
            if(data?.session?.user)await restoreVerifiedAccount(data.session.user);
        } catch (error) {
            console.warn('[auth] password update failed:', error.message||error);
            authMsg('recoveryError','Password update is temporarily unavailable. Please try again.');
        }
    });
}
