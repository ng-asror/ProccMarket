import { Component, OnInit } from '@angular/core';
import { HomeSlide, TabContent } from './components';
import {
  ActivatedRoute,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NgFor } from '@angular/common';
import { formsTapMock } from './mocks';
import { NgxTooltip } from '@ngx-popovers/tooltip';

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
    NgxTooltip,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  protected formsTap = formsTapMock;
  constructor(private route: ActivatedRoute) {
    this.route.queryParamMap.subscribe((params) => {
      let param = params.get('form');
    });
  }
  ngOnInit(): void {}
}
