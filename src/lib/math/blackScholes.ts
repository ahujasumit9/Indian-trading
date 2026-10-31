/**
 * Black-Scholes European Option Pricing & Greeks Engine
 * Specifically adapted for Indian Index Options (NIFTY & SENSEX)
 */

import { OptionGreeks, OptionType } from '../../types/market';

// Cumulative Standard Normal Distribution (Abramowitz & Stegun approximation)
export function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2.0);

  // A&S formula 7.1.26
  const t = 1.0 / (1.0 + p * absX);
  const erf = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * erf);
}

// Standard normal probability density function N'(x)
export function normalPDF(x: number): number {
  return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

/**
 * Calculate Black-Scholes theoretical price
 * @param S Current underlying spot price
 * @param K Strike price
 * @param T Time to expiration in years (e.g. daysToExpiry / 365)
 * @param r Annual risk-free interest rate (e.g. 0.07 for RBI repo rate 6.5%-7.0%)
 * @param sigma Implied volatility as a decimal (e.g. 0.15 for 15%)
 * @param type 'CE' for Call or 'PE' for Put
 */
export function calculateBSPrice(
  S: number,
  K: number,
  T: number,
  r: number = 0.068,
  sigma: number = 0.14,
  type: OptionType = 'CE'
): number {
  if (T <= 0.0001) {
    if (type === 'CE') return Math.max(0, S - K);
    return Math.max(0, K - S);
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  if (type === 'CE') {
    const price = S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
    return Math.max(0.05, price);
  } else {
    const price = K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
    return Math.max(0.05, price);
  }
}

/**
 * Calculate full Option Greeks
 */
export function calculateGreeks(
  S: number,
  K: number,
  T: number, // in years
  r: number = 0.068,
  sigma: number = 0.14,
  type: OptionType = 'CE'
): OptionGreeks {
  // Cap minimum time to 0.5 hours to avoid division by zero on expiry afternoon
  const effectiveT = Math.max(T, 0.5 / (24 * 365));
  const effectiveSigma = Math.max(sigma, 0.01);
  const sqrtT = Math.sqrt(effectiveT);

  const d1 = (Math.log(S / K) + (r + 0.5 * effectiveSigma * effectiveSigma) * effectiveT) / (effectiveSigma * sqrtT);
  const d2 = d1 - effectiveSigma * sqrtT;

  const pdfD1 = normalPDF(d1);
  const cdfD1 = normalCDF(d1);

  // Delta
  let delta: number;
  if (type === 'CE') {
    delta = cdfD1;
  } else {
    delta = cdfD1 - 1.0;
  }

  // Gamma (identical for both Call and Put)
  const gamma = pdfD1 / (S * effectiveSigma * sqrtT);

  // Vega (change per 1% change in IV)
  const vega = (S * pdfD1 * sqrtT) / 100;

  // Theta (decay per calendar day, typically negative for buyers)
  let theta: number;
  const term1 = -(S * pdfD1 * effectiveSigma) / (2 * sqrtT);
  if (type === 'CE') {
    const term2 = -r * K * Math.exp(-r * effectiveT) * normalCDF(d2);
    theta = (term1 + term2) / 365;
  } else {
    const term2 = r * K * Math.exp(-r * effectiveT) * normalCDF(-d2);
    theta = (term1 + term2) / 365;
  }

  return {
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(6)),
    theta: Number(theta.toFixed(2)),
    vega: Number(vega.toFixed(2)),
    iv: Number((effectiveSigma * 100).toFixed(2)),
  };
}

/**
 * Solve for Implied Volatility using Newton-Raphson method
 */
export function calculateIV(
  marketPrice: number,
  S: number,
  K: number,
  T: number,
  r: number = 0.068,
  type: OptionType = 'CE'
): number {
  if (marketPrice <= 0 || T <= 0.0001) return 14.0;

  let sigma = 0.20; // Initial guess 20%
  const maxIterations = 30;
  const tolerance = 0.01;

  for (let i = 0; i < maxIterations; i++) {
    const price = calculateBSPrice(S, K, T, r, sigma, type);
    const diff = price - marketPrice;
    if (Math.abs(diff) < tolerance) {
      return Math.min(150, Math.max(5, sigma * 100));
    }

    const greeks = calculateGreeks(S, K, T, r, sigma, type);
    const vega = greeks.vega * 100; // unscale from 1% to 1.0 unit
    if (Math.abs(vega) < 1e-5) break;

    sigma = sigma - diff / vega;
    if (sigma <= 0.01) sigma = 0.01;
    if (sigma >= 2.5) sigma = 2.5;
  }

  return Math.min(150, Math.max(5, sigma * 100));
}
