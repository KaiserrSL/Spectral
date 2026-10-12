// Drafts are kept in memory, scoped to the signed-in account, until saved/discarded.
const profileDrafts=new Map();
const PROFILE_FIELDS=['displayName','status','bio','avatar'];
let profileSaving=false;
let compareCategory='capacity';
function profileDraftFor(user){
    if(!profileDrafts.has(user.id))profileDrafts.set(user.id,{displayName:user.displayName||user.username,status:user.status||'',bio:user.bio||'',avatar:user.avatar||''});
    return profileDrafts.get(user.id);
}
function profileIsDirty(user){return !!user&&PROFILE_FIELDS.some(key=>profileDraftFor(user)[key]!==String(user[key]||(key==='displayName'?user.username:'')));}
function updateProfileDraftState(){
    const user=currentRoleUser();if(!user)return;
    const dirty=profileIsDirty(user);
    for(const id of ['profileDisplayName','profileStatus','profileBio']){
        const input=document.getElementById(id),count=document.getElementById(id+'Count');
        if(input&&count)count.textContent=`${input.value.length} / ${input.maxLength}`;
    }
    document.getElementById('saveProfileBtn').disabled=!dirty||profileSaving;
    document.getElementById('resetProfileBtn').disabled=!dirty||profileSaving;
    const state=document.getElementById('profileSaveState');
    state.textContent=profileSaving?'Saving your profile…':dirty?'Unsaved changes · kept while switching tabs':'All changes saved';
    state.classList.toggle('is-dirty',dirty);
    renderAccountStudio();
}
for(const [id,key] of [['profileDisplayName','displayName'],['profileStatus','status'],['profileBio','bio']]){
    document.getElementById(id)?.addEventListener('input',event=>{const user=currentRoleUser();if(!user)return;profileDraftFor(user)[key]=event.target.value;updateProfileDraftState();});
}
document.getElementById('resetProfileBtn')?.addEventListener('click',()=>{const user=currentRoleUser();if(!user)return;profileDrafts.delete(user.id);loadProfileViewData(user,{resetTab:false});});
document.getElementById('changeAvatarBtn')?.addEventListener('click',()=>document.getElementById('avatarUpload').click());
document.getElementById('removeAvatarBtn')?.addEventListener('click',()=>{const user=currentRoleUser();if(!user)return;profileDraftFor(user).avatar='';document.getElementById('profileAvatarImg').src=siteAvatarUrl({...user,avatar:''});updateProfileDraftState();document.getElementById('profileEditForm')?.requestSubmit();});
document.getElementById('profileEditForm')?.addEventListener('submit',async event=>{
    event.preventDefault();const user=currentRoleUser();if(!user||user.banned||profileSaving)return;
    const draft={...profileDraftFor(user)};
    const patch={displayName:sanitizeField(draft.displayName,24),status:sanitizeField(draft.status,100),bio:sanitizeField(draft.bio,120),avatar:safeAvatarUrl(draft.avatar)};
    if(!patch.displayName){document.getElementById('profileDisplayName').focus();showToast('Enter a display name.','circle-info');return;}
    profileSaving=true;updateProfileDraftState();
    try{
        if(validSupabaseConfig()){
            if(!cloudReady()||cloudAuthUserId!==user.id)throw new Error('Reconnect to save your profile. Your draft is still here.');
            const {error,data}=await cloud.from('site_users').update({display_name:patch.displayName,status:patch.status,bio:patch.bio,avatar:patch.avatar}).eq('id',user.id).select('id,avatar');
            if(error||!data?.some(row=>row.id===user.id&&row.avatar===patch.avatar))throw new Error('Profile could not be saved online. Please try again.');
        }
        if(currentUserId!==user.id)return;
        const next=siteUsers.map(item=>item.id===user.id?{...item,...patch}:item);
        try{localStorage.setItem(K_USERS,JSON.stringify(next));}catch{if(!validSupabaseConfig())throw new Error('Storage is full. Free some space and try again.');}
        siteUsers=next;
        // Edits entered while the request ran remain a draft.
        if(PROFILE_FIELDS.every(key=>profileDraftFor(user)[key]===draft[key]))profileDrafts.delete(user.id);
        renderNavbar();renderFriends();loadProfileViewData(currentRoleUser(),{resetTab:false});showToast('Profile saved.','check');
    }catch(error){showToast(error.message,'triangle-exclamation');document.getElementById('profileSaveState').textContent=error.message;}
    finally{profileSaving=false;updateProfileDraftState();}
});
function renderAccountSession(user){
    const online=validSupabaseConfig();
    document.getElementById('accountSessionDetails').innerHTML=`<div class="account-session-summary"><span class="session-orb"><i class="fas fa-${online?'shield-halved':'laptop'}"></i></span><div><strong>${online?'Connected account':'Local demo account'}</strong><p>${online?'Your profile uses authenticated cloud access.':'This identity exists in this browser. It is separate from a Minecraft or Microsoft account.'}</p></div><span class="session-state">${online?'Authenticated':'This device'}</span></div><dl class="account-detail-grid"><div><dt><i class="fas fa-at"></i> Sign-in name</dt><dd>${esc(user.username)}</dd></div><div><dt><i class="fas fa-id-badge"></i> Actual role</dt><dd>${esc(roleInfo(user.role).label)}</dd></div><div><dt><i class="fas fa-calendar-check"></i> Joined</dt><dd>${esc(user.registeredAt||'Unknown')}</dd></div><div><dt><i class="fas fa-lock"></i> Password recovery</dt><dd>${online?'Email reset link':'Unavailable for local demos'}</dd></div></dl>`;
    document.getElementById('accountRecoveryBtn').hidden=!online||!user.email;
}
document.getElementById('exportOwnAccount')?.addEventListener('click',()=>{
    const user=currentRoleUser();if(!user)return;
    downloadJson('spectral-my-account.json',{exportedAt:new Date().toISOString(),profile:safeUserExport(user),appearance:loadProfileStyles()[user.id]||{},launchChoice:loadRoleOrders().find(order=>order.userId===user.id)||null});
    showToast('Your account export is ready.','download');
});
document.getElementById('accountRecoveryBtn')?.addEventListener('click',async event=>{
    const user=currentRoleUser(),button=event.currentTarget;if(!authAvailable()||!user?.email)return;button.disabled=true;
    try{const {error}=await cloud.auth.resetPasswordForEmail(user.email,{redirectTo:authRedirectTo()});if(error)throw error;showToast('Check your inbox for a password reset link.','envelope');}catch{showToast('Reset email could not be sent. Try again.','triangle-exclamation');}finally{button.disabled=false;}
});
function renderRoleWorkspace(user){
    const role=roleInfo(user.role),accounts=loadMcAccounts(user.id)||[];
    document.getElementById('accountEntitlements').innerHTML=[['cubes','Launcher profiles',accounts.length,role.profileLimit],['star','Favorite profiles',accounts.filter(account=>account.favorite).length,role.favoriteLimit]].map(([icon,label,count,limit])=>`<article><span><i class="fas fa-${icon}"></i>${label}</span><b>${count} <small>/ ${formatRoleLimit(limit)}</small></b><div class="entitlement-track"><i style="width:${Number.isFinite(limit)?Math.min(100,count/limit*100):Math.min(100,count*5)}%"></i></div><small>${count>limit?'Above your current limit · remove profiles before adding more':`Included with your ${esc(role.label)} role`}</small></article>`).join('')+`<article><span><i class="fas fa-shield-halved"></i> Account permissions</span><b>${canAccessAdmin(user)?'Staff':'Player'}</b><small>${canManageUsers(user)?'Manage lower roles and community access':canModerate(user)?'Review community ideas':'Personal profile, friends and launcher identities'}</small></article>`;
    const reservation=loadRoleOrders().find(order=>order.userId===user.id),panel=document.getElementById('roleReservation');panel.hidden=!reservation;
    if(reservation)panel.innerHTML=`<span><i class="fas fa-bookmark"></i></span><div><small>SAVED ON THIS DEVICE</small><strong>${esc(roleInfo(reservation.role).label)} · ${reservation.billing}</strong><p>$${reservation.quotedPrice.toFixed(2)} indicative price · no active subscription</p></div><button type="button" data-cancel-reservation><i class="fas fa-xmark"></i> Remove choice</button>`;
    renderRoleComparison();
}
document.getElementById('roleReservation')?.addEventListener('click',event=>{if(!event.target.closest('[data-cancel-reservation]'))return;const user=currentRoleUser();if(!user)return;if(saveRoleOrders(loadRoleOrders().filter(order=>order.userId!==user.id))){renderRoleStore();showToast('Launch choice removed.','check');}else showToast('Could not remove your choice. Try again.','triangle-exclamation');});
function renderRoleComparison(){
    const user=currentRoleUser();if(!user)return;
    const keys=compareCategory==='permissions'?['USER','PRO','SPECTRAL','MODERATOR','ADMIN','DEV']:['USER','VETERAN','PRO','LEGEND','SPECTRAL'];
    const rows=compareCategory==='capacity'?[['Launcher profiles',key=>formatRoleLimit(roleProfileLimit(key))],['Favorite profiles',key=>formatRoleLimit(roleFavoriteLimit(key))],['Role source',key=>key==='VETERAN'?'Founder reward':PREMIUM_ROLES.includes(key)?'Planned premium':'Default']]:compareCategory==='appearance'?[['Signature header',key=>PROFILE_HEADERS[ROLE_DEFAULT_HEADERS[key]]?.label||'Included'],['Entrance',key=>PROFILE_ENTRANCES[ROLE_DEFAULT_ENTRANCES[key]]?.label||'Included'],['Community badge',key=>key==='USER'?'Standard identity':roleInfo(key).label]]:[['Manage own profile',()=>true],['Review ideas',key=>roleRank(key)>=10],['Manage lower roles',key=>roleRank(key)>=20],['Developer previews',key=>key==='DEV']];
    document.getElementById('roleComparisonGrid').innerHTML=`<table><thead><tr><th scope="col">${compareCategory==='permissions'?'Access':'Feature'}</th>${keys.map(key=>`<th scope="col" class="${key===user.role?'is-current':''}"><i class="${roleInfo(key).icon}"></i> ${esc(roleInfo(key).label)}${key===user.role?'<small>Your role</small>':''}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,read])=>`<tr><th scope="row">${label}</th>${keys.map(key=>{const value=read(key);return `<td>${typeof value==='boolean'?`<span class="permission-${value}"><i class="fas fa-${value?'check':'minus'}"></i><span class="sr-only">${value?'Included':'Not included'}</span></span>`:esc(value)}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
}
document.querySelectorAll('[data-compare]').forEach(button=>button.addEventListener('click',()=>{compareCategory=button.dataset.compare;document.querySelectorAll('[data-compare]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));renderRoleComparison();}));
