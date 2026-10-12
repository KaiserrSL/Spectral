// ══════════════════════════════════════════════════════════════
// ADD MC ACCOUNT MODAL
// ══════════════════════════════════════════════════════════════
const addAccOverlay = document.getElementById('addAccountOverlay');
// The accounts <section> has a CSS transform, which would trap this position:fixed
// overlay inside it. Re-parent to <body> so it centres against the viewport.
if (addAccOverlay && addAccOverlay.parentElement !== document.body) document.body.appendChild(addAccOverlay);
const openAddBtn    = document.getElementById('openAddAccountBtn');
const closeAddBtn   = document.getElementById('closeAddAccountBtn');
let pendingAccountTimer = 0;
function resetPendingAccountAction(){
    if(pendingAccountTimer)clearTimeout(pendingAccountTimer);
    pendingAccountTimer=0;
    ['btnElybySubmit','btnOfflineSubmit'].forEach(id=>{const button=document.getElementById(id);if(!button)return;button.disabled=false;if(button.dataset.originalHtml){button.innerHTML=button.dataset.originalHtml;delete button.dataset.originalHtml;}});
}

function openAddAccount() {
    if (!currentUserId) { openDashboard(); return; }
    const user=currentRoleUser();
    const limit=roleProfileLimit(user?.role||'USER');
    if(Number.isFinite(limit)&&mcAccounts.length>=limit){showToast(`All ${limit} ${roleInfo(user?.role).label} profile slots are in use.`,'users-rectangle');openRoleStore();return;}
    if (!addAccOverlay) return;
    addAccOverlay.classList.add('open'); document.body.style.overflow='hidden';
    switchAccType('elyby');
    document.querySelectorAll('.acc-type-card').forEach(c=>c.classList.toggle('active',c.dataset.type==='elyby'));
    ['elybyLogin','offlineUsername'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
}
function closeAddAccount() {
    if (!addAccOverlay) return;
    resetPendingAccountAction();
    addAccOverlay.classList.remove('open'); syncBodyScrollLock();
}
function switchAccType(type) {
    ['elyby','offline'].forEach(t=>{const el=document.getElementById('form'+t.charAt(0).toUpperCase()+t.slice(1));if(el)el.style.display=t===type?'block':'none';});
}
if(openAddBtn)openAddBtn.addEventListener('click',openAddAccount);
document.getElementById('accountsEmptyAddBtn')?.addEventListener('click',openAddAccount);
if(closeAddBtn)closeAddBtn.addEventListener('click',closeAddAccount);
if(addAccOverlay)addAccOverlay.addEventListener('click',e=>{if(e.target===addAccOverlay)closeAddAccount();});

document.querySelectorAll('.acc-type-card').forEach(card=>{card.addEventListener('click',()=>{document.querySelectorAll('.acc-type-card').forEach(c=>c.classList.remove('active'));card.classList.add('active');switchAccType(card.dataset.type);});});

const btnElyby=document.getElementById('btnElybySubmit');
if(btnElyby){btnElyby.addEventListener('click',async()=>{if(pendingAccountTimer)return;const l=document.getElementById('elybyLogin');const login=sanitizeField(l?l.value:'',32);if(!login){if(l)l.focus();return;}btnElyby.dataset.originalHtml=btnElyby.innerHTML;btnElyby.disabled=true;btnElyby.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> Saving profile...';pendingAccountTimer=-1;try{if(await addMcAccount(login,'elyby'))closeAddAccount();}finally{resetPendingAccountAction();}});}

const btnOffline=document.getElementById('btnOfflineSubmit');
if(btnOffline){btnOffline.addEventListener('click',async()=>{if(pendingAccountTimer)return;const u=document.getElementById('offlineUsername');const user=sanitizeField(u?u.value:'',32);if(!user||user.length<3){if(u)u.focus();return;}btnOffline.dataset.originalHtml=btnOffline.innerHTML;btnOffline.disabled=true;btnOffline.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> Saving profile...';pendingAccountTimer=-1;try{if(await addMcAccount(user,'offline'))closeAddAccount();}finally{resetPendingAccountAction();}});}

// ══════════════════════════════════════════════════════════════
// CONFIRM MODAL
// ══════════════════════════════════════════════════════════════
const confirmOverlay=document.getElementById('confirmOverlay');
let confirmCb=null;
function showConfirm(text,cb){const el=document.getElementById('confirmText');if(el)el.textContent=text;confirmCb=cb;if(confirmOverlay){confirmOverlay.classList.add('open');document.body.style.overflow='hidden';}}
function hideConfirm(){if(confirmOverlay){confirmOverlay.classList.remove('open');syncBodyScrollLock();}}
document.getElementById('confirmCancel')&&document.getElementById('confirmCancel').addEventListener('click',()=>{hideConfirm();confirmCb=null;});
const confirmDelBtn=document.getElementById('confirmDeleteBtn');
if(confirmDelBtn){confirmDelBtn.addEventListener('click',()=>{if(confirmCb){const cb=confirmCb;confirmCb=null;hideConfirm();cb();}else hideConfirm();});}
if(confirmOverlay)confirmOverlay.addEventListener('click',e=>{if(e.target===confirmOverlay){hideConfirm();confirmCb=null;}});

// ══════════════════════════════════════════════════════════════
// NEWS SYSTEM (DEV editable)
// ══════════════════════════════════════════════════════════════
function renderDevWriteBtn() {
    const btn=document.getElementById('devWriteNewsBtn');if(!btn)return;
    const user=siteUsers.find(u=>u.id===currentUserId);
    btn.style.display=(user&&user.role==='DEV')?'inline-flex':'none';
}

// News editor modal
const newsEditorOverlay=document.getElementById('newsEditorOverlay');

document.getElementById('devWriteNewsBtn')&&document.getElementById('devWriteNewsBtn').addEventListener('click',openNewsEditor);
document.getElementById('closeNewsEditorBtn')&&document.getElementById('closeNewsEditorBtn').addEventListener('click',closeNewsEditor);
if(newsEditorOverlay)newsEditorOverlay.addEventListener('click',e=>{if(e.target===newsEditorOverlay)closeNewsEditor();});

// ══════════════════════════════════════════════════════════════
// FORUM
// ══════════════════════════════════════════════════════════════
// News system v2: filtering, rich release cards and a local-first editor.
const NEWS_DRAFT_KEY = 'spectral_news_draft_v2';
const NEWS_TYPES = {
    add: { label:'Added', icon:'plus' },
    imp: { label:'Improved', icon:'arrow-up' },
    fix: { label:'Fixed', icon:'wrench' },
    breaking: { label:'Important', icon:'triangle-exclamation' },
    security: { label:'Security', icon:'shield-halved' }
};
const NEWS_ICONS = new Set(['bolt','puzzle-piece','robot','gauge-high','language','terminal','palette','globe','cubes','shield-halved','wand-magic-sparkles','code-branch']);
let newsViewState = { query:'', filter:'all' };
let editingNewsId = null;
let newsDraftTimer = 0;
let newsTimelineObserver = null;

function validNewsType(type) { return Object.prototype.hasOwnProperty.call(NEWS_TYPES,type) ? type : 'add'; }
function validNewsIcon(icon) { return NEWS_ICONS.has(icon) ? icon : 'bolt'; }
function formatNewsText(value) {
    let safe = esc(value || '');
    safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
    return safe.replace(/\n/g, '<br>');
}
function releaseToMarkdown(item) {
    const channel = item.channel ? ` · ${item.channel}` : '';
    const version = item.version ? ` ${item.version}` : '';
    const summary = item.summary ? `\n\n${item.summary}` : '';
    const lines = (item.items || []).map(change => {
        const meta = NEWS_TYPES[validNewsType(change.type)];
        return `- **${meta.label}:** ${change.text}`;
    }).join('\n');
    return `## ${item.title}${version}\n\n_${item.date}${channel}_${summary}\n\n${lines}`.trim();
}
function copyLocalText(text, successMessage) {
    const done=()=>showToast(successMessage || 'Copied to clipboard','copy');
    if(navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done).catch(()=>{});
    else {
        const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px;top:0';
        document.body.appendChild(area);area.select();try{document.execCommand('copy');done();}catch{}area.remove();
    }
}
function releaseCardMarkup(item, isDev, preview) {
    const items = Array.isArray(item.items) ? item.items : [];
    const counts = items.reduce((all,change)=>{const type=validNewsType(change.type);all[type]=(all[type]||0)+1;return all;},{});
    const channel = ['stable','beta','dev','website'].includes(item.channel) ? item.channel : 'stable';
    const releaseIcon = validNewsIcon(item.icon);
    const version = item.version || (item.isCurrent ? 'Latest' : 'Release');
    const summary = item.summary || (items[0] ? items[0].text.replace(/[*`\[\]()]/g,'').slice(0,170) : 'Release notes and product changes.');
    const list = items.map(change=>`<li class="${validNewsType(change.type)}">${formatNewsText(change.text)}</li>`).join('');
    const typeSummary = ['add','imp','fix'].filter(type=>counts[type]).map(type=>`<span><i class="fas fa-${NEWS_TYPES[type].icon} ${type}"></i>${counts[type]} ${NEWS_TYPES[type].label.toLowerCase()}</span>`).join('');
    const devActions = isDev && !preview ? `
        <button type="button" class="release-action" data-release-action="pin" title="Mark as current" aria-label="Mark as current release"><i class="fas fa-thumbtack"></i></button>
        <button type="button" class="release-action" data-release-action="edit" title="Edit update" aria-label="Edit update"><i class="fas fa-pen"></i></button>
        <button type="button" class="release-action" data-release-action="duplicate" title="Duplicate update" aria-label="Duplicate update"><i class="fas fa-clone"></i></button>
        <button type="button" class="release-action danger" data-release-action="delete" title="Delete update" aria-label="Delete update"><i class="fas fa-trash-alt"></i></button>` : '';
    return `<div class="timeline-card glass${item.dimmed?' dimmed':''}${item.isCurrent?' is-current expanded':''}${preview?' expanded':''}" data-news-id="${esc(item.id||'preview')}">
        <div class="release-card-head">
            <div class="release-icon ${channel}"><i class="fas fa-${releaseIcon}"></i></div>
            <div class="release-card-main">
                <div class="release-meta"><span class="release-version">${esc(version)}</span><span class="release-channel ${channel}">${esc(channel)}</span><span class="release-change-count">${items.length} change${items.length===1?'':'s'}</span>${item.isCurrent?'<span class="tag new">CURRENT</span>':''}</div>
                <h3>${esc(item.title||'Untitled release')}</h3><p class="release-summary">${formatNewsText(summary)}</p>
            </div>
            ${preview?'':`<div class="release-actions"><button type="button" class="release-action" data-release-action="copy" title="Copy as Markdown" aria-label="Copy release as Markdown"><i class="fas fa-copy"></i></button>${devActions}</div>`}
        </div>
        <div class="release-details"><div class="release-details-inner"><div class="release-details-content"><ul class="changelog">${list||'<li class="imp">Add at least one changelog item.</li>'}</ul></div></div></div>
        ${preview?'':`<div class="release-card-foot"><div class="release-type-summary">${typeSummary||'<span>Release notes</span>'}</div><button class="release-expand" type="button" aria-expanded="${item.isCurrent?'true':'false'}"><span>${item.isCurrent?'Hide details':'View details'}</span><i class="fas fa-chevron-down"></i></button></div>`}
    </div>`;
}
function renderNewsTimeline() {
    const timeline=document.getElementById('updatesTimeline');if(!timeline)return;
    if(newsTimelineObserver){newsTimelineObserver.disconnect();newsTimelineObserver=null;}
    const user=siteUsers.find(u=>u.id===currentUserId);
    const isDev=Boolean(user&&user.role==='DEV');
    const query=newsViewState.query.trim().toLowerCase();
    let visible=newsItems.filter(item=>{
        const matchesType=newsViewState.filter==='all'||(item.items||[]).some(change=>validNewsType(change.type)===newsViewState.filter);
        const haystack=[item.title,item.date,item.version,item.channel,item.summary,...(item.items||[]).map(change=>change.text)].join(' ').toLowerCase();
        return matchesType&&(!query||haystack.includes(query));
    });
    const releaseCount=document.getElementById('updatesReleaseCount');if(releaseCount)releaseCount.textContent=String(newsItems.length);
    const changeCount=document.getElementById('updatesChangeCount');if(changeCount)changeCount.textContent=String(newsItems.reduce((n,item)=>n+(item.items||[]).length,0));
    const latestDate=document.getElementById('updatesLatestDate');if(latestDate)latestDate.textContent=newsItems[0]?.date||'—';
    const featured=newsItems.find(item=>item.isCurrent)||newsItems[0];
    if(featured){
        const featuredIcon=document.getElementById('updatesFeaturedIcon');if(featuredIcon)featuredIcon.className=`fas fa-${validNewsIcon(featured.icon)}`;
        const featuredTitle=document.getElementById('updatesFeaturedTitle');if(featuredTitle)featuredTitle.textContent=featured.title||'Latest release';
        const featuredSummary=document.getElementById('updatesFeaturedSummary');if(featuredSummary)featuredSummary.textContent=featured.summary||featured.items?.[0]?.text||'Release notes are ready.';
        const featuredVersion=document.getElementById('updatesFeaturedVersion');if(featuredVersion)featuredVersion.textContent=featured.version||'Latest';
        const featuredChannel=document.getElementById('updatesFeaturedChannel');if(featuredChannel)featuredChannel.textContent=featured.channel||'stable';
    }
    const empty=document.getElementById('updatesEmpty');if(empty)empty.hidden=visible.length>0;
    timeline.style.display=visible.length?'block':'none';
    timeline.innerHTML='<div class="timeline-line" aria-hidden="true"></div>';
    visible.forEach(item=>{
        const article=document.createElement('article');article.className='timeline-item';article.dataset.newsId=item.id;
        article.innerHTML=`<div class="date-badge">${esc(item.date)}</div>${releaseCardMarkup(item,isDev,false)}`;
        const card=article.querySelector('.timeline-card');
        const expand=article.querySelector('.release-expand');
        if(expand)expand.addEventListener('click',()=>{const open=card.classList.toggle('expanded');expand.setAttribute('aria-expanded',String(open));expand.querySelector('span').textContent=open?'Hide details':'View details';});
        if(!liteOn()&&!REDUCED_MOTION&&!IS_TOUCH){
            let cardRect=null,cardPointer=null,cardMoveRaf=null;
            card.addEventListener('pointerenter',()=>{cardRect=card.getBoundingClientRect();},{passive:true});
            card.addEventListener('pointermove',event=>{
                cardPointer=event;
                if(cardMoveRaf)return;
                cardMoveRaf=requestAnimationFrame(()=>{
                    cardMoveRaf=null;
                    if(!cardRect)cardRect=card.getBoundingClientRect();
                    card.style.setProperty('--card-x',`${cardPointer.clientX-cardRect.left}px`);
                    card.style.setProperty('--card-y',`${cardPointer.clientY-cardRect.top}px`);
                });
            },{passive:true});
            card.addEventListener('pointerleave',()=>{cardRect=null;},{passive:true});
        }
        article.querySelectorAll('[data-release-action]').forEach(button=>button.addEventListener('click',e=>{
            e.stopPropagation();const action=button.dataset.releaseAction;
            if(action==='copy')copyLocalText(releaseToMarkdown(item),'Release copied as Markdown');
            if(action==='edit')openNewsEditor(item,false);
            if(action==='duplicate')openNewsEditor(item,true);
            if(action==='pin'){
                newsItems.forEach(news=>news.isCurrent=news.id===item.id?!item.isCurrent:false);saveNews(newsItems);renderNewsTimeline();
            }
            if(action==='delete')showConfirm(`Delete update "${item.title}"?`,()=>{newsItems=newsItems.filter(news=>news.id!==item.id);saveNews(newsItems);renderNewsTimeline();showToast('Update deleted','trash');});
        }));
        timeline.appendChild(article);
    });
    const reduce=liteOn()||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce)timeline.querySelectorAll('.timeline-item').forEach(item=>item.classList.add('in-view'));
    else {
        const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}}),{threshold:.12,rootMargin:'0px 0px -35px'});
        newsTimelineObserver=observer;
        timeline.querySelectorAll('.timeline-item').forEach(item=>observer.observe(item));
    }
}

const updatesSearchInput=document.getElementById('updatesSearchInput');
if(updatesSearchInput)updatesSearchInput.addEventListener('input',()=>{newsViewState.query=updatesSearchInput.value;renderNewsTimeline();});
document.querySelectorAll('[data-news-filter]').forEach(button=>button.addEventListener('click',()=>{
    newsViewState.filter=button.dataset.newsFilter||'all';document.querySelectorAll('[data-news-filter]').forEach(other=>other.classList.toggle('active',other===button));renderNewsTimeline();
}));
const updatesReset=document.getElementById('updatesResetFilters');if(updatesReset)updatesReset.addEventListener('click',()=>{
    newsViewState={query:'',filter:'all'};if(updatesSearchInput)updatesSearchInput.value='';document.querySelectorAll('[data-news-filter]').forEach(button=>button.classList.toggle('active',button.dataset.newsFilter==='all'));renderNewsTimeline();
});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&document.getElementById('updates')?.classList.contains('active-tab')){e.preventDefault();updatesSearchInput?.focus();}});
document.getElementById('updatesFeaturedOpen')?.addEventListener('click',()=>{
    const current=newsItems.find(item=>item.isCurrent)||newsItems[0];if(!current)return;
    if(newsViewState.query||newsViewState.filter!=='all'){newsViewState={query:'',filter:'all'};if(updatesSearchInput)updatesSearchInput.value='';document.querySelectorAll('[data-news-filter]').forEach(button=>button.classList.toggle('active',button.dataset.newsFilter==='all'));renderNewsTimeline();}
    requestAnimationFrame(()=>{const article=[...document.querySelectorAll('.timeline-item')].find(item=>item.dataset.newsId===current.id);if(!article)return;article.querySelector('.timeline-card')?.classList.add('expanded');const expand=article.querySelector('.release-expand');if(expand){expand.setAttribute('aria-expanded','true');const label=expand.querySelector('span');if(label)label.textContent='Hide details';}article.scrollIntoView({behavior:(liteOn()||REDUCED_MOTION)?'auto':'smooth',block:'center'});});
});

function newsRowTemplate(type='add',text='') {
    const selected=validNewsType(type);
    const options=Object.entries(NEWS_TYPES).map(([key,meta])=>`<option value="${key}"${key===selected?' selected':''}>${meta.label}</option>`).join('');
    return `<div class="news-item-row"><div class="nie-row-main"><select class="nie-type" aria-label="Change type">${options}</select><textarea class="nie-text" rows="2" placeholder="Describe the change…" aria-label="Changelog item">${esc(text)}</textarea><div class="nie-row-actions"><button type="button" data-row-action="up" title="Move up" aria-label="Move item up"><i class="fas fa-arrow-up"></i></button><button type="button" data-row-action="down" title="Move down" aria-label="Move item down"><i class="fas fa-arrow-down"></i></button><button type="button" class="nie-remove" data-row-action="remove" title="Remove" aria-label="Remove changelog item"><i class="fas fa-times"></i></button></div></div><div class="nie-format-bar"><button type="button" data-news-format="bold" title="Bold"><b>B</b></button><button type="button" data-news-format="code" title="Inline code">&lt;/&gt;</button><button type="button" data-news-format="link" title="Link"><i class="fas fa-link"></i></button></div></div>`;
}
function updateNewsItemCount() {
    const count=document.querySelectorAll('#newsItemRows .news-item-row').length;
    const label=document.getElementById('newsItemCount');if(label)label.textContent=`${count} item${count===1?'':'s'}`;
}
function applyNewsFormat(textarea,format) {
    const start=textarea.selectionStart||0,end=textarea.selectionEnd||0,selected=textarea.value.slice(start,end);
    const wrappers={bold:['**','**','bold text'],code:['`','`','code'],link:['[','](https://)','link text']};
    const [before,after,fallback]=wrappers[format]||wrappers.bold;const content=selected||fallback;
    textarea.setRangeText(before+content+after,start,end,'select');textarea.focus();textarea.dispatchEvent(new Event('input',{bubbles:true}));
}
function bindNewsRow(row) {
    const textarea=row.querySelector('.nie-text');
    row.querySelectorAll('[data-row-action]').forEach(button=>button.addEventListener('click',()=>{
        const action=button.dataset.rowAction,rows=document.getElementById('newsItemRows');
        if(action==='remove'){if(rows.children.length>1)row.remove();else textarea.value='';}
        if(action==='up'&&row.previousElementSibling)rows.insertBefore(row,row.previousElementSibling);
        if(action==='down'&&row.nextElementSibling)rows.insertBefore(row.nextElementSibling,row);
        updateNewsItemCount();markNewsEditorDirty();updateLiveNewsPreview();
    }));
    row.querySelectorAll('[data-news-format]').forEach(button=>button.addEventListener('click',()=>applyNewsFormat(textarea,button.dataset.newsFormat)));
    row.querySelector('.nie-type')?.addEventListener('change',()=>{markNewsEditorDirty();updateLiveNewsPreview();});
    textarea?.addEventListener('input',()=>{markNewsEditorDirty();updateLiveNewsPreview();});
}
function addNewsItemRow(type='add',text='',focus=true) {
    const rows=document.getElementById('newsItemRows');if(!rows)return;
    rows.insertAdjacentHTML('beforeend',newsRowTemplate(type,text));const row=rows.lastElementChild;bindNewsRow(row);updateNewsItemCount();updateLiveNewsPreview();if(focus)row.querySelector('.nie-text')?.focus();
}
function collectNewsEditor() {
    const items=[];document.querySelectorAll('#newsItemRows .news-item-row').forEach(row=>{const text=row.querySelector('.nie-text')?.value.trim();if(text)items.push({type:validNewsType(row.querySelector('.nie-type')?.value),text});});
    return {id:editingNewsId||`news_${Date.now()}`,date:document.getElementById('newsDate')?.value.trim()||'',title:document.getElementById('newsTitle')?.value.trim()||'',version:document.getElementById('newsVersion')?.value.trim()||'',channel:document.getElementById('newsChannel')?.value||'stable',icon:validNewsIcon(document.getElementById('newsIcon')?.value),summary:document.getElementById('newsSummary')?.value.trim()||'',isCurrent:Boolean(document.getElementById('newsIsCurrent')?.checked),dimmed:false,items};
}
function updateLiveNewsPreview() {
    const host=document.getElementById('newsLivePreview');if(!host)return;const draft=collectNewsEditor();
    host.innerHTML=(!draft.title&&!draft.summary&&!draft.items.length)?'<div class="news-preview-placeholder"><div><i class="fas fa-wand-magic-sparkles"></i>Start typing to build the release preview.</div></div>':releaseCardMarkup({...draft,title:draft.title||'Untitled release',date:draft.date||'Release date'},false,true);
}
function setNewsEditorData(item) {
    const set=(id,value)=>{const el=document.getElementById(id);if(el)el.value=value||'';};
    set('newsTitle',item.title);set('newsVersion',item.version);set('newsDate',item.date);set('newsChannel',item.channel||'stable');set('newsIcon',validNewsIcon(item.icon));set('newsSummary',item.summary);
    const current=document.getElementById('newsIsCurrent');if(current)current.checked=item.isCurrent!==false;
    const rows=document.getElementById('newsItemRows');if(rows){rows.innerHTML='';(item.items?.length?item.items:[{type:'add',text:''}]).forEach(change=>addNewsItemRow(change.type,change.text,false));}
    updateNewsItemCount();updateLiveNewsPreview();
}
function readNewsDraft(){try{return JSON.parse(localStorage.getItem(NEWS_DRAFT_KEY)||'null');}catch{return null;}}
function saveNewsDraft(notify=true){const draft=collectNewsEditor();try{localStorage.setItem(NEWS_DRAFT_KEY,JSON.stringify(draft));}catch{}const status=document.getElementById('newsDraftStatus');if(status)status.innerHTML='<i class="fas fa-circle-check"></i> Draft saved locally';if(notify)showToast('Draft saved locally','floppy-disk');}
function markNewsEditorDirty(){const status=document.getElementById('newsDraftStatus');if(status)status.innerHTML='<i class="fas fa-circle"></i> Saving draft…';clearTimeout(newsDraftTimer);newsDraftTimer=setTimeout(()=>saveNewsDraft(false),700);}
function openNewsEditor(item=null,duplicate=false){
    if(item instanceof Event||!item?.id)item=null;
    if(!newsEditorOverlay)return;const restored=!item&&readNewsDraft();const source=item||restored||{date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),title:'',version:'',channel:'stable',icon:'bolt',summary:'',isCurrent:true,items:[{type:'add',text:''}]};
    editingNewsId=item&&!duplicate?item.id:null;
    const data=duplicate?{...source,title:`${source.title} (copy)`,isCurrent:false}:source;
    document.getElementById('newsEditorModeLabel').textContent=editingNewsId?'Editing release':duplicate?'Duplicate release':restored?'Restored local draft':'New release';
    document.getElementById('newsPublishLabel').textContent=editingNewsId?'Save Changes':'Publish Update';setNewsEditorData(data);
    newsEditorOverlay.classList.add('open');document.body.style.overflow='hidden';setTimeout(()=>document.getElementById('newsTitle')?.focus(),80);
}
function closeNewsEditor(){if(!newsEditorOverlay)return;newsEditorOverlay.classList.remove('open');syncBodyScrollLock();}

document.querySelectorAll('[data-add-news-type]').forEach(button=>button.addEventListener('click',()=>addNewsItemRow(button.dataset.addNewsType,'',true)));
['newsTitle','newsVersion','newsDate','newsChannel','newsIcon','newsSummary','newsIsCurrent'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>{markNewsEditorDirty();updateLiveNewsPreview();}));
document.getElementById('saveNewsDraftBtn')?.addEventListener('click',()=>saveNewsDraft(true));
document.getElementById('copyNewsMarkdownBtn')?.addEventListener('click',()=>copyLocalText(releaseToMarkdown(collectNewsEditor()),'Draft copied as Markdown'));
document.getElementById('clearNewsEditorBtn')?.addEventListener('click',()=>showConfirm('Clear every field in this draft?',()=>{editingNewsId=null;try{localStorage.removeItem(NEWS_DRAFT_KEY);}catch{}setNewsEditorData({date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),channel:'stable',icon:'bolt',isCurrent:true,items:[{type:'add',text:''}]});document.getElementById('newsEditorModeLabel').textContent='New release';document.getElementById('newsPublishLabel').textContent='Publish Update';}));
const newsEditorFormV2=document.getElementById('newsEditorFormV2');
if(newsEditorFormV2)newsEditorFormV2.addEventListener('submit',e=>{
    e.preventDefault();const entry=collectNewsEditor();if(!entry.title||!entry.date){showToast('Add a release title and date','triangle-exclamation');return;}if(!entry.items.length){showToast('Add at least one changelog item','triangle-exclamation');return;}
    if(entry.isCurrent)newsItems.forEach(item=>item.isCurrent=false);
    if(editingNewsId){const index=newsItems.findIndex(item=>item.id===editingNewsId);if(index>=0)newsItems[index]={...newsItems[index],...entry,id:editingNewsId};}
    else newsItems.unshift(entry);
    saveNews(newsItems);clearTimeout(newsDraftTimer);try{localStorage.removeItem(NEWS_DRAFT_KEY);}catch{}closeNewsEditor();renderNewsTimeline();showToast(editingNewsId?'Update saved':'Update published locally','check');editingNewsId=null;
});

function renderForum() {
    const list  = document.getElementById('forumPostsList');
    const empty = document.getElementById('forumEmpty');
    const writeBtn = document.getElementById('forumWriteBtn');
    if (!list) return;
    list.innerHTML='';

    const user=siteUsers.find(u=>u.id===currentUserId);
    const isAdmin=canModerate(user);
    // Button stays visible; when logged out it shows a hint instead of the editor
    if(writeBtn)writeBtn.classList.toggle('locked', !currentUserId);
    const loginHint=document.getElementById('forumLoginHint');
    if(loginHint)loginHint.style.display=currentUserId?'none':'inline-flex';

    // Admins see pending posts (awaiting review) on top, then all approved posts
    const visible=[...forumPosts.filter(p=>!p.approved&&!p.rejected&&(isAdmin||p.authorId===currentUserId)),...forumPosts.filter(p=>p.approved)];

    if(visible.length===0){if(empty){empty.style.display='block';empty.textContent=validSupabaseConfig()&&communityCloudError?communityCloudError:'No ideas yet. Be the first to share one.';}return;}
    if(empty)empty.style.display='none';

    visible.forEach(p=>{
        const card=document.createElement('div');
        const author=siteUsers.find(u=>u.id===p.authorId);
        const authorRole=validSupabaseConfig()?p.authorRole||'USER':author?.role||'USER';
        const featured=roleRank(authorRole)>=ROLES.LEGEND.rank;
        card.className='forum-post-card'+(p.approved?'':' pending')+(featured?` role-featured role-featured-${authorRole.toLowerCase()}`:'');
        if(featured)card.style.setProperty('--post-role-color',roleInfo(authorRole).color);
        const hasVoted=currentUserId&&(validSupabaseConfig()?p.viewerVoted:p.upvotes.includes(currentUserId));
        const pendingBadge=!p.approved&&!p.rejected?'<span class="fp-status fp-pending">Pending review</span>':'';
        card.innerHTML=`
            <div class="fp-header">
                <img class="fp-avatar" src="${avatarUrl(p.authorName)}" alt="${esc(p.authorName)}" width="100" height="100" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-avatar-fallback>
                <div class="fp-meta">
                    <div class="fp-author">by ${esc(p.authorName)}${roleBadgeHtml(authorRole)}${featured?'<span class="fp-role-signal"><i class="fas fa-bolt"></i> boosted signal</span>':''}</div>
                    <div class="fp-title">${esc(p.title)}</div>
                </div>
                ${pendingBadge}
            </div>
            <div class="fp-text">${esc(p.text)}</div>
            <div class="fp-footer">
                <button class="fp-upvote${hasVoted?' voted':''}" data-id="${esc(safeIdentifier(p.id))}" ${!p.approved?'disabled':''}><i class="fas fa-arrow-up"></i> ${validSupabaseConfig()?p.voteCount||0:p.upvotes.length}</button>
                <span class="fp-date">${p.date}</span>
            </div>`;
        const upvoteBtn=card.querySelector('.fp-upvote');
        upvoteBtn.addEventListener('click',async()=>{
            if(!currentUserId){openDashboard();return;}
            if(validSupabaseConfig()){
                upvoteBtn.disabled=true;
                try{await voteCommunityIdea(p.id);}catch(error){showToast(error.message||'Could not save your vote.','triangle-exclamation');upvoteBtn.disabled=false;}
                return;
            }
            const post=forumPosts.find(x=>x.id===p.id);if(!post)return;
            const idx=post.upvotes.indexOf(currentUserId);
            if(idx>=0)post.upvotes.splice(idx,1);else post.upvotes.push(currentUserId);
            saveForum(forumPosts);renderForum();
        });
        list.appendChild(card);
    });
}

// Forum post modal
const forumPostOverlay=document.getElementById('forumPostOverlay');
function openForumPost(){
    if(!currentUserId){openDashboard();return;}
    if(!forumPostOverlay)return;
    forumPostOverlay.classList.add('open');document.body.style.overflow='hidden';
    const f=document.getElementById('forumPostForm');if(f)f.reset();
    const cc=document.getElementById('forumCharCount');if(cc)cc.textContent='0';
    const err=document.getElementById('forumPostError');if(err)err.style.display='none';
}
function closeForumPost(){if(!forumPostOverlay)return;forumPostOverlay.classList.remove('open');syncBodyScrollLock();}

document.getElementById('forumWriteBtn')&&document.getElementById('forumWriteBtn').addEventListener('click',openForumPost);
document.getElementById('forumLoginHint')&&document.getElementById('forumLoginHint').addEventListener('click',openDashboard);
document.getElementById('closeForumPostBtn')&&document.getElementById('closeForumPostBtn').addEventListener('click',closeForumPost);
if(forumPostOverlay)forumPostOverlay.addEventListener('click',e=>{if(e.target===forumPostOverlay)closeForumPost();});

const forumTextarea=document.getElementById('forumPostText');
if(forumTextarea){forumTextarea.addEventListener('input',()=>{const cc=document.getElementById('forumCharCount');if(cc)cc.textContent=forumTextarea.value.length;});}

const forumPostForm=document.getElementById('forumPostForm');
if(forumPostForm){
    forumPostForm.addEventListener('submit',async e=>{
        e.preventDefault();
        const titleEl=document.getElementById('forumPostTitle');
        const textEl=document.getElementById('forumPostText');
        const errEl=document.getElementById('forumPostError');
        const title=sanitizeField(censor(titleEl?titleEl.value:''), 80);
        const text=sanitizeField(censor(textEl?textEl.value:''), 500);
        if(!title){if(errEl){errEl.textContent='Please enter a title';errEl.style.display='block';}return;}
        if(!text){if(errEl){errEl.textContent='Please describe your idea';errEl.style.display='block';}return;}
        if(errEl)errEl.style.display='none';
        if(validSupabaseConfig()){
            const submit=forumPostForm.querySelector('[type="submit"]');if(submit)submit.disabled=true;
            try{await submitCommunityIdea(title,text);closeForumPost();showToast('Idea submitted for moderator review.','check');}
            catch(error){if(errEl){errEl.textContent=error.message||'Could not submit the idea.';errEl.style.display='block';}}
            finally{if(submit)submit.disabled=false;}
            return;
        }
        const user=siteUsers.find(u=>u.id===currentUserId);
        const today=new Date();
        const dateStr=`${String(today.getDate()).padStart(2,'0')}.${String(today.getMonth()+1).padStart(2,'0')}.${today.getFullYear()}`;
        const post={id:'fp_'+Date.now(),authorId:currentUserId,authorName:user?user.displayName||user.username:'?',title,text,date:dateStr,upvotes:[],approved:false,rejected:false};
        forumPosts.unshift(post);saveForum(forumPosts);closeForumPost();
        renderForum();
        // notify user
        showToast('Idea submitted for moderator review. Thank you!','check');
    });
}
