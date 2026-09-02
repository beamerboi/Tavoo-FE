import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MenuItem, RestaurantLocation, RestaurantTable } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { LocationService } from '../../core/services/location.service';
import { MenuService } from '../../core/services/menu.service';
import { TableService } from '../../core/services/table.service';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  const diningRoom: RestaurantLocation = { id: 1, name: 'Dining room', type: 'INSIDE' };
  const terrace: RestaurantLocation = { id: 2, name: 'Terrace', type: 'OUTSIDE' };
  const tables: RestaurantTable[] = [
    { id: 10, tableNumber: 1, seatCount: 4, location: diningRoom, status: 'FREE' },
    { id: 20, tableNumber: 8, seatCount: 2, location: terrace, status: 'OCCUPIED' },
  ];
  const menu: MenuItem[] = [
    {
      id: 100,
      name: 'Risotto',
      price: 14,
      category: 'FOOD',
      courseType: 'PRIMO',
      available: true,
    },
    {
      id: 200,
      name: 'House wine',
      price: 6,
      category: 'ALCOHOL',
      courseType: 'BEVERAGE',
      available: true,
    },
  ];
  let tableResponse = () => of(tables);

  beforeEach(async () => {
    tableResponse = () => of(tables);
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { hasAnyRole: () => true } },
        { provide: TableService, useValue: { getTables: () => tableResponse() } },
        { provide: MenuService, useValue: { getMenu: () => of(menu) } },
        {
          provide: LocationService,
          useValue: { getLocations: () => of([diningRoom, terrace]) },
        },
      ],
    }).compileComponents();
  });

  it('summarizes floor and menu data returned by the backend', () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.loading()).toBe(false);
    expect(component.byLocation(diningRoom.id)).toEqual([tables[0]]);
    expect(component.stats().map(({ value }) => value)).toEqual([2, 1, 1, 2, 1, 1]);
    expect(fixture.nativeElement.textContent).toContain('Dining room');
    expect(fixture.nativeElement.textContent).toContain('T8');
  });

  it('shows a recoverable error when dashboard loading fails', () => {
    tableResponse = () => throwError(() => new Error('Backend unavailable'));
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();

    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toBe('Backend unavailable');
    expect(fixture.nativeElement.textContent).toContain('Could not load dashboard');
    expect(fixture.nativeElement.textContent).toContain('Try again');
  });
});
