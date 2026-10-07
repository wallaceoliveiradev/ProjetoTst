import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (typeof window === 'undefined') {
    return next(request);
  }

  const token = localStorage.getItem('accessToken');
  if (!token) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
