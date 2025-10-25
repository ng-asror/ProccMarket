import { inject, Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;

  /** Socket ulanishini boshlash */
  initSocket(token: string | null) {
    if (!token) return console.warn('Token mavjud emas, socket ulanmaydi.');
    this.socket = io(environment.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.io ulandi:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('⚠️ Aloqa uzildi:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Ulanish xatosi:', err.message);
    });
  }

  /** Event yuborish */
  emit<T>(event: string, data: T): void {
    if (!this.socket) {
      console.warn(`Socket ulanmagan: emit "${event}" ishlamadi.`);
      return;
    }
    this.socket.emit(event, data);
  }

  listen<T>(event: string): Observable<T> {
    return new Observable<T>((observer) => {
      if (!this.socket) {
        console.warn(`Socket ulanmagan: "${event}" ni tinglab bo‘lmaydi.`);
        return;
      }
      const listener = (data: T) => observer.next(data);
      this.socket.on(event, listener);
    });
  }
}
