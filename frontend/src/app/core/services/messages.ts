import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { IConversationsRes } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class Messages {
  private http = inject(HttpClient);

  allChats(): Observable<IConversationsRes> {
    return this.http.get<IConversationsRes>(`${environment.apiUrl}/chat/conversations`);
  }
}
