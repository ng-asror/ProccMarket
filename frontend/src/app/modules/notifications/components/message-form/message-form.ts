import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { icons, LucideAngularModule } from 'lucide-angular';
import { TextFieldModule } from '@angular/cdk/text-field';
import { IMessage, MessageService, SocketService } from '../../../../core';

@Component({
  selector: 'app-message-form',
  imports: [FormsModule, LucideAngularModule, TextFieldModule],
  templateUrl: './message-form.html',
  styleUrl: './message-form.scss',
})
export class MessageForm {
  private messageService = inject(MessageService);

  chat_id = input.required<number>({ alias: 'chat_id' });

  protected ICONS = icons;
  txtContent = signal<string>('');

  async send(): Promise<void> {
    if (!this.txtContent().trim()) return;
    try {
      await firstValueFrom(
        this.messageService.sendMessage(this.chat_id(), this.txtContent())
      ).finally(() => {
        this.txtContent.set('');
      });
    } catch (error) {
      console.log(error);
    }
  }
}
