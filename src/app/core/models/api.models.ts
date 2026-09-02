export type MenuCategory = 'FOOD' | 'DESSERT' | 'BEVERAGE' | 'ALCOHOL';
export type CourseType = 'ANTIPASTO' | 'PRIMO' | 'SECONDO' | 'STEAK' | 'DESSERT' | 'BEVERAGE';
export type TableStatus = 'FREE' | 'OCCUPIED';
export type LocationType = 'INSIDE' | 'OUTSIDE';
export type OrderStatus = 'OPEN' | 'PAID';
export type PreparationStatus = 'ON_HOLD' | 'ORDERED' | 'IN_PREPARATION' | 'READY' | 'SERVED';
export type UserRole = 'ADMIN' | 'WAITER' | 'KITCHEN';

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: MenuCategory;
  courseType: CourseType;
  available: boolean;
}

export interface CreateMenuItemRequest {
  name: string;
  price: number;
  category: MenuCategory;
  courseType: CourseType;
  available: boolean;
}

export interface RestaurantTable {
  id: number;
  tableNumber: number;
  seatCount: number;
  location: RestaurantLocation;
  status: TableStatus;
}

export interface CreateRestaurantTableRequest {
  tableNumber: number;
  seatCount: number;
  locationId: number;
}

export interface RestaurantLocation {
  id: number;
  name: string;
  type: LocationType;
}

export interface CreateLocationRequest {
  name: string;
  type: LocationType;
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string;
  unitPrice: number;
  category: MenuCategory;
  courseType: CourseType;
  preparationPriority: number | null;
  quantity: number;
  notes: string | null;
  preparationStatus: PreparationStatus;
}

export interface Order {
  id: number;
  tableId: number;
  tableNumber: number;
  waiterId: number;
  waiterUsername: string;
  status: OrderStatus;
  totalAmount: number;
  copertoCount?: number;
  copertoUnitPrice?: number;
  copertoTotal?: number;
  items: OrderItem[];
}

export interface CreateOrderRequest {
  tableId: number;
  copertoCount: number;
  items: AddOrderItemRequest[];
}

export interface AddOrderItemRequest {
  menuItemId: number;
  quantity: number;
  notes: string;
  preparationPriority?: number;
  serveFirst: boolean;
}

export interface UpdateOrderItemRequest {
  quantity: number;
  notes: string;
}

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  rememberMe: boolean;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface UpdatePreparationStatusRequest {
  status: Extract<PreparationStatus, 'IN_PREPARATION' | 'READY'>;
}

export type PaymentMethod = 'POS' | 'CHECK';

export interface CheckLine {
  orderItemId: number;
  menuItemId: number;
  menuItemName: string;
  category: MenuCategory;
  courseType: CourseType;
  preparationPriority: number | null;
  quantity: number;
  unitPrice: number;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface OrderCheck {
  orderId: number;
  status: OrderStatus;
  tableId: number;
  tableNumber: number;
  waiterId: number;
  waiterUsername: string;
  generatedAt: string;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
  subtotal: number;
  taxAmount: number;
  copertoCount: number;
  copertoUnitPrice: number;
  copertoTotal: number;
  totalAmount: number;
  items: CheckLine[];
}

export interface BackendErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  validationErrors?: Record<string, string> | string[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly validationErrors?: BackendErrorBody['validationErrors'],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
