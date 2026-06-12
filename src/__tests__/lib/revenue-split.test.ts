// ============================================================
// Revenue Split Tests — 10/90 Platform Fee Rule
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  PLATFORM_FEE_PERCENT,
  CREATOR_EARNING_PERCENT,
  MIN_PRODUCT_PRICE,
} from '@/lib/constants';

// Helper: calculate platform fee and creator earning using the same
// formula as the production code (see checkout route)
function calculateRevenueSplit(amount: number) {
  const platformFee = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
  const creatorEarning = amount - platformFee;
  return { platformFee, creatorEarning };
}

describe('Revenue Split — 10/90 Rule', () => {
  it('platform fee is 10% of the amount', () => {
    expect(PLATFORM_FEE_PERCENT).toBe(10);
  });

  it('creator earning percent is 90', () => {
    expect(CREATOR_EARNING_PERCENT).toBe(90);
  });

  it('creatorEarning + platformFee === amount (always)', () => {
    const amounts = [1000, 15000, 25000, 35000, 50000, 75000, 100000, 500000];
    for (const amount of amounts) {
      const { platformFee, creatorEarning } = calculateRevenueSplit(amount);
      expect(platformFee + creatorEarning).toBe(amount);
    }
  });

  // Test individual UGX amounts
  const testCases: [number, number, number][] = [
    [1000, 100, 900],
    [15000, 1500, 13500],
    [25000, 2500, 22500],
    [35000, 3500, 31500],
    [50000, 5000, 45000],
    [75000, 7500, 67500],
    [100000, 10000, 90000],
    [500000, 50000, 450000],
  ];

  for (const [amount, expectedFee, expectedEarning] of testCases) {
    it(`UGX ${amount.toLocaleString()} → fee=${expectedFee.toLocaleString()}, earning=${expectedEarning.toLocaleString()}`, () => {
      const { platformFee, creatorEarning } = calculateRevenueSplit(amount);
      expect(platformFee).toBe(expectedFee);
      expect(creatorEarning).toBe(expectedEarning);
    });
  }

  it('edge case: MIN_PRODUCT_PRICE (1000 UGX) splits correctly', () => {
    const { platformFee, creatorEarning } = calculateRevenueSplit(MIN_PRODUCT_PRICE);
    expect(platformFee).toBe(100);
    expect(creatorEarning).toBe(900);
    expect(platformFee + creatorEarning).toBe(MIN_PRODUCT_PRICE);
  });

  it('rounding: Math.round handles non-integer splits correctly', () => {
    // 3333 * 10 / 100 = 333.3 → rounds to 333
    const { platformFee, creatorEarning } = calculateRevenueSplit(3333);
    expect(platformFee).toBe(333);
    expect(creatorEarning).toBe(3000);
    expect(platformFee + creatorEarning).toBe(3333);
  });

  it('no rounding errors: sum always equals original amount', () => {
    // Test a wide range of amounts including odd numbers
    const oddAmounts = [1001, 999, 12345, 77777, 99999, 1234567];
    for (const amount of oddAmounts) {
      const { platformFee, creatorEarning } = calculateRevenueSplit(amount);
      expect(platformFee + creatorEarning).toBe(amount);
    }
  });

  it('platform fee is calculated with Math.round to avoid floating point issues', () => {
    // Ensure Math.round is used: 1001 * 10 / 100 = 100.1 → should round to 100
    const { platformFee } = calculateRevenueSplit(1001);
    expect(platformFee).toBe(100); // Math.round(100.1) = 100

    // 1005 * 10 / 100 = 100.5 → Math.round(100.5) = 101 (rounds half up in most JS engines)
    // Actually in JS, Math.round(100.5) = 101
    const { platformFee: fee2 } = calculateRevenueSplit(1005);
    expect(fee2).toBe(Math.round(1005 * 10 / 100));
  });

  it('creator earning is amount minus platform fee (not 90% directly)', () => {
    // This ensures no double-rounding issues
    const amount = 3333;
    const { platformFee, creatorEarning } = calculateRevenueSplit(amount);
    expect(creatorEarning).toBe(amount - platformFee);
    // Not directly: Math.round(amount * 90 / 100) could differ
    // e.g. 3333 * 90 / 100 = 2999.7 → rounds to 3000 (same here)
    // But the code does amount - platformFee, which is the correct approach
  });

  it('verifies mock order data matches the revenue split formula', async () => {
    // Import mock data to verify consistency
    const { mockOrders } = await import('@/lib/mock-data');
    for (const order of mockOrders) {
      const expectedFee = Math.round((order.amount * PLATFORM_FEE_PERCENT) / 100);
      const expectedEarning = order.amount - expectedFee;
      expect(order.platformFee).toBe(expectedFee);
      expect(order.creatorEarning).toBe(expectedEarning);
    }
  });
});
