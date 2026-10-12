// ══════════════════════════════════════════════════════════════
// SITE USERS (two-tier system)
// ══════════════════════════════════════════════════════════════
const LOCAL_DEVELOPMENT_ORIGIN = location.protocol === 'file:' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
const LOCAL_OWNER_PASSWORD = LOCAL_DEVELOPMENT_ORIGIN && !validSupabaseConfig() ? 'devpass' : '';
const DEFAULT_SITE_USERS = [
    { id:'su_dev', username:'_kaiserr_',  password:LOCAL_OWNER_PASSWORD, role:'DEV',       displayName:'_kaiserr_',  bio:'Developer of Spectral',    avatar:'', registeredAt:'01.01.2026', totalTimeSec:154800, visitCount:212, lastSeen:'2026-06-28T09:10:00Z', banned:false },
    { id:'su_adm', username:'Console',    password:'', role:'ADMIN',     displayName:'Console',    bio:'Keeping the servers tidy', avatar:'', registeredAt:'10.02.2024', totalTimeSec:98400,  visitCount:140, lastSeen:'2026-06-27T20:00:00Z', banned:false },
    { id:'su_mod', username:'Redstone',   password:'', role:'MODERATOR', displayName:'Redstone',   bio:'Forum moderator',          avatar:'', registeredAt:'05.03.2024', totalTimeSec:61200,  visitCount:97,  lastSeen:'2026-06-26T14:30:00Z', banned:false },
    { id:'su_pro', username:'Steve_Pro',  password:'', role:'PRO',       displayName:'Steve_Pro',  bio:'Minecraft enthusiast',     avatar:'', registeredAt:'15.01.2024', totalTimeSec:45720,  visitCount:64,  lastSeen:'2026-06-25T11:00:00Z', banned:false },
    { id:'su_vet', username:'Enderman42', password:'', role:'VETERAN',   displayName:'Enderman42', bio:'Been here since day one',  avatar:'', registeredAt:'22.04.2024', totalTimeSec:23400,  visitCount:38,  lastSeen:'2026-06-20T18:45:00Z', banned:false },
    { id:'su_usr', username:'Alex',       password:'', role:'USER',      displayName:'Alex',       bio:'Builder',                  avatar:'', registeredAt:'20.02.2024', totalTimeSec:7200,   visitCount:12,  lastSeen:'2026-06-12T08:20:00Z', banned:false }
];
const DEFAULT_MC_ACCOUNTS = {
    'su_dev': [
        { id:'la_d1', username:'_kaiserr_', type:'elyby',     addedAt:'01.01.2026', playtime:'0h',   favorite:false, uuid:offlineUuid('_kaiserr_'), lastUsed:null }
    ],
    'su_pro': [
        { id:'la_p1', username:'Steve_Pro',  type:'microsoft', addedAt:'15.01.2024', playtime:'127h', favorite:false, uuid:offlineUuid('Steve_Pro'),  lastUsed:null },
        { id:'la_p2', username:'Enderman42', type:'offline',   addedAt:'20.04.2024', playtime:'23h',  favorite:true,  uuid:offlineUuid('Enderman42'), lastUsed:null }
    ],
    'su_usr': [
        { id:'la_u1', username:'Alex',       type:'elyby',     addedAt:'20.02.2024', playtime:'43h',  favorite:false, uuid:offlineUuid('Alex'),       lastUsed:null }
    ],
    'su_adm': [
        { id:'la_a1', username:'Console',    type:'microsoft', addedAt:'10.02.2024', playtime:'88h',  favorite:false, uuid:offlineUuid('Console'),    lastUsed:null }
    ],
    'su_mod': [
        { id:'la_m1', username:'Redstone',   type:'microsoft', addedAt:'05.03.2024', playtime:'54h',  favorite:true,  uuid:offlineUuid('Redstone'),   lastUsed:null },
        { id:'la_m2', username:'TorchBearer',type:'offline',   addedAt:'06.03.2024', playtime:'9h',   favorite:false, uuid:offlineUuid('TorchBearer'),lastUsed:null }
    ],
    'su_vet': [
        { id:'la_v1', username:'Enderman42', type:'elyby',     addedAt:'22.04.2024', playtime:'31h',  favorite:false, uuid:offlineUuid('Enderman42'), lastUsed:null }
    ]
};
const DEFAULT_FORUM = [
    { id:'fp_1', authorId:'su_pro', authorName:'Steve_Pro', title:'Add 3D skin preview in launcher',
      text:'It would be great to see a 3D skin preview in the Accounts tab, similar to NameMC. Would make it much easier to see how your skin looks before launching.',
      date:'25.06.2026', upvotes:['su_usr'], approved:true, rejected:false },
    { id:'fp_2', authorId:'su_usr', authorName:'Alex', title:'Dark/Light theme toggle',
      text:'Please add an option to switch between dark and light themes. Some players prefer a lighter interface when playing during the day.',
      date:'24.06.2026', upvotes:['su_pro','su_dev'], approved:true, rejected:false }
];
// Friendships between SITE users. Each row is one relationship:
//   requester  -> the user who sent the request
//   addressee  -> the user who received it
//   status     -> 'pending' (awaiting acceptance) | 'accepted' (friends)
// A pair of users has at most one row. Seed a few so the feature isn't empty.
const DEFAULT_FRIENDS = [
    { id:'fr_seed1', requester:'su_pro', addressee:'su_usr', status:'accepted', createdAt:'2026-06-20T10:00:00Z' },
    { id:'fr_seed2', requester:'su_mod', addressee:'su_pro', status:'accepted', createdAt:'2026-06-22T14:30:00Z' },
    { id:'fr_seed3', requester:'su_vet', addressee:'su_usr', status:'pending',  createdAt:'2026-06-27T09:15:00Z' }
];
const DEFAULT_NEWS = [
    { id:'news_modmanager_redesign', date:'Jun 28, 2026', title:'Mod Manager Redesign', version:'v0.9.4', channel:'beta', summary:'A cleaner two-panel mod workflow with faster discovery, clearer actions and a more consistent launcher interface.', isCurrent:true, dimmed:false, items:[
        {type:'imp',text:'Mod Manager rebuilt to match the Library layout — the mod list sits on the left, with every action grouped in a panel on the right'},
        {type:'imp',text:'Bigger window and a cleaner header bar with a segmented Installed / Discover switch'},
        {type:'imp',text:'Unified icons and styling across the dialog — removed the icon chip backings and the dark box behind the tabs'}
    ]},
    { id:'news_site_overhaul', date:'Jun 26, 2026', title:'Website 2.0 — Accounts, Forum & Themes', version:'Website 2.0', channel:'website', summary:'The community site now feels like a real product surface with profiles, ideas, themes and developer controls.', isCurrent:false, dimmed:false, items:[
        {type:'add',text:'Two-tier accounts: a site account now holds your own set of Minecraft launcher profiles'},
        {type:'add',text:'Community Ideas & Suggestions forum with upvotes and automatic content moderation'},
        {type:'add',text:'Admin panel to manage users, roles and forum posts — developers can publish updates right from the site'},
        {type:'add',text:'Brand-new light theme with an animated aurora background and a one-click dark/light toggle'},
        {type:'imp',text:'Polished login dialog, crisper 100px avatars and dozens of layout and colour fixes'}
    ]},
    { id:'news_1', date:'Jun 26, 2026', title:'Typography & SpectrAI Assistant', isCurrent:false, dimmed:false, items:[
        {type:'imp',text:'New refined fonts across the app — Sora for headings and Plus Jakarta Sans for the interface'},
        {type:'add',text:'Built-in SpectrAI assistant: a sliding chat panel that helps with mods, memory and launch errors'},
        {type:'imp',text:'Accounts tab rebuilt to match the Library layout — list on the left, detailed profile card on the right'}
    ]},
    { id:'news_2', date:'Jun 25, 2026', title:'Performance & Launch Reliability', isCurrent:false, dimmed:false, items:[
        {type:'fix',text:'Modded builds now auto-install their required vanilla base, so they actually start'},
        {type:'add',text:'Step-by-step console diagnostics that explain exactly why a launch failed'},
        {type:'imp',text:'Smoother animations: cached particle background and paused effects on hidden tabs'},
        {type:'imp',text:'Native libraries are cached after first launch for faster restarts'}
    ]},
    { id:'news_3', date:'Jun 24, 2026', title:'Interface, Console & Localization', isCurrent:false, dimmed:false, items:[
        {type:'add',text:'Full RU / EN coverage across every tab and dialog'},
        {type:'add',text:'Redesigned Console with colored log levels, search, copy and export'},
        {type:'imp',text:'Unified glassmorphism panels, centered titles and consistent controls'}
    ]},
    { id:'news_4', date:'Project Core', title:'Launcher Foundation', isCurrent:false, dimmed:true, items:[
        {type:'add',text:'Qt 6 / C++17 desktop app built with CMake and MinGW'},
        {type:'add',text:'Instance library, Java manager, version installer and mod manager'},
        {type:'add',text:'Discord Rich Presence, news system, settings and crash/log tooling'}
    ]}
];

// ── Storage helpers ───────────────────────────────────────────
function readJsonStorage(key, fallback, validate) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const value = JSON.parse(raw);
        return !validate || validate(value) ? value : fallback;
    } catch {
        return fallback;
    }
}
const STORED_ROLE_KEYS = new Set(['USER','VETERAN','PRO','LEGEND','SPECTRAL','MODERATOR','ADMIN','DEV']);
const SEEDED_USER_IDS = new Set(DEFAULT_SITE_USERS.map(user => user.id));
function normalizeStoredUser(user) {
    if (!user || typeof user !== 'object') return null;
    const id = safeIdentifier(user.id);
    const username = sanitizeField(user.username, 20);
    if (!id || !username) return null;
    const role = STORED_ROLE_KEYS.has(user.role) ? user.role : 'USER';
    // Keep an existing owner's local credential during the demo migration.
    // New visitors still receive a passwordless showcase profile, and cloud
    // deployments never accept a seeded password from browser storage.
    const keepLocalOwnerPassword = id === 'su_dev' && LOCAL_DEVELOPMENT_ORIGIN && !validSupabaseConfig();
    const storedPassword = sanitizeField(user.password, 128);
    return {
        id,
        username,
        email: sanitizeField(user.email, 254),
        password: SEEDED_USER_IDS.has(id) && !keepLocalOwnerPassword ? '' : (keepLocalOwnerPassword ? storedPassword || LOCAL_OWNER_PASSWORD : storedPassword),
        role,
        roleSource: sanitizeField(user.roleSource,32),
        displayName: sanitizeField(user.displayName || username, 24) || username,
        bio: sanitizeField(user.bio, 120),
        avatar: safeAvatarUrl(user.avatar),
        registeredAt: sanitizeField(user.registeredAt, 24),
        totalTimeSec: Math.max(0, Number(user.totalTimeSec) || 0),
        visitCount: Math.max(0, Math.floor(Number(user.visitCount) || 0)),
        lastSeen: user.lastSeen && !isNaN(new Date(user.lastSeen).getTime()) ? new Date(user.lastSeen).toISOString() : null,
        banned: Boolean(user.banned),
        status: sanitizeField(user.status, 100),
        mcTimeSec: Math.max(0, Number(user.mcTimeSec) || 0)
    };
}
function loadSiteUsers()  {
    const users = readJsonStorage(K_USERS, null, Array.isArray);
    return users ? users.map(normalizeStoredUser).filter(Boolean).slice(0, 250) : null;
}
function saveSiteUsers(u) { try{localStorage.setItem(K_USERS,JSON.stringify(u));}catch{return false;} cloudPushUsers(u); return true; }
function loadSession()    { try{return localStorage.getItem(K_SESSION)||null;}catch{return null;} }
function saveSession(id)  { try{if(id)localStorage.setItem(K_SESSION,id);else localStorage.removeItem(K_SESSION);}catch{} }
function loadMcAccounts(uid) {
    const accounts = readJsonStorage(K_MC_PFX+uid, null, Array.isArray);
    if (!accounts) return null;
    let changed = false;
    const sanitized = accounts.map(account => {
        if (!account || typeof account !== 'object') { changed = true; return null; }
        const { password, accessToken, refreshToken, ...safe } = account;
        if (password || accessToken || refreshToken) changed = true;
        const id = safeIdentifier(safe.id);
        const username = sanitizeField(safe.username, 32);
        if (!id || !username) { changed = true; return null; }
        const type = ['microsoft','elyby','offline'].includes(safe.type) ? safe.type : 'offline';
        return {
            id,
            username,
            displayName: sanitizeField(safe.displayName || username, 32) || username,
            type,
            uuid: sanitizeField(safe.uuid, 36),
            addedAt: sanitizeField(safe.addedAt, 24),
            playtime: sanitizeField(safe.playtime, 24) || '0h',
            favorite: Boolean(safe.favorite),
            lastUsed: safe.lastUsed && !isNaN(new Date(safe.lastUsed).getTime()) ? new Date(safe.lastUsed).toISOString() : null
        };
    }).filter(Boolean).slice(0, 100);
    if (changed) {
        try { localStorage.setItem(K_MC_PFX+uid, JSON.stringify(sanitized)); } catch {}
    }
    return sanitized;
}
function saveMcAccounts(uid,a) { try{localStorage.setItem(K_MC_PFX+uid,JSON.stringify(a));return true;}catch{return false;} }
function loadActiveMc(uid)     { try{return localStorage.getItem(K_MC_ACT+uid)||null;}catch{return null;} }
function saveActiveMc(uid,id)  { try{if(id)localStorage.setItem(K_MC_ACT+uid,id);else localStorage.removeItem(K_MC_ACT+uid);return true;}catch{return false;} }
function loadRoleOrders() { return AccountPolicy.reservations(readJsonStorage(K_ROLE_ORDERS, [], Array.isArray)); }
function saveRoleOrders(orders) { try{localStorage.setItem(K_ROLE_ORDERS,JSON.stringify(AccountPolicy.reservations(orders)));return true;}catch{return false;} }
function loadProfileStyles() { return readJsonStorage(K_PROFILE_STYLES, {}, value=>value&&typeof value==='object'&&!Array.isArray(value)); }
function saveProfileStyles(styles) { try{localStorage.setItem(K_PROFILE_STYLES,JSON.stringify(styles||{}));}catch{} }
function loadDevRolePreviews() { return readJsonStorage(K_DEV_ROLE_PREVIEWS, {}, value=>value&&typeof value==='object'&&!Array.isArray(value)); }
function saveDevRolePreviews(previews) { try{localStorage.setItem(K_DEV_ROLE_PREVIEWS,JSON.stringify(previews||{}));}catch{} }

// ── Cloud sync: authenticated owner only ──────────────────────
// These helpers never send the complete local database. They can only touch
// the authenticated user's own profile, Minecraft profiles and friendships.
// Privileged fields (role, ban state and account ownership) are server-owned.
function cloudPushUsers(users) {
    if (!cloudReady() || !Array.isArray(users)) return;
    const user = users.find(candidate => candidate.id === cloudAuthUserId);
    if (!user) return;
    const row = {
        username: sanitizeField(user.username, 20),
        display_name: sanitizeField(user.displayName || user.username, 24),
        bio: sanitizeField(user.bio, 120),
        avatar: safeAvatarUrl(user.avatar),
        total_time_sec: Math.max(0, Math.round(Number(user.totalTimeSec) || 0)),
        visit_count: Math.max(0, Math.floor(Number(user.visitCount) || 0)),
        last_seen: user.lastSeen || null,
        status: sanitizeField(user.status, 100),
        mc_time_sec: Math.max(0, Math.round(Number(user.mcTimeSec) || 0))
    };
    cloud.from('site_users').update(row).eq('id', cloudAuthUserId)
        .then(({ error }) => { if (error) handleCloudError('profile sync', error); })
        .catch(error => handleCloudError('profile sync', error));
}
let mcSaveInProgress = false;
async function saveMinecraftProfiles(uid, accounts, activeId) {
    if (mcSaveInProgress) throw new Error('Wait for the current Minecraft profile change to finish.');
    if (uid !== currentUserId) throw new Error('Sign in again before changing Minecraft profiles.');
    mcSaveInProgress = true;
    try {
        if (validSupabaseConfig()) {
            if (!cloudReady() || uid !== cloudAuthUserId) throw new Error('Reconnect to save Minecraft profiles online.');
            const rows = accounts.map(account => ({
                id: safeIdentifier(account.id),
                user_id: uid,
                username: sanitizeField(account.username, 32),
                display_name: sanitizeField(account.displayName || account.username, 32),
                type: ['microsoft','elyby','offline'].includes(account.type) ? account.type : 'offline',
                uuid: sanitizeField(account.uuid, 36),
                added_at: sanitizeField(account.addedAt, 24),
                playtime: sanitizeField(account.playtime, 24) || '0h',
                favorite: Boolean(account.favorite),
                last_used: account.lastUsed || null,
                is_active: account.id === activeId
            }));
            if (rows.length > 100 || rows.some(row => !row.id || !row.username)) throw new Error('Invalid Minecraft profile data.');
            const {data:stored,error:readError}=await cloud.from('mc_accounts')
                .select('id,username,display_name,type,uuid,added_at,playtime,favorite,last_used,is_active')
                .eq('user_id',uid).limit(100);
            if (readError) throw readError;
            const existing=new Map((stored||[]).map(row=>[row.id,row]));
            for (const row of rows) {
                const id=row.id;
                const changes={...row};
                delete changes.id;
                delete changes.user_id;
                const previous=existing.get(id);
                if(previous && Object.entries(changes).every(([key,value])=>
                    key==='last_used' ? (value ? Date.parse(previous[key])===Date.parse(value) : !previous[key])
                        : (previous[key]??null)===(value??null)))continue;
                const request=previous
                    ? cloud.from('mc_accounts').update(changes).eq('id',id).eq('user_id',uid)
                    : cloud.from('mc_accounts').insert(row);
                const {data,error}=await request.select('id');
                if (error) throw error;
                if (!data?.some(saved=>saved.id===id)) throw new Error('The database did not confirm the Minecraft profile change.');
            }
            const keepIds=new Set(rows.map(row=>row.id));
            const removed=[...existing.keys()].filter(id=>!keepIds.has(id));
            if (removed.length) {
                const {error}=await cloud.from('mc_accounts').delete().eq('user_id',uid).in('id',removed);
                if (error) throw error;
            }
            const {data:verified,error:verifyError}=await cloud.from('mc_accounts')
                .select('id,username,display_name,type,uuid,added_at,playtime,favorite,last_used,is_active')
                .eq('user_id',uid).limit(100);
            if (verifyError) throw verifyError;
            if (verified?.length!==rows.length || rows.some(expected=>{
                const actual=verified.find(row=>row.id===expected.id);
                return !actual || Object.entries(expected).some(([key,value])=>{
                    if(key==='user_id')return false;
                    if(key==='last_used')return value ? Date.parse(actual[key])!==Date.parse(value) : Boolean(actual[key]);
                    return (actual[key]??null)!==(value??null);
                });
            })) throw new Error('The database did not confirm the final Minecraft profile list.');
        }
        if (uid !== currentUserId) throw new Error('The account changed while saving Minecraft profiles.');
        // Cloud is authoritative. A full browser cache must not turn a confirmed
        // online save into a failed user action; the next sign-in reloads it.
        const cachedAccounts=saveMcAccounts(uid,accounts);
        const cachedActive=saveActiveMc(uid,activeId);
        if (!validSupabaseConfig() && (!cachedAccounts || !cachedActive)) {
            throw new Error('Storage is full. Free some space and try again.');
        }
        mcAccounts=accounts;
        activeMcId=activeId;
        return true;
    } catch (error) {
        handleCloudError('Minecraft profile save',error);
        if (validSupabaseConfig() && !/Reconnect|account changed|Wait for/.test(error.message||'')) {
            throw new Error('Minecraft profiles could not be saved online. Please try again.',{cause:error});
        }
        throw error;
    } finally {
        mcSaveInProgress = false;
    }
}
function cloudPushFriends(list) {
    if (!cloudReady() || !Array.isArray(list) || currentUserId !== cloudAuthUserId) return;
    const currentUserRows = list.filter(friendship =>
        friendship.requester === cloudAuthUserId || friendship.addressee === cloudAuthUserId);
    const rows = currentUserRows.map(friendship => ({
        id: safeIdentifier(friendship.id),
        requester_id: safeIdentifier(friendship.requester),
        addressee_id: safeIdentifier(friendship.addressee),
        status: friendship.status === 'accepted' ? 'accepted' : 'pending',
        created_at: friendship.createdAt || new Date().toISOString()
    })).filter(row => row.id && row.requester_id && row.addressee_id && row.requester_id !== row.addressee_id);
    // The requester may create a pending request, while only the addressee may
    // accept it. Keeping those writes separate mirrors the database RLS rules
    // and prevents an upsert from accidentally taking the insert-policy path.
    rows.forEach(row => {
        let request = null;
        if (row.requester_id === cloudAuthUserId && row.status === 'pending') {
            request = cloud.from('friendships').upsert(row, { onConflict:'id' });
        } else if (row.addressee_id === cloudAuthUserId && row.status === 'accepted') {
            request = cloud.from('friendships').update({ status:'accepted' })
                .eq('id', row.id).eq('addressee_id', cloudAuthUserId);
        }
        if (request) request
            .then(({ error }) => { if (error) handleCloudError('friendship sync', error); })
            .catch(error => handleCloudError('friendship sync', error));
    });
    const keepIds = rows.map(row => row.id);
    let deletion = cloud.from('friendships').delete()
        .or(`requester_id.eq.${cloudAuthUserId},addressee_id.eq.${cloudAuthUserId}`);
    if (keepIds.length) deletion = deletion.not('id', 'in', `(${keepIds.join(',')})`);
    deletion.then(({ error }) => { if (error) handleCloudError('friendship cleanup', error); })
        .catch(error => handleCloudError('friendship cleanup', error));
}

function cloudProfileToUser(row, authEmail = '') {
    return normalizeStoredUser({
        id: row.id,
        username: row.username,
        email: row.id === cloudAuthUserId && !/@users\.spectral\.invalid$/i.test(authEmail) ? authEmail : '',
        password: '',
        role: row.role,
        displayName: row.display_name,
        bio: row.bio,
        avatar: row.avatar,
        registeredAt: row.registered_at,
        totalTimeSec: row.total_time_sec,
        visitCount: row.visit_count,
        lastSeen: row.last_seen,
        banned: row.banned,
        status: row.status,
        mcTimeSec: row.mc_time_sec
    });
}

// RLS limits each result set. The profile query deliberately omits email and
// password_hash, even if a deployment accidentally grants broader SELECT.
async function cloudBootstrap(authUser = null) {
    if (!cloud || !cloudAuthUserId) return;
    const ownerId=cloudAuthUserId;
    cloudSyncing = true;
    let successful=false;
    try {
        const [profilesRes, mcRes, friendsRes] = await Promise.all([
            cloud.from('site_users').select('id,username,role,display_name,bio,avatar,registered_at,total_time_sec,visit_count,last_seen,banned,status,mc_time_sec'),
            cloud.from('mc_accounts').select('id,user_id,username,display_name,type,uuid,added_at,playtime,favorite,last_used,is_active').eq('user_id', cloudAuthUserId).limit(100),
            cloud.from('friendships').select('id,requester_id,addressee_id,status,created_at').limit(500)
        ]);
        if (profilesRes.error) throw profilesRes.error;
        if (mcRes.error) throw mcRes.error;
        if (friendsRes.error) throw friendsRes.error;
        if (!(profilesRes.data || []).some(row => row.id === ownerId)) {
            throw new Error('The account profile is missing from Supabase. Apply the Auth profile migration.');
        }

        if(cloudAuthUserId!==ownerId)return false;
        successful=true;
        (profilesRes.data || []).map(row => cloudProfileToUser(row, authUser?.email || '')).filter(Boolean).forEach(profile => {
            const index = siteUsers.findIndex(user => user.id === profile.id);
            if (index >= 0) siteUsers[index] = profile;
            else siteUsers.push(profile);
        });
        friendships = (friendsRes.data || []).map(row => ({
            id: safeIdentifier(row.id),
            requester: safeIdentifier(row.requester_id),
            addressee: safeIdentifier(row.addressee_id),
            status: row.status === 'accepted' ? 'accepted' : 'pending',
            createdAt: row.created_at || ''
        })).filter(friendship => friendship.id && friendship.requester && friendship.addressee);

        const accounts = (mcRes.data || []).map(row => ({
            id: safeIdentifier(row.id),
            username: sanitizeField(row.username, 32),
            displayName: sanitizeField(row.display_name || row.username, 32),
            type: ['microsoft','elyby','offline'].includes(row.type) ? row.type : 'offline',
            uuid: sanitizeField(row.uuid, 36) || offlineUuid(row.username),
            addedAt: sanitizeField(row.added_at, 24),
            playtime: sanitizeField(row.playtime, 24) || '0h',
            favorite: Boolean(row.favorite),
            lastUsed: row.last_used || null
        })).filter(account => account.id && account.username);
        try {
            localStorage.setItem(K_USERS, JSON.stringify(siteUsers));
            localStorage.setItem(K_FRIENDS, JSON.stringify(friendships));
            localStorage.setItem(K_MC_PFX + cloudAuthUserId, JSON.stringify(accounts));
            const active = (mcRes.data || []).find(row => row.is_active);
            if (active?.id) localStorage.setItem(K_MC_ACT + cloudAuthUserId, active.id);
        } catch {}
    } catch (error) {
        handleCloudError('authenticated sync', error);
    } finally {
        cloudSyncing = false;
    }
    reloadMcAccounts();
    renderAll();
    return successful;
}
function normalizeForumPost(post) {
    if (!post || typeof post !== 'object') return null;
    const id = safeIdentifier(post.id);
    const authorId = safeIdentifier(post.authorId);
    if (!id || !authorId) return null;
    return {
        id,
        authorId,
        authorName: sanitizeField(post.authorName, 24) || 'Player',
        authorRole: ['USER','VETERAN','PRO','LEGEND','SPECTRAL','MODERATOR','ADMIN','DEV'].includes(post.authorRole) ? post.authorRole : 'USER',
        title: sanitizeField(post.title, 80),
        text: sanitizeField(post.text, 500),
        date: sanitizeField(post.date, 24),
        upvotes: Array.isArray(post.upvotes) ? [...new Set(post.upvotes.map(value=>safeIdentifier(value)).filter(Boolean))].slice(0, 500) : [],
        voteCount: Number.isFinite(Number(post.voteCount)) ? Math.max(0, Number(post.voteCount)) : null,
        viewerVoted: Boolean(post.viewerVoted),
        createdAt: sanitizeField(post.createdAt,40),
        approved: Boolean(post.approved),
        rejected: Boolean(post.rejected)
    };
}
function normalizeNewsItem(item) {
    if (!item || typeof item !== 'object') return null;
    const id = safeIdentifier(item.id);
    if (!id) return null;
    const changes = Array.isArray(item.items) ? item.items.slice(0, 50).map(change=>({
        type: ['add','imp','fix','breaking','security'].includes(change?.type) ? change.type : 'imp',
        text: sanitizeField(change?.text, 500)
    })).filter(change=>change.text) : [];
    return {
        id,
        date: sanitizeField(item.date, 32),
        title: sanitizeField(item.title, 100),
        version: sanitizeField(item.version, 32),
        channel: ['stable','beta','dev','website'].includes(item.channel) ? item.channel : 'stable',
        icon: sanitizeField(item.icon, 40),
        summary: sanitizeField(item.summary, 220),
        isCurrent: Boolean(item.isCurrent),
        dimmed: Boolean(item.dimmed),
        items: changes
    };
}
function normalizeFriendship(friendship) {
    if (!friendship || typeof friendship !== 'object') return null;
    const id = safeIdentifier(friendship.id);
    const requester = safeIdentifier(friendship.requester);
    const addressee = safeIdentifier(friendship.addressee);
    if (!id || !requester || !addressee || requester === addressee) return null;
    return { id, requester, addressee, status:friendship.status==='accepted'?'accepted':'pending', createdAt:sanitizeField(friendship.createdAt,40) };
}
function loadForum()   { const posts=readJsonStorage(K_FORUM,null,Array.isArray);return posts?posts.map(normalizeForumPost).filter(Boolean).slice(0,250):null; }
function saveForum(p)  { try{localStorage.setItem(K_FORUM,JSON.stringify(p));}catch{} }
function loadNews()    { const news=readJsonStorage(K_NEWS,null,Array.isArray);return news?news.map(normalizeNewsItem).filter(Boolean).slice(0,100):null; }
function saveNews(n)   { try{localStorage.setItem(K_NEWS,JSON.stringify(n));}catch{} }
function loadFriends() { const friends=readJsonStorage(K_FRIENDS,null,Array.isArray);return friends?friends.map(normalizeFriendship).filter(Boolean).slice(0,500):null; }
function saveFriends(f){ try{localStorage.setItem(K_FRIENDS,JSON.stringify(f));}catch{} cloudPushFriends(f); }

// ── UUID generator ────────────────────────────────────────────
function offlineUuid(username) {
    const s='OfflinePlayer:'+(username||'');
    const bytes=[];let h=0x811c9dc5>>>0;
    for(let pass=0;pass<4;pass++){let x=(h^(pass*0x9e3779b9))>>>0;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,0x01000193)>>>0;}bytes.push((x>>>24)&255,(x>>>16)&255,(x>>>8)&255,x&255);h=x;}
    const b=bytes.slice(0,16);b[6]=(b[6]&0x0f)|0x30;b[8]=(b[8]&0x3f)|0x80;
    const hex=b.map(v=>v.toString(16).padStart(2,'0')).join('');
    return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20,32);
}

// ── State ─────────────────────────────────────────────────────
let siteUsers    = loadSiteUsers() || DEFAULT_SITE_USERS.map(u=>({...u}));
let currentUserId = loadSession();
let mcAccounts   = [];
let activeMcId   = null;
let forumPosts   = loadForum() || DEFAULT_FORUM.map(p=>({...p}));
let newsItems    = loadNews()  || DEFAULT_NEWS.map(n=>({...n}));
let friendships  = loadFriends() || DEFAULT_FRIENDS.map(f=>({...f}));

// Seed: inject any new default update entries into existing stored news (without
// wiping user/DEV-created ones). Bump NEWS_SEED_VERSION when adding new defaults.
const NEWS_SEED_VERSION = 3;
(function seedNews(){
    try {
        const seeded = parseInt(localStorage.getItem('spectral_news_seed') || '0', 10);
        if (seeded < NEWS_SEED_VERSION) {
            const have = new Set(newsItems.map(n => n.id));
            const fresh = DEFAULT_NEWS.filter(n => !have.has(n.id));
            if (fresh.length) {
                newsItems.forEach(n => { n.isCurrent = false; });
                newsItems = [...fresh.map(n => ({...n})), ...newsItems];
                saveNews(newsItems);
            }
            localStorage.setItem('spectral_news_seed', String(NEWS_SEED_VERSION));
        }
    } catch {}
})();

// Upgrade older localStorage entries to the richer release-card format without
// replacing developer-authored titles or changelog text.
const NEWS_PRESENTATION_PRESETS = {
    news_modmanager_redesign: { version:'v0.9.4', channel:'beta', icon:'puzzle-piece', summary:'A cleaner two-panel mod workflow with faster discovery, clearer actions and a more consistent launcher interface.' },
    news_site_overhaul: { version:'Website 2.0', channel:'website', icon:'globe', summary:'Profiles, community ideas, themes and developer tools now live in one polished website experience.' },
    news_1: { version:'v0.9.3', channel:'beta', icon:'robot', summary:'Refined typography, a richer Accounts layout and the first integrated SpectrAI assistant experience.' },
    news_2: { version:'v0.9.2', channel:'stable', icon:'gauge-high', summary:'Faster launches, clearer diagnostics and more reliable setup for modded Minecraft instances.' },
    news_3: { version:'v0.9.1', channel:'stable', icon:'language', summary:'A consistent launcher interface with a redesigned console and complete RU / EN localization.' },
    news_4: { version:'Core', channel:'stable', icon:'cubes', summary:'The Qt 6 and C++17 foundation behind instances, Java management, versions, mods and diagnostics.' }
};
(function migrateNewsPresentation(){
    let changed=false;
    newsItems=newsItems.map((news,index)=>{
        const preset=NEWS_PRESENTATION_PRESETS[news.id]||{};
        const firstText=Array.isArray(news.items)&&news.items[0]?.text?news.items[0].text.replace(/[*`\[\]()]/g,''):'';
        const upgraded={
            ...news,
            version:news.version||preset.version||`Update ${Math.max(1,newsItems.length-index)}`,
            channel:news.channel||preset.channel||'stable',
            icon:news.icon||preset.icon||'bolt',
            summary:news.summary||preset.summary||firstText.slice(0,190)||'Launcher improvements and release notes.'
        };
        if(upgraded.version!==news.version||upgraded.channel!==news.channel||upgraded.icon!==news.icon||upgraded.summary!==news.summary)changed=true;
        return upgraded;
    });
    if(changed)saveNews(newsItems);
})();

// Validate session
if (currentUserId && (validSupabaseConfig() || !siteUsers.find(u=>u.id===currentUserId&&!u.banned))) { currentUserId=null; saveSession(null); }

// Init default MC accounts for default users
DEFAULT_SITE_USERS.forEach(u => {
    if (siteUsers.some(user=>user.id===u.id) && !loadMcAccounts(u.id) && DEFAULT_MC_ACCOUNTS[u.id]) {
        saveMcAccounts(u.id, DEFAULT_MC_ACCOUNTS[u.id]);
    }
});

// ── Load MC accounts for current site user ────────────────────
function reloadMcAccounts() {
    if (!currentUserId) { mcAccounts=[]; activeMcId=null; return; }
    mcAccounts = loadMcAccounts(currentUserId) || [];
    const storedActive=loadActiveMc(currentUserId);
    activeMcId = mcAccounts.some(account=>account.id===storedActive)?storedActive:(mcAccounts[0]?.id||null);
    if(activeMcId!==storedActive)saveActiveMc(currentUserId,activeMcId||'');
}

// ── Session time tracking ─────────────────────────────────────
// Accumulates real time-on-site for the logged-in user (active tab only),
// persisted to localStorage + Supabase so DEV analytics can show averages.
let _timeTick = null, _flushTimeTick = null, _timeListenersBound = false;
let _lastTickTs = Date.now(), _pendingTime = 0, _visitBumpedFor = null;
function beginUserSession() {
    const u = siteUsers.find(x => x.id === currentUserId);
    // Count one visit per logged-in user per page load (avoids double-counting
    // when cloudBootstrap re-runs this after the initial render).
    if (u && _visitBumpedFor !== u.id) {
        _visitBumpedFor = u.id;
        u.visitCount = (u.visitCount || 0) + 1; u.lastSeen = new Date().toISOString();
        saveSiteUsers(siteUsers);
    }
    startTimeTracking();
}
function startTimeTracking() {
    _lastTickTs = Date.now();
    if (_timeTick) return;
    _timeTick = setInterval(() => {
        const now = Date.now();
        if (document.hidden || !currentUserId) { _lastTickTs = now; return; }
        const delta = Math.min((now - _lastTickTs) / 1000, 120); // seconds, cap stray gaps
        _lastTickTs = now;
        _pendingTime += delta;
        const u = siteUsers.find(x => x.id === currentUserId);
        if (u) u.totalTimeSec = (u.totalTimeSec || 0) + delta;
    }, 5000);
    _flushTimeTick = setInterval(flushSessionTime, 30000);
    if (!_timeListenersBound) {
        _timeListenersBound = true;
        document.addEventListener('visibilitychange', () => { if (document.hidden) flushSessionTime(); _lastTickTs = Date.now(); });
        window.addEventListener('beforeunload', flushSessionTime);
    }
}
function flushSessionTime() {
    if (!currentUserId || _pendingTime < 1) return;
    const u = siteUsers.find(x => x.id === currentUserId);
    if (u) { u.lastSeen = new Date().toISOString(); saveSiteUsers(siteUsers); }
    _pendingTime = 0;
}
function stopTimeTracking() {
    flushSessionTime();
    if (_timeTick) clearInterval(_timeTick);
    if (_flushTimeTick) clearInterval(_flushTimeTick);
    _timeTick = null;
    _flushTimeTick = null;
    _lastTickTs = Date.now();
}

// ── Avatar URL ────────────────────────────────────────────────
function avatarUrl(username) { return `https://minotar.net/avatar/${encodeURIComponent(username)}/100`; }
function siteAvatarUrl(user) { return safeAvatarUrl(user?.avatar, 'assets/avatar-placeholder.svg'); }

// ── Roles (data-driven hierarchy) ─────────────────────────────
// rank drives permissions; higher rank = more power. Add a role here and it
// automatically appears in badges, the admin role picker and the stats charts.
const ROLES = {
    USER:      { label:'Player',    rank:0,  icon:'fas fa-user',          color:'#9ca3af', grad:'linear-gradient(135deg,#6b7280,#4b5563)', profileLimit:2,  favoriteLimit:1,  tagline:'The essential Spectral identity', perks:['2 launcher profiles','1 favorite profile','Nebula Drift animated header','Soft Signal menu entrance'] },
    VETERAN:   { label:'Veteran',   rank:1,  icon:'fas fa-shield-halved', color:'#2dd4bf', grad:'linear-gradient(135deg,#14b8a6,#0f766e)', profileLimit:4,  favoriteLimit:3,  tagline:'Permanent founder status', perks:['4 launcher profiles and 3 favorites','Permanent founding-year badge','Veteran Archive animated header','Aurora menu entrance effect'] },
    PRO:       { label:'Pro',       rank:2,  icon:'fas fa-star',          color:'#fbbf24', grad:'linear-gradient(135deg,#fbbf24,#d97706)', profileLimit:8,  favoriteLimit:8,  tagline:'Built for everyday players', perks:['8 launcher profiles and favorites','Golden nameplate and avatar frame','Solar Flux animated header','Solar profile identity effects'] },
    LEGEND:    { label:'Legend',    rank:3,  icon:'fas fa-crown',         color:'#a78bfa', grad:'linear-gradient(135deg,#8b5cf6,#6d28d9)', profileLimit:16, favoriteLimit:16, tagline:'A rare community presence', perks:['16 launcher profiles and favorites','Violet Crown animated header','Stardust profile-menu entrance','Violet nameplate and avatar frame'] },
    SPECTRAL:  { label:'Spectral',  rank:4,  icon:'fas fa-gem',           color:'#67e8f9', grad:'linear-gradient(135deg,#22d3ee,#8b5cf6 52%,#ec4899)', profileLimit:Infinity, favoriteLimit:Infinity, tagline:'The complete Spectral experience', perks:['Unlimited profiles and favorites','Prism Rift animated header','Prismatic nameplate and Rift entrance','All premium profile appearances'] },
    MODERATOR: { label:'Moderator', rank:10, icon:'fas fa-gavel',         color:'#60a5fa', grad:'linear-gradient(135deg,#3b82f6,#2563eb)', profileLimit:Infinity, favoriteLimit:Infinity, tagline:'Community moderation access', perks:['Unlimited profiles and favorites','Guardian Grid staff header','Moderation queue and safety tools','Verified staff identity effects'] },
    ADMIN:     { label:'Admin',     rank:20, icon:'fas fa-user-shield',   color:'#f87171', grad:'linear-gradient(135deg,#ef4444,#dc2626)', profileLimit:Infinity, favoriteLimit:Infinity, tagline:'Full community management', perks:['Unlimited profiles and favorites','Command Core animated header','User and role management suite','Live community analytics access'] },
    DEV:       { label:'Developer', rank:30, icon:'fas fa-code',          color:'#f472b6', grad:'linear-gradient(135deg,#ec4899,#f43f5e)', profileLimit:Infinity, favoriteLimit:Infinity, tagline:'Spectral development team', perks:['Every animated header and entrance','Safe preview of every account role','Release publishing and experiments','Developer-only Code Matrix identity'] }
};
const ROLE_ORDER = Object.keys(ROLES);
function roleInfo(role)  { return ROLES[role] || ROLES.USER; }
function roleRank(role)  { return roleInfo(role).rank; }
const VETERAN_CUTOFF = new Date(2027, 0, 1).getTime();
const PREMIUM_ROLES = ['PRO','LEGEND','SPECTRAL'];
function isVeteranEligible(user) {
    const registered = parseRegDate(user && user.registeredAt);
    return !!registered && registered < VETERAN_CUTOFF;
}
function roleForRegistration(date=new Date()) { return date.getTime() < VETERAN_CUTOFF ? 'VETERAN' : 'USER'; }
function roleProfileLimit(role) { return roleInfo(role).profileLimit; }
function roleFavoriteLimit(role) { return roleInfo(role).favoriteLimit; }
function formatRoleLimit(value) { return Number.isFinite(value) ? String(value) : 'Unlimited'; }
function applyAutomaticVeteran(users) {
    let changed = false;
    (users || []).forEach(user => {
        if (!validSupabaseConfig() && !user.roleSource && (!user.role || user.role === 'USER') && isVeteranEligible(user)) {
            user.role = 'VETERAN';
            user.roleSource = 'founder-2026';
            changed = true;
        }
    });
    return changed;
}
function updateVeteranRegistrationNote(){
    const note=document.getElementById('veteranRegistrationNote');if(!note)return;
    note.hidden=validSupabaseConfig();
    note.style.display=note.hidden?'none':'';
    if(note.hidden)return;
    const title=note.querySelector('b');const copy=note.querySelector('small');
    const open=Date.now()<VETERAN_CUTOFF;
    note.classList.toggle('closed',!open);
    if(title)title.textContent=open?"Founder's window is open":"Veteran is now a legacy role";
    if(copy)copy.textContent=open?'Accounts created before 2027 receive the permanent Veteran role automatically.':'The automatic Veteran reward closed on January 1, 2027.';
}
// Permission helpers — pass a user (or use the current viewer)
function canAccessAdmin(u) { return !!u && !u.banned && roleRank(u.role) >= ROLES.MODERATOR.rank; }
function canModerate(u)    { return !!u && !u.banned && roleRank(u.role) >= ROLES.MODERATOR.rank; }
function canManageUsers(u) { return !!u && !u.banned && roleRank(u.role) >= ROLES.ADMIN.rank; }
function isDev(u)          { return !!u && !u.banned && u.role === 'DEV'; }
function displayedRoleKey(user) {
    if (!user) return 'USER';
    if (!isDev(user)) return ROLE_ORDER.includes(user.role) ? user.role : 'USER';
    const preview=loadDevRolePreviews()[user.id];
    return ROLE_ORDER.includes(preview) ? preview : 'DEV';
}
function setDeveloperRolePreview(user,role) {
    if(!isDev(user)||!ROLE_ORDER.includes(role))return false;
    const previews=loadDevRolePreviews();previews[user.id]=role;saveDevRolePreviews(previews);
    const styles=loadProfileStyles();styles[user.id]={header:ROLE_DEFAULT_HEADERS[role]||'code',entrance:ROLE_DEFAULT_ENTRANCES[role]||'terminal'};saveProfileStyles(styles);
    return true;
}

// ── Role badge HTML ───────────────────────────────────────────
function roleBadgeHtml(role) {
    // Whitelist roles so a tampered value can't inject markup
    if (!ROLE_ORDER.includes(role) || role === 'USER') return '';
    const r = ROLES[role];
    return `<span class="role-badge role-${role.toLowerCase()}"><i class="${r.icon}"></i> ${r.label}</span>`;
}

// Upgrade existing pre-2027 Player accounts without touching premium or staff roles.
if (applyAutomaticVeteran(siteUsers)) saveSiteUsers(siteUsers);
updateVeteranRegistrationNote();

// ── Type helpers ──────────────────────────────────────────────
function typeLabel(t){ return {microsoft:'Microsoft',elyby:'Ely.by',offline:'Offline'}[t]||t; }
function typeIcon(t) { return {microsoft:'fab fa-microsoft',elyby:'fas fa-cloud',offline:'fas fa-user-shield'}[t]||'fas fa-user'; }
