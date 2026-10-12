/* Server-backed ideas. Local sample posts stay confined to demo mode. */
let communityCloudError='';
let communityRequest=0;
if(validSupabaseConfig())forumPosts=[];
async function loadCommunityCloud(){
    if(!validSupabaseConfig()||!cloud)return false;
    const request=++communityRequest;
    try{
        const {data,error}=await cloud.rpc('spectral_ideas_feed');
        if(error)throw error;
        if(request!==communityRequest)return false;
        forumPosts=(Array.isArray(data)?data:[]).map(normalizeForumPost).filter(Boolean);
        communityCloudError='';
        renderForum();
        if(typeof renderAdminV2==='function'&&adminV2.tab==='forum')renderAdminV2Forum();
        return true;
    }catch(error){
        if(request!==communityRequest)return false;
        forumPosts=[];
        communityCloudError='Community data is unavailable. Apply the community administration migration or retry the connection.';
        console.warn('[community] feed failed:',error.message||error);
        renderForum();
        return false;
    }
}
async function submitCommunityIdea(title,body){
    if(!authAvailable()||!cloudAuthUserId)throw new Error('Sign in to submit an idea.');
    const {error}=await cloud.rpc('spectral_idea_submit',{p_title:title,p_body:body});
    if(error)throw new Error(error.message||'Could not submit the idea.');
    await loadCommunityCloud();
}
async function voteCommunityIdea(id){
    if(!authAvailable()||!cloudAuthUserId)throw new Error('Sign in to vote.');
    const {error}=await cloud.rpc('spectral_idea_vote',{p_idea_id:id});
    if(error)throw new Error(error.message||'Could not save your vote.');
    await loadCommunityCloud();
}
async function moderateCommunityIdea(id,action,reason){
    if(!authAvailable()||!cloudAuthUserId)throw new Error('Reconnect to moderation.');
    const {error}=await cloud.rpc('spectral_idea_moderate',{p_idea_id:id,p_action:action,p_reason:reason});
    if(error)throw new Error(error.message||'The server rejected this review.');
    await loadCommunityCloud();
    await loadCommunityAudit();
}
let communityRemoteAudit=[];
async function loadCommunityAudit(){
    if(!validSupabaseConfig()||!authAvailable()||!canModerate(workspaceUser()))return;
    const {data,error}=await cloud.rpc('spectral_idea_audit_feed');
    if(error){console.warn('[community] audit failed:',error.message||error);return;}
    communityRemoteAudit=Array.isArray(data)?data:[];
    if(typeof renderAdminV2==='function'&&adminV2.tab==='activity')renderAdminV2();
}
