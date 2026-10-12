// ── Profile tabs ──────────────────────────────────────────────
// Expand the dashboard window when the Admin panel is open (more room for data),
// collapse back to the compact width for the regular profile view.
function setDashboardWide(mode) {
    const modal = dashOverlay && dashOverlay.querySelector('.dashboard-modal');
    if (!modal) return;
    const adminMode = mode === 'admin' || mode === true;
    const storeMode = mode === 'store';
    const unchanged = modal.classList.contains('admin-wide') === adminMode && modal.classList.contains('store-wide') === storeMode;
    if (unchanged) return;
    modal.classList.remove('workspace-morphing');
    modal.classList.toggle('admin-wide', adminMode);
    modal.classList.toggle('store-wide', storeMode);
    if (!REDUCED_MOTION && !liteOn()) {
        requestAnimationFrame(() => {
            modal.classList.add('workspace-morphing');
            window.setTimeout(() => modal.classList.remove('workspace-morphing'), 640);
        });
    }
}

const profileTabsRoot = document.getElementById('profileTabs');
const profileTabButtons = profileTabsRoot ? [...profileTabsRoot.querySelectorAll('.profile-tab')] : [];
const profileTabPanels = profileView ? [...profileView.querySelectorAll(':scope > .ptab-content')] : [];
const profilePanelAnimationCleanup = new WeakMap();

function syncProfileTabIndicator(activeTab) {
    if (!profileTabsRoot) return;
    const tabs = profileTabButtons.filter(tab=>!tab.hidden && getComputedStyle(tab).display !== 'none');
    const selected = activeTab || tabs.find(tab=>tab.classList.contains('active'));
    const index = Math.max(0, tabs.indexOf(selected));
    profileTabsRoot.style.setProperty('--tab-count', String(Math.max(1, tabs.length)));
    profileTabsRoot.style.setProperty('--tab-index', String(index));
    profileTabsRoot.style.setProperty('--tab-offset', `${index * 100}%`);
}

function stopProfilePanelAnimation(panel) {
    const cleanup = profilePanelAnimationCleanup.get(panel);
    if (cleanup) cleanup();
}

function playProfilePanelEntrance(panel) {
    if (!panel || REDUCED_MOTION || liteOn()) return;
    stopProfilePanelAnimation(panel);
    panel.classList.remove('ptab-enter');
    const onEnd = event => {
        if (event.target !== panel) return;
        panel.removeEventListener('animationend', onEnd);
        panel.classList.remove('ptab-enter');
        profilePanelAnimationCleanup.delete(panel);
    };
    const cleanup = () => {
        panel.removeEventListener('animationend', onEnd);
        panel.classList.remove('ptab-enter');
        profilePanelAnimationCleanup.delete(panel);
    };
    profilePanelAnimationCleanup.set(panel, cleanup);
    requestAnimationFrame(() => {
        if (panel.hidden) return cleanup();
        panel.addEventListener('animationend', onEnd);
        panel.classList.add('ptab-enter');
    });
}

function activateProfileTab(target, { animate = true, refresh = true } = {}) {
    if(target==='admin-panel'&&!canAccessAdmin(currentRoleUser()))return;
    const selectedTab = profileTabButtons.find(tab => tab.dataset.ptab === target && !tab.hidden);
    if (!selectedTab) return;
    const currentTab = profileTabButtons.find(tab => tab.classList.contains('active'));
    const isSameTab = currentTab === selectedTab;

    profileTabButtons.forEach(tab => {
        const active = tab === selectedTab;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.setAttribute('tabindex', active ? '0' : '-1');
    });

    profileTabPanels.forEach(panel => {
        const active = panel.dataset.ptabContent === target;
        if (!active) stopProfilePanelAnimation(panel);
        panel.hidden = !active;
        panel.style.removeProperty('display');
        panel.classList.toggle('active', active);
        panel.setAttribute('aria-hidden', String(!active));
        if (active && animate && !isSameTab) playProfilePanelEntrance(panel);
    });

    const mode = target === 'admin-panel' ? 'admin' : target === 'role-store' ? 'store' : false;
    const modal = dashOverlay?.querySelector('.dashboard-modal');
    if (modal) modal.dataset.workspace = target;
    setDashboardWide(mode);
    syncProfileTabIndicator(selectedTab);

    if (!refresh || isSameTab) return;
    if (target === 'admin-panel') renderAdminPanel();
    if (target === 'role-store') renderRoleStore();
    if (target === 'my-profile') {
        const user = currentRoleUser();
        if (user) loadProfileViewData(user, { resetTab: false });
    }
}

const PROFILE_HEADERS = {
    nebula:   { label:'Nebula Drift',      tier:'Core collection',      unlock:'USER',      icon:'fas fa-cloud-moon', description:'Indigo starlight with quiet drifting orbits.' },
    archive:  { label:'Veteran Archive',   tier:'Founder collection',   unlock:'VETERAN',   icon:'fas fa-shield-halved', description:'Layered jade contours and a soft founder glow.' },
    solar:    { label:'Solar Flux',         tier:'Pro collection',       unlock:'PRO',       icon:'fas fa-sun', description:'Warm horizon light across a deep dusk field.' },
    crown:    { label:'Violet Crown',       tier:'Legend collection',    unlock:'LEGEND',    icon:'fas fa-crown', description:'Violet depth with fine refracted light.' },
    prism:    { label:'Spectral Prism',     tier:'Signature identity',   unlock:'SPECTRAL',  icon:'fas fa-gem', description:'Cyan, violet and rose light crossing in fine planes.' },
    guardian: { label:'Guardian Grid',      tier:'Staff collection',     unlock:'MODERATOR', icon:'fas fa-gavel', description:'Cool blue signal lines with a steady glow.' },
    command:  { label:'Command Core',       tier:'Admin collection',     unlock:'ADMIN',     icon:'fas fa-user-shield', description:'Rose red scanlines over a dark command field.' },
    code:     { label:'Developer Protocol', tier:'Internal build',       unlock:'DEV',       icon:'fas fa-code', description:'Rose and cyan traces across a quiet developer field.' }
};
const PROFILE_ENTRANCES = {
    signal:   { label:'Soft signal',   unlock:'USER',     icon:'fas fa-wave-square' },
    aurora:   { label:'Aurora rise',   unlock:'VETERAN',  icon:'fas fa-water' },
    portal:   { label:'Portal fold',   unlock:'PRO',      icon:'fas fa-circle-notch' },
    stardust: { label:'Stardust',      unlock:'LEGEND',   icon:'fas fa-star' },
    rift:     { label:'Prism rift',    unlock:'SPECTRAL', icon:'fas fa-wand-magic-sparkles' },
    terminal: { label:'Terminal boot', unlock:'DEV',      icon:'fas fa-terminal' }
};
const ROLE_DEFAULT_HEADERS={USER:'nebula',VETERAN:'archive',PRO:'solar',LEGEND:'crown',SPECTRAL:'prism',MODERATOR:'guardian',ADMIN:'command',DEV:'code'};
const ROLE_DEFAULT_ENTRANCES={USER:'signal',VETERAN:'aurora',PRO:'portal',LEGEND:'stardust',SPECTRAL:'rift',MODERATOR:'portal',ADMIN:'rift',DEV:'terminal'};
function profilePresetUnlocked(user,preset){return !!user&&!!preset&&(isDev(user)||roleRank(user.role)>=roleRank(preset.unlock));}
function profileStyleFor(user){
    const styles=loadProfileStyles();const saved=styles[user.id]||{};const displayRole=displayedRoleKey(user);
    let header=PROFILE_HEADERS[saved.header]&&profilePresetUnlocked(user,PROFILE_HEADERS[saved.header])?saved.header:ROLE_DEFAULT_HEADERS[displayRole]||'nebula';
    let entrance=PROFILE_ENTRANCES[saved.entrance]&&profilePresetUnlocked(user,PROFILE_ENTRANCES[saved.entrance])?saved.entrance:ROLE_DEFAULT_ENTRANCES[displayRole]||'signal';
    if(!profilePresetUnlocked(user,PROFILE_HEADERS[header]))header='nebula';
    if(!profilePresetUnlocked(user,PROFILE_ENTRANCES[entrance]))entrance='signal';
    return {header,entrance};
}
function saveProfileStyle(user,patch){
    if(!user)return;const styles=loadProfileStyles();styles[user.id]={...profileStyleFor(user),...(styles[user.id]||{}),...patch};saveProfileStyles(styles);
}
function renderProfileIdentityStudio(user){
    const style=profileStyleFor(user);
    const studio=document.getElementById('profileIdentityStudio');
    const renderKey=`${user.id}:${displayedRoleKey(user)}:${style.header}:${style.entrance}`;
    if(studio?.dataset.renderKey===renderKey)return;
    const options=document.getElementById('profileHeaderOptions');
    if(options)options.innerHTML=Object.entries(PROFILE_HEADERS).map(([key,preset])=>{
        const unlocked=profilePresetUnlocked(user,preset);const active=style.header===key;
        return `<button type="button" class="profile-header-option ${active?'active':''} ${unlocked?'':'locked'}" data-header-choice="${key}" ${unlocked?'':`disabled title="Unlock with ${ROLES[preset.unlock].label}"`}><span class="profile-header-option-preview" data-preview-header="${key}"><i></i><b></b></span><span><small>${unlocked?'Animated header':`Requires ${ROLES[preset.unlock].label}`}</small><strong><i class="${preset.icon}"></i>${preset.label}</strong><em>${preset.description}</em></span>${unlocked?'<i class="fas fa-check"></i>':'<i class="fas fa-lock"></i>'}</button>`;
    }).join('');
    const entrances=document.getElementById('profileEntranceOptions');
    if(entrances)entrances.innerHTML=Object.entries(PROFILE_ENTRANCES).map(([key,preset])=>{
        const unlocked=profilePresetUnlocked(user,preset);return `<button type="button" class="${style.entrance===key?'active':''}" data-entrance-choice="${key}" ${unlocked?'':`disabled title="Requires ${ROLES[preset.unlock].label}"`}><i class="${unlocked?preset.icon:'fas fa-lock'}"></i><span>${preset.label}</span></button>`;
    }).join('');
    if(studio)studio.dataset.renderKey=renderKey;
}

function animateProfileHeader(cover){
    if(!cover||REDUCED_MOTION||liteOn())return;
    if(cover._headerAnimationEnd)cover.removeEventListener('animationend',cover._headerAnimationEnd);
    if(cover._headerAnimationFrame)cancelAnimationFrame(cover._headerAnimationFrame);
    cover.classList.remove('header-switching');
    const finish=event=>{
        if(event.target!==cover)return;
        cover.removeEventListener('animationend',finish);
        cover.classList.remove('header-switching');
        cover._headerAnimationEnd=null;
    };
    cover._headerAnimationEnd=finish;
    cover._headerAnimationFrame=requestAnimationFrame(()=>{
        cover._headerAnimationFrame=0;
        cover.addEventListener('animationend',finish);
        cover.classList.add('header-switching');
    });
}

function applyProfileStyle(user,{animateHeader=false,refreshStudio=false}={}){
    if(!user)return;const style=profileStyleFor(user);const preset=PROFILE_HEADERS[style.header];const entrance=PROFILE_ENTRANCES[style.entrance];
    const cover=document.getElementById('profileCover');
    if(cover){
        const headerChanged=cover.dataset.header!==style.header;
        cover.dataset.header=style.header;
        if(animateHeader&&headerChanged)animateProfileHeader(cover);
    }
    const title=document.getElementById('profileHeaderTitle');if(title)title.textContent=preset.label;
    const icon=document.getElementById('profileHeaderIcon');if(icon)icon.className=preset.icon;
    const tier=document.getElementById('profileHeaderTier');if(tier)tier.textContent=preset.tier||'Role collection';
    const signal=document.getElementById('profileSignalName');if(signal)signal.textContent=entrance.label;
    const entranceTitle=document.getElementById('profileEntranceTitle');if(entranceTitle)entranceTitle.textContent=entrance.label;
    const unlockedCount=Object.values(PROFILE_HEADERS).filter(item=>profilePresetUnlocked(user,item)).length;
    const access=document.getElementById('profileHeaderAccess');if(access)access.textContent=`${unlockedCount} animated ${unlockedCount===1?'header':'headers'} unlocked`;
    const modal=dashOverlay?.querySelector('.dashboard-modal');if(modal)modal.dataset.entrance=style.entrance;
    const studio=document.getElementById('profileIdentityStudio');
    if(refreshStudio||(studio&&!studio.hidden))renderProfileIdentityStudio(user);
}

function triggerProfileMenuEntrance(user,replay=true){
    const modal=dashOverlay?.querySelector('.dashboard-modal');if(!modal||!user)return;modal.dataset.entrance=profileStyleFor(user).entrance;
    modal.classList.remove('profile-opening');
    if(!replay||REDUCED_MOTION||liteOn())return;
    if(modal._profileReplayEnd)modal.removeEventListener('animationend',modal._profileReplayEnd);
    if(modal._profileReplayFrame)cancelAnimationFrame(modal._profileReplayFrame);
    modal.classList.remove('profile-replay');
    const finish=event=>{
        if(event.target!==modal)return;
        modal.removeEventListener('animationend',finish);
        modal.classList.remove('profile-replay');
        modal._profileReplayEnd=null;
    };
    modal._profileReplayEnd=finish;
    modal._profileReplayFrame=requestAnimationFrame(()=>{
        modal._profileReplayFrame=0;
        modal.addEventListener('animationend',finish);
        modal.classList.add('profile-replay');
    });
}
function openProfileIdentityStudio(){
    const studio=document.getElementById('profileIdentityStudio');const user=currentRoleUser();if(!studio||!user)return;
    if(studio._finishClose){
        studio.removeEventListener('transitionend',studio._finishClose);
        studio._finishClose=null;
    }
    renderProfileIdentityStudio(user);
    studio.hidden=false;
    requestAnimationFrame(()=>{
        studio.classList.add('open');
        studio.scrollIntoView({behavior:'auto',block:'nearest'});
    });
}
function closeProfileIdentityStudio(){
    const studio=document.getElementById('profileIdentityStudio');if(!studio)return;
    studio.classList.remove('open');
    if(studio._finishClose)studio.removeEventListener('transitionend',studio._finishClose);
    const finish=event=>{
        if(event&&event.target!==studio)return;
        if(event&&event.propertyName!=='opacity')return;
        studio.removeEventListener('transitionend',finish);
        studio._finishClose=null;
        if(!studio.classList.contains('open'))studio.hidden=true;
    };
    studio._finishClose=finish;
    if(REDUCED_MOTION||liteOn())finish();
    else studio.addEventListener('transitionend',finish);
}
document.getElementById('openHeaderStudioBtn')?.addEventListener('click',openProfileIdentityStudio);
document.getElementById('closeHeaderStudioBtn')?.addEventListener('click',closeProfileIdentityStudio);
document.getElementById('profileHeaderOptions')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-header-choice]');const user=currentRoleUser();if(!button||button.disabled||!user)return;saveProfileStyle(user,{header:button.dataset.headerChoice});applyProfileStyle(user,{animateHeader:true,refreshStudio:true});showToast(`${PROFILE_HEADERS[button.dataset.headerChoice].label} header equipped.`,'wand-magic-sparkles');
});
document.getElementById('profileEntranceOptions')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-entrance-choice]');const user=currentRoleUser();if(!button||button.disabled||!user)return;saveProfileStyle(user,{entrance:button.dataset.entranceChoice});applyProfileStyle(user,{refreshStudio:true});triggerProfileMenuEntrance(user,true);showToast(`${PROFILE_ENTRANCES[button.dataset.entranceChoice].label} entrance selected.`,'wave-square');
});

// ── Load profile data ─────────────────────────────────────────
function loadProfileViewData(user,{resetTab=false}={}) {
    const displayRole=displayedRoleKey(user);
    const role = roleInfo(user.role);
    const displayRoleInfo=roleInfo(displayRole);
    const draft=profileDraftFor(user);
    const img = document.getElementById('profileAvatarImg');
    if(img){img.src=draft.avatar||siteAvatarUrl({...user,avatar:''});img.onerror=function(){this.onerror=null;this.src='assets/avatar-placeholder.svg';};}
    const un = document.getElementById('profileUsername'); if(un)un.textContent=user.displayName||user.username;
    const rb = document.getElementById('profileRoleBadge'); if(rb){rb.innerHTML=`<i class="${displayRoleInfo.icon}"></i> ${displayRoleInfo.label}${isDev(user)&&displayRole!=='DEV'?'<small>VISUAL PREVIEW</small>':''}`;rb.className=`badge-pro profile-role-${String(displayRole).toLowerCase()}`;rb.style.background=displayRoleInfo.grad;rb.style.color='#fff';}
    const dn = document.getElementById('profileDisplayName'); if(dn)dn.value=draft.displayName;
    const st = document.getElementById('profileStatus'); if(st)st.value=draft.status;
    const bio= document.getElementById('profileBio'); if(bio)bio.value=draft.bio;
    const chips = document.getElementById('profileStatChips');
    if (chips) chips.innerHTML =
        `<span class="p-stat-chip"><i class="fas fa-gamepad"></i> ${formatMcTime(user.mcTimeSec)} <small>in Minecraft</small></span>`
      + `<span class="p-stat-chip"><i class="fas fa-clock"></i> ${formatDuration(user.totalTimeSec)} <small>on site</small></span>`
      + `<span class="p-stat-chip"><i class="fas fa-user-friends"></i> ${getFriends(user.id).length} <small>friends</small></span>`
      + `<span class="p-stat-chip role-limit-chip"><i class="fas fa-users-rectangle"></i> ${formatRoleLimit(roleProfileLimit(user.role))} <small>profile slots</small></span>`;
    const spotlight=document.getElementById('openRoleStoreBtn');
    if(spotlight){spotlight.style.setProperty('--spotlight-role',role.color);spotlight.dataset.role=String(displayRole).toLowerCase();}
    const spotlightIcon=document.getElementById('profileRoleSpotlightIcon');if(spotlightIcon){spotlightIcon.innerHTML=`<i class="${role.icon}"></i>`;spotlightIcon.style.background=role.grad;}
    const spotlightTitle=document.getElementById('profileRoleSpotlightTitle');if(spotlightTitle)spotlightTitle.textContent=`${role.label} role`;
    const spotlightText=document.getElementById('profileRoleSpotlightText');if(spotlightText)spotlightText.textContent=role.tagline;
    applyProfileStyle(user);
    updateProfileDraftState();
    renderAccountSession(user);
    if(resetTab){
        const activeSwitcher=globalThis.activateProfileTab;
        if(activeSwitcher&&activeSwitcher!==activateProfileTab)activeSwitcher('my-profile');
        else activateProfileTab('my-profile',{animate:false,refresh:false});
    }
}

// ── Roles, purchase-ready store and registration celebration ────────────────
const ROLE_STORE_PLANS = {
    PRO:      { monthly:4.99, yearly:47.90, kicker:'Player favorite', description:'More room for profiles with a warm gold identity across Spectral.' },
    LEGEND:   { monthly:8.99, yearly:86.30, kicker:'Most popular', description:'A rare violet presence, expanded capacity and earlier community visibility.' },
    SPECTRAL: { monthly:13.99, yearly:134.30, kicker:'Everything unlocked', description:'Unlimited identities and the complete prismatic Spectral treatment.' }
};
let roleBillingCycle='yearly';
let selectedCheckoutRole=null;
let checkoutQuote=null;
let checkoutCloseTimer=null;

function currentRoleUser(){ return siteUsers.find(user=>user.id===currentUserId) || null; }
function latestRoleOrder(userId,role){
    return loadRoleOrders().slice().reverse().find(order=>order.userId===userId&&order.role===role&&order.status==='reserved');
}
function openRoleStore(){
    if(!currentUserId){openDashboard();return;}
    if(!dashOverlay?.classList.contains('open'))openDashboard();
    document.querySelector('[data-ptab="role-store"]')?.click();
}
document.getElementById('openRoleStoreBtn')?.addEventListener('click',openRoleStore);

function rolePriceMarkup(role,veteranEligible=true){
    if(role==='VETERAN')return veteranEligible
        ? '<div class="role-card-price earned"><b>Earned</b><small>Permanent founder reward</small></div>'
        : '<div class="role-card-price"><b>Legacy</b><small>Founder window closed January 1, 2027</small></div>';
    const plan=ROLE_STORE_PLANS[role];
    if(!plan)return '';
    const value=roleBillingCycle==='yearly'?plan.yearly:plan.monthly;
    const suffix=roleBillingCycle==='yearly'?'/ year':'/ month';
    const equivalent=roleBillingCycle==='yearly'?`$${(plan.yearly/12).toFixed(2)} monthly equivalent`:'Cancel whenever payments launch';
    return `<div class="role-card-price"><b><sup>$</sup>${value.toFixed(2)}</b><small>${suffix} · ${equivalent}</small></div>`;
}

function renderRoleStore(){
    const user=currentRoleUser();
    const grid=document.getElementById('roleStoreGrid');
    if(!user||!grid)return;
    const displayRole=displayedRoleKey(user);
    const current=roleInfo(displayRole);
    const developerMode=isDev(user);
    const hero=document.getElementById('roleStoreHero');if(hero)hero.dataset.role=String(displayRole).toLowerCase();
    const icon=document.getElementById('currentRoleIcon');if(icon){icon.innerHTML=`<i class="${current.icon}"></i>`;icon.style.background=current.grad;}
    const name=document.getElementById('currentRoleName');if(name)name.textContent=current.label;
    const eyebrow=document.getElementById('currentRoleEyebrow');if(eyebrow)eyebrow.textContent=developerMode?'Developer is viewing':'Current role';
    const since=document.getElementById('currentRoleSince');
    if(since)since.textContent=developerMode&&displayRole!=='DEV'?'Preview only · Developer permissions stay active':displayRole==='VETERAN'?'Founder reward · permanent':`${current.tagline} · joined ${user.registeredAt||'recently'}`;
    const lab=document.getElementById('developerRoleLab');
    if(lab){
        lab.hidden=!developerMode;
        if(developerMode)lab.innerHTML=`<div class="developer-role-lab-icon"><i class="fas fa-flask-vial"></i><span></span></div><div><small>Developer Role Lab</small><h3>Inspect every role without losing developer access.</h3><p>The selected role changes badges, colors, limits and presentation for your account preview. Administration and developer permissions remain untouched.</p></div><div class="developer-role-lab-state"><small>Viewing now</small><b style="--lab-role:${current.color}"><i class="${current.icon}"></i>${current.label}</b><button type="button" data-reset-role-preview ${displayRole==='DEV'?'disabled':''}><i class="fas fa-rotate-left"></i> Reset to Developer</button></div>`;
    }
    const eligible=isVeteranEligible(user);
    const roleKeys=developerMode?ROLE_ORDER:['VETERAN',...PREMIUM_ROLES];
    grid.classList.toggle('developer-grid',developerMode);
    renderRoleWorkspace(user);
    grid.innerHTML=roleKeys.map((roleKey,index)=>{
        const info=roleInfo(roleKey);
        const isCurrent=displayRole===roleKey;
        const reserved=latestRoleOrder(user.id,roleKey);
        const lockedVeteran=!developerMode&&roleKey==='VETERAN'&&!isCurrent;
        const plan=ROLE_STORE_PLANS[roleKey];
        const state=isCurrent?'current':!developerMode&&reserved?'reserved':lockedVeteran?'locked':'';
        const buttonLabel=developerMode?(isCurrent?'Viewing this role':`Preview as ${info.label}`):(isCurrent?'Current role':reserved?'Reserved for launch':lockedVeteran?(eligible?'Assigned automatically':'Founder window closed'):'Choose role');
        const buttonIcon=isCurrent?'check':!developerMode&&reserved?'clock':lockedVeteran?'lock':developerMode?'eye':'arrow-right';
        const collection=developerMode?(roleRank(roleKey)>=ROLES.MODERATOR.rank?'Staff access':'Account role'):(roleKey==='VETERAN'?'Legacy collection':'Premium collection');
        const kicker=developerMode?'Developer preview':roleKey==='VETERAN'?'Never sold':esc(plan.kicker);
        const description=developerMode?info.tagline:(roleKey==='VETERAN'?'For every account registered before January 1, 2027.':plan.description);
        const price=developerMode?'<div class="role-card-price preview"><b>Live preview</b><small>Visual role only · permissions stay Developer</small></div>':rolePriceMarkup(roleKey,eligible);
        return `<article class="role-store-card role-card-${roleKey.toLowerCase()} ${state}" style="--role-color:${info.color};--role-gradient:${info.grad};--card-index:${index}" data-store-role="${roleKey}">
            <div class="role-card-shine"></div>
            <div class="role-card-top"><span class="role-card-icon"><i class="${info.icon}"></i></span><span class="role-card-kicker">${kicker}</span></div>
            <div class="role-card-title"><small>${collection}</small><h3>${esc(info.label)}</h3><p>${esc(description)}</p></div>
            ${price}
            <ul>${info.perks.map(perk=>`<li><i class="fas fa-check"></i>${esc(perk)}</li>`).join('')}</ul>
            <button type="button" class="role-card-select" ${developerMode?`data-preview-role="${roleKey}"`:`data-select-role="${roleKey}"`} ${isCurrent||(!developerMode&&reserved)||lockedVeteran?'disabled':''}><span>${buttonLabel}</span><i class="fas fa-${buttonIcon}"></i></button>
        </article>`;
    }).join('');
}

document.querySelectorAll('[data-role-billing]').forEach(button=>button.addEventListener('click',()=>{
    roleBillingCycle=button.dataset.roleBilling;
    document.querySelectorAll('[data-role-billing]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    if(selectedCheckoutRole)openRoleCheckout(selectedCheckoutRole);
    document.querySelectorAll('[data-role-billing]').forEach(item=>item.classList.toggle('active',item===button));
    renderRoleStore();
}));

function openRoleCheckout(role){
    const user=currentRoleUser();
    const plan=ROLE_STORE_PLANS[role];
    const sheet=document.getElementById('roleCheckoutSheet');
    if(!user||!plan||!sheet)return;
    clearTimeout(checkoutCloseTimer);
    selectedCheckoutRole=role;
    checkoutQuote={role,billing:roleBillingCycle,price:plan[roleBillingCycle],userId:user.id};
    const info=roleInfo(role);
    sheet.hidden=false;
    sheet.dataset.role=role.toLowerCase();
    const icon=document.getElementById('roleCheckoutIcon');if(icon){icon.innerHTML=`<i class="${info.icon}"></i>`;icon.style.background=info.grad;}
    const title=document.getElementById('roleCheckoutTitle');if(title)title.textContent=`Reserve ${info.label}`;
    const description=document.getElementById('roleCheckoutDescription');if(description)description.textContent=`Save ${info.label} on this device. You can change or remove this choice anytime. Your active role stays the same.`;
    const contact=document.getElementById('roleCheckoutContact');if(contact)contact.value=user.email||'';
    const cycle=document.getElementById('roleCheckoutCycle');if(cycle)cycle.textContent=roleBillingCycle==='yearly'?'Yearly plan · indicative launch price':'Monthly plan';
    const price=document.getElementById('roleCheckoutPrice');if(price)price.textContent=`$${plan[roleBillingCycle].toFixed(2)}`;
    requestAnimationFrame(()=>sheet.classList.add('open'));
    sheet.scrollIntoView({behavior:(liteOn()||REDUCED_MOTION)?'auto':'smooth',block:'nearest'});
}
function closeRoleCheckout(){
    const sheet=document.getElementById('roleCheckoutSheet');if(!sheet)return;
    sheet.classList.remove('open');selectedCheckoutRole=null;checkoutQuote=null;
    checkoutCloseTimer=setTimeout(()=>{sheet.hidden=true;},220);
}
document.getElementById('roleStoreGrid')?.addEventListener('click',event=>{
    const previewButton=event.target.closest('[data-preview-role]');
    const user=currentRoleUser();
    if(previewButton&&!previewButton.disabled&&user&&setDeveloperRolePreview(user,previewButton.dataset.previewRole)){
        renderNavbar();renderRoleStore();showToast(`Developer preview switched to ${roleInfo(previewButton.dataset.previewRole).label}.`,'eye');return;
    }
    const button=event.target.closest('[data-select-role]');
    if(button&&!button.disabled&&PREMIUM_ROLES.includes(button.dataset.selectRole))openRoleCheckout(button.dataset.selectRole);
});
document.getElementById('developerRoleLab')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-reset-role-preview]');const user=currentRoleUser();
    if(button&&!button.disabled&&user&&setDeveloperRolePreview(user,'DEV')){renderNavbar();renderRoleStore();showToast('Developer role preview restored.','code');}
});
document.getElementById('roleCheckoutClose')?.addEventListener('click',closeRoleCheckout);
document.getElementById('roleCheckoutSubmit')?.addEventListener('click',()=>{
    const user=currentRoleUser();const quote=checkoutQuote;
    if(!user||user.banned||!quote||quote.userId!==user.id)return;
    const order={id:`role_${crypto.randomUUID()}`,userId:user.id,role:quote.role,billing:quote.billing,quotedPrice:quote.price,currency:'USD',status:'reserved',createdAt:new Date().toISOString()};
    const orders=loadRoleOrders().filter(item=>item.userId!==user.id);orders.push(order);
    if(!saveRoleOrders(orders)){showToast('Storage is full. Your choice was not saved.','triangle-exclamation');return;}
    closeRoleCheckout();renderRoleStore();
    showToast(`${roleInfo(order.role).label} choice saved on this device.`,'check');
});

function showRegistrationWelcome(user){
    const overlay=document.getElementById('registrationWelcomeOverlay');
    const card=document.getElementById('registrationWelcomeCard');
    if(!overlay||!card||!user)return;
    const info=roleInfo(user.role);
    card.dataset.role=String(user.role||'USER').toLowerCase();
    const username=document.getElementById('welcomeUsername');if(username)username.textContent=user.displayName||user.username;
    const roleName=document.getElementById('welcomeRoleName');if(roleName)roleName.textContent=info.label;
    const reason=document.getElementById('welcomeRoleReason');if(reason)reason.textContent=user.role==='VETERAN'?'Unlocked forever for joining before 2027':'Your starting Spectral identity';
    const lead=document.getElementById('welcomeLead');if(lead)lead.textContent=user.role==='VETERAN'?'Your identity is ready — and your arrival date unlocked a permanent reward.':'Your identity is ready. Welcome to the Spectral community.';
    const emblem=document.getElementById('welcomeRoleEmblem');if(emblem){emblem.innerHTML=`<span><i class="${info.icon}"></i></span>`;emblem.style.setProperty('--welcome-role',info.color);}
    const perks=document.getElementById('welcomePerks');if(perks)perks.innerHTML=info.perks.map(perk=>`<span><i class="fas fa-check"></i>${esc(perk)}</span>`).join('');
    overlay.classList.add('open');document.body.style.overflow='hidden';
    setTimeout(()=>document.getElementById('welcomeContinueBtn')?.focus(),450);
}
function closeRegistrationWelcome(){
    const overlay=document.getElementById('registrationWelcomeOverlay');if(!overlay)return;
    overlay.classList.remove('open');
    syncBodyScrollLock();
}
document.getElementById('registrationWelcomeClose')?.addEventListener('click',closeRegistrationWelcome);
document.getElementById('welcomeContinueBtn')?.addEventListener('click',closeRegistrationWelcome);
document.getElementById('welcomeExploreRolesBtn')?.addEventListener('click',()=>{closeRegistrationWelcome();setTimeout(openRoleStore,180);});
document.getElementById('registrationWelcomeOverlay')?.addEventListener('click',event=>{if(event.target===event.currentTarget)closeRegistrationWelcome();});

// ── Avatar upload ─────────────────────────────────────────────
const avatarUpload=document.getElementById('avatarUpload');
const AVATAR_FILE_TYPES=new Set(['image/png','image/jpeg','image/webp']);
function loadLocalImage(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('The selected file is not a valid image.'));image.src=url;});}
async function prepareAvatarFile(file){
    if(!file||!AVATAR_FILE_TYPES.has(file.type))throw new Error('Choose a PNG, JPEG or WebP image.');
    if(file.size>1024*1024)throw new Error('Avatar images must be 1 MB or smaller.');
    const objectUrl=URL.createObjectURL(file);
    try{
        const image=await loadLocalImage(objectUrl);
        if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth>4096||image.naturalHeight>4096)throw new Error('Avatar dimensions must be between 1 and 4096 pixels.');
        const size=256;
        const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
        const context=canvas.getContext('2d',{alpha:false});
        if(!context)throw new Error('This browser cannot process the image.');
        const scale=Math.max(size/image.naturalWidth,size/image.naturalHeight);
        const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
        context.drawImage(image,(size-width)/2,(size-height)/2,width,height);
        const dataUrl=canvas.toDataURL('image/webp',.86);
        if(!safeAvatarUrl(dataUrl))throw new Error('The processed avatar is too large.');
        return dataUrl;
    }finally{URL.revokeObjectURL(objectUrl);}
}
if(avatarUpload){avatarUpload.addEventListener('change',async event=>{const ownerId=currentUserId;const file=event.target.files?.[0];if(!file||!ownerId)return;avatarUpload.disabled=true;try{const dataUrl=await prepareAvatarFile(file);if(currentUserId!==ownerId)return;profileDraftFor(currentRoleUser()).avatar=dataUrl;updateProfileDraftState();const image=document.getElementById('profileAvatarImg');if(image)image.src=dataUrl;document.getElementById('profileEditForm')?.requestSubmit();}catch(error){showToast(error.message||'Avatar could not be processed.','triangle-exclamation');}finally{avatarUpload.disabled=false;avatarUpload.value='';}});}

// ── Logout ────────────────────────────────────────────────────
const logoutBtn=document.getElementById('logoutBtn');
if(logoutBtn)logoutBtn.addEventListener('click',signOutAccount);

// ── Launcher info tab ─────────────────────────────────────────
const goAccBtn=document.getElementById('goToAccountsBtn');
if(goAccBtn){goAccBtn.addEventListener('click',()=>{closeDashboard();document.querySelector('[data-target="accounts"]').click();});}
document.getElementById('accountsViewRolesBtn')?.addEventListener('click',openRoleStore);
