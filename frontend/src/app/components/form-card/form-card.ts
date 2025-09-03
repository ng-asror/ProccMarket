import { Component } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-form-card',
  imports: [LucideAngularModule],
  templateUrl: './form-card.html',
  styleUrl: './form-card.scss',
})
export class FormCard {
  protected icons = icons;
}
