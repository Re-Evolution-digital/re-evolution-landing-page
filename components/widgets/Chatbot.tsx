'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { trackChatbot } from '@/lib/analytics';
import { brandify } from '@/lib/brand';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  buttons?: { label: string; action: string }[];
}


export default function Chatbot() {
  const t = useTranslations('chatbot');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const conversationHistoryRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const webhookFiredRef = useRef(false);
  const pendingLeadRef = useRef<object | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isTyping && isOpen) {
      inputRef.current?.focus();
    }
  }, [isTyping, isOpen]);

  // Case 3: window/tab close — send whatever data was collected
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingLeadRef.current && !webhookFiredRef.current) {
        webhookFiredRef.current = true;
        const blob = new Blob([JSON.stringify(pendingLeadRef.current)], { type: 'application/json' });
        navigator.sendBeacon('/api/notify', blob);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const fireNotify = async (leadData: object) => {
    if (webhookFiredRef.current) return;
    webhookFiredRef.current = true;
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });
    } catch {
      // silent — data was already stored in pendingLeadRef
    }
  };

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    // Case 2: 3 min of inactivity — send whatever was collected
    inactivityTimerRef.current = setTimeout(() => {
      if (pendingLeadRef.current && !webhookFiredRef.current) {
        fireNotify(pendingLeadRef.current);
      }
    }, 3 * 60 * 1000);
  };

  const openChat = () => {
    setIsOpen(true);
    trackChatbot('open');
    if (!initialized) {
      setMessages([{ id: 1, text: t('greeting'), sender: 'bot' }]);
      setInitialized(true);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const addBotMessage = (text: string, buttons?: { label: string; action: string }[]) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text, sender: 'bot', buttons },
    ]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    trackChatbot('message');

    const messageText = input;
    const userMsg: Message = { id: Date.now(), text: messageText, sender: 'user' };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsTyping(true);

    conversationHistoryRef.current = [
      ...conversationHistoryRef.current,
      { role: 'user', content: messageText },
    ];

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistoryRef.current }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      const replyText: string = data.message ?? t('responses.default');

      addBotMessage(replyText);
      conversationHistoryRef.current = [
        ...conversationHistoryRef.current,
        { role: 'assistant', content: replyText },
      ];

      // Always update pending lead with the latest data from AI
      if (data.lead) {
        pendingLeadRef.current = data.lead;
      }

      // Case 1: all 8 fields confirmed — fire once and never again
      if (data.leadReady && data.lead) {
        fireNotify(data.lead);
      }

      // Case 3.1: client said goodbye — fire with whatever data exists, then reset for potential new conversation
      if (data.goodbye && pendingLeadRef.current && !webhookFiredRef.current) {
        fireNotify(pendingLeadRef.current).then(() => {
          // Reset so a new conversation after goodbye can trigger a new notification
          webhookFiredRef.current = false;
          pendingLeadRef.current = null;
        });
      }

      resetInactivityTimer();
    } catch {
      addBotMessage(t('responses.default'));
    } finally {
      setIsTyping(false);
    }
  };

  const handleButtonClick = (action: string) => {
    if (action === 'diagnosis') {
      setIsOpen(false);
      document.getElementById('diagnostico')?.scrollIntoView({ behavior: 'smooth' });
    } else if (action === 'whatsapp') {
      window.open('https://wa.me/351969063633', '_blank');
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-24 right-6 z-[999] flex items-end gap-2"
          >
            {/* Speech bubble label */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              onClick={openChat}
              className="relative bg-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-lg border border-border/50 cursor-pointer select-none mb-1 max-w-[190px]"
            >
              <p className="text-sm font-bold text-re-blue leading-tight">{t('bot_name')}</p>
              <p className="text-xs text-text-secondary mt-0.5">{t('label_cta')}</p>
            </motion.div>

            {/* Button with glow pulse */}
            <motion.button
              onClick={openChat}
              className="relative w-14 h-14 bg-re-blue rounded-full flex items-center justify-center cursor-pointer"
              animate={{
                scale: [1, 1.08, 1],
                boxShadow: [
                  '0 4px 15px rgba(0, 122, 255, 0.3)',
                  '0 4px 28px rgba(0, 122, 255, 0.65), 0 0 40px rgba(0, 122, 255, 0.25)',
                  '0 4px 15px rgba(0, 122, 255, 0.3)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.12 }}
              aria-label="Open chatbot"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/chatbot-robot-gif.gif"
                alt="Fala Barato"
                width={48}
                height={48}
                className="object-contain rounded-full"
              />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-white animate-pulse" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-[999] w-[360px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-border/50 flex flex-col overflow-hidden"
            style={{ height: '500px', maxHeight: 'calc(100vh - 10rem)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-re-blue text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/chatbot-robot-gif.gif"
                    alt="Fala Barato"
                    width={36}
                    height={36}
                    className="object-contain w-full h-full"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold leading-snug">{brandify(t('header_title'), 'onBlue')}</p>
                  <p className="text-xs text-white/70">{t('status')}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors cursor-pointer"
                aria-label="Close chatbot"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-re-blue text-white rounded-br-sm'
                        : 'bg-bg-secondary text-text-primary rounded-bl-sm'
                    }`}
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {msg.sender === 'bot' ? brandify(msg.text) : msg.text}
                    {msg.buttons && (
                      <div className="flex gap-2 mt-3">
                        {msg.buttons.map((btn) => (
                          <button
                            key={btn.action}
                            onClick={() => handleButtonClick(btn.action)}
                            className="px-3 py-1.5 bg-re-blue text-white text-xs font-semibold rounded-lg hover:bg-[#0056CC] transition-colors cursor-pointer"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-bg-secondary rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  rows={1}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={t('input_placeholder')}
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-re-blue transition-colors resize-none overflow-y-auto leading-5"
                  style={{ maxHeight: '120px' }}
                  disabled={isTyping}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-re-blue text-white rounded-lg hover:bg-[#0056CC] transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
                  aria-label={t('send')}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
