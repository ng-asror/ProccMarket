import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { IConversationsRes, MessageService, SocketService, Telegram } from '../../../../core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-all',
  imports: [LucideAngularModule, DatePipe, RouterLink],
  templateUrl: './messages.html',
  styleUrl: './messages.scss',
})
export class Messages implements OnInit, OnDestroy {
  private messageService = inject(MessageService);
  private socketService = inject(SocketService);
  private telegram = inject(Telegram);

  chats_list_signal = signal<IConversationsRes | null>(null);

  protected ICONS = icons;
  audio: HTMLAudioElement;
  constructor() {
    this.audio = new Audio();
    this.audio.src = '/sounds/notification-sound.mp3';
    this.audio.load();
  }

  // playSound() {
  //   this.audio.pause();
  //   this.audio.currentTime = 0;
  //   this.audio.play();
  // }

  async ngOnInit(): Promise<void> {
    this.telegram.showBackButton('/');
    this.getChatList();
  }

  getChatList(): void {
    this.messageService.getConversations().subscribe({
      next: (res) => {
        this.chats_list_signal.set(res);
      },
    });
  }

  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/');
  }
}
