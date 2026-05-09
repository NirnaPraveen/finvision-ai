import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chatWithAI } from '@/lib/gemini';
import { useFinance } from '@/context/FinanceContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: "Hi! I'm FinVision AI. How can I help you with your finances today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { expenses, sharedExpenses, subscriptions } = useFinance();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const context = { expenses: expenses.slice(0, 5), sharedExpenses, subscriptions };
    const aiResponse = await chatWithAI(userMsg, context);
    
    setMessages(prev => [...prev, { role: 'ai', text: aiResponse || "I'm sorry, I couldn't process that." }]);
    setIsTyping(false);
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full ios-btn premium-gradient shadow-2xl shadow-brand-500/30 z-50 p-0"
      >
        <MessageSquare className="w-7 h-7 text-white" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-28 right-8 w-[400px] h-[600px] glass-card rounded-[2.5rem] z-50 flex flex-col overflow-hidden border-white/40 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="p-6 premium-gradient text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">FinVision AI</h3>
                  <p className="text-[11px] font-bold text-brand-100 uppercase tracking-widest">Always Active</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors active:scale-90">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={cn(
                    "flex gap-4 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}>
                    <div className={cn(
                      "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                      msg.role === 'ai' ? "bg-white dark:bg-white/5 text-brand-600 dark:text-brand-400 border border-slate-100 dark:border-white/5" : "bg-brand-600 text-white"
                    )}>
                      {msg.role === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className={cn(
                      "p-4 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm",
                      msg.role === 'ai' ? "bg-white/80 dark:bg-white/10 text-slate-800 dark:text-gray-200 rounded-tl-none border border-white/40 dark:border-white/5" : "bg-brand-600 text-white rounded-tr-none"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-4 max-w-[90%]">
                    <div className="w-9 h-9 rounded-2xl bg-white dark:bg-white/5 text-brand-600 dark:text-brand-400 border border-slate-100 dark:border-white/5 flex items-center justify-center shadow-sm">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="bg-white/80 dark:bg-white/10 p-4 rounded-[1.5rem] rounded-tl-none border border-white/40 dark:border-white/5 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-gray-600 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-gray-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-gray-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-6 bg-white/40 dark:bg-black/40 backdrop-blur-md border-t border-white/20 dark:border-gray-800">
              <div className="flex items-center gap-3 bg-white/60 dark:bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/40 dark:border-white/10 shadow-inner focus-within:bg-white dark:focus-within:bg-white/10 focus-within:shadow-md transition-all duration-300">
                <input 
                  type="text" 
                  placeholder="Ask about your spending..." 
                  className="flex-1 bg-transparent border-none outline-none px-3 text-sm font-medium placeholder:text-slate-400 dark:text-white"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSend()}
                />
                <Button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl premium-gradient p-0 shadow-lg shadow-brand-500/20 active:scale-90 transition-transform"
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


