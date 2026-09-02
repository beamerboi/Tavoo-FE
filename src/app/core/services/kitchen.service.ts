import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Order, UpdatePreparationStatusRequest } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class KitchenService {
  private readonly http = inject(HttpClient);

  getOpenOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${API_BASE_URL}/api/kitchen/orders`);
  }

  updateItemStatus(
    orderId: number,
    itemId: number,
    request: UpdatePreparationStatusRequest,
  ): Observable<Order> {
    return this.http.patch<Order>(
      `${API_BASE_URL}/api/kitchen/orders/${orderId}/items/${itemId}/status`,
      request,
    );
  }

  startCourse(orderId: number, preparationPriority: number): Observable<Order> {
    return this.http.post<Order>(
      `${API_BASE_URL}/api/kitchen/orders/${orderId}/courses/${preparationPriority}/start`,
      null,
    );
  }

  markCourseReady(orderId: number, preparationPriority: number): Observable<Order> {
    return this.http.post<Order>(
      `${API_BASE_URL}/api/kitchen/orders/${orderId}/courses/${preparationPriority}/ready`,
      null,
    );
  }

  markOrderReady(orderId: number): Observable<Order> {
    return this.http.post<Order>(`${API_BASE_URL}/api/kitchen/orders/${orderId}/ready`, null);
  }
}
