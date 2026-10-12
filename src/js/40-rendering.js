// ══════════════════════════════════════════════════════════════
// RENDER FUNCTIONS
// ══════════════════════════════════════════════════════════════
function renderAll() {
    reloadMcAccounts();
    renderNavbar();
    renderLauncherNotice();
    renderActiveMcBanner();
    renderMcGrid();
    renderFriends();
    updateRequestBadge();
    renderDevWriteBtn();
    renderNewsTimeline();
    renderForum();
}

// ── Navbar ────────────────────────────────────────────────────
function renderNavbar() {
    const user = siteUsers.find(u=>u.id===currentUserId);
    if (document.body) document.body.dataset.accountRole = user ? displayedRoleKey(user) : 'GUEST';
    const accText = document.getElementById('accountText');
    const accEyebrow = document.getElementById('accountEyebrow');
    const accButton = document.getElementById('openDashboardBtn');
    const circle  = document.getElementById('navAvatarCircle');
    const launcherHead = document.getElementById('launcherSkinHead');
    if (user) {
        if (accText) accText.textContent = user.displayName||user.username;
        if (accEyebrow) accEyebrow.textContent = 'SIGNED IN';
        if (accButton) accButton.setAttribute('aria-label',`Open account panel for ${user.displayName||user.username}`);
        if (circle) { circle.innerHTML=`<img src="${esc(siteAvatarUrl(user))}" alt="${esc(user.displayName||user.username)} profile" width="40" height="40" decoding="async" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" data-avatar-fallback>`; }
        const launcherAccount = mcAccounts.find(a=>a.id===activeMcId);
        const launcherName = (launcherAccount||{displayName:user.displayName}).displayName || user.username;
        document.getElementById('launcherUsername').textContent = launcherName;
        if (launcherHead) {
            launcherHead.src = avatarUrl((launcherAccount && launcherAccount.username) || launcherName);
            launcherHead.onerror = function(){ this.onerror=null; this.src=avatarUrl('steve'); };
        }
    } else {
        if (accText) accText.textContent = 'Sign In';
        if (accEyebrow) accEyebrow.textContent = 'YOUR SPACE';
        if (accButton) accButton.setAttribute('aria-label','Sign in or open account panel');
        if (circle) circle.innerHTML = '<i class="fas fa-user"></i>';
        document.getElementById('launcherUsername').textContent = 'Guest';
        if (launcherHead) launcherHead.src = avatarUrl('steve');
    }
}

// ── Launcher notice ───────────────────────────────────────────
function renderLauncherNotice() {
    const notice = document.getElementById('launcherNotice');
    if (notice) notice.style.display = currentUserId ? 'none' : 'flex';
    const workspace = document.getElementById('accountsSignedInWorkspace');
    if (workspace) workspace.style.display = currentUserId ? 'block' : 'none';
    // When logged out, hide the banner + two-column area so the notice stands alone
    const banner  = document.getElementById('activeAccountBanner');
    const columns = document.getElementById('accountsColumns');
    if (banner)  banner.style.display = currentUserId ? '' : 'none';
    if (columns) columns.style.display = currentUserId ? '' : 'none';
}

// ── Active MC banner ──────────────────────────────────────────
function renderActiveMcBanner() {
    const banner    = document.getElementById('activeAccountBanner');
    const leftSec   = banner&&banner.querySelector('.active-account-left');
    const statsSec  = banner&&banner.querySelector('.active-account-stats');
    const noMsg     = document.getElementById('noAccountsMsg');
    const readyState = banner&&banner.querySelector('.account-ready-state');
    const identityCode = banner&&banner.querySelector('.cockpit-identity-code');
    const coreStatus = document.getElementById('cockpitCoreStatus');
    if (!banner) return;

    const active = mcAccounts.find(a=>a.id===activeMcId);
    banner.classList.toggle('has-active',Boolean(active));
    if (!active) {
        if (leftSec)  leftSec.style.display='none';
        if (statsSec) statsSec.style.display='none';
        if (noMsg)    noMsg.style.display='flex';
        if (readyState) readyState.style.display='none';
        if (identityCode) identityCode.style.display='none';
        if (coreStatus) coreStatus.innerHTML='<i></i> Waiting for identity';
        return;
    }
    if (leftSec)  leftSec.style.display='flex';
    if (statsSec) statsSec.style.display='flex';
    if (noMsg)    noMsg.style.display='none';
    if (readyState) readyState.style.display='flex';
    if (identityCode) identityCode.style.display='grid';
    if (coreStatus) coreStatus.innerHTML='<i></i> Launcher identity online';

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
    banner.classList.remove('identity-switching');
    void banner.offsetWidth;
    requestAnimationFrame(()=>banner.classList.add('identity-switching'));
    clearTimeout(banner._identitySwitchTimer);
    banner._identitySwitchTimer=setTimeout(()=>banner.classList.remove('identity-switching'),620);
}

// ── MC Accounts grid ──────────────────────────────────────────
let accFilter='all', accSearch='', accSort='recent';
function updateAccountCockpitMetrics() {
    const user=siteUsers.find(item=>item.id===currentUserId);
    const limit=user?roleProfileLimit(user.role||'USER'):null;
    const count=mcAccounts.length;
    const profileCount=document.getElementById('cockpitProfileCount');if(profileCount)profileCount.textContent=String(count);
    const slotLabel=user?formatRoleLimit(limit):'—';
    const slotLimit=document.getElementById('cockpitSlotLimit');if(slotLimit)slotLimit.textContent=slotLabel;
    const slotUsage=document.getElementById('cockpitSlotUsage');if(slotUsage)slotUsage.textContent=`${count} / ${slotLabel}`;
    const meter=document.getElementById('cockpitSlotMeterBar');
    if(meter){
        const percent=!user?0:Number.isFinite(limit)&&limit>0?Math.min(100,(count/limit)*100):100;
        meter.style.transform=`scaleX(${percent/100})`;
        meter.parentElement?.classList.toggle('is-unlimited',Boolean(user)&&!Number.isFinite(limit));
    }
}
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
    updateAccountCockpitMetrics();
    grid.innerHTML='';

    if (!currentUserId) {
        if (empty) empty.style.display='block';
        const emptyAdd=document.getElementById('accountsEmptyAddBtn');if(emptyAdd)emptyAdd.style.display='none';
        if (emptyTxt) emptyTxt.textContent='Sign in to your site account to see your Minecraft profiles';
        return;
    }
    const list = getFilteredMc();
    if (list.length===0) {
        if (empty) empty.style.display='block';
        if (emptyTxt) emptyTxt.textContent = mcAccounts.length===0 ? 'No Minecraft profiles yet' : 'No profiles match your filters';
        const emptyAdd=document.getElementById('accountsEmptyAddBtn');if(emptyAdd)emptyAdd.style.display=mcAccounts.length===0?'inline-flex':'none';
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
            <button class="acc-fav${acc.favorite?' on':''}" data-id="${esc(acc.id)}" title="Favorite" type="button"><i class="fas fa-star"></i></button>
            ${isActive?'<span class="acc-active-tag"><span class="acc-active-dot"></span> Active</span>':''}
            <div class="acc-card-top">
                <div class="acc-avatar">
                    <img src="${avatarUrl(acc.username)}" alt="${esc(acc.username)}" width="100" height="100" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback>
                </div>
                <div class="acc-card-head">
                    <div class="acc-card-name">${esc(acc.displayName||acc.username)}</div>
                    <span class="active-account-type type-${acc.type}" style="font-size:0.72rem;padding:3px 10px;"><i class="${typeIcon(acc.type)}"></i> ${typeLabel(acc.type)}</span>
                </div>
            </div>
            <div class="acc-card-meta">
                <span title="Time in game"><i class="fas fa-clock"></i> ${acc.playtime||'0h'}</span>
                <span title="Date added"><i class="fas fa-calendar-alt"></i> ${acc.addedAt||'—'}</span>
            </div>
            <div class="acc-card-actions">
                <button class="acc-btn-select${isActive?' selected':''}" data-id="${esc(acc.id)}" type="button">${isActive?'<i class="fas fa-check"></i> Active':'<i class="fas fa-play"></i> Select'}</button>
                <button class="acc-btn-delete" data-id="${esc(acc.id)}" type="button" title="Delete"><i class="fas fa-trash-alt"></i></button>
            </div>`;
        grid.appendChild(card);
    });
}
async function toggleMcFav(id){
    const a=mcAccounts.find(account=>account.id===id);if(!a||mcSaveInProgress)return;
    const user=currentRoleUser();
    const limit=roleFavoriteLimit(user?.role||'USER');
    if(!a.favorite&&Number.isFinite(limit)&&mcAccounts.filter(account=>account.favorite).length>=limit){
        showToast(`${roleInfo(user?.role).label} supports ${limit} favorite ${limit===1?'profile':'profiles'}. Explore roles for more.`,'star');
        return;
    }
    const next=mcAccounts.map(account=>account.id===id?{...account,favorite:!account.favorite}:account);
    try{await saveMinecraftProfiles(currentUserId,next,activeMcId);renderMcGrid();}
    catch(error){showToast(error.message,'triangle-exclamation');}
}
async function selectMcAccount(id){
    if(!currentUserId||activeMcId===id||mcSaveInProgress)return;
    if(!mcAccounts.some(account=>account.id===id))return;
    const next=mcAccounts.map(account=>account.id===id?{...account,lastUsed:new Date().toISOString()}:account);
    try{await saveMinecraftProfiles(currentUserId,next,id);renderAll();}
    catch(error){showToast(error.message,'triangle-exclamation');}
}
function deleteMcAccount(id, cardEl) {
    const ownerId=currentUserId;const a=mcAccounts.find(a=>a.id===id);if(!a||!ownerId)return;
    showConfirm(`Delete Minecraft profile "${a.displayName||a.username}"?`,async()=>{
        if(mcSaveInProgress)return;
        const next=mcAccounts.filter(account=>account.id!==id);
        const nextActive=activeMcId===id?(next[0]?.id||null):activeMcId;
        try{await saveMinecraftProfiles(ownerId,next,nextActive);if(cardEl)cardEl.classList.add('removing');renderAll();}
        catch(error){showToast(error.message,'triangle-exclamation');}
    });
}
async function addMcAccount(username, type) {
    if (!currentUserId) { openDashboard(); return false; }
    if(mcSaveInProgress)return false;
    const user=currentRoleUser();
    const limit=roleProfileLimit(user?.role||'USER');
    if(Number.isFinite(limit)&&mcAccounts.length>=limit){showToast(`${roleInfo(user?.role).label} includes ${limit} launcher profile slots.`,'users-rectangle');openRoleStore();return false;}
    const today=new Date();
    const dateStr=`${String(today.getDate()).padStart(2,'0')}.${String(today.getMonth()+1).padStart(2,'0')}.${today.getFullYear()}`;
    const acc={id:'la_'+crypto.randomUUID().replace(/-/g,''),username:username.trim(),displayName:username.trim(),type,addedAt:dateStr,playtime:'0h',lastUsed:null,favorite:false,uuid:offlineUuid(username.trim())};
    try{await saveMinecraftProfiles(currentUserId,[acc,...mcAccounts],acc.id);renderAll();return true;}
    catch(error){showToast(error.message,'triangle-exclamation');return false;}
}

// (Accounts toolbar removed — profiles now render as a simple list; default sort applies)
