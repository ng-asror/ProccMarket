import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(Auth);
  const router = inject(Router);
  const loggedIn = await authService.isLoggedIn();
  if (loggedIn) {
    return true;
  } else {
    router.navigate(['/auth']);
    return false;
  }
};
