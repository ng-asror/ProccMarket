import { Component } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { FormCard } from '../../components';

@Component({
  selector: 'app-search',
  imports: [LucideAngularModule],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search {
  protected ICONS = icons;
}
