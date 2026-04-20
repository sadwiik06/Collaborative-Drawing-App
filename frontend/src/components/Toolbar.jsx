import React, { useState } from 'react';

const SKRIBBL_COLORS_TOP = ['#ffffff', '#c1c1c1', '#ef130b', '#ff7100', '#ffe400', '#00cc00', '#00ffcc', '#00b2ff', '#231fd3', '#a300ba', '#ff66cc', '#ffa07a', '#a0522d'];
const SKRIBBL_COLORS_BOT = ['#000000', '#4c4c4c', '#740b07', '#c23800', '#e8a200', '#005510', '#008855', '#00569e', '#0e0865', '#550069', '#a75574', '#cc7755', '#63300d'];
const BRUSH_SIZES = [4, 10, 20, 32];

const Toolbar = () => {
    const [selectedColor, setSelectedColor] = useState('#000000');
    const [selectedSize, setSelectedSize] = useState(10);
    const [activeTool, setActiveTool] = useState('brush'); // 'brush', 'fill', 'eraser'

    const handleColorClick = (color) => {
        setSelectedColor(color);
        if (activeTool === 'eraser') {
            setActiveTool('brush');
            window.dispatchEvent(new CustomEvent('toolChange', { detail: { type: 'isErasing', value: false } }));
        }
        window.dispatchEvent(new CustomEvent('toolChange', { detail: { type: 'color', value: color } }));
    };

    const handleSizeClick = (size) => {
        setSelectedSize(size);
        window.dispatchEvent(new CustomEvent('toolChange', { detail: { type: 'size', value: size } }));
    };

    const handleToolSelect = (tool) => {
        setActiveTool(tool);
        window.dispatchEvent(new CustomEvent('toolChange', { detail: { type: 'isErasing', value: tool === 'eraser' } }));
        window.dispatchEvent(new CustomEvent('toolChange', { detail: { type: 'isFilling', value: tool === 'fill' } }));
    };

    const handleClear = () => {
        if (window.confirm('Clear entire canvas?')) window.dispatchEvent(new CustomEvent('toolAction', { detail: { action: 'clear' } }));
    };

    const handleUndo = () => window.dispatchEvent(new CustomEvent('toolAction', { detail: { action: 'undo' } }));

    return (
        <div className="skribbl-toolbar">
            <div className="toolbar-sizes">
                {BRUSH_SIZES.map(size => (
                    <div 
                        key={size}
                        className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                        onClick={() => handleSizeClick(size)}
                    >
                        <div className="size-dot" style={{ width: size, height: size }}></div>
                    </div>
                ))}
            </div>

            <div className="toolbar-colors">
                <div className="color-row">
                    {SKRIBBL_COLORS_TOP.map(c => (
                        <div key={c} className="color-swatch" style={{ backgroundColor: c }} onClick={() => handleColorClick(c)}></div>
                    ))}
                </div>
                <div className="color-row">
                    {SKRIBBL_COLORS_BOT.map(c => (
                        <div key={c} className="color-swatch" style={{ backgroundColor: c }} onClick={() => handleColorClick(c)}></div>
                    ))}
                </div>
                <div className="current-color" style={{ backgroundColor: activeTool === 'eraser' ? '#ffffff' : selectedColor }}></div>
            </div>

            <div className="toolbar-tools">
                <button className={`tool-btn ${activeTool === 'brush' ? 'active' : ''}`} onClick={() => handleToolSelect('brush')}>🖌️</button>
                <button className={`tool-btn ${activeTool === 'fill' ? 'active' : ''}`} onClick={() => handleToolSelect('fill')}>🪣</button>
                <button className={`tool-btn ${activeTool === 'eraser' ? 'active' : ''}`} onClick={() => handleToolSelect('eraser')}>🧹</button>
                <button className="tool-btn action-btn" onClick={handleUndo}>↩️</button>
                <button className="tool-btn action-btn" onClick={handleClear}>🗑️</button>
            </div>
        </div>
    )
};

export default Toolbar;