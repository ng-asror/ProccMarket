import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import SwiperCore from 'swiper';
import { EffectFade, Grid, Autoplay } from 'swiper/modules';

SwiperCore.use([Grid, Autoplay, EffectFade]);

@Component({
  selector: 'app-home-slide',
  templateUrl: './home-slide.html',
  styleUrls: ['./home-slide.scss'], // styleUrl -> styleUrls
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeSlide {
  slides = [
    { img: '/img/home-slide1.jpg' },
    { img: '/img/home-slide2.jpg' },
    { img: '/img/home-slide3.jpg' },
    { img: '/img/home-slide1.jpg' },
    { img: '/img/home-slide2.jpg' },
    { img: '/img/home-slide3.jpg' },
  ];
}
