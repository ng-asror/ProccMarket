import { Component } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-profile',
  imports: [LucideAngularModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  protected ICONS = icons;
}
