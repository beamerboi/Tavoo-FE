import { CdkDrag, CdkDragEnd, CdkDragHandle } from '@angular/cdk/drag-drop';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { LocationType, RestaurantLocation, RestaurantTable } from '../../core/models/api.models';
import { LocationService } from '../../core/services/location.service';
import { AuthService } from '../../core/services/auth.service';
import { TableService } from '../../core/services/table.service';

interface TablePosition {
  x: number;
  y: number;
}

@Component({
  selector: 'app-tables',
  imports: [
    CdkDrag,
    CdkDragHandle,
    RouterLink,
    ReactiveFormsModule,
    HlmAlertImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputImports,
    HlmNativeSelectImports,
    HlmSpinnerImports,
  ],
  styles: `
    .floor-map {
      background-color: #f3f0e9;
      background-image:
        linear-gradient(rgb(120 113 108 / 7%) 1px, transparent 1px),
        linear-gradient(90deg, rgb(120 113 108 / 7%) 1px, transparent 1px);
      background-size: 24px 24px;
    }
    .floor-map.outside-map {
      background-color: #eef1e8;
      background-image: radial-gradient(rgb(83 106 76 / 14%) 1px, transparent 1px);
      background-size: 18px 18px;
    }
    .map-table.cdk-drag-preview {
      filter: drop-shadow(0 18px 18px rgb(41 37 36 / 24%));
    }
    .map-table.cdk-drag-dragging {
      cursor: grabbing;
    }
    .chair {
      box-shadow: 0 1px 2px rgb(41 37 36 / 12%);
    }
  `,
  template: `
    <section>
      <div class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p class="page-kicker">Floor plan</p>
          <h1 class="page-title">Tables</h1>
          <p class="page-description">
            Arrange indoor and outdoor seating as a floor plan. Drag tables to match the real room.
          </p>
        </div>
        <div class="flex gap-2">
          <button hlmBtn variant="outline" type="button" (click)="load()" [disabled]="loading()">
            Refresh
          </button>
          @if (auth.hasAnyRole(['ADMIN'])) {
            <button
              hlmBtn
              type="button"
              class="bg-[#d97845] text-white hover:bg-[#c76838]"
              (click)="openLocationCreate()"
            >
              + Add location
            </button>
          }
        </div>
      </div>

      <div
        class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs font-medium text-stone-600"
      >
        <span class="flex items-center gap-2"
          ><span class="size-2.5 rounded-full bg-emerald-500"></span>Free</span
        >
        <span class="flex items-center gap-2"
          ><span class="size-2.5 rounded-full bg-red-600"></span>Occupied - active order</span
        >
        <span class="ml-auto text-stone-400">Drag tables anywhere inside their room</span>
      </div>

      @if (showCreateForm()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-[2px]"
          (click)="closeCreate()"
          role="presentation"
        >
          <form
            class="surface max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto"
            [formGroup]="createForm"
            (ngSubmit)="createTable()"
            (click)="$event.stopPropagation()"
            (keydown.escape)="closeCreate()"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-table-title"
            novalidate
          >
            <div class="sticky top-0 z-10 border-b border-stone-100 bg-stone-50 px-5 py-4 sm:px-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="page-kicker">
                    {{ selectedLocation()?.name ?? 'Location' }}
                  </p>
                  <h2 id="add-table-title" class="mt-1 text-xl font-semibold">Add a table</h2>
                </div>
                <button
                  hlmBtn
                  variant="ghost"
                  size="sm"
                  type="button"
                  (click)="closeCreate()"
                  aria-label="Close add table dialog"
                >
                  Close
                </button>
              </div>
            </div>

            <div class="p-5 sm:p-6">
              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label for="table-number" class="mb-2 block text-sm font-medium"
                    >Table number</label
                  >
                  <input
                    hlmInput
                    id="table-number"
                    type="number"
                    min="1"
                    step="1"
                    formControlName="tableNumber"
                    class="min-h-11 w-full"
                    placeholder="e.g. 12"
                    autofocus
                  />
                  @if (
                    createForm.controls.tableNumber.touched &&
                    createForm.controls.tableNumber.invalid
                  ) {
                    <p class="mt-1.5 text-sm text-red-700">Enter a table number of 1 or more.</p>
                  }
                </div>
                <div>
                  <label for="seat-count" class="mb-2 block text-sm font-medium"
                    >Number of seats</label
                  >
                  <input
                    hlmInput
                    id="seat-count"
                    type="number"
                    min="1"
                    step="1"
                    formControlName="seatCount"
                    class="min-h-11 w-full"
                    placeholder="e.g. 4"
                  />
                  @if (
                    createForm.controls.seatCount.touched && createForm.controls.seatCount.invalid
                  ) {
                    <p class="mt-1.5 text-sm text-red-700">
                      Every table must have at least one seat.
                    </p>
                  }
                </div>
                <div>
                  <label for="location" class="mb-2 block text-sm font-medium">Location</label>
                  <select
                    hlmNativeSelect
                    id="location"
                    formControlName="locationId"
                    class="min-h-11 w-full bg-white"
                  >
                    @for (location of locations(); track location.id) {
                      <option [ngValue]="location.id">
                        {{ location.name }} ({{ location.type.toLowerCase() }})
                      </option>
                    }
                  </select>
                </div>
              </div>

              @if (createError()) {
                <hlm-alert variant="destructive" class="mt-5">
                  <h4 hlmAlertTitle>Could not add table</h4>
                  <p hlmAlertDescription>{{ createError() }}</p>
                </hlm-alert>
              }
              @if (createdTable(); as created) {
                <hlm-alert class="mt-5 border-emerald-200 bg-emerald-50">
                  <h4 hlmAlertTitle>Table {{ created.tableNumber }} added</h4>
                  <p hlmAlertDescription>
                    {{ created.seatCount }} seats in {{ created.location.name }}.
                  </p>
                </hlm-alert>
              }

              <div class="mt-6 flex justify-end gap-3">
                <button hlmBtn variant="outline" type="button" (click)="closeCreate()">
                  Cancel
                </button>
                <button
                  hlmBtn
                  type="submit"
                  class="min-h-11 bg-[#17231d] text-white"
                  [disabled]="creating()"
                >
                  {{ creating() ? 'Adding table...' : 'Add table' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      }

      @if (showLocationForm()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-[2px]"
          (click)="closeLocationCreate()"
          role="presentation"
        >
          <form
            class="surface w-full max-w-lg overflow-hidden"
            [formGroup]="locationForm"
            (ngSubmit)="createLocation()"
            (click)="$event.stopPropagation()"
            (keydown.escape)="closeLocationCreate()"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-location-title"
            novalidate
          >
            <div class="border-b border-stone-100 bg-stone-50 px-5 py-4 sm:px-6">
              <p class="page-kicker">Floor plan</p>
              <h2 id="add-location-title" class="mt-1 text-xl font-semibold">Create a location</h2>
              <p class="mt-1 text-sm text-stone-500">
                Create the room first, then place tables inside it.
              </p>
            </div>
            <div class="space-y-5 p-5 sm:p-6">
              <div>
                <label for="location-name" class="mb-2 block text-sm font-medium"
                  >Location name</label
                >
                <input
                  hlmInput
                  id="location-name"
                  formControlName="name"
                  maxlength="100"
                  class="min-h-11 w-full"
                  placeholder="e.g. Main hall"
                  autofocus
                />
                @if (locationForm.controls.name.touched && locationForm.controls.name.invalid) {
                  <p class="mt-1.5 text-sm text-red-700">Enter a location name.</p>
                }
              </div>
              <div>
                <label for="location-type" class="mb-2 block text-sm font-medium"
                  >Location type</label
                >
                <select
                  hlmNativeSelect
                  id="location-type"
                  formControlName="type"
                  class="min-h-11 w-full bg-white"
                >
                  <option value="INSIDE">Inside</option>
                  <option value="OUTSIDE">Outside</option>
                </select>
              </div>
              @if (locationError()) {
                <hlm-alert variant="destructive">
                  <h4 hlmAlertTitle>Could not create location</h4>
                  <p hlmAlertDescription>{{ locationError() }}</p>
                </hlm-alert>
              }
              <div class="flex justify-end gap-3">
                <button hlmBtn variant="outline" type="button" (click)="closeLocationCreate()">
                  Cancel
                </button>
                <button
                  hlmBtn
                  type="submit"
                  class="min-h-11 bg-[#17231d] text-white"
                  [disabled]="creatingLocation()"
                >
                  {{ creatingLocation() ? 'Creating...' : 'Create location' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      }

      @if (createdLocation(); as location) {
        <hlm-alert class="mt-6 border-emerald-200 bg-emerald-50">
          <h4 hlmAlertTitle>{{ location.name }} created</h4>
          <p hlmAlertDescription>You can now add tables to this location.</p>
        </hlm-alert>
      }

      @if (loading()) {
        <div class="surface mt-8 flex min-h-64 items-center justify-center gap-3 text-stone-500">
          <hlm-spinner /> Loading tables...
        </div>
      } @else if (error()) {
        <hlm-alert variant="destructive" class="mt-8">
          <h4 hlmAlertTitle>Could not load tables</h4>
          <p hlmAlertDescription>{{ error() }}</p>
        </hlm-alert>
      } @else if (locations().length === 0) {
        <div class="surface mt-8 grid min-h-80 place-items-center p-8 text-center">
          <div>
            <p class="page-kicker">Start your floor plan</p>
            <h2 class="mt-2 text-2xl font-semibold">Create your first location</h2>
            <p class="mt-2 text-sm text-stone-500">
              A location can be an inside room or an outside area.
            </p>
            @if (auth.hasAnyRole(['ADMIN'])) {
              <button
                hlmBtn
                type="button"
                class="mt-6 bg-[#d97845] text-white hover:bg-[#c76838]"
                (click)="openLocationCreate()"
              >
                + Add location
              </button>
            } @else {
              <p class="mt-4 text-sm text-stone-400">
                Ask an administrator to configure a location.
              </p>
            }
          </div>
        </div>
      } @else {
        <div class="mt-8 grid items-start gap-6 2xl:grid-cols-2">
          @for (location of locations(); track location.id) {
            <section
              class="surface overflow-hidden"
              [attr.aria-labelledby]="'location-' + location.id + '-tables-heading'"
            >
              <div
                class="flex items-start justify-between gap-4 border-b border-stone-100 px-5 py-5 sm:px-6"
              >
                <div>
                  <div class="flex items-center gap-3">
                    <h2
                      [id]="'location-' + location.id + '-tables-heading'"
                      class="text-xl font-semibold"
                    >
                      {{ location.name }}
                    </h2>
                    <span hlmBadge variant="outline"
                      >{{ tablesFor(location.id).length }} tables</span
                    >
                  </div>
                  <p class="mt-1 text-sm text-stone-500">
                    {{ location.type === 'INSIDE' ? 'Indoor room' : 'Outdoor area' }} &middot;
                    {{ seatTotal(location.id) }} seats
                  </p>
                </div>
                @if (auth.hasAnyRole(['ADMIN'])) {
                  <button
                    hlmBtn
                    variant="outline"
                    size="sm"
                    type="button"
                    (click)="openCreate(location.id)"
                    [attr.aria-label]="'Add table to ' + location.name"
                  >
                    + Add
                  </button>
                }
              </div>

              <div class="overflow-x-auto bg-stone-100/70 p-3 sm:p-5">
                <div
                  class="floor-map relative min-w-[620px] overflow-hidden rounded-xl border-[3px] border-stone-400 shadow-inner"
                  [style.height.px]="mapHeight(location.id)"
                  [class.outside-map]="location.type === 'OUTSIDE'"
                  [attr.aria-label]="location.name + ' floor map'"
                >
                  <div
                    class="absolute inset-x-0 top-0 flex h-12 items-center justify-between border-b-2 border-stone-300 bg-white/65 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500"
                  >
                    <span>{{ location.name }}</span>
                    <span
                      >{{ tablesFor(location.id).length }} tables &middot;
                      {{ seatTotal(location.id) }} seats</span
                    >
                  </div>

                  @if (location.type === 'INSIDE') {
                    <div
                      class="absolute right-0 top-12 h-20 w-40 rounded-bl-xl border-b-2 border-l-2 border-stone-300 bg-[#d9d0bf]/70 p-3 text-center text-[10px] font-bold uppercase tracking-widest text-stone-500"
                    >
                      Service counter
                    </div>
                    <div
                      class="absolute -bottom-1 left-1/2 h-5 w-28 -translate-x-1/2 border-x-2 border-stone-400 bg-[#f3f0e9] text-center text-[9px] font-bold uppercase tracking-widest text-stone-500"
                    >
                      Entrance
                    </div>
                    <div
                      class="absolute left-0 top-28 h-40 w-2 rounded-r-full bg-sky-200/80"
                      title="Windows"
                    ></div>
                  } @else {
                    <div
                      class="absolute inset-x-16 bottom-3 h-7 rounded-full border border-emerald-700/15 bg-emerald-700/10 text-center text-[9px] font-bold uppercase leading-7 tracking-widest text-emerald-900/50"
                    >
                      Garden edge
                    </div>
                    <div
                      class="absolute right-5 top-16 size-14 rounded-full border-4 border-emerald-800/20 bg-emerald-700/15"
                    ></div>
                    <div
                      class="absolute left-6 top-20 size-10 rounded-full border-4 border-emerald-800/20 bg-emerald-700/15"
                    ></div>
                  }
                  @for (table of tablesFor(location.id); track table.id) {
                    <article
                      cdkDrag
                      cdkDragBoundary=".floor-map"
                      class="map-table absolute left-5 top-14 z-10 h-32 w-36 touch-none select-none"
                      [cdkDragFreeDragPosition]="positionFor(table)"
                      (cdkDragEnded)="dragEnded($event, table)"
                      [attr.aria-label]="
                        'Table ' +
                        table.tableNumber +
                        ', ' +
                        table.seatCount +
                        ' seats, ' +
                        table.status.toLowerCase()
                      "
                    >
                      <span
                        class="chair absolute left-5 top-2 h-3 w-8 rounded-t-md border border-stone-300 bg-stone-100"
                      ></span>
                      @if (table.seatCount > 4) {
                        <span
                          class="chair absolute right-5 top-2 h-3 w-8 rounded-t-md border border-stone-300 bg-stone-100"
                        ></span>
                      }
                      <span
                        class="chair absolute bottom-2 left-5 h-3 w-8 rounded-b-md border border-stone-300 bg-stone-100"
                      ></span>
                      @if (table.seatCount > 4) {
                        <span
                          class="chair absolute bottom-2 right-5 h-3 w-8 rounded-b-md border border-stone-300 bg-stone-100"
                        ></span>
                      }
                      <span
                        class="chair absolute left-1 top-12 h-8 w-3 rounded-l-md border border-stone-300 bg-stone-100"
                      ></span>
                      <span
                        class="chair absolute right-1 top-12 h-8 w-3 rounded-r-md border border-stone-300 bg-stone-100"
                      ></span>

                      <div
                        class="absolute inset-x-3 inset-y-4 flex flex-col items-center justify-center border-2 shadow-md"
                        [class.cursor-pointer]="
                          table.status === 'FREE' && auth.hasAnyRole(['WAITER'])
                        "
                        [routerLink]="
                          table.status === 'FREE' && auth.hasAnyRole(['WAITER'])
                            ? ['/new-order']
                            : null
                        "
                        [queryParams]="{ tableId: table.id }"
                        [attr.role]="
                          table.status === 'FREE' && auth.hasAnyRole(['WAITER']) ? 'link' : null
                        "
                        [class.rounded-full]="table.seatCount <= 4"
                        [class.rounded-2xl]="table.seatCount > 4"
                        [class.border-red-700]="table.status === 'OCCUPIED'"
                        [class.bg-red-600]="table.status === 'OCCUPIED'"
                        [class.text-white]="table.status === 'OCCUPIED'"
                        [class.border-stone-300]="table.status === 'FREE'"
                        [class.bg-white]="table.status === 'FREE'"
                      >
                        <button
                          cdkDragHandle
                          type="button"
                          class="absolute right-2 top-1 cursor-grab rounded px-1.5 text-xs opacity-60 hover:bg-black/5 active:cursor-grabbing"
                          [attr.aria-label]="'Move table ' + table.tableNumber + ' on map'"
                          title="Drag to move"
                        >
                          &#8942;&#8942;
                        </button>
                        <span class="text-[9px] font-bold uppercase tracking-[0.18em] opacity-70"
                          >Table</span
                        >
                        <strong class="text-2xl leading-7">{{ table.tableNumber }}</strong>
                        <span class="mt-0.5 text-[10px] font-semibold"
                          >{{ table.seatCount }} seats</span
                        >
                        @if (table.status === 'FREE' && auth.hasAnyRole(['WAITER'])) {
                          <span
                            class="mt-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800 hover:bg-emerald-200"
                            >Free &middot; tap to order</span
                          >
                        } @else if (table.status === 'OCCUPIED') {
                          <span
                            class="mt-1 rounded-full bg-red-800/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                            role="status"
                            >Occupied</span
                          >
                        } @else {
                          <span
                            class="mt-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800"
                            >Free</span
                          >
                        }
                      </div>
                    </article>
                  } @empty {
                    <div
                      class="absolute inset-12 grid place-items-center rounded-xl border-2 border-dashed border-stone-300 bg-white/55 text-center"
                    >
                      <div>
                        <p class="font-medium text-stone-700">
                          No tables in {{ location.name }} yet
                        </p>
                        @if (auth.hasAnyRole(['ADMIN'])) {
                          <button
                            type="button"
                            class="mt-2 text-sm font-semibold text-[#a35633] hover:underline"
                            (click)="openCreate(location.id)"
                          >
                            Add the first table
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </section>
          }
        </div>
      }
    </section>
  `,
})
export class Tables implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tableService = inject(TableService);
  private readonly locationService = inject(LocationService);
  readonly auth = inject(AuthService);
  private readonly positionsStorageKey = 'tavoo.table-map.positions';

  readonly createForm = this.fb.group({
    tableNumber: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    seatCount: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    locationId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
  });
  readonly locationForm = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    type: this.fb.nonNullable.control<LocationType>('INSIDE', Validators.required),
  });
  readonly tables = signal<RestaurantTable[]>([]);
  readonly locations = signal<RestaurantLocation[]>([]);
  readonly tablePositions = signal<Record<number, TablePosition>>(this.readPositions());
  readonly loading = signal(true);
  readonly error = signal('');
  readonly showCreateForm = signal(false);
  readonly showLocationForm = signal(false);
  readonly creating = signal(false);
  readonly creatingLocation = signal(false);
  readonly createError = signal('');
  readonly locationError = signal('');
  readonly createdTable = signal<RestaurantTable | null>(null);
  readonly createdLocation = signal<RestaurantLocation | null>(null);

  ngOnInit(): void {
    this.load();
  }

  tablesFor(locationId: number): RestaurantTable[] {
    return this.tables().filter((table) => table.location.id === locationId);
  }

  seatTotal(locationId: number): number {
    return this.tablesFor(locationId).reduce((total, table) => total + table.seatCount, 0);
  }

  mapHeight(locationId: number): number {
    return Math.max(520, 90 + Math.ceil(this.tablesFor(locationId).length / 3) * 145);
  }

  positionFor(table: RestaurantTable): TablePosition {
    return this.tablePositions()[table.id] ?? { x: 18, y: 18 };
  }

  selectedLocation(): RestaurantLocation | undefined {
    return this.locations().find(
      (location) => location.id === this.createForm.controls.locationId.value,
    );
  }

  openCreate(locationId: number): void {
    this.createError.set('');
    this.createdTable.set(null);
    this.createForm.controls.locationId.setValue(locationId);
    this.showCreateForm.set(true);
  }

  closeCreate(): void {
    this.showCreateForm.set(false);
    this.createError.set('');
    this.createdTable.set(null);
  }

  openLocationCreate(): void {
    this.locationError.set('');
    this.createdLocation.set(null);
    this.showLocationForm.set(true);
  }

  closeLocationCreate(): void {
    this.showLocationForm.set(false);
    this.locationError.set('');
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      tables: this.tableService.getTables(),
      locations: this.locationService.getLocations(),
    }).subscribe({
      next: ({ tables, locations }) => {
        this.tables.set([...tables].sort((a, b) => a.tableNumber - b.tableNumber));
        this.locations.set([...locations].sort((a, b) => a.name.localeCompare(b.name)));
        locations.forEach((location) => this.ensurePositions(this.tablesFor(location.id)));
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }

  dragEnded(event: CdkDragEnd, table: RestaurantTable): void {
    const position = event.source.getFreeDragPosition();
    this.tablePositions.update((positions) => ({ ...positions, [table.id]: position }));
    this.savePositions();
  }

  createTable(): void {
    this.createForm.markAllAsTouched();
    const value = this.createForm.getRawValue();
    if (
      this.createForm.invalid ||
      value.tableNumber === null ||
      value.seatCount === null ||
      value.locationId === null
    )
      return;

    this.creating.set(true);
    this.createError.set('');
    this.createdTable.set(null);
    this.tableService
      .createTable({
        tableNumber: value.tableNumber,
        seatCount: value.seatCount,
        locationId: value.locationId,
      })
      .subscribe({
        next: (created) => {
          this.createdTable.set(created);
          this.creating.set(false);
          const newTableIndex = this.tablesFor(created.location.id).length;
          this.tables.update((tables) => [...tables, created]);
          this.ensurePositions([created], newTableIndex);
          this.createForm.reset({
            tableNumber: null,
            seatCount: null,
            locationId: created.location.id,
          });
        },
        error: (error: Error) => {
          this.createError.set(error.message);
          this.creating.set(false);
        },
      });
  }

  createLocation(): void {
    this.locationForm.markAllAsTouched();
    if (this.locationForm.invalid) return;

    this.creatingLocation.set(true);
    this.locationError.set('');
    this.locationService.createLocation(this.locationForm.getRawValue()).subscribe({
      next: (created) => {
        this.locations.update((locations) =>
          [...locations, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
        this.createdLocation.set(created);
        this.creatingLocation.set(false);
        this.showLocationForm.set(false);
        this.locationForm.reset({ name: '', type: created.type });
        this.openCreate(created.id);
      },
      error: (error: Error) => {
        this.locationError.set(error.message);
        this.creatingLocation.set(false);
      },
    });
  }

  private ensurePositions(tables: RestaurantTable[], startingIndex = 0): void {
    const positions = { ...this.tablePositions() };
    let changed = false;
    tables.forEach((table, index) => {
      if (positions[table.id]) return;
      positions[table.id] = this.defaultPosition(startingIndex + index);
      changed = true;
    });
    if (!changed) return;
    this.tablePositions.set(positions);
    this.savePositions();
  }

  private defaultPosition(index: number): TablePosition {
    return { x: 18 + (index % 3) * 158, y: 18 + Math.floor(index / 3) * 145 };
  }

  private savePositions(): void {
    try {
      localStorage.setItem(this.positionsStorageKey, JSON.stringify(this.tablePositions()));
    } catch {
      // Moving tables still works when browser storage is unavailable.
    }
  }

  private readPositions(): Record<number, TablePosition> {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(this.positionsStorageKey) ?? '{}');
      if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
      return Object.fromEntries(
        Object.entries(value).filter((entry): entry is [string, TablePosition] => {
          const position = entry[1] as Partial<TablePosition>;
          return typeof position?.x === 'number' && typeof position?.y === 'number';
        }),
      );
    } catch {
      return {};
    }
  }
}
