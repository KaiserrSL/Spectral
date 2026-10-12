import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../script.js', import.meta.url), 'utf8');
const start = source.indexOf('let mcSaveInProgress = false;');
const end = source.indexOf('function cloudPushFriends', start);
assert.ok(start >= 0 && end > start);

function harness({failOperation = ''} = {}) {
    const records = new Map();
    const cache = [];
    const calls = [];
    const cloud = {from(table) {
        assert.equal(table, 'mc_accounts');
        const state = {operation:'select', payload:null, filters:[], selected:false, ids:null};
        const query = {
            select() { state.selected = true; return query; },
            insert(value) { state.operation = 'insert'; state.payload = value; return query; },
            update(value) { state.operation = 'update'; state.payload = value; return query; },
            delete() { state.operation = 'delete'; return query; },
            eq(key,value) { state.filters.push([key,value]); return query; },
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
        safeIdentifier:value=>String(value||''), sanitizeField:(value,max)=>String(value||'').slice(0,max),
        saveMcAccounts:(id,accounts)=>{cache.push({id,accounts});return true;},
        saveActiveMc:(id,active)=>{cache.push({id,active});return true;},
        handleCloudError:()=>{}
    });
    vm.runInContext(source.slice(start,end),context);
    return {save:vm.runInContext('saveMinecraftProfiles',context),records,cache,calls,context};
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
