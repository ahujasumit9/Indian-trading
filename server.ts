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

// API: TradingView Webhook Receiver
app.post('/api/webhooks/tradingview', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    console.log('[TradingView Webhook Received]:', JSON.stringify(payload));

    const alert: StoredWebhook = {
      id: `tv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      receivedAt: new Date().toISOString(),
      ticker: payload.ticker || payload.symbol || 'NSE:NIFTY50',
      timeframe: payload.timeframe || payload.interval || '5m',
      price: parseFloat(payload.price || payload.close || 0),
      ema15: payload.ema15 ? parseFloat(payload.ema15) : undefined,
      ema20: payload.ema20 ? parseFloat(payload.ema20) : undefined,
      rsi: payload.rsi ? parseFloat(payload.rsi) : undefined,
      vwap: payload.vwap ? parseFloat(payload.vwap) : undefined,
      volume: payload.volume ? parseFloat(payload.volume) : undefined,
      action: payload.action || payload.signal || 'ALERT',
      message: payload.message || payload.alert_message || 'TradingView technical condition triggered',
      rawPayload: payload,
    };

    webhookStore.unshift(alert);
    if (webhookStore.length > 100) webhookStore.pop();

    res.status(200).json({
      status: 'success',
      message: 'TradingView alert received and logged into India AI Trader engine',
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
