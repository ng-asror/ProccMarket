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
  IMessage,
  MessageService,
  SocketService,
  Telegram,
} from '../../../../core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Header, Message, MessageForm } from '../../components';

@Component({
  selector: 'app-chat',
  imports: [LucideAngularModule, FormsModule, Message, MessageForm, Header],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss'],
})
export class Chat implements OnInit, OnDestroy, AfterViewInit {
  private telegram = inject(Telegram);
  private socketService = inject(SocketService);
  private messagesService = inject(MessageService);
  private activatedRoute = inject(ActivatedRoute);
  private sub: Subscription = new Subscription();

  protected ICONS = icons;
  chat_id = signal<number | null>(null);
  user_id = signal<number | null>(null);
  my_id = signal<number | null>(null);
  messages = signal<IConversationRes | null>(null);

  @ViewChild('chatCanvas') chatContent!: ElementRef<HTMLDivElement>;

  constructor() {
    this.chat_id.set(Number(this.activatedRoute.snapshot.paramMap.get('chat_id')));
    this.user_id.set(Number(this.activatedRoute.snapshot.paramMap.get('user_id')));
  }

  private myInfo = resource({
    loader: () =>
      firstValueFrom(this.messagesService.myInfo()).then((res) => {
        this.my_id.set(res.data.id);
      }),
  }).asReadonly();

  ngOnInit(): void {
    this.telegram.showBackButton('/inbox/messages');
    this.getChats();
    this.socketService.listen<IMessage>('message.send').subscribe({
      next: (res) => {
        this.messages.update((current) => {
          if (!current) return current;
          return {
            ...current,
            messages: [...current.messages, res],
          };
        });
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Socket xatosi:', err);
      },
    });
  }

  getChats(): void {
    const chat_id = Number(this.chat_id());
    this.socketService.emit<number>('join-conversations', chat_id);
    this.sub.add(
      this.messagesService.getConversation(Number(this.chat_id())).subscribe({
        next: (res) => {
          this.messages.set(res);
        },
        complete: () => {
          this.scrollToBottom();
        },
        error: (err) => {
          console.error('Xabarlarni olishda xato:', err);
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

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    const chatId = Number(this.chat_id());
    if (chatId) this.socketService.emit<number>('leave-conversations', chatId);
    this.telegram.hiddeBackButton('/inbox/messages');
  }
}
