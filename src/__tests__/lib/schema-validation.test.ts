// ============================================================
// Schema Validation Tests — DB Constraints Match Application Code
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  USERNAME_RULES,
  MIN_PRODUCT_PRICE,
  MIN_WITHDRAWAL_AMOUNT,
  ORDER_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  WITHDRAWAL_STATUS_LABELS,
} from '@/lib/constants';
import {
  OrderStatus,
  ProductType,
  PaymentMethod,
  WithdrawalStatus,
} from '@/types';

// ── Tests ────────────────────────────────────────────────────────

describe('Schema Validation — Constants Match Types & Constraints', () => {
  // ── Username Rules ──────────────────────────────────────────

  describe('Username pattern: ^[a-z0-9-]+$', () => {
    it('Pattern is defined and correct', () => {
      expect(USERNAME_RULES.PATTERN).toBeDefined();
      expect(USERNAME_RULES.PATTERN.source).toBe('^[a-z0-9-]+$');
    });

    it('Accepts valid usernames', () => {
      const valid = ['sarah-creates', 'james-beats', 'abc123', 'a-b-c', 'test-user-1'];
      for (const username of valid) {
        expect(USERNAME_RULES.PATTERN.test(username)).toBe(true);
      }
    });

    it('Rejects uppercase letters', () => {
      expect(USERNAME_RULES.PATTERN.test('Sarah')).toBe(false);
      expect(USERNAME_RULES.PATTERN.test('TEST')).toBe(false);
    });

    it('Rejects spaces', () => {
      expect(USERNAME_RULES.PATTERN.test('sarah creates')).toBe(false);
    });

    it('Rejects special characters', () => {
      expect(USERNAME_RULES.PATTERN.test('sarah@creates')).toBe(false);
      expect(USERNAME_RULES.PATTERN.test('sarah_creates')).toBe(false);
      expect(USERNAME_RULES.PATTERN.test('sarah.creates')).toBe(false);
    });

    it('Rejects empty string', () => {
      expect(USERNAME_RULES.PATTERN.test('')).toBe(false);
    });
  });

  describe('Username min/max length: 3-30', () => {
    it('MIN_LENGTH is 3', () => {
      expect(USERNAME_RULES.MIN_LENGTH).toBe(3);
    });

    it('MAX_LENGTH is 30', () => {
      expect(USERNAME_RULES.MAX_LENGTH).toBe(30);
    });

    it('Username of length 2 is too short', () => {
      expect('ab'.length).toBeLessThan(USERNAME_RULES.MIN_LENGTH);
    });

    it('Username of length 3 is valid', () => {
      expect('abc'.length).toBeGreaterThanOrEqual(USERNAME_RULES.MIN_LENGTH);
    });

    it('Username of length 30 is valid', () => {
      const username30 = 'a'.repeat(30);
      expect(username30.length).toBeLessThanOrEqual(USERNAME_RULES.MAX_LENGTH);
    });

    it('Username of length 31 is too long', () => {
      const username31 = 'a'.repeat(31);
      expect(username31.length).toBeGreaterThan(USERNAME_RULES.MAX_LENGTH);
    });
  });

  // ── Price Minimum ───────────────────────────────────────────

  describe('Price minimum: 1000 UGX', () => {
    it('MIN_PRODUCT_PRICE is 1000', () => {
      expect(MIN_PRODUCT_PRICE).toBe(1000);
    });
  });

  // ── Withdrawal Minimum ──────────────────────────────────────

  describe('Withdrawal minimum: 50000 UGX', () => {
    it('MIN_WITHDRAWAL_AMOUNT is 50000', () => {
      expect(MIN_WITHDRAWAL_AMOUNT).toBe(50000);
    });

    it('Withdrawal minimum is greater than product price minimum', () => {
      expect(MIN_WITHDRAWAL_AMOUNT).toBeGreaterThan(MIN_PRODUCT_PRICE);
    });
  });

  // ── Order Statuses ──────────────────────────────────────────

  describe('Valid order statuses: pending, completed, failed, refunded', () => {
    it('ORDER_STATUS_LABELS has all required statuses', () => {
      expect(ORDER_STATUS_LABELS).toHaveProperty('pending');
      expect(ORDER_STATUS_LABELS).toHaveProperty('completed');
      expect(ORDER_STATUS_LABELS).toHaveProperty('failed');
      expect(ORDER_STATUS_LABELS).toHaveProperty('refunded');
    });

    it('OrderStatus enum matches ORDER_STATUS_LABELS keys', () => {
      const enumValues = Object.values(OrderStatus);
      const labelKeys = Object.keys(ORDER_STATUS_LABELS);

      for (const value of enumValues) {
        expect(labelKeys).toContain(value);
      }
    });

    it('No extra statuses in labels beyond enum', () => {
      const enumValues = Object.values(OrderStatus);
      const labelKeys = Object.keys(ORDER_STATUS_LABELS);

      expect(labelKeys.length).toBe(enumValues.length);
    });

    it('Status values are lowercase strings', () => {
      const values = Object.values(OrderStatus);
      for (const value of values) {
        expect(value).toBe(value.toLowerCase());
        expect(value).not.toContain(' ');
      }
    });
  });

  // ── Product Types ───────────────────────────────────────────

  describe('Valid product types: digital, event', () => {
    it('PRODUCT_TYPE_LABELS has digital and event', () => {
      expect(PRODUCT_TYPE_LABELS).toHaveProperty('digital');
      expect(PRODUCT_TYPE_LABELS).toHaveProperty('event');
    });

    it('ProductType enum matches PRODUCT_TYPE_LABELS keys', () => {
      const enumValues = Object.values(ProductType);
      const labelKeys = Object.keys(PRODUCT_TYPE_LABELS);

      for (const value of enumValues) {
        expect(labelKeys).toContain(value);
      }
    });

    it('Only two product types exist', () => {
      expect(Object.keys(PRODUCT_TYPE_LABELS).length).toBe(2);
      expect(Object.values(ProductType).length).toBe(2);
    });
  });

  // ── Payment Methods ─────────────────────────────────────────

  describe('Valid payment methods: mtn_momo, airtel_money, bank_transfer, card', () => {
    it('PAYMENT_METHOD_LABELS has all required methods', () => {
      expect(PAYMENT_METHOD_LABELS).toHaveProperty('mtn_momo');
      expect(PAYMENT_METHOD_LABELS).toHaveProperty('airtel_money');
      expect(PAYMENT_METHOD_LABELS).toHaveProperty('bank_transfer');
      expect(PAYMENT_METHOD_LABELS).toHaveProperty('card');
    });

    it('PaymentMethod enum matches PAYMENT_METHOD_LABELS keys', () => {
      const enumValues = Object.values(PaymentMethod);
      const labelKeys = Object.keys(PAYMENT_METHOD_LABELS);

      for (const value of enumValues) {
        expect(labelKeys).toContain(value);
      }
    });

    it('No extra payment methods in labels beyond enum', () => {
      const enumValues = Object.values(PaymentMethod);
      const labelKeys = Object.keys(PAYMENT_METHOD_LABELS);

      expect(labelKeys.length).toBe(enumValues.length);
    });

    it('Four payment methods exist', () => {
      expect(Object.keys(PAYMENT_METHOD_LABELS).length).toBe(4);
    });
  });

  // ── Withdrawal Statuses ─────────────────────────────────────

  describe('Valid withdrawal statuses', () => {
    it('WITHDRAWAL_STATUS_LABELS has all required statuses', () => {
      expect(WITHDRAWAL_STATUS_LABELS).toHaveProperty('pending');
      expect(WITHDRAWAL_STATUS_LABELS).toHaveProperty('approved');
      expect(WITHDRAWAL_STATUS_LABELS).toHaveProperty('processing');
      expect(WITHDRAWAL_STATUS_LABELS).toHaveProperty('completed');
      expect(WITHDRAWAL_STATUS_LABELS).toHaveProperty('rejected');
    });

    it('WithdrawalStatus enum matches WITHDRAWAL_STATUS_LABELS keys', () => {
      const enumValues = Object.values(WithdrawalStatus);
      const labelKeys = Object.keys(WITHDRAWAL_STATUS_LABELS);

      for (const value of enumValues) {
        expect(labelKeys).toContain(value);
      }
    });

    it('Five withdrawal statuses exist', () => {
      expect(Object.keys(WITHDRAWAL_STATUS_LABELS).length).toBe(5);
    });
  });

  // ── Cross-reference with mock data ──────────────────────────

  describe('Mock data conforms to schema constraints', () => {
    it('Mock creator usernames match the pattern', async () => {
      const { mockCreators } = await import('@/lib/mock-data');
      for (const creator of mockCreators) {
        expect(USERNAME_RULES.PATTERN.test(creator.username)).toBe(true);
      }
    });

    it('Mock creator usernames are within length bounds', async () => {
      const { mockCreators } = await import('@/lib/mock-data');
      for (const creator of mockCreators) {
        expect(creator.username.length).toBeGreaterThanOrEqual(
          USERNAME_RULES.MIN_LENGTH
        );
        expect(creator.username.length).toBeLessThanOrEqual(
          USERNAME_RULES.MAX_LENGTH
        );
      }
    });

    it('Mock product prices are >= MIN_PRODUCT_PRICE', async () => {
      const { mockProducts } = await import('@/lib/mock-data');
      for (const product of mockProducts) {
        expect(product.price).toBeGreaterThanOrEqual(MIN_PRODUCT_PRICE);
      }
    });

    it('Mock withdrawal amounts are >= MIN_WITHDRAWAL_AMOUNT (when approved)', async () => {
      const { mockWithdrawals } = await import('@/lib/mock-data');
      for (const withdrawal of mockWithdrawals) {
        expect(withdrawal.amount).toBeGreaterThanOrEqual(MIN_WITHDRAWAL_AMOUNT);
      }
    });

    it('Mock order statuses are valid', async () => {
      const { mockOrders } = await import('@/lib/mock-data');
      const validStatuses = Object.values(OrderStatus);
      for (const order of mockOrders) {
        expect(validStatuses).toContain(order.status);
      }
    });

    it('Mock product types are valid', async () => {
      const { mockProducts } = await import('@/lib/mock-data');
      const validTypes = Object.values(ProductType);
      for (const product of mockProducts) {
        expect(validTypes).toContain(product.type);
      }
    });

    it('Mock payment methods are valid', async () => {
      const { mockOrders } = await import('@/lib/mock-data');
      const validMethods = Object.values(PaymentMethod);
      for (const order of mockOrders) {
        expect(validMethods).toContain(order.paymentMethod);
      }
    });

    it('Mock withdrawal statuses are valid', async () => {
      const { mockWithdrawals } = await import('@/lib/mock-data');
      const validStatuses = Object.values(WithdrawalStatus);
      for (const withdrawal of mockWithdrawals) {
        expect(validStatuses).toContain(withdrawal.status);
      }
    });
  });
});
