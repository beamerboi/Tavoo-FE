import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api.config';
import { Order } from '../models/api.models';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let http: HttpTestingController;
  const order: Order = {
    id: 9,
    tableId: 2,
    tableNumber: 2,
    waiterId: 3,
    waiterUsername: 'waiter',
    status: 'OPEN',
    totalAmount: 0,
    items: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrderService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('creates an order with the exact DTO', () => {
    const body = {
      tableId: 2,
      copertoCount: 2,
      items: [{ menuItemId: 7, quantity: 1, notes: '', serveFirst: false }],
    };
    service.createOrder(body).subscribe((result) => expect(result).toEqual(order));
    const request = http.expectOne(`${API_BASE_URL}/api/orders`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush(order);
  });

  it('adds an item using PUT', () => {
    const body = { menuItemId: 7, quantity: 2, notes: 'No salt', serveFirst: false };
    service.addItem(9, body).subscribe();
    const request = http.expectOne(`${API_BASE_URL}/api/orders/9/items`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    request.flush(order);
  });

  it('pays an order using POST', () => {
    service.payOrder(9).subscribe();
    const request = http.expectOne(`${API_BASE_URL}/api/orders/9/pay`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ paymentMethod: 'POS' });
    request.flush({ orderId: 9, status: 'PAID' });
  });

  it('loads the authoritative check used for receipt generation', () => {
    service.getCheck(9).subscribe();
    const request = http.expectOne(`${API_BASE_URL}/api/orders/9/check`);
    expect(request.request.method).toBe('GET');
    request.flush({ orderId: 9, items: [], totalAmount: 0 });
  });

  it('delivers a course and releases the next one using course endpoints', () => {
    service.deliverCourse(9, 2).subscribe();
    const delivered = http.expectOne(`${API_BASE_URL}/api/orders/9/courses/2/delivered`);
    expect(delivered.request.method).toBe('POST');
    delivered.flush(order);

    service.releaseNextCourse(9, 2).subscribe();
    const released = http.expectOne(`${API_BASE_URL}/api/orders/9/courses/2/release-next`);
    expect(released.request.method).toBe('POST');
    released.flush(order);
  });
});
