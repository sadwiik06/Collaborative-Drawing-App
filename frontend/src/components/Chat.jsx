import React, { useState, useRef, useEffect } from 'react';

import '../App.css';
const Chat = ({ messages = [], onSendMessage, disabled = false, isDrawer = false }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || disabled) return;
        onSendMessage(input.trim());
        setInput('');
    };

    const getMessageClass = (msg) => {
        if (msg.type === 'correct') return 'chat-msg correct';
        if (msg.type === 'system') return 'chat-msg system';
        return 'chat-msg';
    };

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <h3>Chat & Guesses</h3>
            </div>
            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="chat-empty">Chat is empty.</div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={getMessageClass(msg)}>
                        {msg.username && <span className="chat-username">{msg.username}: </span>}
                        <span className="chat-text">{msg.message}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isDrawer ? "You are drawing..." : "Type your guess..."}
                    disabled={disabled || isDrawer}
                    autoComplete="off"
                />
                <button type="submit" disabled={disabled || isDrawer}>Send</button>
            </form>
        </div>
    );
};

export default Chat;
