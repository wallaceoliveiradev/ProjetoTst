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
