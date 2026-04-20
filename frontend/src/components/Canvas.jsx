import React, { useRef, useEffect, useState } from 'react';
import { useDrawing } from '../hooks/useDrawing';

const Canvas = ({ socket, roomId, username, isDrawer, isDrawingPhase, initialStrokes }) => {
    
    const canvasRef = useRef(null);
    const currentPathId = useRef(null);
    const { tools, setTools, drawing, lastPoint, addStroke, getColor, redrawAll, clearCanvas, triggerUndo, triggerRedo, loadInitialStrokes } = useDrawing(canvasRef, socket, roomId);
    const [cursors, setCursors] = useState({});

    // Load initial strokes when the canvas mounts and they are provided
    useEffect(() => {
        if (initialStrokes && initialStrokes.length > 0) {
            loadInitialStrokes(initialStrokes);
        }
    }, [initialStrokes, loadInitialStrokes]);

    useEffect(() => {
        const handleToolAction = (e) => {
            const { action } = e.detail;
            if (action === 'clear') clearCanvas();
            if (action === 'undo') triggerUndo();
            if (action === 'redo') triggerRedo();
            if (action === 'save') {
                const url = canvasRef.current.toDataURL("image/jpeg", 0.9);
                const link = document.createElement("a");
                link.download = "drawing.jpeg";
                link.href = url;
                link.click();
            }
        };

        const handleToolChange = (e) => {
            const { type, value } = e.detail;
            setTools(prev => ({ ...prev, [type]: value }));
        };

        window.addEventListener('toolAction', handleToolAction);
        window.addEventListener('toolChange', handleToolChange);
        return () => {
            window.removeEventListener('toolAction', handleToolAction);
            window.removeEventListener('toolChange', handleToolChange);
        };
    }, [setTools, clearCanvas, addStroke, triggerUndo, triggerRedo]);

    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            if (!canvas || !canvas.parentElement) return;
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
            redrawAll(ctx);
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [redrawAll]);

    const getCanvasCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        let x = (clientX - rect.left) * scaleX;
        let y = (clientY - rect.top) * scaleY;
        x = Math.min(Math.max(0, x), canvas.width);
        y = Math.min(Math.max(0, y), canvas.height);
        return { x, y };
    };

    const startDraw = (e) => {
        e.preventDefault();
        const { x, y } = getCanvasCoords(e);
        
        if (tools.isFilling) {
            const color = getColor();
            const stroke = {
                action: 'fill',
                pathId: Date.now().toString(36) + Math.random().toString(36).substr(2),
                startX: x,
                startY: y,
                color
            };
            addStroke(stroke, true, true);
            return; // Don't proceed to normal drawing
        }
        
        drawing.current = true;
        currentPathId.current = Date.now().toString(36) + Math.random().toString(36).substr(2);
        lastPoint.current = { x, y };
    };

    const draw = (e) => {
        if (!drawing.current || tools.isFilling) return;
        e.preventDefault();
        const { x, y } = getCanvasCoords(e);
        if (lastPoint.current) {
            const color = getColor();
            const size = parseInt(tools.size, 10);
            const stroke = {
                action: 'draw',
                pathId: currentPathId.current,
                x1: lastPoint.current.x,
                y1: lastPoint.current.y,
                x2: x,
                y2: y,
                color,
                size
            };
            addStroke(stroke, true, true);
            lastPoint.current = { x, y };
        }
    };

    const endDraw = () => {
        drawing.current = false;
        lastPoint.current = null;
    };

    const handleMouseMove = (e) => {
        draw(e);
        if (!socket || !roomId) return;
        const now = Date.now();
        if (now - (canvasRef.current.lastEmit || 0) > 30) {
            const { x, y } = getCanvasCoords(e);
            socket.emit('cursor-move', { roomId, cursorData: { x, y, name: username } })
            canvasRef.current.lastEmit = now;
        }
    };

    useEffect(() => {
        if (!socket) return;
        socket.on('cursor-move', (data) => {
            setCursors(prev => ({ ...prev, [data.socketId]: { x: data.x, y: data.y, name: data.name } }));
        });
        socket.on('user-disconnected', (socketId) => {
            setCursors(prev => {
                const newCursors = { ...prev };
                delete newCursors[socketId];
                return newCursors;
            });
        });
        return () => {
            socket.off('cursor-move');
            socket.off('user-disconnected');
        };
    }, [socket]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <canvas
                ref={canvasRef}
                className="draw-canvas"
                onMouseDown={startDraw}
                onMouseMove={handleMouseMove}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={handleMouseMove}
                onTouchEnd={endDraw}
            />
            {Object.entries(cursors).map(([id, cursor]) => (
                <div key={id} style={{
                    position: 'absolute',
                    left: cursor.x,
                    top: cursor.y,
                    pointerEvents: 'none',
                    zIndex: 10
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(-2px, -2px)' }}>
                        <path d="M5.5 3L18.5 10.5L12.5 12.5L10.5 18.5L5.5 3Z" fill="#ff4444" stroke="white" strokeWidth="1.5" />
                    </svg>
                    <div style={{
                        position: 'absolute',
                        left: 14,
                        top: 14,
                        backgroundColor: '#ff4444',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        fontWeight: 'bold',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}>
                        {cursor.name}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Canvas;
