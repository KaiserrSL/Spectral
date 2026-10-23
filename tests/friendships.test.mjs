import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';

const source=await readFile(new URL('../script.js',import.meta.url),'utf8');
const model=source.slice(source.indexOf('const FRIENDSHIP_COLUMNS'),source.indexOf('function cloudProfileToUser'));
const actions=source.slice(source.indexOf('async function findSiteUserByName'),source.indexOf('function friendCardHtml'));
const queries=source.slice(source.indexOf('function friendOtherId'),source.indexOf('// Presence derived'));

export function siteHarness(cloud,uid) {
    const messages=[],cache=[];
    const context=vm.createContext({cloud,currentUserId:uid,cloudAuthUserId:uid,authGeneration:0,
        friendships:[],siteUsers:[],crypto:{randomUUID},
        validSupabaseConfig:()=>true,cloudReady:()=>true,
        normalizeFriendship:row=>row,
        cloudProfileToUser:row=>({id:row.id,username:row.username,displayName:row.display_name}),
        safeIdentifier:value=>value,sanitizeField:value=>value.trim(),
        renderFriends:()=>{},saveFriends:rows=>cache.push(JSON.parse(JSON.stringify(rows))),
        showFriendMsg:(text,ok)=>messages.push({text,ok}),showToast:()=>{},handleCloudError:()=>{},
        document:{getElementById:()=>null},openDashboard:()=>{},showConfirm:(_text,callback)=>callback()
    });
    vm.runInContext(queries+model+actions,context);
    return {context,messages,cache,send:context.sendFriendRequest,refresh:context.refreshFriendships,
        accept:context.acceptFriendRequest,decline:context.declineFriendRequest};
}

function database() {
    const rows=[],calls=[],profiles=[{id:'alice',username:'_Alice_'},{id:'bob',username:'neBob'},{id:'carol',username:'Carol'}];
    let fail='',pause=null;
    const client=uid=>({async rpc(name,{p_query}){
        assert.equal(name,'spectral_search_users');
        return {data:profiles.filter(row=>row.username.toLowerCase()===p_query.toLowerCase())};
    },from(table){
        let operation='select',payload=null;const filters=[];let ids=null;
        const query={select(){return query;},limit(){return query;},or(){return query;},
            eq(key,value){filters.push([key,value]);return query;},in(_key,value){ids=value;return query;},
            insert(value){operation='insert';payload=value;return query;},
            update(value){operation='update';payload=value;return query;},delete(){operation='delete';return query;},
            then(resolve,reject){return (async()=>{
                calls.push({table,operation,filters,payload});
                if(fail===operation)return {error:new Error('Controlled database failure')};
                const matches=row=>filters.every(([key,value])=>row[key]===value);
                if(table==='site_users')return{data:profiles.filter(row=>!ids||ids.includes(row.id))};
                const visible=rows.filter(row=>[row.requester_id,row.addressee_id].includes(uid));
                if(operation==='select'){
                    const data=visible.filter(matches).map(row=>({...row}));
                    if(pause){const pending=pause;pause=null;await pending;}
                    return{data};
                }
                if(operation==='insert'){
                    if(rows.some(row=>[row.requester_id,row.addressee_id].includes(payload.requester_id)&&[row.requester_id,row.addressee_id].includes(payload.addressee_id)))return{error:{code:'23505',message:'duplicate'}};
                    rows.push({...payload});return{data:[payload]};
                }
                const changed=visible.filter(matches);
                if(operation==='update')changed.forEach(row=>Object.assign(row,payload));
                if(operation==='delete')changed.forEach(row=>rows.splice(rows.indexOf(row),1));
                return{data:changed.map(row=>({...row}))};
            })().then(resolve,reject);}
        };return query;
    }});
    return{rows,calls,client,setFail:value=>fail=value,setPause:value=>pause=value};
}

test('website sends a confirmed request and recipient loads sender before acceptance',async()=>{
    const db=database(),a=siteHarness(db.client('alice'),'alice'),b=siteHarness(db.client('bob'),'bob');
    await a.send('neBob');
    assert.equal(a.messages.at(-1).ok,true);assert.equal(db.rows.length,1);
    await b.refresh();assert.equal(b.context.getIncomingRequests('bob').length,1);
    assert.equal(b.context.siteUsers[0].username,'_Alice_');
    await b.accept(db.rows[0].id);
    await a.refresh();assert.equal(a.context.getFriends('alice').length,1);
});
test('failed writes never report sent or accepted and preserve confirmed cache',async()=>{
    const db=database(),a=siteHarness(db.client('alice'),'alice'),b=siteHarness(db.client('bob'),'bob');
    db.setFail('insert');await a.send('neBob');
    assert.equal(a.messages.at(-1).ok,false);assert.equal(a.context.friendships.length,0);
    db.setFail('');await a.send('neBob');await b.refresh();
    db.setFail('update');assert.equal(await b.accept(db.rows[0].id),false);
    assert.equal(b.context.friendships[0].status,'pending');
});
test('deleting one stale request preserves unrelated request received from another client',async()=>{
    const db=database(),a=siteHarness(db.client('alice'),'alice');
    await a.send('neBob');const id=db.rows[0].id;
    db.rows.push({id:'new-incoming',requester_id:'carol',addressee_id:'alice',status:'pending'});
    await a.decline(id);
    assert.equal(db.rows.length,1);assert.equal(db.rows[0].id,'new-incoming');
    assert.equal(a.context.getIncomingRequests('alice').length,1);
    const deletes=db.calls.filter(call=>call.operation==='delete');
    assert.deepEqual(deletes[0].filters,[['id',id]]);
});
test('old poll cannot resurrect a cancelled request',async()=>{
    const db=database(),a=siteHarness(db.client('alice'),'alice');
    await a.send('neBob');const id=db.rows[0].id;
    let release;db.setPause(new Promise(resolve=>release=resolve));
    const old=a.refresh();await new Promise(resolve=>setImmediate(resolve));
    await a.decline(id);release();await old;
    assert.equal(a.context.friendships.length,0);
});
test('account changes discard delayed requests and delayed search results',async()=>{
    const db=database(),a=siteHarness(db.client('alice'),'alice');
    await a.send('neBob');
    let release;db.setPause(new Promise(resolve=>release=resolve));
    const old=a.refresh();await new Promise(resolve=>setImmediate(resolve));
    a.context.authGeneration++;a.context.currentUserId='carol';a.context.cloudAuthUserId='carol';a.context.friendships=[];
    release();await old;assert.equal(a.context.friendships.length,0);
});
test('offline cloud search reports an error instead of creating a local phantom request',async()=>{
    const db=database(),a=siteHarness(db.client('alice'),'alice');
    a.context.cloudReady=()=>false;await a.send('neBob');
    assert.equal(a.messages.at(-1).ok,false);assert.equal(db.rows.length,0);
});
