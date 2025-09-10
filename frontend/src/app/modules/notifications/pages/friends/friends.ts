import { Component } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-friends',
  imports: [LucideAngularModule],
  templateUrl: './friends.html',
  styleUrl: './friends.scss',
})
export class Friends {
  protected ICONS = icons;
}
