# Guia Oficial de Hospedagem na Hostinger, Instalador Windows e APK Android
### Iron Side Road Rider M.C. — Gestão Integrada & Estrada

---

## 1. Condição de Atualização Automática a Cada Modificação do Sistema

Toda vez que você fizer qualquer alteração no sistema (código, layout, formulários, banco de dados ou regras), o sistema possui uma **condição de detecção de nova versão em tempo real**:

### Como o Sistema Funciona:
1. **Controle de Versão:**
   - O arquivo `public/version.json` guarda a versão atual, número da compilação (`buildNumber`), data e notas de atualização (`changelog`).
   - O script `useVersionCheck.ts` monitora esse arquivo via requisições HTTP automáticas a cada 2 minutos e toda vez que o associado abre ou volta para o aplicativo.
   - O Service Worker do PWA (`sw.js`) também detecta arquivos modificados através de seus hashes únicos gerados pelo Vite.
2. **Atualização em 1 Comando:**
   - Para incrementar a versão após qualquer alteração, execute no terminal:
     ```bash
     npm run bump
     ```
     *(Isso incrementa automaticamente a versão no `package.json`, `public/version.json` e no código).*
   - Em seguida, compile o projeto:
     ```bash
     npm run build
     ```
3. **Notificação Instantânea no Celular e Computador:**
   - Ao subir os novos arquivos na Hostinger, o cabeçalho `Cache-Control: no-cache` configurado no `.htaccess` garante que o servidor entregue imediatamente o novo `version.json` e `sw.js`.
   - O aplicativo exibe automaticamente o banner flutuante no topo:
     > **"Atualização Disponível! v1.2.x"**
     > *Uma nova versão do sistema com melhorias e correções está pronta para uso.*
   - Ao clicar em **"Atualizar Agora"**, o cache local é renovado e o sistema recarrega instantaneamente com todas as novidades!

---

## 2. O Caminho para Hospedar na Hostinger

O sistema é 100% estático no frontend (HTML, Tailwind CSS, React e Service Worker) e consome o banco de dados em nuvem Google Cloud Firestore. Portanto, roda perfeitamente em **qualquer plano de hospedagem da Hostinger** (Single, Premium, Business, Cloud ou VPS).

### Caminho de Pastas na Hostinger:
No Gerenciador de Arquivos do **hPanel** da Hostinger, o caminho absoluto do seu site é:
```text
/home/uXXXXXXXXX/domains/seumotoclube.com.br/public_html/
```

### Passo a Passo de Publicação na Hostinger:
1. **Compilar a Aplicação:**
   No seu computador ou ambiente de desenvolvimento, execute:
   ```bash
   npm run build
   ```
   Isso criará a pasta `dist/` com todos os arquivos prontos.

2. **Upload para a Hostinger:**
   - Acesse o painel da Hostinger (**hPanel** ➔ `hpanel.hostinger.com`).
   - Vá em **Sites** ➔ clique em **Gerenciar** no seu domínio.
   - No menu lateral, clique em **Gerenciador de Arquivos** (File Manager).
   - Abra a pasta **`public_html`**.
   - Envie todos os arquivos de **dentro** da pasta `dist/` para a raiz da `public_html`:
     ```text
     public_html/
     ├── index.html
     ├── .htaccess
     ├── version.json
     ├── manifest.webmanifest
     ├── sw.js
     ├── assets/ (js, css, imagens)
     └── downloads/ (pasta para o Setup Windows e APK)
     ```

3. **Arquivo `.htaccess` (Configuração Apache):**
   O arquivo `.htaccess` já está incluído na compilação e é copiado para `public_html/`. Ele garante duas coisas vitais:
   - **Roteamento SPA:** Evita erro 404 ao navegar ou recarregar qualquer tela diretamente.
   - **No-Cache para Atualizações:** Força o navegador a verificar novas versões sem prender cache antigo.

4. **Ativação de SSL Grátis (HTTPS Obrigatório):**
   - No hPanel, vá em **Segurança** ➔ **SSL**.
   - Ative o **Certificado SSL Grátis Let's Encrypt**.
   - *Importante:* O HTTPS é obrigatório para que a câmera (leitura de CRLV e fotos de motos), geolocalização do SOS e o Service Worker funcionem no celular.

---

## 3. Caminho e Disponibilização do Setup para Instalação Windows

Para diretores e associados que utilizam computadores e notebooks Windows, você pode disponibilizar o instalador no seu próprio site.

### Onde hospedar na Hostinger:
Crie a pasta `downloads` dentro de `public_html`:
```text
public_html/downloads/IronSide_Setup_Windows.exe
```

O link direto para os integrantes baixarem será:
```text
https://seumotoclube.com.br/downloads/IronSide_Setup_Windows.exe
```

### Como Gerar o Setup para Windows:

#### Método A (Recomendado — Oficial da Microsoft):
1. Acesse **[pwabuilder.com](https://www.pwabuilder.com)**;
2. Digite a URL do seu site na Hostinger (ex: `https://seumotoclube.com.br`);
3. Clique em **"Package for Windows"**;
4. O PWABuilder gerará o pacote instalador do Windows (`.msix` / `.exe`) pronto para distribuição no Windows 10 e Windows 11;
5. Suba esse arquivo para a pasta `public_html/downloads/`.

#### Método B (Instalação Nativa via Chrome / Microsoft Edge):
1. O integrante abre o site no Google Chrome ou Microsoft Edge no Windows;
2. Clica no ícone de **"Instalar Aplicativo"** na barra de endereços (ou menu `...` ➔ *Instalar Iron Side Road Rider M.C.*);
3. O Windows cria automaticamente o atalho no **Menu Iniciar**, **Área de Trabalho** e na **Barra de Tarefas**, funcionando como um software nativo de janela própria.

#### Método C (Script Batch / Instalador Automático de 1 Clique):
Na aba **Hospedagem Hostinger & APK** dentro do sistema, você pode clicar em **"Baixar Script Instalador (.bat)"**, que cria instantaneamente o atalho oficial com ícone na Área de Trabalho do Windows de qualquer integrante.

---

## 4. Caminho e Disponibilização do APK para Celulares Android

Para associados que desejam instalar o aplicativo no celular Android sem passar pela Google Play Store.

### Onde hospedar na Hostinger:
Coloque o arquivo `.apk` na mesma pasta de downloads:
```text
public_html/downloads/IronSide_MC.apk
```

O link direto oficial para os associados baixarem no celular será:
```text
https://seumotoclube.com.br/downloads/IronSide_MC.apk
```

### Como Gerar o Arquivo `.apk`:

#### Método A (Ferramenta Oficial do Google — Bubblewrap):
O Google disponibiliza a ferramenta de linha de comando `bubblewrap` que transforma o PWA em um APK Android nativo assinado:
```bash
# 1. Instalar a ferramenta do Google
npm install -g @bubblewrap/cli

# 2. Inicializar com a URL da Hostinger
bubblewrap init --manifest="https://seumotoclube.com.br/manifest.webmanifest"

# 3. Compilar o APK
bubblewrap build
```
O arquivo `app-release-signed.apk` gerado pode ser renomeado para `IronSide_MC.apk` e enviado para `public_html/downloads/`.

#### Método B (PWABuilder — Sem linha de comando):
1. Acesse **[pwabuilder.com](https://www.pwabuilder.com)**;
2. Insira a URL do seu site na Hostinger;
3. Clique em **"Package for Android"**;
4. Baixe o arquivo APK gerado e suba na Hostinger.

### Como o Associado Instala no Celular:
1. O associado abre o link `https://seumotoclube.com.br/downloads/IronSide_MC.apk` no navegador do celular;
2. Ao terminar o download, o Android pergunta: *"Deseja instalar este aplicativo?"* (se necessário, autorizar "Fontes Desconhecidas");
3. O app é instalado na grade de aplicativos do celular com o escudo oficial do Iron Side, funcionando 100% offline nas viagens e estradas!

---

## 5. Resumo Rápido para o Administrador

| Item | Caminho na Hostinger | Ação |
|---|---|---|
| **Site Principal** | `public_html/` | Subir o conteúdo de `dist/` após `npm run build` |
| **Setup Windows** | `public_html/downloads/IronSide_Setup_Windows.exe` | Disponibilizar para diretores no Windows |
| **APK Celular** | `public_html/downloads/IronSide_MC.apk` | Disponibilizar para integrantes no Android |
| **Atualização** | Executar `npm run bump` | Atualiza a versão e notifica todos os aparelhos |
