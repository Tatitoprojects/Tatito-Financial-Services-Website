import { Router, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { dbQuery, isPostgresConnected } from '../../database/db.ts';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { configured, provider, readLink, validAmount } from '../../integrations/testCollections.ts';

const router = Router();
const fields = 'reference, amount_paise, provider_id, checkout_url, status, created_at, verified_at';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.use(requireAuth);
router.get('/availability', (_req,res) => res.json({mode:'test', ready:configured() && isPostgresConnected()}));
router.use((_req,res,next) => isPostgresConnected() ? next() : res.status(503).json({error:'PostgreSQL is required for collection history.'}));

router.get('/', async (req: AuthenticatedRequest,res,next) => {
  try {
    const result = await dbQuery('SELECT '+fields+' FROM sandbox_collections WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[req.user!.userId]);
    res.json(result.rows);
  } catch (error) { next(error); }
});

router.get('/summary', async(req:AuthenticatedRequest,res,next)=>{
  try {
    const summary = await dbQuery('SELECT COALESCE(sum(c.amount_paise),0)::text AS total_paise, count(*)::int AS paid_count FROM sandbox_collection_credits c JOIN sandbox_collections t USING(reference) WHERE t.user_id=$1',[req.user!.userId]);
    res.json(summary.rows[0]);
  } catch(error) {next(error)}
});

async function sync(row:any, create:boolean, res:Response) {
  try {
    let data;
    if (create) data = await provider('',{amount:row.amount_paise,currency:'INR',reference_id:row.reference,accept_partial:false,description:'Tatito sandbox collection'});
    else if (row.provider_id) data = await provider('/'+encodeURIComponent(row.provider_id));
    else {
      const list = await provider('?reference_id='+encodeURIComponent(row.reference));
      data = list.payment_links?.find((item:any)=>item.reference_id===row.reference);
      if (!data) return res.status(202).json(row);
    }
    const link = readLink(data,row.reference,row.amount_paise);
    const updated = await dbQuery('UPDATE sandbox_collections SET provider_id=$2, checkout_url=$3, status=$4, verified_at=now() WHERE reference=$1 AND (provider_id IS NULL OR provider_id=$2) AND status IN (\'pending\',\'created\') RETURNING '+fields,[row.reference,link.id,link.url,link.status]);
    const current = updated.rows[0] ?? (await dbQuery('SELECT '+fields+' FROM sandbox_collections WHERE reference=$1',[row.reference])).rows[0];
    res.json(current);
  } catch {
    res.status(502).json({error:'Unable to verify this request with the test provider. Refresh its status before starting another collection.',reference:row.reference});
  }
}

router.post('/', async (req:AuthenticatedRequest,res,next) => {
  const amount = req.body?.amount_paise;
  const key = req.get('Idempotency-Key') || '';
  if (!validAmount(amount) || !uuid.test(key)) return res.status(400).json({error:'Enter ₹1–₹100,000 and a valid request identifier.'});
  if (!configured()) return res.status(503).json({error:'The payment provider test account is not configured.'});
  try {
    const owner = req.user!.userId;
    const inserted = await dbQuery('INSERT INTO sandbox_collections(reference,user_id,request_key,amount_paise) VALUES ($1,$2,$3,$4) ON CONFLICT(user_id,request_key) DO NOTHING RETURNING '+fields,[randomUUID(),owner,key,amount]);
    if (inserted.rows.length) return await sync(inserted.rows[0],true,res);
    const prior = (await dbQuery('SELECT '+fields+' FROM sandbox_collections WHERE user_id=$1 AND request_key=$2',[owner,key])).rows[0];
    if (prior.amount_paise!==amount) return res.status(409).json({error:'This request identifier already belongs to a different amount.'});
    res.json(prior);
  } catch (error) { next(error); }
});
router.post('/:reference/refresh',async(req:AuthenticatedRequest,res,next)=>{
  if (!uuid.test(String(req.params.reference))) return res.status(400).json({error:'Invalid collection reference.'});
  try {
    const row = (await dbQuery('SELECT '+fields+' FROM sandbox_collections WHERE reference=$1 AND user_id=$2',[req.params.reference,req.user!.userId])).rows[0];
    if (!row) return res.status(404).json({error:'Collection not found.'});
    if (['paid','expired','cancelled'].includes(row.status)) return res.json(row);
    await sync(row,false,res);
  } catch(error) { next(error); }
});
export default router;
