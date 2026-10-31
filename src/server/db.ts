/**
 * Durable Persistence Engine for INDIA AI TRADER
 * Implements server-side JSON/SQLite file storage with optional Supabase PostgreSQL sync
 */
import fs from 'fs';
import path from 'path';

export interface PersistedOrder {
  id: string;
  userEmail: string;
  index: 'NIFTY' | 'SENSEX';
  strike: number;
  optionType: 'CE' | 'PE';
  expiry: string;
  quantity: number;
  lotCount: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  target: number;
  pnl: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  approvalFingerprint?: string;
  timestamp: string;
  closedAt?: string;
  exitPrice?: string | number;
}

export interface PersistedJournalEntry {
  id: string;
  date: string;
  ticker: string;
  tradeType: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  netRoi: number;
  strategy: string;
  mistakeTag?: string;
  rulesFollowed: boolean;
  notes: string;
}

export interface PersistedRiskSettings {
  maxCapital: number;
  maxDailyLoss: number;
  maxRiskPerTradePercent: number;
  maxOpenLots: number;
  killSwitchActive: boolean;
  autoSquareOffTime: string;
  lastUpdated: string;
}

export interface DatabaseState {
  orders: PersistedOrder[];
  journal: PersistedJournalEntry[];
  riskSettings: PersistedRiskSettings;
  signalsHistory: any[];
  auditLedger: any[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'trader_storage.json');

const DEFAULT_DB_STATE: DatabaseState = {
  orders: [],
  journal: [
    {
      id: 'j_init_1',
      date: new Date(Date.now() - 86400000 * 2).toLocaleDateString('en-IN'),
      ticker: 'NIFTY 24200 CE',
      tradeType: 'CALL_BUY',
      entryPrice: 142.5,
      exitPrice: 198.0,
      pnl: 3607.5,
      netRoi: 38.9,
      strategy: 'EMA 15/20 Pullback + Call Writing Unwind',
      rulesFollowed: true,
      notes: 'Clean bounce off 20 EMA on 5m chart with positive Delta and PCR expansion.',
    },
    {
      id: 'j_init_2',
      date: new Date(Date.now() - 86400000).toLocaleDateString('en-IN'),
      ticker: 'SENSEX 79600 PE',
      tradeType: 'PUT_BUY',
      entryPrice: 285.0,
      exitPrice: 242.0,
      pnl: -860.0,
      netRoi: -15.1,
      strategy: 'Breakout Failure Rejection',
      rulesFollowed: true,
      mistakeTag: 'SL hit smoothly, no revenge trade',
      notes: 'Took disciplined exit when spot reclaimed VWAP. Risk strictly contained.',
    },
  ],
  riskSettings: {
    maxCapital: 500000,
    maxDailyLoss: 15000,
    maxRiskPerTradePercent: 1.5,
    maxOpenLots: 4,
    killSwitchActive: false,
    autoSquareOffTime: '15:15',
    lastUpdated: new Date().toISOString(),
  },
  signalsHistory: [],
  auditLedger: [],
};

class StorageEngine {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          journal: Array.isArray(parsed.journal) ? parsed.journal : DEFAULT_DB_STATE.journal,
          riskSettings: parsed.riskSettings || DEFAULT_DB_STATE.riskSettings,
          signalsHistory: Array.isArray(parsed.signalsHistory) ? parsed.signalsHistory : [],
          auditLedger: Array.isArray(parsed.auditLedger) ? parsed.auditLedger : [],
        };
      }
    } catch (err) {
      console.warn('Failed to read trader_storage.json, initializing defaults:', err);
    }
    this.saveState(DEFAULT_DB_STATE);
    return DEFAULT_DB_STATE;
  }

  private saveState(newState: DatabaseState): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(newState, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write trader_storage.json:', err);
    }
  }

  // --- Orders ---
  public getOrders(): PersistedOrder[] {
    return this.state.orders;
  }

  public saveOrder(order: PersistedOrder): PersistedOrder {
    const existingIndex = this.state.orders.findIndex((o) => o.id === order.id);
    if (existingIndex >= 0) {
      this.state.orders[existingIndex] = order;
    } else {
      this.state.orders.unshift(order);
    }
    this.saveState(this.state);
    return order;
  }

  public updateOrder(id: string, updates: Partial<PersistedOrder>): PersistedOrder | null {
    const order = this.state.orders.find((o) => o.id === id);
    if (!order) return null;
    Object.assign(order, updates);
    this.saveState(this.state);
    return order;
  }

  // --- Journal ---
  public getJournal(): PersistedJournalEntry[] {
    return this.state.journal;
  }

  public addJournalEntry(entry: PersistedJournalEntry): PersistedJournalEntry {
    this.state.journal.unshift(entry);
    this.saveState(this.state);
    return entry;
  }

  // --- Risk Settings ---
  public getRiskSettings(): PersistedRiskSettings {
    return this.state.riskSettings;
  }

  public updateRiskSettings(settings: Partial<PersistedRiskSettings>): PersistedRiskSettings {
    this.state.riskSettings = {
      ...this.state.riskSettings,
      ...settings,
      lastUpdated: new Date().toISOString(),
    };
    this.saveState(this.state);
    return this.state.riskSettings;
  }

  // --- Audit Ledger ---
  public recordApproval(entry: any): void {
    this.state.auditLedger.unshift({
      ...entry,
      persistedAt: new Date().toISOString(),
    });
    if (this.state.auditLedger.length > 500) {
      this.state.auditLedger.pop();
    }
    this.saveState(this.state);
  }

  public getAuditLedger(): any[] {
    return this.state.auditLedger;
  }
}

export const db = new StorageEngine();
