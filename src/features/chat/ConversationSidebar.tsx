import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  AlertTriangle,
  Flame,
  Activity,
  Calendar,
} from 'lucide-react';
import { ConversationSummary, TriageUrgency } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { Badge } from '../../components/ui/index.js';

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  isLoading: boolean;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateNewConversation,
  onRenameConversation,
  onDeleteConversation,
  isLoading,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (c: ConversationSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveEditing = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذه المحادثة السريرية؟' : 'Delete this clinical consultation?')) {
      onDeleteConversation(id);
    }
  };

  const getUrgencyBadge = (urgency: TriageUrgency, isEmergency: boolean) => {
    if (isEmergency || urgency === 'EMERGENCY') {
      return (
        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title={isAr ? 'طوارئ' : 'Emergency'} />
      );
    }
    if (urgency === 'URGENT') {
      return (
        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title={isAr ? 'عاجل' : 'Urgent'} />
      );
    }
    return (
      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title={isAr ? 'روتينية' : 'Routine'} />
    );
  };

  return (
    <div className="w-full lg:w-72 bg-slate-900/95 border-b lg:border-b-0 lg:border-r rtl:lg:border-r-0 rtl:lg:border-l border-slate-800 p-3.5 flex flex-col h-full shrink-0 text-start">
      {/* New Consultation Action */}
      <button
        type="button"
        id="new-consultation-btn"
        onClick={onCreateNewConversation}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer mb-3"
      >
        <Plus className="w-4 h-4" />
        <span>{isAr ? 'محادثة سريرية جديدة' : 'New Clinical Consultation'}</span>
      </button>

      {/* Search Conversations */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isAr ? 'بحث في السجلات السابقة...' : 'Search past consultations...'}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg ps-8 pe-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 transition-colors"
        />
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pe-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
          {isAr ? 'سجل الاستشارات (History)' : 'Consultation History'} ({filtered.length})
        </div>

        {filtered.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
            {isAr ? 'لا توجد محادثات سابقة مطابقة.' : 'No matching consultations found.'}
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const isEmergency = conv.status === 'ESCALATED_EMERGENCY';

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group relative w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100 shadow-sm'
                    : 'bg-slate-950/40 hover:bg-slate-800/80 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 me-2">
                  {getUrgencyBadge(conv.urgency, isEmergency)}
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />

                  {editingId === conv.id ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-emerald-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={(e) => saveEditing(conv.id, e)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={cancelEditing} className="p-1 text-slate-400 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="truncate flex-1">
                      <div className="font-semibold truncate">{conv.title}</div>
                      <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                        <span>{conv.messageCount} {isAr ? 'رسائل' : 'msgs'}</span>
                        <span>•</span>
                        <span>{new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Inline Action Controls on Hover */}
                {editingId !== conv.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => startEditing(conv, e)}
                      title={isAr ? 'إعادة تسمية' : 'Rename'}
                      className="p-1 text-slate-400 hover:text-emerald-300 rounded hover:bg-slate-700/50"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(conv.id, e)}
                      title={isAr ? 'حذف' : 'Delete'}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700/50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Safety & Protocol Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>{isAr ? 'محرك الحوار السريري:' : 'Dialogue Engine:'}</span>
          <span className="text-emerald-400 font-mono font-bold">Gemini 3.1 Pro + RAG</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{isAr ? 'الفرز والتحقق السريري:' : 'Triage Safety:'}</span>
          <span className="text-slate-300">WHO & NICE V2.4</span>
        </div>
      </div>
    </div>
  );
};
