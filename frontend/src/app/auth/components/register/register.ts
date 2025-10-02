import { Component } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-register',
  imports: [LucideAngularModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  protected ICONS = icons;
}
