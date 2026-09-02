import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LocationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads locations', () => {
    service.getLocations().subscribe();
    http.expectOne('/api/locations').flush([]);
  });

  it('creates a location', () => {
    const request = { name: 'Terrace', type: 'OUTSIDE' as const };
    service.createLocation(request).subscribe();
    const call = http.expectOne('/api/locations');
    expect(call.request.method).toBe('POST');
    expect(call.request.body).toEqual(request);
    call.flush({ id: 3, ...request });
  });
});
