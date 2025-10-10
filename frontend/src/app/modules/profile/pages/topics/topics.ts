import { Component, inject, resource, signal } from '@angular/core';
import { IMyTopics, NumeralPipe, ProfileService, Telegram } from '../../../../core';
import { firstValueFrom } from 'rxjs';
import { icons, LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-topics',
  imports: [LucideAngularModule, NumeralPipe, RouterLink],
  templateUrl: './topics.html',
  styleUrl: './topics.scss',
})
export class Topics {
  private telegram = inject(Telegram);
  private profileService = inject(ProfileService);
  topics = signal<IMyTopics | null>(null);

  protected ICONS = icons;
  myTopics = resource({
    loader: () => firstValueFrom(this.profileService.myTopics()),
  });

  closedToggle(id: number): void {
    // this.profileService
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
  ngOnInit(): void {
    this.telegram.showBackButton('/profile');
  }
  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/profile');
  }
}
