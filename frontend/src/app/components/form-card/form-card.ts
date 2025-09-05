import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-form-card',
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './form-card.html',
  styleUrl: './form-card.scss',
})
export class FormCard {
  protected icons = icons;
  navigateLink = input.required<string>({ alias: 'navigate' });
}
