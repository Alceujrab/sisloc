import React, { useEffect, useRef, useState } from 'react';

// Componente simples de assinatura em canvas
export default function SignaturePad({ width = 500, height = 200, onChange }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827'; // gray-900
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const move = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const end = () => {
    setIsDrawing(false);
    if (onChange) {
      canvasRef.current.toBlob((blob) => {
        if (blob) onChange(blob);
      }, 'image/png');
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    setHasDrawn(false);
    if (onChange) onChange(null);
  };

  return (
    <div>
      <div className="border rounded bg-white inline-block">
        <canvas
          ref={canvasRef}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
          className="touch-none"
        />
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <button type="button" onClick={clear} className="px-3 py-1 border rounded hover:bg-gray-50">Limpar</button>
        {hasDrawn ? <span className="text-green-600">Assinatura pronta</span> : <span className="text-gray-500">Desenhe sua assinatura</span>}
      </div>
    </div>
  );
}
