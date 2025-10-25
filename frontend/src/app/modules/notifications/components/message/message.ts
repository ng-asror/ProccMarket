import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { IMessage, MessageService, SocketService } from '../../../../core';
import { DatePipe, NgClass } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-message',
  imports: [DatePipe, NgClass],
  templateUrl: './message.html',
  styleUrl: './message.scss',
})
export class Message implements OnInit, AfterViewInit, OnDestroy {
  private messageService = inject(MessageService);
  private socketService = inject(SocketService);

  private el = inject(ElementRef);
  public message = input.required<{ message: IMessage; user_id: number; my_id: number }>({
    alias: 'message',
  });
  messageSignal = signal<IMessage | null>(null);

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.messageSignal.set(this.message().message);
    this.socketService.listenAnyEvent('message-read').subscribe({
      next: (res: IMessage) => {
        if (res.id === this.message().message.id) {
          this.messageSignal.set(res);
        }
      },
    });
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      async ([entry]) => {
        const msg = this.message().message;
        const my_id = this.message().my_id;
        if (entry.isIntersecting && !msg.is_read && msg.user_id !== my_id) {
          await firstValueFrom(this.messageService.isRead(this.message().message.id)).then(() => {
            this.observer?.disconnect();
          });
        }
      },
      {
        threshold: 0.6,
      }
    );
    this.observer.observe(this.el.nativeElement);
  }
  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
