import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import {
  IConversationRes,
  IConversationsRes,
  ICreateConversationRes,
  IMessage,
  IUserInfoChat,
} from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private http = inject(HttpClient);

  getConversations(page: number = 1): Observable<IConversationsRes> {
    const params = new HttpParams().set('page', page);
    return this.http.get<IConversationsRes>(`${environment.apiUrl}/chat/conversations`, { params });
  }

  createConversation(user_id: number): Observable<ICreateConversationRes> {
    return this.http.post<ICreateConversationRes>(`${environment.apiUrl}/chat/conversations`, {
      user_id,
    });
  }

  getConversation(id: number): Observable<IConversationRes> {
    // const params = new HttpParams().set('sort', sort).set('page', page);
    return this.http.get<IConversationRes>(`${environment.apiUrl}/chat/conversations/${id}`);
  }

  sendMessage(id: number, content: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/chat/conversations/${id}/messages`, {
      content,
    });
  }

  userInfo(id: number): Observable<IUserInfoChat> {
    return this.http.get<IUserInfoChat>(`${environment.apiUrl}/chat/users/${id}`);
  }

  deleteConversation(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/chat/conversations/${id}`);
  }

  isRead(message_id: number): Observable<{ data: IMessage }> {
    return this.http.post<{ data: IMessage }>(
      `${environment.apiUrl}/chat/messages/${message_id}/read`,
      { isRead: true }
    );
  }
}
