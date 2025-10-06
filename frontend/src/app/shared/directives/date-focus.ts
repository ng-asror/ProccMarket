import { AfterViewInit, Directive, ElementRef, Renderer2 } from '@angular/core';
import flatpickr from 'flatpickr';

@Directive({
  selector: '[appDateFocus]',
})
export class DateFocus implements AfterViewInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {}
  ngAfterViewInit(): void {
    flatpickr(`#${this.el.nativeElement.id}`, {
      mode: 'single',
      dateFormat: 'Y-m-d',
      locale: {
        weekdays: {
          shorthand: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
          longhand: [
            'Воскресенье',
            'Понедельник',
            'Вторник',
            'Среда',
            'Четверг',
            'Пятница',
            'Суббота',
          ],
        },
        months: {
          shorthand: [
            'Янв',
            'Фев',
            'Мар',
            'Апр',
            'Май',
            'Июн',
            'Июл',
            'Авг',
            'Сен',
            'Окт',
            'Ноя',
            'Дек',
          ],
          longhand: [
            'Январь',
            'Февраль',
            'Март',
            'Апрель',
            'Май',
            'Июнь',
            'Июль',
            'Август',
            'Сентябрь',
            'Октябрь',
            'Ноябрь',
            'Декабрь',
          ],
        },
      },
      allowInput: true,
    });
  }
}
