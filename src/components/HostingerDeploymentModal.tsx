import React, { useState } from 'react';
import {
  Server,
  Download,
  Smartphone,
  Monitor,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Terminal,
  FileCode,
  FolderArchive,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  X,
  ChevronRight,
  Layers,
  ArrowRight,
  CheckCircle2,
  Share2,
  Play,
  Apple,
  Store,
  Globe,
  Key,
  Shield,
  FileCheck2,
  Info,
} from 'lucide-react';
import { useVersionCheck, CURRENT_APP_VERSION } from '../hooks/useVersionCheck';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type DeploymentTab = 'playstore' | 'appstore' | 'hostinger' | 'windows' | 'apk' | 'versao';

export const HostingerDeploymentModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    currentVersion,
    latestVersion,
    latestInfo,
    hasUpdate,
    checking,
    lastChecked,
    checkForUpdates,
    applyUpdate,
    simulateUpdateNotification,
  } = useVersionCheck();

  const [activeTab, setActiveTab] = useState<DeploymentTab>('playstore');
  const [copiedHtaccess, setCopiedHtaccess] = useState(false);
  const [copiedBubblewrap, setCopiedBubblewrap] = useState(false);
  const [copiedAssetlinks, setCopiedAssetlinks] = useState(false);
  const [copiedCapacitor, setCopiedCapacitor] = useState(false);
  const [copiedInfoPlist, setCopiedInfoPlist] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [simulatedTriggered, setSimulatedTriggered] = useState(false);

  // Dynamic parameters for TWA & Digital Asset Links
  const [packageName, setPackageName] = useState('br.com.ironsidemc.app');
  const [sha256Fingerprint, setSha256Fingerprint] = useState(
    '14:6D:E9:D6:0F:86:79:86:E6:44:24:B4:49:F7:18:A8:B4:E6:61:A2:43:21:65:B2:91:0C:5A:F3:37:37:A2:8E'
  );
  const [customDomain, setCustomDomain] = useState('https://seumotoclube.com.br');

  if (!isOpen) return null;

  // Real-time generated assetlinks.json content
  const generatedAssetlinksJson = JSON.stringify(
    [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: packageName.trim(),
          sha256_cert_fingerprints: [sha256Fingerprint.trim().toUpperCase()],
        },
      },
    ],
    null,
    2
  );

  const htaccessCode = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Caches e PWA - Garante atualização instantânea de novas versões e TWA
<IfModule mod_headers.c>
  <FilesMatch "(sw\\.js|registerSW\\.js|manifest\\.webmanifest|version\\.json|assetlinks\\.json)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
    Header set Access-Control-Allow-Origin "*"
  </FilesMatch>
  <FilesMatch "\\.(js|css|woff2|png|jpg|svg|ico)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
  </FilesMatch>
</IfModule>

# Digital Asset Links - MIME type correto para TWA no Google Play
<Files "assetlinks.json">
  ForceType application/json
  Header set Content-Type "application/json"
</Files>`;

  const bubblewrapCommand = `# 1. Instalar ferramenta oficial do Google Chrome Team (Node.js)
npm install -g @bubblewrap/cli

# 2. Inicializar o projeto com a URL e Manifesto da Hostinger
bubblewrap init --manifest="${customDomain.trim()}/manifest.webmanifest"

# 3. Durante o assistente interativo:
# - Nome do Pacote: ${packageName.trim()}
# - Keystore: o assistente criará a sua chave de assinatura segura (android.keystore)

# 4. Compilar o Android App Bundle (.aab) para a Google Play Store
bubblewrap build

# O arquivo gerado 'app-release-bundle.aab' estará pronto para envio na Play Store!`;

  const keytoolCommand = `# Comando para extrair o SHA-256 da Keystore gerada:
keytool -list -v -keystore android.keystore -alias android -storepass seupassword

# Copie a linha que inicia com "SHA256: ..." e cole no seu assetlinks.json`;

  const twaScriptContent = `#!/usr/bin/env bash
# Script de Configuração & Compilação Automática do TWA para a Google Play Store
# Iron Side Road Rider M.C. - Dinastia System
set -e

echo "=================================================================="
echo "  Iniciando Preparação do TWA para Google Play Store"
echo "  Iron Side Road Rider M.C."
echo "=================================================================="

npm install -g @bubblewrap/cli
mkdir -p build-twa
cd build-twa

if [ -f "../scripts/twa-manifest.json" ]; then
    cp ../scripts/twa-manifest.json ./twa-manifest.json
    bubblewrap update
else
    bubblewrap init --manifest="${customDomain.trim()}/manifest.webmanifest"
fi

bubblewrap build
echo "Sucesso! Arquivo gerado: build-twa/app-release-bundle.aab"
`;

  const twaManifestContent = JSON.stringify(
    {
      packageId: packageName.trim(),
      host: customDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim(),
      name: 'Iron Side Road Rider M.C.',
      launcherName: 'Iron Side',
      themeColor: '#09090B',
      navigationColor: '#09090B',
      navigationColorDark: '#09090B',
      navigationDividerColor: '#F59E0B',
      backgroundColor: '#09090B',
      enableNotifications: true,
      startUrl: '/',
      iconUrl: `${customDomain.trim()}/pwa-512x512.png`,
      maskableIconUrl: `${customDomain.trim()}/pwa-maskable-512x512.png`,
      splashScreenFadeOutDuration: 300,
      signingKey: {
        path: './android.keystore',
        alias: 'android',
      },
      appVersionName: currentVersion,
      appVersionCode: 1,
      shortcuts: [
        {
          name: 'Carteirinha Digital',
          shortName: 'Carteirinha',
          url: '/?tab=carteirinha',
        },
        {
          name: 'Mensalidades & PIX',
          shortName: 'Mensalidades',
          url: '/?tab=mensalidades',
        },
        {
          name: 'Frota do Clube',
          shortName: 'Frota',
          url: '/?tab=veiculos',
        },
        {
          name: 'Emergência SOS Estrada',
          shortName: 'SOS',
          url: '/?tab=sos',
        },
      ],
      features: {
        locationDelegation: { enabled: true },
        playBilling: { enabled: false },
      },
      orientation: 'portrait',
    },
    null,
    2
  );

  const capacitorCommands = `# 1. Instalar o Capacitor no projeto
npm install @capacitor/core @capacitor/cli @capacitor/ios

# 2. Inicializar o aplicativo iOS
npx cap init "Iron Side M.C." "${packageName.trim().replace('app', 'ios')}"

# 3. Adicionar o projeto nativo iOS para Xcode
npx cap add ios

# 4. Copiar o build estático para dentro do projeto iOS
npm run build
npx cap copy ios

# 5. Abrir o projeto no Xcode (no macOS)
npx cap open ios`;

  const infoPlistSnippet = `<!-- Adicionar dentro da tag <dict> no arquivo Info.plist no Xcode -->
<key>NSCameraUsageDescription</key>
<string>O aplicativo necessita de acesso à câmera para leitura do documento CRLV da moto e fotos oficiais de perfil dos integrantes.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Permite ao integrante selecionar fotos da motocicleta e comprovantes de mensalidade diretamente da galeria.</string>

<key>UIStatusBarHidden</key>
<true/>

<key>UIViewControllerBasedStatusBarAppearance</key>
<false/>

<key>ITSAppUsesNonExemptEncryption</key>
<false/>`;

  const windowsBatScript = `@echo off
echo ========================================================
echo   Instalador Iron Side Road Rider M.C. - Windows
echo ========================================================
echo.
echo Criando atalho oficial do sistema na Area de Trabalho...
set "TARGET_URL=${customDomain.trim()}"
set "SHORTCUT=%USERPROFILE%\\Desktop\\Iron Side Road Rider MC.url"

echo [InternetShortcut] > "%SHORTCUT%"
echo URL=%TARGET_URL% >> "%SHORTCUT%"
echo IconFile=%USERPROFILE%\\AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe >> "%SHORTCUT%"
echo IconIndex=0 >> "%SHORTCUT%"

echo.
echo [SUCESSO] Atalho criado na sua Area de Trabalho!
echo Voce tambem pode abrir o sistema no Microsoft Edge ou Chrome
echo e clicar no menu ... 'Instalar este site como aplicativo'.
echo.
pause
`;

  const handleCopyHtaccess = () => {
    navigator.clipboard.writeText(htaccessCode);
    setCopiedHtaccess(true);
    setTimeout(() => setCopiedHtaccess(false), 2000);
  };

  const handleCopyBubblewrap = () => {
    navigator.clipboard.writeText(bubblewrapCommand);
    setCopiedBubblewrap(true);
    setTimeout(() => setCopiedBubblewrap(false), 2000);
  };

  const handleCopyAssetlinks = () => {
    navigator.clipboard.writeText(generatedAssetlinksJson);
    setCopiedAssetlinks(true);
    setTimeout(() => setCopiedAssetlinks(false), 2000);
  };

  const handleCopyCapacitor = () => {
    navigator.clipboard.writeText(capacitorCommands);
    setCopiedCapacitor(true);
    setTimeout(() => setCopiedCapacitor(false), 2000);
  };

  const handleCopyInfoPlist = () => {
    navigator.clipboard.writeText(infoPlistSnippet);
    setCopiedInfoPlist(true);
    setTimeout(() => setCopiedInfoPlist(false), 2000);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const downloadFile = (filename: string, content: string, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTestUpdate = () => {
    simulateUpdateNotification('1.2.1');
    setSimulatedTriggered(true);
    setTimeout(() => setSimulatedTriggered(false), 4000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-5xl rounded-t-3xl sm:rounded-3xl bg-zinc-900 border-t border-amber-500/40 sm:border sm:border-zinc-800 shadow-[0_-10px_40px_rgba(0,0,0,0.85)] sm:shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh] text-zinc-100 overflow-hidden pb-safe"
      >
        {/* Mobile Drag / Touch Handle */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700/80 mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Publicação Oficial: Google Play (TWA), Apple App Store &amp; Hostinger
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  v{currentVersion}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Guia e automações para publicar na Google Play Store via TWA nativo, Apple App Store, Hostinger e Windows
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-4 sm:px-6 gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('playstore')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'playstore'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            1. Google Play Store (TWA Nativo)
          </button>

          <button
            onClick={() => setActiveTab('appstore')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'appstore'
                ? 'border-sky-400 text-sky-400 bg-sky-500/10 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Apple className="w-4 h-4" />
            2. Apple App Store (iOS)
          </button>

          <button
            onClick={() => setActiveTab('hostinger')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'hostinger'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Server className="w-4 h-4" />
            3. Hospedar na Hostinger
          </button>

          <button
            onClick={() => setActiveTab('windows')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'windows'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            4. Setup Windows (.exe)
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'apk'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            5. APK Celulares Direto
          </button>

          <button
            onClick={() => setActiveTab('versao')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'versao'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            6. Atualizações em Tempo Real
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: GOOGLE PLAY STORE VIA TWA */}
          {activeTab === 'playstore' && (
            <div className="space-y-6">
              {/* Highlight Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-zinc-950 border border-emerald-500/40 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div className="text-xs text-zinc-300 space-y-1.5">
                  <p className="font-bold text-emerald-300 text-sm">
                    TWA (Trusted Web Activity) — Publicação Nativa Oficial no Google Play
                  </p>
                  <p className="leading-relaxed">
                    O <strong>Trusted Web Activity (TWA)</strong> é o padrão oficial desenvolvido pelo Google para transformar PWAs em aplicativos de alto desempenho na Google Play Store. O app abre diretamente em <strong>tela cheia sem barra de endereço/URL do navegador</strong>, possui ícone nativo na gaveta de aplicativos do Android, splash screen e acesso à câmera e arquivos.
                  </p>
                  <p className="text-emerald-400/90 font-semibold">
                    Vantagem exclusiva: Toda vez que você subir uma atualização na Hostinger, o app na Google Play Store atualiza automaticamente para todos os associados sem precisar passar por nova aprovação na loja!
                  </p>
                </div>
              </div>

              {/* Seção 1: O Segredo do TWA - Digital Asset Links */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    Requisito Mandatório: Handshake Digital Asset Links (.well-known/assetlinks.json)
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Remove a barra de URL
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Para que o Android remova completamente a barra de URL e execute seu aplicativo em <strong>modo 100% nativo de tela cheia</strong>, o Google exige um arquivo de verificação criptográfica hospedado no seu domínio: <code>https://seumotoclube.com.br/.well-known/assetlinks.json</code>.
                </p>

                {/* Live Parameters Editor */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Package ID do App Android:</label>
                    <input
                      type="text"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-amber-300 font-mono text-xs focus:border-amber-500"
                    />
                    <span className="text-[10px] text-zinc-500">Ex: br.com.ironsidemc.app</span>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Domínio HTTPS Oficial:</label>
                    <input
                      type="text"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-sky-300 font-mono text-xs focus:border-sky-500"
                    />
                    <span className="text-[10px] text-zinc-500">Com https:// e sem barra no fim</span>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">SHA-256 Fingerprint (Keystore):</label>
                    <input
                      type="text"
                      value={sha256Fingerprint}
                      onChange={(e) => setSha256Fingerprint(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-emerald-300 font-mono text-xs focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-zinc-500">Da chave de release ou Play Signing</span>
                  </div>
                </div>

                {/* Assetlinks.json Preview & Copy */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-400">
                      Arquivo gerado: <strong>/.well-known/assetlinks.json</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyAssetlinks}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
                      >
                        {copiedAssetlinks ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                        {copiedAssetlinks ? 'Copiado!' : 'Copiar JSON'}
                      </button>
                      <button
                        onClick={() => downloadFile('assetlinks.json', generatedAssetlinksJson, 'application/json')}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Baixar assetlinks.json
                      </button>
                    </div>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                    {generatedAssetlinksJson}
                  </pre>

                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                    <p className="font-semibold text-zinc-200">
                      Onde colocar na Hostinger:
                    </p>
                    <p className="font-mono text-amber-300 text-[11px]">
                      /public_html/.well-known/assetlinks.json
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      <em>Nota: O arquivo já foi criado na pasta <code>public/.well-known/assetlinks.json</code> do projeto e vai automaticamente para a pasta <code>dist/</code> ao compilar. O arquivo <code>.htaccess</code> já está configurado para entregar o MIME-type <code>application/json</code> sem erros.</em>
                    </p>
                  </div>
                </div>
              </div>

              {/* Seção 2: Como Compilar o Pacote .aab para a Google Play */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
                  Compilar o Android App Bundle (.aab) com Bubblewrap CLI ou PWABuilder
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Opção A: Bubblewrap */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-emerald-400" />
                          Opção A: Bubblewrap CLI (Oficial Google)
                        </h5>
                        <button
                          onClick={handleCopyBubblewrap}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300"
                        >
                          {copiedBubblewrap ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
                          {copiedBubblewrap ? 'Copiado!' : 'Copiar Comandos'}
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400">
                        A ferramenta de linha de comando do Google empacota o PWA em um TWA nativo com suporte a biometria, splash screen e notificações:
                      </p>
                      <pre className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[10.5px] text-emerald-300 mt-2 max-h-48 overflow-y-auto">
                        {bubblewrapCommand}
                      </pre>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80">
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase block mb-1">
                        Obter o SHA-256 da sua Keystore:
                      </span>
                      <pre className="p-2 rounded bg-zinc-900 text-[10px] text-zinc-300 font-mono overflow-x-auto">
                        {keytoolCommand}
                      </pre>
                    </div>
                  </div>

                  {/* Opção B: PWABuilder Android */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
                    <div>
                      <h5 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Opção B: PWABuilder (Interface Gráfica 1 Clique)
                      </h5>
                      <p className="text-xs text-zinc-400 mt-2">
                        Projeto open-source da Microsoft e Google que empacota o PWA em TWA sem precisar do Android Studio instalado:
                      </p>
                      <ol className="list-decimal list-inside text-xs text-zinc-300 mt-2.5 space-y-1.5">
                        <li>Acesse <strong>pwabuilder.com</strong>;</li>
                        <li>Digite a URL da sua Hostinger (ex: <code>{customDomain}</code>);</li>
                        <li>Clique em <strong>Package for Stores</strong> ➔ <strong>Android</strong>;</li>
                        <li>Selecione <strong>Google Play Store (TWA)</strong>;</li>
                        <li>Informe o Package ID: <code>{packageName}</code>;</li>
                        <li>Baixe o arquivo <code>.zip</code> com o <code>app-release-bundle.aab</code> e a chave.</li>
                      </ol>
                    </div>

                    <a
                      href="https://www.pwabuilder.com"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir PWABuilder Oficial
                    </a>
                  </div>
                </div>
              </div>

              {/* Seção 3: Checklist do Google Play Console */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
                  Passo a Passo de Envio no Google Play Console
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <p className="font-bold text-zinc-200">Criar o App</p>
                    <p className="text-zinc-400 text-[11px]">
                      Acesse <strong>play.google.com/console</strong> (taxa única de $25). Clique em <strong>Criar app</strong>, defina o nome <em>Iron Side Road Rider M.C.</em>, tipo <em>App</em> e <em>Gratuito</em>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <p className="font-bold text-zinc-200">Ficha da Loja</p>
                    <p className="text-zinc-400 text-[11px]">
                      Envie o ícone de alta resolução (512x512 PNG), o banner de recursos (1024x500 PNG) e pelo menos 2 capturas de tela do celular.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <p className="font-bold text-zinc-200">Acesso &amp; Teste</p>
                    <p className="text-zinc-400 text-[11px]">
                      Em &ldquo;Acesso a apps&rdquo;, informe uma credencial de teste da diretoria (login: <code>DIRETORIA</code> / senha: <code>DIR202627</code>) para que o revisor do Google aprove o app.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      4
                    </div>
                    <p className="font-bold text-zinc-200">Upload do .aab</p>
                    <p className="text-zinc-400 text-[11px]">
                      Em <strong>Produção</strong> ou <strong>Teste Fechado</strong>, envie o arquivo <code>app-release-bundle.aab</code> e publique para distribuição para todos os associados!
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 flex items-center justify-between">
                  <span>
                    Após a aprovação, o app ficará disponível para qualquer pessoa instalar diretamente pela Play Store com visual 100% nativo.
                  </span>
                  <a
                    href="https://play.google.com/console"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ir para Google Play Console
                  </a>
                </div>
              </div>

              {/* Seção 4: Diretrizes da Google para Aplicativos de Alto Desempenho (Android Vitals & PWA Performance) */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">4</span>
                    Diretrizes da Google para Aplicativos de Alto Desempenho (Android Vitals)
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    100% em Conformidade
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Para que um TWA seja promovido e aprovado sem restrições na Google Play Store, o Google monitora métricas estritas de <strong>Android Vitals</strong> e <strong>Core Web Vitals</strong>. Nosso sistema foi arquitetado para superar todos os índices exigidos:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-200">Taxa de ANR &bull; Play Vitals</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">&lt; 0.47% (Meta Google)</span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">
                      A thread principal do JavaScript nunca bloqueia a interface. Renderização reativa ultrarrápida a 60 FPS garantida pelo React e Vite.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-200">Carregamento LCP &bull; Web Vitals</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">&lt; 2.5s (Aprovado)</span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">
                      Assets críticos e fontes cacheados no primeiro acesso pelo Service Worker. O app carrega instantaneamente mesmo em 3G/4G na estrada.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-200">Crash Rate &bull; Estabilidade</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">&lt; 1.09% (Meta Google)</span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">
                      Tratamento de exceções com Error Boundaries, modo de contingência offline no Firestore e persistência segura de sessão de login.
                    </p>
                  </div>
                </div>

                {/* Caixa de Recursos Nativos Inclusos */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs">
                  <span className="text-zinc-200 font-bold block">
                    Recursos Nativos Android Integrados no Manifesto:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                      <strong className="text-amber-400 block mb-0.5">Atalhos no Launcher</strong>
                      Toque longo no ícone abre direto a Carteirinha, Mensalidades ou SOS.
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                      <strong className="text-amber-400 block mb-0.5">Splash Screen Nativa</strong>
                      Transição suave com o brasão do clube e fundo preto profundo.
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                      <strong className="text-amber-400 block mb-0.5">Câmera de CRLV</strong>
                      Abertura direta da lente para leitura de documentos e fotografia.
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                      <strong className="text-amber-400 block mb-0.5">Teclado Responsivo</strong>
                      Evita sobreposição de campos em modais e formulários.
                    </div>
                  </div>
                </div>

                {/* Baixar Scripts de Automação */}
                <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-zinc-400">
                    Arquivos e scripts de automação prontos na pasta <code>scripts/</code> do projeto:
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadFile('twa-setup.sh', twaScriptContent, 'text/x-sh')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar twa-setup.sh
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFile('twa-manifest.json', twaManifestContent, 'application/json')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-amber-400 border border-amber-500/30 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar twa-manifest.json
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFile('assetlinks.json', generatedAssetlinksJson, 'application/json')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar assetlinks.json
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPLE APP STORE (iOS) */}
          {activeTab === 'appstore' && (
            <div className="space-y-6">
              {/* Highlight Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-950/70 to-zinc-950 border border-sky-500/40 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                  <Apple className="w-5 h-5" />
                </div>
                <div className="text-xs text-zinc-300 space-y-1.5">
                  <p className="font-bold text-sky-300 text-sm">
                    Apple App Store (iOS) — Empacotamento Nativo com WKWebView &amp; Swift
                  </p>
                  <p className="leading-relaxed">
                    No ecossistema da Apple, o motor de renderização obrigatório por contrato é o <strong>WebKit (WKWebView)</strong>. Para publicar o aplicativo na App Store com aparência 100% nativa (sem barra do Safari, com suporte a Dynamic Island, notch, câmera para CRLV e persistência offline), o PWA é encapsulado em um projeto nativo em Swift ou Capacitor.
                  </p>
                  <p className="text-sky-400/90 font-semibold">
                    Em conformidade com a Diretriz 4.2 da Apple: O app oferece recursos de valor real além de um site (cache de carteirinha offline para estrada, contatos de emergência e leitor de documentos).
                  </p>
                </div>
              </div>

              {/* Seção 1: Diretriz 4.2 da Apple (Como Garantir Aprovação Sem Rejeição) */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  Como Passar com Sucesso na Revisão Estrita da Apple (Guideline 4.2 - Minimum Functionality)
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  A equipe de revisão da Apple (App Review Team em Cupertino) rejeita aplicativos que sejam meros &ldquo;espelhos de sites comuns&rdquo;. Nosso sistema do Moto Clube cumpre todos os requisitos estipulados pela Apple:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> 1. Operação 100% Offline na Estrada
                    </p>
                    <p className="text-zinc-400 text-[11px]">
                      O Service Worker armazena em cache os dados da carteirinha oficial, tipo sanguíneo, contatos de emergência e histórico médico mesmo em rodovias remotas sem sinal 4G/5G.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> 2. Câmera Nativa para Leitura de CRLV
                    </p>
                    <p className="text-zinc-400 text-[11px]">
                      Utiliza a câmera nativa do iPhone para captura fotográfica e leitura de documentos de motocicletas e fotos dos integrantes.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> 3. Assinatura Digital Touchpad
                    </p>
                    <p className="text-zinc-400 text-[11px]">
                      Módulo de assinatura digital manuscrita na tela para termos estatutários de posse de colete e aceite de responsabilidade.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> 4. Isenção de Taxa Apple de 30%
                    </p>
                    <p className="text-zinc-400 text-[11px]">
                      Mensalidades de associações de motociclismo e manutenção física se enquadram nas isenções da Apple (Guideline 3.1.3(e) e 3.1.5), permitindo cobrança externa via PIX oficial sem retenção da Apple.
                    </p>
                  </div>
                </div>
              </div>

              {/* Seção 2: Métodos de Geração do Pacote iOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opção A: PWABuilder iOS Package */}
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Método 1: PWABuilder iOS (Recomendado / Mais Fácil)
                    </h5>
                    <p className="text-xs text-zinc-400 mt-2">
                      O PWABuilder gera um projeto Xcode completo em Swift com WKWebView já ajustado para as safe-areas de todos os modelos de iPhone:
                    </p>
                    <ol className="list-decimal list-inside text-xs text-zinc-300 mt-2.5 space-y-1.5">
                      <li>Acesse <strong>pwabuilder.com</strong>;</li>
                      <li>Insira a URL: <code>{customDomain}</code>;</li>
                      <li>Clique em <strong>Package for Stores</strong> ➔ <strong>iOS</strong>;</li>
                      <li>Informe o Bundle ID: <code>{packageName.replace('app', 'ios')}</code>;</li>
                      <li>Baixe o projeto <code>.zip</code> e descompacte no Mac;</li>
                      <li>Abra o arquivo <code>.xcworkspace</code> no <strong>Xcode</strong>.</li>
                    </ol>
                  </div>

                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir PWABuilder iOS
                  </a>
                </div>

                {/* Opção B: Capacitor CLI */}
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-sky-400" />
                        Método 2: Capacitor CLI (Controle Total)
                      </h5>
                      <button
                        onClick={handleCopyCapacitor}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300"
                      >
                        {copiedCapacitor ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
                        {copiedCapacitor ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400">
                      O Capacitor cria a ponte nativa oficial recomendada pelo Ionic para empacotamento no iOS:
                    </p>
                    <pre className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[10.5px] text-sky-300 mt-2 max-h-48 overflow-y-auto">
                      {capacitorCommands}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Seção 3: Permissões Obrigatórias no Info.plist do Xcode */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    Configuração de Permissões no Info.plist (Evita Rejeição da Apple)
                  </h4>
                  <button
                    onClick={handleCopyInfoPlist}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
                  >
                    {copiedInfoPlist ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                    {copiedInfoPlist ? 'Copiado!' : 'Copiar XML'}
                  </button>
                </div>
                <p className="text-xs text-zinc-400">
                  No Xcode, adicione as descrições de uso da câmera e galeria para satisfazer a auditoria de privacidade da Apple:
                </p>
                <pre className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                  {infoPlistSnippet}
                </pre>
              </div>

              {/* Seção 4: Passo a Passo no App Store Connect */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold">3</span>
                  Passo a Passo de Envio no App Store Connect
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <p className="font-bold text-zinc-200">Apple Developer</p>
                    <p className="text-zinc-400 text-[11px]">
                      Tenha uma conta ativa no <strong>Apple Developer Program</strong> ($99/ano). No portal de desenvolvedor, crie o App ID com o identificador do clube.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <p className="font-bold text-zinc-200">Screenshots Exigidos</p>
                    <p className="text-zinc-400 text-[11px]">
                      Gere capturas de tela para <strong>6.7&quot; Super Retina</strong> (1290 x 2796 px) e <strong>6.5&quot; Super Retina</strong> (1242 x 2688 px) mostrando o dashboard e a carteirinha.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <p className="font-bold text-zinc-200">Notas de Revisão</p>
                    <p className="text-zinc-400 text-[11px]">
                      Em &ldquo;App Review Information&rdquo;, forneça login e senha demo (<code>DIRETORIA</code> / <code>DIR202627</code>) para que o avaliador da Apple consiga testar todas as telas.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                      4
                    </div>
                    <p className="font-bold text-zinc-200">TestFlight &amp; Publicação</p>
                    <p className="text-zinc-400 text-[11px]">
                      Faça o Archive no Xcode (menu <em>Product ➔ Archive</em>), distribua pelo TestFlight para a diretoria testar e clique em <strong>Enviar para Revisão</strong> da App Store!
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/40 text-xs text-sky-300 flex items-center justify-between">
                  <span>
                    O app estará disponível globalmente para iPhone e iPad com o selo de aplicativo oficial verificado da App Store.
                  </span>
                  <a
                    href="https://appstoreconnect.apple.com"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ir para App Store Connect
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HOSTINGER */}
          {activeTab === 'hostinger' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 space-y-1">
                  <p className="font-bold text-amber-300">
                    Compatibilidade Total com Qualquer Plano da Hostinger
                  </p>
                  <p>
                    O sistema é compilado em arquivos estáticos ultrarrápidos (HTML5, Tailwind, React, PWA Service Worker) e consome diretamente o Cloud Firestore do Google. Portanto, roda em qualquer hospedagem compartilhada, Cloud ou VPS da Hostinger com custo mínimo e zero manutenção de servidor Node.js.
                  </p>
                </div>
              </div>

              {/* Caminho e Estrutura de Pastas na Hostinger */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <FolderArchive className="w-4 h-4" />
                  Caminho e Estrutura Oficial de Pastas no hPanel da Hostinger
                </h4>
                <div className="p-3 bg-zinc-900 rounded-xl font-mono text-[11px] text-zinc-300 space-y-1 overflow-x-auto">
                  <p className="text-zinc-500"># Caminho raiz da sua hospedagem na Hostinger:</p>
                  <p className="text-amber-300 font-bold">/home/u123456789/domains/seumotoclube.com.br/public_html/</p>
                  <p className="pl-4 text-emerald-400">├── index.html <span className="text-zinc-500">(Arquivo principal do sistema)</span></p>
                  <p className="pl-4 text-emerald-400">├── .htaccess <span className="text-zinc-500">(Regras de rotas e no-cache para updates)</span></p>
                  <p className="pl-4 text-emerald-400">├── .well-known/ <span className="text-zinc-500 font-bold">(Handshake obrigatório para TWA na Play Store)</span></p>
                  <p className="pl-8 text-emerald-300">└── assetlinks.json</p>
                  <p className="pl-4 text-emerald-400">├── version.json <span className="text-zinc-500">(Arquivo de controle de versão automática)</span></p>
                  <p className="pl-4 text-emerald-400">├── sw.js &amp; manifest.webmanifest <span className="text-zinc-500">(PWA Offline)</span></p>
                  <p className="pl-4 text-emerald-400">├── assets/ <span className="text-zinc-500">(Scripts JS e estilos CSS com hash de cache)</span></p>
                  <p className="pl-4 text-sky-400">└── downloads/ <span className="text-zinc-500 font-bold">(Pasta onde você coloca o Setup e o APK)</span></p>
                  <p className="pl-8 text-sky-300">├── IronSide_Setup_Windows.exe</p>
                  <p className="pl-8 text-sky-300">└── IronSide_MC.apk</p>
                </div>
              </div>

              {/* Passo a Passo */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center text-xs">1</span>
                  Passo 1: Gerar a Pasta de Produção
                </h4>
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-amber-300 flex items-center justify-between">
                  <span>npm run build</span>
                  <span className="text-zinc-500 text-[11px]">Gera a pasta /dist otimizada</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Esse comando cria a pasta <strong>dist/</strong> pronta contendo o sistema completo, ícones PWA, Service Worker offline, o <code>.htaccess</code> e a pasta <code>.well-known/assetlinks.json</code>.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center text-xs">2</span>
                  Passo 2: Upload para o Gerenciador de Arquivos da Hostinger
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                    <p className="font-bold text-zinc-200">Opção A: Gerenciador de Arquivos do hPanel</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-zinc-400">
                      <li>Acesse o <strong>hPanel da Hostinger</strong>;</li>
                      <li>Clique em <strong>Sites</strong> ➔ <strong>Gerenciar</strong>;</li>
                      <li>Abra o <strong>Gerenciador de Arquivos</strong>;</li>
                      <li>Entre na pasta <code>public_html</code>;</li>
                      <li>Envie todos os arquivos de <strong>dentro da pasta dist/</strong> para lá.</li>
                    </ol>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                    <p className="font-bold text-zinc-200">Opção B: Via FileZilla (FTP)</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-zinc-400">
                      <li>Obtenha as credenciais FTP no hPanel;</li>
                      <li>Conecte pelo FileZilla;</li>
                      <li>Navegue até a pasta remota <code>/public_html</code>;</li>
                      <li>Arraste todo o conteúdo da pasta <code>dist/</code> para dentro dela.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* .htaccess */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center text-xs">3</span>
                    Arquivo .htaccess (Obrigatório para Navegação, Atualização e TWA)
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyHtaccess}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
                    >
                      {copiedHtaccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                      {copiedHtaccess ? 'Copiado!' : 'Copiar'}
                    </button>
                    <button
                      onClick={() => downloadFile('.htaccess', htaccessCode)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-bold text-zinc-950 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar .htaccess
                    </button>
                  </div>
                </div>
                <pre className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                  {htaccessCode}
                </pre>
                <p className="text-xs text-zinc-400">
                  O arquivo já está na pasta <code>public/</code> e vai para <code>dist/</code> automaticamente. Ele garante que links diretos funcionem sem erro 404, força o navegador a checar novas versões e entrega o MIME-type <code>application/json</code> para o TWA do Google Play.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300">
                  <strong className="text-emerald-300 block mb-0.5">Ativar SSL Grátis na Hostinger:</strong>
                  No hPanel, vá em <strong>Segurança ➔ SSL</strong> e ative o certificado gratuito. O protocolo HTTPS é obrigatório para o TWA da Google Play Store, leitor de CRLV, câmera e Service Worker do PWA no Android e iPhone.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WINDOWS SETUP */}
          {activeTab === 'windows' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-start gap-3">
                <Monitor className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 space-y-1">
                  <p className="font-bold text-sky-300">
                    Caminho para Hospedar e Disponibilizar o Setup Windows na Hostinger
                  </p>
                  <p>
                    Você pode disponibilizar aos diretores e associados um arquivo instalador <code>IronSide_Setup_Windows.exe</code> diretamente para download na Hostinger.
                  </p>
                </div>
              </div>

              {/* Caminho na Hostinger */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Link Direto de Download na Hostinger:
                </h4>
                <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-200">
                  <span>{customDomain}/downloads/IronSide_Setup_Windows.exe</span>
                  <button
                    onClick={() => handleCopyText(`${customDomain}/downloads/IronSide_Setup_Windows.exe`, 'winlink')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-sky-300"
                  >
                    {copiedUrl === 'winlink' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedUrl === 'winlink' ? 'Copiado' : 'Copiar Link'}
                  </button>
                </div>
                <p className="text-xs text-zinc-400">
                  Basta criar a pasta <code>downloads</code> dentro de <code>public_html/</code> no hPanel e fazer upload do executável para lá.
                </p>
              </div>

              {/* Métodos de Geração */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Método 1: Gerador de Setup MSIX / EXE (PWABuilder Microsoft)
                    </h5>
                    <p className="text-xs text-zinc-400 mt-2">
                      A ferramenta oficial da Microsoft converte a URL do sistema em um instalador assinado do Windows 10/11:
                    </p>
                    <ol className="list-decimal list-inside text-xs text-zinc-300 mt-2 space-y-1">
                      <li>Acesse <strong>pwabuilder.com</strong>;</li>
                      <li>Insira o endereço da Hostinger (ex: <code>{customDomain}</code>);</li>
                      <li>Clique em <strong>Package for Windows</strong>;</li>
                      <li>Baixe o <code>.zip</code> com o instalador <code>Setup.exe</code> e envie para a pasta <code>public_html/downloads/</code>.</li>
                    </ol>
                  </div>
                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir PWABuilder Oficial
                  </a>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      Método 2: Instalador Batch / Script para Windows
                    </h5>
                    <p className="text-xs text-zinc-400 mt-2">
                      Script executável de 1 clique que cria o atalho oficial do Moto Clube na Área de Trabalho e Menu Iniciar do Windows:
                    </p>
                    <pre className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-zinc-300 mt-2 max-h-24 overflow-y-auto">
                      {windowsBatScript}
                    </pre>
                  </div>
                  <button
                    onClick={() => downloadFile('Instalador_IronSide_Windows.bat', windowsBatScript)}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    Baixar Script Instalador (.bat)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: APK DIRETO CELULAR */}
          {activeTab === 'apk' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 space-y-1">
                  <p className="font-bold text-emerald-300">
                    Caminho para Hospedar e Disponibilizar o APK para Celulares na Hostinger
                  </p>
                  <p>
                    Disponibilize o arquivo <code>IronSide_MC.apk</code> no seu próprio site para que qualquer associado baixe e instale no Android sem depender da Google Play Store.
                  </p>
                </div>
              </div>

              {/* Caminho na Hostinger */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Link Direto de Download do APK na Hostinger:
                </h4>
                <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-200">
                  <span>{customDomain}/downloads/IronSide_MC.apk</span>
                  <button
                    onClick={() => handleCopyText(`${customDomain}/downloads/IronSide_MC.apk`, 'apklink')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-emerald-400"
                  >
                    {copiedUrl === 'apklink' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedUrl === 'apklink' ? 'Copiado' : 'Copiar Link'}
                  </button>
                </div>
                <p className="text-xs text-zinc-400">
                  Basta subir o arquivo <code>IronSide_MC.apk</code> na pasta <code>public_html/downloads/</code> via Gerenciador de Arquivos do hPanel.
                </p>
              </div>

              {/* Bubblewrap CLI Commands */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Como Gerar o APK com o Bubblewrap (Ferramenta Oficial do Google)
                  </h4>
                  <button
                    onClick={handleCopyBubblewrap}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
                  >
                    {copiedBubblewrap ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                    {copiedBubblewrap ? 'Copiado!' : 'Copiar Comandos'}
                  </button>
                </div>

                <pre className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-amber-300 overflow-x-auto">
                  {bubblewrapCommand}
                </pre>
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                  <p>
                    <strong className="text-zinc-200">Como o associado instala no celular:</strong>
                  </p>
                  <p>
                    1. O associado acessa o link do APK pelo WhatsApp ou navegador do celular.<br />
                    2. O download é concluído e o Android solicita: <em>&quot;Permitir desta fonte&quot;</em>.<br />
                    3. Ao autorizar, o app é instalado com ícone oficial, acesso à câmera de CRLV e cache offline.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: VERSÕES & UPDATES */}
          {activeTab === 'versao' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-zinc-100">Versão Atual do Sistema</h4>
                    <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-amber-500 text-zinc-950">
                      v{currentVersion}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Última verificação: {lastChecked.toLocaleTimeString('pt-BR')}
                  </p>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Status:{' '}
                    {hasUpdate ? (
                      <span className="text-amber-400 font-bold">
                        Nova versão disponível no servidor (v{latestVersion})!
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5 inline-flex">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sistema 100% Atualizado
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={checkForUpdates}
                    disabled={checking}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                    {checking ? 'Verificando...' : 'Verificar Atualizações'}
                  </button>

                  <button
                    onClick={handleTestUpdate}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {simulatedTriggered ? 'Aviso Ativado no Topo!' : 'Testar Notificação'}
                  </button>
                </div>
              </div>

              {/* Explicação da Condição de Atualização Automática */}
              <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Como Funciona a Condição de Atualização Automática a Cada Modificação
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-1.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h5 className="font-bold text-zinc-200">Qualquer Alteração Feita</h5>
                    <p className="text-zinc-400 text-[11px]">
                      Ao alterar código, funcionalidades ou banco de dados, o arquivo <code>public/version.json</code> e o Service Worker são atualizados na compilação.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-1.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h5 className="font-bold text-zinc-200">Envio para a Hostinger</h5>
                    <p className="text-zinc-400 text-[11px]">
                      Graças às diretivas <code>no-cache</code> configuradas no <code>.htaccess</code>, o servidor Hostinger responde imediatamente com a nova versão sem prender no cache do navegador.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-1.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <h5 className="font-bold text-zinc-200">Notificação Instantânea</h5>
                    <p className="text-zinc-400 text-[11px]">
                      O app detecta em segundo plano e exibe o banner flutuante para os integrantes. Com 1 toque em <em>&quot;Atualizar Agora&quot;</em>, o cache é renovado na hora tanto no PWA quanto no TWA da Google Play.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-2">
                  <p className="font-bold text-zinc-200">Histórico de Alterações Desta Versão (v{currentVersion}):</p>
                  <ul className="space-y-1 text-zinc-300">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Google Play Store: TWA (Trusted Web Activity) com Digital Asset Links (.well-known/assetlinks.json)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      Apple App Store: Guia completo com WKWebView, Swift, permissões de Info.plist e aprovação na Guideline 4.2
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Condição de atualização automática com aviso em tempo real e renovação de cache
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Caminho e documentação completa para hospedagem na Hostinger
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Geração de Setup Instalador para Windows e APK para Celulares Android
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
          <p className="text-[11px] text-zinc-500">
            Iron Side Road Rider M.C. · Versão {currentVersion} · Google Play, App Store &amp; Hostinger
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
