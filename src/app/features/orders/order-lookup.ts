import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { Order, OrderCheck, OrderItem } from '../../core/models/api.models';
import { OrderService } from '../../core/services/order.service';
import { ReceiptService } from '../../core/services/receipt.service';

@Component({
  selector: 'app-order-lookup',
  imports: [
    CurrencyPipe,
    RouterLink,
    HlmAlertImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmSpinnerImports,
  ],
  template: `
    <section>
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p class="page-kicker">Waiter service</p>
          <h1 class="page-title">My active tables</h1>
          <p class="page-description">
            Pick up ready courses, mark them delivered, then release the next course when guests are
            ready.
          </p>
        </div>
        <div class="flex gap-2">
          <button hlmBtn variant="outline" (click)="load()" [disabled]="loading()">Refresh</button>
          <a hlmBtn class="bg-[#d97845] text-white hover:bg-[#c76838]" routerLink="/tables">
            New table order
          </a>
        </div>
      </div>

      @if (paidReceipt(); as receipt) {
        <hlm-alert class="mt-6 border-emerald-200 bg-emerald-50">
          <h4 hlmAlertTitle>Order #{{ receipt.orderId }} paid</h4>
          <p hlmAlertDescription>
            Table {{ receipt.tableNumber }} is free. The final receipt is ready to download.
          </p>
          <button
            hlmBtn
            size="sm"
            class="mt-3 bg-[#17231d] text-white"
            (click)="downloadPaidReceipt()"
          >
            Download receipt PDF
          </button>
        </hlm-alert>
      }

      @if (loading()) {
        <div class="surface mt-8 flex min-h-64 items-center justify-center gap-3 text-stone-500">
          <hlm-spinner /> Loading your orders...
        </div>
      } @else if (error()) {
        <hlm-alert variant="destructive" class="mt-8">
          <h4 hlmAlertTitle>Orders unavailable</h4>
          <p hlmAlertDescription>{{ error() }}</p>
        </hlm-alert>
      } @else if (orders().length === 0) {
        <div class="surface mt-8 p-12 text-center">
          <p class="text-lg font-medium">No open orders</p>
          <p class="mt-2 text-sm text-stone-500">Choose a free table to begin an order.</p>
          <a hlmBtn class="mt-5 bg-[#17231d] text-white" routerLink="/tables">View tables</a>
        </div>
      } @else {
        <div class="mt-8 space-y-6">
          @for (order of orders(); track order.id) {
            <article class="surface overflow-hidden">
              <header
                class="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 bg-[#17231d] p-5 text-white sm:p-6"
              >
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#eca980]">
                    Order #{{ order.id }}
                  </p>
                  <h2 class="mt-1 text-2xl font-semibold">Table {{ order.tableNumber }}</h2>
                </div>
                <div class="text-right">
                  <p class="text-xs text-stone-400">Order total</p>
                  <p class="text-xl font-semibold">{{ order.totalAmount | currency: 'EUR' }}</p>
                </div>
              </header>

              <div class="grid gap-4 bg-[#f7f5f0] p-4 lg:grid-cols-2 sm:p-6">
                @if (barItems(order).length > 0) {
                  <section class="overflow-hidden rounded-2xl border border-sky-200 bg-white">
                    <header
                      class="flex items-center justify-between border-b border-sky-100 bg-sky-50 p-4"
                    >
                      <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-sky-700">
                          Bar
                        </p>
                        <h3 class="mt-1 font-semibold">Drinks</h3>
                      </div>
                      <span hlmBadge variant="outline">{{ barItems(order).length }} lines</span>
                    </header>
                    <div class="divide-y divide-stone-100 px-4">
                      @for (item of barItems(order); track item.id) {
                        <div class="flex items-center justify-between gap-4 py-4">
                          <div>
                            <p class="font-medium">{{ item.quantity }} × {{ item.menuItemName }}</p>
                            <p class="mt-1 text-xs text-stone-500">
                              {{ statusLabel(item.preparationStatus) }}
                            </p>
                          </div>
                          @if (item.preparationStatus === 'READY') {
                            <button
                              hlmBtn
                              size="sm"
                              class="bg-sky-700 text-white hover:bg-sky-800"
                              [disabled]="updatingCourse() !== null"
                              (click)="serveBarItem(order.id, item.id)"
                            >
                              Picked up · delivered
                            </button>
                          } @else if (item.preparationStatus === 'SERVED') {
                            <span class="text-xs font-semibold text-emerald-700">Delivered</span>
                          } @else {
                            <span class="text-xs text-stone-500">Bar is making it</span>
                          }
                        </div>
                      }
                    </div>
                  </section>
                }
                @for (sequence of courseSequences(order); track sequence) {
                  <section
                    class="overflow-hidden rounded-2xl border border-stone-200 bg-white"
                    [class.ring-2]="courseReady(order, sequence)"
                    [class.ring-emerald-500]="courseReady(order, sequence)"
                  >
                    <header class="flex items-center justify-between border-b border-stone-100 p-4">
                      <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-stone-400">
                          Service {{ sequence }}
                        </p>
                        <h3 class="mt-1 font-semibold">{{ courseName(order, sequence) }}</h3>
                      </div>
                      <span
                        hlmBadge
                        [variant]="courseReady(order, sequence) ? 'default' : 'outline'"
                      >
                        {{ courseStatus(order, sequence) }}
                      </span>
                    </header>

                    <div class="divide-y divide-stone-100 px-4">
                      @for (item of courseItems(order, sequence); track item.id) {
                        <div class="flex items-start justify-between gap-3 py-3.5">
                          <div>
                            <p class="font-medium">{{ item.quantity }} × {{ item.menuItemName }}</p>
                            @if (item.notes) {
                              <p class="mt-1 text-xs text-amber-800">{{ item.notes }}</p>
                            }
                          </div>
                          <span class="text-xs font-semibold text-stone-500">
                            {{ statusLabel(item.preparationStatus) }}
                          </span>
                        </div>
                      }
                    </div>

                    <footer class="border-t border-stone-100 bg-stone-50 p-4">
                      @if (courseReady(order, sequence)) {
                        <button
                          hlmBtn
                          class="w-full bg-emerald-700 text-white hover:bg-emerald-800"
                          [disabled]="updatingCourse() !== null"
                          (click)="deliverCourse(order.id, sequence)"
                        >
                          Taken to table · Mark delivered
                        </button>
                      } @else if (
                        courseServed(order, sequence) &&
                        sequenceFullyServed(order, sequence) &&
                        hasHeldCourseAfter(order, sequence)
                      ) {
                        <button
                          hlmBtn
                          class="w-full bg-[#d97845] text-white hover:bg-[#c76838]"
                          [disabled]="updatingCourse() !== null"
                          (click)="releaseNextCourse(order.id, sequence)"
                        >
                          Guests finished · Notify kitchen
                        </button>
                      } @else if (
                        courseServed(order, sequence) &&
                        !sequenceFullyServed(order, sequence) &&
                        hasHeldCourseAfter(order, sequence)
                      ) {
                        <p class="text-center text-xs text-stone-500">
                          Waiting for this service's bar drinks to be delivered
                        </p>
                      } @else if (courseServed(order, sequence)) {
                        <p class="text-center text-xs font-semibold text-emerald-700">
                          Delivered · final course
                        </p>
                      } @else if (courseHeld(order, sequence)) {
                        <p class="text-center text-xs text-stone-500">
                          Waiting for the previous course to finish
                        </p>
                      } @else {
                        <p class="text-center text-xs text-stone-500">
                          Kitchen is preparing this course
                        </p>
                      }
                    </footer>
                  </section>
                }
              </div>

              <footer
                class="flex flex-wrap justify-end gap-3 border-t border-stone-100 bg-white p-5"
              >
                <button
                  hlmBtn
                  variant="outline"
                  [disabled]="receiptLoadingId() === order.id"
                  (click)="downloadReceipt(order.id)"
                >
                  {{ receiptLoadingId() === order.id ? 'Preparing PDF...' : 'Receipt PDF' }}
                </button>
                <button
                  hlmBtn
                  variant="outline"
                  [disabled]="payingOrderId() === order.id"
                  (click)="pay(order.id)"
                >
                  {{ payingOrderId() === order.id ? 'Closing order...' : 'Pay and close table' }}
                </button>
              </footer>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class OrderLookup implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly receiptService = inject(ReceiptService);
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly updatingCourse = signal<string | null>(null);
  readonly payingOrderId = signal<number | null>(null);
  readonly receiptLoadingId = signal<number | null>(null);
  readonly paidReceipt = signal<OrderCheck | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.orderService.getOpenOrders().subscribe({
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

  courseSequences(order: Order): number[] {
    return [
      ...new Set(
        order.items
          .map((item) => item.preparationPriority)
          .filter((priority): priority is number => priority !== null),
      ),
    ].sort((a, b) => a - b);
  }

  courseItems(order: Order, sequence: number): OrderItem[] {
    return order.items.filter((item) => item.preparationPriority === sequence);
  }

  barItems(order: Order): OrderItem[] {
    return order.items.filter((item) => item.preparationPriority === null);
  }

  courseName(order: Order, sequence: number): string {
    return [
      ...new Set(this.courseItems(order, sequence).map((item) => this.courseLabel(item))),
    ].join(' + ');
  }

  courseReady(order: Order, sequence: number): boolean {
    const items = this.courseItems(order, sequence);
    return items.length > 0 && items.every((item) => item.preparationStatus === 'READY');
  }

  courseServed(order: Order, sequence: number): boolean {
    const items = this.courseItems(order, sequence);
    return items.length > 0 && items.every((item) => item.preparationStatus === 'SERVED');
  }

  courseHeld(order: Order, sequence: number): boolean {
    return this.courseItems(order, sequence).every((item) => item.preparationStatus === 'ON_HOLD');
  }

  hasHeldCourseAfter(order: Order, sequence: number): boolean {
    return order.items.some(
      (item) =>
        item.preparationPriority !== null &&
        item.preparationPriority > sequence &&
        item.preparationStatus === 'ON_HOLD',
    );
  }

  sequenceFullyServed(order: Order, sequence: number): boolean {
    const items = order.items.filter((item) => item.preparationPriority === sequence);
    return items.length > 0 && items.every((item) => item.preparationStatus === 'SERVED');
  }

  courseStatus(order: Order, sequence: number): string {
    if (this.courseReady(order, sequence)) return 'READY FOR PICKUP';
    if (this.courseServed(order, sequence)) return 'DELIVERED';
    if (this.courseHeld(order, sequence)) return 'ON HOLD';
    if (
      this.courseItems(order, sequence).some((item) => item.preparationStatus === 'IN_PREPARATION')
    )
      return 'PREPARING';
    return 'ORDERED';
  }

  statusLabel(status: OrderItem['preparationStatus']): string {
    return status.replaceAll('_', ' ');
  }

  deliverCourse(orderId: number, sequence: number): void {
    this.runCourseAction(orderId, sequence, 'deliver', () =>
      this.orderService.deliverCourse(orderId, sequence),
    );
  }

  serveBarItem(orderId: number, itemId: number): void {
    this.updatingCourse.set(`bar-${itemId}`);
    this.error.set('');
    this.orderService.serveItem(orderId, itemId).subscribe({
      next: (updated) => {
        this.replaceOrder(updated);
        this.updatingCourse.set(null);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.updatingCourse.set(null);
      },
    });
  }

  releaseNextCourse(orderId: number, sequence: number): void {
    this.runCourseAction(orderId, sequence, 'release', () =>
      this.orderService.releaseNextCourse(orderId, sequence),
    );
  }

  pay(orderId: number): void {
    this.payingOrderId.set(orderId);
    this.error.set('');
    this.orderService.payOrder(orderId).subscribe({
      next: (check) => {
        this.orders.update((orders) => orders.filter((order) => order.id !== orderId));
        this.paidReceipt.set(check);
        this.payingOrderId.set(null);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.payingOrderId.set(null);
      },
    });
  }

  downloadReceipt(orderId: number): void {
    this.receiptLoadingId.set(orderId);
    this.error.set('');
    this.orderService.getCheck(orderId).subscribe({
      next: (check) => {
        this.receiptService.download(check);
        this.receiptLoadingId.set(null);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.receiptLoadingId.set(null);
      },
    });
  }

  downloadPaidReceipt(): void {
    const receipt = this.paidReceipt();
    if (receipt) this.receiptService.download(receipt);
  }

  private runCourseAction(
    orderId: number,
    sequence: number,
    action: string,
    request: () => ReturnType<OrderService['deliverCourse']>,
  ): void {
    this.updatingCourse.set(`${orderId}-${sequence}-${action}`);
    this.error.set('');
    request().subscribe({
      next: (updated) => {
        this.replaceOrder(updated);
        this.updatingCourse.set(null);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.updatingCourse.set(null);
      },
    });
  }

  private courseLabel(item: OrderItem): string {
    const labels: Record<OrderItem['courseType'], string> = {
      ANTIPASTO: 'Starters',
      PRIMO: 'First course',
      SECONDO: 'Main course',
      STEAK: 'Steaks',
      DESSERT: 'Desserts',
      BEVERAGE: 'Drinks',
    };
    return labels[item.courseType];
  }

  private replaceOrder(updated: Order): void {
    this.orders.update((orders) =>
      orders.map((order) => (order.id === updated.id ? updated : order)),
    );
  }
}
