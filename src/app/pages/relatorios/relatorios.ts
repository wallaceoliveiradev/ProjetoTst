import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  RelatorioDadosResponse,
  RelatorioQuantidade,
  RelatorioResumoResponse,
  RelatoriosApiService,
  TipoRelatorio,
} from '../../services/relatorios-api.service';

interface ConsultaRelatorio {
  inicio: string;
  fim: string;
  tipo: TipoRelatorio | '';
}

interface PontoMensal {
  anoMes: string;
  rotulo: string;
  quantidade: number;
  x: number;
  y: number;
}

const tiposDisponiveis: Array<{ valor: TipoRelatorio; rotulo: string }> = [
  { valor: 'geral', rotulo: 'Relatório Geral' },
  { valor: 'funcionarios', rotulo: 'Colaboradores' },
  { valor: 'treinamentos', rotulo: 'Treinamentos' },
  { valor: 'epis', rotulo: 'Equipamentos de Proteção Individual (EPIs)' },
  { valor: 'riscos', rotulo: 'Riscos Ocupacionais' },
  { valor: 'inspecoes', rotulo: 'Inspeções de Segurança' },
  { valor: 'checklist', rotulo: 'Checklist de Segurança' },
];

const coresGrafico = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6'];

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.scss',
})
export class Relatorios implements OnInit, OnDestroy {
  readonly tiposRelatorio = tiposDisponiveis;
  readonly coresGrafico = coresGrafico;
  readonly carregando = signal(false);
  readonly mensagemErro = signal('');
  readonly resumo = signal<RelatorioResumoResponse | null>(null);
  readonly relatorioCarregado = signal<RelatorioDadosResponse | null>(null);

  dataInicio = '';
  dataFim = '';
  relatorioSelecionado: TipoRelatorio | '' = '';

  private readonly consultas = new Subject<ConsultaRelatorio | null>();
  private readonly consultaSubscription = this.consultas
    .pipe(
      switchMap((consulta) => {
        if (!consulta) {
          return EMPTY;
        }
        return forkJoin({
          resumo: this.relatoriosApi.obterResumo(consulta.inicio, consulta.fim),
          dados: consulta.tipo
            ? this.relatoriosApi.obterDados(consulta.tipo, consulta.inicio, consulta.fim)
            : of(null),
        }).pipe(
          map((resposta) => ({ sucesso: true as const, resposta })),
          catchError((erro: unknown) => of({ sucesso: false as const, erro })),
        );
      }),
    )
    .subscribe((resultado) => {
      this.carregando.set(false);
      if (!resultado.sucesso) {
        this.resumo.set(null);
        this.relatorioCarregado.set(null);
        this.mensagemErro.set(this.mensagemErroConsulta(resultado.erro));
        return;
      }

      this.resumo.set(resultado.resposta.resumo);
      this.relatorioCarregado.set(resultado.resposta.dados);
    });

  constructor(private readonly relatoriosApi: RelatoriosApiService) {}

  ngOnInit(): void {
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(new Date());
    const ano = partes.find((parte) => parte.type === 'year')?.value;
    const mes = partes.find((parte) => parte.type === 'month')?.value;
    if (!ano || !mes) {
      throw new Error('Não foi possível determinar o período atual de São Paulo.');
    }
    const ultimoDia = new Date(Number(ano), Number(mes), 0).getDate();
    this.dataInicio = `${ano}-${mes}-01`;
    this.dataFim = `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`;
    this.consultar();
  }

  ngOnDestroy(): void {
    this.consultaSubscription.unsubscribe();
    this.consultas.complete();
  }

  consultar(): void {
    this.consultas.next(null);
    this.relatorioCarregado.set(null);
    this.resumo.set(null);
    this.mensagemErro.set('');

    if (!this.dataInicio || !this.dataFim) {
      this.mensagemErro.set('Informe as datas inicial e final do período.');
      return;
    }
    if (this.dataInicio > this.dataFim) {
      this.mensagemErro.set('A data inicial não pode ser posterior à data final.');
      return;
    }

    this.carregando.set(true);
    this.consultas.next({
      inicio: this.dataInicio,
      fim: this.dataFim,
      tipo: this.relatorioSelecionado,
    });
  }

  invalidarRelatorio(): void {
    this.consultas.next(null);
    this.carregando.set(false);
    this.resumo.set(null);
    this.relatorioCarregado.set(null);
  }

  alterarTipoRelatorio(): void {
    this.invalidarRelatorio();
    this.consultar();
  }

  get treinamentosPorTipo(): RelatorioQuantidade[] {
    return this.resumo()?.treinamentosPorTipo ?? [];
  }

  get episPorTipo(): RelatorioQuantidade[] {
    return this.resumo()?.episPorTipo ?? [];
  }

  get riscosPorNivel(): RelatorioQuantidade[] {
    const normalizar = (valor: string) =>
      valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    const dados = this.resumo()?.riscosPorNivel ?? [];
    return ['Alto', 'Médio', 'Baixo'].map((rotulo) => ({
      rotulo,
      quantidade: dados.find((item) => normalizar(item.rotulo) === normalizar(rotulo))?.quantidade ?? 0,
    }));
  }

  get pontosMensais(): PontoMensal[] {
    const meses = this.resumo()?.treinamentosPorMes ?? [];
    const maior = Math.max(1, ...meses.map((mes) => mes.quantidade));
    return meses.map((mes, index) => ({
      anoMes: mes.anoMes,
      rotulo: this.formatarMes(mes.anoMes),
      quantidade: mes.quantidade,
      x: meses.length < 2 ? 50 : (index / (meses.length - 1)) * 100,
      y: 90 - (mes.quantidade / maior) * 78,
    }));
  }

  get pontosLinha(): string {
    return this.pontosMensais.map((ponto) => `${ponto.x},${ponto.y}`).join(' ');
  }

  get gradienteEpis(): string {
    const epis = this.episPorTipo;
    const total = epis.reduce((soma, epi) => soma + epi.quantidade, 0);
    if (total === 0) {
      return '#e5e7eb';
    }

    let acumulado = 0;
    const fatias = epis.map((epi, index) => {
      const inicio = (acumulado / total) * 100;
      acumulado += epi.quantidade;
      const fim = (acumulado / total) * 100;
      return `${coresGrafico[index % coresGrafico.length]} ${inicio}% ${fim}%`;
    });
    return `conic-gradient(${fatias.join(', ')})`;
  }

  totalEpisNoPeriodo(): number {
    return this.episPorTipo.reduce((soma, epi) => soma + epi.quantidade, 0);
  }

  larguraBarra(valor: number, serie: RelatorioQuantidade[]): number {
    const maior = Math.max(0, ...serie.map((item) => item.quantidade));
    return maior === 0 ? 0 : (valor / maior) * 100;
  }

  formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
  }

  formatarMes(anoMes: string): string {
    const [ano, mes] = anoMes.split('-').map(Number);
    if (!ano || !mes) {
      return anoMes;
    }
    return new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
      .format(new Date(Date.UTC(ano, mes - 1, 1)));
  }

  exportarPDF(): void {
    const dados = this.obterRelatorioExportavel();
    if (!dados) {
      return;
    }

    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text(dados.titulo, 14, 20);
    pdf.setFontSize(10);
    pdf.text(`Período: ${this.formatarData(dados.inicio)} a ${this.formatarData(dados.fim)}`, 14, 29);
    pdf.text(`Emitido em: ${this.formatarEmissao(dados.geradoEm)}`, 14, 36);

    autoTable(pdf, {
      startY: 44,
      head: [dados.colunas],
      body: dados.linhas.map((linha) => linha.map((valor) => valor ?? '')),
      theme: 'grid',
      headStyles: { fillColor: [31, 41, 55], textColor: 255 },
    });
    pdf.setFontSize(9);
    pdf.text('Sistema TST - Segurança e Saúde do Trabalho', 14, 285);
    pdf.save(`${dados.tipo}-${dados.inicio}-a-${dados.fim}.pdf`);
  }

  exportarExcel(): void {
    const dados = this.obterRelatorioExportavel();
    if (!dados) {
      return;
    }

    const worksheet = XLSX.utils.aoa_to_sheet([dados.colunas, ...dados.linhas]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const arquivo = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(arquivo, `${dados.tipo}-${dados.inicio}-a-${dados.fim}.xlsx`);
  }

  private obterRelatorioExportavel(): RelatorioDadosResponse | null {
    const dados = this.relatorioCarregado();
    if (
      !dados ||
      dados.tipo !== this.relatorioSelecionado ||
      dados.inicio !== this.dataInicio ||
      dados.fim !== this.dataFim
    ) {
      this.mensagemErro.set('Consulte novamente para gerar o relatório com os filtros atuais.');
      return null;
    }
    return dados;
  }

  formatarEmissao(data: string): string {
    const instante = new Date(data);
    return Number.isNaN(instante.getTime())
      ? data
      : new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'America/Sao_Paulo',
        }).format(instante);
  }

  private mensagemErroConsulta(erro: unknown): string {
    if (!(erro instanceof HttpErrorResponse)) {
      return 'Não foi possível carregar os dados do relatório.';
    }
    if (erro.status === 0) {
      return 'Não foi possível conectar à API de relatórios. Verifique se o servidor está disponível.';
    }
    if (erro.status === 401) {
      return 'Sua sessão expirou ou é inválida. Entre novamente para acessar os relatórios.';
    }
    if (erro.status === 403) {
      return 'Sua conta não tem permissão para acessar os relatórios gerenciais.';
    }
    return `Não foi possível carregar os dados do relatório (HTTP ${erro.status}).`;
  }
}
