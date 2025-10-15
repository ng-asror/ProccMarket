import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { Section, Telegram } from '../../../core';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, LucideAngularModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private telegram = inject(Telegram);
  private sectionsService = inject(Section);
  protected sections = this.sectionsService.sections;
  protected ICONS = icons;

  protected comingSoon(): void {
    this.telegram.showAlert('Скоро');
  }
}
