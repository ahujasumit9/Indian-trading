import { PaperOrderTicket } from '../../types/trade';

/**
 * Creates canonical SHA-256 fingerprint for a proposed trading ticket
 * Ensures zero tampering between AI signal generation and user manual approval
 */
export async function createTicketFingerprint(ticket: PaperOrderTicket): Promise<string> {
  const canonicalString = JSON.stringify({
    index: ticket.index,
    strike: ticket.strike,
    optionType: ticket.optionType,
    expiry: ticket.expiry,
    quantity: ticket.quantity,
    limitPrice: ticket.limitPrice,
    stopLoss: ticket.stopLoss,
    target1: ticket.target1,
    timestamp: ticket.timestamp,
  });

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(canonicalString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback hash for test/non-crypto environments
  let hash = 0;
  for (let i = 0; i < canonicalString.length; i++) {
    const char = canonicalString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'fp_' + Math.abs(hash).toString(16).padStart(16, '0');
}

export interface ApprovedAuditEntry {
  fingerprint: string;
  approvedAt: string;
  userEmail: string;
  ticket: PaperOrderTicket;
}

class ApprovalLedger {
  private ledger: Map<string, ApprovedAuditEntry> = new Map();

  public approveTicket(
    fingerprint: string,
    ticket: PaperOrderTicket,
    userConfirmed: boolean,
    userEmail: string = 'smartscorpio99@gmail.com'
  ): ApprovedAuditEntry {
    if (!userConfirmed) {
      throw new Error('Explicit manual user approval confirmation is strictly required.');
    }

    const entry: ApprovedAuditEntry = {
      fingerprint,
      approvedAt: new Date().toISOString(),
      userEmail,
      ticket,
    };

    this.ledger.set(fingerprint, entry);
    return entry;
  }

  public isApproved(fingerprint: string): boolean {
    return this.ledger.has(fingerprint);
  }

  public getApproval(fingerprint: string): ApprovedAuditEntry | undefined {
    return this.ledger.get(fingerprint);
  }

  public getAllApprovals(): ApprovedAuditEntry[] {
    return Array.from(this.ledger.values());
  }
}

export const globalApprovalLedger = new ApprovalLedger();
