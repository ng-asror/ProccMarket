import { AfterViewInit, Component, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { IMessage, MessageService } from '../../../../core';
import { DatePipe, NgClass } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-message',
  imports: [DatePipe, NgClass],
  templateUrl: './message.html',
  styleUrl: './message.scss',
})
export class Message implements AfterViewInit, OnDestroy {
  private messageService = inject(MessageService);
  private el = inject(ElementRef);
  message = input.required<{ message: IMessage; user_id: number }>({ alias: 'message' });
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && this.message().message.is_read) {
          console.log('read');
          // await firstValueFrom(this.messageService.isRead(this.message().message.id)).then(
          //   (res) => {
          //     console.log(res.data);
          //     this.observer?.disconnect();
          //   }
          // );
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
