// ============================================================
// Checkout Validation Tests — Email, Required Fields, Product, Capacity
// ============================================================
import { describe, it, expect } from 'vitest';
import { ProductType, ProductStatus } from '@/types';
import type { Product } from '@/types';

// ── Replicate the validation logic from /api/checkout/route.ts ──

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

function validateRequiredFields(body: {
  productId?: string;
  buyerEmail?: string;
  buyerName?: string;
  paymentMethod?: string;
}): { valid: boolean; error?: string } {
  if (!body.productId || !body.buyerEmail || !body.buyerName || !body.paymentMethod) {
    return {
      valid: false,
      error: 'Missing required fields: productId, buyerEmail, buyerName, paymentMethod',
    };
  }
  return { valid: true };
}

function validateProductActive(product: Product): { valid: boolean; error?: string } {
  if (product.status !== 'active') {
    return { valid: false, error: 'Product is not available for purchase' };
  }
  return { valid: true };
}

function validateEventCapacity(product: Product): { valid: boolean; error?: string } {
  if (product.type === ProductType.EVENT && product.capacity !== null) {
    if (product.ticketsSold >= product.capacity) {
      return { valid: false, error: 'Event is sold out' };
    }
  }
  return { valid: true };
}

/**
 * Simulates the checkout validation flow.
 * Returns the creatorId derived from the product (NOT from request body).
 */
function simulateCheckout(
  body: {
    productId?: string;
    buyerEmail?: string;
    buyerName?: string;
    paymentMethod?: string;
    creatorId?: string; // Should be ignored — derived from product
  },
  product: Product | null
): { success: boolean; error?: string; creatorId?: string } {
  // 1. Validate required fields
  const fieldCheck = validateRequiredFields(body);
  if (!fieldCheck.valid) {
    return { success: false, error: fieldCheck.error };
  }

  // 2. Validate email
  if (!validateEmail(body.buyerEmail!)) {
    return { success: false, error: 'Invalid buyer email address' };
  }

  // 3. Product must exist
  if (!product) {
    return { success: false, error: 'Product not found' };
  }

  // 4. Product must be active
  const activeCheck = validateProductActive(product);
  if (!activeCheck.valid) {
    return { success: false, error: activeCheck.error };
  }

  // 5. Event capacity check
  const capacityCheck = validateEventCapacity(product);
  if (!capacityCheck.valid) {
    return { success: false, error: capacityCheck.error };
  }

  // 6. creatorId is ALWAYS derived from product, never from request body
  return { success: true, creatorId: product.creatorId };
}

// ── Test Data ─────────────────────────────────────────────────────

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-test',
    creatorId: 'creator-1',
    title: 'Test Product',
    slug: 'test-product',
    description: 'A test product',
    price: 25000,
    currency: 'UGX',
    type: ProductType.DIGITAL,
    status: ProductStatus.ACTIVE,
    thumbnailUrl: null,
    fileUrl: null,
    fileName: 'test.zip',
    fileSize: 1024,
    venue: null,
    eventDate: null,
    capacity: null,
    ticketsSold: 0,
    views: 100,
    salesCount: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────

describe('Checkout Validation — Email Validation', () => {
  it('Accepts valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('Accepts email with dots in local part', () => {
    expect(validateEmail('first.last@example.com')).toBe(true);
  });

  it('Accepts email with subdomain', () => {
    expect(validateEmail('user@mail.example.com')).toBe(true);
  });

  it('Accepts email with plus addressing', () => {
    expect(validateEmail('user+tag@example.com')).toBe(true);
  });

  it('Accepts email with dashes', () => {
    expect(validateEmail('user-name@example-domain.com')).toBe(true);
  });

  it('Rejects email without @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('Rejects email without domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('Rejects email without TLD', () => {
    expect(validateEmail('user@example')).toBe(false);
  });

  it('Rejects email with spaces', () => {
    expect(validateEmail('user @example.com')).toBe(false);
  });

  it('Rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('Rejects double @', () => {
    expect(validateEmail('user@@example.com')).toBe(false);
  });

  it('Rejects email starting with @', () => {
    expect(validateEmail('@example.com')).toBe(false);
  });

  it('Trims whitespace before validating', () => {
    expect(validateEmail('  user@example.com  ')).toBe(true);
  });

  it('Rejects just whitespace', () => {
    expect(validateEmail('   ')).toBe(false);
  });
});

describe('Checkout Validation — CreatorId Derived from Product', () => {
  it('creatorId comes from product, not request body', () => {
    const product = createMockProduct({ creatorId: 'creator-real' });
    const body = {
      productId: 'prod-test',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
      creatorId: 'creator-fake', // Attacker tries to set this
    };

    const result = simulateCheckout(body, product);
    expect(result.success).toBe(true);
    expect(result.creatorId).toBe('creator-real'); // From product, not body
  });

  it('creatorId in request body is ignored', () => {
    const product = createMockProduct({ creatorId: 'creator-1' });
    const body = {
      productId: 'prod-test',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
      creatorId: 'attacker-id',
    };

    const result = simulateCheckout(body, product);
    expect(result.creatorId).toBe('creator-1');
    expect(result.creatorId).not.toBe('attacker-id');
  });

  it('Checkout works even without creatorId in request body', () => {
    const product = createMockProduct({ creatorId: 'creator-1' });
    const body = {
      productId: 'prod-test',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
      // No creatorId field at all
    };

    const result = simulateCheckout(body, product);
    expect(result.success).toBe(true);
    expect(result.creatorId).toBe('creator-1');
  });

  it('Prevents revenue redirection attack', () => {
    // An attacker tries to redirect payment to their own creator account
    const product = createMockProduct({ creatorId: 'creator-victim' });
    const body = {
      productId: 'prod-test',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
      creatorId: 'creator-attacker', // Try to redirect earnings
    };

    const result = simulateCheckout(body, product);
    expect(result.creatorId).toBe('creator-victim');
  });
});

describe('Checkout Validation — Required Fields', () => {
  it('All required fields present = valid', () => {
    const result = validateRequiredFields({
      productId: 'prod-1',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
    });
    expect(result.valid).toBe(true);
  });

  it('Missing productId = invalid', () => {
    const result = validateRequiredFields({
      buyerEmail: 'buyer@example.com',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('productId');
  });

  it('Missing buyerEmail = invalid', () => {
    const result = validateRequiredFields({
      productId: 'prod-1',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('buyerEmail');
  });

  it('Missing buyerName = invalid', () => {
    const result = validateRequiredFields({
      productId: 'prod-1',
      buyerEmail: 'buyer@example.com',
      paymentMethod: 'mtn_momo',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('buyerName');
  });

  it('Missing paymentMethod = invalid', () => {
    const result = validateRequiredFields({
      productId: 'prod-1',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Test Buyer',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('paymentMethod');
  });

  it('Empty string productId = invalid', () => {
    const result = validateRequiredFields({
      productId: '',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
    });
    expect(result.valid).toBe(false);
  });

  it('Empty string buyerEmail = invalid', () => {
    const result = validateRequiredFields({
      productId: 'prod-1',
      buyerEmail: '',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
    });
    expect(result.valid).toBe(false);
  });

  it('All fields missing = invalid', () => {
    const result = validateRequiredFields({});
    expect(result.valid).toBe(false);
    expect(result.error).toContain('productId');
    expect(result.error).toContain('buyerEmail');
    expect(result.error).toContain('buyerName');
    expect(result.error).toContain('paymentMethod');
  });
});

describe('Checkout Validation — Product Must Be Active', () => {
  it('Active product passes validation', () => {
    const product = createMockProduct({ status: ProductStatus.ACTIVE });
    const result = validateProductActive(product);
    expect(result.valid).toBe(true);
  });

  it('Inactive product fails validation', () => {
    const product = createMockProduct({ status: ProductStatus.INACTIVE });
    const result = validateProductActive(product);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Product is not available for purchase');
  });

  it('Inactive digital product cannot be purchased', () => {
    const product = createMockProduct({
      type: ProductType.DIGITAL,
      status: ProductStatus.INACTIVE,
    });
    const body = {
      productId: 'prod-test',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
    };
    const result = simulateCheckout(body, product);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Product is not available for purchase');
  });

  it('Inactive event product cannot be purchased', () => {
    const product = createMockProduct({
      type: ProductType.EVENT,
      status: ProductStatus.INACTIVE,
    });
    const body = {
      productId: 'prod-test',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
    };
    const result = simulateCheckout(body, product);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Product is not available for purchase');
  });
});

describe('Checkout Validation — Event Capacity Check', () => {
  it('Event with available capacity passes', () => {
    const product = createMockProduct({
      type: ProductType.EVENT,
      capacity: 200,
      ticketsSold: 87,
    });
    const result = validateEventCapacity(product);
    expect(result.valid).toBe(true);
  });

  it('Sold-out event fails capacity check', () => {
    const product = createMockProduct({
      type: ProductType.EVENT,
      capacity: 200,
      ticketsSold: 200,
    });
    const result = validateEventCapacity(product);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Event is sold out');
  });

  it('Event with null capacity (unlimited) always passes', () => {
    const product = createMockProduct({
      type: ProductType.EVENT,
      capacity: null,
      ticketsSold: 9999,
    });
    const result = validateEventCapacity(product);
    expect(result.valid).toBe(true);
  });

  it('Digital product bypasses capacity check', () => {
    const product = createMockProduct({
      type: ProductType.DIGITAL,
      capacity: null,
    });
    const result = validateEventCapacity(product);
    expect(result.valid).toBe(true);
  });

  it('Event at capacity exactly (ticketsSold == capacity) is sold out', () => {
    const product = createMockProduct({
      type: ProductType.EVENT,
      capacity: 30,
      ticketsSold: 30,
    });
    const result = validateEventCapacity(product);
    expect(result.valid).toBe(false);
  });

  it('Event with one ticket remaining passes', () => {
    const product = createMockProduct({
      type: ProductType.EVENT,
      capacity: 100,
      ticketsSold: 99,
    });
    const result = validateEventCapacity(product);
    expect(result.valid).toBe(true);
  });

  it('Full checkout flow: sold-out event returns error', () => {
    const product = createMockProduct({
      type: ProductType.EVENT,
      capacity: 200,
      ticketsSold: 200,
      status: ProductStatus.ACTIVE,
    });
    const body = {
      productId: 'prod-test',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
    };
    const result = simulateCheckout(body, product);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Event is sold out');
  });

  it('Full checkout flow: product not found', () => {
    const body = {
      productId: 'nonexistent-product',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
    };
    const result = simulateCheckout(body, null);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Product not found');
  });

  it('Full checkout flow: valid digital product succeeds', () => {
    const product = createMockProduct({
      type: ProductType.DIGITAL,
      status: ProductStatus.ACTIVE,
      creatorId: 'creator-1',
    });
    const body = {
      productId: 'prod-test',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
    };
    const result = simulateCheckout(body, product);
    expect(result.success).toBe(true);
    expect(result.creatorId).toBe('creator-1');
  });

  it('Full checkout flow: invalid email fails before product check', () => {
    const body = {
      productId: 'prod-test',
      buyerEmail: 'not-an-email',
      buyerName: 'Test Buyer',
      paymentMethod: 'mtn_momo',
    };
    // Even with a valid product, bad email should fail first
    const result = simulateCheckout(body, createMockProduct());
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid buyer email address');
  });
});
