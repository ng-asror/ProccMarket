import { Component } from '@angular/core';
import { HomeSlide, TabContent, TabSlide } from './components';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [TabContent, HomeSlide, TabSlide],
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
