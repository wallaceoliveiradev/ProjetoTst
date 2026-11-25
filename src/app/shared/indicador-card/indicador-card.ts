import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-indicador-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a
      class="indicator-card"
      [routerLink]="destino()"
      [queryParams]="parametros()"
      [attr.aria-label]="titulo() + ': ' + valor() + '. ' + acao()"
    >
      <i [class]="'bi ' + icone()" aria-hidden="true"></i>
      <span class="title">{{ titulo() }}</span>
      <strong>{{ valor() }}</strong>
      <span class="description">{{ descricao() }}</span>
      <small>{{ acao() }} <i class="bi bi-arrow-up-right" aria-hidden="true"></i></small>
    </a>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .indicator-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 20px;
      border: 1px solid var(--sst-border);
      border-radius: var(--sst-radius);
      background: var(--sst-surface);
      color: var(--sst-text);
      text-decoration: none;
    }
    .indicator-card > i {
      color: var(--sst-warning);
      font-size: 22px;
    }
    .title {
      font-size: 13px;
      font-weight: 600;
    }
    strong {
      font-size: 32px;
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }
    .description,
    small {
      color: var(--sst-muted);
      font-size: 12px;
    }
    small {
      margin-top: auto;
      padding-top: 8px;
      font-weight: 600;
    }
    .indicator-card:hover {
      border-color: var(--sst-yellow-deep);
      background: #fffdf5;
    }
  `,
})
export class IndicadorCard {
  readonly titulo = input.required<string>();
  readonly valor = input.required<number>();
  readonly icone = input.required<string>();
  readonly destino = input.required<string>();
  readonly parametros = input<Record<string, string>>({});
  readonly acao = input('Consultar');
  readonly descricao = input('');
}
