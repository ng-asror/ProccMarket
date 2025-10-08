// локаль для русского языка
numeral.register('locale', 'ru', {
  delimiters: {
    thousands: ' ', // разделитель тысяч — пробел
    decimal: ',', // разделитель десятых — запятая
  },
  abbreviations: {
    thousand: 'тыс',
    million: 'млн',
    billion: 'млрд',
    trillion: 'трлн',
  },
  ordinal: function () {
    return '.';
  },
  currency: {
    symbol: '$',
  },
});
numeral.locale('ru');

import { Pipe, PipeTransform } from '@angular/core';
import numeral from 'numeral';

@Pipe({
  name: 'numeral',
})
export class NumeralPipe implements PipeTransform {
  transform(value: string | number, arg: string): string {
    return numeral(value).format(arg);
  }
}
