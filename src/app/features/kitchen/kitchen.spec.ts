import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Order } from '../../core/models/api.models';
import { KitchenService } from '../../core/services/kitchen.service';
import { Kitchen } from './kitchen';

describe('Kitchen', () => {
  const ordered: Order = {
    id: 12,
    tableId: 3,
    tableNumber: 7,
    waiterId: 4,
    waiterUsername: 'maria',
    status: 'OPEN',
    totalAmount: 28,
    items: [
      {
        id: 31,
        menuItemId: 8,
        menuItemName: 'Risotto',
        unitPrice: 14,
        category: 'FOOD',
        courseType: 'PRIMO',
        preparationPriority: 2,
        quantity: 2,
        notes: null,
        preparationStatus: 'ORDERED',
      },
    ],
  };
  let startedPriority: number | null;
  let readyPriority: number | null;

  beforeEach(async () => {
    startedPriority = null;
    readyPriority = null;
    await TestBed.configureTestingModule({
      imports: [Kitchen],
      providers: [
        {
          provide: KitchenService,
          useValue: {
            getOpenOrders: () => of([ordered]),
            startCourse: (_orderId: number, priority: number) => {
              startedPriority = priority;
              return of({
                ...ordered,
                items: ordered.items.map((item) => ({
                  ...item,
                  preparationStatus: 'IN_PREPARATION' as const,
                })),
              });
            },
            markCourseReady: (_orderId: number, priority: number) => {
              readyPriority = priority;
              return of({
                ...ordered,
                items: ordered.items.map((item) => ({
                  ...item,
                  preparationStatus: 'READY' as const,
                })),
              });
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('groups Swagger preparationPriority values and completes a course', () => {
    const fixture = TestBed.createComponent(Kitchen);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const course = component.courses()[0];

    expect(course.preparationPriority).toBe(2);
    component.startCourse(course);
    expect(startedPriority).toBe(2);
    expect(component.courseState(component.courses()[0])).toBe('PREPARING');

    component.markCourseReady(component.courses()[0]);
    expect(readyPriority).toBe(2);
    expect(component.courseState(component.courses()[0])).toBe('READY');
  });
});
