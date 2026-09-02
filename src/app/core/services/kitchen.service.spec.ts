import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api.config';
import { Order } from '../models/api.models';
import { KitchenService } from './kitchen.service';

describe('KitchenService', () => {
  let service: KitchenService;
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
    service = TestBed.inject(KitchenService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts and completes a whole course', () => {
    service.startCourse(9, 2).subscribe();
    const started = http.expectOne(`${API_BASE_URL}/api/kitchen/orders/9/courses/2/start`);
    expect(started.request.method).toBe('POST');
    started.flush(order);

    service.markCourseReady(9, 2).subscribe();
    const ready = http.expectOne(`${API_BASE_URL}/api/kitchen/orders/9/courses/2/ready`);
    expect(ready.request.method).toBe('POST');
    ready.flush(order);
  });
});
