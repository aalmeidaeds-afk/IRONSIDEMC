# Guia Completo de Publicação: Google Play Store (TWA) & Apple App Store (iOS)
### Iron Side Road Rider M.C. — Sistema Integrado de Gestão & Estrada

---

## 🎯 Visão Geral da Arquitetura Nativa

Este sistema foi projetado com uma arquitetura **PWA de Alto Desempenho (Progressive Web App)** integrada ao **Google Cloud Firestore**. Para que ele apareça e funcione como um aplicativo 100% nativo para os associados nas duas maiores lojas do mundo:

1. **Google Play Store (Android):** Utiliza **Trusted Web Activity (TWA)** via **Bubblewrap (ferramenta oficial do Google)**.
   - **Comportamento Nativo:** Remove completamente a barra de endereço da web (*Chrome URL Bar*), permitindo execução em tela cheia idêntica a apps Kotlin/Java.
   - **Validação de Domínio:** Ocorre através do arquivo `.well-known/assetlinks.json` assinado com a chave digital (SHA-256) do aplicativo.
   - **Atualizações Automáticas:** Qualquer alteração no frontend ou backend reflete imediatamente no aplicativo instalado sem exigir novo upload no Play Console.

2. **Apple App Store (iOS):** Utiliza empacotamento com **Capacitor (Engine WKWebView Isolada)** ou **PWABuilder iOS Wrapper**.
   - **Comportamento Nativo:** Tela cheia sem controles do Safari, suporte completo a gestos do iOS, barra de status integrada e acesso à câmera para leitura de QR Code da carteirinha digital.
   - **Conformidade com Diretrizes da Apple (Guideline 4.2):** Inclui recursos nativos de emergência offline (SOS médico, tipo sanguíneo, contatos de apoio e carteirinha offline em cache).

---

## 📱 PARTE 1: Publicação no Google Play Store com TWA (Trusted Web Activity)

### 1.1 Pré-requisitos
1. **Conta de Desenvolvedor Google Play:** Taxa única de $25 USD no [Google Play Console](https://play.google.com/console).
2. **Domínio com HTTPS ativo e certificado SSL válido:** (ex: `https://seumotoclube.com.br`).
3. **Node.js (v18+) e Java JDK 17+** instalados no computador de build.

---

### 1.2 Passo a Passo com a Ferramenta Oficial do Google (Bubblewrap CLI)

#### Passo 1: Instalação da CLI Bubblewrap
Abra o terminal e execute:
```bash
npm install -g @bubblewrap/cli
```

#### Passo 2: Inicializar o Projeto TWA a partir do Manifesto
Execute no terminal apontando para a URL do seu sistema publicado:
```bash
bubblewrap init --manifest="https://seumotoclube.com.br/manifest.webmanifest"
```
O Bubblewrap fará o download do manifesto e perguntará os parâmetros principais:
- **Application name:** `Iron Side Road Rider M.C.`
- **Short name:** `Iron Side`
- **Application ID (Package Name):** `br.com.ironsidemc.app`
- **Start URL:** `/`
- **Display mode:** `standalone`
- **Theme color:** `#09090b` (Preto Zinc 950)
- **Background color:** `#09090b`
- **Signing key (Keystore):** Escolha criar uma nova chave segura (`android.keystore`). Guarde o caminho e a senha!

#### Passo 3: Compilar o Android App Bundle (.aab)
Gere o pacote otimizado para o Google Play:
```bash
bubblewrap build
```
O arquivo gerado será:
```text
./app-release-bundle.aab
```

---

### 1.3 Configuração Obrigatória do Digital Asset Links (Ativação do Modo Nativo)

> ⚠️ **Atenção Crítica:** Para o aplicativo abrir **SEM NENHUMA BARRA DE NAVEGADOR** e ser reconhecido como app nativo verificado pelo Android, o arquivo `assetlinks.json` deve estar acessível publicamente no seu domínio.

#### 1. Como Obter a Chave SHA-256:
Se você gerou a keystore localmente via Bubblewrap:
```bash
keytool -list -v -keystore android.keystore -alias android -storepass SUA_SENHA
```
Localize a linha:
```text
Certificado SHA-256: 14:6D:E9:D6:0F:86:...:AA
```
*(Se você utilizar a Assinatura de Apps do Google Play, copie o SHA-256 fornecido em: Play Console ➔ Versão ➔ Integridade do App).*

#### 2. Criar e Publicar o Arquivo no Servidor:
O arquivo já foi configurado e criado neste projeto em:
```text
public/.well-known/assetlinks.json
```
Conteúdo:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "br.com.ironsidemc.app",
      "sha256_cert_fingerprints": [
        "COLE_AQUI_O_SEU_SHA256_FINGERPRINT_EM_MAIUSCULAS"
      ]
    }
  }
]
```
Na Hostinger, este arquivo deve residir em:
```text
public_html/.well-known/assetlinks.json
```
Teste no navegador: `https://seumotoclube.com.br/.well-known/assetlinks.json` (deve retornar `Content-Type: application/json` e código HTTP 200).

---

### 1.4 Envio no Google Play Console

1. No [Google Play Console](https://play.google.com/console), clique em **Criar app**.
2. Preencha:
   - **Nome:** `Iron Side Road Rider M.C.`
   - **Idioma padrão:** Português (Brasil)
   - **Tipo:** App
   - **Gratuito ou Pago:** Gratuito
3. Em **Configuração do App**, complete:
   - Política de Privacidade: URL pública (ex: `https://seumotoclube.com.br/#privacidade`).
   - Acesso ao App: "Algumas funcionalidades são restritas" (Forneça login de teste para a equipe de revisão do Google).
   - Classificação de Conteúdo: Questionário (Geralmente Livre / 10+).
   - Público-alvo: 18 anos ou mais (membros de motoclube).
4. Em **Presença na Loja Principal**:
   - Ícone de alta resolução: 512x512 PNG.
   - Gráfico de recursos: 1024x500 PNG.
   - Capturas de tela: Mínimo de 4 prints de celular (Dashboard, Carteirinha Digital, Gestão de Frota, Financeiro).
5. Em **Produção** ➔ **Criar nova versão**:
   - Faça upload do arquivo `app-release-bundle.aab`.
   - Adicione notas da versão: "Lançamento oficial do aplicativo Iron Side Road Rider M.C. Gestão de frota, carteirinha digital e estrada."
   - Clique em **Revisar e Lançar para Produção**.

---

## 🍎 PARTE 2: Publicação na Apple App Store (iOS)

### 2.1 Pré-requisitos
1. **Apple Developer Program:** Inscrição em [developer.apple.com](https://developer.apple.com) ($99 USD/ano).
2. **Computador Mac (macOS)** com o **Xcode** instalado (ou uso do serviço de build na nuvem via GitHub Actions / Codemagic).

---

### 2.2 Estratégia de Aprovação na Apple (Guideline 4.2 - Minimum Functionality)
A Apple exige que aplicativos empacotados a partir da web ofereçam valor além de um simples "espelho de site". O aplicativo do Iron Side Road Rider M.C. já possui os diferenciais técnicos necessários para aprovação:
- **Carteirinha Digital com QR Code Dinâmico e Cache Offline:** Funciona mesmo em viagens em áreas remotas e sem sinal 4G/5G.
- **Ficha Médica de Emergência (SOS):** Acesso instantâneo a tipo sanguíneo, alergias e contatos de socorro sem conexão.
- **Biometria Nativa (FaceID / TouchID):** Autenticação segura e instantânea no login e acesso à carteirinha.
- **Controle de Câmera:** Leitor de QR Code para validação de ingressos e eventos do motoclube.

---

### 2.3 Passo a Passo com Capacitor (Recomendado pela Apple)

#### Passo 1: Inicializar o Capacitor no Projeto
No diretório do projeto, execute:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "Iron Side M.C." "br.com.ironsidemc.app" --web-dir dist
```

#### Passo 2: Configurar o `capacitor.config.json`
Certifique-se de que a configuração aponte para o servidor de produção com suporte offline:
```json
{
  "appId": "br.com.ironsidemc.app",
  "appName": "Iron Side M.C.",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "url": "https://seumotoclube.com.br",
    "cleartext": false
  },
  "ios": {
    "contentInset": "always",
    "allowsLinkPreview": false,
    "scrollEnabled": true
  }
}
```

#### Passo 3: Adicionar a Plataforma iOS e Abrir no Xcode
```bash
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

#### Passo 4: Configurações Críticas no Xcode (`Info.plist`)
Abra o arquivo `App/Info.plist` no Xcode e certifique-se de declarar as permissões e comportamento em tela cheia:

```xml
<key>NSCameraUsageDescription</key>
<string>O aplicativo utiliza a câmera para leitura de QR Code da carteirinha digital e validação de membros em eventos.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Permite anexar comprovantes de pagamento PIX e fotos da motocicleta para a ficha cadastral.</string>
<key>NSFaceIDUsageDescription</key>
<string>Permite autenticação biométrica rápida e segura com Face ID para acesso à carteirinha digital.</string>
<key>UIStatusBarHidden</key>
<true/>
<key>UIViewControllerBasedStatusBarAppearance</key>
<false/>
```

#### Passo 5: Geração dos Ícones e Assets para iOS
No Xcode:
- Abra `App` ➔ `Assets` ➔ `AppIcon`.
- Forneça o ícone mestre de **1024x1024 px PNG** (sem transparência).
- O Xcode gerará automaticamente todos os tamanhos para iPhone e iPad.

---

### 2.4 Submissão no App Store Connect

1. Acesse [appstoreconnect.apple.com](https://appstoreconnect.apple.com) com sua conta Apple Developer.
2. Clique no botão **"+"** ➔ **Novo App**:
   - **Plataforma:** iOS
   - **Nome:** `Iron Side Road Rider M.C.`
   - **Idioma:** Português (Brasil)
   - **ID do Pacote (Bundle ID):** `br.com.ironsidemc.app`
   - **SKU:** `IRONSIDE-APP-01`
3. Preencha as Informações da Versão:
   - **Texto Promocional e Descrição:** Destacar a carteirinha digital dos membros, gestão de frota, comboios e socorro rodoviário.
   - **Palavras-chave:** `motoclube, road rider, carteirinha digital, motociclismo, iron side`
   - **URL de Suporte:** Link de contato da diretoria.
   - **URL da Política de Privacidade:** Obrigatório pela Apple.
4. Upload do Build:
   - No Xcode, selecione o target **Any iOS Device (arm64)**.
   - Vá no menu superior: **Product** ➔ **Archive**.
   - Concluído o build, clique em **Distribute App** ➔ **App Store Connect** ➔ **Upload**.
5. Informações para a Equipe de Revisão da Apple (*App Review Information*):
   - **Login e Senha de Teste:** Forneça um e-mail e senha de associado para a equipe da Apple poder entrar no sistema e testar todas as funcionalidades.
   - **Notas explicativas:** "Aplicativo oficial para membros do Iron Side Road Rider M.C., com carteirinha digital offline e controle de estrada."
6. Envie para Análise (**Submit for Review**). O tempo médio de aprovação varia entre 24 e 48 horas.

---

## 🛠️ Resumo Comparativo das Duas Lojas

| Recurso | Google Play Store (TWA) | Apple App Store (iOS) |
| :--- | :--- | :--- |
| **Tecnologia Principal** | Trusted Web Activity (Chrome Custom Tabs) | Capacitor / WKWebView Nativo |
| **Custo de Licença** | $25 USD (taxa única permanente) | $99 USD (anual) |
| **Atualização de Código** | Instantânea (via servidor Web/Hostinger) | Instantânea via Web (exceto se mudar permissões nativas) |
| **Remoção da Barra de URL** | Sim, via `.well-known/assetlinks.json` | Sim, nativamente tela cheia |
| **Tempo Médio de Revisão** | 2 a 5 dias | 24 a 48 horas |
| **Suporte a Biometria** | WebAuthn / Android Fingerprint | Face ID / Touch ID / WebAuthn |
