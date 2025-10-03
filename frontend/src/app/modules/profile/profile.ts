import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';
import { Auth } from '../../core';

@Component({
  selector: 'app-profile',
  imports: [LucideAngularModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private authService = inject(Auth);
  constructor(private router: Router) {}
  protected ICONS = icons;

  protected logout(): void {
    this.authService.logout();
  }
}
