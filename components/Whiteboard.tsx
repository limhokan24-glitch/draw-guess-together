
import React, { useRef, useEffect, useState } from "react"
import { socket } from "@/src/socket"
import { Point, Stroke } from "../types"
import { COLORS, LINE_WIDTHS } from "../constants"

interface WhiteboardProps {
  roomId: string
  userId: string
  onCanvasUpdate?: (dataUrl: string) => void
}

const Whiteboard: React.FC<WhiteboardProps> = ({ roomId, userId, onCanvasUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)

  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState(COLORS[0])
  const [lineWidth, setLineWidth] = useState(LINE_WIDTHS[1])
  const [strokes, setStrokes] = useState<Stroke[]>([])

  const currentStroke = useRef<Point[]>([])

  /* ================= SOCKET SETUP ================= */
  useEffect(() => {
    socket.emit("join-room", roomId)

    socket.on("draw", (stroke: Stroke) => {
      setStrokes(prev => [...prev, stroke])
    })

    socket.on("clear", () => {
      setStrokes([])
    })

    socket.on("undo", () => {
      setStrokes(prev => prev.slice(0, -1))
    })

    return () => {
      socket.off("draw")
      socket.off("clear")
      socket.off("undo")
    }
  }, [roomId])

  /* ================= CANVAS SETUP ================= */
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      contextRef.current = ctx

      redrawAll(ctx, canvas)
    }

    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(container)
    resizeCanvas()

    return () => observer.disconnect()
  }, [strokes])

  const redrawAll = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return
      ctx.beginPath()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      stroke.points.forEach(p => ctx.lineTo(p.x, p.y))
      ctx.stroke()
    })
  }

  /* ================= DRAWING LOGIC ================= */
  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()

    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault()

    setIsDrawing(true)
    const pos = getPos(e)
    currentStroke.current = [pos]

    const ctx = contextRef.current
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    if (e.cancelable) e.preventDefault()

    const pos = getPos(e)
    currentStroke.current.push(pos)

    const ctx = contextRef.current
    if (!ctx) return

    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const endDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    const newStroke: Stroke = {
      id: crypto.randomUUID(),
      points: [...currentStroke.current],
      color,
      width: lineWidth,
    }

    setStrokes(prev => [...prev, newStroke])

    socket.emit("draw", {
      roomId,
      ...newStroke,
    })

    if (onCanvasUpdate && canvasRef.current) {
      onCanvasUpdate(canvasRef.current.toDataURL())
    }
  }

  /* ================= ACTIONS ================= */
  const clearCanvas = () => {
    setStrokes([])
    socket.emit("clear", { roomId })
  }

  const undo = () => {
    setStrokes(prev => prev.slice(0, -1))
    socket.emit("undo", { roomId })
  }

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
