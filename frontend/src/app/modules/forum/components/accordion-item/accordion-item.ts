import { NgForOf } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
export interface INews {
  title: string;
  items: { id: number; title: string }[];
}

@Component({
  selector: 'app-accordion-item',
  imports: [RouterLink, NgForOf],
  templateUrl: './accordion-item.html',
  styleUrl: './accordion-item.scss',
})
export class AccordionItem {
  item = input.required<INews>({
    alias: 'item',
  });
}
