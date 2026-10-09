import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('accessToken', 'token-antigo-invalido');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem('accessToken');
  });

  it('does not send a previously stored token to the login endpoint', () => {
    const http = TestBed.inject(HttpClient);
    http.post('http://localhost:8080/api/auth/login', {
      email: 'user@example.test',
      senha: 'password',
    }).subscribe();

    const request = httpTesting.expectOne('http://localhost:8080/api/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ token: 'novo-token' });
  });

  it('continues sending the stored token to protected endpoints', () => {
    const http = TestBed.inject(HttpClient);
    http.get('http://localhost:8080/api/usuarios/me').subscribe();

    const request = httpTesting.expectOne('http://localhost:8080/api/usuarios/me');
    expect(request.request.headers.get('Authorization')).toBe(
      'Bearer token-antigo-invalido',
    );
    request.flush({});
  });
});
