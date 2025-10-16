import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, resource } from '@angular/core';
import { Ads } from '../../../../core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-home-slide',
  imports: [],
  templateUrl: './home-slide.html',
  styleUrl: './home-slide.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeSlide {
  private adsService = inject(Ads);
  ads = resource({
    loader: () => firstValueFrom(this.adsService.getAds()),
  });
}
