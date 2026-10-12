// Account hub is a view layer over the existing account and role model.
const ACCOUNT_HUB_COPY={
    'my-profile':['Your profile','Shape the identity other players see.'],
    'role-store':['Roles & plans','Compare the collection and save a launch plan.'],
    'admin-panel':['Admin center','Review people, community ideas and activity.']
};

function renderAccountStudio(){
    const user=currentRoleUser();if(!user)return;
    const draft=profileDraftFor(user);
    const active=profileTabsV2?.querySelector('.profile-tab.active')?.dataset.ptab||'my-profile';
    const [title,subtitle]=ACCOUNT_HUB_COPY[active]||ACCOUNT_HUB_COPY['my-profile'];
    const text=(id,value)=>{const element=document.getElementById(id);if(element)element.textContent=value;};
    text('accountHubTitle',title);
    text('accountHubSubtitle',subtitle);
    text('accountHubName',user.displayName||user.username);
    text('accountHubRole',roleInfo(user.role).label);
    text('accountHubMode',validSupabaseConfig()?'Connected account':'Local demo');
    text('accountRailHint',profileIsDirty(user)?'Your profile has unsaved changes.':'Profile changes are saved when you press Save.');
    text('accountPreviewName',draft.displayName.trim()||user.username);
    text('accountPreviewStatus',draft.status.trim()||'Your status appears here');
    const hubAvatar=document.getElementById('accountHubAvatar');
    if(hubAvatar)hubAvatar.src=siteAvatarUrl(user);
    const previewAvatar=document.getElementById('accountPreviewAvatar');
    if(previewAvatar)previewAvatar.src=draft.avatar||siteAvatarUrl({...user,avatar:''});
    document.querySelectorAll('[data-account-status]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.accountStatus===draft.status)));
}

document.querySelector('.account-status-presets')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-account-status]');
    const user=currentRoleUser(),input=document.getElementById('profileStatus');
    if(!button||!user||!input)return;
    input.value=button.dataset.accountStatus;
    profileDraftFor(user).status=input.value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus();
});
document.getElementById('closeAccountHubBtn')?.addEventListener('click',closeDashboard);
