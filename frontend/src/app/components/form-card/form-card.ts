import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { AmDateFormatPipe, ITopic, NumeralPipe, Topic } from '../../core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-form-card',
  imports: [LucideAngularModule, NumeralPipe, AmDateFormatPipe],
  templateUrl: './form-card.html',
  styleUrl: './form-card.scss',
})
export class FormCard {
  private topicService = inject(Topic);
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
}
