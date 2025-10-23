import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class Order {
  private http = inject(HttpClient);

  order_list(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/chat/conversations/${id}/orders`);
  }
}
