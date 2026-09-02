import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink, HlmButtonImports],
  template: `
    <section class="surface mx-auto mt-12 max-w-xl p-8 text-center sm:p-12">
      <span
        class="mx-auto grid size-14 place-items-center rounded-full bg-red-100 text-2xl text-red-700"
        >!</span
      >
      <p class="page-kicker mt-6">Access denied</p>
      <h1 class="mt-2 text-3xl font-semibold">This workspace is not available to your role.</h1>
      <p class="mt-3 text-sm leading-6 text-stone-500">
        Signed in as {{ auth.user()?.username }} ({{ auth.user()?.role }}). The API would return 403
        for this action.
      </p>
      <a hlmBtn class="mt-7 bg-[#17231d] text-white" [routerLink]="auth.landingRoute()"
        >Return to my workspace</a
      >
    </section>
  `,
})
export class Forbidden {
  readonly auth = inject(AuthService);
}
