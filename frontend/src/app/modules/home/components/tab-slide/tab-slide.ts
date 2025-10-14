import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { formsTapMock } from '../../mocks';
import { LucideAngularModule } from 'lucide-angular';
import { register } from 'swiper/element/bundle';
register();
@Component({
  selector: 'app-tab-slide',
  imports: [RouterLink, LucideAngularModule, RouterLinkActive],
  templateUrl: './tab-slide.html',
  styleUrl: './tab-slide.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TabSlide {
  protected formsTap = formsTapMock;
}
