# Guia Definitivo de Implementação: Trusted Web Activity (TWA)
### Iron Side Road Rider M.C. — Gestão Integrada & Estrada
**Pacote Android:** `br.com.ironsidemc.app`  
**Validação Digital:** `/.well-known/assetlinks.json`  
**Auditoria Pré-Build:** `npm run twa:verify`

---

## 1. O que é Trusted Web Activity (TWA) e Como Garante o Comportamento Nativo

O **Trusted Web Activity (TWA)** é a tecnologia oficial do Google para Android que empacota um Progressive Web App (PWA) de alto desempenho dentro de um contêiner nativo Android (formato `.aab` ou `.apk`).

### Diferença Crítica: WebView Comum vs TWA
- **WebView Tradicional:** Não compartilha cookies ou sessões com o navegador do sistema, é mais lenta, não tem cache de Service Worker de última geração e sofre com renderização desatualizada.
- **TWA (Trusted Web Activity):** Executa o motor moderno do Chrome do dispositivo do associado, compartilha credenciais salvas, executa Service Worker em segundo plano e, o mais importante: **remove completamente a barra de endereço da web (URL bar)**, proporcionando uma experiência indistinguível de um app desenvolvido em Kotlin ou Java.

---

## 2. A Chave da Experiência Nativa: `assetlinks.json`

O Android só esconde a barra de navegação da URL se verificar uma **relação de confiança criptográfica bidirecional** entre o aplicativo Android instalado e o site do motoclube.

Essa validação funciona assim:
1. O aplicativo TWA instalado no celular declara: *"Eu pertenço ao domínio `seumotoclube.com.br` e fui assinado com o certificado SHA-256 `14:6D:E9:...`"*.
2. O sistema operacional Android faz uma requisição HTTP silenciosa para:
   ```text
   https://seumotoclube.com.br/.well-known/assetlinks.json
   ```
3. Se o arquivo responder com código HTTP 200, formato JSON válido e contiver exatamente o `package_name` e o `sha256_cert_fingerprints` correspondente, **o Android remove imediatamente a barra de URL** e abre o app em tela cheia total.

---

## 3. O Arquivo `assetlinks.json` Deste Projeto

O arquivo já está gerado na pasta de assets estáticos do projeto:
📁 Caminho local: `public/.well-known/assetlinks.json`  
🌐 Caminho no servidor: `https://seumotoclube.com.br/.well-known/assetlinks.json`

### Conteúdo Oficial do Arquivo:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "br.com.ironsidemc.app",
      "sha256_cert_fingerprints": [
        "14:6D:E9:D6:0F:86:79:86:E6:44:24:B4:49:F7:18:A8:B4:E6:61:A2:43:21:65:B2:91:0C:5A:F3:37:37:A2:8E"
      ]
    }
  }
]
```

> ⚠️ **Importante:** Se você assinar seu app com uma Keystore própria diferente ou usar a Assinatura de Apps do Google Play (*Play App Signing*), você deve substituir o código hexadecimal SHA-256 acima pela chave fornecida pelo Google Play Console.

---

## 4. Configuração do Servidor Web / Hostinger (`.htaccess`)

Para que os servidores do Google consigam ler o `assetlinks.json` sem falhas de cache ou redirecionamento:

1. **Localização na Hostinger:**  
   Copie a pasta `.well-known` para a raiz do seu site:
   ```text
   public_html/
   ├── .well-known/
   │   └── assetlinks.json
   ├── index.html
   ├── .htaccess
   └── assets/
   ```

2. **Regras de Cabeçalho no `.htaccess` (Já configuradas neste projeto):**
   ```apache
   # Evita cache do assetlinks para validação instantânea pelo Google
   <FilesMatch "(assetlinks\.json)$">
     Header set Cache-Control "no-cache, no-store, must-revalidate"
     Header set Content-Type "application/json; charset=utf-8"
     Header set Access-Control-Allow-Origin "*"
   </FilesMatch>
   ```

3. **Como Testar se Está Funcionando:**
   Abra no seu navegador:
   `https://seumotoclube.com.br/.well-known/assetlinks.json`
   - O arquivo deve abrir exibindo o código JSON puro.
   - O endereço não pode redirecionar para a página inicial (se redirecionar, revise as regras de URL rewrite do `.htaccess`).

---

## 5. Auditoria de Conformidade em 1 Comando

O projeto inclui um script automatizado que audita 16 requisitos obrigatórios do Google para TWA:
```bash
npm run twa:verify
```
Este comando valida:
- Existência e validade sintática do manifesto (`public/manifest.webmanifest`).
- Configuração de `display: standalone` e `start_url: /`.
- Ícones obrigatórios (192x192, 512x512 e maskable adaptativo).
- Atalhos rápidos na tela inicial (*shortcuts* de Carteirinha, Mensalidades, Frota e SOS).
- Formatação exata do `.well-known/assetlinks.json`.
- Cabeçalhos de cache e MIME types no `.htaccess`.

---

## 6. Passo a Passo para Gerar o Pacote `.aab` da Play Store

### Opção A: Usando o Script Automatizado do Projeto
Execute no terminal:
```bash
npm run twa:setup
```
O script fará o download da CLI oficial `@bubblewrap/cli`, criará o ambiente de compilação em `build-twa/` e gerará o arquivo `app-release-bundle.aab`.

---

### Opção B: Manual via Terminal com o Bubblewrap Oficial do Google

#### Passo 1: Instalar o Bubblewrap
```bash
npm install -g @bubblewrap/cli
```

#### Passo 2: Inicializar com o Manifesto do Projeto
```bash
bubblewrap init --manifest="https://seumotoclube.com.br/manifest.webmanifest"
```

Parâmetros recomendados para preenchimento:
| Campo | Valor Recomendado |
| :--- | :--- |
| **App Name** | `Iron Side Road Rider M.C.` |
| **Short Name** | `Iron Side` |
| **Package ID** | `br.com.ironsidemc.app` |
| **Display Mode** | `standalone` |
| **Theme Color** | `#09090b` |
| **Background Color** | `#09090b` |
| **Keystore Path** | `./android.keystore` |
| **Key Alias** | `android` |

#### Passo 3: Compilar o Pacote
```bash
bubblewrap build
```
O arquivo gerado é:
```text
./app-release-bundle.aab
```

#### Passo 4: Extrair o Fingerprint SHA-256 da sua Keystore
```bash
keytool -list -v -keystore android.keystore -alias android
```
Procure a linha **SHA-256** (exemplo: `14:6D:E9:D6:...`). Copie essa linha e cole dentro do `public/.well-known/assetlinks.json`.

---

## 7. Publicando no Google Play Console

1. Acesse o [Google Play Console](https://play.google.com/console).
2. Clique em **Criar app**:
   - **Nome do app:** `Iron Side Road Rider M.C.`
   - **Idioma:** Português (Brasil).
   - **Classificação:** Gratuito / App.
3. Acesse **Versão ➔ Produção ➔ Criar nova versão**:
   - Faça upload do arquivo `app-release-bundle.aab`.
   - Nome da versão: `1.2.1`.
   - Notas da versão: *"Lançamento oficial do aplicativo Iron Side Road Rider M.C. Carteirinha digital de associado, gestão de frota, pagamentos e apoio em viagens."*
4. **Assinatura de Apps do Google Play (Play App Signing):**
   - Acesse **Configuração ➔ Integridade do app**.
   - Na seção **Certificado de chave de assinatura de app**, copie a **Impressão digital do certificado SHA-256**.
   - **Crucial:** Certifique-se de que essa impressão digital do Google também esteja presente no array `sha256_cert_fingerprints` do seu arquivo `assetlinks.json`! Você pode manter múltiplas chaves no array (sua chave local de teste e a chave oficial de produção do Google).
5. Preencha a ficha da loja com os ícones de 512x512 e screenshots do celular.
6. Envie para revisão. O Google costuma aprovar em 2 a 5 dias úteis.

---

## 8. Diagnóstico de Problemas (Troubleshooting)

### A barra de URL do navegador ainda aparece ao abrir o app instalado:
1. **Verifique o link direto:** No Chrome do celular, abra `https://seumotoclube.com.br/.well-known/assetlinks.json`. Certifique-se de que não há erro 404, 403 ou redirecionamento para HTTP.
2. **Confirme o SHA-256:** Se você ativou o Play App Signing, a chave que assina o app instalado pelo usuário é a chave do Google Play Console, não a sua keystore local. Adicione a chave do Google no `assetlinks.json`.
3. **Limpe o cache do Chrome no celular:** No Android, vá em Configurações ➔ Aplicativos ➔ Chrome ➔ Armazenamento ➔ Limpar Cache. Desinstale e reinstale o app do motoclube.
4. **Validador Oficial do Google:** Acesse [Google Digital Asset Links Tester](https://developers.google.com/digital-asset-links/tools/generator) e insira seu domínio e package name para verificar se a Google reconhece o vínculo.
