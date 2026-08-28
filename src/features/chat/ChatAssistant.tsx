import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Stethoscope,
  PhoneCall,
  Menu,
  X,
  HeartPulse,
  Flame,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  ChatMessage,
  ConversationSummary,
  ConversationDetail,
  TriageUrgency,
} from '../../types/index.js';
import { ConversationSidebar } from './ConversationSidebar.js';
import { MessageBubble } from './MessageBubble.js';
import { MessageInput } from './MessageInput.js';
import { ClinicalReasoningIndicator } from './ClinicalReasoningIndicator.js';
import { Badge, Alert, Button } from '../../components/ui/index.js';

interface ChatAssistantProps {
  onNavigateToTriage?: () => void;
  onOpenEmergency?: () => void;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  onNavigateToTriage,
  onOpenEmergency,
}) => {
  const { language } = useLanguage();
  const { token, isAuthenticated } = useAuth();
  const isAr = language === 'ar';

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper for auth headers
  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Local guest session storage
      let guestId = localStorage.getItem('omni_guest_session_id');
      if (!guestId) {
        guestId = 'gst_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('omni_guest_session_id', guestId);
      }
      headers['x-guest-session-id'] = guestId;
    }
    return headers;
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [token]);

  const loadConversations = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      const res = await fetch('/api/chat/conversations', {
        headers: getHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        const list = data.conversations || [];
        setConversations(list);

        if (list.length > 0) {
          const firstId = list[0].id;
          setActiveConversationId(firstId);
          await loadConversationDetail(firstId);
        } else {
          // Create initial conversation automatically
          await handleCreateNewConversation();
        }
      } else {
        throw new Error('Failed to load conversations');
      }
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(
        isAr
          ? 'تعذر تحميل سجل المحادثات السريرية، يمكنك المتابعة وسيتم حفظ محادثتك تلقائياً.'
          : 'Unable to load consultation history. You may proceed and your conversation will be safely saved.'
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const loadConversationDetail = async (convId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`, {
        headers: getHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data.conversation);
        setMessages(data.conversation.messages || []);
      }
    } catch (err) {
      console.error('Error loading conversation detail:', err);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    setIsSidebarOpenMobile(false);
    await loadConversationDetail(convId);
  };

  const handleCreateNewConversation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title: isAr ? 'محادثة صحية جديدة' : 'New Clinical Consultation',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newConv = data.conversation;
        setActiveConversationId(newConv.id);
        setActiveConversation(newConv);
        setMessages(newConv.messages || []);
        setConversations((prev) => [
          {
            id: newConv.id,
            title: newConv.title,
            createdAt: newConv.createdAt,
            updatedAt: newConv.updatedAt,
            messageCount: newConv.messages.length,
            lastMessage: newConv.messages[0]?.content || '',
            urgency: newConv.clinicalContext.urgency || 'ROUTINE',
            status: newConv.status,
          },
          ...prev,
        ]);
        setIsSidebarOpenMobile(false);
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameConversation = async (convId: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}/title`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ title: newTitle }),
      });

      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
        );
        if (activeConversation && activeConversation.id === convId) {
          setActiveConversation({ ...activeConversation, title: newTitle });
        }
      }
    } catch (err) {
      console.error('Error renaming conversation:', err);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (res.ok) {
        const remaining = conversations.filter((c) => c.id !== convId);
        setConversations(remaining);

        if (activeConversationId === convId) {
          if (remaining.length > 0) {
            setActiveConversationId(remaining[0].id);
            await loadConversationDetail(remaining[0].id);
          } else {
            await handleCreateNewConversation();
          }
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // Optimistically append user message to UI
    const tempUserMsg: ChatMessage = {
      id: 'usr_temp_' + Date.now(),
      sender: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);
    setError(null);

    const convId = activeConversationId || 'conv-default';

    try {
      const response = await fetch(`/api/chat/conversations/${convId}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          message: textToSend.trim(),
          language: language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const serverAssistantMsg: ChatMessage = data.message;
        const updatedConv: ConversationDetail = data.conversation;

        setMessages(updatedConv.messages);
        setActiveConversation(updatedConv);

        // Update list metadata
        setConversations((prev) =>
          prev.map((c) =>
            c.id === updatedConv.id
              ? {
                  ...c,
                  title: updatedConv.title,
                  updatedAt: updatedConv.updatedAt,
                  messageCount: updatedConv.messages.length,
                  lastMessage: serverAssistantMsg.content,
                  urgency: serverAssistantMsg.urgencyTag || c.urgency,
                  status: updatedConv.status,
                }
              : c
          )
        );
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || 'Gateway response failed');
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(
        isAr
          ? 'حدث خطأ في الاتصال بالبوابة السريرية، يرجى المحاولة مجدداً.'
          : 'Encountered a gateway communication issue. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clinicalContext = activeConversation?.clinicalContext;
  const isEmergency = clinicalContext?.urgency === 'EMERGENCY';

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8.5rem)] min-h-[600px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Mobile Drawer Toggle */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {isSidebarOpenMobile ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <span className="text-xs font-bold text-slate-200 truncate max-w-[200px]">
            {activeConversation?.title || (isAr ? 'المحادثة الحالية' : 'Current Chat')}
          </span>
        </div>

        {onOpenEmergency && (
          <button
            onClick={onOpenEmergency}
            className="text-rose-400 font-bold text-xs inline-flex items-center gap-1"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>997 / 911</span>
          </button>
        )}
      </div>

      {/* Sidebar: Conversation List */}
      <div
        className={`${
          isSidebarOpenMobile ? 'block' : 'hidden'
        } lg:block z-20 shrink-0 h-full`}
      >
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onCreateNewConversation={handleCreateNewConversation}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          isLoading={isLoading}
        />
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full bg-slate-950/80 overflow-hidden relative">
        {/* Top Clinical Context Bar */}
        <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Stethoscope className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="font-bold text-slate-200">
                {activeConversation?.title || (isAr ? 'المساعد الطبي الذكي' : 'AI Medical Companion')}
              </span>
              {clinicalContext?.primarySymptom && (
                <span className="hidden sm:inline-block text-slate-400 ms-2 text-[11px]">
                  ({isAr ? 'الشكوى المسجلة:' : 'Logged:'} {clinicalContext.primarySymptom})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {clinicalContext?.urgency && (
              <Badge
                variant={
                  clinicalContext.urgency === 'EMERGENCY'
                    ? 'destructive'
                    : clinicalContext.urgency === 'URGENT'
                    ? 'warning'
                    : 'info'
                }
                size="sm"
              >
                {clinicalContext.urgency === 'EMERGENCY'
                  ? isAr ? 'طوارئ فورية' : 'Emergency'
                  : clinicalContext.urgency === 'URGENT'
                  ? isAr ? 'رعاية عاجلة' : 'Urgent Care'
                  : isAr ? 'استشارة روتينية' : 'Routine'}
              </Badge>
            )}

            {onNavigateToTriage && (
              <button
                onClick={onNavigateToTriage}
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <HeartPulse className="w-3 h-3 text-emerald-400" />
                <span>{isAr ? 'الانتقال للفرز الكامل' : 'Open Full Triage'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="px-4 pt-2">
            <Alert variant="warning">
              <div className="flex items-center justify-between w-full">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-xs font-bold underline ms-2 cursor-pointer"
                >
                  {isAr ? 'إغلاق' : 'Dismiss'}
                </button>
              </div>
            </Alert>
          </div>
        )}

        {/* Chat Messages Viewport */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onQuickReply={handleSendMessage}
              onOpenEmergency={onOpenEmergency}
            />
          ))}

          {/* Reasoning / Thinking Indicator */}
          {isLoading && <ClinicalReasoningIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Message Input Area */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800/90 shrink-0">
          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onOpenEmergency={onOpenEmergency}
          />
        </div>
      </div>
    </div>
  );
};
