import { Component, inject, resource, signal } from '@angular/core';
import { IMyTopics, ProfileService, Telegram, TopicService } from '../../../../core';
import { firstValueFrom } from 'rxjs';
import { icons, LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { FormCard } from '../../../../components';

@Component({
  selector: 'app-topics',
  imports: [LucideAngularModule, FormCard, RouterLink],
  templateUrl: './topics.html',
  styleUrl: './topics.scss',
})
export class Topics {
  private topicService = inject(TopicService);
  private telegram = inject(Telegram);
  private profileService = inject(ProfileService);
  topics = signal<IMyTopics | null>(null);

  protected ICONS = icons;
  myTopics = resource({
    loader: () => firstValueFrom(this.profileService.myTopics()),
  });

  closedToggle(id: number): void {
    this.myTopics.update((current) => {
      if (!current) return current;
      return {
        ...current,
        topics: current.topics.map((topic) =>
          topic.id === id ? { ...topic, closed: !topic.closed } : topic
        ),
      };
    });
  }

  async deleteTopic(topic_id: number): Promise<void> {
    await firstValueFrom(this.topicService.delete(topic_id));
    this.myTopics.update((current) => {
      if (!current) return current;
      return {
        ...current,
        topics: current.topics.filter((topic) => topic.id !== topic_id),
      };
    });
  }

  ngOnInit(): void {
    this.telegram.showBackButton('/profile');
  }
  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/profile');
  }
}
