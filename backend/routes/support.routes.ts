import { Router, type Response, type NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { dbQuery, isPostgresConnected, isDemoMode, logAudit } from '../../database/db.ts';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.ts';
import { superStore } from '../services/superStore.ts';
import { broadcastRealtimeNotification } from '../services/realtime.ts';

export function supportRoutes(staffDesk=false) {
  const router=Router();
  router.use((_req,res,next)=>{
    if(isPostgresConnected()) return next();
    if(isDemoMode() || process.env.NODE_ENV==='test') return next('router');
    res.status(503).json({error:'Ticket storage unavailable.'});
  });
  router.use(requireAuth);
  if(staffDesk) router.use(requireRole('admin','credit_officer'));
  const tickets=staffDesk?'':'/tickets';
  const handle=(fn:(req:AuthenticatedRequest,res:Response)=>Promise<unknown>)=>
    (req:AuthenticatedRequest,res:Response,next:NextFunction)=>{fn(req,res).catch(next)};
  const staff=(req:AuthenticatedRequest)=>staffDesk||['admin','super_admin'].includes(req.user!.role);
  const text=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length<=max?v.trim():'';
  router.get('/',handle(async(req,res)=>{
    const result=await dbQuery(`SELECT t.*,COALESCE(json_agg(json_build_object('id',m.id,'sender_role',m.sender_role,'sender_name',m.sender_name,'message',m.message_text,'created_at',m.created_at) ORDER BY m.id) FILTER (WHERE m.id IS NOT NULL),'[]') AS messages FROM support_tickets t LEFT JOIN support_messages m ON m.ticket_id=t.id WHERE ($1 OR t.user_id=$2) GROUP BY t.id ORDER BY t.id DESC`,[staff(req),req.user!.userId]);
    res.json({tickets:result.rows,faqs:superStore.supportFaqs,is_simulated:false});
  }));
  if(!staffDesk)router.post('/tickets',handle(async(req,res)=>{
    const subject=text(req.body.subject,200),description=text(req.body.description,5000),category=text(req.body.category||'General',60),ref=text(req.body.transaction_ref||'',64);
    if(!subject||!description||!category)return res.status(400).json({error:'Enter a category, subject and description.'});
    const result=await dbQuery(`WITH t AS (INSERT INTO support_tickets(user_id,ticket_no,category,subject,description,transaction_ref) VALUES($1,$2,$3,$4,$5,$6) RETURNING *), msg AS (INSERT INTO support_messages(ticket_id,sender_role,sender_name,message_text) SELECT id,'customer',$7,description FROM t) SELECT * FROM t`,[req.user!.userId,'TKT-'+randomUUID(),category,subject,description,ref||null,req.user!.fullName]);
    const ticket=result.rows[0];
    broadcastRealtimeNotification(ticket.user_id,{title:'Support ticket opened',message:subject,category:'support',reference:ticket.ticket_no});
    res.status(201).json({status:'TICKET_CREATED',ticket});
  }));
  router.param('id',(_req,res,next,value)=>/^\d{1,9}$/.test(value)?next():res.status(404).json({error:'Ticket not found.'}));
  router.post(tickets+'/:id/reply',handle(async(req,res)=>{
    const message=text(req.body.message,5000);
    if(!message)return res.status(400).json({error:'Enter a message of up to 5,000 characters.'});
    const result=await dbQuery(`WITH t AS (UPDATE support_tickets SET status=CASE WHEN status='RESOLVED' AND NOT $3 THEN 'IN_PROGRESS' ELSE status END WHERE id=$1 AND (user_id=$2 OR $3) RETURNING id)
      INSERT INTO support_messages(ticket_id,sender_role,sender_name,message_text) SELECT id,$4,$5,$6 FROM t RETURNING *,message_text AS message`,[req.params.id,req.user!.userId,staff(req),staff(req)?'agent':'customer',req.user!.fullName,message]);
    if(!result.rowCount)return res.status(404).json({error:'Ticket not found.'});
    res.status(201).json({status:'REPLY_POSTED',message:result.rows[0]});
  }));
  router.patch(tickets+'/:id',requireRole(...(staffDesk?['admin','credit_officer'] as const:['admin'] as const)),handle(async(req,res)=>{
    const status=req.body.status||'RESOLVED',note=text(req.body.resolution_note,2000);
    if(!['OPEN','IN_PROGRESS','RESOLVED'].includes(status))return res.status(400).json({error:'Invalid ticket status.'});
    const result=await dbQuery(`WITH t AS (UPDATE support_tickets SET status=$2,resolution_note=COALESCE(NULLIF($3,''),resolution_note) WHERE id=$1 RETURNING *),msg AS (INSERT INTO support_messages(ticket_id,sender_role,sender_name,message_text) SELECT id,'agent',$4,$5 FROM t) SELECT * FROM t`,[req.params.id,status,note,req.user!.fullName,note||'Ticket status updated to '+status]);
    if(!result.rowCount)return res.status(404).json({error:'Ticket not found.'});
    const ticket=result.rows[0];
    logAudit(req.user!.userId,'UPDATE_TICKET','support_tickets',ticket.ticket_no,{status});
    broadcastRealtimeNotification(ticket.user_id,{title:'Support ticket updated',message:status,category:'support',reference:ticket.ticket_no});
    res.json({status:'TICKET_UPDATED',ticket});
  }));
  return router;
}
