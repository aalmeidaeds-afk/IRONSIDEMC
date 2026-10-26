# Especificação de Segurança Firestore - Moto Clube

## 1. Invariantes de Dados (Data Invariants)
1. **Invariante de Papel**: Um associado comum não pode alterar seu próprio papel (`role`) para `administrador` ou `diretoria`.
2. **Invariante de Autoaprovação**: Um associado com status `pendente` não pode alterar seu próprio status para `aprovado` ou `ativo`.
3. **Invariante de Isolamento de PII**: Associados comuns só podem ler ou atualizar o seu próprio documento na coleção `associados` (ou dados que lhe pertencem).
4. **Invariante de Propriedade de Veículo**: Um associado só pode criar, atualizar ou remover veículos onde `associadoId` corresponda ao seu próprio ID.
5. **Invariante de Propriedade de Manutenções e Abastecimentos**: Registros de manutenção e abastecimento só podem ser criados ou modificados pelo proprietário do veículo correspondente.
6. **Invariante Financeira**: Apenas perfis de Administrador podem dar baixa (`status: "pago"`) em registros da coleção `mensalidades`.
7. **Invariante de Auditoria**: Registros de auditoria são de inserção restrita e nunca podem ser atualizados ou excluídos.
8. **Invariante de Integridade de ID**: Nenhum campo de chave estrangeira (`associadoId`, `uid`) pode ser trocado por outro usuário em uma atualização.

## 2. As "Doze Cargas Maliciosas" (The Dirty Dozen Payloads)
1. **Payload 1 (Privilege Escalation)**: Associado envia atualização `{ role: "administrador" }` em seu documento `/users/{uid}`. Esperado: PERMISSION_DENIED.
2. **Payload 2 (Self-Approval Attack)**: Usuário pendente tenta enviar `{ status: "ativo", numeroAssociado: "MC-000001" }`. Esperado: PERMISSION_DENIED.
3. **Payload 3 (PII Snoop Attack)**: Associado "A" tenta realizar `get` ou `list` no registro de associado "B" contendo CPF, RG e CNH. Esperado: PERMISSION_DENIED.
4. **Payload 4 (Vehicle Hijack)**: Associado "A" tenta registrar veículo com `associadoId: "uid_vitima"`. Esperado: PERMISSION_DENIED.
5. **Payload 5 (Odometer / Maintenance Tampering)**: Associado "B" tenta deletar ou alterar manutenções do associado "A". Esperado: PERMISSION_DENIED.
6. **Payload 6 (Financial Forgery)**: Associado tenta marcar mensalidade própria como `{ status: "pago", dataPagamento: "2026-10-12" }`. Esperado: PERMISSION_DENIED.
7. **Payload 7 (Shadow Fields)**: Criação de associado injetando campos não permitidos como `__isAdmin: true` ou `masterKey: 123`. Esperado: PERMISSION_DENIED.
8. **Payload 8 (Log Poisoning / Audit Wipe)**: Usuário tenta deletar ou editar registros da coleção `/auditoria`. Esperado: PERMISSION_DENIED.
9. **Payload 9 (Denial of Wallet - String Overflow)**: Inserção de string com mais de 50.000 caracteres no campo `observacoes`. Esperado: PERMISSION_DENIED.
10. **Payload 10 (Event Sabotage)**: Associado comum tenta alterar dados do evento ou cancelar evento da diretoria. Esperado: PERMISSION_DENIED.
11. **Payload 11 (Broadcast Hijack)**: Associado comum tenta criar comunicado oficial na coleção `/comunicados`. Esperado: PERMISSION_DENIED.
12. **Payload 12 (Config Tampering)**: Não-administrador tenta trocar a Chave PIX do clube na coleção `/configuracoes`. Esperado: PERMISSION_DENIED.
