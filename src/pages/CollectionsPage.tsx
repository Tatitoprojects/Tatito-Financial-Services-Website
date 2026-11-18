import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

interface Collection {
  reference: string; amount_paise: number; checkout_url: string | null;
  status: string; created_at: string; verified_at: string | null;
}
const currency = new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'});
const button = 'rounded-xl px-4 py-2 bg-slate-900 text-white font-semibold disabled:opacity-40';
export default function CollectionsPage() {
  const {user,isLoading} = useAuth();
  const [total,setTotal] = useState<number|null>(null);
  const [amount,setAmount] = useState('');
  const [items,setItems] = useState<Collection[]>([]);
  const [ready,setReady] = useState(false);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const key = useRef('');
  useEffect(()=>{
    let active = true;
    setItems([]); setTotal(null); setReady(false); setError(''); key.current='';
    if(user) {
      Promise.all([apiRequest('/collections/availability'),apiRequest<Collection[]>('/collections'),apiRequest('/collections/summary')])
        .then(([status,rows,summary])=>{if(active){ setTotal(Number(summary.total_paise)); setReady(status.ready); setItems(rows); }})
        .catch(e=>{if(active)setError(e.message)});
    }
    return ()=>{active=false};
  },[user?.id]);
  async function submit(reference?:string) {
    if(busy)return;
    setBusy(true); setError('');
    try {
      if(!key.current)key.current=crypto.randomUUID();
      const item:Collection=reference
        ? await apiRequest('/collections/'+reference+'/refresh',{method:'POST'})
        : await apiRequest('/collections',{method:'POST',headers:{'Idempotency-Key':key.current},body:JSON.stringify({amount_paise:Math.round(Number(amount)*100)})});
      setItems(rows=>[item,...rows.filter(r=>r.reference!==item.reference)]);
      const summary=await apiRequest('/collections/summary'); setTotal(Number(summary.total_paise));
      if(!reference){key.current='';setAmount('')}
    } catch(e) {
      setError(e instanceof Error?e.message:'Request failed.');
      try{setItems(await apiRequest('/collections'))}catch{}
    } finally{setBusy(false)}
  }
  return <section className="mx-auto max-w-3xl px-5 py-10 space-y-6">
    <Link to="/payments" className="text-sm underline">Back to payments</Link>
    <div><p className="text-xs uppercase tracking-widest">Razorpay · Test mode</p><h1 className="text-3xl font-bold">Payment collections</h1>
    <p>Create a hosted test checkout and check its status with the provider. Collections use test funds.</p></div>
    {isLoading ? <p>Loading account…</p> : !user ? <Link to="/login" className={button}>Sign in to view collections</Link> : <>
    {error && <p role="alert" className="p-3 rounded-lg bg-red-50 text-red-900">{error}</p>}
    <form className="rounded-2xl border border-slate-300 p-5 space-y-3" onSubmit={e=>{e.preventDefault();void submit()}}>
      <label className="block font-semibold" htmlFor="collection-amount">Amount in rupees</label>
      <input className="border rounded-lg px-3 py-2 mr-3" id="collection-amount" type="number" min="1" max="100000" step="0.01" required placeholder="0.00" disabled={busy||!ready} value={amount} onChange={e=>{setAmount(e.target.value);key.current=''}}/>
      <button className={button} disabled={busy||!ready}>Create test link</button>
      {!ready&&!error&&<p role="status">Checkout is waiting for the test provider connection.</p>}
    </form>
    {total!==null&&<p>Verified test collections <strong>{currency.format(total/100)}</strong></p>}
    <h2 className="text-xl font-bold">Collection history</h2>
    {!items.length&&!error&&<p>No collections to show.</p>}
    {items.map(item=><article key={item.reference} className="border rounded-2xl p-4 space-y-2">
      <div className="flex justify-between"><strong>{currency.format(item.amount_paise/100)}</strong><span>{item.status}</span></div>
      <p className="text-xs break-all">Reference {item.reference}</p>
      <p className="text-xs">{new Date(item.created_at).toLocaleString('en-IN')}</p>
      {item.checkout_url&&item.status==='created'&&<a className="underline mr-4" href={item.checkout_url} target="_blank" rel="noreferrer">Open test checkout</a>}
      {['pending','created'].includes(item.status)&&<button className="underline" disabled={busy||!ready} onClick={()=>submit(item.reference)}>Refresh status</button>}
      {item.status==='paid'&&item.verified_at&&<p>Test payment verified {new Date(item.verified_at).toLocaleString('en-IN')}</p>}
    </article>)}</>}
  </section>;
}
