import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, PenTool, ShieldCheck, AlertCircle, Type, Sparkles } from 'lucide-react';

interface Props {
  value?: string;
  onChange: (dataUrl: string) => void;
  required?: boolean;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
}

export const DigitalSignaturePad: React.FC<Props> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  title = 'Assinatura Digital do Integrante',
  subtitle = 'Assine no quadro abaixo desenhando com o dedo/mouse ou digite seu nome com fonte manuscrita oficial.',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedText, setTypedText] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));
  const [timestamp, setTimestamp] = useState<string | null>(null);

  // Resize canvas to match display size on mount or when mode is draw
  useEffect(() => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#f59e0b'; // Amber-500
      ctx.lineWidth = 2.5;

      // If value already provided, render it
      if (value) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          setHasSignature(true);
        };
        img.src = value;
      }
    }
  }, [value, mode]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    setHasSignature(true);
    const nowStr = new Date().toLocaleString('pt-BR');
    setTimestamp(nowStr);
    onChange(dataUrl);
  };

  const clearSignature = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
      }
    }
    setTypedText('');
    setHasSignature(false);
    setTimestamp(null);
    onChange('');
  };

  // Convert typed text to signature image using Bradley Hand ITC
  const handleTypedTextChange = (text: string) => {
    setTypedText(text);
    if (!text.trim()) {
      clearSignature();
      return;
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = 600;
    offscreen.height = 180;
    const ctx = offscreen.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, offscreen.width, offscreen.height);
      // Estilo com Bradley Hand ITC e fallbacks
      ctx.font = 'italic 46px "Bradley Hand ITC", "Bradley Hand", "Caveat", "Dancing Script", cursive';
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text.trim(), offscreen.width / 2, offscreen.height / 2 - 10);

      // Traço suave embaixo simulando rubrica
      ctx.beginPath();
      ctx.moveTo(120, offscreen.height / 2 + 25);
      ctx.quadraticCurveTo(offscreen.width / 2, offscreen.height / 2 + 45, offscreen.width - 120, offscreen.height / 2 + 20);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const dataUrl = offscreen.toDataURL('image/png');
      setHasSignature(true);
      const nowStr = new Date().toLocaleString('pt-BR');
      setTimestamp(nowStr);
      onChange(dataUrl);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-amber-400" />
            <span>{title}</span>
            {required && <span className="text-red-400">*</span>}
          </label>
          <p className="text-[11px] text-zinc-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor de Modo: Desenhar na Tela vs Digitar com Bradley Hand ITC */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setMode('draw')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                mode === 'draw'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PenTool className="w-3 h-3" />
              <span>Desenhar</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('type')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                mode === 'type'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Type className="w-3 h-3" />
              <span>Digitar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={clearSignature}
            disabled={disabled || !hasSignature}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold border border-zinc-700/80 transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Eraser className="w-3 h-3 text-red-400" />
            <span>Limpar Assinatura</span>
          </button>
        </div>
      </div>

      {mode === 'draw' ? (
        <div className="relative rounded-2xl bg-zinc-950 border-2 border-dashed border-zinc-700 hover:border-amber-500/60 transition p-1 shadow-inner group">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }}
            className={`w-full h-36 rounded-xl cursor-crosshair bg-zinc-950 ${
              disabled ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          />

          {!hasSignature && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-zinc-500 text-xs">
              <PenTool className="w-6 h-6 mb-1 text-zinc-600 animate-pulse" />
              <span>Toque ou clique e deslize para assinar aqui</span>
            </div>
          )}

          {/* Linha guia de assinatura */}
          <div className="absolute left-6 right-6 bottom-7 border-b border-zinc-800 pointer-events-none"></div>
        </div>
      ) : (
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Digite seu Nome Completo ou Como Assina:
            </label>
            <input
              type="text"
              value={typedText}
              onChange={(e) => handleTypedTextChange(e.target.value)}
              placeholder="Ex: Carlos Eduardo Silveira"
              disabled={disabled}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Pré-visualização com fonte Bradley Hand ITC */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-amber-500/30 text-center min-h-[90px] flex flex-col items-center justify-center relative overflow-hidden">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest absolute top-2 left-3 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Fonte Oficial Bradley Hand ITC
            </span>
            {typedText ? (
              <div
                style={{
                  fontFamily: "'Bradley Hand ITC', 'Bradley Hand', 'Caveat', 'Dancing Script', cursive",
                }}
                className="text-3xl sm:text-4xl text-amber-400 tracking-wide select-none pt-2"
              >
                {typedText}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                Digite no campo acima para gerar sua assinatura manuscrita oficial
              </p>
            )}
            <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mt-2"></div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
        <div className="flex items-center gap-1.5">
          {hasSignature ? (
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <Check className="w-3.5 h-3.5" />
              Assinatura digital capturada {timestamp ? `(${timestamp})` : ''}
            </span>
          ) : (
            <span className="text-amber-400/80 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Aguardando assinatura (desenhada ou digitada)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-zinc-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>Validade Jurídica Art. 10 MP 2.200-2/2001</span>
        </div>
      </div>
    </div>
  );
};
