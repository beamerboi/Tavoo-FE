import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { RestaurantLocation, RestaurantTable } from '../../core/models/api.models';
import { LocationService } from '../../core/services/location.service';
import { AuthService } from '../../core/services/auth.service';
import { TableService } from '../../core/services/table.service';
import { Tables } from './tables';

describe('Tables', () => {
  const mainHall: RestaurantLocation = { id: 10, name: 'Main Hall', type: 'INSIDE' };
  const terrace: RestaurantLocation = { id: 20, name: 'Terrace', type: 'OUTSIDE' };
  const insideTable: RestaurantTable = {
    id: 1,
    tableNumber: 1,
    seatCount: 4,
    location: mainHall,
    status: 'FREE',
  };
  const outsideTable: RestaurantTable = {
    id: 2,
    tableNumber: 8,
    seatCount: 2,
    location: terrace,
    status: 'OCCUPIED',
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Tables],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { hasAnyRole: () => true } },
        {
          provide: TableService,
          useValue: {
            getTables: () => of([insideTable, outsideTable]),
            createTable: () =>
              of({ id: 3, tableNumber: 3, seatCount: 4, location: mainHall, status: 'FREE' }),
          },
        },
        {
          provide: LocationService,
          useValue: {
            getLocations: () => of([mainHall, terrace]),
            createLocation: () => of({ id: 30, name: 'Garden', type: 'OUTSIDE' }),
          },
        },
      ],
    }).compileComponents();
  });

  it('groups tables inside their parent locations', () => {
    const fixture = TestBed.createComponent(Tables);
    fixture.detectChanges();
    expect(fixture.componentInstance.tablesFor(mainHall.id)).toEqual([insideTable]);
    expect(fixture.componentInstance.tablesFor(terrace.id)).toEqual([outsideTable]);
    expect(fixture.componentInstance.seatTotal(mainHall.id)).toBe(4);
    expect(fixture.componentInstance.seatTotal(terrace.id)).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('[aria-label$="floor map"]')).toHaveLength(2);
    expect(
      fixture.nativeElement.querySelector('[aria-label*="Table 8"] .bg-red-600'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[aria-label*="Table 1"] [role="link"]'),
    ).not.toBeNull();
  });

  it('requires positive table and seat counts', () => {
    const component = TestBed.createComponent(Tables).componentInstance;
    component.createForm.setValue({ tableNumber: 1, seatCount: 0, locationId: mainHall.id });
    expect(component.createForm.controls.seatCount.hasError('min')).toBe(true);
    component.createForm.setValue({ tableNumber: 1, seatCount: 4, locationId: terrace.id });
    expect(component.createForm.valid).toBe(true);
  });

  it('preselects the parent location when adding a table', () => {
    const fixture = TestBed.createComponent(Tables);
    const component = fixture.componentInstance;
    component.openCreate(terrace.id);
    fixture.detectChanges();
    expect(component.showCreateForm()).toBe(true);
    expect(component.createForm.controls.locationId.value).toBe(terrace.id);
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
  });

  it('opens table creation inside a newly created location', () => {
    const component = TestBed.createComponent(Tables).componentInstance;
    component.locationForm.setValue({ name: 'Garden', type: 'OUTSIDE' });
    component.createLocation();
    expect(component.locations()).toContainEqual({ id: 30, name: 'Garden', type: 'OUTSIDE' });
    expect(component.showLocationForm()).toBe(false);
    expect(component.showCreateForm()).toBe(true);
    expect(component.createForm.controls.locationId.value).toBe(30);
  });
});
