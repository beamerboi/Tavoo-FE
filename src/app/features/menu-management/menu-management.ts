import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { CourseType, MenuCategory, MenuItem } from '../../core/models/api.models';
import { MenuService } from '../../core/services/menu.service';

@Component({
  selector: 'app-menu-management',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    HlmAlertImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCheckboxImports,
    HlmInputImports,
    HlmNativeSelectImports,
    HlmSpinnerImports,
    HlmTableImports,
  ],
  template: `
    <section>
      <p class="page-kicker">Administration</p>
      <h1 class="page-title">Menu management</h1>
      <p class="page-description">
        Create menu records through the documented administration endpoint.
      </p>

      <div class="mt-6 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <form class="surface h-fit p-6 sm:p-7" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <p class="page-kicker">New record</p>
          <h2 class="mt-1 text-xl font-semibold">Create menu item</h2>
          <div class="mt-6 space-y-5">
            <div>
              <label for="name" class="mb-2 block text-sm font-medium">Name</label
              ><input
                hlmInput
                id="name"
                formControlName="name"
                maxlength="120"
                class="min-h-11 w-full"
                placeholder="Menu item name"
              />
              @if (invalid('name')) {
                <p class="mt-1.5 text-sm text-red-700">Name is required.</p>
              }
            </div>
            <div>
              <label for="price" class="mb-2 block text-sm font-medium">Price (€)</label
              ><input
                hlmInput
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                formControlName="price"
                class="min-h-11 w-full"
                placeholder="0.00"
              />
              @if (invalid('price')) {
                <p class="mt-1.5 text-sm text-red-700">Enter a price greater than zero.</p>
              }
            </div>
            <div>
              <label for="category" class="mb-2 block text-sm font-medium">Category</label
              ><select
                hlmNativeSelect
                id="category"
                formControlName="category"
                class="min-h-11 w-full bg-white"
              >
                <option [ngValue]="null" disabled>Select category</option>
                <option value="FOOD">FOOD</option>
                <option value="DESSERT">DESSERT</option>
                <option value="BEVERAGE">BEVERAGE</option>
                <option value="ALCOHOL">ALCOHOL</option>
              </select>
              @if (invalid('category')) {
                <p class="mt-1.5 text-sm text-red-700">Category is required.</p>
              }
            </div>
            <div>
              <label for="course-type" class="mb-2 block text-sm font-medium">Course</label
              ><select
                hlmNativeSelect
                id="course-type"
                formControlName="courseType"
                class="min-h-11 w-full bg-white"
              >
                @for (course of courseTypes; track course) {
                  <option [value]="course">{{ course }}</option>
                }
              </select>
            </div>
            <label class="flex min-h-12 items-center gap-3 rounded-xl border border-stone-200 px-4"
              ><hlm-checkbox
                inputId="available"
                formControlName="available"
                aria-label="Available to order"
              /><span
                ><span class="block text-sm font-medium">Available to order</span
                ><span class="block text-xs text-stone-500"
                  >Only available items appear in GET /api/menu.</span
                ></span
              ></label
            >
          </div>
          @if (error()) {
            <hlm-alert variant="destructive" class="mt-5"
              ><h4 hlmAlertTitle>Could not create item</h4>
              <p hlmAlertDescription>{{ error() }}</p></hlm-alert
            >
          }
          @if (created(); as item) {
            <hlm-alert class="mt-5 border-emerald-200 bg-emerald-50"
              ><h4 hlmAlertTitle>{{ item.name }} created</h4>
              <p hlmAlertDescription>
                Backend ID {{ item.id }} · {{ item.available ? 'available' : 'unavailable' }}.
              </p></hlm-alert
            >
          }
          <button
            hlmBtn
            type="submit"
            size="lg"
            class="mt-6 min-h-12 w-full bg-[#17231d] text-white"
            [disabled]="submitting()"
          >
            {{ submitting() ? 'Creating…' : 'Create Menu Item' }}
          </button>
        </form>

        <section class="surface overflow-hidden" aria-labelledby="available-menu-title">
          <header class="flex items-center justify-between gap-4 border-b border-stone-100 p-6">
            <div>
              <p class="page-kicker">API result</p>
              <h2 id="available-menu-title" class="mt-1 text-xl font-semibold">
                Available menu items
              </h2>
            </div>
            <button hlmBtn variant="outline" size="sm" (click)="loadMenu()">Refresh</button>
          </header>
          @if (loading()) {
            <div class="flex min-h-48 items-center justify-center gap-3 text-stone-500">
              <hlm-spinner /> Loading menu…
            </div>
          } @else if (menuError()) {
            <div class="p-6">
              <hlm-alert variant="destructive"
                ><h4 hlmAlertTitle>Could not load menu</h4>
                <p hlmAlertDescription>{{ menuError() }}</p></hlm-alert
              >
            </div>
          } @else if (items().length === 0) {
            <p class="p-10 text-center text-sm text-stone-500">No available menu items.</p>
          } @else {
            <div class="overflow-x-auto">
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>Name</th>
                    <th hlmTh>Category</th>
                    <th hlmTh class="text-right">Price</th>
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (item of items(); track item.id) {
                    <tr hlmTr>
                      <td hlmTd class="font-medium">{{ item.name }}</td>
                      <td hlmTd>
                        <span hlmBadge variant="outline">{{ item.category }}</span>
                      </td>
                      <td hlmTd class="text-right">{{ item.price | currency: 'EUR' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          <p
            class="border-t border-stone-100 bg-stone-50 px-6 py-4 text-xs leading-5 text-stone-500"
          >
            Unavailable items cannot be listed because the backend exposes no all-items endpoint. A
            newly created unavailable item is confirmed from the POST response only.
          </p>
        </section>
      </div>
    </section>
  `,
})
export class MenuManagement implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly menuService = inject(MenuService);
  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    price: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    category: this.fb.control<MenuCategory | null>(null, Validators.required),
    courseType: this.fb.nonNullable.control<CourseType>('PRIMO', Validators.required),
    available: this.fb.nonNullable.control(true),
  });
  readonly items = signal<MenuItem[]>([]);
  readonly created = signal<MenuItem | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly menuError = signal('');
  readonly courseTypes: CourseType[] = [
    'ANTIPASTO',
    'PRIMO',
    'SECONDO',
    'STEAK',
    'DESSERT',
    'BEVERAGE',
  ];

  ngOnInit(): void {
    this.loadMenu();
  }
  invalid(control: 'name' | 'price' | 'category'): boolean {
    const field = this.form.controls[control];
    return field.invalid && field.touched;
  }
  loadMenu(): void {
    this.loading.set(true);
    this.menuError.set('');
    this.menuService.getMenu().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.menuError.set(error.message);
        this.loading.set(false);
      },
    });
  }
  submit(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (this.form.invalid || value.price === null || value.category === null) return;
    this.submitting.set(true);
    this.error.set('');
    this.created.set(null);
    this.menuService
      .createMenuItem({
        name: value.name.trim(),
        price: value.price,
        category: value.category,
        courseType: value.courseType,
        available: value.available,
      })
      .subscribe({
        next: (item) => {
          this.created.set(item);
          this.submitting.set(false);
          this.form.reset({
            name: '',
            price: null,
            category: null,
            courseType: 'PRIMO',
            available: true,
          });
          if (item.available) this.loadMenu();
        },
        error: (error: Error) => {
          this.error.set(error.message);
          this.submitting.set(false);
        },
      });
  }
}
