export type StatusTreinamento = 'Ativo' | 'Inativo' | 'Planejado' | 'Concluído';

export interface Treinamento {
  id: number;
  nome: string;
  norma: string;
  descricao: string;
  cargaHoraria: number;
  validade: number;
  participantes: number;
  status: StatusTreinamento;
  usuarioIds?: number[];
}

export type StatusHistoricoTreinamento =
  | 'VALIDO'
  | 'ALERTA'
  | 'VENCIDO'
  | 'INVALIDADO'
  | 'SUBSTITUIDO';

export interface HistoricoTreinamento {
  id: number;
  treinamentoId: number;
  treinamentoNome: string;
  norma: string;
  usuarioId: number;
  colaboradorNome: string;
  colaboradorEmail: string;
  cargo: string | null;
  dataConclusao: string;
  dataVencimento: string;
  validadeAplicadaMeses: number;
  diasAntecedenciaAlerta: number;
  cargaHoraria: number;
  instrutor: string;
  conteudoProgramatico: string;
  certificadoNome: string;
  certificadoContentType: string;
  status: StatusHistoricoTreinamento;
  motivoInvalidacao: string | null;
  dataInvalidacao: string | null;
}

export interface RegistroConclusaoTreinamento {
  treinamentoId: number;
  usuarioId: number;
  dataConclusao: string;
  cargaHoraria: number;
  instrutor: string;
  conteudoProgramatico: string;
}

export interface ParametroTreinamento {
  id: number;
  treinamentoId: number;
  treinamentoNome: string;
  norma: string;
  cargo: string | null;
  validadeMeses: number;
  diasAntecedenciaAlerta: number;
}

export interface ParametroTreinamentoRequest {
  cargo: string | null;
  validadeMeses: number;
  diasAntecedenciaAlerta: number;
}
