import { NgForOf } from '@angular/common';
import { Component } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { FormCard } from '../../../../components';

@Component({
  selector: 'app-section',
  imports: [NgForOf, LucideAngularModule, FormCard],
  templateUrl: './section.html',
  styleUrl: './section.scss',
})
export class Section {
  numbers: number[] = Array.from({ length: 20 }, (_, i) => i + 1);
  protected ICONS = icons;
}
