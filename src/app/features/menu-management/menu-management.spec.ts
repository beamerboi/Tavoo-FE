import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MenuService } from '../../core/services/menu.service';
import { MenuManagement } from './menu-management';

describe('MenuManagement', () => {
  it('requires name, positive price, and category', async () => {
    await TestBed.configureTestingModule({
      imports: [MenuManagement],
      providers: [
        { provide: MenuService, useValue: { getMenu: () => of([]), createMenuItem: () => of({}) } },
      ],
    }).compileComponents();
    const component = TestBed.createComponent(MenuManagement).componentInstance;
    expect(component.form.invalid).toBe(true);
    component.form.setValue({
      name: 'Soup',
      price: -1,
      category: 'FOOD',
      courseType: 'PRIMO',
      available: true,
    });
    expect(component.form.controls.price.hasError('min')).toBe(true);
    component.form.setValue({
      name: 'Soup',
      price: 6.5,
      category: 'FOOD',
      courseType: 'PRIMO',
      available: true,
    });
    expect(component.form.valid).toBe(true);
  });
});
