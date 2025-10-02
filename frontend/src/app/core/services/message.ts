import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class Message {
  constructor(private http: HttpClient) {}

  getAllMessage(topic_id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/posts/topic/${topic_id}`);
  }
}
