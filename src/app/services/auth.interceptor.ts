import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (typeof window === 'undefined') {
    return next(request);
  }

  if (request.url.includes('/api/auth/login')) {
    return next(request);
  }

  const token = localStorage.getItem('accessToken');
  if (!token) {
    return next(request);
  }

  // Do not send a token the client already knows has expired. The API will
  // otherwise reject every protected request with 401 until the user logs in.
  const expiresAt = Number(localStorage.getItem('tokenExpiresAt'));
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
