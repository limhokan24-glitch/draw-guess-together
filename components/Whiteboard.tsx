
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, Stroke, SyncMessage } from '../types';
import { COLORS, LINE_WIDTHS, BROADCAST_CHANNEL_NAME } from '../constants';

interface WhiteboardProps {
  roomId: string;
  userId: string;
  onCanvasUpdate?: (dataUrl: string) => void;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ roomId, userId, onCanvasUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(LINE_WIDTHS[1]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  
  const currentStrokePoints = useRef<Point[]>([]);
  const broadcastChannel = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel for multi-tab sync
  useEffect(() => {
    broadcastChannel.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    
    broadcastChannel.current.onmessage = (event) => {
      const msg: SyncMessage = event.data;
      if (msg.roomId !== roomId || msg.senderId === userId) return;

      if (msg.type === 'DRAW') {
        setStrokes(prev => [...prev, msg.payload]);
      } else if (msg.type === 'CLEAR') {
        setStrokes([]);
      } else if (msg.type === 'UNDO') {
        setStrokes(prev => prev.slice(0, -1));
      }
    };

    return () => {
      broadcastChannel.current?.close();
    };
  }, [roomId, userId]);

  // Setup and Resize Handling
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset and apply scale
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        contextRef.current = ctx;
        
        // Redraw content after resize
        drawAllStrokes(ctx, canvas);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    resizeObserver.observe(container);
    updateCanvasSize();

    return () => resizeObserver.disconnect();
  }, [strokes]); // Re-run if strokes change to ensure they are drawn on new context

  const drawAllStrokes = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Save current transform
    ctx.save();
    // Reset transform to identity to clear the entire pixel grid
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Restore transform (the dpr scale)
    ctx.restore();

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default to stop scrolling on mobile
    if (e.cancelable) e.preventDefault();
    
    setIsDrawing(true);
    const pos = getPos(e);
    currentStrokePoints.current = [pos];

    const ctx = contextRef.current;
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();

    const pos = getPos(e);
    const points = currentStrokePoints.current;
    const lastPos = points[points.length - 1];
    
    // Only add point if it's moved significantly to keep data lean
    const dist = Math.sqrt(Math.pow(pos.x - lastPos.x, 2) + Math.pow(pos.y - lastPos.y, 2));
    if (dist < 1) return;

    points.push(pos);
    
    const ctx = contextRef.current;
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const endDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const newStroke: Stroke = {
      id: Math.random().toString(36).substr(2, 9),
      points: [...currentStrokePoints.current],
      color,
      width: lineWidth
    };

    setStrokes(prev => [...prev, newStroke]);
    
    broadcastChannel.current?.postMessage({
      type: 'DRAW',
      payload: newStroke,
      roomId,
      senderId: userId
    });

    if (onCanvasUpdate && canvasRef.current) {
      onCanvasUpdate(canvasRef.current.toDataURL());
    }
  };

  const clearCanvas = () => {
    setStrokes([]);
    broadcastChannel.current?.postMessage({
      type: 'CLEAR',
      payload: null,
      roomId,
      senderId: userId
    });
  };

  const undo = () => {
    setStrokes(prev => prev.slice(0, -1));
    broadcastChannel.current?.postMessage({
      type: 'UNDO',
      payload: null,
      roomId,
      senderId: userId
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Toolbar */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5 p-1.5 bg-white rounded-xl shadow-sm border border-gray-200">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-all hover:scale-110 active:scale-95 ${color === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
          <div className="flex gap-1 p-1 bg-white rounded-xl shadow-sm border border-gray-200">
            {LINE_WIDTHS.map(w => (
              <button
                key={w}
                onClick={() => setLineWidth(w)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100 ${lineWidth === w ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}
                aria-label={`Select line width ${w}`}
              >
                <div style={{ width: Math.max(2, w/2), height: Math.max(2, w/2) }} className="bg-current rounded-full" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={undo}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo
          </button>
          <button 
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-100 active:bg-red-200 transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 relative whiteboard-bg cursor-crosshair touch-none overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};

export default Whiteboard;
