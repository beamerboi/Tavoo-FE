import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Order } from '../../core/models/api.models';
import { OrderService } from '../../core/services/order.service';
import { ReceiptService } from '../../core/services/receipt.service';
import { OrderLookup } from './order-lookup';

describe('OrderLookup', () => {
  const order: Order = {
    id: 15,
    tableId: 5,
    tableNumber: 10,
    waiterId: 4,
    waiterUsername: 'maria',
    status: 'OPEN',
    totalAmount: 32,
    items: [
      {
        id: 41,
        menuItemId: 2,
        menuItemName: 'Water',
        unitPrice: 3,
        category: 'BEVERAGE',
        courseType: 'BEVERAGE',
        preparationPriority: null,
        quantity: 1,
        notes: null,
        preparationStatus: 'READY',
      },
      {
        id: 42,
        menuItemId: 9,
        menuItemName: 'Pasta',
        unitPrice: 13,
        category: 'FOOD',
        courseType: 'PRIMO',
        preparationPriority: 1,
        quantity: 1,
        notes: null,
        preparationStatus: 'READY',
      },
      {
        id: 43,
        menuItemId: 10,
        menuItemName: 'Steak',
        unitPrice: 16,
        category: 'FOOD',
        courseType: 'STEAK',
        preparationPriority: 2,
        quantity: 1,
        notes: null,
        preparationStatus: 'ON_HOLD',
      },
    ],
  };
  let deliveredPriority: number | null;
  let releasedPriority: number | null;

  beforeEach(async () => {
    deliveredPriority = null;
    releasedPriority = null;
    await TestBed.configureTestingModule({
      imports: [OrderLookup],
      providers: [
        provideRouter([]),
        { provide: ReceiptService, useValue: { download: () => undefined } },
        {
          provide: OrderService,
          useValue: {
            getOpenOrders: () => of([order]),
            deliverCourse: (_orderId: number, priority: number) => {
              deliveredPriority = priority;
              return of({
                ...order,
                items: order.items.map((item) =>
                  item.preparationPriority === priority
                    ? { ...item, preparationStatus: 'SERVED' as const }
                    : item,
                ),
              });
            },
            releaseNextCourse: (_orderId: number, priority: number) => {
              releasedPriority = priority;
              return of({
                ...order,
                items: order.items.map((item) =>
                  item.preparationPriority === 1
                    ? { ...item, preparationStatus: 'SERVED' as const }
                    : item.preparationPriority === 2
                      ? { ...item, preparationStatus: 'ORDERED' as const }
                      : item,
                ),
              });
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('separates ready bar items and advances preparation-priority courses', () => {
    const fixture = TestBed.createComponent(OrderLookup);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.barItems(order).map((item) => item.id)).toEqual([41]);
    expect(component.courseSequences(order)).toEqual([1, 2]);
    expect(component.courseReady(order, 1)).toBe(true);

    component.deliverCourse(order.id, 1);
    expect(deliveredPriority).toBe(1);
    expect(component.courseServed(component.orders()[0], 1)).toBe(true);

    component.releaseNextCourse(order.id, 1);
    expect(releasedPriority).toBe(1);
    expect(component.courseStatus(component.orders()[0], 2)).toBe('ORDERED');
  });
});
