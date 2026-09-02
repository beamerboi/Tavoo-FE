import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideLogOut, lucideUserRound } from '@ng-icons/lucide';
import {
  HlmDropdownMenu,
  HlmDropdownMenuItem,
  HlmDropdownMenuLabel,
  HlmDropdownMenuSeparator,
  HlmDropdownMenuTrigger,
} from '@spartan-ng/helm/dropdown-menu';
import { UserRole } from '../../../core/models/api.models';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  shortLabel: string;
  icon: string;
  route: string;
  roles: UserRole[];
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgIcon,
    HlmDropdownMenu,
    HlmDropdownMenuItem,
    HlmDropdownMenuLabel,
    HlmDropdownMenuSeparator,
    HlmDropdownMenuTrigger,
  ],
  providers: [provideIcons({ lucideChevronDown, lucideLogOut, lucideUserRound })],
  template: `
    <div class="min-h-screen bg-[#f7f5f0] text-stone-900">
      <aside
        class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#17231d] text-stone-100 lg:flex"
      >
        <a
          [routerLink]="auth.landingRoute()"
          class="flex h-24 items-center gap-3 border-b border-white/10 px-7"
        >
          <span
            class="grid size-11 place-items-center rounded-2xl bg-[#d97845] text-xl font-bold text-white"
            >T</span
          >
          <span
            ><span class="block text-2xl font-semibold tracking-tight">Tavoo</span
            ><span
              class="block text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400"
              >Restaurant POS</span
            ></span
          >
        </a>

        <div class="mx-4 mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p class="text-sm font-semibold text-white">{{ auth.user()?.username }}</p>
          <p class="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#eca980]">
            {{ auth.user()?.role }}
          </p>
        </div>

        <nav aria-label="Primary navigation" class="mt-3 flex-1 space-y-1 p-4">
          @for (item of nav(); track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-white/10 text-white shadow-sm"
              class="group flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium text-stone-300 transition-colors hover:bg-white/7 hover:text-white"
            >
              <span
                class="grid size-6 place-items-center rounded-md bg-white/5 text-xs font-bold"
                aria-hidden="true"
                >{{ item.icon }}</span
              >{{ item.label }}
            </a>
          }
        </nav>
      </aside>

      <div class="lg:pl-64">
        <header
          class="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-stone-200/80 bg-[#f7f5f0]/95 px-4 backdrop-blur sm:px-7 lg:px-10"
        >
          <div class="flex items-center gap-3">
            <a
              [routerLink]="auth.landingRoute()"
              class="grid size-10 place-items-center rounded-xl bg-[#17231d] font-bold text-white lg:hidden"
              >T</a
            >
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#a35633]">
                {{ workspaceLabel() }}
              </p>
              <p class="text-sm text-stone-500">Authenticated Tavoo workspace</p>
            </div>
          </div>

          <button
            type="button"
            [hlmDropdownMenuTrigger]="accountMenu"
            align="end"
            class="flex items-center gap-2 rounded-xl p-1.5 text-left transition-colors hover:bg-stone-100"
            aria-label="Open account menu"
          >
            <span class="grid size-9 place-items-center rounded-full bg-[#17231d] text-white"
              ><ng-icon name="lucideUserRound"
            /></span>
            <span class="hidden sm:block"
              ><span class="block text-sm font-semibold leading-4 text-stone-800">{{
                auth.user()?.username
              }}</span
              ><span class="block text-xs text-stone-500">{{ auth.user()?.role }}</span></span
            >
            <ng-icon name="lucideChevronDown" class="hidden text-stone-400 sm:block" />
          </button>

          <ng-template #accountMenu>
            <hlm-dropdown-menu class="w-52" sideOffset="6">
              <hlm-dropdown-menu-label
                >{{ auth.user()?.username }} · {{ auth.user()?.role }}</hlm-dropdown-menu-label
              >
              <hlm-dropdown-menu-separator />
              <button type="button" hlmDropdownMenuItem variant="destructive" (click)="logout()">
                <ng-icon name="lucideLogOut" />Log out
              </button>
            </hlm-dropdown-menu>
          </ng-template>
        </header>

        <main
          class="mx-auto min-h-[calc(100vh-5rem)] max-w-[1600px] p-4 pb-24 sm:p-7 sm:pb-24 lg:p-10 lg:pb-10"
        >
          <ng-content />
        </main>
      </div>

      <nav
        aria-label="Mobile navigation"
        class="fixed inset-x-0 bottom-0 z-40 grid border-t border-stone-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
        [style.grid-template-columns]="'repeat(' + nav().length + ', minmax(0, 1fr))'"
      >
        @for (item of nav(); track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="text-[#a35633]"
            class="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-stone-500"
            ><span class="text-sm font-bold" aria-hidden="true">{{ item.icon }}</span
            >{{ item.shortLabel }}</a
          >
        }
      </nav>
    </div>
  `,
})
export class AppShell {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly allNav: NavItem[] = [
    {
      label: 'Dashboard',
      shortLabel: 'Home',
      icon: 'D',
      route: '/dashboard',
      roles: ['ADMIN', 'WAITER'],
    },
    {
      label: 'Tables & locations',
      shortLabel: 'Tables',
      icon: 'T',
      route: '/tables',
      roles: ['ADMIN', 'WAITER'],
    },
    { label: 'New order', shortLabel: 'New', icon: '+', route: '/new-order', roles: ['WAITER'] },
    { label: 'Menu', shortLabel: 'Menu', icon: 'M', route: '/menu', roles: ['ADMIN', 'WAITER'] },
    { label: 'My orders', shortLabel: 'Orders', icon: 'O', route: '/orders', roles: ['WAITER'] },
    {
      label: 'Kitchen board',
      shortLabel: 'Kitchen',
      icon: 'K',
      route: '/kitchen',
      roles: ['ADMIN', 'KITCHEN'],
    },
    {
      label: 'Menu management',
      shortLabel: 'Menu admin',
      icon: 'A',
      route: '/admin/menu',
      roles: ['ADMIN'],
    },
    {
      label: 'Staff accounts',
      shortLabel: 'Staff',
      icon: 'U',
      route: '/admin/users',
      roles: ['ADMIN'],
    },
  ];

  readonly nav = computed(() => {
    const role = this.auth.user()?.role;
    return role ? this.allNav.filter((item) => item.roles.includes(role)) : [];
  });
  readonly workspaceLabel = computed(() =>
    this.auth.user()?.role === 'KITCHEN'
      ? 'Kitchen workspace'
      : this.auth.user()?.role === 'ADMIN'
        ? 'Administration workspace'
        : 'Service workspace',
  );

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
