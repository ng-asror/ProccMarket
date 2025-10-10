import { Component } from '@angular/core';
import { HomeSlide, TabContent, TabSlide } from './components';
import { ActivatedRoute, Router } from '@angular/router';
import { Menubar, Navbar } from '../../components';

@Component({
  selector: 'app-home',
  imports: [TabContent, HomeSlide, TabSlide, Navbar, Menubar],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  constructor(private router: Router, private route: ActivatedRoute) {
    route.queryParamMap.subscribe((params) => {
      const param = params.get('forms');
      if (!param) {
        router.navigate([], {
          queryParams: { forms: 'proc' },
        });
      }
    });
  }
}
