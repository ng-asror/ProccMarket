import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-profile',
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  protected ICONS = icons;
}
