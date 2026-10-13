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

}); // DOMContentLoaded
