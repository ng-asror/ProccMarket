import { inject, Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment.development';
import { Telegram } from './telegram';
import { Observable } from 'rxjs';
import { IMessageResSocket } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private telegram = inject(Telegram);

  /** Socket ulanishini boshlash */
  initSocket(token: string | null) {
    if (!token) {
      console.warn('Token mavjud emas, socket ulanmaydi.');
      return;
    }

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

  /** Chatga qo‘shilish */
  joinConversation(id: number) {
    if (!this.socket) {
      console.warn('Socket ulanmagan: joinConversation ishlamadi.');
      return;
    }
    this.socket.emit('join-conversations', [id]);
  }

  /** Chatdan chiqish */
  leaveConversation(id: number) {
    if (!this.socket) {
      console.warn('Socket ulanmagan: leaveConversation ishlamadi.');
      return;
    }
    this.socket.emit('leave-conversations', [id]);
  }

  /** Event yuborish */
  emit(event: string, data: any) {
    if (!this.socket) {
      console.warn(`Socket ulanmagan: emit "${event}" ishlamadi.`);
      return;
    }
    this.socket.emit(event, data);
  }

  /** Xabarlarni olish */
  onMessage(): Observable<any> {
    return new Observable((observer) => {
      this.socket?.on('message.sent', (data) => {
        observer.next(data);
      });
    });
  }

  /** Socket obyektini olish */
  get getSocket(): Socket | null {
    return this.socket;
  }
}
