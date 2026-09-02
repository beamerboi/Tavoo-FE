import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  AddOrderItemRequest,
  CreateOrderRequest,
  Order,
  OrderCheck,
  UpdateOrderItemRequest,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  createOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${API_BASE_URL}/api/orders`, request);
  }

  getOpenOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${API_BASE_URL}/api/orders`);
  }

  addItem(orderId: number, request: AddOrderItemRequest): Observable<Order> {
    return this.http.put<Order>(`${API_BASE_URL}/api/orders/${orderId}/items`, request);
  }

  getOrder(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${API_BASE_URL}/api/orders/${orderId}`);
  }

  getCheck(orderId: number): Observable<OrderCheck> {
    return this.http.get<OrderCheck>(`${API_BASE_URL}/api/orders/${orderId}/check`);
  }

  updateItem(orderId: number, itemId: number, request: UpdateOrderItemRequest): Observable<Order> {
    return this.http.patch<Order>(`${API_BASE_URL}/api/orders/${orderId}/items/${itemId}`, request);
  }

  removeItem(orderId: number, itemId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/orders/${orderId}/items/${itemId}`);
  }

  serveItem(orderId: number, itemId: number): Observable<Order> {
    return this.http.post<Order>(
      `${API_BASE_URL}/api/orders/${orderId}/items/${itemId}/serve`,
      null,
    );
  }

  deliverCourse(orderId: number, preparationPriority: number): Observable<Order> {
    return this.http.post<Order>(
      `${API_BASE_URL}/api/orders/${orderId}/courses/${preparationPriority}/delivered`,
      null,
    );
  }

  releaseNextCourse(orderId: number, completedPriority: number): Observable<Order> {
    return this.http.post<Order>(
      `${API_BASE_URL}/api/orders/${orderId}/courses/${completedPriority}/release-next`,
      null,
    );
  }

  payOrder(orderId: number): Observable<OrderCheck> {
    return this.http.post<OrderCheck>(`${API_BASE_URL}/api/orders/${orderId}/pay`, {
      paymentMethod: 'POS',
    });
  }
}
