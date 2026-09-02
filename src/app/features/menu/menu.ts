import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { MenuItem, MenuCategory } from '../../core/models/api.models';
import { MenuService } from '../../core/services/menu.service';

@Component({
  selector: 'app-menu',
  imports: [
    CurrencyPipe,
    HlmAlertImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmSpinnerImports,
    HlmTabsImports,
  ],
  template: `
    <section>
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p class="page-kicker">Current offering</p>
          <h1 class="page-title">Menu</h1>
          <p class="page-description">
            Only items returned by the backend's available-menu endpoint are shown.
          </p>
        </div>
        <button hlmBtn variant="outline" (click)="load()" [disabled]="loading()">
          Refresh menu
        </button>
      </div>

      @if (loading()) {
        <div class="surface mt-8 flex min-h-64 items-center justify-center gap-3 text-stone-500">
          <hlm-spinner /> Loading menu…
        </div>
      } @else if (error()) {
        <hlm-alert variant="destructive" class="mt-8"
          ><h4 hlmAlertTitle>Could not load menu</h4>
          <p hlmAlertDescription>{{ error() }}</p></hlm-alert
        >
      } @else if (items().length === 0) {
        <div class="surface mt-8 p-12 text-center">
          <p class="text-lg font-medium">No menu items available</p>
          <p class="mt-2 text-sm text-stone-500">Create an available item from Menu Management.</p>
        </div>
      } @else {
        <hlm-tabs tab="FOOD" class="mt-8 block">
          <hlm-tabs-list class="w-full sm:w-auto">
            <button hlmTabsTrigger="FOOD" class="flex-1 sm:flex-none">
              Food · {{ count('FOOD') }}
            </button>
            <button hlmTabsTrigger="ALCOHOL" class="flex-1 sm:flex-none">
              Alcohol · {{ count('ALCOHOL') }}
            </button>
          </hlm-tabs-list>
          @for (category of categories; track category) {
            <div
              hlmTabsContent="{{ category }}"
              class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              @for (item of byCategory(category); track item.id) {
                <hlm-card class="border-stone-200/80 shadow-none">
                  <div hlmCardContent class="p-5">
                    <div class="flex items-start justify-between gap-4">
                      <span hlmBadge variant="outline">{{ item.category }}</span
                      ><span class="text-xl font-semibold">{{ item.price | currency: 'EUR' }}</span>
                    </div>
                    <h2 class="mt-5 text-lg font-semibold">{{ item.name }}</h2>
                    <p class="mt-1 text-sm text-emerald-700">● Available to order</p>
                  </div>
                </hlm-card>
              } @empty {
                <p
                  class="col-span-full rounded-xl border border-dashed border-stone-300 p-10 text-center text-stone-500"
                >
                  No available {{ category.toLowerCase() }} items.
                </p>
              }
            </div>
          }
        </hlm-tabs>
      }
    </section>
  `,
})
export class Menu implements OnInit {
  private readonly menuService = inject(MenuService);
  readonly items = signal<MenuItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly categories: MenuCategory[] = ['FOOD', 'DESSERT', 'BEVERAGE', 'ALCOHOL'];

  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.menuService.getMenu().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }
  byCategory(category: MenuCategory): MenuItem[] {
    return this.items().filter((item) => item.category === category);
  }
  count(category: MenuCategory): number {
    return this.byCategory(category).length;
  }
}
