// ══════════════════════════════════════════════════════════════
// FRIENDS SYSTEM (between site users)
// ══════════════════════════════════════════════════════════════
// Queries over the shared `friendships` list, always from the point of view of
// a given user id. A relationship's "other" party is whichever end isn't `uid`.
function friendOtherId(f, uid) { return f.requester === uid ? f.addressee : f.requester; }
function findFriendship(a, b) {
    return friendships.find(f =>
        (f.requester === a && f.addressee === b) ||
        (f.requester === b && f.addressee === a));
}
// Accepted friends of uid
function getFriends(uid)          { return friendships.filter(f => f.status === 'accepted' && (f.requester === uid || f.addressee === uid)); }
// Requests waiting for uid to accept/decline
function getIncomingRequests(uid) { return friendships.filter(f => f.status === 'pending' && f.addressee === uid); }
// Requests uid sent that are still pending
function getOutgoingRequests(uid) { return friendships.filter(f => f.status === 'pending' && f.requester === uid); }

// Presence derived from last_seen — same rule as the launcher.
function presenceOf(user) {
    const t = user && user.lastSeen ? new Date(user.lastSeen).getTime() : 0;
    const sec = t ? (Date.now() - t) / 1000 : Infinity;
    if (sec < 180)  return { text:'Online',  cls:'online',  online:true  };
    if (sec < 1800) return { text:`Away · ${Math.floor(sec/60)}m`, cls:'away', online:false };
    return { text:'Offline', cls:'offline', online:false };
}
function formatMcTime(sec){ sec=Math.round(sec||0); const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60); return h?`${h}h ${m}m`:`${m}m`; }

function showFriendMsg(text, ok) {
    const el = document.getElementById('friendAddMsg');
    if (!el) return;
    el.textContent = text;
    el.style.display = 'block';
    el.className = 'friend-add-msg ' + (ok ? 'ok' : 'err');
}

async function findSiteUserByName(name) {
    if (validSupabaseConfig()) {
        const uid=currentUserId, generation=authGeneration;
        if(!cloudReady() || uid!==cloudAuthUserId)throw new Error('Reconnect to search for players.');
        const { data, error } = await cloud.rpc('spectral_search_users', {p_query:name,p_exact:true});
        if (error) throw error;
        if(!friendSessionMatches(uid,generation))throw new Error('The account changed during search.');
        const row = Array.isArray(data) ? data[0] : null;
        const profile = row ? cloudProfileToUser(row) : null;
        if (profile) {
            const index = siteUsers.findIndex(user=>user.id===profile.id);
            if (index >= 0) siteUsers[index]=profile;else siteUsers.push(profile);
        }
        return profile;
    }
    return siteUsers.find(user => user.username.toLowerCase()===name.toLowerCase()
        || (user.displayName || '').toLowerCase()===name.toLowerCase()) || null;
}
async function sendFriendRequest(rawName) {
    if (!currentUserId) { openDashboard(); return; }
    const name = sanitizeField(rawName, 30);
    if (!name) { showFriendMsg('Enter a username to add.', false); return; }
    const uid=currentUserId, generation=authGeneration;
    try {
        const target=await findSiteUserByName(name);
        if(currentUserId!==uid || authGeneration!==generation)return;
        if(!target){showFriendMsg(`No user named "${name}" found.`,false);return;}
        if(target.id===uid){showFriendMsg("You can't add yourself.",false);return;}
        // Check the current server list, not a stale browser copy.
        if(validSupabaseConfig() && !await refreshFriendships())throw new Error('Could not refresh friend requests. Please try again.');
        if(currentUserId!==uid || authGeneration!==generation)return;
        const existing=findFriendship(uid,target.id);
        if(existing){
            showFriendMsg(existing.status==='accepted' ? 'You are already friends with this player.'
                : existing.requester===uid ? 'Your request is already pending.' : 'This player already sent you a request — check below.',false);
            return;
        }
        await changeFriendship('insert',{id:'fr_'+crypto.randomUUID().replaceAll('-',''),requester:uid,
            addressee:target.id,status:'pending',createdAt:new Date().toISOString()});
        showFriendMsg(`Friend request sent to ${target.displayName || target.username}.`,true);
        const input=document.getElementById('friendAddInput');if(input)input.value='';
        renderFriends();
    } catch(error) {
        handleCloudError('send friend request',error);
        if(currentUserId!==uid || authGeneration!==generation)return;
        showFriendMsg(error.code==='23505'?'A request with this player already exists.':error.message || 'Could not send the friend request.',false);
        await refreshFriendships();
    }
}
async function performFriendAction(action,id) {
    const uid=currentUserId, generation=authGeneration;
    const friendship=friendships.find(row=>row.id===id);
    if(!friendship)return false;
    try {
        await changeFriendship(action,friendship);
        renderFriends();
        if(action==='accept')showToast('Friend request accepted.','user-check');
        return true;
    } catch(error) {
        handleCloudError('friend action',error);
        if(currentUserId===uid && authGeneration===generation)showFriendMsg(error.message || 'Could not save the friend action.',false);
        return false;
    } finally {
        if(currentUserId===uid && authGeneration===generation)await refreshFriendships();
    }
}
async function acceptFriendRequest(id) { return performFriendAction('accept',id); }
async function declineFriendRequest(id) { return performFriendAction('delete',id); }
function removeFriend(id) {
    const f=friendships.find(row=>row.id===id);
    if(!f)return;
    const uid=currentUserId, generation=authGeneration;
    const other=siteUsers.find(user=>user.id===friendOtherId(f,uid));
    showConfirm(`Remove ${other ? (other.displayName||other.username) : 'this friend'} from your friends?`,()=>{
        if(currentUserId===uid && authGeneration===generation)void performFriendAction('delete',id);
    });
}

function friendCardHtml(user, kind, frId) {
    // kind: 'friend' | 'incoming' | 'outgoing'
    const name = esc(user.displayName || user.username);
    const pres = presenceOf(user);
    // Sub-line: custom status wins; otherwise presence (friends) or @handle (requests).
    const sub  = user.status ? esc(user.status)
               : (kind === 'friend' ? pres.text : '@' + esc(user.username));
    let actions = '';
    const safeFriendshipId = esc(safeIdentifier(frId));
    const requestCard = kind !== 'friend';
    const badge = roleBadgeHtml(user.role);
    if (kind === 'friend')        actions = `<button class="friend-btn remove" data-fr-remove="${safeFriendshipId}" type="button" title="Remove friend"><i class="fas fa-user-minus"></i></button>`;
    else if (kind === 'incoming') actions = `<button class="friend-btn accept" data-fr-accept="${safeFriendshipId}" type="button"><i class="fas fa-check"></i> Accept</button>
                                             <button class="friend-btn decline" data-fr-decline="${safeFriendshipId}" type="button" title="Decline" aria-label="Decline"><i class="fas fa-xmark" aria-hidden="true"></i></button>`;
    else                          actions = `<span class="friend-pending"><i class="fas fa-clock"></i> Pending</span>
                                             <button class="friend-btn decline" data-fr-decline="${safeFriendshipId}" type="button" title="Cancel request" aria-label="Cancel request"><i class="fas fa-xmark" aria-hidden="true"></i><span>Cancel request</span></button>`;
    return `<div class="friend-card glass friend-card--${kind}" data-fr-user="${esc(safeIdentifier(user.id))}" title="View profile">
        <div class="friend-av-wrap">
            <img class="friend-avatar" src="${esc(siteAvatarUrl(user))}" alt="${name}" width="100" height="100" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback>
            <span class="friend-dot ${pres.cls}"></span>
        </div>
        <div class="friend-info">
            <div class="friend-name" title="${name}"><span class="friend-display-name">${name}</span> ${requestCard ? '' : badge}</div>
            <div class="friend-user">${sub}</div>
        </div>
        ${requestCard && badge ? `<div class="friend-role">${badge}</div>` : ''}
        <div class="friend-actions">${actions}</div>
    </div>`;
}

// ── Friend info modal ─────────────────────────────────────────
function openFriendInfo(userId) {
    const u = siteUsers.find(x => x.id === userId);
    const ov = document.getElementById('friendInfoOverlay');
    const body = document.getElementById('friendInfoBody');
    if (!u || !ov || !body) return;
    const pres = presenceOf(u);
    const fr = findFriendship(currentUserId, userId);
    const isFriend = fr && fr.status === 'accepted';
    const since = fr && fr.createdAt ? new Date(fr.createdAt).toLocaleDateString() : '—';
    const roleKey = displayedRoleKey(u);
    const role = roleInfo(roleKey);
    const profileStyle = profileStyleFor(u);
    const headerPreset = PROFILE_HEADERS[profileStyle.header] || PROFILE_HEADERS.nebula;
    const entrancePreset = PROFILE_ENTRANCES[profileStyle.entrance] || PROFILE_ENTRANCES.signal;
    const viewerFriendIds = new Set(getFriends(currentUserId).map(link=>friendOtherId(link,currentUserId)));
    const mutualCount = getFriends(userId).map(link=>friendOtherId(link,userId)).filter(id=>viewerFriendIds.has(id)).length;
    const relationship = isFriend ? `Friends since ${since}` : (fr?.status === 'pending' ? (fr.addressee === currentUserId ? 'Friend request received' : 'Friend request sent') : 'Community profile');
    const stat = (label, val, icon) =>
        `<div class="fi-stat"><i class="fas fa-${icon}"></i><div><span class="fi-stat-val">${val}</span><span class="fi-stat-lbl">${label}</span></div></div>`;
    body.innerHTML = `
        <article class="friend-profile-card" style="--friend-role:${role.color}">
            <section class="friend-profile-cover profile-cover" data-header="${profileStyle.header}">
                <div class="profile-cover-scene" aria-hidden="true"><i></i><i></i><i></i><span></span><b></b></div>
                <div class="friend-profile-cover-top">
                    <span><i class="${headerPreset.icon}"></i> ${esc(headerPreset.label)}</span>
                    <em><i class="fas fa-earth-europe"></i> Public profile</em>
                </div>
                <div class="friend-profile-identity">
                    <div class="friend-av-wrap fi-av">
                        <img src="${esc(siteAvatarUrl(u))}" alt="${esc(u.displayName || u.username)}" width="100" height="100" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback>
                        <span class="friend-dot ${pres.cls}"></span>
                    </div>
                    <div class="fi-head-text">
                        <div class="fi-presence ${pres.cls}"><i></i>${pres.text}</div>
                        <div class="fi-name">${esc(u.displayName || u.username)} ${roleBadgeHtml(roleKey)}</div>
                        <div class="fi-handle">@${esc(u.username)}</div>
                    </div>
                    <div class="friend-profile-signal"><small>Profile signal</small><b>${esc(entrancePreset.label)}</b><em>${esc(relationship)}</em></div>
                </div>
            </section>
            <div class="friend-profile-main">
                <section class="friend-profile-about">
                    <div class="friend-profile-section-title"><span><i class="fas fa-address-card"></i></span><div><small>Identity</small><h3>About this player</h3></div></div>
                    ${u.status ? `<div class="fi-status"><i class="fas fa-quote-left"></i><span>${esc(u.status)}</span></div>` : ''}
                    <div class="fi-bio">${esc(u.bio || 'This player has not added a biography yet.')}</div>
                    <div class="friend-role-access">
                        <span class="friend-role-access-icon" style="background:${role.grad}"><i class="${role.icon}"></i></span>
                        <div><small>Role access</small><b>${esc(role.label)}</b><em>${esc(role.tagline)}</em></div>
                        <strong>${formatRoleLimit(roleProfileLimit(roleKey))}<small>slots</small></strong>
                    </div>
                </section>
                <section class="friend-profile-overview">
                    <div class="friend-profile-section-title"><span><i class="fas fa-chart-simple"></i></span><div><small>Activity</small><h3>Player overview</h3></div></div>
                    <div class="fi-stats">
                        ${stat('In Minecraft', formatMcTime(u.mcTimeSec), 'gamepad')}
                        ${stat('On site', formatDuration(u.totalTimeSec), 'clock')}
                        ${stat('Member since', esc(u.registeredAt || '—'), 'calendar-alt')}
                        ${stat('Last seen', timeAgo(u.lastSeen), 'eye')}
                        ${stat('Friends', String(getFriends(userId).length), 'user-group')}
                        ${stat('Mutual friends', String(mutualCount), 'people-arrows')}
                    </div>
                </section>
            </div>
            <footer class="friend-profile-footer">
                <span><i class="fas fa-link"></i>${esc(relationship)}</span>
                ${isFriend ? `<button class="fi-remove-btn" data-fi-remove="${esc(safeIdentifier(fr.id))}"><i class="fas fa-user-minus"></i> Remove friend</button>` : ''}
            </footer>
        </article>`;
    const modal = ov.querySelector('.friend-info-modal');
    ov.dataset.entrance = profileStyle.entrance;
    if (modal) modal.style.setProperty('--friend-role', role.color);
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeFriendInfo() {
    const ov = document.getElementById('friendInfoOverlay');
    if (ov) ov.classList.remove('open');
    syncBodyScrollLock();
}

// Notification badge (incoming friend requests) on the account button.
function updateRequestBadge() {
    const badge = document.getElementById('reqBadge');
    if (!badge) return;
    const n = currentUserId ? getIncomingRequests(currentUserId).length : 0;
    badge.textContent = n > 9 ? '9+' : String(n);
    badge.style.display = n > 0 ? 'flex' : 'none';
}

function renderFriends() {
    const section = document.getElementById('friendsSection');
    if (!section) return;
    // Only meaningful when signed in
    section.style.display = currentUserId ? (section.classList.contains('cockpit-rail')?'flex':'block') : 'none';
    if (!currentUserId) { const cockpitFriendCount=document.getElementById('cockpitFriendCount');if(cockpitFriendCount)cockpitFriendCount.textContent='0';return; }

    const incoming = getIncomingRequests(currentUserId);
    const outgoing = getOutgoingRequests(currentUserId);
    const friends  = getFriends(currentUserId);

    const countEl = document.getElementById('friendsCount');
    if (countEl) countEl.textContent = friends.length;
    const cockpitFriendCount = document.getElementById('cockpitFriendCount');
    if (cockpitFriendCount) cockpitFriendCount.textContent = String(friends.length);
    updateRequestBadge();

    // Incoming / outgoing requests block
    const reqWrap = document.getElementById('friendRequests');
    if (reqWrap) {
        let html = '';
        if (incoming.length) {
            html += `<div class="friend-req-title"><i class="fas fa-inbox"></i> Requests received <span class="friends-count">${incoming.length}</span></div>`;
            incoming.forEach(f => { const u = siteUsers.find(x => x.id === f.requester) || {id:f.requester,username:'Player'}; html += friendCardHtml(u, 'incoming', f.id); });
        }
        if (outgoing.length) {
            html += `<div class="friend-req-title"><i class="fas fa-paper-plane"></i> Requests sent <span class="friends-count">${outgoing.length}</span></div>`;
            outgoing.forEach(f => { const u = siteUsers.find(x => x.id === f.addressee) || {id:f.addressee,username:'Player'}; html += friendCardHtml(u, 'outgoing', f.id); });
        }
        reqWrap.innerHTML = html;
        reqWrap.style.display = html ? (reqWrap.closest('.cockpit-social-rail')?'flex':'grid') : 'none';
    }

    // Friends list
    const grid = document.getElementById('friendsGrid');
    const empty = document.getElementById('friendsEmpty');
    if (grid) {
        grid.innerHTML = '';
        friends.forEach(f => { const u = siteUsers.find(x => x.id === friendOtherId(f, currentUserId)); if (u) grid.insertAdjacentHTML('beforeend', friendCardHtml(u, 'friend', f.id)); });
    }
    if (empty) empty.style.display = friends.length ? 'none' : 'flex';
}

// Friends UI event wiring (delegated)
const friendAddForm = document.getElementById('friendAddForm');
if (friendAddForm) friendAddForm.addEventListener('submit', async e => {
    e.preventDefault();
    const input = document.getElementById('friendAddInput');
    const submit=friendAddForm.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
    try{await sendFriendRequest(input ? input.value : '');}finally{if(submit)submit.disabled=false;}
});
const friendsSectionEl = document.getElementById('friendsSection');
if (friendsSectionEl) friendsSectionEl.addEventListener('click', e => {
    const acc = e.target.closest('[data-fr-accept]');  if (acc) { acceptFriendRequest(acc.dataset.frAccept); return; }
    const dec = e.target.closest('[data-fr-decline]'); if (dec) { declineFriendRequest(dec.dataset.frDecline); return; }
    const rem = e.target.closest('[data-fr-remove]');  if (rem) { removeFriend(rem.dataset.frRemove); return; }
    // Anywhere else on a card → open that user's info.
    const card = e.target.closest('[data-fr-user]'); if (card) openFriendInfo(card.dataset.frUser);
});

// Friend info modal: close + remove-from-modal.
const friendInfoOverlayEl = document.getElementById('friendInfoOverlay');
if (friendInfoOverlayEl) {
    friendInfoOverlayEl.addEventListener('click', e => {
        if (e.target === friendInfoOverlayEl) { closeFriendInfo(); return; }
        const rem = e.target.closest('[data-fi-remove]');
        if (rem) { closeFriendInfo(); removeFriend(rem.dataset.fiRemove); }
    });
}
const closeFriendInfoBtn = document.getElementById('closeFriendInfoBtn');
if (closeFriendInfoBtn) closeFriendInfoBtn.addEventListener('click', closeFriendInfo);

// UUID copy
const uuidBtn=document.getElementById('activeAccountUuid');
if(uuidBtn)uuidBtn.addEventListener('click',()=>{const a=mcAccounts.find(a=>a.id===activeMcId);if(!a)return;const uuid=a.uuid||offlineUuid(a.username);const span=document.getElementById('activeUuidText');const done=()=>{uuidBtn.classList.add('copied');if(span)span.textContent='Copied!';setTimeout(()=>{uuidBtn.classList.remove('copied');if(span)span.textContent=uuid;},1200);};if(navigator.clipboard)navigator.clipboard.writeText(uuid).then(done).catch(done);else done();});

// ── Launcher notice sign in button ────────────────────────────
const noticeBtn=document.getElementById('noticeSignInBtn');
if(noticeBtn)noticeBtn.addEventListener('click',()=>openDashboard());
