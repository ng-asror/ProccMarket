import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { House, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-menubar',
  imports: [RouterLink,  LucideAngularModule],
  templateUrl: './menubar.html',
  styleUrl: './menubar.scss'
})
export class Menubar {
	readonly house = House;
}
