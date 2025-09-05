import { NgClass } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-accordion-item',
  imports: [RouterLink, NgClass],
  templateUrl: './accordion-item.html',
  styleUrl: './accordion-item.scss',
})
export class AccordionItem {
  item = input.required<{ index: number; title: string; content: string }>({
    alias: 'item',
  });

  openIndex = signal<number | null>(null);

  ngOnInit() {
    if (this.item()) {
      this.openIndex.set(this.item().index);
    }
  }
  toggle(index: number) {
    this.openIndex.set(this.openIndex() === index ? null : index);
  }
}
