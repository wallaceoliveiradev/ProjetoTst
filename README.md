# Controle de EPIs

Aplicativo educacional para apoiar o trabalho do Técnico de Segurança do Trabalho e facilitar o acompanhamento de EPIs, empréstimos e treinamentos pelos colaboradores.

## O que o projeto oferece

- Acesso por matrícula e senha.
- Painel administrativo com indicadores de EPIs, empréstimos, estoque, solicitações, treinamentos e funcionários.
- Painel do colaborador com seus EPIs, solicitações e treinamentos.
- Cadastro e consulta de EPIs e funcionários.
- Solicitação, aprovação e devolução de empréstimos de EPIs.
- Consulta e cadastro de treinamentos, com acompanhamento de pendências e histórico.

As opções disponíveis podem variar conforme o perfil de acesso (administrador ou colaborador).

## Tecnologias

- **Aplicativo:** Flutter e Dart.
- **Comunicação com a API:** HTTP/REST.
- **Backend:** Java com Spring.
- **Banco de dados:** relacional; o script SQL incluído usa tabelas como `funcionario`, `epi`, `emprestimo` e `treinamento`.

## Como executar o aplicativo

Pré-requisitos: Flutter instalado e um emulador ou dispositivo conectado.

Na pasta do projeto, execute:

```bash
flutter pub get
flutter run
```

## Backend e conexão

O aplicativo consulta uma API em `http://localhost:8080`, configurada em `lib/src/services/api_config.dart`. Inicie o backend e o banco de dados antes de usar as telas que carregam dados.

Se estiver usando um emulador Android, `localhost` aponta para o próprio emulador. Altere a URL base para o endereço acessível do computador (normalmente `http://10.0.2.2:8080`). Em um dispositivo físico, use o endereço IP do computador na rede local.

Os arquivos disponíveis do backend estão na pasta `backend/`. Configure a conexão com o banco e execute a API conforme o ambiente do projeto. O script `backend/conferir_dashboard.sql` contém consultas de conferência dos indicadores do painel.

## Estrutura principal

```text
lib/
  main.dart                 # Inicialização do aplicativo
  src/models/               # Modelos de dados
  src/screens/               # Telas do aplicativo
  src/services/              # Acesso à API
  src/widgets/               # Componentes reutilizáveis
backend/                     # Controllers, serviços, repositórios e SQL
```

## Observação

Este projeto tem finalidade educacional. Para executá-lo em outro ambiente, confira a URL da API e as configurações do backend e do banco de dados.
