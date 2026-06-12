// ============================================================
// Rate Limiter Tests — In-Memory Rate Limiting
// ============================================================
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';

// ── Tests ────────────────────────────────────────────────────────

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Use unique keys per test to avoid interference from shared in-memory store
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-05T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Requests within limit are allowed ──

  describe('Requests within limit', () => {
    it('First request is always allowed', () => {
      const result = checkRateLimit('test:within:first', 10, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('Subsequent requests within limit are allowed', () => {
      const key = 'test:within:subsequent';
      checkRateLimit(key, 5, 60_000);
      checkRateLimit(key, 5, 60_000);
      checkRateLimit(key, 5, 60_000);
      const result = checkRateLimit(key, 5, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('Last allowed request has remaining = 0', () => {
      const key = 'test:within:last';
      for (let i = 0; i < 9; i++) {
        checkRateLimit(key, 10, 60_000);
      }
      const result = checkRateLimit(key, 10, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('Remaining count decrements correctly', () => {
      const key = 'test:within:decrement';
      const r1 = checkRateLimit(key, 5, 60_000);
      expect(r1.remaining).toBe(4);

      const r2 = checkRateLimit(key, 5, 60_000);
      expect(r2.remaining).toBe(3);

      const r3 = checkRateLimit(key, 5, 60_000);
      expect(r3.remaining).toBe(2);
    });
  });

  // ── Requests over limit are blocked ──

  describe('Requests over limit', () => {
    it('Request over limit is blocked', () => {
      const key = 'test:over:blocked';
      for (let i = 0; i < 10; i++) {
        checkRateLimit(key, 10, 60_000);
      }
      const result = checkRateLimit(key, 10, 60_000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('Blocked request still returns remaining = 0', () => {
      const key = 'test:over:remaining';
      for (let i = 0; i < 3; i++) {
        checkRateLimit(key, 3, 60_000);
      }
      const result = checkRateLimit(key, 3, 60_000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('Subsequent requests after being blocked are also blocked', () => {
      const key = 'test:over:persistent';
      for (let i = 0; i < 5; i++) {
        checkRateLimit(key, 5, 60_000);
      }
      // First blocked request
      expect(checkRateLimit(key, 5, 60_000).allowed).toBe(false);
      // Second blocked request
      expect(checkRateLimit(key, 5, 60_000).allowed).toBe(false);
    });

    it('Blocked request returns correct resetTime', () => {
      const key = 'test:over:resettime';
      const first = checkRateLimit(key, 2, 60_000);
      checkRateLimit(key, 2, 60_000);

      const blocked = checkRateLimit(key, 2, 60_000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.resetTime).toBe(first.resetTime);
    });
  });

  // ── Limit resets after window ──

  describe('Limit resets after window', () => {
    it('New window starts after resetTime passes', () => {
      const key = 'test:reset:window';
      const windowMs = 60_000;

      // Exhaust the limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit(key, 3, windowMs);
      }
      expect(checkRateLimit(key, 3, windowMs).allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(windowMs + 1);

      // Should be allowed again in a new window
      const result = checkRateLimit(key, 3, windowMs);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('Remaining resets to limit - 1 after window expires', () => {
      const key = 'test:reset:remaining';
      const windowMs = 30_000;

      // Use up 5 requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit(key, 5, windowMs);
      }
      expect(checkRateLimit(key, 5, windowMs).remaining).toBe(0);

      // Advance past window
      vi.advanceTimersByTime(windowMs + 1);

      const result = checkRateLimit(key, 5, windowMs);
      expect(result.remaining).toBe(4);
    });

    it('Requests within the same window share the same resetTime', () => {
      const key = 'test:reset:sametime';
      const windowMs = 60_000;

      const r1 = checkRateLimit(key, 10, windowMs);
      const r2 = checkRateLimit(key, 10, windowMs);

      expect(r1.resetTime).toBe(r2.resetTime);
    });

    it('New window has a later resetTime than the previous window', () => {
      const key = 'test:reset:newtime';
      const windowMs = 60_000;

      const r1 = checkRateLimit(key, 10, windowMs);

      // Advance past window
      vi.advanceTimersByTime(windowMs + 1);

      const r2 = checkRateLimit(key, 10, windowMs);
      expect(r2.resetTime).toBeGreaterThan(r1.resetTime);
    });
  });

  // ── Different keys are independent ──

  describe('Different keys are independent', () => {
    it('Two different keys have separate counters', () => {
      const keyA = 'test:independent:A';
      const keyB = 'test:independent:B';

      // Exhaust keyA
      for (let i = 0; i < 3; i++) {
        checkRateLimit(keyA, 3, 60_000);
      }
      expect(checkRateLimit(keyA, 3, 60_000).allowed).toBe(false);

      // keyB should still be allowed
      const result = checkRateLimit(keyB, 3, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('Exhausting one key does not affect another', () => {
      const key1 = 'test:independent:key1';
      const key2 = 'test:independent:key2';

      checkRateLimit(key1, 5, 60_000);
      checkRateLimit(key1, 5, 60_000);

      const r1 = checkRateLimit(key1, 5, 60_000);
      expect(r1.remaining).toBe(2);

      const r2 = checkRateLimit(key2, 5, 60_000);
      expect(r2.remaining).toBe(4);
    });

    it('Keys with different prefixes are independent', () => {
      const loginKey = 'test:independent:login:127.0.0.1';
      const checkoutKey = 'test:independent:checkout:127.0.0.1';

      // Exhaust login key
      for (let i = 0; i < 5; i++) {
        checkRateLimit(loginKey, 5, 60_000);
      }
      expect(checkRateLimit(loginKey, 5, 60_000).allowed).toBe(false);

      // Checkout key should be fine
      expect(checkRateLimit(checkoutKey, 5, 60_000).allowed).toBe(true);
    });
  });

  // ── Different limit configurations ──

  describe('Different limit configurations', () => {
    it('Default limit is 10 requests', () => {
      const key = 'test:config:default';
      // Should allow 10 requests with default params
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(key);
        expect(result.allowed).toBe(true);
      }
      // 11th should be blocked
      expect(checkRateLimit(key).allowed).toBe(false);
    });

    it('Custom limit of 1 allows only one request', () => {
      const key = 'test:config:limit1';
      const result1 = checkRateLimit(key, 1, 60_000);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(0);

      const result2 = checkRateLimit(key, 1, 60_000);
      expect(result2.allowed).toBe(false);
    });

    it('Custom limit of 100 allows many requests', () => {
      const key = 'test:config:limit100';
      for (let i = 0; i < 100; i++) {
        const result = checkRateLimit(key, 100, 60_000);
        expect(result.allowed).toBe(true);
      }
      expect(checkRateLimit(key, 100, 60_000).allowed).toBe(false);
    });

    it('Short window expires quickly', () => {
      const key = 'test:config:short';
      const shortWindow = 1000; // 1 second

      checkRateLimit(key, 1, shortWindow);
      expect(checkRateLimit(key, 1, shortWindow).allowed).toBe(false);

      // Advance past short window
      vi.advanceTimersByTime(shortWindow + 1);
      expect(checkRateLimit(key, 1, shortWindow).allowed).toBe(true);
    });

    it('Long window does not expire prematurely', () => {
      const key = 'test:config:long';
      const longWindow = 300_000; // 5 minutes

      checkRateLimit(key, 2, longWindow);
      checkRateLimit(key, 2, longWindow);
      expect(checkRateLimit(key, 2, longWindow).allowed).toBe(false);

      // Advance 1 minute — not yet expired
      vi.advanceTimersByTime(60_000);
      expect(checkRateLimit(key, 2, longWindow).allowed).toBe(false);

      // Advance past the full window
      vi.advanceTimersByTime(240_001);
      expect(checkRateLimit(key, 2, longWindow).allowed).toBe(true);
    });
  });

  // ── getClientId ──

  describe('getClientId', () => {
    it('Extracts IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });
      expect(getClientId(request)).toBe('192.168.1.1');
    });

    it('Extracts single IP from x-forwarded-for', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '203.0.113.50' },
      });
      expect(getClientId(request)).toBe('203.0.113.50');
    });

    it('Returns "unknown" when no x-forwarded-for header', () => {
      const request = new Request('http://localhost');
      expect(getClientId(request)).toBe('unknown');
    });

    it('Trims whitespace from IP', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1' },
      });
      expect(getClientId(request)).toBe('192.168.1.1');
    });

    it('Returns first IP when multiple IPs in x-forwarded-for', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' },
      });
      expect(getClientId(request)).toBe('1.1.1.1');
    });
  });
});
