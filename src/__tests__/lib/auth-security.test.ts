// ============================================================
// Auth Security Tests — Mock Mode Authentication
// ============================================================
import { describe, it, expect } from 'vitest';
import { mockCreators, getMockPassword } from '@/lib/mock-data';
import type { Creator } from '@/types';

// ── Simulated mock auth logic (mirrors POST /api/auth/login) ──

interface AuthResult {
  success: boolean;
  creator?: Creator;
  error?: string;
}

function mockLogin(email: string, password: string): AuthResult {
  // Find creator by email
  const creator = mockCreators.find((c) => c.email === email);
  if (!creator) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Check mock password
  const expectedPassword = getMockPassword(creator.id);
  if (password !== expectedPassword) {
    return { success: false, error: 'Invalid email or password' };
  }

  return { success: true, creator };
}

// ── Tests ────────────────────────────────────────────────────────

describe('Auth Security — Mock Mode', () => {
  it('Correct email + password = success', () => {
    const adminCreator = mockCreators.find(
      (c) => c.email === 'nkevinmegan@gmail.com'
    );
    expect(adminCreator).toBeDefined();

    const result = mockLogin('nkevinmegan@gmail.com', 'Keeva#44');
    expect(result.success).toBe(true);
    expect(result.creator).toBeDefined();
    expect(result.creator!.email).toBe('nkevinmegan@gmail.com');
  });

  it('Correct email + wrong password = failure', () => {
    const result = mockLogin('nkevinmegan@gmail.com', 'wrongpassword');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email or password');
  });

  it('Wrong email = failure', () => {
    const result = mockLogin('nonexistent@example.com', 'anypassword');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email or password');
  });

  it('Admin user (nkevinmegan@gmail.com) has isAdmin = true', () => {
    const adminCreator = mockCreators.find(
      (c) => c.email === 'nkevinmegan@gmail.com'
    );
    expect(adminCreator).toBeDefined();
    expect(adminCreator!.isAdmin).toBe(true);
  });

  it('Regular user has isAdmin = false', () => {
    const regularCreator = mockCreators.find(
      (c) => c.email === 'james@keevan.store'
    );
    expect(regularCreator).toBeDefined();
    expect(regularCreator!.isAdmin).toBe(false);
  });

  it('All mock creators have unique emails', () => {
    const emails = mockCreators.map((c) => c.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(emails.length);
  });

  it('Each mock creator has a different password', () => {
    const passwords = mockCreators.map((c) => getMockPassword(c.id));
    const uniquePasswords = new Set(passwords);
    expect(uniquePasswords.size).toBe(passwords.length);
  });

  it('Admin can log in with correct credentials', () => {
    const result = mockLogin('nkevinmegan@gmail.com', 'Keeva#44');
    expect(result.success).toBe(true);
    expect(result.creator!.isAdmin).toBe(true);
  });

  it('Non-admin creators can log in with correct credentials', () => {
    // Sarah (regular creator, not admin)
    const result1 = mockLogin('sarah@keevan.store', 'sarah123');
    expect(result1.success).toBe(true);
    expect(result1.creator!.isAdmin).toBe(false);

    // James
    const result2 = mockLogin('james@keevan.store', 'james123');
    expect(result2.success).toBe(true);
    expect(result2.creator!.isAdmin).toBe(false);

    // Nina
    const result3 = mockLogin('nina@keevan.store', 'nina123');
    expect(result3.success).toBe(true);
    expect(result3.creator!.isAdmin).toBe(false);
  });

  it('Error message does not reveal whether email exists', () => {
    // Wrong email: "Invalid email or password"
    const result1 = mockLogin('nonexistent@example.com', 'anypassword');
    const wrongEmailError = result1.error;

    // Correct email, wrong password: "Invalid email or password"
    const result2 = mockLogin('nkevinmegan@gmail.com', 'wrongpassword');
    const wrongPasswordError = result2.error;

    // Both should give the same generic error
    expect(wrongEmailError).toBe('Invalid email or password');
    expect(wrongPasswordError).toBe('Invalid email or password');
  });

  it('Empty email returns failure', () => {
    const result = mockLogin('', 'anypassword');
    expect(result.success).toBe(false);
  });

  it('Empty password returns failure', () => {
    const result = mockLogin('nkevinmegan@gmail.com', '');
    expect(result.success).toBe(false);
  });

  it('Case-sensitive email matching', () => {
    // Email lookups should be case-sensitive (database uniqueness)
    const result = mockLogin('NKEVINMEGAN@GMAIL.COM', 'Keeva#44');
    expect(result.success).toBe(false);
  });

  it('Password is exact match, not partial', () => {
    const result = mockLogin('nkevinmegan@gmail.com', 'Keeva#4');
    expect(result.success).toBe(false);
  });
});
