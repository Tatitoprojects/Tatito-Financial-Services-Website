import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID, randomBytes } from 'node:crypto';
import { readLink, validAmount } from '../integrations/testCollections.ts';

test('only INR minor units and matching provider receipts are accepted',()=>{
  for(const invalid of [0,99,100.001,Infinity,'100',10000001]) assert.equal(validAmount(invalid),false);
  assert.equal(validAmount(100),true);
  const link={id:'plink_test',reference_id:'ref',currency:'INR',status:'paid',amount:100,amount_paid:100,short_url:'https://example.com/test'};
  assert.equal(readLink(link,'ref',100).status,'paid');
  for(const change of [{reference_id:'other'},{currency:'USD'},{amount_paid:99},{amount:101},{short_url:'javascript:alert()'}]) {
    assert.throws(()=>readLink({...link,...change},'ref',100));
  }
});

test('test collections persist and reconcile against verified upstream data', {skip:!process.env.TATITO_COLLECTIONS_TEST_DB}, async()=>{
  const db=new URL(process.env.TATITO_COLLECTIONS_TEST_DB!);
  assert.ok(['localhost','127.0.0.1'].includes(db.hostname) && db.pathname.endsWith('_test'),'Use a dedicated local test database');
  process.env.DATABASE_URL=db.href;
  process.env.NODE_ENV='test';process.env.JWT_SECRET=randomBytes(32).toString('hex');
  process.env.RAZORPAY_TEST_KEY_ID='rzp_test_fixture';process.env.RAZORPAY_TEST_KEY_SECRET='fixture';
  const {initPostgres,dbQuery}=await import('../database/db.ts');
  const {generateToken}=await import('../backend/middleware/auth.ts');
  const {app}=await import('../server.ts');
  assert.equal(await initPostgres(),true);
  const users=(await dbQuery('SELECT * FROM users ORDER BY id LIMIT 2')).rows;
  assert.equal(users.length,2);
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');
  const address=server.address();assert.ok(address && typeof address!=='string');
  const base='http://127.0.0.1:'+address.port+'/api/collections';
  const realFetch=globalThis.fetch;
  let providerCalls=0, receipt:any;
  globalThis.fetch=async(input,init)=>{
    if(!String(input).startsWith('https://api.razorpay.com/'))return realFetch(input,init);
    if(init?.method==='POST'){
      providerCalls++;
      const payload=JSON.parse(String(init.body));
      receipt={...payload,id:'plink_'+randomUUID().replaceAll('-',''),status:'created',short_url:'https://example.com/test'};
    }
    return Response.json(receipt);
  };
  const token=generateToken(users[0]), other=generateToken(users[1]);
  const key=randomUUID();
  const call=(path:string,method='GET',amount?:number,auth=token)=>realFetch(base+path,{
    method,headers:{'Content-Type':'application/json','Authorization':'Bearer '+auth,'Idempotency-Key':key},
    body:amount==null?undefined:JSON.stringify({amount_paise:amount})
  });
  try{
    assert.equal((await realFetch(base)).status,401);
    assert.equal((await call('','POST',99)).status,400);
    const responses=await Promise.all([call('','POST',12500),call('','POST',12500)]);
    const rows=await Promise.all(responses.map(r=>r.json()));
    assert.equal(rows[0].reference,rows[1].reference);assert.ok(rows[0].reference);assert.equal(providerCalls,1);
    assert.equal((await call('','POST',15000)).status,409);
    const ref=rows[0].reference;
    assert.equal((await call('/'+ref+'/refresh','POST',undefined,other)).status,404);
    assert.equal((await (await call('','GET',undefined,other)).json()).some((row:any)=>row.reference===ref),false);
    receipt.status='paid';receipt.amount_paid=12000;
    assert.equal((await call('/'+ref+'/refresh','POST')).status,502);
    receipt.amount_paid=12500;
    const paid=await (await call('/'+ref+'/refresh','POST')).json();
    assert.equal(paid.status,'paid');assert.ok(paid.verified_at);
    assert.equal((await (await call('')).json()).find((row:any)=>row.reference===ref).status,'paid');
    await call('/'+ref+'/refresh','POST');
    assert.equal((await (await call('/summary')).json()).total_paise,'12500');
    const api=async(path:string, data?:object, auth=token, method=data?'POST':'GET')=>realFetch(base.replace('/collections','')+path,{method,headers:{Authorization:'Bearer '+auth,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});
    const expenses='/superapp/expenses';
    assert.equal((await api(expenses+'/add',{title:'Lunch',category:'Food',amount:10.25})).status,201);
    assert.equal((await api(expenses+'/budget',{category:'Food',amount:100})).status,200);
    const group=await (await api(expenses+'/groups',{group_name:'Trip',expense_title:'Bus',members:['A','B','C'],paid_by:'A',total_amount:10})).json();
    assert.ok(group.group.id);
    const view=await (await api(expenses)).json();
    assert.equal(view.total_spent,10.25);
    assert.equal(Number(view.budgets[0].spent),10.25);
    assert.deepEqual(view.groups[0].expenses[0].splits.map((s:any)=>s.paise),[334,333,333]);
    assert.equal((await api(expenses+'/settle',{group_id:group.group.group_id,expense_id:group.group.id},other)).status,404);
    assert.equal((await api(expenses+'/settle',{group_id:group.group.group_id,expense_id:group.group.id})).status,200);
    const customers=(await dbQuery("SELECT * FROM users WHERE role='customer' ORDER BY id LIMIT 2")).rows;
    assert.ok(customers.length);
    const customer=generateToken(customers[0]);
    const userB=(await dbQuery("INSERT INTO users(full_name,email,phone,password_hash) VALUES('Test account',$1,$2,'unused') RETURNING *",['test-'+randomUUID()+'@example.test',randomUUID().slice(0,18)])).rows[0];
    const guest=generateToken(userB);
    const support='/superapp/support/tickets';
    const ticket=await (await api(support,{subject:'Test receipt',description:'Check payment reference'},customer)).json();
    assert.ok(ticket.ticket.id);
    assert.equal((await api(support+'/'+ticket.ticket.id+'/reply',{message:'Owner follow-up'},customer)).status,201);
    assert.equal((await api(support+'/'+ticket.ticket.id+'/reply',{message:'Other account'},guest)).status,404);
    assert.equal((await api(support+'/'+ticket.ticket.id,{status:'RESOLVED'},customer,'PATCH')).status,403);
    const admin=generateToken((await dbQuery("SELECT * FROM users WHERE role IN ('admin','super_admin') LIMIT 1")).rows[0]);
    assert.equal((await api('/admin/support-tickets/'+ticket.ticket.id,{status:'RESOLVED'},admin,'PATCH')).status,200);
  }finally{globalThis.fetch=realFetch;server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
