import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/js/30-user-model.js', import.meta.url), 'utf8');
const start = source.indexOf('let mcSaveInProgress = false;');
const end = source.indexOf('const FRIENDSHIP_COLUMNS', start);
assert.ok(start >= 0 && end > start);

function harness({failOperation = ''} = {}) {
    const records = new Map();
    const cache = [];
    const calls = [];
    const cloud = {async rpc(name,{p_account_id:id}) {
        assert.equal(name,'spectral_select_mc_account');
        calls.push({operation:'select_account',payload:{id}});
        if(failOperation==='select_account')return{data:null,error:new Error('database rejected selection')};
        if(!records.has(id))return{data:null,error:new Error('profile unavailable')};
        for(const [key,row] of records)records.set(key,{...row,is_active:key===id});
        return{data:[{id}],error:null};
    },from(table) {
        assert.equal(table, 'mc_accounts');
        const state = {operation:'select', payload:null, filters:[], selected:false, ids:null};
        const query = {
            select() { state.selected = true; return query; },
            insert(value) { state.operation = 'insert'; state.payload = value; return query; },
            update(value) { state.operation = 'update'; state.payload = value; return query; },
            delete() { state.operation = 'delete'; return query; },
            eq(key,value) { state.filters.push([key,value]); return query; },
            order() { return query; },
            limit() { return query; },
            in(key,ids) { state.ids = [key,ids]; return query; },
            then(resolve,reject) {
                return Promise.resolve().then(() => {
                    calls.push({operation:state.operation,payload:state.payload});
                    if (state.operation === failOperation) return {data:null,error:new Error('database rejected write')};
                    const matches = row => state.filters.every(([key,value])=>row[key]===value)
                        && (!state.ids || state.ids[1].includes(row[state.ids[0]]));
                    if (state.operation === 'select') return {data:[...records.values()].filter(matches),error:null};
                    if (state.operation === 'insert') {
                        records.set(state.payload.id,{...state.payload});
                        return {data:[{id:state.payload.id}],error:null};
                    }
                    if (state.operation === 'update') {
                        const changed=[];
                        for(const [id,row] of records)if(matches(row)){records.set(id,{...row,...state.payload});changed.push({id});}
                        return {data:changed,error:null};
                    }
                    for(const [id,row] of records)if(matches(row))records.delete(id);
                    return {data:null,error:null};
                }).then(resolve,reject);
            }
        };
        return query;
    }};
    const context = vm.createContext({
        currentUserId:'owner', cloudAuthUserId:'owner', cloud, mcAccounts:[], activeMcId:null,
        validSupabaseConfig:()=>true, cloudReady:()=>true,
        offlineUuid:value=>`offline-${value}`, renderAll:()=>{},
        safeIdentifier:value=>String(value||''), sanitizeField:(value,max)=>String(value||'').slice(0,max),
        saveMcAccounts:(id,accounts)=>{cache.push({id,accounts});return true;},
        saveActiveMc:(id,active)=>{cache.push({id,active});return true;},
        handleCloudError:()=>{}
    });
    vm.runInContext(source.slice(start,end),context);
    return {save:vm.runInContext('saveMinecraftProfiles',context),
        refresh:vm.runInContext('refreshMinecraftProfiles',context),records,cache,calls,context};
}

const profile = {id:'la_test',username:'Alex',displayName:'Alex',type:'offline',uuid:'uuid',addedAt:'12.10.2026',playtime:'0h',favorite:false,lastUsed:null};

test('Minecraft profile changes are confirmed in Supabase before updating the browser cache', async () => {
    const app=harness();
    await app.save('owner',[profile],profile.id);
    assert.equal(app.records.get(profile.id).is_active,true);
    assert.equal(app.records.get(profile.id).display_name,'Alex');
    assert.equal(app.cache.length,2);
    await app.save('owner',[{...profile,favorite:true}],profile.id);
    assert.equal(app.records.get(profile.id).favorite,true);
    const update=app.calls.find(call=>call.operation==='update');
    assert.ok(update);
    assert.equal('user_id' in update.payload,false);
    assert.equal('id' in update.payload,false);
    await app.save('owner',[],null);
    assert.equal(app.records.size,0);
});

test('a rejected cloud write leaves the browser cache untouched', async () => {
    const app=harness({failOperation:'insert'});
    await assert.rejects(app.save('owner',[profile],profile.id),/could not be saved online/);
    assert.equal(app.cache.length,0);
    assert.equal(app.records.size,0);
});

test('saving a stale browser list preserves a profile added by the launcher', async () => {
    const app=harness();
    await app.save('owner',[profile],profile.id);
    const launcher={id:'la_launcher',user_id:'owner',username:'Steve',display_name:'Steve',
        type:'offline',uuid:'uuid-2',added_at:'13.10.2026',playtime:'0h',favorite:false,
        last_used:null,is_active:false};
    app.records.set(launcher.id,launcher);
    await app.save('owner',[{...profile,favorite:true}],profile.id);
    assert.equal(app.records.get(launcher.id)?.username,'Steve');
    assert.equal(app.cache.at(-2).accounts.length,2);
});

test('refresh loads launcher changes into the open site', async () => {
    const app=harness();
    app.records.set('la_launcher',{id:'la_launcher',user_id:'owner',username:'Steve',
        display_name:'Steve',type:'offline',uuid:'uuid-2',added_at:'13.10.2026',
        playtime:'0h',favorite:false,last_used:null,is_active:true});
    assert.equal(await app.refresh(),true);
    assert.equal(app.cache.at(-2).accounts[0].username,'Steve');
    assert.equal(app.cache.at(-1).active,'la_launcher');
});

test('a failed atomic selection keeps the previous selection and browser cache',async()=>{
    const app=harness({failOperation:'select_account'});
    app.records.set('previous',{...profile,id:'previous',user_id:'owner',is_active:true});
    await assert.rejects(app.save('owner',[profile],profile.id),/could not be saved online/);
    assert.equal(app.records.get('previous').is_active,true);
    assert.equal(app.cache.length,0);
    assert.equal(app.calls.filter(call=>call.operation==='select_account').length,1);
});
