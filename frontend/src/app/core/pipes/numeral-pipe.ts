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
