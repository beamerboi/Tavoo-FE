import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { MenuItem, RestaurantLocation, RestaurantTable } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { LocationService } from '../../core/services/location.service';
import { MenuService } from '../../core/services/menu.service';
import { TableService } from '../../core/services/table.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    HlmAlertImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmSpinnerImports,
  ],
  template: `
    <section>
      <div class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p class="page-kicker">Operations overview</p>
          <h1 class="page-title">Good service starts here.</h1>
          <p class="page-description">
            A live view of dining-room capacity and the menu currently available to staff.
          </p>
        </div>
        @if (auth.hasAnyRole(['WAITER'])) {
          <a
            hlmBtn
            routerLink="/new-order"
            size="lg"
            class="min-h-12 bg-[#d97845] text-white hover:bg-[#c76838]"
            >+ New Order</a
          >
        }
      </div>

      @if (loading()) {
        <div class="surface mt-8 flex min-h-56 items-center justify-center gap-3 text-stone-500">
          <hlm-spinner /> Loading operations…
        </div>
      } @else if (error()) {
        <hlm-alert variant="destructive" class="mt-8">
          <h4 hlmAlertTitle>Could not load dashboard</h4>
          <p hlmAlertDescription>{{ error() }}</p>
          <button hlmBtn variant="outline" size="sm" class="mt-3" (click)="load()">
            Try again
          </button>
        </hlm-alert>
      } @else {
        <div class="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          @for (stat of stats(); track stat.label) {
            <hlm-card class="border-stone-200/80 shadow-none">
              <div hlmCardContent class="p-5">
                <p class="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  {{ stat.label }}
                </p>
                <p class="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                  {{ stat.value }}
                </p>
                <p class="mt-1 text-xs text-stone-400">{{ stat.note }}</p>
              </div>
            </hlm-card>
          }
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
          <section class="surface p-5 sm:p-7" aria-labelledby="table-overview-title">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="page-kicker">Dining room</p>
                <h2 id="table-overview-title" class="mt-1 text-xl font-semibold">Table overview</h2>
              </div>
              <a hlmBtn variant="outline" size="sm" routerLink="/tables">View all</a>
            </div>

            @if (locations().length === 0) {
              <p class="mt-8 rounded-xl bg-stone-50 p-6 text-center text-sm text-stone-500">
                No locations are configured in the backend.
              </p>
            } @else {
              <div class="mt-6 grid gap-6 lg:grid-cols-2">
                @for (location of locations(); track location.id) {
                  <section
                    class="rounded-xl border border-stone-200 bg-stone-50/60 p-4"
                    [attr.aria-labelledby]="'location-' + location.id + '-tables-title'"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <h3 [id]="'location-' + location.id + '-tables-title'" class="font-semibold">
                        {{ location.name }}
                      </h3>
                      <span hlmBadge variant="outline"
                        >{{ byLocation(location.id).length }} tables</span
                      >
                    </div>
                    <p class="mt-1 text-xs uppercase tracking-wider text-stone-400">
                      {{ location.type }}
                    </p>
                    @if (byLocation(location.id).length === 0) {
                      <p
                        class="mt-4 rounded-lg border border-dashed border-stone-300 p-5 text-center text-sm text-stone-500"
                      >
                        No tables in this location.
                      </p>
                    } @else {
                      <div class="mt-4 grid grid-cols-2 gap-3">
                        @for (table of byLocation(location.id); track table.id) {
                          <div
                            class="rounded-xl border p-4"
                            [class]="
                              table.status === 'FREE'
                                ? 'border-emerald-200 bg-emerald-50/70'
                                : 'border-red-300 bg-red-50'
                            "
                          >
                            <div class="flex items-start justify-between gap-2">
                              <span class="text-lg font-semibold">T{{ table.tableNumber }}</span>
                              <span
                                hlmBadge
                                [variant]="table.status === 'FREE' ? 'secondary' : 'outline'"
                                [class.border-red-300]="table.status === 'OCCUPIED'"
                                [class.bg-red-100]="table.status === 'OCCUPIED'"
                                [class.text-red-800]="table.status === 'OCCUPIED'"
                                >{{ table.status }}</span
                              >
                            </div>
                            <p class="mt-2 text-xs text-stone-500">{{ table.seatCount }} seats</p>
                          </div>
                        }
                      </div>
                    }
                  </section>
                }
              </div>
            }
          </section>

          <aside class="rounded-2xl bg-[#17231d] p-6 text-stone-100 shadow-lg sm:p-7">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#eca980]">
              Shift focus
            </p>
            <h2 class="mt-3 text-2xl font-semibold">Keep the floor moving.</h2>
            <p class="mt-3 text-sm leading-6 text-stone-400">
              Only free tables can start a new order. Payment closes an order and releases its table
              atomically.
            </p>
            <a
              hlmBtn
              routerLink="/tables"
              class="mt-7 min-h-11 w-full bg-white text-[#17231d] hover:bg-stone-100"
              >Choose a table</a
            >
          </aside>
        </div>
      }
    </section>
  `,
})
export class Dashboard implements OnInit {
  readonly auth = inject(AuthService);
  private readonly tableService = inject(TableService);
  private readonly menuService = inject(MenuService);
  private readonly locationService = inject(LocationService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly tables = signal<RestaurantTable[]>([]);
  readonly menu = signal<MenuItem[]>([]);
  readonly locations = signal<RestaurantLocation[]>([]);

  readonly stats = () => {
    const tables = this.tables();
    const menu = this.menu();
    return [
      { label: 'Total tables', value: tables.length, note: 'Configured' },
      {
        label: 'Free tables',
        value: tables.filter((table) => table.status === 'FREE').length,
        note: 'Ready now',
      },
      {
        label: 'Occupied',
        value: tables.filter((table) => table.status === 'OCCUPIED').length,
        note: 'In service',
      },
      { label: 'Available items', value: menu.length, note: 'Orderable' },
      {
        label: 'Food',
        value: menu.filter((item) => item.category === 'FOOD').length,
        note: '10% tax',
      },
      {
        label: 'Alcohol',
        value: menu.filter((item) => item.category === 'ALCOHOL').length,
        note: '15% tax',
      },
    ];
  };

  ngOnInit(): void {
    this.load();
  }

  byLocation(locationId: number): RestaurantTable[] {
    return this.tables().filter((table) => table.location.id === locationId);
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      tables: this.tableService.getTables(),
      menu: this.menuService.getMenu(),
      locations: this.locationService.getLocations(),
    }).subscribe({
      next: ({ tables, menu, locations }) => {
        this.tables.set(tables);
        this.menu.set(menu);
        this.locations.set(locations);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }
}
