import { Component, input } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { ITopic, NumeralPipe } from '../../core';

@Component({
  selector: 'app-form-card',
  imports: [LucideAngularModule, NumeralPipe],
  templateUrl: './form-card.html',
  styleUrl: './form-card.scss',
})
export class FormCard {
  protected ICONS = icons;
  item = input.required<ITopic>({ alias: 'topic' });
}
