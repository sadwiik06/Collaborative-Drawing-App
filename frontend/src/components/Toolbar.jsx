import React, { useState } from 'react';

const Toolbar = () => {
    const colorPickerRef = React.useRef(null);
    const brushSizeRef = React.useRef(null);
    const [isRainbow, setIsRainbow] = useState(false);
    const [isTrail, setIsTrail] = useState(false);
    const [isErasing, setIsErasing] = useState(false);

    const handleColorChange = (e) => {
        window.dispatchEvent(new CustomEvent('toolChange', { detail: { type: 'color', value: e.target.value } }));
        setIsErasing(false);
        setIsRainbow(false);
        window.dispatchEvent(new CustomEvent('toolChange', { detail: { type: 'isErasing', value: false } }));
        window.dispatchEvent(new CustomEvent('toolChange', { detail: { type: 'isRainbow', value: false } }));
    };

    const handleShare = ()=>{
        navigator.clipboard.writeText(window.location.href);
        alert('Room link copied to clipboard! share it with your frined');
    }

    const handleBrushSize = (e) => {
        window.dispatchEvent(new CustomEvent('toolChange', { detail: { type: 'size', value: e.target.value } }));
    };

    const handleEraser = () => {
        const newVal = !isErasing;
        setIsErasing(newVal);
        if (newVal) {
             setIsRainbow(false);
             window.dispatchEvent(new CustomEvent('toolChange', { detail: { type: 'isRainbow', value: false } }));
        }
        window.dispatchEvent(new CustomEvent('toolChange', { detail: { type: 'isErasing', value: newVal } }));
    };

    const handleRainbow = () => {
        const newVal = !isRainbow;
        setIsRainbow(newVal);
        if (newVal) {
             setIsErasing(false);
             window.dispatchEvent(new CustomEvent('toolChange', { detail: { type: 'isErasing', value: false } }));
        }
        window.dispatchEvent(new CustomEvent('toolChange', { detail: { type: 'isRainbow', value: newVal } }));
    };

    const handleTrail = () => {
        const newVal = !isTrail;
        setIsTrail(newVal);
        window.dispatchEvent(new CustomEvent('toolChange', { detail: { type: 'isTrail', value: newVal } }));
    };

    const handleClear = () => {
        if (window.confirm('Clear entire canvas?')) {
            window.dispatchEvent(new CustomEvent('toolAction', { detail: { action: 'clear' } }));
        }
    };

    const handleSave = () => {
        window.dispatchEvent(new CustomEvent('toolAction', { detail: { action: 'save' } }));
    };

    return (
        <div className="toolbar">
            <input type="color" ref={colorPickerRef} onChange={handleColorChange} defaultValue="#000000" />
            <input type="range" ref={brushSizeRef} min="1" max="50" defaultValue="5" onChange={handleBrushSize} />
            
            <button onClick={handleEraser} style={{ background: isErasing ? '#ffaa88' : '' }}>Eraser</button>
            <button onClick={handleRainbow} style={{ background: isRainbow ? '#ffaa44' : '' }}>Rainbow</button>
            <button onClick={handleTrail} style={{ background: isTrail ? '#88ccff' : '' }}>Trail</button>
            
            <button onClick={handleClear}>Clear</button>
            <button onClick={handleSave} style={{ backgroundColor: '#ffffffff', border: '1px solid #ccc' }}>Save as JPEG</button>
        </div>
    )
};

export default Toolbar;