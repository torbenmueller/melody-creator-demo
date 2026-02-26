import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const canActivate: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const isAuth = authService.getIsAuth();
  if (!isAuth) {
    router.navigate(['/auth/login']);
  }
  return isAuth;
};
