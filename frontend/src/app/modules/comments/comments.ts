import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-comments',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './comments.html',
  styleUrl: './comments.scss',
})
export class Comments {
  protected ICONS = icons;
}
