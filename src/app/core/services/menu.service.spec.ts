import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { apiErrorInterceptor } from '../interceptors/api-error.interceptor';
import { API_BASE_URL } from '../config/api.config';
import { ApiError, MenuItem } from '../models/api.models';
import { MenuService } from './menu.service';

describe('MenuService', () => {
  let service: MenuService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(MenuService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the available menu', () => {
    const expected: MenuItem[] = [
      { id: 1, name: 'Pasta', price: 12, category: 'FOOD', courseType: 'PRIMO', available: true },
    ];
    let actual: MenuItem[] | undefined;
    service.getMenu().subscribe((items) => (actual = items));
    http.expectOne(`${API_BASE_URL}/api/menu`).flush(expected);
    expect(actual).toEqual(expected);
  });

  it('turns backend errors into a human-readable ApiError', () => {
    let actual: unknown;
    service.getMenu().subscribe({ error: (error: unknown) => (actual = error) });
    http
      .expectOne(`${API_BASE_URL}/api/menu`)
      .flush({ message: 'Menu unavailable' }, { status: 500, statusText: 'Server Error' });
    expect(actual).toBeInstanceOf(ApiError);
    expect((actual as ApiError).message).toBe('Menu unavailable');
  });
});
