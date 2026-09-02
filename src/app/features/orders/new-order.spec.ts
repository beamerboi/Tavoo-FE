import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CreateOrderRequest, MenuItem, Order, RestaurantTable } from '../../core/models/api.models';
import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { TableService } from '../../core/services/table.service';
import { NewOrder } from './new-order';

describe('NewOrder', () => {
  const table: RestaurantTable = {
    id: 4,
    tableNumber: 8,
    seatCount: 4,
    location: { id: 1, name: 'Main hall', type: 'INSIDE' },
    status: 'FREE',
  };
  const starter: MenuItem = {
    id: 10,
    name: 'Bruschetta',
    price: 7,
    category: 'FOOD',
    courseType: 'ANTIPASTO',
    available: true,
  };
  const main: MenuItem = {
    id: 20,
    name: 'Lasagne',
    price: 14,
    category: 'FOOD',
    courseType: 'PRIMO',
    available: true,
  };
  let submitted: CreateOrderRequest | null;

  beforeEach(async () => {
    submitted = null;
    const createdOrder: Order = {
      id: 99,
      tableId: table.id,
      copertoCount: table.seatCount,
      tableNumber: table.tableNumber,
      waiterId: 3,
      waiterUsername: 'maria',
      status: 'OPEN',
      totalAmount: 21,
      items: [],
    };

    await TestBed.configureTestingModule({
      imports: [NewOrder],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => String(table.id) } } },
        },
        { provide: TableService, useValue: { getTables: () => of([table]) } },
        { provide: MenuService, useValue: { getMenu: () => of([starter, main]) } },
        {
          provide: OrderService,
          useValue: {
            createOrder: (request: CreateOrderRequest) => {
              submitted = request;
              return of(createdOrder);
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('opens the menu with the clicked table selected', () => {
    const fixture = TestBed.createComponent(NewOrder);
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedTableId()).toBe(table.id);
    expect(fixture.componentInstance.filteredMenu()).toEqual([starter, main]);
  });

  it('groups cart items by service sequence and submits preparation priority', () => {
    const fixture = TestBed.createComponent(NewOrder);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.addToCart(starter);
    component.addToCart(main);
    component.changeQuantity(main.id, 1);
    component.setServiceSequence(main.id, '3');
    fixture.detectChanges();

    expect(component.cartCourses().map((course) => course.serviceSequence)).toEqual([1, 3]);
    expect(fixture.nativeElement.textContent).toContain('First service');
    expect(fixture.nativeElement.textContent).toContain('Third service');

    component.createOrder();

    expect(submitted).toEqual({
      tableId: table.id,
      copertoCount: table.seatCount,
      items: [
        {
          menuItemId: starter.id,
          quantity: 1,
          notes: '',
          preparationPriority: 1,
          serveFirst: true,
        },
        {
          menuItemId: main.id,
          quantity: 2,
          notes: '',
          preparationPriority: 3,
          serveFirst: false,
        },
      ],
    });
  });
});
