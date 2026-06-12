// ============================================================
// Event Capacity Enforcement Tests
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { ProductType, ProductStatus } from '@/types';
import type { Product } from '@/types';

// ── Simulated event capacity logic (mirrors checkout route) ──

function canPurchaseEvent(product: Product): boolean {
  // Only applies to event products with a capacity limit
  if (product.type !== ProductType.EVENT) return true;
  if (product.capacity === null) return true; // null = unlimited
  return product.ticketsSold < product.capacity;
}

function simulateEventPurchase(product: Product): {
  success: boolean;
  error?: string;
} {
  if (product.type !== ProductType.EVENT) {
    return { success: true };
  }

  if (product.capacity !== null && product.ticketsSold >= product.capacity) {
    return { success: false, error: 'Event is sold out' };
  }

  // Increment tickets sold
  product.ticketsSold += 1;
  product.salesCount += 1;
  return { success: true };
}

// ── Tests ────────────────────────────────────────────────────────

describe('Event Capacity Enforcement', () => {
  let soldOutEvent: Product;
  let availableEvent: Product;
  let unlimitedEvent: Product;
  let digitalProduct: Product;

  beforeEach(() => {
    soldOutEvent = {
      id: 'prod-sold-out',
      creatorId: 'creator-3',
      title: 'Sold Out Event',
      slug: 'sold-out-event',
      description: 'An event with no tickets left',
      price: 50000,
      currency: 'UGX',
      type: ProductType.EVENT,
      status: ProductStatus.ACTIVE,
      thumbnailUrl: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      venue: 'National Theatre',
      eventDate: '2026-04-15T19:00:00Z',
      capacity: 200,
      ticketsSold: 200, // SOLD OUT
      views: 1200,
      salesCount: 200,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-03-01T08:00:00Z',
    };

    availableEvent = {
      id: 'prod-available',
      creatorId: 'creator-3',
      title: 'Available Event',
      slug: 'available-event',
      description: 'An event with tickets available',
      price: 75000,
      currency: 'UGX',
      type: ProductType.EVENT,
      status: ProductStatus.ACTIVE,
      thumbnailUrl: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      venue: 'Innovation Hub',
      eventDate: '2026-05-20T09:00:00Z',
      capacity: 30,
      ticketsSold: 18,
      views: 560,
      salesCount: 18,
      createdAt: '2026-02-01T12:00:00Z',
      updatedAt: '2026-03-02T16:00:00Z',
    };

    unlimitedEvent = {
      id: 'prod-unlimited',
      creatorId: 'creator-3',
      title: 'Unlimited Event',
      slug: 'unlimited-event',
      description: 'An event with no capacity limit',
      price: 25000,
      currency: 'UGX',
      type: ProductType.EVENT,
      status: ProductStatus.ACTIVE,
      thumbnailUrl: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      venue: 'Open Field',
      eventDate: '2026-06-01T10:00:00Z',
      capacity: null, // Unlimited
      ticketsSold: 500,
      views: 1000,
      salesCount: 500,
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-01T10:00:00Z',
    };

    digitalProduct = {
      id: 'prod-digital',
      creatorId: 'creator-1',
      title: 'Digital Product',
      slug: 'digital-product',
      description: 'A digital product',
      price: 25000,
      currency: 'UGX',
      type: ProductType.DIGITAL,
      status: ProductStatus.ACTIVE,
      thumbnailUrl: null,
      fileUrl: null,
      fileName: 'file.zip',
      fileSize: 1024,
      venue: null,
      eventDate: null,
      capacity: null,
      ticketsSold: 0,
      views: 100,
      salesCount: 10,
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-01T10:00:00Z',
    };
  });

  it('Cannot purchase if ticketsSold >= capacity', () => {
    expect(canPurchaseEvent(soldOutEvent)).toBe(false);
  });

  it('Can purchase if ticketsSold < capacity', () => {
    expect(canPurchaseEvent(availableEvent)).toBe(true);
  });

  it('ticketsSold increments after successful event purchase', () => {
    const initialSold = availableEvent.ticketsSold;
    const result = simulateEventPurchase(availableEvent);

    expect(result.success).toBe(true);
    expect(availableEvent.ticketsSold).toBe(initialSold + 1);
    expect(availableEvent.salesCount).toBe(initialSold + 1);
  });

  it('Capacity of null means unlimited', () => {
    expect(canPurchaseEvent(unlimitedEvent)).toBe(true);
  });

  it('Unlimited event can be purchased regardless of ticketsSold', () => {
    const result = simulateEventPurchase(unlimitedEvent);
    expect(result.success).toBe(true);
    expect(unlimitedEvent.ticketsSold).toBe(501);
  });

  it('Sold out event returns error on purchase attempt', () => {
    const result = simulateEventPurchase(soldOutEvent);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Event is sold out');
    expect(soldOutEvent.ticketsSold).toBe(200); // Unchanged
  });

  it('Digital products are not subject to capacity checks', () => {
    expect(canPurchaseEvent(digitalProduct)).toBe(true);
  });

  it('Event fills up after repeated purchases', () => {
    // Start with 18/30 tickets sold
    expect(availableEvent.ticketsSold).toBe(18);
    expect(availableEvent.capacity).toBe(30);

    // Purchase 12 more tickets to fill it up
    for (let i = 0; i < 12; i++) {
      const result = simulateEventPurchase(availableEvent);
      expect(result.success).toBe(true);
    }

    // Now it should be sold out
    expect(availableEvent.ticketsSold).toBe(30);
    expect(canPurchaseEvent(availableEvent)).toBe(false);

    // Next purchase should fail
    const result = simulateEventPurchase(availableEvent);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Event is sold out');
  });

  it('Event with capacity of 1 sells out after one purchase', () => {
    const singleTicketEvent: Product = {
      ...availableEvent,
      capacity: 1,
      ticketsSold: 0,
    };

    expect(canPurchaseEvent(singleTicketEvent)).toBe(true);

    const result = simulateEventPurchase(singleTicketEvent);
    expect(result.success).toBe(true);
    expect(singleTicketEvent.ticketsSold).toBe(1);

    // Now sold out
    expect(canPurchaseEvent(singleTicketEvent)).toBe(false);
  });

  it('Mock event products have valid capacity data', async () => {
    const { mockProducts } = await import('@/lib/mock-data');
    const events = mockProducts.filter(
      (p: Product) => p.type === ProductType.EVENT
    );

    for (const event of events) {
      // Events should have venue, eventDate, and capacity
      expect(event.venue).not.toBeNull();
      expect(event.eventDate).not.toBeNull();
      expect(event.capacity).not.toBeNull();
      // ticketsSold should not exceed capacity
      expect(event.ticketsSold).toBeLessThanOrEqual(event.capacity!);
    }
  });

  it('Mock digital products do not have capacity', async () => {
    const { mockProducts } = await import('@/lib/mock-data');
    const digitals = mockProducts.filter(
      (p: Product) => p.type === ProductType.DIGITAL
    );

    for (const digital of digitals) {
      expect(digital.capacity).toBeNull();
      expect(digital.venue).toBeNull();
      expect(digital.eventDate).toBeNull();
    }
  });
});
