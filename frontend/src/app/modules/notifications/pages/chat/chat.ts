import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  resource,
  signal,
  ViewChild,
} from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';

import {
  IConversationRes,
  IMessageResSocket,
  MessageService,
  SocketService,
  Telegram,
} from '../../../../core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Message, MessageForm } from '../../components';

@Component({
  selector: 'app-chat',
  imports: [LucideAngularModule, FormsModule, Message, MessageForm],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat implements OnInit, OnDestroy, AfterViewInit {
  private telegram = inject(Telegram);
  private socketService = inject(SocketService);
  private messagesService = inject(MessageService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private sub: Subscription = new Subscription();

  protected ICONS = icons;
  chat_id = signal<string | null>(null);
  user_id = signal<string | null>(null);
  messages = signal<IConversationRes | null>(null);

  @ViewChild('chatCanvas') chatContent!: ElementRef<HTMLDivElement>;

  constructor() {
    this.chat_id.set(this.activatedRoute.snapshot.paramMap.get('chat_id'));
  }

  userInfo = resource({
    loader: async () => {
      this.user_id.set(this.activatedRoute.snapshot.paramMap.get('user_id'));
      const res = await firstValueFrom(this.messagesService.userInfo(Number(this.user_id())));
      return res.data;
    },
  });

  ngOnInit(): void {
    this.telegram.showBackButton('/inbox/messages');
    this.getChats();
    this.socketService.on('message.send').subscribe((res: IMessageResSocket) => {
      this.messages.update((current) => {
        if (!current) return current;
        this.scrollToBottom();
        return {
          ...current,
          messages: [...current.messages, res.message],
        };
      });
    });
  }
  getChats(): void {
    this.socketService.joinConversation(Number(this.chat_id()));
    this.sub.add(
      this.messagesService.getConversation(Number(this.chat_id())).subscribe({
        next: (res) => {
          this.messages.set(res);
        },
        complete: () => {
          this.scrollToBottom();
        },
      })
    );
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    const element = this.chatContent.nativeElement;
    setTimeout(() => {
      element.scrollTo({
        top: element.scrollHeight + 60,
        behavior: 'instant',
      });
    }, 500);
  }

  protected deleteChat(): void {
    firstValueFrom(this.messagesService.deleteConversation(Number(this.chat_id()))).then(() => {
      this.socketService.emit('conversation.delete', { conversation_id: Number(this.chat_id()) });
      this.router.navigate(['/inbox/messages']);
    });
  }
  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.socketService.leaveConversation(Number(this.chat_id()));
    this.telegram.hiddeBackButton('/inbox/messages');
  }
}
