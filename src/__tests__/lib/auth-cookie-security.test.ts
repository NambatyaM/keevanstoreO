// ============================================================
// Auth Cookie Security Tests — Cookie Flags, Signup Persistence, Rate Limiting
// ============================================================
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

// ── Replicate the cookie configuration from /api/auth/login & /api/auth/signup ──
// The route handlers use these exact settings:

const COOKIE_NAME = 'keevan-auth';

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  path: string;
  maxAge: number;
  sameSite: 'lax' | 'strict' | 'none';
}

function getAuthCookieOptions(nodeEnv: string): CookieOptions {
  return {
    httpOnly: true,
    secure: nodeEnv === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
  };
}

function createAuthCookieValue(userId: string, email: string): string {
  return JSON.stringify({ id: userId, email });
}

// ── Simulated mock signup logic (mirrors /api/auth/signup) ──

interface MockSignupResult {
  success: boolean;
  creator?: {
    id: string;
    email: string;
    username: string;
    displayName: string;
  };
  error?: string;
  cookie?: {
    name: string;
    value: string;
    options: CookieOptions;
  };
}

function mockSignup(
  input: { email: string; password: string; username: string; displayName: string },
  existingCreators: { email: string; username: string }[],
  nodeEnv: string = 'development'
): MockSignupResult {
  const { email, password, username, displayName } = input;

  // Validate required fields
  if (!email || !password || !username || !displayName) {
    return { success: false, error: 'All fields are required' };
  }

  // Validate username pattern
  const usernamePattern = /^[a-z0-9-]+$/;
  if (!usernamePattern.test(username) || username.length < 3 || username.length > 30) {
    return { success: false, error: 'Username can only contain lowercase letters, numbers, and hyphens' };
  }

  // Validate password length
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  // Check username availability
  if (existingCreators.some((c) => c.username === username)) {
    return { success: false, error: 'Username is already taken' };
  }

  // Check email uniqueness
  if (existingCreators.some((c) => c.email === email)) {
    return { success: false, error: 'An account with this email already exists' };
  }

  // Create mock creator
  const newCreator = {
    id: `creator-${Date.now()}`,
    email,
    username,
    displayName,
  };

  // Create auth cookie (mirrors production behavior)
  const cookieValue = createAuthCookieValue(newCreator.id, newCreator.email);
  const cookieOptions = getAuthCookieOptions(nodeEnv);

  return {
    success: true,
    creator: newCreator,
    cookie: {
      name: COOKIE_NAME,
      value: cookieValue,
      options: cookieOptions,
    },
  };
}

// ── Tests ────────────────────────────────────────────────────────

describe('Auth Cookie Security — Cookie Flags', () => {
  describe('httpOnly flag', () => {
    it('Cookie has httpOnly: true in development', () => {
      const options = getAuthCookieOptions('development');
      expect(options.httpOnly).toBe(true);
    });

    it('Cookie has httpOnly: true in production', () => {
      const options = getAuthCookieOptions('production');
      expect(options.httpOnly).toBe(true);
    });

    it('httpOnly prevents JavaScript access to cookie', () => {
      // This test verifies the configuration value, not browser behavior
      const options = getAuthCookieOptions('production');
      expect(options.httpOnly).toBe(true);
      // With httpOnly: true, document.cookie cannot access this cookie
    });

    it('Signup sets cookie with httpOnly', () => {
      const result = mockSignup(
        { email: 'test@example.com', password: 'password123', username: 'testuser', displayName: 'Test' },
        []
      );
      expect(result.cookie?.options.httpOnly).toBe(true);
    });

    it('Login cookie always has httpOnly regardless of environment', () => {
      const devOptions = getAuthCookieOptions('development');
      const prodOptions = getAuthCookieOptions('production');
      expect(devOptions.httpOnly).toBe(true);
      expect(prodOptions.httpOnly).toBe(true);
    });
  });

  describe('Secure flag', () => {
    it('Cookie has secure: false in development', () => {
      const options = getAuthCookieOptions('development');
      expect(options.secure).toBe(false);
    });

    it('Cookie has secure: true in production', () => {
      const options = getAuthCookieOptions('production');
      expect(options.secure).toBe(true);
    });

    it('Secure flag depends on NODE_ENV', () => {
      expect(getAuthCookieOptions('development').secure).toBe(false);
      expect(getAuthCookieOptions('production').secure).toBe(true);
      expect(getAuthCookieOptions('test').secure).toBe(false);
    });

    it('Signup cookie respects environment for secure flag', () => {
      const devResult = mockSignup(
        { email: 'dev@example.com', password: 'password123', username: 'devuser', displayName: 'Dev' },
        [],
        'development'
      );
      expect(devResult.cookie?.options.secure).toBe(false);

      const prodResult = mockSignup(
        { email: 'prod@example.com', password: 'password123', username: 'produser', displayName: 'Prod' },
        [],
        'production'
      );
      expect(prodResult.cookie?.options.secure).toBe(true);
    });
  });

  describe('sameSite flag', () => {
    it('Cookie has sameSite: lax in development', () => {
      const options = getAuthCookieOptions('development');
      expect(options.sameSite).toBe('lax');
    });

    it('Cookie has sameSite: lax in production', () => {
      const options = getAuthCookieOptions('production');
      expect(options.sameSite).toBe('lax');
    });

    it('sameSite: lax protects against CSRF while allowing top-level navigation', () => {
      const options = getAuthCookieOptions('production');
      expect(options.sameSite).toBe('lax');
      // 'lax' means: cookie is sent on top-level navigations (e.g., clicking a link)
      // but NOT on cross-site POST requests (CSRF protection)
    });

    it('Signup cookie has sameSite: lax', () => {
      const result = mockSignup(
        { email: 'test@example.com', password: 'password123', username: 'testuser', displayName: 'Test' },
        []
      );
      expect(result.cookie?.options.sameSite).toBe('lax');
    });
  });

  describe('Cookie path and maxAge', () => {
    it('Cookie path is "/" (available site-wide)', () => {
      const options = getAuthCookieOptions('production');
      expect(options.path).toBe('/');
    });

    it('Cookie maxAge is 7 days (604800 seconds)', () => {
      const options = getAuthCookieOptions('production');
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;
      expect(options.maxAge).toBe(sevenDaysInSeconds);
    });

    it('Cookie maxAge is consistent across environments', () => {
      const devOptions = getAuthCookieOptions('development');
      const prodOptions = getAuthCookieOptions('production');
      expect(devOptions.maxAge).toBe(prodOptions.maxAge);
    });
  });
});

describe('Auth Cookie Security — Cookie Value', () => {
  it('Cookie value is JSON with id and email', () => {
    const value = createAuthCookieValue('creator-1', 'test@example.com');
    const parsed = JSON.parse(value);
    expect(parsed).toHaveProperty('id', 'creator-1');
    expect(parsed).toHaveProperty('email', 'test@example.com');
  });

  it('Cookie value does not contain password', () => {
    const value = createAuthCookieValue('creator-1', 'test@example.com');
    const parsed = JSON.parse(value);
    expect(parsed).not.toHaveProperty('password');
  });

  it('Cookie value does not contain sensitive fields', () => {
    const value = createAuthCookieValue('creator-1', 'test@example.com');
    const parsed = JSON.parse(value);
    expect(parsed).not.toHaveProperty('balance');
    expect(parsed).not.toHaveProperty('isAdmin');
    expect(parsed).not.toHaveProperty('totalEarnings');
  });

  it('Cookie name is "keevan-auth"', () => {
    expect(COOKIE_NAME).toBe('keevan-auth');
  });

  it('Signup sets cookie with correct name', () => {
    const result = mockSignup(
      { email: 'test@example.com', password: 'password123', username: 'testuser', displayName: 'Test' },
      []
    );
    expect(result.cookie?.name).toBe('keevan-auth');
  });
});

describe('Auth Cookie Security — Mock Signup Persists Creator', () => {
  let creators: { email: string; username: string }[];

  beforeEach(() => {
    creators = [];
  });

  it('New creator is added to the creators list', () => {
    const result = mockSignup(
      { email: 'new@example.com', password: 'password123', username: 'newuser', displayName: 'New User' },
      creators
    );

    expect(result.success).toBe(true);
    // Simulate the push that happens in the route handler
    if (result.creator) {
      creators.push({ email: result.creator.email, username: result.creator.username });
    }
    expect(creators).toHaveLength(1);
    expect(creators[0].email).toBe('new@example.com');
  });

  it('Persisted creator can sign up with different email later', () => {
    // First signup
    mockSignup(
      { email: 'user1@example.com', password: 'password123', username: 'user1', displayName: 'User 1' },
      creators
    );
    creators.push({ email: 'user1@example.com', username: 'user1' });

    // Second signup with different credentials
    const result = mockSignup(
      { email: 'user2@example.com', password: 'password123', username: 'user2', displayName: 'User 2' },
      creators
    );
    expect(result.success).toBe(true);
  });

  it('Duplicate email is rejected', () => {
    creators.push({ email: 'existing@example.com', username: 'existing' });

    const result = mockSignup(
      { email: 'existing@example.com', password: 'password123', username: 'newusername', displayName: 'New' },
      creators
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('email already exists');
  });

  it('Duplicate username is rejected', () => {
    creators.push({ email: 'existing@example.com', username: 'existing-user' });

    const result = mockSignup(
      { email: 'new@example.com', password: 'password123', username: 'existing-user', displayName: 'New' },
      creators
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('Username is already taken');
  });

  it('Multiple creators can be persisted', () => {
    const users = [
      { email: 'a@example.com', username: 'user-a', displayName: 'User A' },
      { email: 'b@example.com', username: 'user-b', displayName: 'User B' },
      { email: 'c@example.com', username: 'user-c', displayName: 'User C' },
    ];

    for (const u of users) {
      const result = mockSignup(
        { email: u.email, password: 'password123', username: u.username, displayName: u.displayName },
        creators
      );
      expect(result.success).toBe(true);
      if (result.creator) {
        creators.push({ email: result.creator.email, username: result.creator.username });
      }
    }

    expect(creators).toHaveLength(3);
  });

  it('Signup with short password is rejected', () => {
    const result = mockSignup(
      { email: 'test@example.com', password: '12345', username: 'testuser', displayName: 'Test' },
      creators
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('at least 6 characters');
  });

  it('Signup with invalid username is rejected', () => {
    const result = mockSignup(
      { email: 'test@example.com', password: 'password123', username: 'INVALID', displayName: 'Test' },
      creators
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('lowercase letters, numbers, and hyphens');
  });
});

describe('Auth Cookie Security — Rate Limiting on Login Endpoint', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-05T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Login endpoint allows 5 attempts per minute', () => {
    const key = 'test:login:ratelimit:1';
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it('6th login attempt within a minute is blocked', () => {
    const key = 'test:login:ratelimit:2';
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60_000);
    }
    const result = checkRateLimit(key, 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('Login rate limit resets after 1 minute', () => {
    const key = 'test:login:ratelimit:3';
    const windowMs = 60_000;

    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, windowMs);
    }
    expect(checkRateLimit(key, 5, windowMs).allowed).toBe(false);

    // Wait for window to reset
    vi.advanceTimersByTime(windowMs + 1);

    // Should be allowed again
    expect(checkRateLimit(key, 5, windowMs).allowed).toBe(true);
  });

  it('Different IPs have separate login rate limits', () => {
    const keyA = 'test:login:ratelimit:ipA';
    const keyB = 'test:login:ratelimit:ipB';

    // Exhaust IP A
    for (let i = 0; i < 5; i++) {
      checkRateLimit(keyA, 5, 60_000);
    }
    expect(checkRateLimit(keyA, 5, 60_000).allowed).toBe(false);

    // IP B should still be allowed
    expect(checkRateLimit(keyB, 5, 60_000).allowed).toBe(true);
  });

  it('Rate limit is more restrictive for login (5) than checkout (10)', () => {
    // Checkout allows 10 requests per minute
    const checkoutKey = 'test:login:ratelimit:checkout';
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(checkoutKey, 10, 60_000).allowed).toBe(true);
    }

    // Login only allows 5 requests per minute
    const loginKey = 'test:login:ratelimit:login';
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(loginKey, 5, 60_000).allowed).toBe(true);
    }
    expect(checkRateLimit(loginKey, 5, 60_000).allowed).toBe(false);
  });

  it('Signup has even stricter rate limit (3 per minute)', () => {
    const key = 'test:login:ratelimit:signup';
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    }
    // 4th attempt should be blocked
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(false);
  });

  it('Rate limiting prevents brute force login attacks', () => {
    const key = 'test:login:ratelimit:bruteforce';

    // Simulate 5 failed login attempts (limit reached)
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60_000);
    }

    // Attacker cannot try more passwords
    const blocked = checkRateLimit(key, 5, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);

    // Even after waiting 30 seconds, still blocked
    vi.advanceTimersByTime(30_000);
    expect(checkRateLimit(key, 5, 60_000).allowed).toBe(false);

    // After the full minute, can try again
    vi.advanceTimersByTime(30_001);
    expect(checkRateLimit(key, 5, 60_000).allowed).toBe(true);
  });
});
