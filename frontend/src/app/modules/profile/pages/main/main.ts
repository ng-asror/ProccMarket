import { Component, inject, resource } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { Auth, NumeralPipe, ProfileService } from '../../../../core';
import { NgIf } from '@angular/common';
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-main',
  imports: [NumeralPipe, LucideAngularModule, NgIf, RouterLink],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {
  private authService = inject(Auth);
  private profileService = inject(ProfileService);

  protected apurl = environment.ngrok;
  constructor(private router: Router) {}
  protected ICONS = icons;

  protected logout(): void {
    this.authService.logout();
  }

  profile = resource({
    loader: () => firstValueFrom(this.profileService.getProfile()),
  });
}
