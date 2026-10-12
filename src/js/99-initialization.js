// ══════════════════════════════════════════════════════════════
// INITIAL RENDER
// ══════════════════════════════════════════════════════════════
renderAll();
if (currentUserId) beginUserSession();

// Cloud auth is opt-in. When configured, initialization restores only the
// authenticated user's owner-scoped data; otherwise the site stays local.
initSupabaseAuth().catch(()=>console.warn('[startup] Optional authentication is unavailable; local mode remains active.'));

}); // DOMContentLoaded
