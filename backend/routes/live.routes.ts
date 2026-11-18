import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  ensurePostgresInitialized,
  isPostgresConnected,
  isPostgresConfiguredFlag,
  dbRepository,
  logAudit,
} from '../../database/db.ts';
import { isLivePartnerConfigured, marketDataAdapter } from '../../integrations/index.ts';

const router = Router();

// GET /api/live/status — Authoritative diagnostics on live database, market feed & partner connections
router.get('/status', async (_req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'test') {
    await ensurePostgresInitialized();
  }
  const pgConnected = isPostgresConnected();
  const pgConfigured = isPostgresConfiguredFlag();
  const benchmarks = await marketDataAdapter.getMarketBenchmarks();

  return res.json({
    status: 'ok',
    runtime: process.env.VERCEL === '1' ? 'vercel_serverless' : 'node_express',
    database: {
      configured: pgConfigured,
      connected: pgConnected,
      mode: pgConnected ? 'PostgreSQL (Live Connected)' : 'Persistent Fallback Relational Store',
    },
    market_feed: {
      live: benchmarks.isLive,
      source: benchmarks.source,
      nifty50: benchmarks.nifty50,
      sensex: benchmarks.sensex,
      gold_24k_per_gram_inr: benchmarks.gold24kPerGramInr,
      usd_inr: benchmarks.usdInr,
      updated_at: benchmarks.updatedAt,
    },
    partners: {
      live_partners_enabled: process.env.LIVE_FINANCIAL_PARTNERS === 'true',
      kyc_gateway: isLivePartnerConfigured(process.env.KYC_PROVIDER_API_KEY) ? 'LIVE' : 'SANDBOX',
      credit_bureau: isLivePartnerConfigured(process.env.CREDIT_BUREAU_MEMBER_ID) ? 'LIVE' : 'SANDBOX',
      esign: isLivePartnerConfigured(process.env.ESIGN_PROVIDER_SECRET) ? 'LIVE' : 'SANDBOX',
      mandates: isLivePartnerConfigured(process.env.MANDATE_API_KEY) ? 'LIVE' : 'SANDBOX',
      payment_gateway: isLivePartnerConfigured(process.env.PAYMENT_GATEWAY_SECRET) ? 'LIVE' : 'SANDBOX',
      co_lending: isLivePartnerConfigured(process.env.CO_LENDING_PARTNER_API_KEY) ? 'LIVE' : 'SANDBOX',
      depository_nsdl: isLivePartnerConfigured(process.env.NSDL_DP_GATEWAY_KEY) ? 'LIVE' : 'SANDBOX',
      bse_star_mf: isLivePartnerConfigured(process.env.BSE_STAR_MF_PASSWORD) ? 'LIVE' : 'SANDBOX',
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/live/benchmarks — Real-time NSE NIFTY 50, BSE SENSEX & 24K Gold per gram
router.get('/benchmarks', async (_req: Request, res: Response) => {
  const benchmarks = await marketDataAdapter.getMarketBenchmarks();
  return res.json(benchmarks);
});

// GET /api/live/stream — Real-time Server-Sent Events (SSE) market & connection heartbeat
router.get('/stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendTick = async () => {
    try {
      const [benchmarks, quotes] = await Promise.all([
        marketDataAdapter.getMarketBenchmarks(),
        marketDataAdapter.getQuotes(),
      ]);
      const payload = {
        postgres_connected: isPostgresConnected(),
        benchmarks,
        quotes: quotes.map((q) => ({
          symbol: q.symbol,
          price: q.price,
          change: q.change,
          change_percent: q.change_percent,
          isLive: q.isLive,
        })),
        timestamp: new Date().toISOString(),
      };
      res.write(`event: market_tick\ndata: ${JSON.stringify(payload)}\n\n`);
    } catch {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
    }
  };

  await sendTick();
  const timer = setInterval(() => {
    void sendTick();
  }, 15000);

  req.on('close', () => {
    clearInterval(timer);
    res.end();
  });
});

// POST /api/live/connect-request — Schedule live Kadapa Branch RM / Video-KYC callback
router.post('/connect-request', async (req: Request, res: Response) => {
  const { full_name, phone, topic, preferred_channel } = req.body || {};
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (!full_name || String(full_name).trim().length < 2) {
    return res.status(400).json({ error: 'Invalid Name', detail: 'Please provide your full name.' });
  }
  if (!/^\d{10}$/.test(cleanPhone)) {
    return res.status(400).json({ error: 'Invalid Mobile', detail: 'Please provide a valid 10-digit Indian mobile number.' });
  }

  const ref = `LIVE-KDP-${Date.now().toString().slice(-6)}`;
  const channel = preferred_channel || 'Branch RM Callback';
  const cleanTopic = String(topic || 'General Financial Advisory').trim();

  logAudit(null, 'LIVE_ADVISOR_CONNECT_REQUEST', 'live_connect', ref, {
    full_name: String(full_name).trim(),
    phone_masked: `******${cleanPhone.slice(-4)}`,
    channel,
    topic: cleanTopic,
  });

  // Notify branch admin asynchronously without blocking response
  dbRepository.notifications
    .create({
      user_id: 2,
      title: `Live Connect Request (${channel})`,
      message: `${String(full_name).trim()} (${cleanPhone}) requested ${channel} for "${cleanTopic}". Ref: ${ref}`,
      category: 'general',
    })
    .catch(() => {});

  return res.status(201).json({
    status: 'SCHEDULED',
    reference_id: ref,
    channel,
    branch: 'Tatito Financial Services — Kadapa Central Hub, AP',
    estimated_response: 'Within 15 minutes during banking hours (Mon–Sat, 9:30 AM – 6:30 PM IST)',
    message: `Live connect request ${ref} logged successfully.`,
    created_at: new Date().toISOString(),
  });
});

export default router;
