import { useRef, useEffect, useCallback, useState } from 'react';

export const useDrawing = (canvasRef, socket, roomId) => {
    const [tools, setTools] = useState({
        color: '#000000',
        size: 5,
        isErasing: false,
        isFilling: false
    });

    const drawing = useRef(false);
    const lastPoint = useRef(null);
    const localStrokes = useRef([]);
    const myPathHistory = useRef([]);
    const redoStack = useRef([]);
    const hue = useRef(0);
    const trailInterval = useRef(null);

    const getColor = useCallback(() => {
        if (tools.isErasing) return '#ffffff';
        return tools.color;
    }, [tools.isErasing, tools.color]);

    const drawSegment = useCallback((ctx, x1, y1, x2, y2, color, size) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.stroke();
    }, []);

    const hexToRgba = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: 255
        } : { r: 0, g: 0, b: 0, a: 255 };
    };

    const runFloodFill = useCallback((ctx, startX, startY, fillColor) => {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const colorData = ctx.getImageData(0, 0, width, height);
        const data = colorData.data;

        startX = Math.floor(startX);
        startY = Math.floor(startY);

        const startPos = (startY * width + startX) * 4;
        const startR = data[startPos];
        const startG = data[startPos + 1];
        const startB = data[startPos + 2];
        const startA = data[startPos + 3];

        const targetColor = hexToRgba(fillColor);

        if (startR === targetColor.r && startG === targetColor.g && startB === targetColor.b && startA === targetColor.a) {
            return;
        }

        const matchStartColor = (pos) => {
            return data[pos] === startR && data[pos + 1] === startG && data[pos + 2] === startB && data[pos + 3] === startA;
        };

        const colorPixel = (pos) => {
            data[pos] = targetColor.r;
            data[pos + 1] = targetColor.g;
            data[pos + 2] = targetColor.b;
            data[pos + 3] = targetColor.a;
        };

        const pixelStack = [[startX, startY]];

        while (pixelStack.length) {
            let newPos, x, y, pixelPos, reachLeft, reachRight;
            newPos = pixelStack.pop();
            x = newPos[0];
            y = newPos[1];

            pixelPos = (y * width + x) * 4;
            while (y-- >= 0 && matchStartColor(pixelPos)) {
                pixelPos -= width * 4;
            }
            pixelPos += width * 4;
            ++y;
            reachLeft = false;
            reachRight = false;
            while (y++ < height - 1 && matchStartColor(pixelPos)) {
                colorPixel(pixelPos);

                if (x > 0) {
                    if (matchStartColor(pixelPos - 4)) {
                        if (!reachLeft) {
                            pixelStack.push([x - 1, y]);
                            reachLeft = true;
                        }
                    } else if (reachLeft) {
                        reachLeft = false;
                    }
                }

                if (x < width - 1) {
                    if (matchStartColor(pixelPos + 4)) {
                        if (!reachRight) {
                            pixelStack.push([x + 1, y]);
                            reachRight = true;
                        }
                    } else if (reachRight) {
                        reachRight = false;
                    }
                }
                pixelPos += width * 4;
            }
        }
        ctx.putImageData(colorData, 0, 0);
    }, []);

    const redrawAll = useCallback((ctx) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        localStrokes.current.forEach(stroke => {
            if (stroke.action === 'fill') {
                runFloodFill(ctx, stroke.startX, stroke.startY, stroke.color);
            } else {
                drawSegment(ctx, stroke.x1, stroke.y1, stroke.x2, stroke.y2, stroke.color, stroke.size);
            }
        });
    }, [drawSegment, runFloodFill]);

    const addStroke = useCallback((stroke, shouldSync = true, isNewLocal = false) => {
        localStrokes.current.push(stroke);
        const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
        if (ctx) {
            if (stroke.action === 'fill') {
                runFloodFill(ctx, stroke.startX, stroke.startY, stroke.color);
            } else {
                drawSegment(ctx, stroke.x1, stroke.y1, stroke.x2, stroke.y2, stroke.color, stroke.size);
            }
        }
        
        if (isNewLocal && stroke.pathId) {
            const history = myPathHistory.current;
            if (history.length === 0 || history[history.length - 1] !== stroke.pathId) {
                history.push(stroke.pathId);
                redoStack.current = []; 
            }
        }

        if (shouldSync && socket && roomId) {
            socket.emit('draw', { roomId, stroke });
        }
    }, [canvasRef, drawSegment, socket, roomId]);

    const clearCanvas = useCallback((shouldSync = true) => {
        localStrokes.current = [];
        myPathHistory.current = [];
        redoStack.current = [];
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        
        if (shouldSync && socket && roomId) {
            socket.emit('clear-canvas', { roomId });
        }
    }, [canvasRef, socket, roomId]);

    const triggerUndo = useCallback(() => {
        const pathIdToUndo = myPathHistory.current.pop();
        if (!pathIdToUndo) return;
        
        const undoneStrokes = localStrokes.current.filter(s => s.pathId === pathIdToUndo);
        redoStack.current.push({ pathId: pathIdToUndo, strokes: undoneStrokes });
        
        localStrokes.current = localStrokes.current.filter(s => s.pathId !== pathIdToUndo);
        
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) redrawAll(ctx);
        
        if (socket && roomId) socket.emit('undo-path', { roomId, pathId: pathIdToUndo });
    }, [canvasRef, redrawAll, socket, roomId]);

    const triggerRedo = useCallback(() => {
        const redoObject = redoStack.current.pop();
        if (!redoObject) return;
        
        myPathHistory.current.push(redoObject.pathId);
        
        redoObject.strokes.forEach(stroke => {
             addStroke(stroke, false, false); 
        });
        
        
        redoObject.strokes.forEach(stroke => {
             if (socket && roomId) socket.emit('draw', { roomId, stroke });
        });
    }, [addStroke, socket, roomId]);

    const loadInitialStrokes = useCallback((strokesArray) => {
        localStrokes.current = [...strokesArray];
        const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
        if (ctx) redrawAll(ctx);
    }, [redrawAll]);

    useEffect(() => {
        if (!socket) return;
        
        const onDraw = (stroke) => {
            addStroke(stroke, false, false);
        };
        const onClear = () => {
            clearCanvas(false); 
        };
        const onUndoPath = (pathId) => {
            localStrokes.current = localStrokes.current.filter(s => s.pathId !== pathId);
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) redrawAll(ctx);
        };
        const onRemoveUserStrokes = (socketId) => {
            localStrokes.current = localStrokes.current.filter(s => s.author !== socketId);
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) redrawAll(ctx);
        };

        socket.on('draw', onDraw);
        socket.on('clear-canvas', onClear);
        socket.on('undo-path', onUndoPath);
        socket.on('remove-user-strokes', onRemoveUserStrokes);

        return () => {
            socket.off('draw', onDraw);
            socket.off('clear-canvas', onClear);
            socket.off('undo-path', onUndoPath);
            socket.off('remove-user-strokes', onRemoveUserStrokes);
        };
    }, [socket, addStroke, clearCanvas, redrawAll, canvasRef]);

    useEffect(() => {
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
        addStroke,
        triggerUndo,
        triggerRedo,
        loadInitialStrokes
    };
};