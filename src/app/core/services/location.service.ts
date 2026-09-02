import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { CreateLocationRequest, RestaurantLocation } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);

  getLocations(): Observable<RestaurantLocation[]> {
    return this.http.get<RestaurantLocation[]>(`${API_BASE_URL}/api/locations`);
  }

  createLocation(request: CreateLocationRequest): Observable<RestaurantLocation> {
    return this.http.post<RestaurantLocation>(`${API_BASE_URL}/api/locations`, request);
  }
}
