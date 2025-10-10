import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { Section } from '../../../core';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, LucideAngularModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private sectionsService = inject(Section);
  protected sections = this.sectionsService.sections;
  protected ICONS = icons;
}
