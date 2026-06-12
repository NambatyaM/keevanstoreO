// ============================================================
// Store API Security Tests — Field Whitelist & Protected Fields
// ============================================================
import { describe, it, expect } from 'vitest';

// ── Replicate the whitelist logic from /api/store/route.ts PUT handler ──

const ALLOWED_FIELDS = [
  'displayName', 'bio', 'photoUrl', 'bannerUrl',
  'socialLinks', 'donationsEnabled', 'donationGoal',
] as const;

// Protected fields that should NEVER be updatable via store PUT
const PROTECTED_FIELDS = [
  'balance', 'isAdmin', 'totalEarnings', 'totalSales', 'totalViews',
  'is_admin', 'is_verified',
];

/**
 * Filter updates to only allowed fields — mirrors the exact logic
 * from the PUT handler in /api/store/route.ts
 */
function filterStoreUpdates(updates: Record<string, unknown>): Record<string, unknown> {
  const safeUpdates: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in updates) {
      safeUpdates[key] = updates[key as keyof typeof updates];
    }
  }
  return safeUpdates;
}

// ── Tests ────────────────────────────────────────────────────────

describe('Store API Security — Protected Fields', () => {
  describe('Protected fields cannot be updated', () => {
    it('Cannot update balance', () => {
      const updates = { balance: 999999 };
      const safe = filterStoreUpdates(updates);
      expect(safe).not.toHaveProperty('balance');
      expect(Object.keys(safe)).toHaveLength(0);
    });

    it('Cannot update isAdmin', () => {
      const updates = { isAdmin: true };
      const safe = filterStoreUpdates(updates);
      expect(safe).not.toHaveProperty('isAdmin');
    });

    it('Cannot update totalEarnings', () => {
      const updates = { totalEarnings: 10000000 };
      const safe = filterStoreUpdates(updates);
      expect(safe).not.toHaveProperty('totalEarnings');
    });

    it('Cannot update totalSales', () => {
      const updates = { totalSales: 999 };
      const safe = filterStoreUpdates(updates);
      expect(safe).not.toHaveProperty('totalSales');
    });

    it('Cannot update totalViews', () => {
      const updates = { totalViews: 999999 };
      const safe = filterStoreUpdates(updates);
      expect(safe).not.toHaveProperty('totalViews');
    });

    it('Cannot update is_admin (snake_case attempt)', () => {
      const updates = { is_admin: true };
      const safe = filterStoreUpdates(updates);
      expect(safe).not.toHaveProperty('is_admin');
    });

    it('Cannot update is_verified (snake_case attempt)', () => {
      const updates = { is_verified: true };
      const safe = filterStoreUpdates(updates);
      expect(safe).not.toHaveProperty('is_verified');
    });

    it('Cannot update any protected field when mixed with allowed fields', () => {
      const updates = {
        displayName: 'New Name',
        balance: 999999,
        isAdmin: true,
        totalEarnings: 10000000,
        bio: 'New bio',
      };
      const safe = filterStoreUpdates(updates);
      expect(safe).toHaveProperty('displayName', 'New Name');
      expect(safe).toHaveProperty('bio', 'New bio');
      expect(safe).not.toHaveProperty('balance');
      expect(safe).not.toHaveProperty('isAdmin');
      expect(safe).not.toHaveProperty('totalEarnings');
    });

    it('All protected fields are stripped in a single request', () => {
      const updates: Record<string, unknown> = {};
      for (const field of PROTECTED_FIELDS) {
        updates[field] = 'malicious';
      }
      const safe = filterStoreUpdates(updates);
      for (const field of PROTECTED_FIELDS) {
        expect(safe).not.toHaveProperty(field);
      }
      expect(Object.keys(safe)).toHaveLength(0);
    });

    it('Attempting to set balance to 0 is still blocked', () => {
      const updates = { balance: 0 };
      const safe = filterStoreUpdates(updates);
      expect(safe).not.toHaveProperty('balance');
    });

    it('Attempting to set isAdmin to false is still blocked', () => {
      // Even setting isAdmin to false should be blocked
      const updates = { isAdmin: false };
      const safe = filterStoreUpdates(updates);
      expect(safe).not.toHaveProperty('isAdmin');
    });
  });
});

describe('Store API Security — Allowed Fields', () => {
  it('Can update displayName', () => {
    const updates = { displayName: 'New Name' };
    const safe = filterStoreUpdates(updates);
    expect(safe).toHaveProperty('displayName', 'New Name');
  });

  it('Can update bio', () => {
    const updates = { bio: 'Updated bio text' };
    const safe = filterStoreUpdates(updates);
    expect(safe).toHaveProperty('bio', 'Updated bio text');
  });

  it('Can update photoUrl', () => {
    const updates = { photoUrl: 'https://example.com/photo.jpg' };
    const safe = filterStoreUpdates(updates);
    expect(safe).toHaveProperty('photoUrl', 'https://example.com/photo.jpg');
  });

  it('Can update bannerUrl', () => {
    const updates = { bannerUrl: 'https://example.com/banner.jpg' };
    const safe = filterStoreUpdates(updates);
    expect(safe).toHaveProperty('bannerUrl', 'https://example.com/banner.jpg');
  });

  it('Can update socialLinks', () => {
    const socialLinks = [{ platform: 'instagram', url: 'https://instagram.com/test' }];
    const updates = { socialLinks };
    const safe = filterStoreUpdates(updates);
    expect(safe).toHaveProperty('socialLinks', socialLinks);
  });

  it('Can update donationsEnabled', () => {
    const updates = { donationsEnabled: true };
    const safe = filterStoreUpdates(updates);
    expect(safe).toHaveProperty('donationsEnabled', true);
  });

  it('Can update donationGoal', () => {
    const updates = { donationGoal: 5000000 };
    const safe = filterStoreUpdates(updates);
    expect(safe).toHaveProperty('donationGoal', 5000000);
  });

  it('Can update all allowed fields at once', () => {
    const updates = {
      displayName: 'Full Update',
      bio: 'New bio',
      photoUrl: 'https://example.com/photo.jpg',
      bannerUrl: 'https://example.com/banner.jpg',
      socialLinks: [],
      donationsEnabled: true,
      donationGoal: 1000000,
    };
    const safe = filterStoreUpdates(updates);
    expect(Object.keys(safe)).toHaveLength(ALLOWED_FIELDS.length);
    for (const key of ALLOWED_FIELDS) {
      expect(safe).toHaveProperty(key);
    }
  });

  it('Can update donationGoal to null', () => {
    const updates = { donationGoal: null };
    const safe = filterStoreUpdates(updates);
    expect(safe).toHaveProperty('donationGoal', null);
  });
});

describe('Store API Security — Whitelist Filtering', () => {
  it('Empty updates object results in empty safeUpdates', () => {
    const safe = filterStoreUpdates({});
    expect(Object.keys(safe)).toHaveLength(0);
  });

  it('Unknown fields are silently dropped', () => {
    const updates = {
      unknownField: 'value',
      anotherUnknown: 123,
    };
    const safe = filterStoreUpdates(updates);
    expect(Object.keys(safe)).toHaveLength(0);
  });

  it('Only allowed fields pass through, rest are dropped', () => {
    const updates = {
      displayName: 'Valid',
      balance: 999999,       // protected — should be dropped
      bio: 'Also valid',
      isAdmin: true,         // protected — should be dropped
      randomField: 'dropped', // unknown — should be dropped
    };
    const safe = filterStoreUpdates(updates);
    expect(safe).toHaveProperty('displayName', 'Valid');
    expect(safe).toHaveProperty('bio', 'Also valid');
    expect(safe).not.toHaveProperty('balance');
    expect(safe).not.toHaveProperty('isAdmin');
    expect(safe).not.toHaveProperty('randomField');
    expect(Object.keys(safe)).toHaveLength(2);
  });

  it('Field names are case-sensitive', () => {
    const updates = {
      DisplayName: 'Wrong case', // should be dropped
      displayname: 'Wrong case', // should be dropped
      displayName: 'Correct',    // should pass
    };
    const safe = filterStoreUpdates(updates);
    expect(safe).toHaveProperty('displayName', 'Correct');
    expect(safe).not.toHaveProperty('DisplayName');
    expect(safe).not.toHaveProperty('displayname');
  });

  it('ALLOWED_FIELDS constant contains exactly the expected fields', () => {
    expect(ALLOWED_FIELDS).toEqual([
      'displayName', 'bio', 'photoUrl', 'bannerUrl',
      'socialLinks', 'donationsEnabled', 'donationGoal',
    ]);
  });

  it('PROTECTED_FIELDS list covers all known dangerous fields', () => {
    // Ensure the protected fields list includes all fields that
    // should never be user-modifiable
    expect(PROTECTED_FIELDS).toContain('balance');
    expect(PROTECTED_FIELDS).toContain('isAdmin');
    expect(PROTECTED_FIELDS).toContain('totalEarnings');
    expect(PROTECTED_FIELDS).toContain('totalSales');
    expect(PROTECTED_FIELDS).toContain('totalViews');
    expect(PROTECTED_FIELDS).toContain('is_admin');
    expect(PROTECTED_FIELDS).toContain('is_verified');
  });

  it('ALLOWED_FIELDS and PROTECTED_FIELDS have no overlap', () => {
    const allowedSet = new Set(ALLOWED_FIELDS);
    for (const field of PROTECTED_FIELDS) {
      expect(allowedSet.has(field as typeof ALLOWED_FIELDS[number])).toBe(false);
    }
  });

  it('Whitelist approach: only explicitly allowed fields pass', () => {
    // This demonstrates that the approach is a whitelist (allow only known-good)
    // not a blacklist (block known-bad). Any new field added to the Creator
    // type in the future will NOT be updatable unless explicitly added to
    // ALLOWED_FIELDS.
    const allPossibleFields = [
      'id', 'email', 'username', 'displayName', 'bio', 'photoUrl', 'bannerUrl',
      'socialLinks', 'donationsEnabled', 'donationGoal', 'donationCurrent',
      'balance', 'totalEarnings', 'totalSales', 'totalViews', 'isAdmin',
      'createdAt', 'updatedAt',
    ];

    for (const field of allPossibleFields) {
      const updates = { [field]: 'test' };
      const safe = filterStoreUpdates(updates);

      if ((ALLOWED_FIELDS as readonly string[]).includes(field)) {
        expect(safe).toHaveProperty(field);
      } else {
        expect(safe).not.toHaveProperty(field);
      }
    }
  });
});
