
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Seller } from '@/lib/types';
import { generateChatResponse } from '@/ai/flows/generate-chat-response';
import { Button } from './ui/button';
import { Card, CardHeader, CardContent, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { AppLogo } from './app-logo';
import { LiquidLoader } from './liquid-loader';
import { Bot, MessageSquare, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiChatWidgetProps {
  seller: Seller;
}

type Message = {
  role: 'user' | 'model';
  content: string;
};

export function AiChatWidget({ seller }: AiChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const config = seller.aiAssistantConfig;
  const policies = seller.customization?.policies;

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  };
  
  useEffect(scrollToBottom, [messages]);
  
  if (!config?.enabled) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { answer } = await generateChatResponse({
        history: messages,
        question: input,
        instructions: config.instructions,
        faqs: config.faqs,
        shippingPolicy: policies?.shippingPolicy,
        returnPolicy: policies?.returnPolicy,
      });

      const modelMessage: Message = { role: 'model', content: answer };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: Message = { role: 'model', content: "Sorry, I'm having trouble connecting. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="icon"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="size-6" /> : <Bot className="size-6" />}
        </Button>
      </div>

      {isOpen && (
        <Card className="fixed bottom-20 right-4 z-50 w-80 h-96 flex flex-col shadow-xl">
          <CardHeader className="flex flex-row items-center gap-3 bg-secondary p-4">
             <AppLogo className="size-8 text-primary" />
            <div>
              <h3 className="font-semibold text-base">{seller.name} Assistant</h3>
              <p className="text-xs text-muted-foreground">Powered by AI</p>
            </div>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4" ref={scrollAreaRef}>
                {messages.map((msg, index) => (
                  <div key={index} className={cn("flex items-end gap-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    {msg.role === 'model' && (
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="size-4" /></AvatarFallback>
                      </Avatar>
                    )}
                     <div className={cn("max-w-[80%] rounded-lg p-2 text-sm", msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                    <div className="flex items-end gap-2 justify-start">
                         <Avatar className="size-7">
                            <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="size-4" /></AvatarFallback>
                        </Avatar>
                        <div className="max-w-[80%] rounded-lg p-2 text-sm bg-muted">
                            <LiquidLoader />
                        </div>
                    </div>
                )}
                 {messages.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground pt-8">
                        <MessageSquare className="size-8 mx-auto mb-2" />
                        <p>Ask me anything about this store!</p>
                    </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-2 border-t">
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                autoComplete="off"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="size-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
