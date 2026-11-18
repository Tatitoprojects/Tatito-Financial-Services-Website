import { Router, type Response, type NextFunction } from 'express';
import { dbQuery, isPostgresConnected, isDemoMode } from '../../database/db.ts';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';

const router=Router();
router.use((_req,res,next)=>{
  if(isPostgresConnected()) return next();
  if(isDemoMode() || process.env.NODE_ENV==='test') return next('router');
  return res.status(503).json({error:'Personal finance storage is unavailable.'});
});
router.use(requireAuth);
const handle=(fn:(req:AuthenticatedRequest,res:Response)=>Promise<unknown>)=>
  (req:AuthenticatedRequest,res:Response,next:NextFunction)=>{fn(req,res).catch(next)};
const label=(v:unknown,max:number)=>typeof v==='string' && v.trim().length<=max ? v.trim() : '';
function money(v:unknown) {
  return (typeof v==='number'||typeof v==='string') && /^\d{1,9}(\.\d{1,2})?$/.test(String(v)) && Number(v)>0 ? Math.round(Number(v)*100) : 0;
}
router.get('/',handle(async(req,res)=>{
  const user=req.user!.userId;
  const args=[user];
  const [entries,monthly,budgets,goals,groups]=await Promise.all([
    dbQuery('SELECT id,title,category,kind,amount,posted_on AS date FROM manual_finance_entries WHERE user_id=$1 ORDER BY id DESC LIMIT 100',args),
    dbQuery("SELECT kind,sum(amount) AS total FROM manual_finance_entries WHERE user_id=$1 AND posted_on>=date_trunc('month',CURRENT_DATE) GROUP BY kind",args),
    dbQuery(`SELECT b.category,b.amount AS limit,COALESCE((SELECT sum(amount) FROM manual_finance_entries e WHERE e.user_id=b.user_id AND e.category=b.category AND e.kind='expense' AND e.posted_on>=date_trunc('month',CURRENT_DATE)),0) AS spent FROM manual_category_limits b WHERE user_id=$1 AND month_start=date_trunc('month',CURRENT_DATE)::date ORDER BY category`,args),
    dbQuery('SELECT * FROM savings_goals WHERE user_id=$1 ORDER BY id DESC',args),
    dbQuery(`SELECT g.id,g.group_name AS name,g.members_json::json AS members,COALESCE(json_agg(json_build_object('id',e.id,'title',e.title,'status',e.status,'paid_by',e.paid_by,'total_amount',e.total_amount,'splits',e.splits_json::json) ORDER BY e.id) FILTER(WHERE e.id IS NOT NULL),'[]') AS expenses FROM expense_groups g LEFT JOIN group_expenses e ON e.group_id=g.id WHERE creator_user_id=$1 GROUP BY g.id ORDER BY g.id DESC`,args)
  ]);
  const total=(kind:string)=>Number(monthly.rows.find(r=>r.kind===kind)?.total||0);
  res.json({is_simulated:false,monthly_income:total('income'),total_spent:total('expense'),savings_surplus:total('income')-total('expense'),items:entries.rows,budgets:budgets.rows,savings_goals:goals.rows,groups:groups.rows});
}));
router.post('/add',handle(async(req,res)=>{
  const {amount,title,category,kind='expense'}=req.body;
  if(!money(amount)||!label(title,160)||!label(category,60)||!['expense','income'].includes(kind))return res.status(400).json({error:'Check the title, category and amount.'});
  const result=await dbQuery('INSERT INTO manual_finance_entries(user_id,kind,title,category,amount) VALUES($1,$2,$3,$4,$5) RETURNING *',[req.user!.userId,kind,title.trim(),category.trim(),amount]);
  res.status(201).json({status:'ENTRY_RECORDED',item:result.rows[0]});
}));
router.post('/groups',handle(async(req,res)=>{
  const {group_name,expense_title,total_amount,paid_by,split_type='EQUAL'}=req.body;
  const raw=Array.isArray(req.body.members)?req.body.members:String(req.body.members||'').split(',');
  const members:string[]=raw.map((m:unknown)=>label(m,120));
  const total=money(total_amount);
  if(!label(group_name,120)||!label(expense_title,160)||!total||members.length<2||members.length>50||members.includes('')||new Set(members).size!==members.length||!members.includes(paid_by)||!['EQUAL','CUSTOM'].includes(split_type))return res.status(400).json({error:'Enter distinct members, a payer in the group, and a positive expense.'});
  const shares=members.map((member,i)=>({member,paise:split_type==='CUSTOM'?money(req.body.shares?.[i]):Math.floor(total/members.length)+(i<total%members.length?1:0)}));
  if(shares.reduce((n,s)=>n+s.paise,0)!==total || (split_type==='CUSTOM'&&(!Array.isArray(req.body.shares)||req.body.shares.length!==members.length)))return res.status(400).json({error:'Member shares must add up to the total.'});
  const result=await dbQuery(`WITH g AS (INSERT INTO expense_groups(creator_user_id,group_name,members_json) VALUES($1,$2,$3) RETURNING id)
    INSERT INTO group_expenses(group_id,title,total_amount,paid_by,split_type,splits_json) SELECT id,$4,$5,$6,$7,$8 FROM g RETURNING group_id,id`,[req.user!.userId,group_name,JSON.stringify(members),expense_title,total_amount,paid_by,split_type,JSON.stringify(shares)]);
  res.status(201).json({status:'GROUP_CREATED',group:result.rows[0]});
}));
router.post('/settle',handle(async(req,res)=>{
  if(!/^\d{1,9}$/.test(req.body.group_id)||!/^\d{1,9}$/.test(req.body.expense_id))return res.status(400).json({error:'Invalid expense reference.'});
  const result=await dbQuery("UPDATE group_expenses e SET status='SETTLED' FROM expense_groups g WHERE g.creator_user_id=$1 AND g.id=$2 AND e.group_id=g.id AND e.id=$3 RETURNING e.id",[req.user!.userId,req.body.group_id,req.body.expense_id]);
  if(!result.rowCount)return res.status(404).json({error:'Expense not found.'});
  res.json({status:'SETTLED'});
}));
router.post('/budget',handle(async(req,res)=>{
  const category=label(req.body.category,60),amount=money(req.body.amount);
  if(!category||!amount)return res.status(400).json({error:'Enter a category and positive budget.'});
  await dbQuery("INSERT INTO manual_category_limits(user_id,month_start,category,amount) VALUES($1,date_trunc('month',CURRENT_DATE)::date,$2,$3) ON CONFLICT(user_id,month_start,category) DO UPDATE SET amount=EXCLUDED.amount",[req.user!.userId,category,amount/100]);
  res.json({status:'BUDGET_SAVED'});
}));
router.post('/goals',handle(async(req,res)=>{
  const name=label(req.body.name,120),target=money(req.body.amount),date=String(req.body.date||'');
  if(!name||!target||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)return res.status(400).json({error:'Enter a goal name, target and valid date.'});
  await dbQuery('INSERT INTO savings_goals(user_id,goal_name,target_amount,target_date) VALUES($1,$2,$3,$4)',[req.user!.userId,name,target/100,date]);
  res.status(201).json({status:'GOAL_SAVED'});
}));
export default router;
