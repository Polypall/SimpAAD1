
import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, Trash2, Camera } from 'lucide-react';

interface DrawingCanvasProps {
  onCapture: (imageData: string) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onCapture }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineWidth = tool === 'eraser' ? 20 : 3;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Sketch Pad</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTool('pencil')}
            className={`p-2 rounded-lg transition-colors ${tool === 'pencil' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button
            onClick={clear}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full h-auto bg-white rounded-xl cursor-crosshair border border-slate-700 shadow-inner"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
        <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => canvasRef.current && onCapture(canvasRef.current.toDataURL())}
            className="px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg flex items-center gap-2 hover:bg-blue-500 transition-all scale-95 active:scale-90"
          >
            <Camera className="w-4 h-4" /> Analyze Sketch
          </button>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 italic">Draw your shape and click 'Analyze Sketch' to let SimpAAD AI interpret it into 3D.</p>
    </div>
  );
};
