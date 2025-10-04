import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';
import 'moment/locale/ru';

@Pipe({
  name: 'dateFormat',
})
export class AmDateFormatPipe implements PipeTransform {
  transform(value: Date): string {
    return moment().locale('ru').format('LL');
  }
}
