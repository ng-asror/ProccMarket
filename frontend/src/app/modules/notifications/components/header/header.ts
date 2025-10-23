import { Component, inject, input, resource } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { MessageService, SocketService } from '../../../../core';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [LucideAngularModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private messagesService = inject(MessageService);
  private socketService = inject(SocketService);
  private router = inject(Router);

  IDS = input.required<{ user_id: number; chat_id: number }>({ alias: 'all-id' });

  protected ICONS = icons;

  userInfo = resource({
    loader: async () => {
      const res = await firstValueFrom(this.messagesService.userInfo(this.IDS().user_id));
      return res.data;
    },
  });

  protected deleteChat(): void {
    firstValueFrom(this.messagesService.deleteConversation(this.IDS().chat_id)).then(() => {
      this.socketService.emit('conversation.delete', { conversation_id: this.IDS().chat_id });
      this.router.navigate(['/inbox/messages']);
    });
  }
}
