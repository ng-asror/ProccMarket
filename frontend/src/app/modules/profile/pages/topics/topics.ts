import { Component, inject, resource } from '@angular/core';
import { NumeralPipe, ProfileService } from '../../../../core';
import { firstValueFrom } from 'rxjs';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-topics',
  imports: [LucideAngularModule, NumeralPipe],
  templateUrl: './topics.html',
  styleUrl: './topics.scss',
})
export class Topics {
  private profileService = inject(ProfileService);

  protected ICONS = icons;
  myTopics = resource({
    loader: () => firstValueFrom(this.profileService.myTopics()),
  });
}
