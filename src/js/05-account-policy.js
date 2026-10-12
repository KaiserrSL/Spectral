// Shared, DOM-free account rules. Cloud permissions must also be enforced by RLS/RPC.
const AccountPolicy = Object.freeze({
    ranks: Object.freeze({USER:0,VETERAN:1,PRO:2,LEGEND:3,SPECTRAL:4,MODERATOR:10,ADMIN:20,DEV:30}),
    canManage(actor,target,role=null){
        if(!actor||actor.banned||!target||actor.id===target.id)return false;
        const rank=this.ranks[actor.role]??-1;
        if(rank<20||!(target.role in this.ranks))return false;
        if(actor.role!=='DEV'&&this.ranks[target.role]>=rank)return false;
        return role===null||(role in this.ranks&&(actor.role==='DEV'||this.ranks[role]<rank));
    },
    reservations(value){
        if(!Array.isArray(value))return [];
        const seen=new Set();
        return value.slice().reverse().filter(order=>{
            if(!order||!/^[-\w]{1,100}$/.test(order.userId||'')||!['PRO','LEGEND','SPECTRAL'].includes(order.role)||!['monthly','yearly'].includes(order.billing)||order.status!=='reserved'||!Number.isFinite(order.quotedPrice)||order.quotedPrice<0||seen.has(order.userId))return false;
            seen.add(order.userId);return true;
        }).slice(0,250).map(order=>({id:String(order.id||'').slice(0,100),userId:order.userId,role:order.role,billing:order.billing,quotedPrice:order.quotedPrice,currency:'USD',status:'reserved',createdAt:String(order.createdAt||'').slice(0,40)})).reverse();
    },
    recent(value,windowMs,now=Date.now()){
        const time=new Date(value).getTime();
        return Boolean(value)&&Number.isFinite(time)&&time<=now&&now-time<=windowMs;
    }
});
