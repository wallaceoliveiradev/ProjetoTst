import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  InspecaoApi,
  InspecaoApiService,
  InspecaoRequestApi,
} from '../../services/inspecao-api.service';

type StatusChecklist = 'conforme' | 'naoConforme' | 'pendente' | null;
type Prioridade = 'Baixa' | 'Média' | 'Alta';
type TelaChecklist = 'painel' | 'selecao' | 'inspecao';
type TipoInspecaoId = 'onibus' | 'garagem' | 'oficina' | 'epis' | 'emergencia';

interface ItemChecklist {
  id: string;
  descricao: string;
  icone: string;
  status: StatusChecklist;
  observacao: string;
  prioridade: Prioridade;
  prazo: string;
  responsavelCorrecao: string;
}

interface CategoriaChecklist {
  id: string;
  titulo: string;
  icone: string;
  aberta: boolean;
  itens: ItemChecklist[];
}

interface EvidenciaChecklist {
  nome: string;
  url: string;
}

interface TipoInspecao {
  id: TipoInspecaoId;
  titulo: string;
  descricao: string;
  icone: string;
}

interface InspecaoRecente {
  id: number;
  data: string;
  tipoId: TipoInspecaoId;
  tipo: string;
  localVeiculo: string;
  responsavel: string;
  conformidade: number;
  origem: 'exemplo' | 'api';
  totalItens?: number;
  conformes?: number;
  naoConformes?: number;
  pendentes?: number;
}

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './checklist.html',
  styleUrl: './checklist.scss',
})
export class Checklist implements OnInit, OnDestroy {
  tela: TelaChecklist = 'painel';
  tipoAtual: TipoInspecaoId = 'onibus';
  salvandoChecklist = false;
  carregandoInspecoes = false;
  erroCarregamento = '';
  erroSalvamento = false;
  inspecaoEditandoId: number | null = null;
  inspecoesSalvas: InspecaoApi[] = [];

  tiposInspecao: TipoInspecao[] = [
    {
      id: 'onibus',
      titulo: 'Inspeção de Ônibus',
      descricao: 'Verificação das condições de segurança do veículo.',
      icone: 'bi-bus-front',
    },
    {
      id: 'garagem',
      titulo: 'Inspeção da Garagem',
      descricao: 'Verificação das condições de segurança do ambiente.',
      icone: 'bi-building',
    },
    {
      id: 'oficina',
      titulo: 'Inspeção da Oficina',
      descricao: 'Verificação de máquinas, ferramentas e organização.',
      icone: 'bi-tools',
    },
    {
      id: 'epis',
      titulo: 'Inspeção de EPIs',
      descricao: 'Verificação da disponibilidade e das condições dos EPIs.',
      icone: 'bi-cone-striped',
    },
    {
      id: 'emergencia',
      titulo: 'Inspeção de Emergência',
      descricao: 'Verificação dos equipamentos e rotas de emergência.',
      icone: 'bi-fire',
    },
  ];

  inspecao = {
    data: '',
    numeroOnibus: '3021',
    placa: 'RIO-3A21',
    tipo: 'Pré-operacional',
    local: 'Garagem Austin',
    setor: 'Operacional',
    responsavel: 'Carlos Silva',
  };

  observacoesGerais = '';
  feedbackSalvamento = '';
  evidencias: EvidenciaChecklist[] = [];
  categorias: CategoriaChecklist[] = this.criarCategorias('onibus');

  private readonly resumoExemplo = {
    total: 24,
    conformes: 18,
    naoConformes: 3,
    pendentes: 3,
    conformidade: 75,
  };

  readonly inspecoesExemplo: InspecaoRecente[] = [
    {
      id: -1,
      data: '2026-08-20',
      tipoId: 'onibus',
      tipo: 'Inspeção de Ônibus',
      localVeiculo: 'Ônibus 3021 · RIO-3A21',
      responsavel: 'Carlos Silva',
      conformidade: 75,
      origem: 'exemplo',
    },
    {
      id: -2,
      data: '2026-08-18',
      tipoId: 'garagem',
      tipo: 'Inspeção da Garagem',
      localVeiculo: 'Garagem Austin',
      responsavel: 'Carlos Silva',
      conformidade: 88,
      origem: 'exemplo',
    },
    {
      id: -3,
      data: '2026-08-15',
      tipoId: 'oficina',
      tipo: 'Inspeção da Oficina',
      localVeiculo: 'Oficina de Manutenção',
      responsavel: 'Juliana Souza',
      conformidade: 62,
      origem: 'exemplo',
    },
    {
      id: -4,
      data: '2026-08-10',
      tipoId: 'epis',
      tipo: 'Inspeção de EPIs',
      localVeiculo: 'Setor Operacional',
      responsavel: 'Carlos Silva',
      conformidade: 92,
      origem: 'exemplo',
    },
  ];

  constructor(
    private readonly inspecaoApi: InspecaoApiService,
    private readonly authService: AuthService,
  ) {
    this.inspecao.data = this.dataLocal();
    this.inspecao.responsavel = this.authService.getUsuarioLogado()?.nome ?? '';
  }

  ngOnInit(): void {
    this.carregarInspecoes();
  }

  get ultimasInspecoes(): InspecaoRecente[] {
    const reais = this.inspecoesSalvas.map((inspecao) => this.mapearResumo(inspecao));
    return [...reais, ...this.inspecoesExemplo];
  }

  get resumoPainel(): typeof this.resumoExemplo {
    if (this.inspecoesSalvas.length === 0) return this.resumoExemplo;
    const total = this.inspecoesSalvas.reduce((soma, item) => soma + item.totalItens, 0);
    const conformes = this.inspecoesSalvas.reduce((soma, item) => soma + item.conformes, 0);
    const naoConformes = this.inspecoesSalvas.reduce((soma, item) => soma + item.naoConformes, 0);
    const pendentes = this.inspecoesSalvas.reduce((soma, item) => soma + item.pendentes, 0);
    return {
      total,
      conformes,
      naoConformes,
      pendentes,
      conformidade: total === 0 ? 0 : Math.round((conformes / total) * 100),
    };
  }

  get tipoSelecionado(): TipoInspecao | undefined {
    return this.tiposInspecao.find((tipo) => tipo.id === this.tipoAtual);
  }

  iconeTipo(tipoId: TipoInspecaoId): string {
    return this.tiposInspecao.find((tipo) => tipo.id === tipoId)?.icone ?? 'bi-clipboard-check';
  }

  formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
  }

  get todosOsItens(): ItemChecklist[] {
    return this.categorias.flatMap((categoria) => categoria.itens);
  }

  get totalItens(): number {
    return this.todosOsItens.length;
  }

  get itensVerificados(): number {
    return this.todosOsItens.filter((item) => item.status !== null).length;
  }

  get itensConformes(): number {
    return this.todosOsItens.filter((item) => item.status === 'conforme').length;
  }

  get itensNaoConformes(): ItemChecklist[] {
    return this.todosOsItens.filter((item) => item.status === 'naoConforme');
  }

  get itensPendentes(): number {
    return this.todosOsItens.filter(
      (item) => item.status === null || item.status === 'pendente',
    ).length;
  }

  get percentualConformidade(): number {
    if (this.totalItens === 0) return 0;
    return Math.round((this.itensConformes / this.totalItens) * 100);
  }

  abrirSelecao(): void {
    this.feedbackSalvamento = '';
    this.erroSalvamento = false;
    this.tela = 'selecao';
  }

  voltarAoPainel(): void {
    this.feedbackSalvamento = '';
    this.tela = 'painel';
  }

  iniciarInspecao(tipoId: TipoInspecaoId): void {
    this.limparEvidencias();
    this.tipoAtual = tipoId;
    this.categorias = this.criarCategorias(tipoId);
    this.inspecao = {
      data: this.dataLocal(),
      numeroOnibus: '',
      placa: '',
      tipo: tipoId === 'onibus' ? 'Pré-operacional' : 'Rotina',
      local: tipoId === 'garagem' ? 'Garagem Austin' : '',
      setor: tipoId === 'onibus' ? 'Operacional' : '',
      responsavel: this.authService.getUsuarioLogado()?.nome ?? '',
    };
    this.inspecaoEditandoId = null;
    this.observacoesGerais = '';
    this.feedbackSalvamento = '';
    this.erroSalvamento = false;
    this.tela = 'inspecao';
  }

  abrirInspecaoRecente(registro: InspecaoRecente): void {
    if (registro.origem === 'api') {
      this.inspecaoApi.obter(registro.id).subscribe({
        next: (inspecao) => this.carregarInspecao(inspecao),
        error: (erro: HttpErrorResponse) => {
          this.feedbackSalvamento = this.mensagemErroApi(
            erro,
            'Não foi possível carregar os detalhes da inspeção.',
          );
          this.erroSalvamento = true;
        },
      });
      return;
    }

    this.abrirInspecaoExemplo(registro);
  }

  private abrirInspecaoExemplo(registro: InspecaoRecente): void {
    this.iniciarInspecao(registro.tipoId);
    this.inspecao.data = registro.data;
    this.inspecao.local = registro.tipoId === 'onibus' ? 'Garagem Austin' : registro.localVeiculo;
    this.inspecao.responsavel = registro.responsavel;

    if (registro.tipoId === 'onibus') {
      this.inspecao.numeroOnibus = '3021';
      this.inspecao.placa = 'RIO-3A21';
      this.inspecao.tipo = 'Pré-operacional';
    }

    // Registros ilustrativos: esta carga será substituída pelos dados reais da API.
    const itens = this.todosOsItens;
    const conformes = Math.round((itens.length * registro.conformidade) / 100);
    const naoConformes = Math.min(3, Math.max(1, Math.floor((itens.length - conformes) / 2)));
    itens.forEach((item, index) => {
      item.status = index < conformes ? 'conforme' : index < conformes + naoConformes ? 'naoConforme' : 'pendente';
    });
    if (registro.id === -1) {
      const extintor = this.todosOsItens.find((item) => item.id === 'extintor');
      if (extintor) extintor.observacao = 'Extintor vencido.';
      const farois = this.todosOsItens.find((item) => item.id === 'farois');
      if (farois) farois.observacao = 'Lanterna traseira esquerda queimada.';
    }
  }

  alternarCategoria(id: string): void {
    const categoria = this.categorias.find((item) => item.id === id);
    if (categoria) categoria.aberta = !categoria.aberta;
  }

  marcarItem(item: ItemChecklist, status: StatusChecklist): void {
    item.status = status;
    this.feedbackSalvamento = '';
  }

  imprimirChecklist(): void {
    window.print();
  }

  salvarChecklist(): void {
    if (this.salvandoChecklist) return;
    if (!this.inspecao.data || !this.inspecao.responsavel.trim()) {
      this.feedbackSalvamento = 'Informe a data da inspeção e o nome do responsável.';
      this.erroSalvamento = true;
      return;
    }
    if (this.todosOsItens.some((item) => item.status === null)) {
      this.feedbackSalvamento =
        'Selecione Conforme, Não conforme ou Pendente para todos os itens antes de salvar.';
      this.erroSalvamento = true;
      return;
    }
    if (this.itensNaoConformes.some((item) => !item.observacao.trim())) {
      this.feedbackSalvamento = 'Descreva o problema de cada item marcado como não conforme.';
      this.erroSalvamento = true;
      return;
    }

    this.salvandoChecklist = true;
    this.feedbackSalvamento = '';
    this.erroSalvamento = false;
    const requisicao = this.criarRequisicao();
    const operacao = this.inspecaoEditandoId === null
      ? this.inspecaoApi.criar(requisicao)
      : this.inspecaoApi.atualizar(this.inspecaoEditandoId, requisicao);
    operacao.subscribe({
      next: (inspecao) => {
        this.inspecoesSalvas = [
          inspecao,
          ...this.inspecoesSalvas.filter((item) => item.id !== inspecao.id),
        ];
        this.inspecaoEditandoId = null;
        this.salvandoChecklist = false;
        this.feedbackSalvamento = 'Checklist salvo com sucesso.';
        this.erroSalvamento = false;
        this.tela = 'painel';
      },
      error: (erro: HttpErrorResponse) => {
        this.salvandoChecklist = false;
        this.feedbackSalvamento = this.mensagemErroApi(
          erro,
          'Não foi possível salvar o checklist. Tente novamente.',
        );
        this.erroSalvamento = true;
      },
    });
  }

  cancelarChecklist(): void {
    const confirmar = window.confirm(
      'Deseja limpar as respostas, observações e evidências desta inspeção?',
    );
    if (!confirmar) return;

    for (const item of this.todosOsItens) {
      item.status = null;
      item.observacao = '';
      item.prioridade = 'Média';
      item.prazo = '';
      item.responsavelCorrecao = '';
    }
    this.observacoesGerais = '';
    this.feedbackSalvamento = '';
    this.erroSalvamento = false;
    this.limparEvidencias();
  }

  adicionarEvidencias(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivos = Array.from(input.files ?? []);

    for (const arquivo of arquivos) {
      if (!arquivo.type.startsWith('image/')) continue;
      this.evidencias.push({ nome: arquivo.name, url: URL.createObjectURL(arquivo) });
    }
    input.value = '';
  }

  removerEvidencia(url: string): void {
    URL.revokeObjectURL(url);
    this.evidencias = this.evidencias.filter((evidencia) => evidencia.url !== url);
  }

  ngOnDestroy(): void {
    this.limparEvidencias();
  }

  private criarItem(id: string, descricao: string, icone: string): ItemChecklist {
    return {
      id,
      descricao,
      icone,
      status: null,
      observacao: '',
      prioridade: 'Média',
      prazo: '',
      responsavelCorrecao: '',
    };
  }

  private carregarInspecoes(): void {
    this.carregandoInspecoes = true;
    this.erroCarregamento = '';
    this.inspecaoApi.listar().subscribe({
      next: (inspecoes) => {
        this.inspecoesSalvas = inspecoes;
        this.carregandoInspecoes = false;
      },
      error: (erro: HttpErrorResponse) => {
        this.carregandoInspecoes = false;
        this.erroCarregamento = this.mensagemErroApi(
          erro,
          'Não foi possível carregar as inspeções salvas.',
        );
      },
    });
  }

  private criarRequisicao(): InspecaoRequestApi {
    return {
      data: this.inspecao.data,
      tipoId: this.tipoAtual,
      tipo: this.inspecao.tipo,
      local: this.inspecao.local,
      setor: this.inspecao.setor,
      numeroOnibus: this.inspecao.numeroOnibus,
      placa: this.inspecao.placa,
      responsavel: this.inspecao.responsavel,
      observacoesGerais: this.observacoesGerais,
      respostas: this.todosOsItens.map((item) => ({
        itemId: item.id,
        descricao: item.descricao,
        status: item.status as Exclude<StatusChecklist, null>,
        observacao: item.observacao,
        prioridade: item.prioridade,
        prazoCorrecao: item.prazo || null,
        responsavelCorrecao: item.responsavelCorrecao,
      })),
    };
  }

  private carregarInspecao(inspecao: InspecaoApi): void {
    this.limparEvidencias();
    this.inspecaoEditandoId = inspecao.id;
    this.tipoAtual = inspecao.tipoId as TipoInspecaoId;
    this.categorias = this.criarCategorias(this.tipoAtual);
    this.inspecao = {
      data: inspecao.data,
      numeroOnibus: inspecao.numeroOnibus ?? '',
      placa: inspecao.placa ?? '',
      tipo: inspecao.tipo,
      local: inspecao.local ?? '',
      setor: inspecao.setor ?? '',
      responsavel: inspecao.responsavel,
    };
    this.observacoesGerais = inspecao.observacoesGerais ?? '';
    for (const resposta of inspecao.respostas) {
      const item = this.todosOsItens.find((candidato) => candidato.id === resposta.itemId);
      if (!item) continue;
      item.status = resposta.status;
      item.observacao = resposta.observacao ?? '';
      item.prioridade = resposta.prioridade ?? 'Média';
      item.prazo = resposta.prazoCorrecao ?? '';
      item.responsavelCorrecao = resposta.responsavelCorrecao ?? '';
    }
    this.feedbackSalvamento = '';
    this.tela = 'inspecao';
  }

  private mapearResumo(inspecao: InspecaoApi): InspecaoRecente {
    const veiculo = inspecao.tipoId === 'onibus' && inspecao.numeroOnibus
      ? `Ônibus ${inspecao.numeroOnibus}${inspecao.placa ? ` · ${inspecao.placa}` : ''}`
      : inspecao.local || inspecao.setor || 'Local não informado';
    return {
      id: inspecao.id,
      data: inspecao.data,
      tipoId: inspecao.tipoId as TipoInspecaoId,
      tipo: this.tiposInspecao.find((tipo) => tipo.id === inspecao.tipoId)?.titulo ?? inspecao.tipo,
      localVeiculo: veiculo,
      responsavel: inspecao.responsavel,
      conformidade: inspecao.conformidade,
      origem: 'api',
      totalItens: inspecao.totalItens,
      conformes: inspecao.conformes,
      naoConformes: inspecao.naoConformes,
      pendentes: inspecao.pendentes,
    };
  }

  private mensagemErroApi(erro: HttpErrorResponse, padrao: string): string {
    if (erro.status === 401 || erro.status === 403) {
      return 'Sua sessão expirou ou você não tem permissão. Entre novamente no sistema.';
    }
    const mensagem = typeof erro.error?.detail === 'string'
      ? erro.error.detail
      : typeof erro.error?.message === 'string'
        ? erro.error.message
        : '';
    return mensagem || padrao;
  }

  private dataLocal(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private criarCategorias(tipoId: TipoInspecaoId): CategoriaChecklist[] {
    const item = (id: string, descricao: string, icone: string) => this.criarItem(id, descricao, icone);

    switch (tipoId) {
      case 'onibus':
        return [
          {
            id: 'veiculo', titulo: '1. Condições do Veículo', icone: 'bi-bus-front', aberta: true,
            itens: [
              item('pneus', 'Pneus em condições adequadas', 'bi-circle'),
              item('freios', 'Sistema de freios funcionando', 'bi-gear'),
              item('iluminacao', 'Iluminação externa funcionando', 'bi-lightbulb'),
              item('farois', 'Faróis e lanternas funcionando', 'bi-brightness-high'),
              item('espelhos', 'Espelhos retrovisores em boas condições', 'bi-aspect-ratio'),
              item('portas', 'Portas funcionando corretamente', 'bi-door-open'),
              item('parabrisa', 'Para-brisa sem danos que prejudiquem a visão', 'bi-window'),
              item('limpadores', 'Limpadores de para-brisa funcionando', 'bi-cloud-rain'),
            ],
          },
          {
            id: 'emergencia', titulo: '2. Equipamentos de Emergência', icone: 'bi-fire', aberta: true,
            itens: [
              item('extintor', 'Extintor acessível e dentro da validade', 'bi-fire'),
              item('saidas', 'Saídas de emergência sinalizadas', 'bi-door-open'),
              item('martelos', 'Martelos de emergência disponíveis', 'bi-hammer'),
              item('janelas', 'Janelas de emergência identificadas', 'bi-window'),
              item('primeiros-socorros', 'Kit de primeiros socorros disponível', 'bi-briefcase-medical'),
              item('sinalizacao', 'Sinalização de emergência em boas condições', 'bi-sign-stop'),
            ],
          },
          {
            id: 'trabalhador', titulo: '3. Segurança do Trabalhador', icone: 'bi-person-check', aberta: false,
            itens: [
              item('epi', 'EPIs exigidos disponíveis e em boas condições', 'bi-person-bounding-box'),
              item('cinto', 'Cinto de segurança em boas condições', 'bi-shield-check'),
              item('ergonomia', 'Posto de trabalho com condições adequadas', 'bi-person-workspace'),
              item('treinamento', 'Orientações de segurança atualizadas', 'bi-journal-check'),
              item('identificacao', 'Identificação e sinalização legíveis', 'bi-card-checklist'),
            ],
          },
          {
            id: 'garagem', titulo: '4. Garagem / Oficina', icone: 'bi-tools', aberta: false,
            itens: [
              item('piso', 'Piso limpo e sem obstáculos', 'bi-broom'),
              item('circulacao', 'Áreas de circulação desobstruídas', 'bi-signpost'),
              item('ferramentas', 'Ferramentas armazenadas corretamente', 'bi-tools'),
              item('maquinas', 'Máquinas com proteções instaladas', 'bi-gear-fill'),
              item('ambiente', 'Iluminação e organização adequadas', 'bi-building'),
            ],
          },
        ];
      case 'garagem':
        return [
          { id: 'ambiente', titulo: '1. Estrutura e Ambiente', icone: 'bi-building', aberta: true, itens: [
            item('piso', 'Pisos limpos e sem obstáculos', 'bi-bricks'),
            item('circulacao', 'Áreas de circulação desobstruídas', 'bi-signpost'),
            item('iluminacao', 'Iluminação adequada em todos os setores', 'bi-lightbulb'),
            item('ventilacao', 'Ventilação adequada', 'bi-wind'),
            item('sinalizacao', 'Sinalização de segurança visível', 'bi-sign-stop'),
          ] },
          { id: 'operacao', titulo: '2. Circulação e Operação', icone: 'bi-arrow-left-right', aberta: false, itens: [
            item('faixas', 'Faixas de circulação visíveis', 'bi-distribute-horizontal'),
            item('pedestres', 'Rotas de pedestres demarcadas', 'bi-person-walking'),
            item('velocidade', 'Limites de velocidade sinalizados', 'bi-speedometer2'),
            item('acesso', 'Acessos e saídas desobstruídos', 'bi-door-open'),
            item('estacionamento', 'Áreas de estacionamento organizadas', 'bi-p-square'),
          ] },
          { id: 'emergencia-garagem', titulo: '3. Emergência e Organização', icone: 'bi-shield-check', aberta: false, itens: [
            item('extintores', 'Extintores acessíveis e sinalizados', 'bi-fire'),
            item('rota-fuga', 'Rotas de fuga livres', 'bi-sign-turn-right'),
            item('residuos', 'Resíduos armazenados corretamente', 'bi-recycle'),
            item('produtos', 'Produtos identificados e armazenados', 'bi-droplet'),
            item('comunicacao', 'Telefones de emergência disponíveis', 'bi-telephone'),
          ] },
        ];
      case 'oficina':
        return [
          { id: 'maquinas', titulo: '1. Máquinas e Equipamentos', icone: 'bi-tools', aberta: true, itens: [
            item('protecao-maquinas', 'Máquinas com proteções instaladas', 'bi-gear'),
            item('conservacao', 'Equipamentos em bom estado de conservação', 'bi-check-circle'),
            item('ferramentas', 'Ferramentas adequadas à atividade', 'bi-wrench-adjustable'),
            item('elevadores', 'Elevadores e macacos inspecionados', 'bi-arrows-vertical'),
            item('eletrica', 'Painéis elétricos identificados e protegidos', 'bi-lightning'),
          ] },
          { id: 'organizacao-oficina', titulo: '2. Organização e Armazenamento', icone: 'bi-box-seam', aberta: false, itens: [
            item('bancadas', 'Bancadas limpas e organizadas', 'bi-layout-text-window'),
            item('ferramentas-guardadas', 'Ferramentas guardadas após o uso', 'bi-tools'),
            item('piso-oficina', 'Piso sem óleo ou materiais espalhados', 'bi-droplet'),
            item('passagens', 'Passagens e saídas desobstruídas', 'bi-signpost'),
            item('iluminacao-oficina', 'Iluminação adequada na área de trabalho', 'bi-lightbulb'),
          ] },
          { id: 'seguranca-oficina', titulo: '3. Segurança do Trabalhador', icone: 'bi-person-check', aberta: false, itens: [
            item('epis-oficina', 'EPIs usados conforme a atividade', 'bi-cone-striped'),
            item('bloqueio', 'Fontes de energia isoladas para manutenção', 'bi-power'),
            item('treinamento-oficina', 'Equipe orientada sobre os procedimentos', 'bi-journal-check'),
            item('produtos-oficina', 'Produtos químicos identificados', 'bi-exclamation-triangle'),
            item('incendio-oficina', 'Equipamentos de combate a incêndio acessíveis', 'bi-fire'),
          ] },
        ];
      case 'epis':
        return [
          { id: 'disponibilidade', titulo: '1. Disponibilidade', icone: 'bi-box2', aberta: true, itens: [
            item('capacete', 'Capacetes disponíveis para a equipe', 'bi-person-bounding-box'),
            item('oculos', 'Óculos de proteção disponíveis', 'bi-eye'),
            item('luvas', 'Luvas adequadas às atividades', 'bi-hand'),
            item('botas', 'Calçados de segurança disponíveis', 'bi-shield-check'),
            item('protetor', 'Protetores auriculares disponíveis', 'bi-ear'),
          ] },
          { id: 'condicao-epis', titulo: '2. Condições de Uso', icone: 'bi-clipboard-check', aberta: false, itens: [
            item('integridade', 'EPIs sem danos e em condições de uso', 'bi-check-circle'),
            item('higienizacao', 'EPIs higienizados e conservados', 'bi-droplet'),
            item('tamanho', 'Tamanhos adequados aos trabalhadores', 'bi-person'),
            item('substituicao', 'Itens danificados separados para substituição', 'bi-arrow-repeat'),
            item('armazenamento', 'Local de armazenamento adequado', 'bi-box-seam'),
          ] },
          { id: 'controle-epis', titulo: '3. Identificação e Controle', icone: 'bi-card-checklist', aberta: false, itens: [
            item('ca', 'Certificados de Aprovação dentro da validade', 'bi-patch-check'),
            item('identificacao-epi', 'EPIs identificados e rastreáveis', 'bi-upc-scan'),
            item('entrega', 'Registros de entrega atualizados', 'bi-journal-text'),
            item('orientacao', 'Orientações de uso registradas', 'bi-person-check'),
            item('estoque', 'Estoque mínimo acompanhado', 'bi-boxes'),
          ] },
        ];
      case 'emergencia':
        return [
          { id: 'equipamentos', titulo: '1. Equipamentos de Emergência', icone: 'bi-fire', aberta: true, itens: [
            item('extintores', 'Extintores acessíveis e dentro da validade', 'bi-fire'),
            item('alarmes', 'Alarmes de emergência funcionando', 'bi-bell'),
            item('iluminacao-emergencia', 'Iluminação de emergência funcionando', 'bi-lightbulb'),
            item('primeiros-socorros', 'Kit de primeiros socorros abastecido', 'bi-briefcase-medical'),
            item('comunicacao-emergencia', 'Meios de comunicação disponíveis', 'bi-telephone'),
          ] },
          { id: 'rotas', titulo: '2. Rotas de Fuga e Sinalização', icone: 'bi-sign-turn-right', aberta: false, itens: [
            item('saidas', 'Saídas de emergência desobstruídas', 'bi-door-open'),
            item('placas', 'Placas de saída visíveis', 'bi-sign-turn-right'),
            item('mapas', 'Rotas e pontos de encontro sinalizados', 'bi-map'),
            item('acessos', 'Acessos de emergência livres', 'bi-signpost'),
            item('portas-emergencia', 'Portas de emergência operacionais', 'bi-door-closed'),
          ] },
          { id: 'preparacao', titulo: '3. Preparação e Resposta', icone: 'bi-shield-check', aberta: false, itens: [
            item('contatos', 'Contatos de emergência atualizados', 'bi-telephone'),
            item('brigada', 'Brigadistas identificados no local', 'bi-people'),
            item('treinamento-emergencia', 'Treinamentos de emergência em dia', 'bi-journal-check'),
            item('simulado', 'Simulados registrados conforme planejamento', 'bi-calendar-check'),
            item('procedimento', 'Procedimentos de emergência disponíveis', 'bi-file-earmark-text'),
          ] },
        ];
    }
  }

  private limparEvidencias(): void {
    for (const evidencia of this.evidencias) URL.revokeObjectURL(evidencia.url);
    this.evidencias = [];
  }
}
