import { Component, effect, ElementRef, inject, input, signal, ViewChild } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { AmDateFormatPipe, ITopic, MessageService, NumeralPipe, TopicService } from '../../core';
import { firstValueFrom } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-form-card',
  imports: [LucideAngularModule, NumeralPipe, AmDateFormatPipe, RouterLink],
  templateUrl: './form-card.html',
  styleUrl: './form-card.scss',
})
export class FormCard {
  private topicService = inject(TopicService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  @ViewChild('userModal') userModal!: ElementRef<HTMLDialogElement>;
  protected author = signal<ITopic['author'] | null>(null);
  protected ICONS = icons;
  item = input.required<ITopic>({ alias: 'topic' });
  itemSignal = signal<ITopic | null>(null);
  constructor() {
    effect(() => {
      this.itemSignal.set(this.item());
    });
  }

  protected async topicToggleLike(topic_id: number, is_like: boolean): Promise<void> {
    await firstValueFrom(this.topicService.topicLikeDislike(topic_id, is_like)).then((res) => {
      this.itemSignal.update((current) => {
        if (!current) return current;
        return {
          ...current,
          likes_count: res.data.likes_count,
          dislikes_count: res.data.dislikes_count,
          user_reaction: res.data.user_reaction,
        };
      });
    });
  }
  protected createChat(user_id: number): void {
    firstValueFrom(this.messageService.createConversation(user_id)).then((res) => {
      this.router.navigate(['/inbox/chat', res.data.id, user_id]);
    });
  }
  protected openUserModal(data: ITopic['author']): void {
    this.author.set(data);
    this.userModal.nativeElement.showModal();
  }
}
