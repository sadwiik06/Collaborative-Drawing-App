import { useRef, useEffect, useCallback, useState } from 'react';

export const useDrawing = (canvasRef, socket, roomId) => {
    const [tools, setTools] = useState({
        color: '#000000',
        size: 5,
        isErasing: false,
        isRainbow: false,
        isTrail: false
    });

    const drawing = useRef(false);
    const lastPoint = useRef(null);
    const localStrokes = useRef([]);
    const hue = useRef(0);
    const trailInterval = useRef(null);

    const getColor = useCallback(() => {
        if (tools.isErasing) return '#ffffff';
        if (tools.isRainbow) {
            hue.current = (hue.current + 2) % 360;
            return `hsl(${hue.current}, 100%, 50%)`;
        }
        return tools.color;
    }, [tools.isErasing, tools.isRainbow, tools.color]);

    const drawSegment = useCallback((ctx, x1, y1, x2, y2, color, size) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.stroke();
    }, []);

    const redrawAll = useCallback((ctx) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        localStrokes.current.forEach(stroke => {
            drawSegment(ctx, stroke.x1, stroke.y1, stroke.x2, stroke.y2, stroke.color, stroke.size);
        });
    }, [drawSegment]);

    const addStroke = useCallback((stroke, shouldSync = true) => {
        localStrokes.current.push(stroke);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            drawSegment(ctx, stroke.x1, stroke.y1, stroke.x2, stroke.y2, stroke.color, stroke.size);
        }
        
        if (shouldSync && socket && roomId) {
            socket.emit('draw', { roomId, stroke });
        }
    }, [canvasRef, drawSegment, socket, roomId]);

    const clearCanvas = useCallback((shouldSync = true) => {
        localStrokes.current = [];
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        
        if (shouldSync && socket && roomId) {
            socket.emit('clear-canvas', { roomId });
        }
    }, [canvasRef, socket, roomId]);

    useEffect(() => {
        if (!socket) return;
        
        const onDraw = (stroke) => {
            addStroke(stroke, false);
        };
        const onClear = () => {
            clearCanvas(false); 
        };

        socket.on('draw', onDraw);
        socket.on('clear-canvas', onClear);

        return () => {
            socket.off('draw', onDraw);
            socket.off('clear-canvas', onClear);
        };
    }, [socket, addStroke, clearCanvas]);

    useEffect(() => {
        if (tools.isTrail) {
            if (trailInterval.current) clearInterval(trailInterval.current);
            trailInterval.current = setInterval(() => {
                const canvas = canvasRef.current;
                if (canvas && tools.isTrail) {
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                }
            }, 100);
        } else {
            if (trailInterval.current) {
                clearInterval(trailInterval.current);
                trailInterval.current = null;
            }
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) redrawAll(ctx);
        }
        
        return () => {
            if (trailInterval.current) clearInterval(trailInterval.current);
        };
    }, [tools.isTrail, canvasRef, redrawAll]);

    return {
        tools,
        setTools,
        drawing,
        lastPoint,
        localStrokes,
        clearCanvas,
        redrawAll,
        getColor,
        addStroke
    };
};