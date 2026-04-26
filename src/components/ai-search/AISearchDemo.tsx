import React, { useState, useEffect, useRef, useCallback } from 'react';
import { buildSystemPrompt } from '../../ai/systemPrompt';
import {
  createConversation, getConversations, deleteConversation,
  addMessage, getMessages, clearAllData,
  type Conversation, type ChatMessage,
} from '../../ai/chatDB';

const API_URL = 'https://api.deepseek.com/chat/completions';
const LS_KEY = 'three-kingdoms-deepseek-key';

export function AISearchDemo() {
  // API Key
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_KEY) || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState('');

  // Conversations
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load conversations on mount
  useEffect(() => {
    getConversations().then(setConvos).catch(() => {});
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConvoId) {
      getMessages(activeConvoId).then(setMessages).catch(() => {});
    } else {
      setMessages([]);
    }
  }, [activeConvoId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveApiKey = useCallback(() => {
    localStorage.setItem(LS_KEY, tempKey.trim());
    setApiKey(tempKey.trim());
    setShowKeyInput(false);
  }, [tempKey]);

  const handleNewConvo = useCallback(async () => {
    const convo = await createConversation();
    setConvos(prev => [convo, ...prev]);
    setActiveConvoId(convo.id);
    setError(null);
  }, []);

  const handleDeleteConvo = useCallback(async (id: string) => {
    await deleteConversation(id);
    setConvos(prev => prev.filter(c => c.id !== id));
    if (activeConvoId === id) {
      setActiveConvoId(null);
      setMessages([]);
    }
  }, [activeConvoId]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    if (!apiKey) { setShowKeyInput(true); return; }

    const userMsg = input.trim();
    setInput('');
    setError(null);

    let convoId = activeConvoId;
    if (!convoId) {
      const convo = await createConversation();
      setConvos(prev => [convo, ...prev]);
      convoId = convo.id;
      setActiveConvoId(convoId);
    }

    // Add user message
    const userChatMsg = await addMessage(convoId, 'user', userMsg);
    setMessages(prev => [...prev, userChatMsg]);
    setIsLoading(true);

    // Build messages array for API
    const history = await getMessages(convoId);
    const apiMessages = [
      { role: 'system', content: buildSystemPrompt() },
      ...history.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content,
      })),
    ];

    try {
      const abort = new AbortController();
      abortRef.current = abort;

      const body: any = {
        model: 'deepseek-chat',
        messages: apiMessages,
        stream: true,
        max_tokens: 4096,
        temperature: 0.7,
      };

      if (webSearch) {
        body.tools = [{ type: 'web_search', web_search: { enable: true, search_mode: 'pro' } }];
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: abort.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API错误: ${response.status}`);
      }

      // Stream response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let fullContent = '';
      let assistantMsg: ChatMessage | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              // Update UI with streaming content
              setMessages(prev => {
                const existing = prev.find(m => m.id === assistantMsg?.id);
                if (existing) {
                  return prev.map(m => m.id === assistantMsg?.id ? { ...m, content: fullContent } : m);
                } else {
                  // Create placeholder assistant message
              assistantMsg = {
                id: 'streaming-' + Date.now(),
                role: 'assistant',
                content: fullContent,
                timestamp: Date.now(),
                conversationId: convoId!,
              };
              return [...prev, assistantMsg];
                }
              });
            }
          } catch { /* skip invalid JSON */ }
        }
      }

      // Save final assistant message to DB
      if (fullContent) {
        const savedMsg = await addMessage(convoId!, 'assistant', fullContent);
        setMessages(prev => {
          const filtered = prev.filter(m => !m.id.startsWith('streaming-'));
          return [...filtered, savedMsg];
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || '请求失败');
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, apiKey, activeConvoId, webSearch]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleClearAll = useCallback(async () => {
    await clearAllData();
    setConvos([]);
    setActiveConvoId(null);
    setMessages([]);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100%', background: '#0d1117', color: '#e8e0d0' }}>
      {/* Sidebar */}
      {showSidebar && (
        <div style={{
          width: '260px', minWidth: '260px',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>💬 对话记录</span>
              <button onClick={handleNewConvo} style={{
                background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)',
                borderRadius: '6px', padding: '4px 10px', color: '#c9a96e', fontSize: '12px', cursor: 'pointer',
              }}>+ 新对话</button>
            </div>
            {convos.length > 0 && (
              <button onClick={handleClearAll} style={{
                background: 'none', border: 'none', color: 'rgba(232,224,208,0.3)',
                fontSize: '11px', cursor: 'pointer', padding: 0,
              }}>清空全部</button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {convos.map(c => (
              <div key={c.id} onClick={() => setActiveConvoId(c.id)} style={{
                padding: '10px 12px', marginBottom: '4px', borderRadius: '6px', cursor: 'pointer',
                background: activeConvoId === c.id ? 'rgba(201,169,110,0.12)' : 'transparent',
                borderLeft: activeConvoId === c.id ? '3px solid #c9a96e' : '3px solid transparent',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(232,224,208,0.3)', marginTop: '2px' }}>
                    {c.messageCount}条消息
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteConvo(c.id); }} style={{
                  background: 'none', border: 'none', color: 'rgba(232,224,208,0.2)',
                  cursor: 'pointer', fontSize: '14px', padding: '2px 4px', borderRadius: '4px',
                }}>×</button>
              </div>
            ))}
            {convos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(232,224,208,0.2)', fontSize: '13px' }}>
                暂无对话记录
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setShowSidebar(!showSidebar)} style={{
              background: 'none', border: 'none', color: 'rgba(232,224,208,0.5)',
              fontSize: '18px', cursor: 'pointer',
            }}>{showSidebar ? '◀' : '▶'}</button>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>🔍 AI 搜索</h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(232,224,208,0.4)' }}>
                基于 DeepSeek · 三国知识库 · {webSearch ? '🌐 联网搜索已开启' : '本地知识库'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setWebSearch(!webSearch)}
              style={{
                background: webSearch ? 'rgba(74,144,217,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${webSearch ? 'rgba(74,144,217,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '6px', padding: '5px 12px', color: webSearch ? '#4A90D9' : 'rgba(232,224,208,0.4)',
                fontSize: '12px', cursor: 'pointer',
              }}
            >🌐 联网搜索</button>
            <button onClick={() => setShowKeyInput(!showKeyInput)} style={{
              background: apiKey ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${apiKey ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '6px', padding: '5px 12px', color: apiKey ? '#4ADE80' : 'rgba(232,224,208,0.4)',
              fontSize: '12px', cursor: 'pointer',
            }}>
              {apiKey ? '✓ API Key' : '🔑 设置Key'}
            </button>
          </div>
        </div>

        {/* API Key Input */}
        {showKeyInput && (
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'rgba(232,224,208,0.6)' }}>
              请输入您的 DeepSeek API Key（<a href="https://platform.deepseek.com/api_keys" target="_blank" style={{ color: '#4A90D9' }}>获取Key</a>）
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="sk-..."
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(201,169,110,0.2)', borderRadius: '6px',
                  padding: '8px 12px', color: '#e8e0d0', fontSize: '14px', outline: 'none',
                }}
                onKeyDown={(e) => e.key === 'Enter' && saveApiKey()}
              />
              <button onClick={saveApiKey} style={{
                background: 'rgba(201,169,110,0.2)', border: '1px solid rgba(201,169,110,0.4)',
                borderRadius: '6px', padding: '8px 16px', color: '#c9a96e', fontSize: '14px', cursor: 'pointer',
              }}>保存</button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏛️</div>
              <h3 style={{ color: '#e8e0d0', marginBottom: '8px' }}>三国历史 AI 助手</h3>
              <p style={{ color: 'rgba(232,224,208,0.4)', fontSize: '14px', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                基于 DeepSeek 大模型，内置三国历史知识库。<br />
                可以回答关于人物、事件、战役、地理、著作等问题。<br />
                {!apiKey && <span style={{ color: '#D94A4A' }}>请先设置 API Key 开始对话</span>}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
                {['赤壁之战的经过', '诸葛亮北伐为什么失败', '三国时期有哪些著名兵法', '曹操和刘备的关系'].map(q => (
                  <button key={q} onClick={() => setInput(q)} style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px', padding: '6px 14px', color: 'rgba(232,224,208,0.5)',
                    fontSize: '13px', cursor: 'pointer',
                  }}>{q}</button>
                ))}
              </div>
            </div>
          )}
          {messages.filter(m => !m.id.startsWith('streaming-') || m.content).map(msg => (
            <div key={msg.id} style={{
              display: 'flex', marginBottom: '16px',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '75%', padding: '12px 16px', borderRadius: '12px',
                background: msg.role === 'user'
                  ? 'rgba(201,169,110,0.15)'
                  : 'rgba(255,255,255,0.04)',
                border: msg.role === 'user'
                  ? '1px solid rgba(201,169,110,0.2)'
                  : '1px solid rgba(255,255,255,0.06)',
                lineHeight: 1.7, fontSize: '14px',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div style={{ color: 'rgba(232,224,208,0.3)', fontSize: '13px', padding: '8px 0' }}>
              正在思考...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '8px 20px', background: 'rgba(217,74,74,0.1)',
            borderTop: '1px solid rgba(217,74,74,0.2)',
            color: '#D94A4A', fontSize: '13px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} style={{
              background: 'none', border: 'none', color: '#D94A4A', cursor: 'pointer',
            }}>×</button>
          </div>
        )}

        {/* Input Area */}
        <div style={{
          padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入您的问题... (Enter发送, Shift+Enter换行)"
              rows={1}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                padding: '10px 14px', color: '#e8e0d0', fontSize: '14px',
                outline: 'none', resize: 'none', maxHeight: '120px',
                lineHeight: 1.5, fontFamily: 'inherit',
              }}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
            />
            {isLoading ? (
              <button onClick={handleStop} style={{
                background: 'rgba(217,74,74,0.2)', border: '1px solid rgba(217,74,74,0.3)',
                borderRadius: '8px', padding: '10px 16px', color: '#D94A4A', fontSize: '14px',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>⏹ 停止</button>
            ) : (
              <button onClick={handleSend} disabled={!input.trim()} style={{
                background: input.trim() ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${input.trim() ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px', padding: '10px 16px',
                color: input.trim() ? '#c9a96e' : 'rgba(232,224,208,0.3)',
                fontSize: '14px', cursor: input.trim() ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
              }}>发送 ➤</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
