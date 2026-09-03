
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Archive,
  Search,
  Send,
  Paperclip,
  Phone,
  Mail,
  MessageSquare,
  MoreVertical,
  ArrowLeft,
  SquarePen,
    Star,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Customer, Conversation, Message } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { LiquidLoader } from '@/components/liquid-loader';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function MessagesPage() {
    const { user, seller, sellerCustomers, sellerMessages, sendMessage, loading } = useAuth();
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'starred'>('all');
    const [starredConversationIds, setStarredConversationIds] = useState<string[]>([]);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const conversations = useMemo((): Conversation[] => {
        if (!sellerCustomers.length) return [];

        return sellerCustomers.map(customer => {
            const customerMessages = sellerMessages
                .filter(m => m.customerId === customer.id)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            const lastMessage = customerMessages[customerMessages.length - 1];

            return {
                id: customer.id,
                customerId: customer.id,
                customerName: customer.name,
                customerAvatar: customer.avatar,
                lastMessage: lastMessage || { id: '', text: 'No messages yet', timestamp: customer.lastOrderDate, senderId: '', read: true, customerId: customer.id },
                messages: customerMessages,
                unreadCount: customerMessages.filter(m => m.read === false && m.senderId !== user?.id).length,
            };
        }).sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
    }, [sellerCustomers, sellerMessages, user?.id]);

    const selectedConversation = useMemo(() => {
        return conversations.find(c => c.id === selectedConversationId) || null;
    }, [selectedConversationId, conversations]);

    const filteredConversations = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return conversations.filter((conversation) => {
            const matchesSearch = !query ||
                conversation.customerName.toLowerCase().includes(query) ||
                conversation.lastMessage.text.toLowerCase().includes(query);
            const matchesFilter = activeFilter === 'all' ||
                (activeFilter === 'unread' && conversation.unreadCount > 0) ||
                (activeFilter === 'starred' && starredConversationIds.includes(conversation.id));
            return matchesSearch && matchesFilter;
        });
    }, [activeFilter, conversations, searchQuery, starredConversationIds]);

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedConversation || !seller) return;
        setIsSending(true);
        await sendMessage(selectedConversation.customerId, replyText);
        setReplyText('');
        setIsSending(false);
    };

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
        }
    }, [selectedConversation?.messages]);

    if (loading) {
        return <Skeleton className="h-full w-full" />
    }

    const ConversationList = (
        <div className="flex h-full min-h-0 flex-col bg-background">
            <ScrollArea className="min-h-0 flex-1">
                {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => (
                    <button
                        key={conv.id}
                        className={cn(
                        'flex w-full items-start gap-3 border-b border-border/70 px-3 py-3 text-left text-sm transition-colors hover:bg-muted/40',
                        selectedConversationId === conv.id && 'bg-muted/60'
                        )}
                        onClick={() => setSelectedConversationId(conv.id)}
                    >
                        <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={conv.customerAvatar} alt={conv.customerName} />
                            <AvatarFallback>{conv.customerName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center">
                                <span className="truncate font-medium text-foreground">{conv.customerName}</span>
                                <span className={cn(
                                    'ml-2 shrink-0 text-[11px]',
                                    conv.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                                )}>
                                    {formatDistanceToNow(new Date(conv.lastMessage.timestamp), { addSuffix: false })}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2">
                                <p className="line-clamp-1 min-w-0 flex-1 text-xs text-muted-foreground">
                                  {conv.lastMessage.senderId === user?.id ? 'You: ' : ''}{conv.lastMessage.text}
                                </p>
                                <span
                                    role="button"
                                    tabIndex={0}
                                    aria-label={starredConversationIds.includes(conv.id) ? 'Unstar conversation' : 'Star conversation'}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setStarredConversationIds((current) => current.includes(conv.id) ? current.filter((id) => id !== conv.id) : [...current, conv.id]);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            setStarredConversationIds((current) => current.includes(conv.id) ? current.filter((id) => id !== conv.id) : [...current, conv.id]);
                                        }
                                    }}
                                    className="shrink-0 text-muted-foreground hover:text-foreground"
                                >
                                    <Star className={cn('size-3.5', starredConversationIds.includes(conv.id) && 'fill-current text-foreground')} />
                                </span>
                                {conv.unreadCount > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-foreground px-1 text-[11px] font-medium text-background">{conv.unreadCount}</span>}
                            </div>
                        </div>
                    </button>
                ))
                ) : (
                <div className="flex min-h-[180px] flex-col items-center justify-center px-4 text-center text-muted-foreground">
                    <MessageSquare className="mb-2 size-6" strokeWidth={1.5} />
                    <p className="text-sm font-medium">{conversations.length ? 'No conversations found' : 'No messages yet'}</p>
                    <p className="mt-1 text-xs">{conversations.length ? 'Try a different search or filter.' : 'When you receive a new message, it will appear here.'}</p>
                </div>
                )}
            </ScrollArea>
        </div>
    );
    
    return (
        <>
            <div className="flex h-full min-h-0 flex-col gap-3">
              <div className={cn('flex shrink-0 flex-col gap-3', selectedConversationId && 'hidden md:flex')}>
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">Messages</h2>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Compose message">
                            <SquarePen className="size-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Message options"><MoreVertical className="size-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Archived</DropdownMenuItem>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search messages" className="h-10 border-border bg-background pl-9 text-sm shadow-none" />
                </div>
                <div className="flex items-center gap-1 border-b border-border/70">
                    {(['all', 'unread', 'starred'] as const).map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            onClick={() => setActiveFilter(filter)}
                            className={cn('border-b-2 px-3 py-2 text-xs font-medium capitalize transition-colors', activeFilter === filter ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
              </div>

            <div className="min-h-0 flex-1 overflow-hidden md:hidden">
                 {selectedConversationId ? (
                    <div className="h-full flex flex-col">
                        <ChatViewHeader
                            conversation={selectedConversation}
                            onBack={() => setSelectedConversationId(null)}
                            onOpenContactInfo={() => setIsContactInfoOpen(true)}
                        />
                         <div className="flex-grow relative">
                            <ScrollArea className="h-full absolute inset-0 z-10">
                                <div className="p-4 space-y-4" ref={scrollAreaRef}>
                                    {selectedConversation?.messages.map((message) => (
                                       <ChatMessage key={message.id} message={message} currentUserId={user?.id} conversation={selectedConversation} />
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                        <ChatInputFooter
                            replyText={replyText}
                            setReplyText={setReplyText}
                            handleSendReply={handleSendReply}
                            isSending={isSending}
                        />
                    </div>
                 ) : (
                    ConversationList
                 )}
            </div>
            
            <ResizablePanelGroup
                direction="horizontal"
                className="min-h-0 flex-1 items-stretch hidden md:flex"
            >
                <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
                    {ConversationList}
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={70}>
                    <div className="flex h-full flex-col">
                        {selectedConversation ? (
                            <>
                                <ChatViewHeader
                                    conversation={selectedConversation}
                                    onOpenContactInfo={() => setIsContactInfoOpen(true)}
                                />
                                <div className="flex-grow relative">
                                     <ScrollArea className="h-full absolute inset-0 z-10">
                                        <div className="p-4 space-y-4" ref={scrollAreaRef}>
                                            {selectedConversation.messages.map((message) => (
                                                <ChatMessage key={message.id} message={message} currentUserId={user?.id} conversation={selectedConversation} />
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                                <ChatInputFooter
                                    replyText={replyText}
                                    setReplyText={setReplyText}
                                    handleSendReply={handleSendReply}
                                    isSending={isSending}
                                />
                            </>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center px-4 text-center text-muted-foreground">
                                <MessageSquare className="mb-3 size-7" strokeWidth={1.5} />
                                <p className="text-sm font-medium text-foreground">Select a conversation</p>
                                <p className="mt-1 max-w-xs text-xs">Choose a conversation from the list to start messaging.</p>
                            </div>
                        )}
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
            </div>

            <Sheet open={isContactInfoOpen} onOpenChange={setIsContactInfoOpen}>
                 <SheetContent className="w-[400px] sm:w-[440px]">
                    <SheetHeader>
                        <SheetTitle>Contact Information</SheetTitle>
                        <SheetDescription>
                            Details for {selectedConversation?.customerName}.
                        </SheetDescription>
                    </SheetHeader>
                     <div className="h-full flex flex-col p-4 gap-4">
                        <div className="flex flex-col items-center gap-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={selectedConversation?.customerAvatar} alt={selectedConversation?.customerName} />
                                <AvatarFallback>{selectedConversation?.customerName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-xl text-center">{selectedConversation?.customerName}</p>
                                <p className="text-sm text-muted-foreground text-center">Customer</p>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Email</p>
                                    <a href={`mailto:${sellerCustomers.find(c=>c.id === selectedConversationId)?.email}`} className="text-primary hover:underline">{sellerCustomers.find(c=>c.id === selectedConversationId)?.email}</a>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground" />
                                 <div>
                                    <p className="font-medium">Phone</p>
                                    <p>{sellerCustomers.find(c=>c.id === selectedConversationId)?.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

const ChatViewHeader = ({ conversation, onBack, onOpenContactInfo }: { conversation: Conversation | null, onBack?: () => void, onOpenContactInfo: () => void }) => {
    if (!conversation) return null;
    
    return (
        <div className="flex items-center p-2 border-b bg-card">
            {onBack && <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}><ArrowLeft/></Button>}
            <div className="flex items-center gap-3 cursor-pointer" onClick={onOpenContactInfo}>
                <Avatar>
                    <AvatarImage src={conversation.customerAvatar} alt={conversation.customerName} />
                    <AvatarFallback>{conversation.customerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-0.5">
                    <p className="font-semibold">{conversation.customerName}</p>
                    <p className="text-xs text-muted-foreground">Click for contact info</p>
                </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="icon"><Search className="size-5 text-muted-foreground"/></Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon"><MoreVertical className="size-5 text-muted-foreground"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onOpenContactInfo}>Contact Info</DropdownMenuItem>
                        <DropdownMenuItem>Select Messages</DropdownMenuItem>
                        <DropdownMenuItem>Archive Chat</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete Chat</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

const ChatMessage = ({ message, currentUserId, conversation }: { message: Message, currentUserId: string | undefined, conversation: Conversation | null }) => {
    const isUser = message.senderId === currentUserId;
    return (
        <div className={cn("flex items-end gap-2 max-w-[85%]", isUser ? "justify-end ml-auto" : "justify-start")}>
            {!isUser && (
                <Avatar className="size-7">
                    <AvatarImage src={conversation?.customerAvatar} />
                    <AvatarFallback>{conversation?.customerName.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                "rounded-lg px-3 py-2 text-sm shadow-sm",
                isUser ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
                <p>{message.text}</p>
                <p className={cn(
                    "text-xs mt-1 text-right", 
                    isUser ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                        {format(new Date(message.timestamp), 'p')}
                </p>
            </div>
        </div>
    );
}

const ChatInputFooter = ({ replyText, setReplyText, handleSendReply, isSending }: { replyText: string, setReplyText: (text: string) => void, handleSendReply: () => void, isSending: boolean }) => (
    <div className="p-3 border-t bg-card">
        <div className="relative">
            <Textarea
                placeholder="Type a message..."
                className="pr-24"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                }
            }}
            />
            <div className="absolute top-1/2 -translate-y-1/2 right-2 flex gap-1">
                <Button type="button" variant="ghost" size="icon" disabled={isSending}>
                    <Paperclip className="size-5" />
                </Button>
                <Button type="submit" size="icon" disabled={!replyText.trim() || isSending} onClick={handleSendReply}>
                    {isSending ? <LiquidLoader /> : <Send className="size-5" />}
                </Button>
            </div>
        </div>
    </div>
);


    