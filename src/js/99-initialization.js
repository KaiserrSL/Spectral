// ══════════════════════════════════════════════════════════════
// INITIAL RENDER
// ══════════════════════════════════════════════════════════════
renderAll();
if (currentUserId) beginUserSession();

// Cloud auth is opt-in. When configured, initialization restores only the
// authenticated user's owner-scoped data; otherwise the site stays local.
initSupabaseAuth().catch(()=>console.warn('[startup] Optional authentication is unavailable; local mode remains active.'));

// Keep an open site in sync with profiles added or removed in the launcher.
let lastMinecraftRefresh = 0;
async function refreshMinecraftProfilesIfDue() {
    if (document.hidden || !currentUserId || currentUserId !== cloudAuthUserId
        || mcSaveInProgress || Date.now() - lastMinecraftRefresh < 5000) return;
    lastMinecraftRefresh = Date.now();
    await refreshMinecraftProfiles();
}
window.addEventListener('focus', refreshMinecraftProfilesIfDue);
document.addEventListener('visibilitychange', refreshMinecraftProfilesIfDue);
setInterval(refreshMinecraftProfilesIfDue, 15000);

// Refresh incoming requests even when the recipient keeps the site open.
let lastFriendRefresh = 0;
async function refreshFriendshipsIfDue() {
    if(document.hidden || Date.now()-lastFriendRefresh<5000)return;
    lastFriendRefresh=Date.now();
    await refreshFriendships();
}
window.addEventListener('focus',refreshFriendshipsIfDue);
window.addEventListener('online',refreshFriendshipsIfDue);
document.addEventListener('visibilitychange',refreshFriendshipsIfDue);
setInterval(refreshFriendshipsIfDue,5000);

}); // DOMContentLoaded
