import { Component } from '@angular/core';
import { HomeSlide, TabContent } from './components';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NgFor } from '@angular/common';
import { formsTapMock } from './mocks';

@Component({
  selector: 'app-home',
  imports: [
    TabContent,
    HomeSlide,
    RouterLink,
    RouterOutlet,
    LucideAngularModule,
    NgFor,
    RouterLinkActive,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected formsTap = formsTapMock;
}
