import React, { useRef, useEffect } from 'react';
import { useDrawing } from '../hooks/useDrawing';

const Canvas = () => {
    const canvasRef = useRef(null);
    const { tools, setTools, drawing, lastPoint, addStroke, getColor, redrawAll, clearCanvas } = useDrawing(canvasRef);

    useEffect(() => {
        const handleToolAction = (e) => {
            const { action } = e.detail;
            if (action === 'clear') clearCanvas();
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
    }, [setTools, clearCanvas]);

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
        drawing.current = true;
        const { x, y } = getCanvasCoords(e);
        lastPoint.current = { x, y };
    };

    const draw = (e) => {
        if (!drawing.current) return;
        e.preventDefault();
        const { x, y } = getCanvasCoords(e);
        if (lastPoint.current) {
            const color = getColor();
            const size = parseInt(tools.size, 10);
            const stroke = {
                x1: lastPoint.current.x,
                y1: lastPoint.current.y,
                x2: x,
                y2: y,
                color,
                size
            };
            addStroke(stroke);
            lastPoint.current = { x, y };
        }
    };

    const endDraw = () => {
        drawing.current = false;
        lastPoint.current = null;
    };

    return (
        <canvas
            ref={canvasRef}
            className="draw-canvas"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
        />
    );
};

export default Canvas;