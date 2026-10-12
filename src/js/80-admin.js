// ── Admin Panel ───────────────────────────────────────────────
let adminActiveTab='users';
let adminPage=1;
const ADMIN_PAGE_SIZE=12;
let adminCloudConnected=false;
let adminCloudError='';
let adminCloudIds=new Set();
let adminRemoteAudit=[];
let adminForumFilter='all';
let adminInspectedUserId=null;
const adminSelectedUserIds=new Set();
let adminPendingAction=null;
let adminActionBusy=false;
const K_ADMIN_AUDIT='spectral_admin_audit';

function adminAuditEntries(){return validSupabaseConfig()?adminRemoteAudit:readJsonStorage(K_ADMIN_AUDIT,[],Array.isArray).filter(entry=>entry&&typeof entry==='object').slice(-200);}
function renderAdminAudit(){
    const list=document.getElementById('adminAuditList');if(!list||!canAccessAdmin(currentRoleUser()))return;
    const entries=adminAuditEntries().slice().reverse();
    list.innerHTML=entries.length?entries.map(entry=>`<article><span><i class="fas fa-${entry.action==='role'?'id-badge':entry.action==='ban'?'ban':entry.action==='delete'?'trash-can':'unlock'}"></i></span><div><header><strong>${esc(entry.actorName||entry.actorId||'Staff')} · ${esc(entry.action)}</strong><time>${esc(new Date(entry.createdAt).toLocaleString())}</time></header><p>${esc(entry.reason||'No reason recorded')}</p><small>${(Array.isArray(entry.changes)?entry.changes:[]).map(change=>`${esc(change.username||change.id)}: ${esc(change.before)} → ${esc(change.after)}`).join(' · ')}</small></div></article>`).join(''):'<div class="admin-empty-state"><i class="fas fa-clock-rotate-left"></i><h3>A clear starting point</h3><p>Reviewed account changes will appear here with their reason.</p></div>';
}
function cancelAdminAction(){adminPendingAction=null;const panel=document.getElementById('adminActionReview');if(panel)panel.hidden=true;}
function reviewAdminAction(action,ids,role=null){
    const actor=currentRoleUser();
    const targets=[...new Set(ids)].map(id=>siteUsers.find(user=>user.id===id));
    if(!['role','ban','unban','delete'].includes(action)||!targets.length)return showToast('Choose an account and an action first.','circle-info');
    if(targets.some(target=>!canAdminManageTarget(actor,target)||!AccountPolicy.canManage(actor,target,action==='role'?role:null))||(action==='delete'&&(!isDev(actor)||validSupabaseConfig())))return showToast('Your account cannot make this change.','lock');
    adminPendingAction={actorId:actor.id,action,role,targets:targets.map(user=>({id:user.id,username:user.username,role:user.role,banned:user.banned}))};
    const panel=document.getElementById('adminActionReview');panel.hidden=false;
    document.getElementById('adminReviewTitle').textContent=`${action==='role'?'Change role':action==='delete'?'Delete local account':action==='ban'?'Restrict sign-in':'Restore sign-in'} · ${targets.length} account${targets.length===1?'':'s'}`;
    document.getElementById('adminReviewDiff').innerHTML=targets.map(user=>`<div class="admin-change-row"><strong>${esc(user.displayName||user.username)}</strong><span>${esc(action==='role'?roleInfo(user.role).label:user.banned?'Restricted':'Active')}</span><i class="fas fa-arrow-right"></i><b>${esc(action==='role'?roleInfo(role).label:action==='delete'?'Deleted with local data':action==='ban'?'Restricted':'Active')}</b></div>`).join('');
    document.getElementById('adminActionReason').value='';document.getElementById('adminActionError').textContent='';
    panel.scrollIntoView({behavior:REDUCED_MOTION||liteOn()?'auto':'smooth',block:'nearest'});document.getElementById('adminActionReason').focus({preventScroll:true});
}
// Roll back this bounded set of local records if storage rejects a write.
function persistAdminRecords(records){
    const previous=new Map([...records.keys()].map(key=>[key,localStorage.getItem(key)]));
    try{for(const [key,value] of records)value===null?localStorage.removeItem(key):localStorage.setItem(key,JSON.stringify(value));}
    catch(error){for(const [key,value] of previous){try{value===null?localStorage.removeItem(key):localStorage.setItem(key,value);}catch{}}throw error;}
}
async function applyReviewedAdminAction(){
    if(adminActionBusy||!adminPendingAction)return;
    const proposal=adminPendingAction,reason=sanitizeField(document.getElementById('adminActionReason').value,160);
    if(reason.length<3){document.getElementById('adminActionError').textContent='Add a short reason (at least 3 characters).';document.getElementById('adminActionReason').focus();return;}
    const button=document.getElementById('adminConfirmAction');adminActionBusy=true;button.disabled=true;
    try{
        const fresh=validSupabaseConfig()?siteUsers:loadSiteUsers();
        const actor=fresh?.find(user=>user.id===currentUserId);
        if(!actor||actor.id!==proposal.actorId)throw new Error('Your session changed. Review this action again.');
        const targets=proposal.targets.map(before=>{
            const target=fresh.find(user=>user.id===before.id);
            if(!AccountPolicy.canManage(actor,target,proposal.action==='role'?proposal.role:null)||(proposal.action==='delete'&&!isDev(actor)))throw new Error('Permissions changed. Review the account again.');
            if(target.role!==before.role||target.banned!==before.banned)throw new Error('An account changed after your review. Cancel and review the latest state.');
            return target;
        });
        if(validSupabaseConfig()){
            if(!adminCloudConnected||cloudAuthUserId!==actor.id)throw new Error('Reconnect to administration before applying changes.');
            const {error}=await cloud.rpc('spectral_admin_apply',{p_targets:proposal.targets,p_action:proposal.action,p_role:proposal.role,p_reason:reason});
            if(error)throw new Error('Server rejected the change. Refresh the directory and review your permissions.');
            if(currentUserId!==actor.id)return;
            await loadAdminCloud();
        }else{
            const ids=new Set(targets.map(user=>user.id));
            const next=fresh.filter(user=>proposal.action!=='delete'||!ids.has(user.id)).map(user=>!ids.has(user.id)?user:proposal.action==='role'?{...user,role:proposal.role,roleSource:'admin'}:{...user,banned:proposal.action==='ban'});
            const entry={id:crypto.randomUUID(),createdAt:new Date().toISOString(),actorId:actor.id,actorName:actor.username,action:proposal.action,reason,changes:targets.map(user=>({id:user.id,username:user.username,before:proposal.action==='role'?user.role:user.banned?'Restricted':'Active',after:proposal.action==='role'?proposal.role:proposal.action==='delete'?'Deleted':proposal.action==='ban'?'Restricted':'Active'}))};
            const records=new Map([[K_USERS,next],[K_ADMIN_AUDIT,[...adminAuditEntries(),entry].slice(-200)]]);
            if(proposal.action==='delete'){
                const styles=loadProfileStyles(),previews=loadDevRolePreviews();
                for(const id of ids){records.set(K_MC_PFX+id,null);records.set(K_MC_ACT+id,null);delete styles[id];delete previews[id];}
                records.set(K_PROFILE_STYLES,styles);records.set(K_DEV_ROLE_PREVIEWS,previews);
                records.set(K_ROLE_ORDERS,loadRoleOrders().filter(order=>!ids.has(order.userId)));
                records.set(K_FRIENDS,friendships.filter(item=>!ids.has(item.requester)&&!ids.has(item.addressee)));
                records.set(K_FORUM,forumPosts.filter(post=>!ids.has(post.authorId)).map(post=>({...post,upvotes:(post.upvotes||[]).filter(id=>!ids.has(id))})));
            }
            persistAdminRecords(records);siteUsers=next;
            if(proposal.action==='delete'){friendships=records.get(K_FRIENDS);forumPosts=records.get(K_FORUM);}
        }
        if(currentUserId!==proposal.actorId)return;
        cancelAdminAction();adminSelectedUserIds.clear();refreshAdmin();renderAdminAudit();renderAll();showToast('Reviewed changes saved.','check');
    }catch(error){document.getElementById('adminActionError').textContent=error.message||'Could not save the change. Try again.';}
    finally{adminActionBusy=false;button.disabled=false;}
}
async function loadAdminCloud(){
    const actor=currentRoleUser();if(!canAccessAdmin(actor)||!authAvailable())return;
    adminCloudConnected=false;
    adminCloudError='';
    try{
        const {data,error}=await cloud.rpc('spectral_admin_snapshot');
        if(error||!data)throw new Error('Server administration is unavailable. Install the administration migration to enable roles, bans and activity history.');
        if(currentUserId!==actor.id)return;
        const profiles=(data.users||[]).map(row=>cloudProfileToUser(row)).filter(Boolean);
        adminCloudIds=new Set(profiles.map(user=>user.id));
        profiles.forEach(user=>{const index=siteUsers.findIndex(item=>item.id===user.id);if(index<0)siteUsers.push(user);else siteUsers[index]={...siteUsers[index],...user};});
        adminRemoteAudit=Array.isArray(data.audit)?data.audit:[];adminCloudConnected=true;adminCloudError='';
        refreshAdmin();renderAdminAudit();
    }catch(error){adminCloudIds.clear();adminCloudError=error.message;const legacy=document.getElementById('adminUsersList');if(legacy){legacy.innerHTML=`<div class="admin-empty-state"><i class="fas fa-plug-circle-exclamation"></i><h3>Administration needs a connection</h3><p>${esc(error.message)}</p><button type="button" id="retryAdminConnection">Retry</button></div>`;document.getElementById('retryAdminConnection')?.addEventListener('click',loadAdminCloud);}refreshAdmin();}
}
function renderAdminPagination(total){
    const pages=Math.max(1,Math.ceil(total/ADMIN_PAGE_SIZE));
    document.getElementById('adminPagination').innerHTML=`<span>${total} results · Page ${adminPage} of ${pages}</span><div><button type="button" data-admin-page="-1" ${adminPage===1?'disabled':''} aria-label="Previous page"><i class="fas fa-arrow-left"></i></button><button type="button" data-admin-page="1" ${adminPage===pages?'disabled':''} aria-label="Next page"><i class="fas fa-arrow-right"></i></button></div>`;
}
document.getElementById('adminPagination')?.addEventListener('click',event=>{const button=event.target.closest('[data-admin-page]');if(!button||button.disabled)return;adminPage+=Number(button.dataset.adminPage);adminSelectedUserIds.clear();renderAdminUsers();});
document.getElementById('adminCancelAction')?.addEventListener('click',cancelAdminAction);
document.getElementById('adminConfirmAction')?.addEventListener('click',applyReviewedAdminAction);
document.getElementById('adminSubtabs')?.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const tabs=[...event.currentTarget.querySelectorAll('[data-stab]')],index=tabs.indexOf(document.activeElement);if(index<0)return;
    event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();openAdminSection(tabs[next].dataset.stab);
});

function openAdminSection(target){
    if(!canAccessAdmin(currentRoleUser())||!['users','forum','activity','site-stats'].includes(target))return;
    adminActiveTab=target;
    document.querySelectorAll('.admin-stab').forEach(tab=>{
        const active=tab.getAttribute('data-stab')===target;
        tab.classList.toggle('active',active);
        tab.setAttribute('aria-selected',String(active));
        tab.setAttribute('role','tab');tab.tabIndex=active?0:-1;
        tab.id='adminTab-'+tab.dataset.stab;tab.setAttribute('aria-controls','adminSection-'+tab.dataset.stab);
    });
    document.querySelectorAll('.admin-stab-content').forEach(content=>{
        content.hidden=content.dataset.stabContent!==target;content.style.display=content.hidden?'none':'block';
        content.id='adminSection-'+content.dataset.stabContent;content.setAttribute('role','tabpanel');content.setAttribute('aria-labelledby','adminTab-'+content.dataset.stabContent);
    });
    if(target==='users')renderAdminUsers();
    if(target==='forum')renderAdminForum();
    if(target==='site-stats')renderAdminStats();
    if(target==='activity')renderAdminAudit();
}
document.querySelectorAll('.admin-stab').forEach(stab=>stab.addEventListener('click',()=>openAdminSection(stab.getAttribute('data-stab'))));

const adminSearchInput=document.getElementById('adminUserSearch');
const adminRoleFilter=document.getElementById('adminRoleFilter');
const adminStatusFilter=document.getElementById('adminStatusFilter');
const adminUserSort=document.getElementById('adminUserSort');
[adminSearchInput,adminRoleFilter,adminStatusFilter,adminUserSort].forEach(control=>{
    if(control)control.addEventListener(control.tagName==='INPUT'?'input':'change',()=>{adminPage=1;adminSelectedUserIds.clear();renderAdminUsers();});
});
const adminResetUserFilters=document.getElementById('adminResetUserFilters');
if(adminResetUserFilters)adminResetUserFilters.addEventListener('click',()=>{
    if(adminSearchInput)adminSearchInput.value='';
    if(adminRoleFilter)adminRoleFilter.value='';
    if(adminStatusFilter)adminStatusFilter.value='';
    if(adminUserSort)adminUserSort.value='role';
    adminPage=1;adminSelectedUserIds.clear();renderAdminUsers();
});
const adminForumSearch=document.getElementById('adminForumSearch');
if(adminForumSearch)adminForumSearch.addEventListener('input',renderAdminForum);
document.querySelectorAll('[data-admin-forum-filter]').forEach(button=>button.addEventListener('click',()=>{
    adminForumFilter=button.dataset.adminForumFilter||'all';
    document.querySelectorAll('[data-admin-forum-filter]').forEach(item=>item.classList.toggle('active',item===button));
    renderAdminForum();
}));
const adminAnalyticsRefresh=document.getElementById('adminAnalyticsRefresh');
if(adminAnalyticsRefresh)adminAnalyticsRefresh.addEventListener('click',()=>{
    adminAnalyticsRefresh.classList.add('is-loading');
    renderAdminStats();
    setTimeout(()=>adminAnalyticsRefresh.classList.remove('is-loading'),450);
});
document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'&&adminActiveTab==='users'&&document.getElementById('profilePanelAdmin')?.hidden===false&&canAccessAdmin(currentRoleUser())&&dashOverlay?.classList.contains('open')){
        event.preventDefault();
        adminSearchInput?.focus();
    }
});

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
function registeredWithinDays(s,days){return AccountPolicy.recent(parseRegDate(s),days*86400000);}
function isRecentlyActive(iso,days){return AccountPolicy.recent(iso,days*86400000);}
function isOnlineNow(iso){return AccountPolicy.recent(iso,15*60000);}
function canAdminManageTarget(viewer,target){return (!validSupabaseConfig()||adminCloudConnected)&&AccountPolicy.canManage(viewer,target);}
function adminAllowedRoles(viewer){return ROLE_ORDER.filter(role=>viewer&&!viewer.banned&&roleRank(viewer.role)>=20&&(isDev(viewer)||roleRank(role)<roleRank(viewer.role)));}
function safeMcAccountExport(account){
    const copy={...account};delete copy.password;delete copy.accessToken;delete copy.refreshToken;
    return copy;
}
function safeUserExport(user){
    const copy={...user};delete copy.password;
    return {...copy,minecraftProfiles:(loadMcAccounts(user.id)||[]).map(safeMcAccountExport)};
}
function downloadJson(filename,data){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download=filename;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function exportDatabase(){
    const data={ exportedAt:new Date().toISOString(), users:siteUsers.map(u=>{const c={...u};delete c.password;return c;}), mcAccounts:{}, forum:forumPosts, news:newsItems };
    siteUsers.forEach(u=>{ data.mcAccounts[u.id]=(loadMcAccounts(u.id)||[]).map(safeMcAccountExport); });
    downloadJson('spectral-db-'+new Date().toISOString().slice(0,10)+'.json',data);
}
function exportAdminUsers(users,label='users'){
    if(!users.length){showToast('Select at least one user','circle-info');return;}
    downloadJson(`spectral-${label}-${new Date().toISOString().slice(0,10)}.json`,{exportedAt:new Date().toISOString(),users:users.map(safeUserExport)});
    showToast(`${users.length} user${users.length===1?'':'s'} exported`,'file-export');
}
function refreshAdmin(){
    updateAdminOverview();
    renderAdminUsers();
    if(adminActiveTab==='forum')renderAdminForum();
    if(adminActiveTab==='site-stats')renderAdminStats();
}

function renderAdminPanel() {
    if(!canAccessAdmin(currentRoleUser()))return;
    adminSelectedUserIds.clear();
    updateAdminOverview();
    populateAdminBulkRoles();
    openAdminSection(adminActiveTab);
    if(validSupabaseConfig())loadAdminCloud();
}
function updateAdminOverview(){
    const viewer=siteUsers.find(user=>user.id===currentUserId);
    const pending=forumPosts.filter(post=>!post.approved&&!post.rejected).length;
    const values={adminOverviewUsers:adminDataset().length,adminOverviewActive:adminDataset().filter(user=>isRecentlyActive(user.lastSeen,7)).length,adminOverviewPending:pending,adminOverviewBanned:adminDataset().filter(user=>user.banned).length,adminUsersTabCount:adminDataset().length,adminForumTabCount:pending};
    Object.entries(values).forEach(([id,value])=>{const element=document.getElementById(id);if(element)element.textContent=String(value);});
    const access=document.getElementById('adminAccessBadge');
    if(access&&viewer){const info=roleInfo(viewer.role);access.innerHTML=`<i class="${info.icon}"></i> ${esc(info.label)} access`;}
    const note=document.getElementById('adminModeNote');if(note)note.textContent=validSupabaseConfig()?'Cloud accounts: roles and bans are checked and applied by the server. The directory shows up to 250 profiles.':'Local demo: changes affect accounts in this browser. Role checks here do not secure a remote service.';
    const cloudState=document.getElementById('adminCloudState');
    if(cloudState){cloudState.classList.toggle('is-cloud',Boolean(cloudAuthUserId));cloudState.innerHTML=validSupabaseConfig()?(adminCloudConnected?'<i></i> Server verified':'<i></i> Connecting to administration'):'<i></i> Local demo data';}
}
function populateAdminBulkRoles(){
    const select=document.getElementById('adminBulkRole');if(!select)return;
    const viewer=siteUsers.find(user=>user.id===currentUserId);
    select.innerHTML='<option value="">Choose role...</option>'+adminAllowedRoles(viewer).map(role=>`<option value="${role}">${ROLES[role].label}</option>`).join('');
}
function adminDataset(){return validSupabaseConfig()?siteUsers.filter(user=>adminCloudIds.has(user.id)):siteUsers;}
function getAdminFilteredUsers(){
    const search=(adminSearchInput?.value||'').trim().toLowerCase();
    const role=adminRoleFilter?.value||'';
    const status=adminStatusFilter?.value||'';
    const sort=adminUserSort?.value||'role';
    const users=adminDataset().filter(user=>{
        const haystack=[user.username,user.displayName,user.bio,user.email].join(' ').toLowerCase();
        if(search&&!haystack.includes(search))return false;
        if(role&&user.role!==role)return false;
        if(status==='online'&&!isOnlineNow(user.lastSeen))return false;
        if(status==='active'&&!isRecentlyActive(user.lastSeen,7))return false;
        if(status==='banned'&&!user.banned)return false;
        if(status==='inactive'&&isRecentlyActive(user.lastSeen,30))return false;
        return true;
    });
    const sorts={
        role:(a,b)=>roleRank(b.role)-roleRank(a.role)||(a.username||'').localeCompare(b.username||''),
        recent:(a,b)=>(new Date(b.lastSeen||0).getTime()||0)-(new Date(a.lastSeen||0).getTime()||0),
        joined:(a,b)=>parseRegDate(b.registeredAt)-parseRegDate(a.registeredAt),
        time:(a,b)=>(b.totalTimeSec||0)-(a.totalTimeSec||0),
        name:(a,b)=>(a.displayName||a.username||'').localeCompare(b.displayName||b.username||'')
    };
    return users.sort(sorts[sort]||sorts.role);
}
function selectedAdminUsers(){
    const viewer=siteUsers.find(user=>user.id===currentUserId);
    const selected=siteUsers.filter(user=>adminSelectedUserIds.has(user.id)&&canAdminManageTarget(viewer,user));
    const valid=new Set(selected.map(user=>user.id));
    [...adminSelectedUserIds].forEach(id=>{if(!valid.has(id))adminSelectedUserIds.delete(id);});
    return selected;
}
function updateAdminBulkBar(){
    const selected=selectedAdminUsers();
    const bar=document.getElementById('adminBulkBar');
    const count=document.getElementById('adminSelectedCount');
    if(bar)bar.hidden=selected.length===0;
    if(count)count.textContent=`${selected.length} selected`;
}
function renderAdminUserInspector(user){
    const panel=document.getElementById('adminUserInspector');if(!panel)return;
    if(!user){panel.innerHTML='<div class="admin-inspector-empty"><span><i class="fas fa-user-gear"></i></span><h3>Select a user</h3><p>Open any account to inspect its activity, identities and access level.</p></div>';return;}
    const profiles=loadMcAccounts(user.id)||[];
    const info=roleInfo(user.role);
    const profileRows=profiles.slice(0,4).map(account=>`<div class="admin-inspector-profile"><span><i class="${typeIcon(account.type)}"></i></span><div><b>${esc(account.username||'Unnamed')}</b><small>${esc(typeLabel(account.type))}</small></div></div>`).join('');
    panel.innerHTML=`
        <div class="admin-inspector-top"><span>Account details</span><button type="button" data-inspector-close aria-label="Close details"><i class="fas fa-times"></i></button></div>
        <div class="admin-inspector-identity"><div class="admin-inspector-avatar"><img src="${esc(siteAvatarUrl(user))}" width="100" height="100" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback alt=""><i class="${isOnlineNow(user.lastSeen)?'online':''}"></i></div><div><small>@${esc(user.username)}</small><h3>${esc(user.displayName||user.username)}</h3>${roleBadgeHtml(user.role)||'<span class="role-badge role-user"><i class="fas fa-user"></i> Player</span>'}</div></div>
        <p class="admin-inspector-bio">${esc(user.bio||'No biography has been added yet.')}</p>
        <div class="admin-inspector-access"><span style="--role-color:${info.color}"><i class="${info.icon}"></i></span><div><small>Access level</small><b>${esc(info.label)}</b></div><em>${user.banned?'Banned':isOnlineNow(user.lastSeen)?'Online':timeAgo(user.lastSeen)}</em></div>
        <div class="admin-inspector-stats"><div><b>${formatDuration(user.totalTimeSec)}</b><small>Site time</small></div><div><b>${user.visitCount||0}</b><small>Visits</small></div><div><b>${profiles.length}</b><small>MC profiles</small></div><div><b>${getFriends(user.id).length}</b><small>Friends</small></div></div>
        <div class="admin-inspector-section"><div class="admin-inspector-section-head"><span>Minecraft identities</span><b>${profiles.length}</b></div>${profileRows||'<p class="admin-inspector-muted">No Minecraft profiles</p>'}${profiles.length>4?`<p class="admin-inspector-more">+${profiles.length-4} more profiles</p>`:''}</div>
        <div class="admin-inspector-meta"><span><small>Registered</small><b>${esc(user.registeredAt||'Unknown')}</b></span><span><small>Email</small><b>${esc(user.email||'Not provided')}</b></span><span><small>User ID</small><code>${esc(user.id)}</code></span></div>
        <div class="admin-inspector-actions"><button type="button" data-inspector-copy><i class="fas fa-copy"></i> Copy ID</button><button type="button" data-inspector-export><i class="fas fa-file-export"></i> Export user</button></div>`;
    panel.querySelector('[data-inspector-close]')?.addEventListener('click',()=>{adminInspectedUserId=null;renderAdminUserInspector(null);document.querySelectorAll('.admin-user-row').forEach(row=>row.classList.remove('is-inspected'));});
    panel.querySelector('[data-inspector-copy]')?.addEventListener('click',()=>copyLocalText(user.id,'User ID copied'));
    panel.querySelector('[data-inspector-export]')?.addEventListener('click',()=>exportAdminUsers([user],`user-${String(user.username||'account').replace(/[^a-z0-9_-]/gi,'-')}`));
}
function renderAdminUsers() {
    const list=document.getElementById('adminUsersList');
    if(!list)return;
    const viewer=siteUsers.find(u=>u.id===currentUserId);
    const allUsers=getAdminFilteredUsers();
    adminPage=Math.min(adminPage,Math.max(1,Math.ceil(allUsers.length/ADMIN_PAGE_SIZE)));
    const users=allUsers.slice((adminPage-1)*ADMIN_PAGE_SIZE,adminPage*ADMIN_PAGE_SIZE);
    renderAdminPagination(allUsers.length);
    const resultCount=document.getElementById('adminUserResultCount');
    const selectAllWrap=document.getElementById('adminSelectAllWrap');
    const selectAll=document.getElementById('adminSelectAllUsers');
    const manageableUsers=users.filter(user=>canAdminManageTarget(viewer,user));

    if(resultCount)resultCount.textContent=`${allUsers.length} ${allUsers.length===1?'user':'users'} · showing ${users.length}`;
    if(selectAllWrap)selectAllWrap.hidden=!manageableUsers.length;
    if(selectAll){
        const selectedVisible=manageableUsers.filter(user=>adminSelectedUserIds.has(user.id)).length;
        selectAll.checked=Boolean(manageableUsers.length&&selectedVisible===manageableUsers.length);
        selectAll.indeterminate=Boolean(selectedVisible&&selectedVisible<manageableUsers.length);
    }

    list.innerHTML='';
    if(!users.length){
        adminInspectedUserId=null;
        list.innerHTML='<div class="admin-empty admin-empty-state"><i class="fas fa-user-slash"></i><strong>No users found</strong><span>Try another query or clear the filters.</span></div>';
        renderAdminUserInspector(null);
        updateAdminBulkBar();
        return;
    }
    if(!users.some(user=>user.id===adminInspectedUserId))adminInspectedUserId=users[0].id;

    users.forEach(user=>{
        const manageable=canAdminManageTarget(viewer,user);
        const isSelf=user.id===currentUserId;
        const isSelected=adminSelectedUserIds.has(user.id);
        const isInspected=user.id===adminInspectedUserId;
        const online=isOnlineNow(user.lastSeen);
        const recent=isRecentlyActive(user.lastSeen,7);
        const mcCount=(loadMcAccounts(user.id)||[]).length;
        const allowedRoles=adminAllowedRoles(viewer);
        const roleOptions=allowedRoles.map(role=>`<option value="${role}"${user.role===role?' selected':''}>${esc(ROLES[role].label)}</option>`).join('');
        const roleControl=manageable
            ? `<select class="admin-role-select" aria-label="Role for ${esc(user.username)}">${roleOptions}</select>`
            : '<span class="admin-role-locked" title="You cannot manage this role"><i class="fas fa-lock"></i></span>';
        const badge=user.banned
            ? '<span class="role-badge role-banned"><i class="fas fa-ban"></i> Banned</span>'
            : roleBadgeHtml(user.role);
        const row=document.createElement('article');
        row.className=`admin-user-row${user.banned?' is-banned':''}${isSelected?' is-selected':''}${isInspected?' is-inspected':''}`;
        row.dataset.uid=user.id;
        row.innerHTML=`
            <div class="admin-user-picker">
                ${manageable?`<input class="admin-user-check" type="checkbox" aria-label="Select ${esc(user.username)}" ${isSelected?'checked':''}>`:'<i class="fas fa-shield-halved" title="Protected account"></i>'}
            </div>
            <div class="admin-user-avatar-wrap">
                <img class="admin-user-avatar" src="${esc(siteAvatarUrl(user))}" width="100" height="100" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback alt="">
                <span class="admin-presence ${online?'is-online':recent?'is-recent':''}" title="${online?'Online now':recent?'Recently active':'Offline'}"></span>
            </div>
            <div class="admin-user-main">
                <div class="admin-user-name-row">
                    <strong class="admin-user-name">${esc(user.displayName||user.username)}</strong>
                    ${badge}
                    ${isSelf?'<span class="admin-you-pill">You</span>':''}
                </div>
                <div class="admin-user-handle">@${esc(user.username)} <span>·</span> ${esc(user.bio||'No bio yet')}</div>
                <div class="admin-user-stats">
                    <span title="Minecraft identities"><i class="fas fa-cube"></i> ${mcCount} MC</span>
                    <span title="Total time on site"><i class="fas fa-clock"></i> ${formatDuration(user.totalTimeSec)}</span>
                    <span title="Visits"><i class="fas fa-right-to-bracket"></i> ${user.visitCount||0}</span>
                    <span title="Last seen"><i class="fas fa-eye"></i> ${timeAgo(user.lastSeen)}</span>
                </div>
            </div>
            <div class="admin-user-controls">
                <div class="admin-role-control">${roleControl}</div>
                <div class="admin-user-actions">
                    <button class="admin-act-btn inspect" data-act="inspect" type="button" aria-label="Inspect user"><i class="fas fa-arrow-right"></i></button>
                    ${manageable?`<button class="admin-act-btn ${user.banned?'unban':'ban'}" data-act="ban" type="button"><i class="fas fa-${user.banned?'unlock':'ban'}"></i><span>${user.banned?'Unban':'Ban'}</span></button>`:''}
                    ${isDev(viewer)&&!isSelf&&!validSupabaseConfig()?'<button class="admin-act-btn del" data-act="del" type="button" aria-label="Delete user"><i class="fas fa-trash-alt"></i></button>':''}
                </div>
            </div>`;

        const check=row.querySelector('.admin-user-check');
        if(check)check.addEventListener('change',event=>{
            event.stopPropagation();
            if(check.checked)adminSelectedUserIds.add(user.id);else adminSelectedUserIds.delete(user.id);
            renderAdminUsers();
        });
        const roleSelect=row.querySelector('.admin-role-select');
        if(roleSelect)roleSelect.addEventListener('change',event=>{
            event.stopPropagation();
            const target=siteUsers.find(candidate=>candidate.id===user.id);
            const actor=siteUsers.find(candidate=>candidate.id===currentUserId);
            if(!target||!canAdminManageTarget(actor,target)||!adminAllowedRoles(actor).includes(roleSelect.value)){
                showToast('This account is protected by the role hierarchy.','triangle-exclamation');
                renderAdminUsers();
                return;
            }
            reviewAdminAction('role',[target.id],roleSelect.value);
            roleSelect.value=target.role;
        });
        const inspect=()=>{
            adminInspectedUserId=user.id;
            renderAdminUsers();
        };
        row.querySelector('[data-act="inspect"]')?.addEventListener('click',event=>{event.stopPropagation();inspect();});
        row.addEventListener('click',event=>{
            if(event.target.closest('button,select,input'))return;
            inspect();
        });
        const banButton=row.querySelector('[data-act="ban"]');
        if(banButton)banButton.addEventListener('click',event=>{
            event.stopPropagation();
            const target=siteUsers.find(candidate=>candidate.id===user.id);
            const actor=siteUsers.find(candidate=>candidate.id===currentUserId);
            if(!target||!canAdminManageTarget(actor,target))return showToast('This account is protected.','triangle-exclamation');
            reviewAdminAction(target.banned?'unban':'ban',[target.id]);
        });
        const deleteButton=row.querySelector('[data-act="del"]');
        if(deleteButton)deleteButton.addEventListener('click',event=>{
            event.stopPropagation();
            reviewAdminAction('delete',[user.id]);
        });
        list.appendChild(row);
    });

    renderAdminUserInspector(users.find(user=>user.id===adminInspectedUserId)||users[0]);
    updateAdminBulkBar();
}

const adminSelectAllControl=document.getElementById('adminSelectAllUsers');
adminSelectAllControl?.addEventListener('change',()=>{
    const viewer=siteUsers.find(user=>user.id===currentUserId);
    getAdminFilteredUsers().slice((adminPage-1)*ADMIN_PAGE_SIZE,adminPage*ADMIN_PAGE_SIZE).filter(user=>canAdminManageTarget(viewer,user)).forEach(user=>{
        if(adminSelectAllControl.checked)adminSelectedUserIds.add(user.id);else adminSelectedUserIds.delete(user.id);
    });
    renderAdminUsers();
});
document.getElementById('adminBulkClear')?.addEventListener('click',()=>{
    adminSelectedUserIds.clear();
    renderAdminUsers();
});
document.getElementById('adminBulkApplyRole')?.addEventListener('click',()=>reviewAdminAction('role',selectedAdminUsers().map(user=>user.id),document.getElementById('adminBulkRole').value));
document.getElementById('adminBulkBan')?.addEventListener('click',()=>reviewAdminAction('ban',selectedAdminUsers().filter(user=>!user.banned).map(user=>user.id)));
document.getElementById('adminBulkUnban')?.addEventListener('click',()=>reviewAdminAction('unban',selectedAdminUsers().filter(user=>user.banned).map(user=>user.id)));
document.getElementById('adminBulkExport')?.addEventListener('click',()=>{
    const targets=selectedAdminUsers();
    if(!targets.length)return showToast('Select users to export.','triangle-exclamation');
    exportAdminUsers(targets,'selected-users');
});

function renderAdminForum() {
    if(!canModerate(currentRoleUser()))return;
    const list=document.getElementById('adminForumList');
    if(!list)return;
    updateAdminOverview();
    if(validSupabaseConfig()){list.innerHTML='<div class="admin-empty-state"><i class="fas fa-comments"></i><h3>Local community preview</h3><p>This project has no cloud forum service. Moderation is available in local demo mode.</p></div>';return;}
    const query=(document.getElementById('adminForumSearch')?.value||'').trim().toLowerCase();
    const statusOf=post=>post.rejected?'rejected':post.approved?'approved':'pending';
    const statusPriority={pending:0,approved:1,rejected:2};
    const posts=forumPosts.filter(post=>{
        const status=statusOf(post);
        const matchesStatus=adminForumFilter==='all'||status===adminForumFilter;
        const haystack=`${post.title||''} ${post.text||''} ${post.authorName||''}`.toLowerCase();
        return matchesStatus&&(!query||haystack.includes(query));
    }).sort((a,b)=>statusPriority[statusOf(a)]-statusPriority[statusOf(b)]||String(b.date||'').localeCompare(String(a.date||'')));
    const count=document.getElementById('adminForumResultCount');
    if(count)count.textContent=`${posts.length} ${posts.length===1?'post':'posts'}`;
    list.innerHTML='';
    if(!posts.length){
        list.innerHTML='<div class="admin-empty admin-empty-state"><i class="fas fa-inbox"></i><strong>Queue is clear</strong><span>No posts match the current view.</span></div>';
        return;
    }
    posts.forEach(post=>{
        const status=statusOf(post);
        const statusLabel=status[0].toUpperCase()+status.slice(1);
        const item=document.createElement('article');
        item.className=`admin-forum-item is-${status}`;
        item.innerHTML=`
            <div class="admin-forum-item-head">
                <div class="admin-forum-signal"><i class="fas fa-${status==='pending'?'clock':status==='approved'?'check':'xmark'}"></i></div>
                <div class="admin-forum-copy">
                    <div class="admin-forum-title-row">
                        <h4 class="admin-forum-title">${esc(post.title||'Untitled idea')}</h4>
                        <span class="admin-forum-status afs-${status}">${statusLabel}</span>
                    </div>
                    <div class="admin-forum-meta">by ${esc(post.authorName||'Unknown')} <span>·</span> ${esc(post.date||'No date')} <span>·</span> ${(post.upvotes||[]).length} upvote${(post.upvotes||[]).length===1?'':'s'}</div>
                </div>
            </div>
            <p class="admin-forum-preview">${esc(String(post.text||'').slice(0,220))}${String(post.text||'').length>220?'…':''}</p>
            <div class="admin-forum-actions">
                ${status!=='approved'?`<button class="admin-forum-approve" data-action="approve" type="button"><i class="fas fa-check"></i> ${status==='rejected'?'Restore':'Approve'}</button>`:''}
                ${status!=='rejected'?'<button class="admin-forum-reject" data-action="reject" type="button"><i class="fas fa-xmark"></i> Reject</button>':''}
                <button class="admin-forum-delete" data-action="delete" type="button"><i class="fas fa-trash-alt"></i> Delete</button>
            </div>`;
        item.querySelector('[data-action="approve"]')?.addEventListener('click',()=>{
            if(!canModerate(currentRoleUser())||validSupabaseConfig())return;
            const target=forumPosts.find(candidate=>candidate.id===post.id);
            if(!target)return;
            target.approved=true;
            target.rejected=false;
            saveForum(forumPosts);
            renderAdminForum();
            renderForum();
            showToast('Post approved.','check');
        });
        item.querySelector('[data-action="reject"]')?.addEventListener('click',()=>{
            if(!canModerate(currentRoleUser())||validSupabaseConfig())return;
            const target=forumPosts.find(candidate=>candidate.id===post.id);
            if(!target)return;
            target.approved=false;
            target.rejected=true;
            saveForum(forumPosts);
            renderAdminForum();
            renderForum();
            showToast('Post moved to rejected.','check');
        });
        item.querySelector('[data-action="delete"]')?.addEventListener('click',()=>{
            showConfirm('Delete this idea permanently?',()=>{
                if(!canModerate(currentRoleUser())||validSupabaseConfig())return;
                forumPosts=forumPosts.filter(candidate=>candidate.id!==post.id);
                saveForum(forumPosts);
                renderAdminForum();
                renderForum();
            });
        });
        list.appendChild(item);
    });
}

function renderAdminStats() {
    const grid=document.getElementById('adminStatsGrid');if(!grid)return;
    updateAdminOverview();
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
    const topRows=top.map((u,i)=>`<div class="lead-row"><span class="lead-rank">#${i+1}</span><img class="lead-av" src="${esc(siteAvatarUrl(u))}" alt="${esc(u.displayName||u.username)}" width="100" height="100" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback><span class="lead-name">${esc(u.displayName||u.username)} ${roleBadgeHtml(u.role)}</span><span class="lead-time">${formatDuration(u.totalTimeSec)}</span></div>`).join('');
    const recent=siteUsers.slice().sort((a,b)=>parseRegDate(b.registeredAt)-parseRegDate(a.registeredAt)).slice(0,5);
    const recentRows=recent.map(u=>`<div class="lead-row"><img class="lead-av" src="${esc(siteAvatarUrl(u))}" alt="${esc(u.displayName||u.username)}" width="100" height="100" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback><span class="lead-name">${esc(u.displayName||u.username)} ${roleBadgeHtml(u.role)}</span><span class="lead-time">${esc(u.registeredAt||'?')}</span></div>`).join('');

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
                <button class="dev-tool-btn" id="devReloadBtn" ${cloudAuthUserId?'':'disabled'}><i class="fas fa-rotate"></i> Reload My Account</button>
                <button class="dev-tool-btn danger" id="devResetBtn"><i class="fas fa-triangle-exclamation"></i> Reset Local Data</button>
            </div>
            <p class="dev-tools-note">Remote scope: <code>${cloudAuthUserId?'authenticated account only':'none — local demo only'}</code></p>
        </div>`;

    const ex=document.getElementById('devExportBtn'); if(ex)ex.addEventListener('click',exportDatabase);
    const rl=document.getElementById('devReloadBtn'); if(rl)rl.addEventListener('click',async()=>{if(!cloudAuthUserId)return;rl.disabled=true;rl.innerHTML='<i class="fas fa-rotate fa-spin"></i> Reloading...';try{const {data}=await cloud.auth.getSession();await cloudBootstrap(data?.session?.user||null);if(dashOverlay&&dashOverlay.classList.contains('open')){updateAdminOverview();openAdminSection('site-stats');}}catch(error){console.warn('[cloud] manual reload failed:',error.message||error);showToast('Account sync failed','triangle-exclamation');}finally{rl.disabled=false;rl.innerHTML='<i class="fas fa-rotate"></i> Reload My Account';}});
    const rs=document.getElementById('devResetBtn'); if(rs)rs.addEventListener('click',()=>{ showConfirm('Clear ALL local demo data on this device? Authenticated remote data is not deleted.',()=>{ try{Object.keys(localStorage).filter(k=>k.startsWith('spectral_')).forEach(k=>localStorage.removeItem(k));}catch{} location.reload(); }); });
}
