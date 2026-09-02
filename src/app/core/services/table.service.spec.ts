import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api.config';
import { RestaurantTable } from '../models/api.models';
import { TableService } from './table.service';

describe('TableService', () => {
  it('loads restaurant tables', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(TableService);
    const http = TestBed.inject(HttpTestingController);
    const expected: RestaurantTable[] = [
      {
        id: 4,
        tableNumber: 4,
        seatCount: 4,
        location: { id: 1, name: 'Main Hall', type: 'INSIDE' },
        status: 'FREE',
      },
    ];
    let actual: RestaurantTable[] | undefined;
    service.getTables().subscribe((tables) => (actual = tables));
    http.expectOne(`${API_BASE_URL}/api/tables`).flush(expected);
    expect(actual).toEqual(expected);
    http.verify();
  });

  it('creates a table with the documented DTO', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(TableService);
    const http = TestBed.inject(HttpTestingController);
    const requestBody = { tableNumber: 8, seatCount: 6, locationId: 2 };
    service.createTable(requestBody).subscribe();
    const request = http.expectOne(`${API_BASE_URL}/api/tables`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestBody);
    request.flush({
      id: 8,
      tableNumber: 8,
      seatCount: 6,
      location: { id: 2, name: 'Terrace', type: 'OUTSIDE' },
      status: 'FREE',
    });
    http.verify();
  });
});
