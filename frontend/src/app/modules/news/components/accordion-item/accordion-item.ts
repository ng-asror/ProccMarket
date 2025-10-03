import { NgForOf, NgIf } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { INewBlog } from '../../../../core';

@Component({
  selector: 'app-accordion-item',
  imports: [RouterLink, NgForOf, NgIf],
  templateUrl: './accordion-item.html',
  styleUrl: './accordion-item.scss',
})
export class AccordionItem {
  newsBlog = input.required<INewBlog>({
    alias: 'news-blog',
  });
}
