import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  House,
  LucideAngularModule,
  MessageCircle,
  Search,
  UserRound,
  Wallet,
} from 'lucide-angular';
import { ICONS } from './icons';

@Component({
  selector: 'app-menubar',
  imports: [RouterLink, LucideAngularModule, RouterLinkActive],
  templateUrl: './menubar.html',
  styleUrl: './menubar.scss',
})
export class Menubar {
  icons = ICONS;
}
