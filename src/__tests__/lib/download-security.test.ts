// ============================================================
// Download Security Tests — Token Validation & Access Control
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { DOWNLOAD_URL_EXPIRY } from '@/lib/constants';
import type { DownloadSession } from '@/types';

// ── Simulated download session store (mirrors production logic) ──

interface DownloadState {
  sessions: DownloadSession[];
}

function createInitialState(): DownloadState {
  return {
    sessions: [],
  };
}

function createDownloadSession(
  state: DownloadState,
  orderId: string,
  productId: string,
  options?: { expired?: boolean; maxDownloads?: number }
): DownloadSession {
  const now = Date.now();
  const expiryMs = options?.expired
    ? now - 1000 // Already expired
    : now + DOWNLOAD_URL_EXPIRY * 1000; // 24 hours from now

  const session: DownloadSession = {
    id: `ds-${crypto.randomUUID()}`,
    orderId,
    productId,
    downloadToken: crypto.randomUUID(),
    expiresAt: new Date(expiryMs).toISOString(),
    downloadCount: 0,
    maxDownloads: options?.maxDownloads ?? 5,
    lastDownloadedAt: null,
    createdAt: new Date().toISOString(),
  };

  state.sessions.push(session);
  return session;
}

// Simulate the download route logic
function getDownloadSession(
  state: DownloadState,
  token: string
): { success: boolean; data?: DownloadSession; error?: string; status?: number } {
  const session = state.sessions.find((s) => s.downloadToken === token);

  if (!session) {
    return { success: false, error: 'Invalid download token', status: 404 };
  }

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    return { success: false, error: 'Download link has expired', status: 410 };
  }

  // Check download count
  if (session.downloadCount >= session.maxDownloads) {
    return { success: false, error: 'Maximum downloads reached', status: 429 };
  }

  return { success: true, data: session };
}

// Simulate download action
function performDownload(
  state: DownloadState,
  token: string
): { success: boolean; downloadCount?: number; error?: string; status?: number } {
  const result = getDownloadSession(state, token);

  if (!result.success) {
    return result;
  }

  const session = result.data!;
  session.downloadCount += 1;
  session.lastDownloadedAt = new Date().toISOString();

  return {
    success: true,
    downloadCount: session.downloadCount,
  };
}

// ── Tests ────────────────────────────────────────────────────────

describe('Download Security', () => {
  let state: DownloadState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('Valid token returns session info', () => {
    const session = createDownloadSession(state, 'order-1', 'prod-1');
    const result = getDownloadSession(state, session.downloadToken);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.downloadToken).toBe(session.downloadToken);
    expect(result.data!.orderId).toBe('order-1');
    expect(result.data!.productId).toBe('prod-1');
  });

  it('Expired token returns error', () => {
    const session = createDownloadSession(state, 'order-2', 'prod-2', {
      expired: true,
    });
    const result = getDownloadSession(state, session.downloadToken);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Download link has expired');
    expect(result.status).toBe(410);
  });

  it('Invalid token returns 404', () => {
    const result = getDownloadSession(state, 'totally-invalid-token');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid download token');
    expect(result.status).toBe(404);
  });

  it('Max downloads exceeded returns error', () => {
    const session = createDownloadSession(state, 'order-3', 'prod-3', {
      maxDownloads: 2,
    });

    // Perform 2 downloads (max)
    performDownload(state, session.downloadToken);
    performDownload(state, session.downloadToken);

    // 3rd attempt should fail
    const result = performDownload(state, session.downloadToken);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Maximum downloads reached');
    expect(result.status).toBe(429);
  });

  it('Download count increments on each download action', () => {
    const session = createDownloadSession(state, 'order-4', 'prod-4');

    expect(session.downloadCount).toBe(0);

    const r1 = performDownload(state, session.downloadToken);
    expect(r1.success).toBe(true);
    expect(r1.downloadCount).toBe(1);

    const r2 = performDownload(state, session.downloadToken);
    expect(r2.success).toBe(true);
    expect(r2.downloadCount).toBe(2);

    const r3 = performDownload(state, session.downloadToken);
    expect(r3.success).toBe(true);
    expect(r3.downloadCount).toBe(3);

    // Verify session state
    expect(session.downloadCount).toBe(3);
    expect(session.lastDownloadedAt).not.toBeNull();
  });

  it('Token cannot be guessed (UUID format)', () => {
    const session = createDownloadSession(state, 'order-5', 'prod-5');
    const token = session.downloadToken;

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(token)).toBe(true);

    // Simple/sequential tokens should NOT be valid
    const simpleTokens = ['1', 'token', 'abc123', 'download-1', '00000000-0000-0000-0000-000000000001'];
    for (const simpleToken of simpleTokens) {
      const result = getDownloadSession(state, simpleToken);
      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    }
  });

  it('Default max downloads is 5', () => {
    const session = createDownloadSession(state, 'order-6', 'prod-6');
    expect(session.maxDownloads).toBe(5);
  });

  it('DOWNLOAD_URL_EXPIRY is 24 hours', () => {
    const twentyFourHoursInSeconds = 24 * 60 * 60;
    expect(DOWNLOAD_URL_EXPIRY).toBe(twentyFourHoursInSeconds);
  });

  it('Session is created with zero downloads', () => {
    const session = createDownloadSession(state, 'order-7', 'prod-7');
    expect(session.downloadCount).toBe(0);
    expect(session.lastDownloadedAt).toBeNull();
  });

  it('Remaining downloads is maxDownloads minus downloadCount', () => {
    const session = createDownloadSession(state, 'order-8', 'prod-8', {
      maxDownloads: 3,
    });

    expect(session.maxDownloads - session.downloadCount).toBe(3);

    performDownload(state, session.downloadToken);
    expect(session.maxDownloads - session.downloadCount).toBe(2);

    performDownload(state, session.downloadToken);
    expect(session.maxDownloads - session.downloadCount).toBe(1);
  });

  it('Expired session cannot be downloaded even if download count is below max', () => {
    const session = createDownloadSession(state, 'order-9', 'prod-9', {
      expired: true,
      maxDownloads: 5,
    });

    // Even though 0 < 5, the token is expired
    const result = performDownload(state, session.downloadToken);
    expect(result.success).toBe(false);
    expect(result.status).toBe(410);
  });

  it('Different tokens access different sessions', () => {
    const session1 = createDownloadSession(state, 'order-a', 'prod-a');
    const session2 = createDownloadSession(state, 'order-b', 'prod-b');

    const r1 = getDownloadSession(state, session1.downloadToken);
    const r2 = getDownloadSession(state, session2.downloadToken);

    expect(r1.data!.orderId).toBe('order-a');
    expect(r2.data!.orderId).toBe('order-b');
    expect(session1.downloadToken).not.toBe(session2.downloadToken);
  });
});
