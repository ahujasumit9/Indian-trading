-- INDIA AI TRADER: Supabase PostgreSQL Schema & RLS Policies
-- Compatible with PostgreSQL 15+ and Supabase Free Tier

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_order_id TEXT NOT NULL,
    index_symbol TEXT NOT NULL CHECK (index_symbol IN ('NIFTY', 'SENSEX')),
    strike NUMERIC(10, 2) NOT NULL,
    option_type TEXT NOT NULL CHECK (option_type IN ('CE', 'PE')),
    expiry_date DATE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    lot_count INTEGER NOT NULL CHECK (lot_count > 0),
    order_type TEXT NOT NULL DEFAULT 'LIMIT',
    entry_price NUMERIC(10, 2) NOT NULL,
    exit_price NUMERIC(10, 2),
    stop_loss NUMERIC(10, 2) NOT NULL,
    target_price NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),
    pnl NUMERIC(12, 2) DEFAULT 0.00,
    approval_fingerprint TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- Index for user order lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Enable RLS for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
    ON public.orders FOR UPDATE
    USING (auth.uid() = user_id);

-- 2. Trade Journal Table
CREATE TABLE IF NOT EXISTS public.trade_journal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ticker TEXT NOT NULL,
    trade_type TEXT NOT NULL,
    entry_price NUMERIC(10, 2) NOT NULL,
    exit_price NUMERIC(10, 2) NOT NULL,
    pnl NUMERIC(12, 2) NOT NULL,
    net_roi_percent NUMERIC(6, 2) NOT NULL,
    strategy TEXT NOT NULL,
    mistake_tag TEXT,
    rules_followed BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_user_date ON public.trade_journal(user_id, trade_date DESC);

ALTER TABLE public.trade_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own journal entries"
    ON public.trade_journal FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
    ON public.trade_journal FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Risk Settings Table
CREATE TABLE IF NOT EXISTS public.risk_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    max_capital NUMERIC(14, 2) NOT NULL DEFAULT 500000.00,
    max_daily_loss NUMERIC(12, 2) NOT NULL DEFAULT 15000.00,
    max_risk_per_trade_pct NUMERIC(5, 2) NOT NULL DEFAULT 1.50,
    max_open_lots INTEGER NOT NULL DEFAULT 4,
    kill_switch_active BOOLEAN NOT NULL DEFAULT FALSE,
    auto_square_off_time TEXT NOT NULL DEFAULT '15:15',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.risk_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own risk settings"
    ON public.risk_settings FOR ALL
    USING (auth.uid() = user_id);

-- 4. Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    details JSONB NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs associated with their account"
    ON public.audit_logs FOR SELECT
    USING (auth.uid() = user_id);
