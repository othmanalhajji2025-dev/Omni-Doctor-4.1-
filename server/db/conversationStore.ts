import {
  ClinicalConversationContext,
  ExtractedClinicalAttributes,
  NextFollowUpQuestion,
} from '../ai/providers/AIProvider.js';
import { TriageUrgency, EvidenceSource } from '../types/medical.js';
import {
  SafetyRiskLevel,
  SafetyEvaluationResult,
  EmergencyResponseModePayload,
} from '../types/safety.js';

export interface ServerChatMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  intent?: ClinicalConversationContext['intent'];
  isHealthRelated?: boolean;
  extractedAttributes?: ExtractedClinicalAttributes;
  nextFollowUpQuestion?: NextFollowUpQuestion;
  redFlagsDetected?: Array<{
    nameAr: string;
    nameEn: string;
    urgency: TriageUrgency;
    actionAr: string;
    actionEn: string;
  }>;
  evidenceSources?: EvidenceSource[];
  questionsForDoctorAr?: string[];
  questionsForDoctorEn?: string[];
  urgencyTag?: TriageUrgency;
  isEmergency?: boolean;
  safetyRiskLevel?: SafetyRiskLevel;
  safetyOverride?: boolean;
  safetyEvaluation?: SafetyEvaluationResult;
  emergencyPayload?: EmergencyResponseModePayload;
  providerUsed?: string;
  pipelineAudits?: Array<{
    step: string;
    status: 'PASSED' | 'TRIGGERED' | 'APPLIED';
    detailsAr: string;
    detailsEn: string;
  }>;
}

export interface ConversationSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ServerChatMessage[];
  clinicalContext: ClinicalConversationContext;
  status: 'ACTIVE' | 'ARCHIVED' | 'ESCALATED_EMERGENCY';
}

export class ConversationStore {
  // In-memory multi-tenant store mapped by userId -> ConversationSession[]
  private conversationsByUser: Map<string, ConversationSession[]> = new Map();

  constructor() {
    this.seedDefaultConversations();
  }

  private seedDefaultConversations() {
    const demoUser = 'usr-patient-1';
    const convId = 'conv-demo-1';
    const now = new Date().toISOString();

    const sampleContext: ClinicalConversationContext = {
      primarySymptom: 'صداع نصفي مع حساسية للضوء',
      isHealthRelated: true,
      intent: 'SYMPTOM_INQUIRY',
      extractedAttributes: {
        primarySymptom: 'صداع نصفي مع حساسية للضوء',
        onset: 'منذ يومين',
        location: 'الجانب الأيمن من الرأس',
        character: 'ألم نابض متزايد',
        severity: 6,
        associatedSymptoms: ['غثيان خفيف', 'حساسية للضوء'],
      },
      missingAttributes: ['red_flags'],
      redFlags: [],
      urgency: 'ROUTINE',
      currentQuestionIndex: 3,
      completedTriage: true,
    };

    const initialMessages: ServerChatMessage[] = [
      {
        id: 'msg-init-1',
        conversationId: convId,
        sender: 'assistant',
        content:
          'مرحباً بك! أنا المساعد الصحي السريري لمنصة OmniDoctor AI. كيف يمكنني مساعدتك في استعراض أعراضك، شرح الأدوية، أو الإجابة على استفساراتك الطبية الموثوقة؟',
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isHealthRelated: true,
        urgencyTag: 'SELF_CARE',
        providerUsed: 'OmniDoctor Clinical Intelligence Core',
      },
      {
        id: 'msg-init-2',
        conversationId: convId,
        sender: 'user',
        content: 'أعاني من صداع نصفي نابض في الجهة اليمنى منذ يومين مع غثيان خفيف.',
        timestamp: new Date(Date.now() - 3500000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      {
        id: 'msg-init-3',
        conversationId: convId,
        sender: 'assistant',
        content:
          'شكراً لمشاركتك. قمت بتسجيل شكوى **صداع نصفي نابض** ضمن سجلك السريري (مع ملاحظة الأعراض المصاحبة: غثيان خفيف وحساسية للضوء).\n\n📌 **التقييم السريري الأولي:** يتوافق هذا النمط عادةً مع نوبات الصداع النصفي (Migraine) مع استبعاد علامات الخطر مثل تيبس الرقبة أو الصداع الرعدي المفاجئ.',
        timestamp: new Date(Date.now() - 3400000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isHealthRelated: true,
        urgencyTag: 'ROUTINE',
        nextFollowUpQuestion: {
          questionAr: 'كم شدة الصداع حالياً من 1 إلى 10؟ وهل تناولت أي مسكنات مثل الباراسيتامول؟',
          questionEn: 'What is the current severity (1-10) and have you taken medications like Paracetamol?',
          attribute: 'severity',
          quickOptionsAr: ['خفيف (1-3) واستجاب للمسكن', 'متوسط (4-6) يضايقني', 'شديد (7-8) يعيق عملي', 'شديد جداً (9-10)'],
          quickOptionsEn: ['Mild (1-3)', 'Moderate (4-6)', 'Severe (7-8)', 'Excruciating (9-10)'],
          priority: 4,
        },
        questionsForDoctorAr: [
          'هل نوبات الصداع متكررة وتتطلب علاجاً وقائياً؟',
          'ما هي علامات التحذير التي تستدعي الفحص الإشعاعي (MRI/CT)؟',
        ],
        questionsForDoctorEn: [
          'Are these recurrent migraines warranting preventive therapy?',
          'What red flag indicators would require neuroimaging?',
        ],
        providerUsed: 'Google Gemini 3.1 Pro (Clinical Intelligence Core)',
      },
    ];

    this.conversationsByUser.set(demoUser, [
      {
        id: convId,
        userId: demoUser,
        title: 'صداع نصفي نابض منذ يومين',
        createdAt: now,
        updatedAt: now,
        messages: initialMessages,
        clinicalContext: sampleContext,
        status: 'ACTIVE',
      },
    ]);
  }

  public getConversations(userId: string): ConversationSession[] {
    const list = this.conversationsByUser.get(userId) || [];
    return [...list].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getConversationById(
    userId: string,
    conversationId: string
  ): ConversationSession | null {
    const list = this.conversationsByUser.get(userId) || [];
    return list.find((c) => c.id === conversationId) || null;
  }

  public createConversation(
    userId: string,
    title?: string,
    initialMessage?: string
  ): ConversationSession {
    const list = this.conversationsByUser.get(userId) || [];
    const now = new Date().toISOString();
    const id = 'conv_' + Math.random().toString(36).substring(2, 9);

    const initialContext: ClinicalConversationContext = {
      isHealthRelated: true,
      intent: 'GENERAL_HEALTH',
      extractedAttributes: {},
      missingAttributes: ['onset', 'location', 'character', 'severity'],
      redFlags: [],
      urgency: 'ROUTINE',
      currentQuestionIndex: 0,
      completedTriage: false,
    };

    const welcomeMsg: ServerChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      conversationId: id,
      sender: 'assistant',
      content:
        'أهلاً بك في المساعد الصحي السريري. أنا هنا لمساعدتك في استعراض أعراضك، فرز حالتك، وفهم أدويتك وفق المعايير الطبية المعتمدة. كيف تشعر اليوم؟',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isHealthRelated: true,
      urgencyTag: 'SELF_CARE',
      providerUsed: 'OmniDoctor AI Medical Companion',
    };

    const newConv: ConversationSession = {
      id,
      userId,
      title: title || 'محادثة صحية جديدة',
      createdAt: now,
      updatedAt: now,
      messages: [welcomeMsg],
      clinicalContext: initialContext,
      status: 'ACTIVE',
    };

    list.unshift(newConv);
    this.conversationsByUser.set(userId, list);
    return newConv;
  }

  public addMessage(
    userId: string,
    conversationId: string,
    message: ServerChatMessage,
    updatedContext?: Partial<ClinicalConversationContext>,
    newTitle?: string
  ): ConversationSession | null {
    let list = this.conversationsByUser.get(userId) || [];
    let conv = list.find((c) => c.id === conversationId);

    if (!conv) {
      conv = this.createConversation(userId);
      conv.id = conversationId;
    }

    conv.messages.push(message);
    conv.updatedAt = new Date().toISOString();

    if (updatedContext) {
      conv.clinicalContext = {
        ...conv.clinicalContext,
        ...updatedContext,
      };
    }

    if (newTitle && (conv.title === 'محادثة صحية جديدة' || conv.title.startsWith('New Consultation'))) {
      conv.title = newTitle;
    }

    if (message.isEmergency) {
      conv.status = 'ESCALATED_EMERGENCY';
    }

    this.conversationsByUser.set(userId, list);
    return conv;
  }

  public updateTitle(
    userId: string,
    conversationId: string,
    title: string
  ): boolean {
    const list = this.conversationsByUser.get(userId) || [];
    const conv = list.find((c) => c.id === conversationId);
    if (!conv) return false;
    conv.title = title.trim();
    conv.updatedAt = new Date().toISOString();
    return true;
  }

  public deleteConversation(userId: string, conversationId: string): boolean {
    let list = this.conversationsByUser.get(userId) || [];
    const initialLen = list.length;
    list = list.filter((c) => c.id !== conversationId);
    this.conversationsByUser.set(userId, list);
    return list.length < initialLen;
  }

  public clearAll(userId: string): void {
    this.conversationsByUser.set(userId, []);
  }
}

export const conversationStore = new ConversationStore();
