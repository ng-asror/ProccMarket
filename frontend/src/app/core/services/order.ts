import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
interface IOrderReq {
  conversation_id: number;
  title: string;
  description: string;
  amount: number;
  deadline: string;
  is_client_order: boolean;
}
@Injectable({
  providedIn: 'root',
})
export class Order {
  private http = inject(HttpClient);

  order_list(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/chat/conversations/${id}/orders`);
  }

  create_order(data: IOrderReq): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/chat/conversations/${data.conversation_id}/orders`,
      data
    );
  }
}
