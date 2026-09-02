import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShell } from './shared/components/app-shell/app-shell';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppShell],
  template: `
    @if (auth.user()) {
      <app-shell><router-outlet /></app-shell>
    } @else {
      <router-outlet />
    }
  `,
})
export class App {
  readonly auth = inject(AuthService);
}
