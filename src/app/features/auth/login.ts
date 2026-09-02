import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    HlmAlertImports,
    HlmButtonImports,
    HlmCheckboxImports,
    HlmInputImports,
    HlmSpinnerImports,
  ],
  template: `
    <main class="grid min-h-screen bg-[#f7f5f0] lg:grid-cols-[0.9fr_1.1fr]">
      <section class="flex items-center justify-center p-5 sm:p-10">
        <div class="w-full max-w-md">
          <div class="mb-9 flex items-center gap-3">
            <span
              class="grid size-12 place-items-center rounded-2xl bg-[#d97845] text-xl font-bold text-white"
              >T</span
            >
            <div>
              <p class="text-2xl font-semibold tracking-tight">Tavoo</p>
            </div>
          </div>

          <p class="page-kicker">Staff access</p>
          <h1 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Sign in to your workspace
          </h1>
          <p class="mt-3 text-sm leading-6 text-stone-500">
            Use the username and password assigned by your administrator.
          </p>

          <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div>
              <label for="username" class="mb-2 block text-sm font-medium">Username</label>
              <input
                hlmInput
                id="username"
                autocomplete="username"
                formControlName="username"
                class="min-h-12 w-full bg-white"
                autofocus
              />
              @if (form.controls.username.touched && form.controls.username.invalid) {
                <p class="mt-1.5 text-sm text-red-700">Username is required.</p>
              }
            </div>
            <div>
              <label for="password" class="mb-2 block text-sm font-medium">Password</label>
              <input
                hlmInput
                id="password"
                type="password"
                autocomplete="current-password"
                formControlName="password"
                class="min-h-12 w-full bg-white"
              />
              @if (form.controls.password.touched && form.controls.password.invalid) {
                <p class="mt-1.5 text-sm text-red-700">Password is required.</p>
              }
            </div>

            <label
              for="remember-me"
              class="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-2.5"
            >
              <hlm-checkbox
                inputId="remember-me"
                formControlName="rememberMe"
                aria-label="Remember me"
              />
              <span>
                <span class="block text-sm font-medium text-stone-800">Remember me</span>
                <span class="block text-xs text-stone-500">Keep me signed in on this device.</span>
              </span>
            </label>

            @if (error()) {
              <hlm-alert variant="destructive">
                <h4 hlmAlertTitle>Sign-in failed</h4>
                <p hlmAlertDescription>{{ error() }}</p>
              </hlm-alert>
            }

            <button
              hlmBtn
              type="submit"
              size="lg"
              class="min-h-12 w-full bg-[#17231d] text-white hover:bg-[#24352d]"
              [disabled]="submitting()"
            >
              @if (submitting()) {
                <hlm-spinner class="mr-2" />
              }
              {{ submitting() ? 'Signing in...' : 'Sign in' }}
            </button>
          </form>
        </div>
      </section>

      <aside class="relative hidden overflow-hidden bg-[#17231d] lg:block" aria-hidden="true">
        <img
          src="/login-wallpaper.jpg"
          alt=""
          class="absolute inset-0 size-full object-cover object-[center_48%]"
        />
        <div
          class="absolute inset-0 bg-gradient-to-r from-[#17231d]/20 via-transparent to-black/5"
        ></div>
      </aside>
    </main>
  `,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: false,
  });
  readonly submitting = signal(false);
  readonly error = signal('');

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    this.auth.login(value.username.trim(), value.password, value.rememberMe).subscribe({
      next: (user) => {
        this.submitting.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const destination = returnUrl?.startsWith('/')
          ? returnUrl
          : this.auth.landingRoute(user.role);
        void this.router.navigateByUrl(destination);
      },
      error: () => {
        this.error.set('Check your username and password and try again.');
        this.submitting.set(false);
      },
    });
  }
}
