import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { CreateRestaurantTableRequest, RestaurantTable } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly http = inject(HttpClient);

  getTables(): Observable<RestaurantTable[]> {
    return this.http.get<RestaurantTable[]>(`${API_BASE_URL}/api/tables`);
  }

  createTable(request: CreateRestaurantTableRequest): Observable<RestaurantTable> {
    return this.http.post<RestaurantTable>(`${API_BASE_URL}/api/tables`, request);
  }
}
