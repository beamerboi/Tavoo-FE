# Tavoo frontend

Tavoo is an Angular 21 single-page application for restaurant point-of-sale operations. It is the browser client for the Tavoo Spring Boot order and billing API and provides role-specific workspaces for administrators, waiters, and kitchen staff.

## Technology stack

- Angular 21 standalone components and signals
- Angular Router with lazy-loaded feature pages
- Angular `HttpClient` and RxJS for API communication
- Reactive Forms for user input
- Tailwind CSS 4 and Spartan UI components
- jsPDF for client-side receipt generation
- Vitest and jsdom for unit tests

## Run locally

Start the backend on `http://localhost:8080`, then run:

```bash
npm install
npm start
```

Open `http://localhost:4200`. During development, `proxy.conf.json` forwards `/api` requests to the backend on port 8080.

## Quality checks

```bash
npm run build
npm run test -- --watch=false
```

## System architecture

Tavoo uses a client-server architecture. The Angular frontend owns presentation, navigation, session state, and receipt rendering. Business rules and persistent data are owned by the Spring Boot REST API.

```mermaid
flowchart LR
    Admin[Administrator]
    Waiter[Waiter]
    KitchenUser[Kitchen staff]

    subgraph Browser[Browser - Angular SPA]
        Router[Router and role guards]
        Features[Lazy-loaded feature pages]
        Core[Core application services]
        HTTP[HttpClient and interceptors]
        Storage[(Session or local storage)]
        Receipt[Receipt PDF generator]
    end

    Proxy[Development proxy]
    API[Spring Boot REST API]
    Data[(Backend persistence)]

    Admin --> Router
    Waiter --> Router
    KitchenUser --> Router
    Router --> Features
    Features --> Core
    Core --> HTTP
    Core <--> Storage
    Core --> Receipt
    HTTP -->|HTTPS in production| API
    HTTP -.->|/api in development| Proxy
    Proxy -.-> API
    API --> Data
```

### Frontend layers

| Layer                 | Location                                                        | Responsibility                                                                                                        |
| --------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Bootstrap and routing | `src/main.ts`, `src/app/app.config.ts`, `src/app/app.routes.ts` | Starts the standalone application, registers providers, and lazy-loads protected routes.                              |
| Features              | `src/app/features`                                              | Implements pages and user workflows for authentication, tables, orders, menu, kitchen, dashboard, and administration. |
| Core                  | `src/app/core`                                                  | Contains API services, route guards, HTTP interceptors, configuration, and API contracts.                             |
| Shared                | `src/app/shared`                                                | Provides the authenticated application shell and reusable presentation components.                                    |
| Environment           | `src/environments`                                              | Selects the API base URL for development and production builds.                                                       |

Dependencies point inward toward `core` contracts and services: feature pages may use `core` and `shared`, while `core` does not depend on a feature. HTTP access is kept in root-provided services rather than page components.

### Request and security flow

1. Route guards restore the current session through `AuthService` before activating a page.
2. `roleGuard` checks the route's allowed roles and redirects unauthorized users to `/forbidden`.
3. Feature components call a domain-focused service such as `OrderService` or `KitchenService`.
4. `jwtAuthInterceptor` adds the Bearer token to API calls and clears the session after an authenticated `401` response.
5. `apiErrorInterceptor` converts backend and network failures into the application's `ApiError` model.
6. The service exposes the result as an RxJS `Observable`; the component updates its local signal-based UI state.

JWT metadata is stored in `sessionStorage` by default or `localStorage` when **Remember me** is selected. The authenticated user is kept in memory and restored from `/api/auth/me`. Authorization remains enforced by the backend; frontend guards only control navigation and presentation.

## UML design

### Component diagram

The following diagram shows the main frontend components and their runtime dependencies.

```mermaid
flowchart TB
    App[App root] --> Shell[AppShell]
    App --> Router[Angular Router]
    Router --> Guards[Auth and role guards]

    Router --> AuthFeature[Auth pages]
    Router --> OpsFeatures[Dashboard, tables, and menu]
    Router --> OrderFeatures[New order and order lookup]
    Router --> KitchenFeature[Kitchen board]
    Router --> AdminFeatures[Menu and user administration]

    AuthFeature --> AuthService
    Guards --> AuthService
    Shell --> AuthService
    OpsFeatures --> AuthService
    OpsFeatures --> TableService
    OpsFeatures --> LocationService
    OpsFeatures --> MenuService
    OrderFeatures --> TableService
    OrderFeatures --> MenuService
    OrderFeatures --> OrderService
    OrderFeatures --> ReceiptService
    KitchenFeature --> KitchenService
    AdminFeatures --> MenuService
    AdminFeatures --> UserService

    AuthService --> HTTP[Angular HttpClient]
    TableService --> HTTP
    LocationService --> HTTP
    MenuService --> HTTP
    OrderService --> HTTP
    KitchenService --> HTTP
    UserService --> HTTP
    HTTP --> Interceptors[JWT and API error interceptors]
    Interceptors --> Backend[Tavoo REST API]
    ReceiptService --> PDF[jsPDF browser download]
```

### Domain class diagram

These TypeScript interfaces mirror the API resources used by the frontend.

```mermaid
classDiagram
    class AuthUser {
        +number id
        +string username
        +UserRole role
    }

    class RestaurantLocation {
        +number id
        +string name
        +LocationType type
    }

    class RestaurantTable {
        +number id
        +number tableNumber
        +number seatCount
        +TableStatus status
    }

    class MenuItem {
        +number id
        +string name
        +number price
        +MenuCategory category
        +CourseType courseType
        +boolean available
    }

    class Order {
        +number id
        +number tableId
        +number waiterId
        +OrderStatus status
        +number totalAmount
    }

    class OrderItem {
        +number id
        +number menuItemId
        +number quantity
        +string notes
        +number preparationPriority
        +PreparationStatus preparationStatus
    }

    class OrderCheck {
        +number orderId
        +datetime generatedAt
        +datetime paidAt
        +PaymentMethod paymentMethod
        +number subtotal
        +number taxAmount
        +number totalAmount
    }

    class CheckLine {
        +number orderItemId
        +number menuItemId
        +number quantity
        +number unitPrice
        +number taxAmount
        +number totalAmount
    }

    RestaurantLocation "1" o-- "0..*" RestaurantTable : contains
    RestaurantTable "1" <-- "0..*" Order : assigned to
    AuthUser "1" <-- "0..*" Order : handled by
    Order "1" *-- "1..*" OrderItem : contains
    MenuItem "1" <-- "0..*" OrderItem : references
    Order "1" --> "0..1" OrderCheck : produces
    OrderCheck "1" *-- "1..*" CheckLine : itemizes
    MenuItem "1" <-- "0..*" CheckLine : prices
```

### Order lifecycle sequence

```mermaid
sequenceDiagram
    actor W as Waiter
    participant UI as Angular order pages
    participant OS as OrderService
    participant API as Tavoo API
    actor K as Kitchen staff
    participant KS as KitchenService
    participant RS as ReceiptService

    W->>UI: Select table, covers, and menu items
    UI->>OS: createOrder(request)
    OS->>API: POST /api/orders
    API-->>OS: Open order
    OS-->>UI: Render current order

    K->>KS: Start course
    KS->>API: POST /api/kitchen/orders/{id}/courses/{priority}/start
    API-->>KS: Updated order
    K->>KS: Mark course ready
    KS->>API: POST /api/kitchen/orders/{id}/courses/{priority}/ready
    API-->>KS: Updated order

    W->>OS: Deliver course or serve item
    OS->>API: Update serving state
    API-->>OS: Updated order
    W->>OS: Pay order
    OS->>API: POST /api/orders/{id}/pay
    API-->>OS: Paid OrderCheck
    OS-->>UI: Display check
    UI->>RS: download(check)
    RS-->>W: Receipt PDF
```

## Routes and access control

| Route          | Purpose                                          | Roles              |
| -------------- | ------------------------------------------------ | ------------------ |
| `/login`       | Sign in                                          | Guest              |
| `/dashboard`   | Operational statistics                           | Admin, Waiter      |
| `/tables`      | Tables and locations                             | Admin, Waiter      |
| `/new-order`   | Create an order and assign a table               | Waiter             |
| `/menu`        | Browse available menu items                      | Admin, Waiter      |
| `/orders`      | Serve courses, generate checks, and take payment | Waiter             |
| `/kitchen`     | Start preparation and mark courses ready         | Admin, Kitchen     |
| `/admin/menu`  | Create menu items                                | Admin              |
| `/admin/users` | List and create staff accounts                   | Admin              |
| `/forbidden`   | Access-denied page                               | Authenticated user |

The empty route redirects authenticated kitchen users to `/kitchen` and other authenticated users to `/dashboard`. Unknown routes return to this role-aware entry point.

## Project structure

```text
src/
|-- app/
|   |-- core/
|   |   |-- config/          # API URL configuration
|   |   |-- guards/          # Authentication and role checks
|   |   |-- interceptors/    # JWT attachment and error normalization
|   |   |-- models/          # API request and response contracts
|   |   `-- services/        # Domain-focused API and receipt services
|   |-- features/            # Lazy-loaded workflow pages
|   |-- shared/
|   |   |-- components/      # Application shell
|   |   `-- ui/              # Reusable Spartan/Tailwind UI primitives
|   |-- app.config.ts
|   |-- app.routes.ts
|   `-- app.ts
|-- environments/            # Build-specific API configuration
`-- main.ts                  # Browser bootstrap
```

## Deployment notes and current API constraints

- Development uses the Angular proxy so browser requests can use the relative `/api` path.
- The production environment currently targets `http://localhost:8080`; a deployed system should configure the real API origin and HTTPS, or serve both applications behind a same-origin reverse proxy.
- `GET /api/menu` supplies the available menu used by the client; the current frontend does not expose update, delete, or availability-toggle operations.
- Receipts are generated entirely in the browser from the `OrderCheck` returned by the API and are not uploaded by this application.
