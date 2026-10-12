// Isolated, localhost-only UI fixture. Never loaded by the production document.
// node tools/preview-account.mjs; open http://127.0.0.1:4174/?fixture=staff
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
    try{
        const url=new URL(req.url,'http://127.0.0.1:4174');
        if(url.pathname==='/__account_fixture.js'){
            res.setHeader('Content-Type','text/javascript');
            res.end(`const fixture=new URLSearchParams(location.search).get('fixture');
if(fixture==='legacy-owner'){localStorage.setItem('spectral_site_users',JSON.stringify([{id:'su_dev',username:'_kaiserr_',displayName:'_kaiserr_',role:'DEV',password:'',registeredAt:'01.01.2026',banned:false}]));localStorage.removeItem('spectral_site_session');history.replaceState(null,'',location.pathname);}
else if(fixture){const role=fixture==='staff'?'DEV':'PRO';const users=Array.from({length:20},(_,i)=>({id:'qa_member_'+i,username:'TestPlayer'+i,displayName:'Test Player '+i,role:i===0?role:i===1?'ADMIN':i===2?'MODERATOR':'USER',roleSource:'test',password:'',email:'',bio:'Isolated preview fixture',status:'',avatar:'',registeredAt:'07.10.2026',totalTimeSec:300,visitCount:2,lastSeen:null,banned:false,mcTimeSec:0}));localStorage.setItem('spectral_site_users',JSON.stringify(users));localStorage.setItem('spectral_site_session','qa_member_0');if(fixture==='staff')localStorage.setItem('spectral_forum',JSON.stringify([{id:'qa_idea_1',authorId:'qa_member_3',authorName:'Test Player 3',title:'Better world list',text:'Group worlds by version.',date:'08.10.2026',upvotes:[],approved:false,rejected:false},{id:'qa_idea_2',authorId:'qa_member_4',authorName:'Test Player 4',title:'Launcher shortcuts',text:'Add keyboard shortcuts.',date:'07.10.2026',upvotes:[],approved:true,rejected:false}]));history.replaceState(null,'',location.pathname);}
window.addEventListener('load',()=>document.getElementById('openDashboardBtn').click());`);return;
        }
        const filename=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
        if(!filename.startsWith(root+path.sep)){res.writeHead(403).end();return;}
        let data=await readFile(filename);
        if(filename.endsWith('index.html')){
            let html=data.toString();
            if(url.searchParams.has('fixture'))html=html.replace(/(<meta name="spectral-supabase-(?:url|publishable-key)" content=")[^"]*/g,'$1');
            data=Buffer.from(html.replace('<script src="boot.min.js','<script src="/__account_fixture.js"></script><script src="boot.min.js'));
        }
        res.setHeader('Content-Type',types[path.extname(filename)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(data);
    }catch{res.writeHead(404).end();}
}).listen(4174,'127.0.0.1',()=>console.log('Isolated account preview: http://127.0.0.1:4174/?fixture=staff'));
