import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-menubar',
  imports: [RouterLink, LucideAngularModule, RouterLinkActive],
  templateUrl: './menubar.html',
  styleUrl: './menubar.scss',
})
export class Menubar {
  protected icons = icons;
}
