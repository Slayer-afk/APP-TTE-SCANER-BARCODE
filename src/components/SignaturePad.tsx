import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Trash2, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  initialSignature?: string;
  onClose?: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  initialSignature,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [hasContent, setHasContent] = useState(false);
  const historyRef = useRef<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI Canvas Scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasContent(true);
        saveState();
      };
      img.src = initialSignature;
    } else {
      saveState();
    }
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(data);
    if (historyRef.current.length > 20) historyRef.current.shift();
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
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
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveState();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    historyRef.current = [];
    saveState();
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length <= 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    historyRef.current.pop(); // Remove current state
    const previousState = historyRef.current[historyRef.current.length - 1];
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
      setHasContent(true);
    } else {
      clearCanvas();
    }
  };

  const handleDone = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
    if (onClose) onClose();
  };

  return (
    <div id="signature-pad-container" className="flex flex-col gap-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Goresan Tanda Tangan Basah</h4>
            <p className="text-xs text-slate-500">Tanda tangani di area kanvas di bawah menggunakan jari atau stylus</p>
          </div>
        </div>

        {/* Ink Colors */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-500 px-1">Tinta:</span>
          {[
            { label: 'Hitam Pekat', color: '#000000' },
            { label: 'Hitam Klasik', color: '#0f172a' },
            { label: 'Merah Resmi', color: '#dc2626' },
            { label: 'Merah Marun', color: '#991b1b' },
            { label: 'Biru Tua', color: '#1e3a8a' },
            { label: 'Biru Standar', color: '#2563eb' },
          ].map((item) => (
            <button
              key={item.color}
              type="button"
              onClick={() => setStrokeColor(item.color)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                strokeColor === item.color ? 'scale-110 border-blue-600 ring-2 ring-blue-300 shadow-xs' : 'border-slate-300 hover:scale-105'
              }`}
              style={{ backgroundColor: item.color }}
              title={item.label}
            />
          ))}
        </div>
      </div>

      {/* Drawing Canvas */}
      <div className="relative w-full h-48 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden touch-none select-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasContent && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1">
            <PenTool className="w-6 h-6 stroke-1" />
            <span className="text-xs font-medium">Bubuhi tanda tangan manual di sini</span>
          </div>
        )}
        <div className="absolute bottom-2 left-4 text-[10px] text-slate-400 pointer-events-none">
          Area Tanda Tangan Digital (Transparan)
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={historyRef.current.length <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Undo
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            disabled={!hasContent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
          )}
          <button
            type="button"
            onClick={handleDone}
            disabled={!hasContent}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            Gunakan Tanda Tangan
          </button>
        </div>
      </div>
    </div>
  );
};
