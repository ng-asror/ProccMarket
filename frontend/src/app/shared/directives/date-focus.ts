import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appDateFocus]',
})
export class DateFocus {
  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.renderer.setAttribute(el.nativeElement, 'type', 'text');
  }
  @HostListener('focus')
  onFocus() {
    this.renderer.setAttribute(this.el.nativeElement, 'type', 'date');
    setTimeout(() => {
      this.el.nativeElement.showPicker?.();
    }, 0);
    this.el.nativeElement.readOnly = false;
  }
  @HostListener('change')
  onChange() {
    this.el.nativeElement.type = 'text';
    this.el.nativeElement.readOnly = true;
  }
  @HostListener('blur')
  onBlur() {
    this.renderer.setAttribute(this.el.nativeElement, 'type', 'text');
    this.el.nativeElement.readOnly = true;
  }
}
