import { AfterViewInit, Directive, ElementRef, Renderer2 } from '@angular/core';
import flatpickr from 'flatpickr';
@Directive({
  selector: '[appDateFocus]',
})
export class DateFocus implements AfterViewInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {}
  ngAfterViewInit(): void {
    flatpickr(`#${this.el.nativeElement.id}`);
  }
}
