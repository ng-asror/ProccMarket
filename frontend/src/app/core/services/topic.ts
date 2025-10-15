import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ICommentsResponse, ITopicLikeDislikRes, ITopicRes, ResultData } from '../interfaces';
import { Result } from '../interfaces/result';

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private http = inject(HttpClient);

  /**
   *
   * @param section_id
   * @param title
   * @param content
   * @param image
   * @returns
   */
  create(section_id: number, title: string, content: string, image: File): Observable<ResultData> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('image', image);
    return this.http.post<ResultData>(
      `${environment.apiUrl}/topics/section/${section_id}`,
      formData
    );
  }
  /**
   *
   * @param topic_id
   * @returns
   */
  delete(topic_id: number): Observable<ResultData> {
    return this.http.delete<ResultData>(`${environment.apiUrl}/topics/${topic_id}`);
  }

  /**
   *
   * @param topic_id
   * @param title
   * @param content
   * @param image
   * @returns
   */
  update(topic_id: number, title: string, content: string, image: File | null): Observable<Result> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
    }
    return this.http.put<Result>(`${environment.apiUrl}/topics/${topic_id}`, formData);
  }
  /**
   *
   * @param topic_id
   * @returns
   */
  info(topic_id: number): Observable<ITopicRes> {
    return this.http.get<ITopicRes>(`${environment.apiUrl}/topics/${topic_id}`);
  }

  /**
   *
   * @param topic_id
   * @param is_like
   * @returns
   */
  topicLikeDislike(topic_id: number, is_like: boolean): Observable<ITopicLikeDislikRes> {
    return this.http.post<ITopicLikeDislikRes>(`${environment.apiUrl}/likes/topic/${topic_id}`, {
      is_like,
    });
  }

  comments(topic_id: string): Observable<ICommentsResponse> {
    return this.http.get<ICommentsResponse>(`${environment.apiUrl}/posts/topic/${topic_id}`);
  }

  createComment(topic_id: number, content: string, reply_id?: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/posts/topic/${topic_id}`, {
      content,
      reply_id,
    });
  }
}
