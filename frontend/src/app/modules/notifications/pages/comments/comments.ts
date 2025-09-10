import { Component } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-comments',
  imports: [LucideAngularModule],
  templateUrl: './comments.html',
  styleUrl: './comments.scss',
})
export class Comments {
  protected ICONS = icons;
}
