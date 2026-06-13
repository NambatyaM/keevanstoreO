// ============================================================
// Product Validation Tests — Business Rules for Products
// ============================================================
import { describe, it, expect } from 'vitest';
import { MIN_PRODUCT_PRICE } from '@/lib/constants';
import { ProductType, ProductStatus } from '@/types';

// ── Product validation logic (mirrors POST /api/products) ──

interface ProductInput {
  creatorId?: string;
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  type?: string;
  thumbnailUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  venue?: string;
  eventDate?: string;
  capacity?: number;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateProduct(input: ProductInput): ValidationResult {
  const { creatorId, title, price, type } = input;

  // Required fields
  if (!creatorId) {
    return { valid: false, error: 'Creator ID is required' };
  }

  if (!title) {
    return { valid: false, error: 'Title is required' };
  }

  if (!price) {
    return { valid: false, error: 'Price is required' };
  }

  if (!type) {
    return { valid: false, error: 'Type is required' };
  }

  // Price validation
  if (price < MIN_PRODUCT_PRICE) {
    return {
      valid: false,
      error: `Minimum price is UGX ${MIN_PRODUCT_PRICE.toLocaleString()}`,
    };
  }

  // Type validation
  if (type !== 'digital' && type !== 'event') {
    return { valid: false, error: 'Type must be digital or event' };
  }

  return { valid: true };
}

// Slug generation (mirrors production code)
function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
  );
}

// ── Tests ────────────────────────────────────────────────────────

describe('Product Validation', () => {
  it('Price must be >= MIN_PRODUCT_PRICE (1000 UGX)', () => {
    expect(MIN_PRODUCT_PRICE).toBe(1000);

    const result = validateProduct({
      creatorId: 'creator-1',
      title: 'Test Product',
      price: 999,
      type: 'digital',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Minimum price');
  });

  it('Price at MIN_PRODUCT_PRICE is valid', () => {
    const result = validateProduct({
      creatorId: 'creator-1',
      title: 'Test Product',
      price: MIN_PRODUCT_PRICE,
      type: 'digital',
    });
    expect(result.valid).toBe(true);
  });

  it('Price above MIN_PRODUCT_PRICE is valid', () => {
    const result = validateProduct({
      creatorId: 'creator-1',
      title: 'Test Product',
      price: 50000,
      type: 'digital',
    });
    expect(result.valid).toBe(true);
  });

  it('Title is required', () => {
    const result = validateProduct({
      creatorId: 'creator-1',
      price: 5000,
      type: 'digital',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Title');
  });

  it('Empty title is invalid', () => {
    const result = validateProduct({
      creatorId: 'creator-1',
      title: '',
      price: 5000,
      type: 'digital',
    });
    expect(result.valid).toBe(false);
  });

  it('Creator ID is required', () => {
    const result = validateProduct({
      title: 'Test Product',
      price: 5000,
      type: 'digital',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Creator ID');
  });

  it('Type must be digital or event', () => {
    const digital = validateProduct({
      creatorId: 'creator-1',
      title: 'Test Product',
      price: 5000,
      type: 'digital',
    });
    expect(digital.valid).toBe(true);

    const event = validateProduct({
      creatorId: 'creator-1',
      title: 'Test Event',
      price: 50000,
      type: 'event',
    });
    expect(event.valid).toBe(true);

    const invalid = validateProduct({
      creatorId: 'creator-1',
      title: 'Test',
      price: 5000,
      type: 'physical',
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toContain('digital or event');
  });

  it('Slug generation from title works correctly', () => {
    const testCases: [string, string][] = [
      ['Minimal Logo Template Pack', 'minimal-logo-template-pack'],
      ['Social Media Preset Bundle', 'social-media-preset-bundle'],
      ['Afrobeat Sample Pack Vol.1', 'afrobeat-sample-pack-vol-1'],
      ['Kampala Cultural Night', 'kampala-cultural-night'],
      ['Hello   World!!!', 'hello-world'],
      ['UPPERCASE Title', 'uppercase-title'],
      ['  spaces  around  ', 'spaces-around'],
    ];

    for (const [title, expectedBase] of testCases) {
      const slug = generateSlug(title);
      // The slug includes a timestamp suffix, so we check the base part
      const slugWithoutTimestamp = slug.replace(/-[^-]+$/, '');
      expect(slugWithoutTimestamp).toBe(expectedBase);
    }
  });

  it('Slug generation handles special characters', () => {
    const slug1 = generateSlug('Product @#$% Name!!!');
    expect(slug1).toMatch(/^product-name-/);

    const slug2 = generateSlug('Test/Slash\\Backslash');
    expect(slug2).toMatch(/^test-slash-backslash-/);

    const slug3 = generateSlug('CamelCaseProduct');
    expect(slug3).toMatch(/^camelcaseproduct-/);
  });

  it('Event products can have venue, eventDate, capacity', () => {
    const eventProduct = validateProduct({
      creatorId: 'creator-3',
      title: 'Kampala Cultural Night',
      price: 50000,
      type: 'event',
    });
    expect(eventProduct.valid).toBe(true);

    // Event-specific fields are optional in validation
    const eventWithDetails = validateProduct({
      creatorId: 'creator-3',
      title: 'Kampala Cultural Night',
      price: 50000,
      type: 'event',
      venue: 'National Theatre, Kampala',
      eventDate: '2026-04-15T19:00:00Z',
      capacity: 200,
    });
    expect(eventWithDetails.valid).toBe(true);
  });

  it('Digital products can have fileUrl, fileName, fileSize', () => {
    const digitalProduct = validateProduct({
      creatorId: 'creator-1',
      title: 'Logo Template Pack',
      price: 25000,
      type: 'digital',
      fileUrl: '/uploads/products/prod-1/logo-templates.zip',
      fileName: 'logo-templates.zip',
      fileSize: 15728640,
    });
    expect(digitalProduct.valid).toBe(true);
  });

  it('Digital product without file info is still valid (for draft)', () => {
    const result = validateProduct({
      creatorId: 'creator-1',
      title: 'Draft Product',
      price: 5000,
      type: 'digital',
    });
    expect(result.valid).toBe(true);
  });

  it('Zero price is invalid', () => {
    const result = validateProduct({
      creatorId: 'creator-1',
      title: 'Free Product',
      price: 0,
      type: 'digital',
    });
    expect(result.valid).toBe(false);
  });

  it('Negative price is invalid', () => {
    const result = validateProduct({
      creatorId: 'creator-1',
      title: 'Negative Price',
      price: -1000,
      type: 'digital',
    });
    expect(result.valid).toBe(false);
  });

  it('ProductType enum has digital and event values', () => {
    expect(ProductType.DIGITAL).toBe('digital');
    expect(ProductType.EVENT).toBe('event');
  });

  it('ProductStatus enum has active and inactive values', () => {
    expect(ProductStatus.ACTIVE).toBe('active');
    expect(ProductStatus.INACTIVE).toBe('inactive');
  });

  it('Mock products all have valid prices', async () => {
    const { mockProducts } = await import('@/lib/mock-data');
    for (const product of mockProducts) {
      expect(product.price).toBeGreaterThanOrEqual(MIN_PRODUCT_PRICE);
    }
  });

  it('Mock products all have valid types', async () => {
    const { mockProducts } = await import('@/lib/mock-data');
    for (const product of mockProducts) {
      expect(['digital', 'event']).toContain(product.type);
    }
  });
});
