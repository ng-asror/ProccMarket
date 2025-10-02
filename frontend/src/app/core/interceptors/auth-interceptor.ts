import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Telegram } from '../services';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const telegram = inject(Telegram);
  return from(telegram.getCloudStorage('token')).pipe(
    switchMap((token) => {
      const newReq = token
        ? req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          })
        : req;
      return next(newReq);
    })
  );
};
