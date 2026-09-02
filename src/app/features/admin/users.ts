import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { AuthUser, UserRole } from '../../core/models/api.models';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-users',
  imports: [
    ReactiveFormsModule,
    HlmAlertImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputImports,
    HlmNativeSelectImports,
    HlmSpinnerImports,
    HlmTableImports,
  ],
  template: `
    <section>
      <p class="page-kicker">Administration</p>
      <h1 class="page-title">Staff accounts</h1>
      <p class="page-description">Create role-specific accounts and review who can access Tavoo.</p>

      <div class="mt-8 grid items-start gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <form class="surface p-6" [formGroup]="form" (ngSubmit)="createUser()" novalidate>
          <h2 class="text-xl font-semibold">Create user</h2>
          <div class="mt-6 space-y-5">
            <div>
              <label for="new-username" class="mb-2 block text-sm font-medium">Username</label>
              <input
                hlmInput
                id="new-username"
                formControlName="username"
                maxlength="100"
                class="min-h-11 w-full"
                autocomplete="off"
              />
            </div>
            <div>
              <label for="new-password" class="mb-2 block text-sm font-medium"
                >Temporary password</label
              >
              <input
                hlmInput
                id="new-password"
                type="password"
                formControlName="password"
                minlength="8"
                maxlength="100"
                class="min-h-11 w-full"
                autocomplete="new-password"
              />
              <p class="mt-1.5 text-xs text-stone-400">At least 8 characters.</p>
            </div>
            <div>
              <label for="new-role" class="mb-2 block text-sm font-medium">Role</label>
              <select
                hlmNativeSelect
                id="new-role"
                formControlName="role"
                class="min-h-11 w-full bg-white"
              >
                @for (role of roles; track role) {
                  <option [value]="role">{{ role }}</option>
                }
              </select>
            </div>
          </div>
          @if (error()) {
            <hlm-alert variant="destructive" class="mt-5"
              ><h4 hlmAlertTitle>Could not create user</h4>
              <p hlmAlertDescription>{{ error() }}</p></hlm-alert
            >
          }
          @if (created(); as user) {
            <hlm-alert class="mt-5 border-emerald-200 bg-emerald-50"
              ><h4 hlmAlertTitle>{{ user.username }} created</h4>
              <p hlmAlertDescription>{{ user.role }} access is active.</p></hlm-alert
            >
          }
          <button
            hlmBtn
            type="submit"
            class="mt-6 min-h-11 w-full bg-[#17231d] text-white"
            [disabled]="submitting()"
          >
            {{ submitting() ? 'Creating...' : 'Create account' }}
          </button>
        </form>

        <section class="surface overflow-hidden" aria-labelledby="users-title">
          <header class="flex items-center justify-between border-b border-stone-100 p-6">
            <div>
              <p class="page-kicker">Directory</p>
              <h2 id="users-title" class="mt-1 text-xl font-semibold">Users</h2>
            </div>
            <button hlmBtn variant="outline" size="sm" (click)="load()">Refresh</button>
          </header>
          @if (loading()) {
            <div class="flex min-h-48 items-center justify-center gap-3 text-stone-500">
              <hlm-spinner /> Loading users...
            </div>
          } @else if (loadError()) {
            <div class="p-6">
              <hlm-alert variant="destructive"
                ><h4 hlmAlertTitle>Could not load users</h4>
                <p hlmAlertDescription>{{ loadError() }}</p></hlm-alert
              >
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>Username</th>
                    <th hlmTh>Role</th>
                    <th hlmTh class="text-right">ID</th>
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (user of users(); track user.id) {
                    <tr hlmTr>
                      <td hlmTd class="font-medium">{{ user.username }}</td>
                      <td hlmTd>
                        <span hlmBadge variant="outline">{{ user.role }}</span>
                      </td>
                      <td hlmTd class="text-right text-stone-400">#{{ user.id }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      </div>
    </section>
  `,
})
export class Users implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  readonly roles: UserRole[] = ['ADMIN', 'WAITER', 'KITCHEN'];
  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    role: this.fb.nonNullable.control<UserRole>('WAITER', Validators.required),
  });
  readonly users = signal<AuthUser[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly loadError = signal('');
  readonly created = signal<AuthUser | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.loadError.set(error.message);
        this.loading.set(false);
      },
    });
  }

  createUser(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.error.set('');
    this.created.set(null);
    this.userService.createUser(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.created.set(user);
        this.users.update((users) => [...users, user]);
        this.submitting.set(false);
        this.form.reset({ username: '', password: '', role: 'WAITER' });
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.submitting.set(false);
      },
    });
  }
}
