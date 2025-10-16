import { Component, effect, inject, input } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { register } from 'swiper/element/bundle';
import { ISectionsRes } from '../../../../core';

register();

@Component({
  selector: 'app-tab-slide',
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if(sections(); as data) {
    <div class="flex gap-x-[10px] overflow-x-scroll px-[15px]">
      @for (item of data.sections; track item.id) {
      <a
        routerLink="/home"
        [queryParams]="{ forms: item.id }"
        queryParamsHandling="replace"
        routerLinkActive="active"
        class="flex flex-col items-center justify-between shrink-0 p-[10px] rounded-[6px] bg-[#F2F2F2] gap-y-[4px] forms-tab leading-[100%] text-[12px] font-[500]"
      >
        <img [src]="item.image_url" [alt]="item.name" class="block" />
        {{ item.name }}
      </a>
      }
    </div>
    }
  `,
  styles: [
    `
      .forms-tab {
        color: #030303;
      }

      .forms-tab.active {
        color: #fff;
        background-color: #030303;
      }

      .forms-tab.active img {
        filter: invert(1);
      }
    `,
  ],
})
export class TabSlide {
  sections = input.required<ISectionsRes>({ alias: 'sections' });
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {
    effect(() => {
      const res = this.sections();
      if (res) {
        const param = this.route.snapshot.queryParamMap.get('forms');
        const firstSectionId = res.sections[0].id;
        if (!param && firstSectionId) {
          this.router.navigate([], {
            queryParams: { forms: firstSectionId },
            queryParamsHandling: 'merge',
          });
        }
      }
    });
  }
}
