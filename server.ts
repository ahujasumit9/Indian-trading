import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory store for TradingView incoming webhooks
interface StoredWebhook {
  id: string;
  receivedAt: string;
  ticker: string;
  timeframe: string;
  price: number;
  ema15?: number;
  ema20?: number;
  rsi?: number;
  vwap?: number;
  volume?: number;
  action?: string;
  message: string;
  rawPayload: any;
}

const webhookStore: StoredWebhook[] = [];

// API: Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    platform: 'INDIA AI TRADER',
    version: '2.5.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    brokerIndependentMode: true,
  });
});

// Security middleware & Vault integration
import { createRateLimiter, validateWebhookSecret, isDuplicatePayload, logSecurityAudit, getAuditLogs } from './src/server/security';
import { getSanitizedBrokerStatuses, saveServerBrokerCredentials, testBrokerAuthentication } from './src/server/vault';

// Apply Rate Limiter to all API routes (60 req/min)
app.use('/api', createRateLimiter(60000, 60));

// API: TradingView Webhook Receiver with Secret & Duplicate Validation
app.post('/api/webhooks/tradingview', validateWebhookSecret, (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ status: 'error', error: 'Invalid JSON payload structure.' });
    }

    // Input Validation
    const ticker = String(payload.ticker || payload.symbol || '').trim();
    const price = parseFloat(payload.price || payload.close || 0);

    if (!ticker) {
      return res.status(400).json({ status: 'error', error: 'Missing mandatory ticker/symbol in alert.' });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ status: 'error', error: 'Price must be a positive numeric value.' });
    }

    // Duplicate Alert Protection (Idempotency)
    if (isDuplicatePayload(payload, 30)) {
      logSecurityAudit('DUPLICATE_WEBHOOK_DROPPED', { ticker, price, action: payload.action });
      return res.status(200).json({
        status: 'ignored',
        message: 'Duplicate alert dropped via idempotency filter (already received within 30 seconds).',
      });
    }

    const alert: StoredWebhook = {
      id: `tv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      receivedAt: new Date().toISOString(),
      ticker,
      timeframe: String(payload.timeframe || payload.interval || '5m'),
      price,
      ema15: payload.ema15 ? parseFloat(payload.ema15) : undefined,
      ema20: payload.ema20 ? parseFloat(payload.ema20) : undefined,
      rsi: payload.rsi ? parseFloat(payload.rsi) : undefined,
      vwap: payload.vwap ? parseFloat(payload.vwap) : undefined,
      volume: payload.volume ? parseFloat(payload.volume) : undefined,
      action: String(payload.action || payload.signal || 'ALERT'),
      message: String(payload.message || payload.alert_message || 'TradingView technical alert condition triggered'),
      rawPayload: payload,
    };

    webhookStore.unshift(alert);
    if (webhookStore.length > 100) webhookStore.pop();

    logSecurityAudit('WEBHOOK_ALERT_RECORDED', { id: alert.id, ticker: alert.ticker, price: alert.price });

    res.status(200).json({
      status: 'success',
      message: 'TradingView alert received, authenticated, and logged into India AI Trader engine',
      alertId: alert.id,
    });
  } catch (err: any) {
    res.status(400).json({ status: 'error', error: err.message });
  }
});

// API: Get Webhook History
app.get('/api/webhooks/tradingview/history', (_req: Request, res: Response) => {
  res.json({
    count: webhookStore.length,
    alerts: webhookStore,
  });
});

// API: Broker Credentials Vault & Testing Endpoints
app.get('/api/broker/status', (_req: Request, res: Response) => {
  res.json(getSanitizedBrokerStatuses());
});

app.post('/api/broker/configure', (req: Request, res: Response) => {
  const { id, apiKey, clientCode, password, pin } = req.body;
  if (!id || (id !== 'ANGEL_ONE' && id !== 'SAHI')) {
    return res.status(400).json({ error: 'Valid broker id (ANGEL_ONE or SAHI) is required.' });
  }

  saveServerBrokerCredentials(id, { apiKey, clientCode, password, pin });
  res.json({ status: 'success', message: `${id} credentials securely saved to server vault.` });
});

app.post('/api/broker/test-connection', async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id || (id !== 'ANGEL_ONE' && id !== 'SAHI')) {
    return res.status(400).json({ error: 'Valid broker id (ANGEL_ONE or SAHI) is required.' });
  }

  const result = await testBrokerAuthentication(id);
  res.json(result);
});

// API: Security Audit Logs
app.get('/api/security/audit-logs', (_req: Request, res: Response) => {
  res.json({ logs: getAuditLogs() });
});

// Import durable server storage
import { db } from './src/server/db';

// API: Durable Orders
app.get('/api/db/orders', (_req: Request, res: Response) => {
  res.json({ orders: db.getOrders() });
});

app.post('/api/db/orders', (req: Request, res: Response) => {
  const order = req.body;
  if (!order || !order.id) {
    return res.status(400).json({ error: 'Order must contain valid id.' });
  }
  const saved = db.saveOrder(order);
  logSecurityAudit('ORDER_PERSISTED', { id: saved.id, index: saved.index, strike: saved.strike, type: saved.optionType });
  res.json({ status: 'success', order: saved });
});

app.put('/api/db/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.updateOrder(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ status: 'success', order: updated });
});

// API: Durable Trade Journal
app.get('/api/db/journal', (_req: Request, res: Response) => {
  res.json({ journal: db.getJournal() });
});

app.post('/api/db/journal', (req: Request, res: Response) => {
  const entry = req.body;
  if (!entry || !entry.ticker) {
    return res.status(400).json({ error: 'Journal entry must contain valid ticker and pnl.' });
  }
  const saved = db.addJournalEntry({
    id: entry.id || `j_${Date.now()}`,
    date: entry.date || new Date().toLocaleDateString('en-IN'),
    ticker: entry.ticker,
    tradeType: entry.tradeType || 'CALL_BUY',
    entryPrice: Number(entry.entryPrice) || 0,
    exitPrice: Number(entry.exitPrice) || 0,
    pnl: Number(entry.pnl) || 0,
    netRoi: Number(entry.netRoi) || 0,
    strategy: entry.strategy || 'Discretionary Options',
    mistakeTag: entry.mistakeTag,
    rulesFollowed: Boolean(entry.rulesFollowed),
    notes: entry.notes || '',
  });
  res.json({ status: 'success', entry: saved });
});

// API: Durable Risk Settings
app.get('/api/db/risk-settings', (_req: Request, res: Response) => {
  res.json({ riskSettings: db.getRiskSettings() });
});

app.post('/api/db/risk-settings', (req: Request, res: Response) => {
  const updated = db.updateRiskSettings(req.body);
  logSecurityAudit('RISK_SETTINGS_UPDATED', { maxDailyLoss: updated.maxDailyLoss, killSwitch: updated.killSwitchActive });
  res.json({ status: 'success', riskSettings: updated });
});

// API: Cryptographic Approval Record
app.post('/api/db/audit/approve', (req: Request, res: Response) => {
  const { fingerprint, ticket, userEmail } = req.body;
  if (!fingerprint || !ticket) {
    return res.status(400).json({ error: 'Fingerprint and ticket required for approval record.' });
  }
  db.recordApproval({ fingerprint, ticket, userEmail: userEmail || 'user@india-trader' });
  logSecurityAudit('MANUAL_TRADE_APPROVED', { fingerprint, ticketId: ticket.id, index: ticket.index });
  res.json({ status: 'success', message: 'Cryptographic approval recorded in server audit ledger.' });
});



// API: Angel One SmartAPI Live Quote Proxy
app.post('/api/market-data/angel/quote', async (req: Request, res: Response) => {
  try {
    const { apiKey, jwtToken, symbols } = req.body;
    if (!apiKey || !jwtToken) {
      return res.status(400).json({ error: 'Angel One apiKey and jwtToken are required.' });
    }

    const response = await fetch('https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': apiKey,
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        mode: 'LTP',
        exchangeTokens: symbols || {
          NSE: ['26000'],
          BSE: ['1'],
        },
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Gemini AI Market Intelligence Analysis
app.post('/api/ai/analyze', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        analysis: null,
        message: 'No GEMINI_API_KEY configured; fallback to internal quantitative engine',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    const { index, spotPrice, aiSignal, pcr, indiaVix, pocPrice } = req.body;

    const prompt = `You are the lead quantitative options trading analyst for INDIA AI TRADER specializing in BSE SENSEX and NSE NIFTY index options.
Analyze the following live market state and provide a concise, razor-sharp institutional briefing:

- Underlying Index: ${index}
- Spot Price: ${spotPrice}
- Point of Control (POC): ${pocPrice}
- AI Composite Score: ${aiSignal.score}/100
- Recommended Action: ${aiSignal.type} (Strike: ${aiSignal.strike} ${aiSignal.optionType})
- Market Regime: ${aiSignal.regime}
- Put-Call Ratio (PCR): ${pcr}
- India VIX: ${indiaVix}
- Target: ${aiSignal.target1} | Stop Loss: ${aiSignal.stopLoss}

Provide:
1. Executive Assessment (Why this setup qualifies or fails)
2. Order Flow & OI Dynamics (Call writing vs Put writing interpretation)
3. Volatility & Theta Decay Profile
4. Specific Invalidation Trigger`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text;
    res.json({ analysis: text });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    res.json({ analysis: null, error: err.message });
  }
});

async function startServer() {
  // Mount Vite dev server in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`India AI Trader Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
