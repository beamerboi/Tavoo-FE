import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { CreateMenuItemRequest, MenuItem } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);

  getMenu(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${API_BASE_URL}/api/menu`);
  }

  createMenuItem(request: CreateMenuItemRequest): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${API_BASE_URL}/api/menu`, request);
  }
}
