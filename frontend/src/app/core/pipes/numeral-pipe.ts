import { Pipe, PipeTransform } from '@angular/core';
import numeral from 'numeral';
@Pipe({
  name: 'numeral',
})
export class NumeralPipe implements PipeTransform {
  transform(value: number, arg: '$0,0[.]00' | '0a'): string {
    return numeral(value).format(arg);
  }
}
