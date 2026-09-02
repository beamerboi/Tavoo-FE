import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { CourseType, MenuItem, Order, RestaurantTable } from '../../core/models/api.models';
import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { TableService } from '../../core/services/table.service';

export interface OrderCartLine {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
  serviceSequence: number;
}

type CourseFilter = 'ALL' | CourseType;

@Component({
  selector: 'app-new-order',
  imports: [
    CurrencyPipe,
    RouterLink,
    HlmAlertImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputImports,
    HlmNativeSelectImports,
    HlmSpinnerImports,
    HlmTextareaImports,
  ],
  template: `
    <section>
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p class="page-kicker">Waiter order station</p>
          <h1 class="page-title">Build a new order</h1>
          <p class="page-description">
            Choose from the menu, set quantities and service priority, then send the complete order.
          </p>
        </div>
        <a hlmBtn variant="outline" routerLink="/tables">Back to tables</a>
      </div>

      @if (pageLoading()) {
        <div class="surface mt-8 flex min-h-72 items-center justify-center gap-3 text-stone-500">
          <hlm-spinner /> Opening the menu...
        </div>
      } @else if (pageError()) {
        <hlm-alert variant="destructive" class="mt-8">
          <h4 hlmAlertTitle>Order station unavailable</h4>
          <p hlmAlertDescription>{{ pageError() }}</p>
          <button hlmBtn variant="outline" size="sm" class="mt-3" (click)="load()">
            Try again
          </button>
        </hlm-alert>
      } @else if (createdOrder(); as order) {
        <div class="surface mt-8 overflow-hidden">
          <div class="bg-[#17231d] px-6 py-8 text-white sm:px-9">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[#eca980]">
              Sent to kitchen
            </p>
            <h2 class="mt-2 text-3xl font-semibold">Order #{{ order.id }} created</h2>
            <p class="mt-2 text-stone-300">
              Table {{ order.tableNumber }} · {{ order.items.length }} menu lines
            </p>
          </div>
          <div class="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-9">
            <div>
              <p class="font-medium">The kitchen can now prepare each course.</p>
              <p class="mt-1 text-sm text-stone-500">
                Priority items are released in the first service sequence for the kitchen.
              </p>
            </div>
            <div class="flex flex-wrap gap-3">
              <button hlmBtn variant="outline" type="button" (click)="startAnother()">
                New order
              </button>
              <a hlmBtn class="bg-[#d97845] text-white hover:bg-[#c76838]" routerLink="/orders">
                View active orders
              </a>
            </div>
          </div>
        </div>
      } @else {
        <div
          class="mt-7 flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div class="grid w-full max-w-2xl gap-4 sm:grid-cols-[1fr_150px]">
            <div>
              <label for="order-table" class="mb-2 block text-sm font-medium">Serving table</label>
              <select
                hlmNativeSelect
                id="order-table"
                class="min-h-12 w-full bg-white"
                [value]="selectedTableId() ?? ''"
                (change)="selectTable($any($event.target).value)"
              >
                <option value="" disabled>Select a free table</option>
                @for (table of freeTables(); track table.id) {
                  <option [value]="table.id">
                    {{ table.location.name }} · Table {{ table.tableNumber }} ·
                    {{ table.seatCount }} seats
                  </option>
                }
              </select>
            </div>
            <div>
              <label for="coperto-count" class="mb-2 block text-sm font-medium">Guests</label>
              <input
                hlmInput
                id="coperto-count"
                type="number"
                min="1"
                class="min-h-12 w-full bg-white"
                [value]="copertoCount()"
                (input)="setCopertoCount($any($event.target).value)"
              />
            </div>
          </div>
          @if (selectedTable(); as table) {
            <div class="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <span class="font-semibold">Table {{ table.tableNumber }}</span>
              <span class="ml-2 text-emerald-700">{{ table.location.name }}</span>
            </div>
          }
        </div>

        <div class="mt-6 grid items-start gap-6 2xl:grid-cols-[minmax(0,1.45fr)_420px]">
          <section class="min-w-0">
            <div class="surface overflow-hidden">
              <header class="border-b border-stone-100 p-5 sm:p-6">
                <div class="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p class="page-kicker">Menu</p>
                    <h2 class="mt-1 text-2xl font-semibold">What would the table like?</h2>
                  </div>
                  <span hlmBadge variant="secondary">{{ menuItems().length }} available</span>
                </div>
                <div class="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Filter by course">
                  @for (filter of courseFilters; track filter) {
                    <button
                      type="button"
                      class="shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition"
                      [class.border-[#17231d]]="activeCourse() === filter"
                      [class.bg-[#17231d]]="activeCourse() === filter"
                      [class.text-white]="activeCourse() === filter"
                      [class.border-stone-200]="activeCourse() !== filter"
                      [class.bg-white]="activeCourse() !== filter"
                      (click)="activeCourse.set(filter)"
                    >
                      {{ courseLabel(filter) }}
                    </button>
                  }
                </div>
              </header>

              <div class="grid gap-4 bg-[#f7f5f0] p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
                @for (item of filteredMenu(); track item.id) {
                  <article
                    class="group flex min-h-52 flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d97845] hover:shadow-md"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <span hlmBadge variant="outline">{{ courseLabel(item.courseType) }}</span>
                      <span class="text-lg font-semibold">{{ item.price | currency: 'EUR' }}</span>
                    </div>
                    <div class="mt-5 flex-1">
                      <p class="text-lg font-semibold">{{ item.name }}</p>
                      <p class="mt-1 text-xs font-medium uppercase tracking-wider text-stone-400">
                        {{ item.category }}
                      </p>
                    </div>
                    @if (cartQuantity(item.id); as quantity) {
                      <div
                        class="mt-5 grid grid-cols-[42px_1fr_42px] items-center overflow-hidden rounded-xl border border-stone-200"
                      >
                        <button
                          type="button"
                          class="min-h-11 text-xl hover:bg-stone-50"
                          [attr.aria-label]="'Remove one ' + item.name"
                          (click)="changeQuantity(item.id, -1)"
                        >
                          −
                        </button>
                        <span class="text-center text-sm font-semibold">{{ quantity }}</span>
                        <button
                          type="button"
                          class="min-h-11 text-xl hover:bg-stone-50"
                          [attr.aria-label]="'Add one more ' + item.name"
                          (click)="changeQuantity(item.id, 1)"
                        >
                          +
                        </button>
                      </div>
                    } @else {
                      <button
                        hlmBtn
                        type="button"
                        class="mt-5 w-full bg-[#17231d] text-white hover:bg-[#24352d]"
                        (click)="addToCart(item)"
                      >
                        Add to order
                      </button>
                    }
                  </article>
                } @empty {
                  <div
                    class="col-span-full rounded-xl border border-dashed bg-white p-12 text-center"
                  >
                    <p class="font-medium">No items in this course</p>
                    <p class="mt-1 text-sm text-stone-500">Choose another course above.</p>
                  </div>
                }
              </div>
            </div>
          </section>

          <aside class="surface overflow-hidden 2xl:sticky 2xl:top-24">
            <header class="bg-[#17231d] p-6 text-white">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#eca980]">
                    Current selection
                  </p>
                  <h2 class="mt-1 text-2xl font-semibold">Your order</h2>
                </div>
                <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                  {{ totalQuantity() }} items
                </span>
              </div>
            </header>

            <div class="max-h-[60vh] space-y-5 overflow-y-auto p-5">
              @for (course of cartCourses(); track course.serviceSequence) {
                <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                  <header
                    class="flex items-center justify-between border-b border-orange-100 bg-orange-50 px-4 py-3"
                  >
                    <div>
                      <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a35633]">
                        {{ course.serviceSequence === 0 ? 'Bar ticket' : 'Preparation priority' }}
                      </p>
                      <h3 class="mt-0.5 font-semibold text-stone-900">
                        {{
                          course.serviceSequence === 0
                            ? 'Drinks · sent immediately'
                            : serviceLabel(course.serviceSequence) + ' service'
                        }}
                      </h3>
                    </div>
                    <span
                      class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-stone-600"
                    >
                      {{ course.lines.length }} lines
                    </span>
                  </header>

                  <div class="divide-y divide-stone-100 px-4">
                    @for (line of course.lines; track line.menuItem.id) {
                      <article class="py-4">
                        <div class="flex items-start justify-between gap-4">
                          <div>
                            <p class="font-semibold">{{ line.menuItem.name }}</p>
                            <p class="mt-1 text-xs text-stone-500">
                              {{ courseLabel(line.menuItem.courseType) }} ·
                              {{ line.menuItem.price | currency: 'EUR' }} each
                            </p>
                          </div>
                          <button
                            type="button"
                            class="text-xs font-semibold text-red-700 hover:underline"
                            (click)="removeFromCart(line.menuItem.id)"
                          >
                            Remove
                          </button>
                        </div>

                        <div class="mt-4 flex items-center justify-between gap-3">
                          <div
                            class="grid w-32 grid-cols-[36px_1fr_36px] items-center overflow-hidden rounded-lg border border-stone-200"
                          >
                            <button
                              type="button"
                              class="min-h-9 hover:bg-stone-50"
                              [attr.aria-label]="'Decrease ' + line.menuItem.name"
                              (click)="changeQuantity(line.menuItem.id, -1)"
                            >
                              −
                            </button>
                            <span class="text-center text-sm font-semibold">{{
                              line.quantity
                            }}</span>
                            <button
                              type="button"
                              class="min-h-9 hover:bg-stone-50"
                              [attr.aria-label]="'Increase ' + line.menuItem.name"
                              (click)="changeQuantity(line.menuItem.id, 1)"
                            >
                              +
                            </button>
                          </div>
                          <span class="font-semibold">
                            {{ line.menuItem.price * line.quantity | currency: 'EUR' }}
                          </span>
                        </div>

                        @if (!isBeverage(line.menuItem)) {
                          <div class="mt-4">
                            <label
                              [for]="'service-' + line.menuItem.id"
                              class="mb-1.5 block text-xs font-medium text-stone-600"
                            >
                              Serve this item
                            </label>
                            <select
                              hlmNativeSelect
                              [id]="'service-' + line.menuItem.id"
                              class="min-h-10 w-full bg-white text-sm"
                              [value]="line.serviceSequence"
                              (change)="
                                setServiceSequence(line.menuItem.id, $any($event.target).value)
                              "
                            >
                              @for (sequence of serviceSequenceOptions(); track sequence) {
                                <option [value]="sequence">
                                  {{ serviceLabel(sequence) }} service
                                </option>
                              }
                            </select>
                          </div>
                        } @else {
                          <p class="mt-4 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
                            No serving priority · routed to the bar
                          </p>
                        }

                        <label
                          [for]="'notes-' + line.menuItem.id"
                          class="mt-4 block text-xs font-medium text-stone-600"
                        >
                          Kitchen notes
                        </label>
                        <textarea
                          hlmTextarea
                          [id]="'notes-' + line.menuItem.id"
                          rows="2"
                          maxlength="500"
                          class="mt-1.5 w-full text-sm"
                          placeholder="Allergies or preparation notes"
                          [value]="line.notes"
                          (input)="updateNotes(line.menuItem.id, $any($event.target).value)"
                        ></textarea>
                      </article>
                    }
                  </div>
                </section>
              } @empty {
                <div class="py-12 text-center">
                  <div
                    class="mx-auto grid size-14 place-items-center rounded-full bg-stone-100 text-2xl"
                  >
                    +
                  </div>
                  <p class="mt-4 font-medium">Your order is empty</p>
                  <p class="mt-1 text-sm text-stone-500">Add menu items to begin.</p>
                </div>
              }
            </div>

            <footer class="border-t border-stone-100 bg-stone-50 p-5">
              <div class="flex items-center justify-between">
                <span class="text-sm text-stone-500">Estimated total</span>
                <span class="text-2xl font-semibold">{{ cartTotal() | currency: 'EUR' }}</span>
              </div>
              @if (actionError()) {
                <hlm-alert variant="destructive" class="mt-4">
                  <h4 hlmAlertTitle>Could not create order</h4>
                  <p hlmAlertDescription>{{ actionError() }}</p>
                </hlm-alert>
              }
              <button
                hlmBtn
                type="button"
                size="lg"
                class="mt-5 min-h-12 w-full bg-[#d97845] text-white hover:bg-[#c76838]"
                [disabled]="creating() || selectedTableId() === null || cart().length === 0"
                (click)="createOrder()"
              >
                {{ creating() ? 'Creating order...' : 'Create order' }}
              </button>
              @if (selectedTableId() === null) {
                <p class="mt-2 text-center text-xs text-stone-500">Select a table to continue.</p>
              }
            </footer>
          </aside>
        </div>
      }
    </section>
  `,
})
export class NewOrder implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tableService = inject(TableService);
  private readonly menuService = inject(MenuService);
  private readonly orderService = inject(OrderService);

  readonly tables = signal<RestaurantTable[]>([]);
  readonly menuItems = signal<MenuItem[]>([]);
  readonly selectedTableId = signal<number | null>(null);
  readonly copertoCount = signal(1);
  readonly cart = signal<OrderCartLine[]>([]);
  readonly activeCourse = signal<CourseFilter>('ALL');
  readonly createdOrder = signal<Order | null>(null);
  readonly pageLoading = signal(true);
  readonly creating = signal(false);
  readonly pageError = signal('');
  readonly actionError = signal('');
  readonly courseFilters: CourseFilter[] = [
    'ALL',
    'ANTIPASTO',
    'PRIMO',
    'SECONDO',
    'STEAK',
    'DESSERT',
    'BEVERAGE',
  ];

  readonly freeTables = () => this.tables().filter((table) => table.status === 'FREE');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.pageLoading.set(true);
    this.pageError.set('');
    forkJoin({ tables: this.tableService.getTables(), menu: this.menuService.getMenu() }).subscribe(
      {
        next: ({ tables, menu }) => {
          this.tables.set(tables);
          this.menuItems.set(menu.filter((item) => item.available));
          const queryTableId = Number(this.route.snapshot.queryParamMap.get('tableId'));
          const requestedTable = tables.find(
            (table) => table.id === queryTableId && table.status === 'FREE',
          );
          this.selectedTableId.set(requestedTable?.id ?? null);
          this.copertoCount.set(requestedTable?.seatCount ?? 1);
          this.pageLoading.set(false);
        },
        error: (error: Error) => {
          this.pageError.set(error.message);
          this.pageLoading.set(false);
        },
      },
    );
  }

  selectTable(value: string): void {
    const id = Number(value);
    const table = this.freeTables().find((candidate) => candidate.id === id);
    this.selectedTableId.set(table?.id ?? null);
    if (table) this.copertoCount.set(table.seatCount);
  }

  setCopertoCount(value: string): void {
    const count = Number(value);
    this.copertoCount.set(Number.isInteger(count) && count > 0 ? count : 1);
  }

  selectedTable(): RestaurantTable | undefined {
    return this.tables().find((table) => table.id === this.selectedTableId());
  }

  filteredMenu(): MenuItem[] {
    const filter = this.activeCourse();
    return filter === 'ALL'
      ? this.menuItems()
      : this.menuItems().filter((item) => item.courseType === filter);
  }

  addToCart(item: MenuItem): void {
    const existing = this.cart().find((line) => line.menuItem.id === item.id);
    if (existing) {
      this.changeQuantity(item.id, 1);
      return;
    }
    this.cart.update((lines) => [
      ...lines,
      {
        menuItem: item,
        quantity: 1,
        notes: '',
        serviceSequence: this.defaultServiceSequence(item.courseType),
      },
    ]);
  }

  changeQuantity(menuItemId: number, delta: number): void {
    this.cart.update((lines) =>
      lines.flatMap((line) => {
        if (line.menuItem.id !== menuItemId) return [line];
        const quantity = line.quantity + delta;
        return quantity > 0 ? [{ ...line, quantity }] : [];
      }),
    );
  }

  removeFromCart(menuItemId: number): void {
    this.cart.update((lines) => lines.filter((line) => line.menuItem.id !== menuItemId));
  }

  setServiceSequence(menuItemId: number, value: string): void {
    const serviceSequence = Number(value);
    if (!Number.isInteger(serviceSequence) || serviceSequence < 1) return;
    this.cart.update((lines) =>
      lines.map((line) => (line.menuItem.id === menuItemId ? { ...line, serviceSequence } : line)),
    );
  }

  updateNotes(menuItemId: number, notes: string): void {
    this.cart.update((lines) =>
      lines.map((line) => {
        if (line.menuItem.id !== menuItemId) return line;
        return { ...line, notes: notes.slice(0, 500) };
      }),
    );
  }

  cartCourses(): Array<{ serviceSequence: number; lines: OrderCartLine[] }> {
    return [
      ...new Set(
        this.cart().map((line) => (this.isBeverage(line.menuItem) ? 0 : line.serviceSequence)),
      ),
    ]
      .sort((a, b) => a - b)
      .map((serviceSequence) => ({
        serviceSequence,
        lines: this.cart().filter((line) =>
          serviceSequence === 0
            ? this.isBeverage(line.menuItem)
            : !this.isBeverage(line.menuItem) && line.serviceSequence === serviceSequence,
        ),
      }));
  }

  serviceSequenceOptions(): number[] {
    const highestSequence = Math.max(4, ...this.cart().map((line) => line.serviceSequence));
    return Array.from({ length: highestSequence + 1 }, (_, index) => index + 1);
  }

  cartQuantity(menuItemId: number): number {
    return this.cart().find((line) => line.menuItem.id === menuItemId)?.quantity ?? 0;
  }

  totalQuantity(): number {
    return this.cart().reduce((total, line) => total + line.quantity, 0);
  }

  cartTotal(): number {
    return this.cart().reduce((total, line) => total + line.menuItem.price * line.quantity, 0);
  }

  createOrder(): void {
    const tableId = this.selectedTableId();
    const lines = this.cart();
    if (tableId === null || lines.length === 0 || this.creating()) return;

    this.creating.set(true);
    this.actionError.set('');
    this.orderService
      .createOrder({
        tableId,
        copertoCount: this.copertoCount(),
        items: lines.map((line) => ({
          menuItemId: line.menuItem.id,
          quantity: line.quantity,
          notes: line.notes.trim(),
          preparationPriority: this.isBeverage(line.menuItem) ? undefined : line.serviceSequence,
          serveFirst: !this.isBeverage(line.menuItem) && line.serviceSequence === 1,
        })),
      })
      .subscribe({
        next: (order) => {
          this.createdOrder.set(order);
          this.creating.set(false);
        },
        error: (error: Error) => {
          this.actionError.set(error.message);
          this.creating.set(false);
        },
      });
  }

  startAnother(): void {
    this.createdOrder.set(null);
    this.cart.set([]);
    this.activeCourse.set('ALL');
    this.selectedTableId.set(null);
    this.copertoCount.set(1);
    this.load();
  }

  courseLabel(course: CourseFilter): string {
    const labels: Record<CourseFilter, string> = {
      ALL: 'All menu',
      ANTIPASTO: 'Starters',
      PRIMO: 'First course',
      SECONDO: 'Main course',
      STEAK: 'Steaks',
      DESSERT: 'Desserts',
      BEVERAGE: 'Drinks',
    };
    return labels[course];
  }

  isBeverage(item: MenuItem): boolean {
    return item.courseType === 'BEVERAGE';
  }

  serviceLabel(sequence: number): string {
    const labels: Record<number, string> = {
      1: 'First',
      2: 'Second',
      3: 'Third',
      4: 'Fourth',
      5: 'Fifth',
      6: 'Sixth',
    };
    if (labels[sequence]) return labels[sequence];
    const suffix =
      sequence % 10 === 1 && sequence % 100 !== 11
        ? 'st'
        : sequence % 10 === 2 && sequence % 100 !== 12
          ? 'nd'
          : sequence % 10 === 3 && sequence % 100 !== 13
            ? 'rd'
            : 'th';
    return `${sequence}${suffix}`;
  }

  private defaultServiceSequence(course: CourseType): number {
    const sequences: Record<CourseType, number> = {
      BEVERAGE: 1,
      ANTIPASTO: 1,
      PRIMO: 2,
      SECONDO: 3,
      STEAK: 3,
      DESSERT: 4,
    };
    return sequences[course];
  }
}
