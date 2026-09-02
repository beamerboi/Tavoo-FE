import { Component, inject, OnInit, signal } from '@angular/core';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { Order, OrderItem } from '../../core/models/api.models';
import { KitchenService } from '../../core/services/kitchen.service';

interface KitchenCourse {
  order: Order;
  preparationPriority: number;
  items: OrderItem[];
}

@Component({
  selector: 'app-kitchen',
  imports: [HlmAlertImports, HlmBadgeImports, HlmButtonImports, HlmSpinnerImports],
  template: `
    <section>
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p class="page-kicker">Kitchen service</p>
          <h1 class="page-title">Course preparation board</h1>
          <p class="page-description">
            Prepare each table by service sequence and release complete courses for pickup.
          </p>
        </div>
        <button hlmBtn variant="outline" (click)="load()" [disabled]="loading()">Refresh</button>
      </div>

      @if (loading()) {
        <div class="surface mt-8 flex min-h-64 items-center justify-center gap-3 text-stone-500">
          <hlm-spinner /> Loading kitchen orders...
        </div>
      } @else if (error()) {
        <hlm-alert variant="destructive" class="mt-8">
          <h4 hlmAlertTitle>Kitchen board unavailable</h4>
          <p hlmAlertDescription>{{ error() }}</p>
        </hlm-alert>
      } @else if (courses().length === 0 && barItems().length === 0) {
        <div class="surface mt-8 p-12 text-center">
          <p class="text-lg font-medium">No courses waiting</p>
          <p class="mt-2 text-sm text-stone-500">New waiter orders will appear here.</p>
        </div>
      } @else {
        @if (barItems().length > 0) {
          <section class="surface mt-8 overflow-hidden border-sky-200">
            <header class="flex items-center justify-between border-b border-sky-100 bg-sky-50 p-5">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Bar</p>
                <h2 class="mt-1 text-xl font-semibold">Drinks to make</h2>
              </div>
              <span hlmBadge variant="outline">{{ barItems().length }} drinks</span>
            </header>
            <div class="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              @for (entry of barItems(); track entry.item.id) {
                <article class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-wider text-stone-400">
                        Order #{{ entry.order.id }} · Table {{ entry.order.tableNumber }}
                      </p>
                      <h3 class="mt-1 font-semibold">
                        {{ entry.item.quantity }} × {{ entry.item.menuItemName }}
                      </h3>
                    </div>
                    <span hlmBadge variant="outline">{{ statusLabel(entry.item) }}</span>
                  </div>
                  @if (entry.item.notes) {
                    <p class="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
                      {{ entry.item.notes }}
                    </p>
                  }
                  @if (entry.item.preparationStatus === 'ORDERED') {
                    <button
                      hlmBtn
                      size="sm"
                      class="mt-4 w-full bg-[#17231d] text-white"
                      [disabled]="updatingCourse() !== null"
                      (click)="updateBarItem(entry.order.id, entry.item, 'IN_PREPARATION')"
                    >
                      Start making
                    </button>
                  } @else if (entry.item.preparationStatus === 'IN_PREPARATION') {
                    <button
                      hlmBtn
                      size="sm"
                      class="mt-4 w-full bg-sky-700 text-white hover:bg-sky-800"
                      [disabled]="updatingCourse() !== null"
                      (click)="updateBarItem(entry.order.id, entry.item, 'READY')"
                    >
                      Ready at bar
                    </button>
                  } @else if (entry.item.preparationStatus === 'READY') {
                    <p
                      class="mt-4 rounded-lg bg-emerald-50 py-2 text-center text-xs font-semibold text-emerald-800"
                    >
                      Ready for pickup
                    </p>
                  } @else if (entry.item.preparationStatus === 'ON_HOLD') {
                    <p class="mt-4 text-center text-xs text-stone-500">Waiting to be released</p>
                  } @else {
                    <p class="mt-4 text-center text-xs font-semibold text-emerald-700">Delivered</p>
                  }
                </article>
              }
            </div>
          </section>
        }

        <div class="mt-8 grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          @for (course of courses(); track course.order.id + '-' + course.preparationPriority) {
            <article
              class="surface overflow-hidden"
              [class.opacity-65]="courseState(course) === 'ON HOLD'"
              [class.ring-2]="courseState(course) === 'READY'"
              [class.ring-emerald-500]="courseState(course) === 'READY'"
            >
              <header class="flex items-start justify-between gap-4 bg-[#17231d] p-5 text-white">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#eca980]">
                    Order #{{ course.order.id }} · Service {{ course.preparationPriority }}
                  </p>
                  <h2 class="mt-1 text-xl font-semibold">Table {{ course.order.tableNumber }}</h2>
                </div>
                <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                  {{ courseState(course) }}
                </span>
              </header>

              <div class="divide-y divide-stone-100 px-5">
                @for (item of course.items; track item.id) {
                  <div class="py-4">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="font-semibold">{{ item.quantity }} × {{ item.menuItemName }}</p>
                        <p class="mt-1 text-xs text-stone-500">{{ courseLabel(item) }}</p>
                      </div>
                      <span hlmBadge variant="outline">{{ statusLabel(item) }}</span>
                    </div>
                    @if (item.notes) {
                      <p class="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
                        {{ item.notes }}
                      </p>
                    }
                  </div>
                }
              </div>

              <footer class="border-t border-stone-100 bg-stone-50 p-5">
                @if (courseState(course) === 'ORDERED') {
                  <button
                    hlmBtn
                    class="w-full bg-[#17231d] text-white hover:bg-[#24352d]"
                    [disabled]="updatingCourse() !== null"
                    (click)="startCourse(course)"
                  >
                    Start entire course
                  </button>
                } @else if (courseState(course) === 'PREPARING') {
                  <button
                    hlmBtn
                    class="w-full bg-[#d97845] text-white hover:bg-[#c76838]"
                    [disabled]="updatingCourse() !== null"
                    (click)="markCourseReady(course)"
                  >
                    Course ready for pickup
                  </button>
                } @else if (courseState(course) === 'READY') {
                  <p
                    class="rounded-lg bg-emerald-50 py-2.5 text-center text-xs font-semibold text-emerald-800"
                  >
                    Ready · waiting for waiter pickup
                  </p>
                } @else if (courseState(course) === 'ON HOLD') {
                  <p class="text-center text-xs text-stone-500">
                    Waiter will release this after the previous course
                  </p>
                } @else {
                  <p class="text-center text-xs font-semibold text-emerald-700">Delivered</p>
                }
              </footer>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class Kitchen implements OnInit {
  private readonly kitchenService = inject(KitchenService);
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly updatingCourse = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.kitchenService.getOpenOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }

  courses(): KitchenCourse[] {
    return this.orders().flatMap((order) =>
      [
        ...new Set(
          order.items
            .map((item) => item.preparationPriority)
            .filter((priority): priority is number => priority !== null),
        ),
      ]
        .sort((a, b) => a - b)
        .map((preparationPriority) => ({
          order,
          preparationPriority,
          items: order.items.filter((item) => item.preparationPriority === preparationPriority),
        })),
    );
  }

  barItems(): Array<{ order: Order; item: OrderItem }> {
    return this.orders().flatMap((order) =>
      order.items
        .filter((item) => item.preparationPriority === null)
        .map((item) => ({ order, item })),
    );
  }

  courseState(course: KitchenCourse): 'ON HOLD' | 'ORDERED' | 'PREPARING' | 'READY' | 'DELIVERED' {
    if (course.items.every((item) => item.preparationStatus === 'ON_HOLD')) return 'ON HOLD';
    if (course.items.every((item) => item.preparationStatus === 'ORDERED')) return 'ORDERED';
    if (course.items.every((item) => item.preparationStatus === 'READY')) return 'READY';
    if (course.items.every((item) => item.preparationStatus === 'SERVED')) return 'DELIVERED';
    return 'PREPARING';
  }

  startCourse(course: KitchenCourse): void {
    this.runAction(course, 'start', () =>
      this.kitchenService.startCourse(course.order.id, course.preparationPriority),
    );
  }

  markCourseReady(course: KitchenCourse): void {
    this.runAction(course, 'ready', () =>
      this.kitchenService.markCourseReady(course.order.id, course.preparationPriority),
    );
  }

  statusLabel(item: OrderItem): string {
    return item.preparationStatus.replaceAll('_', ' ');
  }

  courseLabel(item: OrderItem): string {
    return item.courseType.replaceAll('_', ' ');
  }

  updateBarItem(orderId: number, item: OrderItem, status: 'IN_PREPARATION' | 'READY'): void {
    this.updatingCourse.set(`bar-${item.id}-${status}`);
    this.error.set('');
    this.kitchenService.updateItemStatus(orderId, item.id, { status }).subscribe({
      next: (updated) => this.finishUpdate(updated),
      error: (error: Error) => this.failUpdate(error),
    });
  }

  private runAction(
    course: KitchenCourse,
    action: string,
    request: () => ReturnType<KitchenService['startCourse']>,
  ): void {
    this.updatingCourse.set(`${course.order.id}-${course.preparationPriority}-${action}`);
    this.error.set('');
    request().subscribe({
      next: (updated) => {
        this.finishUpdate(updated);
      },
      error: (error: Error) => {
        this.failUpdate(error);
      },
    });
  }

  private finishUpdate(updated: Order): void {
    this.orders.update((orders) =>
      orders.map((order) => (order.id === updated.id ? updated : order)),
    );
    this.updatingCourse.set(null);
  }

  private failUpdate(error: Error): void {
    this.error.set(error.message);
    this.updatingCourse.set(null);
  }
}
