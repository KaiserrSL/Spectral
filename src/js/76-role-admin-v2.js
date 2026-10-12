/*
 * Account workspaces v2.
 * The old role/admin views shared several renderers and event listeners. This
 * file replaces those surfaces with two small state machines and one delegated
 * listener per panel. It intentionally keeps authorization helpers and storage
 * primitives from the core model, while owning all UI state itself.
 */
function replaceWorkspaceNode(selector){
    const current=document.querySelector(selector);
    if(!current)return null;
    const fresh=current.cloneNode(selector==='#profileTabs');
    fresh.removeAttribute('style');
    if(current.hidden||current.getAttribute('aria-hidden')==='true')fresh.hidden=true;
    current.replaceWith(fresh);
    return fresh;
}

const rolesPanelV2=replaceWorkspaceNode('#profilePanelRoles');
const adminPanelV2=replaceWorkspaceNode('#profilePanelAdmin');
const profileTabsV2=replaceWorkspaceNode('#profileTabs');

const rolesV2={cycle:'yearly',category:'capacity',quote:null,closeTimer:0};
const adminV2={tab:'users',page:1,pageSize:10,query:'',role:'',status:'',sort:'role',forumFilter:'pending',forumQuery:'',selected:new Set(),inspect:null,pending:null,forumPending:null,busy:false,loading:false};
const workspaceAnimations=new WeakMap();
const workspaceMotionSnapshots=new WeakMap();
let profileSwitchTimer=0;
let adminSwitchTimer=0;

function interruptWorkspaceMotion(element){
    if(!element)return;
    const animation=workspaceAnimations.get(element),fallback=element.classList.contains('workspace-reveal-fallback');
    if(animation?.playState==='running'||fallback){
        const style=getComputedStyle(element);
        workspaceMotionSnapshots.set(element,{transform:style.transform,opacity:style.opacity,at:performance.now()});
    }
    animation?.cancel();
    workspaceAnimations.delete(element);
    element.classList.remove('workspace-reveal-fallback');
}

function revealWorkspaceContent(element,direction=1,{distance=16,duration=360,fade=true}={}){
    if(!element)return;
    interruptWorkspaceMotion(element);
    const saved=workspaceMotionSnapshots.get(element);
    const snapshot=saved&&performance.now()-saved.at<500?saved:null;
    workspaceMotionSnapshots.delete(element);
    if(REDUCED_MOTION||liteOn())return;
    const startTransform=snapshot?.transform&&snapshot.transform!=='none'?snapshot.transform:`translate3d(${direction*distance}px,6px,0)`;
    const startOpacity=fade?Number(snapshot?.opacity??.82):1;
    if(typeof element.animate!=='function'){
        element.style.setProperty('--workspace-reveal-start',startTransform);
        element.style.setProperty('--workspace-reveal-opacity',String(startOpacity));
        void element.offsetWidth;
        element.classList.add('workspace-reveal-fallback');
        return;
    }
    const animation=element.animate([
        {opacity:startOpacity,transform:startTransform},
        {opacity:1,transform:'translate3d(0,0,0)'}
    ],{duration,easing:'cubic-bezier(.22,1,.36,1)'});
    workspaceAnimations.set(element,animation);
    animation.finished.catch(()=>{}).finally(()=>{if(workspaceAnimations.get(element)===animation)workspaceAnimations.delete(element);});
}

function workspaceIcon(icon){return `<i class="fas fa-${icon}" aria-hidden="true"></i>`;}
function workspaceRoleKeys(user){return isDev(user)?ROLE_ORDER:['VETERAN',...PREMIUM_ROLES];}
function workspaceRoleOrder(userId){return loadRoleOrders().find(order=>order.userId===userId&&order.status==='reserved')||null;}
function workspaceUser(){return siteUsers.find(user=>user.id===currentUserId)||null;}

function renderRolesShell(){
    if(!rolesPanelV2)return;
    rolesPanelV2.innerHTML=`<div class="roles-v2-shell">
        <header class="roles-v2-hero">
            <div class="workspace-signal-art" aria-hidden="true"><span class="signal-orbit"></span><span class="signal-core"></span><span class="signal-trace"></span></div>
            <div class="roles-v2-hero-copy"><span class="roles-v2-eyebrow">${workspaceIcon('wand-magic-sparkles')} ACCOUNT ROLES</span><h2>Make your space <em>your own.</em></h2><p>Explore each role, compare the limits that matter, and keep a favorite plan for launch.</p><div class="roles-v2-hero-points"><span>${workspaceIcon('sliders')} Clear limits</span><span>${workspaceIcon('sparkles')} Profile style</span><span>${workspaceIcon('shield-halved')} Verified access</span></div></div>
            <div class="roles-v2-current"><span id="rolesV2CurrentIcon">${workspaceIcon('user')}</span><div><small id="rolesV2CurrentLabel">Current role</small><strong id="rolesV2CurrentName">Player</strong><em id="rolesV2CurrentNote">Standard access</em></div></div>
        </header>
        <section id="rolesV2Entitlements" class="roles-v2-entitlements" aria-label="Current account limits"></section>
        <section id="developerRoleLab" class="roles-v2-preview" hidden></section>
        <section id="roleReservation" class="roles-v2-reservation" hidden aria-live="polite"></section>
        <div class="roles-v2-toolbar"><div><small>ROLE COLLECTION</small><h3>Choose your next chapter</h3><p>See the price and your actual account limits side by side.</p></div><div class="roles-v2-cycle" role="group" aria-label="Billing period"><button type="button" data-role-v2-cycle="monthly" aria-pressed="false">Monthly</button><button type="button" class="active" data-role-v2-cycle="yearly" aria-pressed="true">Yearly <b>-20%</b></button></div></div>
        <div id="roleStoreGrid" class="roles-v2-grid" aria-live="polite"></div>
        <section class="roles-v2-compare"><header><span>${workspaceIcon('table-cells-large')}</span><div><small>ONE CLEAR VIEW</small><h3>What changes with each role?</h3><p>Permissions stay separate from visual previews.</p></div></header><div class="roles-v2-compare-tabs" role="tablist" aria-label="Role comparison"><button type="button" data-role-v2-category="capacity" aria-selected="true">${workspaceIcon('cubes')} Capacity</button><button type="button" data-role-v2-category="appearance" aria-selected="false">${workspaceIcon('palette')} Appearance</button><button type="button" data-role-v2-category="permissions" aria-selected="false">${workspaceIcon('shield-halved')} Permissions</button></div><div id="roleComparisonGrid" class="roles-v2-table-wrap" tabindex="0"></div><p class="roles-v2-note">${workspaceIcon('circle-info')} A launch choice is saved locally and never grants a role. Staff access is assigned by the server.</p></section>
        <aside id="roleCheckoutSheet" class="roles-v2-checkout" hidden aria-live="polite"><button type="button" data-role-v2-close class="roles-v2-close" aria-label="Close role choice">×</button><span id="rolesV2CheckoutIcon">${workspaceIcon('star')}</span><div><small>PLAN PREVIEW · NO PAYMENT</small><h3 id="rolesV2CheckoutTitle">Choose Pro</h3><p id="rolesV2CheckoutText">Save a plan to revisit at launch. No charge or role activation happens here.</p></div><strong id="rolesV2CheckoutPrice">$0</strong><button type="button" data-role-v2-confirm class="roles-v2-confirm">Save plan ${workspaceIcon('arrow-right')}</button></aside>
    </div>`;
}

function renderRolesEntitlements(user){
    const el=document.getElementById('rolesV2Entitlements');if(!el)return;
    const info=roleInfo(user.role),mc=loadMcAccounts(user.id)||[],fav=mc.filter(item=>item.favorite).length;
    const metric=(icon,label,value,limit)=>`<article><span>${workspaceIcon(icon)} ${label}</span><strong>${value}<small> / ${formatRoleLimit(limit)}</small></strong><div><i style="width:${Number.isFinite(limit)?Math.min(100,(value/Math.max(1,limit))*100):Math.min(100,value*6)}%"></i></div><em>${esc(info.label)} access</em></article>`;
    el.innerHTML=metric('cubes','Launcher profiles',mc.length,info.profileLimit)+metric('star','Favorites',fav,info.favoriteLimit)+`<article><span>${workspaceIcon('shield-halved')} Permissions</span><strong>${canManageUsers(user)?'Admin':canModerate(user)?'Moderator':'Player'}</strong><em>${canManageUsers(user)?'Manage lower roles and access':canModerate(user)?'Review community queue':'Manage your own identities'}</em></article>`;
}

function renderRolesPreview(user,displayRole){
    const lab=document.getElementById('developerRoleLab');if(!lab)return;
    if(!isDev(user)){lab.hidden=true;lab.innerHTML='';return;}
    const role=roleInfo(displayRole);lab.hidden=false;lab.innerHTML=`<span>${workspaceIcon('flask-vial')}</span><div><small>DEVELOPER PREVIEW</small><strong>${esc(role.label)} appearance</strong><p>Only the visual preview changes. Your actual Developer permissions remain active.</p></div><button type="button" data-role-v2-reset ${displayRole==='DEV'?'disabled':''}>${workspaceIcon('rotate-left')} Reset</button>`;
}

function roleCard(user,key,index){
    const info=roleInfo(key),display=displayedRoleKey(user),developer=isDev(user),current=display===key,chosen=workspaceRoleOrder(user.id),reserved=chosen?.role===key,eligible=key==='VETERAN'&&isVeteranEligible(user),plan=ROLE_STORE_PLANS[key];
    const locked=!developer&&key==='VETERAN'&&!current;
    const state=current?'current':reserved?'reserved':locked?'locked':'';
    let label=current?'Current role':developer?`Preview ${info.label}`:reserved?'Saved plan':locked?(eligible?'Assigned automatically':'Legacy role'):'Review plan';
    let action=developer?'preview':key==='VETERAN'?'none':'choose';
    const price=developer?'Visual preview':key==='VETERAN'?(eligible?'Earned permanently':'Founder window closed'):`$${plan[rolesV2.cycle].toFixed(2)} / ${rolesV2.cycle==='yearly'?'year':'month'}`;
    return `<article class="role-v2-card ${state} ${key==='PRO'?'featured':''}" style="--role-color:${info.color};--role-delay:${index*42}ms" data-role-v2-card="${key}"><div class="role-v2-card-top"><span>${workspaceIcon(info.icon.replace('fas fa-',''))}</span><small>${current?'YOUR ROLE':key==='PRO'?'POPULAR':developer?'PREVIEW':key==='VETERAN'?'FOUNDER':'ROLE'}</small></div><div class="role-v2-card-name"><h4>${esc(info.label)}</h4><p>${esc(info.tagline)}</p></div><div class="role-v2-price-wrap"><strong class="role-v2-price">${price}</strong>${!developer&&plan?`<small>${rolesV2.cycle==='yearly'?'Billed annually at launch':'Indicative monthly plan'}</small>`:''}</div><div class="role-v2-capacity"><span>${workspaceIcon('cubes')} ${formatRoleLimit(roleProfileLimit(key))} profiles</span><span>${workspaceIcon('star')} ${formatRoleLimit(roleFavoriteLimit(key))} favorites</span></div><ul>${info.perks.slice(0,3).map(perk=>`<li>${workspaceIcon('check')} ${esc(perk)}</li>`).join('')}</ul><button type="button" data-role-v2-action="${action}" data-role-v2-key="${key}" ${action==='none'||current||reserved?'disabled':''}>${label} ${workspaceIcon(developer?'eye':current?'check':reserved?'bookmark':'arrow-right')}</button></article>`;
}

function renderRolesCards(user){
    const grid=document.getElementById('roleStoreGrid');if(!grid)return;
    grid.innerHTML=workspaceRoleKeys(user).map((key,index)=>roleCard(user,key,index)).join('');
}

function renderRolesCompare(user){
    const grid=document.getElementById('roleComparisonGrid');if(!grid)return;
    const keys=rolesV2.category==='permissions'?['USER','PRO','SPECTRAL','MODERATOR','ADMIN','DEV']:['USER','VETERAN','PRO','LEGEND','SPECTRAL'];
    const rows=rolesV2.category==='capacity'?[['Profiles',key=>formatRoleLimit(roleProfileLimit(key))],['Favorites',key=>formatRoleLimit(roleFavoriteLimit(key))],['Source',key=>key==='VETERAN'?'Founder':PREMIUM_ROLES.includes(key)?'Launch choice':'Included']]:rolesV2.category==='appearance'?[['Header',key=>PROFILE_HEADERS[ROLE_DEFAULT_HEADERS[key]]?.label||'Included'],['Entrance',key=>PROFILE_ENTRANCES[ROLE_DEFAULT_ENTRANCES[key]]?.label||'Included'],['Badge',key=>roleInfo(key).label]]:[['Own profile',()=>true],['Review ideas',key=>roleRank(key)>=10],['Manage roles',key=>roleRank(key)>=20],['Developer preview',key=>key==='DEV']];
    grid.innerHTML=`<table><thead><tr><th>Feature</th>${keys.map(key=>`<th class="${key===user.role?'is-current':''}">${workspaceIcon(roleInfo(key).icon.replace('fas fa-',''))}<span>${esc(roleInfo(key).label)}</span>${key===user.role?'<small>YOU</small>':''}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,read])=>`<tr><th>${label}</th>${keys.map(key=>{const value=read(key);return `<td>${typeof value==='boolean'?`<span class="role-v2-permission ${value?'yes':'no'}">${workspaceIcon(value?'check':'minus')}<b>${value?'Included':'—'}</b></span>`:esc(value)}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
}

function renderRoleWorkspaceV2(){
    const user=workspaceUser();if(!user||!rolesPanelV2)return;
    const display=displayedRoleKey(user),info=roleInfo(display);
    const icon=document.getElementById('rolesV2CurrentIcon');if(icon)icon.innerHTML=workspaceIcon(info.icon.replace('fas fa-',''));
    const name=document.getElementById('rolesV2CurrentName');if(name)name.textContent=info.label;
    const note=document.getElementById('rolesV2CurrentNote');if(note)note.textContent=isDev(user)&&display!=='DEV'?'Preview only · Developer access stays active':info.tagline;
    renderRolesEntitlements(user);renderRolesPreview(user,display);renderRolesCards(user);renderRolesCompare(user);
    const saved=workspaceRoleOrder(user.id),checkout=document.getElementById('roleReservation');
    if(checkout){checkout.hidden=!saved;if(saved)checkout.innerHTML=`<span>${workspaceIcon('bookmark')}</span><div><small>SAVED PLAN · THIS DEVICE</small><strong>${esc(roleInfo(saved.role).label)} · ${saved.billing}</strong><p>$${Number(saved.quotedPrice).toFixed(2)} indicative price · no subscription</p></div><button type="button" data-role-v2-remove>${workspaceIcon('xmark')} Remove</button>`;}
}

function openRoleCheckoutV2(key){
    const user=workspaceUser(),plan=ROLE_STORE_PLANS[key],sheet=document.getElementById('roleCheckoutSheet');if(!user||!plan||!sheet)return;
    clearTimeout(rolesV2.closeTimer);
    rolesV2.quote={userId:user.id,role:key,billing:rolesV2.cycle,price:plan[rolesV2.cycle]};
    sheet.hidden=false;document.getElementById('rolesV2CheckoutIcon').innerHTML=workspaceIcon(roleInfo(key).icon.replace('fas fa-',''));document.getElementById('rolesV2CheckoutTitle').textContent=`Choose ${roleInfo(key).label}`;document.getElementById('rolesV2CheckoutPrice').textContent=`$${plan[rolesV2.cycle].toFixed(2)}`;requestAnimationFrame(()=>sheet.classList.add('is-open'));
}
function closeRoleCheckoutV2(){const sheet=document.getElementById('roleCheckoutSheet');if(!sheet)return;sheet.classList.remove('is-open');rolesV2.quote=null;clearTimeout(rolesV2.closeTimer);rolesV2.closeTimer=window.setTimeout(()=>{sheet.hidden=true;},180);}
function saveRoleChoiceV2(){
    const quote=rolesV2.quote,user=workspaceUser();if(!quote||!user||quote.userId!==user.id)return;
    const orders=loadRoleOrders().filter(item=>item.userId!==user.id);orders.push({id:`role_${crypto.randomUUID()}`,userId:user.id,role:quote.role,billing:quote.billing,quotedPrice:quote.price,currency:'USD',status:'reserved',createdAt:new Date().toISOString()});
    if(!saveRoleOrders(orders))return showToast('This browser could not save the choice.','triangle-exclamation');
    closeRoleCheckoutV2();renderRoleWorkspaceV2();showToast(`${roleInfo(quote.role).label} launch choice saved.`,'check');
}

function bindRolesV2(){
    if(!rolesPanelV2)return;
    renderRolesShell();
    rolesPanelV2.addEventListener('click',event=>{
        const cycle=event.target.closest('[data-role-v2-cycle]');if(cycle){if(rolesV2.quote)closeRoleCheckoutV2();rolesV2.cycle=cycle.dataset.roleV2Cycle;rolesPanelV2.querySelectorAll('[data-role-v2-cycle]').forEach(button=>{button.classList.toggle('active',button===cycle);button.setAttribute('aria-pressed',String(button===cycle));});renderRoleWorkspaceV2();return;}
        const category=event.target.closest('[data-role-v2-category]');if(category){const order=['capacity','appearance','permissions'],previous=rolesV2.category,next=category.dataset.roleV2Category;if(previous===next)return;rolesV2.category=next;rolesPanelV2.querySelectorAll('[data-role-v2-category]').forEach(button=>{button.classList.toggle('active',button===category);button.setAttribute('aria-selected',String(button===category));});renderRolesCompare(workspaceUser());revealWorkspaceContent(document.getElementById('roleComparisonGrid'),order.indexOf(next)>order.indexOf(previous)?1:-1,{distance:9,duration:280});return;}
        const action=event.target.closest('[data-role-v2-action]');if(action&&!action.disabled){if(action.dataset.roleV2Action==='preview'){const user=workspaceUser();if(user&&setDeveloperRolePreview(user,action.dataset.roleV2Key)){renderNavbar();renderRoleWorkspaceV2();activateProfileTabV2('my-profile');showToast(`Preview: ${roleInfo(action.dataset.roleV2Key).label}.`,'eye');}}else if(action.dataset.roleV2Action==='choose')openRoleCheckoutV2(action.dataset.roleV2Key);return;}
        if(event.target.closest('[data-role-v2-reset]')){const user=workspaceUser();if(user&&setDeveloperRolePreview(user,'DEV')){renderNavbar();renderRoleWorkspaceV2();}return;}
        if(event.target.closest('[data-role-v2-remove]')){const user=workspaceUser();if(user&&saveRoleOrders(loadRoleOrders().filter(item=>item.userId!==user.id))){renderRoleWorkspaceV2();showToast('Saved plan removed.','check');}return;}
        if(event.target.closest('[data-role-v2-close]')){closeRoleCheckoutV2();return;}
        if(event.target.closest('[data-role-v2-confirm]'))saveRoleChoiceV2();
    });
}

function adminV2Template(){
    if(!adminPanelV2)return;
    adminPanelV2.innerHTML=`<div class="admin-v2-shell"><header class="admin-v2-header"><div><span class="admin-v2-kicker">${workspaceIcon('shield-halved')} ADMIN WORKSPACE</span><h2>Keep access understandable.</h2><p>Review people, changes, community posts and site health from one calm workspace.</p></div><div id="adminV2Connection" class="admin-v2-connection"></div></header><div id="adminV2Metrics" class="admin-v2-metrics"></div><nav id="adminV2Nav" class="admin-v2-nav" role="tablist" aria-label="Admin workspace sections"><button data-admin-v2-tab="users" role="tab">${workspaceIcon('users')}<strong>Users</strong><small>Accounts &amp; access</small><b></b></button><button data-admin-v2-tab="forum" role="tab">${workspaceIcon('comments')}<strong>Forum</strong><small>Community queue</small><b></b></button><button data-admin-v2-tab="activity" role="tab">${workspaceIcon('clock-rotate-left')}<strong>Activity</strong><small>Reviewed changes</small><b></b></button><button data-admin-v2-tab="analytics" role="tab">${workspaceIcon('chart-line')}<strong>Analytics</strong><small>Site overview</small><b></b></button></nav><section id="adminV2Review" class="admin-v2-review" hidden></section><div id="adminV2Views"><section data-admin-v2-view="users" role="tabpanel"><div class="admin-v2-toolbar"><label>${workspaceIcon('search')}<input data-admin-v2-search type="search" placeholder="Find a person…" autocomplete="off"><kbd>Ctrl K</kbd></label><select data-admin-v2-filter="role" aria-label="Role filter"><option value="">All roles</option>${ROLE_ORDER.map(key=>`<option value="${key}">${esc(roleInfo(key).label)}</option>`).join('')}</select><select data-admin-v2-filter="status" aria-label="Status filter"><option value="">All statuses</option><option value="online">Online now</option><option value="banned">Banned</option><option value="active">Active this week</option></select><select data-admin-v2-filter="sort" aria-label="Sort users"><option value="role">Highest role</option><option value="recent">Recently active</option><option value="name">Name A–Z</option><option value="time">Most time</option></select></div><div class="admin-v2-list-head"><label><input data-admin-v2-select-all type="checkbox"> Select visible</label><span data-admin-v2-count></span><button data-admin-v2-clear>Clear selection</button></div><div data-admin-v2-bulk class="admin-v2-bulk" hidden></div><div class="admin-v2-users"><div data-admin-v2-list class="admin-v2-list"></div><aside data-admin-v2-inspector class="admin-v2-inspector"></aside></div><nav data-admin-v2-pages class="admin-v2-pages" aria-label="User pages"></nav></section><section data-admin-v2-view="forum" role="tabpanel" hidden><div class="admin-v2-section-heading"><div><small>COMMUNITY QUEUE</small><h3>Review ideas with context.</h3></div><span data-admin-v2-forum-count></span></div><div data-admin-v2-forum class="admin-v2-forum"></div></section><section data-admin-v2-view="activity" role="tabpanel" hidden><div class="admin-v2-section-heading"><div><small>ACCOUNT HISTORY</small><h3>Every reviewed change has a reason.</h3></div></div><div data-admin-v2-audit class="admin-v2-audit"></div></section><section data-admin-v2-view="analytics" role="tabpanel" hidden><div class="admin-v2-section-heading"><div><small>SITE OVERVIEW</small><h3>What is happening right now?</h3></div></div><div data-admin-v2-analytics class="admin-v2-analytics"></div></section></div></div>`;
    adminPanelV2.querySelector('[data-admin-v2-forum]').insertAdjacentHTML('beforebegin',`<div class="admin-v2-forum-tools"><label>${workspaceIcon('search')}<input data-admin-v2-forum-search type="search" placeholder="Search ideas or authors" aria-label="Search ideas or authors"></label><div role="group" aria-label="Idea status"><button type="button" data-admin-v2-forum-filter="pending">Pending</button><button type="button" data-admin-v2-forum-filter="all">All</button><button type="button" data-admin-v2-forum-filter="approved">Approved</button><button type="button" data-admin-v2-forum-filter="rejected">Rejected</button></div></div>`);
    adminPanelV2.querySelector('#adminV2Connection').insertAdjacentHTML('afterend',`<button type="button" class="admin-v2-refresh" data-admin-v2-refresh>${workspaceIcon('rotate')} Refresh data</button>`);
}

function adminV2Users(){
    const viewer=workspaceUser(),search=adminV2.query.toLowerCase();
    const filtered=siteUsers.filter(user=>{if(validSupabaseConfig()&&!adminCloudIds.has(user.id))return false;const hay=`${user.username} ${user.displayName} ${user.bio} ${user.email}`.toLowerCase();if(search&&!hay.includes(search))return false;if(adminV2.role&&user.role!==adminV2.role)return false;if(adminV2.status==='online'&&!isOnlineNow(user.lastSeen))return false;if(adminV2.status==='banned'&&!user.banned)return false;if(adminV2.status==='active'&&!isRecentlyActive(user.lastSeen,7))return false;return true;}).sort((a,b)=>adminV2.sort==='name'?(a.displayName||a.username).localeCompare(b.displayName||b.username):adminV2.sort==='time'?(b.totalTimeSec||0)-(a.totalTimeSec||0):adminV2.sort==='recent'?new Date(b.lastSeen||0)-new Date(a.lastSeen||0):roleRank(b.role)-roleRank(a.role));
    const pages=Math.max(1,Math.ceil(filtered.length/adminV2.pageSize));adminV2.page=Math.min(adminV2.page,pages);const visible=filtered.slice((adminV2.page-1)*adminV2.pageSize,adminV2.page*adminV2.pageSize);const manageable=user=>!!viewer&&!viewer.banned&&AccountPolicy.canManage(viewer,user);
    return {viewer,filtered,visible,pages,manageable};
}
function adminV2UserCard(user,state){
    const can=state.manageable(user),selected=adminV2.selected.has(user.id),inspected=adminV2.inspect===user.id;
    return `<article class="admin-v2-user ${selected?'is-selected':''} ${inspected?'is-inspected':''} ${user.banned?'is-banned':''}" data-admin-v2-user="${esc(user.id)}"><div class="admin-v2-user-check">${can?`<input type="checkbox" data-admin-v2-select="${esc(user.id)}" ${selected?'checked':''} aria-label="Select ${esc(user.username)}">`:workspaceIcon('lock')}</div><div class="admin-v2-avatar"><img src="${esc(siteAvatarUrl(user))}" alt="" width="48" height="48" loading="lazy" data-avatar-fallback><i class="${isOnlineNow(user.lastSeen)?'online':''}"></i></div><div class="admin-v2-user-copy"><strong>${esc(user.displayName||user.username)}</strong><span>@${esc(user.username)} · ${esc(user.bio||'No bio yet')}</span><small>${workspaceIcon('clock')} ${formatDuration(user.totalTimeSec)} · ${workspaceIcon('cube')} ${(loadMcAccounts(user.id)||[]).length} profiles · ${user.banned?'Restricted':'Active'}</small></div><div class="admin-v2-user-action"><select data-admin-v2-role="${esc(user.id)}" aria-label="Role for ${esc(user.username)}" ${can?'':'disabled'}>${adminAllowedRoles(viewerForAdminV2(state.viewer)).map(key=>`<option value="${key}" ${key===user.role?'selected':''}>${esc(roleInfo(key).label)}</option>`).join('')}</select><button type="button" data-admin-v2-inspect="${esc(user.id)}">${workspaceIcon('arrow-right')}<span>Inspect</span></button></div></article>`;
}
function viewerForAdminV2(user){return user;}
function renderAdminV2Users(){
    const root=adminPanelV2,state=adminV2Users();if(!root)return;
    root.querySelector('[data-admin-v2-count]').textContent=`${state.filtered.length} account${state.filtered.length===1?'':'s'} · page ${adminV2.page}/${state.pages}`;
    root.querySelector('[data-admin-v2-list]').innerHTML=state.visible.length?state.visible.map(user=>adminV2UserCard(user,state)).join(''):`<div class="admin-v2-empty">${workspaceIcon(adminCloudError?'plug-circle-exclamation':'user-slash')}<strong>${esc(adminCloudError||'No accounts found')}</strong><span>${adminCloudError?'Use Refresh data after applying the administration migration.':'Clear a filter or try another name.'}</span></div>`;
    const inspected=siteUsers.find(user=>user.id===adminV2.inspect)||state.visible[0];root.querySelector('[data-admin-v2-inspector]').innerHTML=inspected?`<div class="admin-v2-inspector-top"><small>ACCOUNT DETAILS</small><h3>${esc(inspected.displayName||inspected.username)}</h3><span>${esc(roleInfo(inspected.role).label)} · ${inspected.banned?'Restricted':'Active'}</span></div><dl><div><dt>Username</dt><dd>@${esc(inspected.username)}</dd></div><div><dt>Joined</dt><dd>${esc(inspected.registeredAt||'—')}</dd></div><div><dt>Site time</dt><dd>${formatDuration(inspected.totalTimeSec)}</dd></div><div><dt>Account id</dt><dd><code>${esc(inspected.id)}</code></dd></div></dl>${state.manageable(inspected)&&inspected.id!==state.viewer.id?`<div class="admin-v2-inspector-actions"><button type="button" data-admin-v2-inspect-action="${inspected.banned?'unban':'ban'}" data-admin-v2-inspect-id="${esc(inspected.id)}">${workspaceIcon(inspected.banned?'unlock':'ban')} ${inspected.banned?'Restore sign-in':'Restrict sign-in'}</button>${isDev(state.viewer)&&!validSupabaseConfig()?`<button type="button" data-admin-v2-inspect-action="delete" data-admin-v2-inspect-id="${esc(inspected.id)}" class="danger">${workspaceIcon('trash-can')} Delete local account</button>`:''}</div>`:''}`:`<div class="admin-v2-empty">${workspaceIcon('user-gear')}<strong>Select an account</strong><span>Inspect access and activity without leaving the list.</span></div>`;
    root.querySelector('[data-admin-v2-pages]').innerHTML=`<button data-admin-v2-page="prev" ${adminV2.page===1?'disabled':''}>${workspaceIcon('arrow-left')} Previous</button><span>${adminV2.page} / ${state.pages}</span><button data-admin-v2-page="next" ${adminV2.page===state.pages?'disabled':''}>Next ${workspaceIcon('arrow-right')}</button>`;
    const bulk=root.querySelector('[data-admin-v2-bulk]'),selected=[...adminV2.selected].filter(id=>state.filtered.some(user=>user.id===id));adminV2.selected=new Set(selected);bulk.hidden=!selected.length;bulk.innerHTML=selected.length?`<strong>${selected.length} selected</strong><select data-admin-v2-bulk-role aria-label="Bulk role">${adminAllowedRoles(state.viewer).map(key=>`<option value="${key}">${esc(roleInfo(key).label)}</option>`).join('')}</select><button data-admin-v2-bulk-action="role">Apply role</button><button data-admin-v2-bulk-action="ban">Restrict</button><button data-admin-v2-bulk-action="unban">Restore</button><button data-admin-v2-bulk-action="export">Export</button>`:'';
}
function adminV2Review(action,ids,role){
    adminV2.forumPending=null;
    const viewer=workspaceUser(),targets=ids.map(id=>siteUsers.find(user=>user.id===id)).filter(Boolean);if(!targets.length||targets.some(user=>!AccountPolicy.canManage(viewer,user,action==='role'?role:null)))return showToast('This account is protected by the role hierarchy.','lock');
    adminV2.pending={action,role,actorId:viewer.id,targets:targets.map(user=>({id:user.id,username:user.username,role:user.role,banned:user.banned}))};
    const review=adminPanelV2.querySelector('[data-admin-v2-review]')||document.getElementById('adminV2Review');if(!review)return;
    review.hidden=false;review.innerHTML=`<div class="admin-v2-review-head"><span>${workspaceIcon('code-compare')}</span><div><small>REVIEW BEFORE APPLYING</small><h3>${action==='role'?'Change role':action==='ban'?'Restrict sign-in':action==='unban'?'Restore sign-in':'Delete local account'}</h3></div></div><div class="admin-v2-diff">${targets.map(user=>`<div><strong>${esc(user.username)}</strong><span>${esc(action==='role'?roleInfo(user.role).label:user.banned?'Restricted':'Active')}</span>${workspaceIcon('arrow-right')}<b>${esc(action==='role'?roleInfo(role).label:action==='ban'?'Restricted':action==='unban'?'Active':'Deleted')}</b></div>`).join('')}</div><label>Why is this change needed?<input data-admin-v2-reason maxlength="160" placeholder="Short reason for the activity log"></label><p data-admin-v2-error></p><footer><button data-admin-v2-cancel>Cancel</button><button data-admin-v2-apply>${workspaceIcon('check')} Apply reviewed change</button></footer>`;
    review.scrollIntoView({behavior:REDUCED_MOTION?'auto':'smooth',block:'nearest'});
}
function adminV2CascadeDelete(ids){
    const idSet=new Set(ids),styles=loadProfileStyles(),previews=loadDevRolePreviews(),records=new Map();
    for(const id of idSet){records.set(K_MC_PFX+id,null);records.set(K_MC_ACT+id,null);delete styles[id];delete previews[id];}
    const nextFriends=friendships.filter(item=>!idSet.has(item.requester)&&!idSet.has(item.addressee));
    const nextForum=forumPosts.filter(post=>!idSet.has(post.authorId)).map(post=>({...post,upvotes:(post.upvotes||[]).filter(id=>!idSet.has(id))}));
    records.set(K_PROFILE_STYLES,styles);records.set(K_DEV_ROLE_PREVIEWS,previews);records.set(K_ROLE_ORDERS,loadRoleOrders().filter(order=>!idSet.has(order.userId)));records.set(K_FRIENDS,nextFriends);records.set(K_FORUM,nextForum);persistAdminRecords(records);
    friendships=nextFriends;forumPosts=nextForum;
}
async function adminV2Apply(){
    if(adminV2.forumPending){
        const pending=adminV2.forumPending,review=adminPanelV2.querySelector('#adminV2Review'),reason=review?.querySelector('[data-admin-v2-reason]')?.value.trim();
        if(!reason||reason.length<3){review.querySelector('[data-admin-v2-error]').textContent='Add a short reason before applying.';return;}
        if(adminV2.busy)return;adminV2.busy=true;
        try{
            if(validSupabaseConfig())await moderateCommunityIdea(pending.id,pending.action,reason);
            else{const post=forumPosts.find(item=>item.id===pending.id);if(!post)throw new Error('The idea changed. Refresh the queue.');post.approved=pending.action==='approve';post.rejected=!post.approved;saveForum(forumPosts);renderForum();const actor=workspaceUser(),audit=readJsonStorage(K_ADMIN_AUDIT,[],Array.isArray);audit.push({id:crypto.randomUUID(),actorId:actor.id,actorName:actor.username,action:`idea_${pending.action}`,reason,createdAt:new Date().toISOString(),changes:[{id:post.id,username:post.title,before:'Idea',after:pending.action}]});try{localStorage.setItem(K_ADMIN_AUDIT,JSON.stringify(audit.slice(-200)));}catch{}}
            adminV2.forumPending=null;review.hidden=true;renderAdminV2();showToast('Idea review saved.','check');
        }catch(error){review.querySelector('[data-admin-v2-error]').textContent=error.message||'Could not save the review.';}
        finally{adminV2.busy=false;}
        return;
    }
    const pending=adminV2.pending,review=adminPanelV2.querySelector('#adminV2Review'),reason=review?.querySelector('[data-admin-v2-reason]')?.value.trim();if(!pending||!reason||reason.length<3)return review?.querySelector('[data-admin-v2-error]').replaceChildren(document.createTextNode('Add a short reason before applying.'));
    if(adminV2.busy)return;adminV2.busy=true;
    const actor=siteUsers.find(user=>user.id===pending.actorId),targets=pending.targets.map(before=>siteUsers.find(user=>user.id===before.id));
    try{
        if(!actor||targets.some((user,index)=>!user||!AccountPolicy.canManage(actor,user,pending.action==='role'?pending.role:null)||user.role!==pending.targets[index].role||user.banned!==pending.targets[index].banned))throw new Error('The account changed. Review the latest state.');
        if(validSupabaseConfig()){
            if(!authAvailable()||!cloudAuthUserId)throw new Error('Reconnect to administration before applying changes.');
            const {error}=await cloud.rpc('spectral_admin_apply',{p_targets:pending.targets,p_action:pending.action,p_role:pending.role||null,p_reason:reason});
            if(error)throw new Error('Server rejected the change. Refresh the directory and review your permissions.');
            await loadAdminCloud();adminV2.pending=null;adminV2.selected.clear();renderAdminV2();showToast('Reviewed admin change saved.','check');return;
        }
        const ids=new Set(targets.map(user=>user.id)),next=siteUsers.filter(user=>pending.action!=='delete'||!ids.has(user.id)).map(user=>ids.has(user.id)&&pending.action==='role'?{...user,role:pending.role,roleSource:'admin'}:ids.has(user.id)?{...user,banned:pending.action==='ban'}:user);
        if(!saveSiteUsers(next))throw new Error('Browser storage is full.');siteUsers=next;
        if(pending.action==='delete')adminV2CascadeDelete(ids);
        const audit=readJsonStorage(K_ADMIN_AUDIT,[],Array.isArray);audit.push({id:crypto.randomUUID(),actorId:actor.id,actorName:actor.username,action:pending.action,reason,createdAt:new Date().toISOString(),changes:targets.map(user=>({id:user.id,username:user.username,before:user.role,after:pending.action==='role'?pending.role:pending.action}))});try{localStorage.setItem(K_ADMIN_AUDIT,JSON.stringify(audit.slice(-200)));}catch{}
        adminV2.pending=null;adminV2.selected.clear();renderAdminV2();showToast('Reviewed admin change saved.','check');
    }catch(error){const message=review?.querySelector('[data-admin-v2-error]');if(message)message.textContent=error.message;}finally{adminV2.busy=false;}
}
function renderAdminV2(){
    const user=workspaceUser();if(!user||!adminPanelV2)return;const accounts=validSupabaseConfig()?siteUsers.filter(item=>adminCloudIds.has(item.id)):siteUsers;const metrics=adminPanelV2.querySelector('[data-admin-v2-metrics]')||document.getElementById('adminV2Metrics');if(metrics)metrics.innerHTML=[['users',validSupabaseConfig()?'Loaded accounts':'Accounts',accounts.length],['bolt','Active 7d',accounts.filter(item=>isRecentlyActive(item.lastSeen,7)).length],['inbox','Pending',forumPosts.filter(item=>!item.approved&&!item.rejected).length],['user-slash','Restricted',accounts.filter(item=>item.banned).length]].map(([icon,label,value])=>`<div>${workspaceIcon(icon)}<span><b>${value}</b><small>${label}</small></span></div>`).join('');
    const review=adminPanelV2.querySelector('#adminV2Review');if(review&&!adminV2.pending&&!adminV2.forumPending)review.hidden=true;
    adminPanelV2.querySelectorAll('[data-admin-v2-tab]').forEach(tab=>{const active=tab.dataset.adminV2Tab===adminV2.tab;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    adminPanelV2.querySelectorAll('[data-admin-v2-view]').forEach(view=>{view.hidden=view.dataset.adminV2View!==adminV2.tab;});
    const connection=adminPanelV2.querySelector('[data-admin-v2-connection]')||document.getElementById('adminV2Connection');if(connection)connection.innerHTML=`${workspaceIcon(validSupabaseConfig()?'cloud':'hard-drive')} ${validSupabaseConfig()?(adminV2.loading?'Syncing…':adminCloudConnected?'Database connected':esc(adminCloudError||'Database disconnected')):'Local demo mode'}`;
    if(adminV2.tab==='users')renderAdminV2Users();
    if(adminV2.tab==='activity'){const list=adminPanelV2.querySelector('[data-admin-v2-audit]');const rows=[...adminAuditEntries(),...(validSupabaseConfig()?communityRemoteAudit:[])].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));list.innerHTML=rows.length?rows.map(entry=>`<article>${workspaceIcon(entry.action==='role'?'id-badge':entry.action==='ban'?'ban':entry.action?.startsWith('idea_')?'comment-dots':'unlock')}<div><strong>${esc(entry.actorName||'Staff')} · ${esc(entry.action)}</strong><time>${esc(new Date(entry.createdAt).toLocaleString())}</time><p>${esc(entry.reason||'No reason recorded')}</p><small>${(entry.changes||[]).map(change=>`${esc(change.username||change.id)}: ${esc(change.before)} → ${esc(change.after)}`).join(' · ')}</small></div></article>`).join(''):`<div class="admin-v2-empty">${workspaceIcon('clock-rotate-left')}<strong>No reviewed changes yet</strong></div>`;}
    if(adminV2.tab==='forum')renderAdminV2Forum();
    if(adminV2.tab==='analytics'){const list=adminPanelV2.querySelector('[data-admin-v2-analytics]');const counts=ROLE_ORDER.map(key=>({key,count:accounts.filter(item=>item.role===key).length})).filter(item=>item.count);const totalTime=accounts.reduce((sum,item)=>sum+(item.totalTimeSec||0),0);list.innerHTML=`<div class="admin-v2-analytics-grid"><article><strong>${accounts.length}</strong><span>Accounts in directory</span></article><article><strong>${totalTime?formatDuration(totalTime):'0m'}</strong><span>Total site time</span></article><article><strong>${forumPosts.filter(item=>item.approved).length}</strong><span>Published ideas</span></article><article><strong>${forumPosts.filter(item=>!item.approved&&!item.rejected).length}</strong><span>Awaiting review</span></article></div><div class="admin-v2-role-bars">${counts.map(item=>`<div><span>${esc(roleInfo(item.key).label)}</span><b>${item.count}</b><i style="width:${Math.min(100,item.count/Math.max(1,accounts.length)*100)}%"></i></div>`).join('')}</div>`;}
}

function selectAdminWorkspaceTab(target){
    const order=['users','forum','activity','analytics'];
    if(!order.includes(target))return;
    if(target===adminV2.tab)return;
    const previous=adminV2.tab;
    adminV2.tab=target;adminV2.page=1;adminV2.pending=null;adminV2.forumPending=null;
    const outgoing=adminPanelV2?.querySelector(`[data-admin-v2-view="${previous}"]`);
    interruptWorkspaceMotion(outgoing);
    renderAdminV2();
    revealWorkspaceContent(adminPanelV2?.querySelector(`[data-admin-v2-view="${target}"]`),order.indexOf(target)>order.indexOf(previous)?1:-1,{distance:10,duration:300});
}

function requestAdminWorkspaceTab(target){
    clearTimeout(adminSwitchTimer);
    if(target===adminV2.tab)return;
    selectAdminWorkspaceTab(target);
}

function renderAdminV2Forum(){
    const list=adminPanelV2.querySelector('[data-admin-v2-forum]');if(!list)return;
    const state=post=>post.rejected?'rejected':post.approved?'approved':'pending';
    const query=adminV2.forumQuery.trim().toLowerCase();
    const posts=forumPosts.filter(post=>(adminV2.forumFilter==='all'||state(post)===adminV2.forumFilter)&&(!query||`${post.title||''} ${post.text||''} ${post.authorName||''}`.toLowerCase().includes(query))).slice().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
    adminPanelV2.querySelector('[data-admin-v2-forum-count]').textContent=`${posts.length} of ${forumPosts.length} ideas`;
    adminPanelV2.querySelectorAll('[data-admin-v2-forum-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.adminV2ForumFilter===adminV2.forumFilter)));
    list.innerHTML=posts.length?posts.map(post=>`<article><span>${workspaceIcon(post.rejected?'xmark':post.approved?'check':'clock')}</span><div><strong>${esc(post.title||'Untitled idea')}</strong><small>${esc(post.authorName||'Unknown')} · ${esc(post.date||'')}</small><p>${esc(post.text||'')}</p><div class="admin-v2-forum-actions">${!post.approved?`<button type="button" data-admin-v2-forum-action="approve" data-post-id="${esc(post.id)}">${workspaceIcon('check')} Approve</button>`:''}${!post.rejected?`<button type="button" data-admin-v2-forum-action="reject" data-post-id="${esc(post.id)}">${workspaceIcon('xmark')} Reject</button>`:''}</div></div><em>${state(post)}</em></article>`).join(''):`<div class="admin-v2-empty">${workspaceIcon('inbox')}<strong>${esc(communityCloudError||'No matching ideas')}</strong><span>${communityCloudError?'Refresh after checking the community migration.':'Try another filter or search.'}</span></div>`;
}

async function refreshAdminV2Cloud(){
    if(!validSupabaseConfig()){
        siteUsers=loadSiteUsers()||siteUsers;
        forumPosts=loadForum()||forumPosts;
        renderAdminV2();showToast('Local data refreshed.','rotate');return;
    }
    if(adminV2.loading)return;
    adminV2.loading=true;renderAdminV2();
    try{await Promise.all([loadAdminCloud(),loadCommunityCloud(),loadCommunityAudit()]);}
    finally{adminV2.loading=false;renderAdminV2();}
}

function bindAdminV2(){
    if(!adminPanelV2)return;adminV2Template();
    adminPanelV2.addEventListener('click',event=>{
        if(event.target.closest('[data-admin-v2-refresh]')){refreshAdminV2Cloud();return;}
        const tab=event.target.closest('[data-admin-v2-tab]');if(tab){requestAdminWorkspaceTab(tab.dataset.adminV2Tab);return;}
        const forumFilter=event.target.closest('[data-admin-v2-forum-filter]');if(forumFilter){adminV2.forumFilter=forumFilter.dataset.adminV2ForumFilter;renderAdminV2Forum();return;}
        const forumAction=event.target.closest('[data-admin-v2-forum-action]');if(forumAction){
            const viewer=workspaceUser(),post=forumPosts.find(item=>String(item.id)===forumAction.dataset.postId);
            if(!post||!canModerate(viewer))return;
            adminV2.forumPending={id:post.id,action:forumAction.dataset.adminV2ForumAction};
            const review=adminPanelV2.querySelector('#adminV2Review');review.hidden=false;
            review.innerHTML=`<div class="admin-v2-review-head"><span>${workspaceIcon('comment-dots')}</span><div><small>COMMUNITY REVIEW</small><h3>${adminV2.forumPending.action==='approve'?'Approve':'Reject'} idea</h3></div></div><div class="admin-v2-diff"><div><strong>${esc(post.title)}</strong><span>${esc(post.authorName)}</span>${workspaceIcon('arrow-right')}<b>${adminV2.forumPending.action}</b></div></div><label>Reason for this decision<input data-admin-v2-reason maxlength="160" placeholder="Short reason for the activity log"></label><p data-admin-v2-error></p><footer><button data-admin-v2-cancel>Cancel</button><button data-admin-v2-apply>${workspaceIcon('check')} Save review</button></footer>`;
            review.scrollIntoView({behavior:REDUCED_MOTION?'auto':'smooth',block:'nearest'});review.querySelector('input')?.focus({preventScroll:true});return;
        }
        const inspect=event.target.closest('[data-admin-v2-inspect]');if(inspect){adminV2.inspect=inspect.dataset.adminV2Inspect;renderAdminV2Users();return;}
        const page=event.target.closest('[data-admin-v2-page]');if(page&&!page.disabled){adminV2.page+=page.dataset.adminV2Page==='next'?1:-1;renderAdminV2Users();return;}
        const clear=event.target.closest('[data-admin-v2-clear]');if(clear){adminV2.selected.clear();renderAdminV2Users();return;}
        const bulk=event.target.closest('[data-admin-v2-bulk-action]');if(bulk){const ids=[...adminV2.selected];if(bulk.dataset.adminV2BulkAction==='export')return exportAdminUsers(ids.map(id=>siteUsers.find(user=>user.id===id)).filter(Boolean),'selected-users');adminV2Review(bulk.dataset.adminV2BulkAction,ids,adminPanelV2.querySelector('[data-admin-v2-bulk-role]')?.value);return;}
        const inspectAction=event.target.closest('[data-admin-v2-inspect-action]');if(inspectAction){adminV2Review(inspectAction.dataset.adminV2InspectAction,[inspectAction.dataset.adminV2InspectId]);return;}
        if(event.target.closest('[data-admin-v2-cancel]')){adminV2.pending=null;adminV2.forumPending=null;adminPanelV2.querySelector('#adminV2Review').hidden=true;return;}
        if(event.target.closest('[data-admin-v2-apply]'))adminV2Apply();
    });
    adminPanelV2.addEventListener('input',event=>{if(event.target.matches('[data-admin-v2-search]')){adminV2.query=event.target.value;adminV2.page=1;renderAdminV2Users();}if(event.target.matches('[data-admin-v2-forum-search]')){adminV2.forumQuery=event.target.value;renderAdminV2Forum();}});
    adminPanelV2.addEventListener('change',event=>{
        if(event.target.matches('[data-admin-v2-filter]')){adminV2[event.target.dataset.adminV2Filter]=event.target.value;adminV2.page=1;adminV2.selected.clear();renderAdminV2Users();return;}
        if(event.target.matches('[data-admin-v2-select]')){event.target.checked?adminV2.selected.add(event.target.dataset.adminV2Select):adminV2.selected.delete(event.target.dataset.adminV2Select);renderAdminV2Users();return;}
        if(event.target.matches('[data-admin-v2-select-all]')){const state=adminV2Users();state.visible.filter(state.manageable).forEach(user=>event.target.checked?adminV2.selected.add(user.id):adminV2.selected.delete(user.id));renderAdminV2Users();return;}
        if(event.target.matches('[data-admin-v2-role]'))adminV2Review('role',[event.target.dataset.adminV2Role],event.target.value);
    });
    adminPanelV2.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();adminPanelV2.querySelector('[data-admin-v2-search]')?.focus();}});
}

function activateProfileTabV2(target){
    if(target==='admin-panel'&&!canAccessAdmin(workspaceUser()))return;
    const selected=profileTabsV2?.querySelector(`[data-ptab="${target}"]:not([hidden])`);if(!selected)return;
    const tabs=[...profileTabsV2.querySelectorAll('.profile-tab')],panels=[...document.querySelectorAll('#profileView > .ptab-content')],previousTab=tabs.find(tab=>tab.classList.contains('active')),previousPanel=panels.find(panel=>panel.dataset.ptabContent===previousTab?.dataset.ptab)||panels.find(panel=>!panel.hidden),nextPanel=panels.find(panel=>panel.dataset.ptabContent===target);
    if(!nextPanel)return;
    const previousIndex=tabs.indexOf(previousTab),nextIndex=tabs.indexOf(selected);
    const changed=previousPanel!==nextPanel||panels.some(panel=>panel.hidden===(panel===nextPanel))||previousTab!==selected;
    panels.forEach(interruptWorkspaceMotion);
    profileTabsV2.querySelectorAll('.profile-tab').forEach(tab=>{const active=tab===selected;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    const modal=dashOverlay?.querySelector('.dashboard-modal');
    panels.forEach(panel=>{const active=panel===nextPanel;panel.hidden=!active;if(active)panel.style.removeProperty('display');else panel.style.display='none';panel.classList.toggle('active',active);panel.classList.remove('ptab-enter');panel.setAttribute('aria-hidden',String(!active));});
    const mode=target==='admin-panel'?'admin':target==='role-store'?'store':false;setDashboardWide(mode);if(modal)modal.dataset.workspace=target;
    if(modal)modal.scrollTop=0;
    if(target==='my-profile'){
        const user=workspaceUser();
        if(user)loadProfileViewData(user,{resetTab:false});
    }
    renderAccountStudio();
    profileTabsV2.style.setProperty('--tab-index',String(nextIndex));
    if(target==='role-store'){renderRoleWorkspaceV2();}
    if(target==='admin-panel'){renderAdminV2();if(validSupabaseConfig()&&!adminCloudConnected)refreshAdminV2Cloud();}
    if(changed&&dashOverlay?.classList.contains('open')){
        const direction=nextIndex>previousIndex?1:-1;
        revealWorkspaceContent(nextPanel,direction,{distance:12,duration:340});
        revealWorkspaceContent(document.querySelector('.account-hub-title'),direction,{distance:5,duration:260});
    }
}
function requestProfileTabV2(target){
    clearTimeout(profileSwitchTimer);
    const current=document.querySelector('#profileView > .ptab-content:not([hidden])');
    if(current?.dataset.ptabContent===target)return;
    activateProfileTabV2(target);
}
function openRoleStoreV2(){if(!currentUserId){openDashboard();return;}if(!dashOverlay?.classList.contains('open'))openDashboard();activateProfileTabV2('role-store');}
globalThis.activateProfileTab=activateProfileTabV2;
globalThis.openRoleStore=openRoleStoreV2;
globalThis.renderRoleStore=renderRoleWorkspaceV2;
globalThis.renderAdminPanel=renderAdminV2;
globalThis.renderAdminUsers=renderAdminV2Users;
globalThis.renderAdminStats=renderAdminV2;
globalThis.renderAdminForum=renderAdminV2;
globalThis.openAdminSection=target=>selectAdminWorkspaceTab(target==='site-stats'?'analytics':target);
globalThis.refreshAdmin=renderAdminV2;
globalThis.updateAdminOverview=renderAdminV2;

bindRolesV2();bindAdminV2();
profileTabsV2?.addEventListener('click',event=>{const tab=event.target.closest('[data-ptab]');if(tab)requestProfileTabV2(tab.dataset.ptab);});
profileTabsV2?.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;const tabs=[...profileTabsV2.querySelectorAll('.profile-tab:not([hidden])')],index=tabs.indexOf(document.activeElement);if(index<0)return;event.preventDefault();const next=tabs[(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];next.focus();requestProfileTabV2(next.dataset.ptab);});
