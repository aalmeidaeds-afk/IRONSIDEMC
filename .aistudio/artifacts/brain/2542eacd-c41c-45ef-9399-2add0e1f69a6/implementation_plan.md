# Reset Geral do Banco de Dados - Início das Operações Oficiais

Arquitetura e implementação da funcionalidade de **RESET GERAL DO BANCO DE DADOS** para o sistema Iron Side Road Rider M.C., garantindo a limpeza completa e irreversível de todos os dados de testes e registros operacionais de todos os 14 módulos, deixando a aplicação em estado inicial limpo para início das operações reais, preservando integralmente as contas de acesso administrativo e a identidade do clube.

---

## 1. Visão Geral da Funcionalidade

- **Objetivo**: Permitir que o Administrador execute a limpeza estruturada de dados transacionais e de teste acumulados durante a fase de homologação, garantindo prontidão para o início oficial das operações do moto clube.
- **Localização**: Botão de ação crítica e destrutiva em vermelho chamativo nas telas de **Configurações do Administrador** (`ConfiguracoesView.tsx`) e no **Centro de Comando Executivo** (`AdminExecutiveControlCenter.tsx`).
- **Rótulo Oficial**: `"RESET GERAL DO BANCO DE DADOS"`.

---

## 2. Fluxo de Confirmação e Segurança em 2 Etapas

### Etapa 1: Modal de Aviso Destrutivo com Texto Exato
O modal abre exibindo o aviso formal exigido:
> *"ATENÇÃO: ESTA OPERAÇÃO É DESTRUTIVA!  
> Você está prestes a apagar todos os dados operacionais do sistema, incluindo associados, cadastros, movimentações financeiras, mensalidades, relatórios, históricos operacionais e dados de exemplo de todos os módulos.  
> Serão preservados o login, a imagem da tela de acesso, as contas de Administrador e Diretor, suas senhas e permissões, além da estrutura técnica e das configurações essenciais do sistema.  
> Esta operação poderá ser irreversível sem um backup.  
> Deseja realmente continuar?"*

- **Opções de Ação**:
  - `CANCELAR`: Fecha o modal sem realizar qualquer alteração no sistema.
  - `CONFIRMAR RESET GERAL`: Avança para a segunda etapa de dupla validação.

### Etapa 2: Dupla Validação de Segurança
Para impedir disparos acidentais, a execução física da exclusão exige simultaneamente:
1. **Digitação da Frase Padrão**: Digitar exatamente `RESET GERAL` (validação em maiúsculas com feedback visual em tempo real).
2. **Senha Administrativa**: Entrada estritamente mascarada (`type="password"`), validando a senha mestra (`Disnatia2026`) ou a senha do perfil Administrador (`verifyAdminPassword`).
3. **Opção de Troca de Senha**: Permite alterar a senha master do reset a qualquer momento sem exigir a senha anterior.
4. **Botão de Execução**: `EXECUTAR RESET GERAL AGORA`, habilitado exclusivamente quando a frase e a senha estão preenchidas corretamente.

### Etapa 3: Indicador de Progresso em Tempo Real
Exibe barra de progresso animada de 0% a 100% com indicador descritivo de cada fase:
1. *Disparo do backup preventivo integral do Cloud Firestore...*
2. *Exclusão das 14 coleções operacionais no Cloud Firestore...*
3. *Limpeza das tabelas locais do IndexedDB Dexie e fila offline...*
4. *Remoção de chaves operacionais e caches do dispositivo...*
5. *Bloqueio permanente de re-injeção de dados de exemplo...*
6. *Gravação de registro oficial e imutável de auditoria...*

### Etapa 4: Relatório Pós-Reset e Validação de Integridade
Apresenta o resumo de conclusão com:
- Nome do arquivo de backup de contingência JSON baixado automaticamente e hash SHA-256.
- Total de documentos operacionais apagados.
- Grid com os 14 módulos com contadores zerados (`0 registros`).
- Relação confirmada de elementos preservados.
- Botão `CONCLUIR & ATUALIZAR SISTEMA`.

---

## 3. Matriz de Exclusão vs. Preservação

### Dados Integralmente Apagados
| Módulo / Coleção | Firestore | IndexedDB Dexie | LocalStorage / Memória |
| :--- | :---: | :---: | :---: |
| **Associados & Membros** (`associados`) | Excluído | Limpo | Zerado |
| **Motos & Veículos da Frota** (`veiculos`) | Excluído | Limpo | Zerado |
| **Histórico de Manutenções** (`manutencoes`) | Excluído | Limpo | Zerado |
| **Histórico de Abastecimentos** (`abastecimentos`) | Excluído | Limpo | Zerado |
| **Eventos, Inscrições & Fotos** (`eventos`) | Excluído | Limpo | Zerado |
| **Mensalidades & Caixa** (`mensalidades`) | Excluído | Limpo | Zerado |
| **Mural & Comunicados** (`comunicados`) | Excluído | Limpo | Zerado |
| **Campanhas Solidárias** (`campanhas`, `doacoes`) | Excluído | Limpo | Zerado |
| **Amigos & Moto Clubes** (`amigos_mc`) | Excluído | Limpo | Zerado |
| **Notícias & Dicas de Motos** (`noticias_motos`) | Excluído | Limpo | Zerado |
| **Rede Credenciada SOS** (`prestadores_servicos`) | Excluído | Limpo | Zerado |
| **Extrato Bancário** (`extrato_bancario`) | Excluído | - | Limpo (`ironside_extrato_bancario_v1`) |
| **Falhas e Exceções** (`falhas_excecoes`) | Excluído | - | Limpo (`ironside_falhas_excecoes_v1`) |
| **Logs Operacionais Antigos** (`auditoria`) | Excluído | Limpo | Zerado |

### Dados e Estruturas Preservados Obrigatoriamente
1. **Identidade Visual**: Logotipo oficial do clube (`/ironside-logo.svg`), lema e brasão.
2. **Tela de Login**: Layout, componentes de autenticação e fluxos de entrada.
3. **Conta do Administrador**: Credenciais e senha mantidas com total integridade.
4. **Conta da Diretoria**: Login `DIRETORIA`, senha `DIR202627` (ou personalizada) e permissões.
5. **Módulo 0**: Cadastro Institucional Oficial, Estatuto Social, Ata de Fundação e dados de CNPJ (`configuracoes/institucional` e `ironside_cadastro_institucional_v1`).
6. **Esquemas do Banco**: Definições de coleções, índices e regras de segurança do Firestore.
7. **Backup de Contingência**: Arquivo JSON completo gerado e salvo no histórico local (`ironside_historico_backups_firestore_v1`).

---

## 4. Bloqueio Permanente Contra Re-Injeção de Dados de Exemplo

Para garantir que registros de demonstração ou testes (`DEFAULT_...`) **nunca mais reapareçam** após a conclusão do reset:
1. **Flag Persistente**: Armazenada no `localStorage` sob a chave `ironside_sistema_operacional_resetado = 'true'` e no documento `configuracoes/geral` do Firestore (`sistemaResetado: true`).
2. **Esvaziamento em Memória**: `limparTodosArraysPadraoMemoria()` esvazia o comprimento (`.length = 0`) de todos os arrays default em memória.
3. **Zero-Mock Fallback**: Todas as funções de consulta (`getAssociados`, `getVeiculos`, `getManutencoes`, `getAbastecimentos`, `getEventos`, `getMensalidades`, `getComunicados`, `getPrestadoresServicos`, `getCampanhas`, `getAmigosMc`, `getNoticiasMotos`, `getLancamentosExtrato`, `getAuditoriaLogs`) verificam `isSistemaResetado()` e retornam imediatamente arrays vazios `[]` caso as coleções estejam limpas, sem re-alimentar o cache Dexie ou injetar itens simulados.
4. **Bloqueio de Seeder**: A rotina `seedInitialDatabaseIfEmpty` aborta imediatamente se `isSistemaResetado()` for verdadeiro.

---

## 5. Validação Pós-Reset e Prontidão Operacional

- **Relatórios**: Módulo 14 (Central de Relatórios PDF), DRE, Fluxo de Caixa, Carteirinha Digital, Ficha Cadastral e Rank de Estradas exibem estado vazio limpo com totais zerados.
- **Inserção de Novos Registros**: Usuários e administradores podem cadastrar novos associados, veículos, mensalidades e eventos imediatamente após o reset, com total suporte a sincronização online e offline.
