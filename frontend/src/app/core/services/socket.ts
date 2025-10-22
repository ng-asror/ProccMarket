import { inject, Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment.development';
import { Telegram } from './telegram';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private telegram = inject(Telegram);

  initSocket(token: string | null) {
    if (!token) {
      return;
    }
    this.socket = io(environment.socketUrl, {
      auth: { token: token },
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

  joinConversation(id: number) {
    if (!this.socket) return;
    this.socket.emit('join-conversations', [id]);
  }
  leaveConversation(id: number) {
    if (!this.socket) return;
    this.socket.emit('leave-conversations', [id]);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  onMessage(): Observable<any> {
    return new Observable((observer) => {
      this.socket?.on('message.sent', (data) => {
        observer.next(data);
      });
    });
  }
  get getSocket(): Socket | null {
    return this.socket;
  }
}
