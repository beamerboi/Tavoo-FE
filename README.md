# Tavoo frontend

Tavoo is an Angular 21 application for restaurant point-of-sale operations. It connects to the Tavoo Spring Boot API and provides workspaces for administrators, waiters, and kitchen staff to manage tables, menus, orders, preparation, and payments.

The frontend uses standalone Angular components, TypeScript, Tailwind CSS 4, Spartan UI, and jsPDF for receipt downloads.

## Prerequisites

- **Node.js** compatible with the locked Angular toolchain: `^20.19.0 || ^22.12.0 || >=24.0.0`.
- **npm 10.9.2**, the package manager version declared in `package.json`.
- **Tavoo backend** running locally, with its database configured and a staff account available for sign-in.

Check your installed versions:

```bash
node --version
npm --version
```

The Angular CLI is installed with the project dependencies; a global installation is unnecessary.

## Local setup

### 1. Start the backend

Set up the Tavoo Spring Boot backend and its database using the backend project's instructions. Start the API at:

```text
http://localhost:8080
```

This repository contains the frontend only. Staff credentials and initial restaurant data must be provisioned by the backend. If the API uses a different address, update the `target` in [proxy.conf.json](proxy.conf.json) before starting the frontend.

### 2. Install dependencies

After cloning or downloading this repository, open a terminal in its root directory and run:

```bash
npm ci
```

This installs the dependency versions recorded in `package-lock.json`.

### 3. Start the frontend

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200). The development server rebuilds when source files change. Stop it with `Ctrl+C`.

The default development configuration is ready to use without a `.env` file. Browser requests to `/api` are forwarded through the Angular development server to `http://localhost:8080` using `proxy.conf.json`.

### 4. Sign in

Use a staff username and password configured in the backend. The frontend does not define default credentials or provide public registration.

| Role      | Available workflows                                                   |
| --------- | --------------------------------------------------------------------- |
| `ADMIN`   | Dashboard, tables, menu, kitchen, menu management, and staff accounts |
| `WAITER`  | Dashboard, tables, menu, order creation, serving, and payment         |
| `KITCHEN` | Kitchen preparation board                                             |

Kitchen staff land on `/kitchen`; administrators and waiters land on `/dashboard`. An administrator can create additional staff accounts at `/admin/users`.

## Commands

Run these commands from the repository root:

| Command                     | Purpose                                                      |
| --------------------------- | ------------------------------------------------------------ |
| `npm start`                 | Start the development server on port 4200 with the API proxy |
| `npm start -- --port 4300`  | Start the development server on a different port             |
| `npm run build`             | Create a production build                                    |
| `npm run watch`             | Rebuild development output when files change                 |
| `npm test -- --watch`       | Run unit tests and rerun them when files change              |
| `npm test -- --watch=false` | Run unit tests once and exit                                 |

Unit tests use Vitest and jsdom. `npm run watch` writes build output; use `npm start` to serve the application in a browser.

## API configuration

| Configuration            | File                                                                      | Default                                   |
| ------------------------ | ------------------------------------------------------------------------- | ----------------------------------------- |
| Development API base URL | [environment.development.ts](src/environments/environment.development.ts) | `''`, so requests use the frontend origin |
| Development proxy target | [proxy.conf.json](proxy.conf.json)                                        | `http://localhost:8080`                   |
| Production API base URL  | [environment.ts](src/environments/environment.ts)                         | `http://localhost:8080`                   |

API services append paths such as `/api/auth/login` to `apiBaseUrl`. Set it to an origin such as `https://api.example.com`, without a trailing slash or `/api` suffix. Use `''` when a reverse proxy serves the API under `/api` on the frontend's origin.

These environment values are selected at build time through [angular.json](angular.json). Restart the development server after changing the proxy, and rebuild production assets after changing the production API URL.

## Production build and hosting

1. Set `apiBaseUrl` in [src/environments/environment.ts](src/environments/environment.ts) to your deployed API origin, or use `''` for a same-origin reverse proxy. The checked-in `localhost` address refers to the machine running the browser.
2. Build the application:

   ```bash
   npm run build
   ```

3. Serve the contents of `dist/tavoo-frontend/browser/` with a static web server.
4. Configure the server to fall back to `index.html` for frontend routes such as `/dashboard` and `/kitchen`, so direct links and page refreshes work.
5. Configure API routing separately: route `/api` to the backend when using a same-origin proxy, or configure backend CORS for the frontend origin when using a separate API origin. Keep `/api` requests out of the frontend's `index.html` fallback.

The Angular development proxy is not included in the production build. Use HTTPS for both the frontend and API in a deployed environment.

## Troubleshooting

| Problem                                                                      | What to check                                                                                                                                                    |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Installation reports an unsupported Node.js version                          | Check `node --version` against the prerequisite range, switch to a compatible version, and rerun `npm ci`.                                                       |
| PowerShell refuses to run `npm.ps1`                                          | Use `npm.cmd` in place of `npm`, for example `npm.cmd ci` and `npm.cmd start`.                                                                                   |
| Port 4200 is already in use                                                  | Run `npm start -- --port 4300` and open `http://localhost:4300`.                                                                                                 |
| API requests fail or the development server reports a proxy connection error | Confirm the backend is running at the address in `proxy.conf.json`, then restart `npm start` after any proxy changes.                                            |
| Sign-in fails                                                                | Check the browser's network panel for `/api/auth/login` and `/api/auth/me`, confirm the backend is reachable, and verify the account credentials in the backend. |
| A page redirects to `/forbidden`                                             | Confirm the signed-in account has the role required for that workflow.                                                                                           |
| A deployed page returns 404 when refreshed                                   | Configure the static server's frontend route fallback to `index.html`.                                                                                           |
| A deployed app calls `localhost:8080`                                        | Update the production `apiBaseUrl`, rebuild, and deploy the new output.                                                                                          |

## Project structure

| Path                    | Contents                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `src/app/core/`         | API services, authentication, route guards, interceptors, and data contracts           |
| `src/app/features/`     | Pages for authentication, dashboard, tables, menu, orders, kitchen, and administration |
| `src/app/shared/`       | Application shell and reusable UI components                                           |
| `src/app/app.routes.ts` | Routes and allowed roles                                                               |
| `src/environments/`     | Development and production API settings                                                |
| `public/`               | Static assets copied into the build                                                    |
| `angular.json`          | Build, development server, and test configuration                                      |
