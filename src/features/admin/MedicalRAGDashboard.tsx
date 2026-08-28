import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ExternalLink,
  Layers,
  Sparkles,
  Play,
  FileText,
  Clock,
  Award,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  Flame,
  Check,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { Card, Badge, Button, LoadingState, Alert } from '../../components/ui/index.js';

interface KnowledgeSourceItem {
  id: string;
  name: string;
  nameAr?: string;
  organization: string;
  url: string;
  contentType: string;
  authorityLevel: string;
  lastReviewed: string;
  status: 'ACTIVE' | 'IN_REVIEW' | 'ARCHIVED';
  descriptionAr?: string;
  descriptionEn?: string;
}

interface KnowledgeDocumentItem {
  id: string;
  sourceId: string;
  sourceName?: string;
  sourceOrg?: string;
  authorityLevel?: string;
  title: string;
  titleEn?: string;
  publishedDate: string;
  updatedDate: string;
  content: string;
  chunksCount: number;
  status: 'DRAFT' | 'PROCESSING' | 'INDEXED' | 'FAILED';
  metadata: {
    category: string;
    specialty: string;
    tags: string[];
  };
}

interface ChunkItem {
  id: string;
  chunkIndex: number;
  heading?: string;
  content: string;
  tokenCount: number;
  characterCount: number;
  embeddingLength: number;
}

export const MedicalRAGDashboard: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'documents' | 'sandbox' | 'tests'>('overview');
  const [sources, setSources] = useState<KnowledgeSourceItem[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocumentItem[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Document chunk inspector
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docChunks, setDocChunks] = useState<ChunkItem[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  // Ingestion status tracker
  const [ingestingDocId, setIngestingDocId] = useState<string | null>(null);
  const [ingestSteps, setIngestSteps] = useState<any[] | null>(null);

  // New Source Form Modal State
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({
    name: '',
    nameAr: '',
    organization: 'WHO',
    url: '',
    contentType: 'CLINICAL_PRACTICE_GUIDELINE',
    authorityLevel: 'TIER_1_GLOBAL_HEALTH',
    descriptionAr: '',
  });

  // New Document Form Modal State
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDoc, setNewDoc] = useState({
    sourceId: '',
    title: '',
    titleEn: '',
    category: 'CARDIOVASCULAR',
    specialty: 'Internal Medicine',
    content: '',
  });

  // Sandbox Query State
  const [sandboxQuery, setSandboxQuery] = useState('ما هي أهداف وإرشادات علاج ارتفاع ضغط الدم عند البالغين؟');
  const [sandboxTopK, setSandboxTopK] = useState(3);
  const [isQuerying, setIsQuerying] = useState(false);
  const [retrievalResult, setRetrievalResult] = useState<any>(null);

  // Test Suite State
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testSuiteResults, setTestSuiteResults] = useState<any>(null);

  // Load initial data
  const loadRAGData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sourcesRes, docsRes, telemRes] = await Promise.all([
        fetch('/api/rag/sources'),
        fetch('/api/rag/documents'),
        fetch('/api/rag/telemetry'),
      ]);

      if (!sourcesRes.ok || !docsRes.ok) {
        throw new Error('Failed to load RAG configuration');
      }

      const sourcesData = await sourcesRes.json();
      const docsData = await docsRes.json();
      const telemData = await telemRes.json();

      setSources(sourcesData.sources || []);
      setDocuments(docsData.documents || []);
      setTelemetry(telemData.telemetry || null);
    } catch (err: any) {
      setError(err.message || 'Error loading Medical RAG data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRAGData();
  }, []);

  // Inspect document chunks
  const handleInspectDoc = async (docId: string) => {
    if (selectedDocId === docId) {
      setSelectedDocId(null);
      setDocChunks([]);
      return;
    }

    setSelectedDocId(docId);
    setLoadingChunks(true);
    try {
      const res = await fetch(`/api/rag/documents/${docId}`);
      if (res.ok) {
        const data = await res.json();
        setDocChunks(data.chunks || []);
      }
    } catch (err) {
      console.error('Error fetching chunks:', err);
    } finally {
      setLoadingChunks(false);
    }
  };

  // Run document ingestion
  const handleIngestDocument = async (docId: string) => {
    setIngestingDocId(docId);
    setIngestSteps(null);
    try {
      const res = await fetch(`/api/rag/documents/${docId}/ingest`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setIngestSteps(data.result.steps);
        setActionSuccess(isAr ? 'اكتملت معالجة وفهرسة المستند بنجاح' : 'Document ingested and indexed successfully');
        loadRAGData();
        if (selectedDocId === docId) {
          handleInspectDoc(docId);
        }
      } else {
        setError(data.result?.error || 'Ingestion failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIngestingDocId(null);
    }
  };

  // Run Batch Ingest All
  const handleIngestAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rag/ingest-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.messageAr || 'All documents indexed');
        loadRAGData();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute Sandbox Retrieval
  const handleRunSandboxQuery = async () => {
    if (!sandboxQuery.trim()) return;
    setIsQuerying(true);
    setError(null);
    try {
      const res = await fetch('/api/rag/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: sandboxQuery.trim(),
          topK: sandboxTopK,
          languageHint: isAr ? 'ar' : 'en',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRetrievalResult(data.evidenceContext);
      } else {
        setError(data.error || 'Retrieval failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsQuerying(false);
    }
  };

  // Execute Automated Test Suite
  const handleRunTestSuite = async () => {
    setIsRunningTests(true);
    setTestSuiteResults(null);
    try {
      const res = await fetch('/api/rag/test-suite', { method: 'POST' });
      const data = await res.json();
      setTestSuiteResults(data);
      if (data.success) {
        setActionSuccess(isAr ? 'نجحت جميع اختبارات التحقق من نظام RAG بنسبة 100%' : 'All RAG verification tests passed 100%');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Handle Create Source
  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.name || !newSource.url) return;
    try {
      const res = await fetch('/api/rag/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddSource(false);
        setNewSource({
          name: '',
          nameAr: '',
          organization: 'WHO',
          url: '',
          contentType: 'CLINICAL_PRACTICE_GUIDELINE',
          authorityLevel: 'TIER_1_GLOBAL_HEALTH',
          descriptionAr: '',
        });
        setActionSuccess(data.messageAr || 'Source added');
        loadRAGData();
      } else {
        setError(data.error || 'Failed to add source');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle Create Document
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.sourceId || !newDoc.title || !newDoc.content) return;
    try {
      const res = await fetch('/api/rag/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDoc,
          autoIngest: true,
          metadata: {
            category: newDoc.category,
            specialty: newDoc.specialty,
            tags: [newDoc.category.toLowerCase()],
            language: 'both',
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddDoc(false);
        setNewDoc({
          sourceId: '',
          title: '',
          titleEn: '',
          category: 'CARDIOVASCULAR',
          specialty: 'Internal Medicine',
          content: '',
        });
        setActionSuccess(data.messageAr || 'Document added & ingested');
        loadRAGData();
      } else {
        setError(data.error || 'Failed to add document');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getAuthorityBadge = (level: string) => {
    switch (level) {
      case 'TIER_1_GLOBAL_HEALTH':
        return <Badge variant="primary" size="sm">Tier 1: Global Health (WHO)</Badge>;
      case 'TIER_1_NATIONAL_HEALTH':
        return <Badge variant="success" size="sm">Tier 1: National Authority (MOH / CDC / NICE)</Badge>;
      case 'TIER_2_SPECIALTY_COLLEGE':
        return <Badge variant="warning" size="sm">Tier 2: Specialty College (AHA / ADA / ESC)</Badge>;
      default:
        return <Badge variant="outline" size="sm">Tier 3: Clinical Reference (UpToDate)</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Alert Notices */}
      {actionSuccess && (
        <Alert variant="success" onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* RAG Engine Status Header */}
      <Card className="bg-slate-900/90 border-slate-800 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-100">
                  {isAr ? 'نظام استرجاع المعرفة السريرية المتقدم (Medical RAG)' : 'Medical RAG Knowledge & Vector Engine'}
                </h2>
                <Badge variant="success" size="sm">
                  {isAr ? 'نشط ومفعل' : 'ACTIVE'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                {isAr
                  ? 'حوكمة صارمة للمصادر المعتمدة (WHO, NICE, CDC, Saudi MOH, ADA, AHA). خط أنابيب من 11 مرحلة يمنع الهلوسة ويضمن عدم اختراع الاستشهادات وربط الإجابات الطبية بأدلة موثوقة حصراً.'
                  : '11-stage clinical RAG pipeline enforcing strict citation fidelity, multi-factor reranking, and preventing AI hallucination by grounding responses in verified sources.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadRAGData}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              {isAr ? 'تحديث' : 'Refresh'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleIngestAll}
              disabled={isLoading}
              leftIcon={<Layers className="w-3.5 h-3.5" />}
            >
              {isAr ? 'إعادة فهرسة الكل' : 'Re-index All'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunTestSuite}
              disabled={isRunningTests}
              leftIcon={<Play className="w-3.5 h-3.5 text-emerald-300" />}
            >
              {isRunningTests
                ? (isAr ? 'جاري الفحص...' : 'Testing...')
                : (isAr ? 'تشغيل حزمة التحقق (Test Suite)' : 'Run Verification Tests')}
            </Button>
          </div>
        </div>

        {/* Telemetry Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">{isAr ? 'المصادر المعتمدة' : 'Registered Sources'}</div>
            <div className="text-xl font-bold text-cyan-400 mt-1">{sources.length}</div>
            <div className="text-[10px] text-slate-500 font-mono">WHO / NICE / MOH_SA / CDC</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">{isAr ? 'الوثائق السريرية' : 'Clinical Documents'}</div>
            <div className="text-xl font-bold text-purple-400 mt-1">{documents.length}</div>
            <div className="text-[10px] text-slate-500 font-mono">Guidelines & Protocols</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">{isAr ? 'المقاطع بقاعدة المتجهات' : 'Vector Database Chunks'}</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{telemetry?.totalChunks || 0}</div>
            <div className="text-[10px] text-slate-500 font-mono">128-dim Dense Vectors</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">{isAr ? 'معدل زمن الاسترجاع' : 'Avg Retrieval Latency'}</div>
            <div className="text-xl font-bold text-amber-400 mt-1">{telemetry?.avgQueryLatencyMs || '1.8'} ms</div>
            <div className="text-[10px] text-slate-500 font-mono">Cosine + Multi-Rerank</div>
          </div>
        </div>
      </Card>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{isAr ? 'خط أنابيب RAG (11 مرحلة)' : '11-Stage Pipeline'}</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sources'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>{isAr ? 'سجل المصادر المعتمدة' : 'Source Registry'} ({sources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'documents'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{isAr ? 'الوثائق والمقاطع' : 'Documents & Chunks'} ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sandbox'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>{isAr ? 'مختبر الاسترجاع والترتيب (Live Sandbox)' : 'Retrieval Sandbox'}</span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'tests'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isAr ? 'حزمة التحقق الآلي (Test Suite)' : 'Verification Test Suite'}</span>
          {testSuiteResults && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & 11-STAGE PIPELINE ARCHITECTURE */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card className="bg-slate-900/80 border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">
                  {isAr ? 'الهندسة المعمارية لخط أنابيب المعرفة السريرية (Medical RAG Pipeline)' : 'Medical RAG Pipeline Architecture'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAr
                    ? '11 مرحلة متسلسلة تضمن صحة المرجع وعدم الاعتماد على ذاكرة النموذج وحدها'
                    : '11 sequential stages strictly executing the medical knowledge workflow'}
                </p>
              </div>
              <div className="px-3 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-xs font-mono">
                Rule: Zero Hallucinated Citations
              </div>
            </div>

            {/* Pipeline Step Diagrams */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {[
                {
                  num: '1',
                  stepAr: 'المصدر المعتمد (Source)',
                  stepEn: 'Source Registry',
                  descAr: 'تسجيل المصدر السريري والتحقق من اعتماديته وتاريخ مراجعته.',
                  descEn: 'Register authoritative clinical sources and authority tiering.',
                  tag: 'Governance',
                },
                {
                  num: '2',
                  stepAr: 'التحقق الصارم (Validation)',
                  stepEn: 'Validation',
                  descAr: 'فحص هيكلية الوثيقة والروابط وبيانات النشر والتخصص.',
                  descEn: 'Validating metadata, schema, and authority credentialing.',
                  tag: 'Integrity',
                },
                {
                  num: '3',
                  stepAr: 'التنقية السريرية (Cleaning)',
                  stepEn: 'Cleaning',
                  descAr: 'تنظيف وتطبيع النصوص وإزالة الرموز الزائدة وتوحيد المصطلحات.',
                  descEn: 'Removing boilerplate, cleaning Markdown, normalizing Unicode.',
                  tag: 'Preprocessing',
                },
                {
                  num: '4',
                  stepAr: 'معالجة الوثيقة (Doc Processing)',
                  stepEn: 'Document Processing',
                  descAr: 'تقسيم هيكلي حسب الأقسام السريرية والعناوين الطبية.',
                  descEn: 'Hierarchical section parsing preserving clinical context.',
                  tag: 'Structuring',
                },
                {
                  num: '5',
                  stepAr: 'التقطيع الموزون (Chunking)',
                  stepEn: 'Chunking',
                  descAr: 'تقطيع ذكي بحجم 400-800 حرف مع تداخل سريري 80 حرف.',
                  descEn: 'Semantic chunking with contextual overlapping.',
                  tag: 'Granularity',
                },
                {
                  num: '6',
                  stepAr: 'التضمين الدلالي (Embeddings)',
                  stepEn: 'Dense Embeddings',
                  descAr: 'توليد متجهات كثيفة (128-dim) مبنية على الأنطولوجيا الطبية.',
                  descEn: 'Medical ontology projection combined with dense semantic hashing.',
                  tag: 'Vectorization',
                },
                {
                  num: '7',
                  stepAr: 'قاعدة المتجهات (Vector Database)',
                  stepEn: 'Vector Database',
                  descAr: 'فهرسة فورية مع حساب جيب التمام المخصص للسرعة العالية.',
                  descEn: 'Fast in-memory cosine similarity indexing with telemetry.',
                  tag: 'Storage',
                },
                {
                  num: '8',
                  stepAr: 'استرجاع المقاطع (Retrieval)',
                  stepEn: 'Retrieval',
                  descAr: 'فهم نية السؤال وتحديد الموضوع واسترجاع أعلى المرشحين.',
                  descEn: 'Intent/topic classification and k-NN vector search.',
                  tag: 'Search',
                },
                {
                  num: '9',
                  stepAr: 'إعادة الترتيب (Reranking)',
                  stepEn: 'Multi-Factor Reranking',
                  descAr: 'موازنة التشابه المتجهي + مطابقة الكلمات + موثوقية المصدر + الحداثة.',
                  descEn: 'Reranking with vector + keyword + authority + recency weights.',
                  tag: 'Precision',
                },
                {
                  num: '10',
                  stepAr: 'سياق الأدلة المقيد (Evidence Context)',
                  stepEn: 'Evidence Context',
                  descAr: 'صياغة برومبت سريري مقيد يمنع اختراع أي استشهاد أو معلومة.',
                  descEn: 'Grounded prompt generation forbidding external hallucination.',
                  tag: 'Grounding',
                },
                {
                  num: '11',
                  stepAr: 'رد الذكاء الاصطناعي (AI Response)',
                  stepEn: 'AI Response',
                  descAr: 'صياغة الإجابة السريرية مع الاستشهاد الصارم بالمصادر المسترجعة.',
                  descEn: 'Generating validated answer citing only retrieved chunks.',
                  tag: 'Fidelity',
                },
              ].map((step, sIdx) => (
                <div
                  key={sIdx}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center">
                      {step.num}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {step.tag}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 pt-1">
                    {isAr ? step.stepAr : step.stepEn}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {isAr ? step.descAr : step.descEn}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SOURCE REGISTRY */}
      {/* ========================================================================= */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {isAr ? 'دليل وسجل المصادر الطبية المعتمدة (Source Registry)' : 'Clinical Source Registry'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'حوكمة المصادر السريرية، مستويات الموثوقية (Tier 1/2/3)، ومواعيد المراجعة الرسمية'
                  : 'Manage authoritative healthcare organizations, authority levels, and review intervals.'}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddSource(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {isAr ? 'إضافة مصدر معتمد' : 'Register New Source'}
            </Button>
          </div>

          {/* Add Source Modal Form */}
          {showAddSource && (
            <Card className="bg-slate-950 border-cyan-900/60 p-5 animate-fadeIn space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>{isAr ? 'تسجيل مصدر سريري معتمد جديد' : 'Register New Authoritative Source'}</span>
                </h4>
                <button
                  onClick={() => setShowAddSource(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSource} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAr ? 'اسم المصدر (Source Name - EN)' : 'Source Name (EN)'}
                    </label>
                    <input
                      type="text"
                      value={newSource.name}
                      onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                      placeholder="e.g. American College of Cardiology Guidelines"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAr ? 'اسم المصدر بالعربية' : 'Source Name (AR)'}
                    </label>
                    <input
                      type="text"
                      value={newSource.nameAr}
                      onChange={(e) => setNewSource({ ...newSource, nameAr: e.target.value })}
                      placeholder="مثال: إرشادات الكلية الأمريكية لأمراض القلب"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAr ? 'المنظمة (Organization Code)' : 'Organization'}
                    </label>
                    <input
                      type="text"
                      value={newSource.organization}
                      onChange={(e) => setNewSource({ ...newSource, organization: e.target.value })}
                      placeholder="e.g. ACC, AHA, WHO, MOH_SA"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAr ? 'الرابط الرسمي المعتمد (URL)' : 'Official URL'}
                    </label>
                    <input
                      type="url"
                      value={newSource.url}
                      onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAr ? 'مستوى السلطة السريرية (Authority Level)' : 'Authority Level'}
                    </label>
                    <select
                      value={newSource.authorityLevel}
                      onChange={(e) => setNewSource({ ...newSource, authorityLevel: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="TIER_1_GLOBAL_HEALTH">Tier 1: Global Health Body (WHO)</option>
                      <option value="TIER_1_NATIONAL_HEALTH">Tier 1: National Authority (MOH / CDC / NICE)</option>
                      <option value="TIER_2_SPECIALTY_COLLEGE">Tier 2: Specialty College (AHA / ADA / ESC)</option>
                      <option value="TIER_3_PEER_REVIEWED_JOURNAL">Tier 3: Peer-Reviewed Journal</option>
                      <option value="TIER_3_CLINICAL_REFERENCE">Tier 3: Clinical Point-of-Care (UpToDate)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAr ? 'نوع المحتوى (Content Type)' : 'Content Type'}
                    </label>
                    <select
                      value={newSource.contentType}
                      onChange={(e) => setNewSource({ ...newSource, contentType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="CLINICAL_PRACTICE_GUIDELINE">Clinical Practice Guideline</option>
                      <option value="TREATMENT_PROTOCOL">Treatment Protocol</option>
                      <option value="DRUG_MONOGRAPH">Drug Monograph</option>
                      <option value="EXPERT_CONSENSUS">Expert Consensus</option>
                      <option value="SYSTEMATIC_REVIEW">Systematic Review</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddSource(false)}
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    {isAr ? 'حفظ المصدر وتسجيله' : 'Save Source'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Sources List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sources.map((src) => (
              <div
                key={src.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">{src.name}</span>
                      <Badge variant="outline" size="sm">
                        {src.organization}
                      </Badge>
                    </div>
                    {src.nameAr && (
                      <div className="text-xs text-slate-400 mt-0.5">{src.nameAr}</div>
                    )}
                  </div>
                  <Badge variant={src.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                    {src.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {getAuthorityBadge(src.authorityLevel)}
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono">
                    {src.contentType.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {src.descriptionAr || src.descriptionEn || 'مصدر معتمد للأدلة السريرية'}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-500 font-mono">
                    {isAr ? 'آخر مراجعة: ' : 'Last Reviewed: '}
                    {src.lastReviewed}
                  </span>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-medium"
                  >
                    <span>{isAr ? 'الرابط الرسمي' : 'Official Portal'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DOCUMENTS & CHUNKS */}
      {/* ========================================================================= */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {isAr ? 'وثائق المعرفة السريرية والمقاطع المفهرسة (Knowledge Documents)' : 'Knowledge Documents & Chunks'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'عرض محتوى الوثائق الطبية، فحص المقاطع (Chunks)، وتشغيل خط أنابيب المعالجة'
                  : 'Inspect guidelines, view indexed chunks, and run the 6-stage ingestion pipeline.'}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddDoc(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {isAr ? 'إضافة وثيقة سريرية' : 'Add Clinical Document'}
            </Button>
          </div>

          {/* Add Document Modal */}
          {showAddDoc && (
            <Card className="bg-slate-950 border-purple-900/60 p-5 animate-fadeIn space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>{isAr ? 'إضافة وثيقة سريرية جديدة وفهرستها تلقائياً' : 'Add & Ingest Clinical Document'}</span>
                </h4>
                <button onClick={() => setShowAddDoc(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDocument} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAr ? 'المصدر المعتمد (Source)' : 'Authoritative Source'}
                    </label>
                    <select
                      value={newDoc.sourceId}
                      onChange={(e) => setNewDoc({ ...newDoc, sourceId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-purple-500 focus:outline-none"
                      required
                    >
                      <option value="">-- {isAr ? 'اختر المصدر' : 'Select Source'} --</option>
                      {sources.map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.organization}] {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAr ? 'عنوان الوثيقة (Title)' : 'Document Title'}
                    </label>
                    <input
                      type="text"
                      value={newDoc.title}
                      onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                      placeholder="e.g. Clinical Management of Acute Myocardial Infarction"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAr ? 'التصنيف السريري' : 'Category'}
                    </label>
                    <select
                      value={newDoc.category}
                      onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-purple-500 focus:outline-none"
                    >
                      <option value="CARDIOVASCULAR">Cardiovascular</option>
                      <option value="ENDOCRINOLOGY">Endocrinology</option>
                      <option value="EMERGENCY_MEDICINE">Emergency Medicine</option>
                      <option value="NEUROLOGY">Neurology</option>
                      <option value="PHARMACOLOGY">Pharmacology</option>
                      <option value="IMMUNOLOGY_ALLERGY">Immunology / Allergy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAr ? 'التخصص الطبي' : 'Specialty'}
                    </label>
                    <input
                      type="text"
                      value={newDoc.specialty}
                      onChange={(e) => setNewDoc({ ...newDoc, specialty: e.target.value })}
                      placeholder="e.g. Cardiology, Critical Care"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isAr ? 'المحتوى السريري الكامل (Markdown مع عناوين ## للتقطيع الدلالي)' : 'Clinical Content (Markdown with ## headings)'}
                  </label>
                  <textarea
                    rows={6}
                    value={newDoc.content}
                    onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                    placeholder="## 1. Clinical Presentation&#10;Severe substernal crushing chest pain...&#10;&#10;## 2. Immediate Pharmacotherapy&#10;Aspirin 300mg chewed..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddDoc(false)}>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    {isAr ? 'إنشاء ومعالجة فورا' : 'Create & Ingest'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Ingestion Steps Audit Banner */}
          {ingestSteps && (
            <Card className="bg-slate-950 border-emerald-800/80 p-4 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {isAr ? 'نتائج مسار خط أنابيب المعالجة (Ingestion Pipeline Execution):' : 'Ingestion Pipeline Execution Results:'}
                </span>
                <button
                  onClick={() => setIngestSteps(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                {ingestSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1"
                  >
                    <div className="font-mono text-emerald-400 font-bold flex items-center justify-between">
                      <span>{step.step.replace(/_/g, ' ')}</span>
                      <Check className="w-3 h-3" />
                    </div>
                    <div className="text-[10px] text-slate-400">{step.details}</div>
                    <div className="text-[9px] font-mono text-slate-500">{step.durationMs}ms</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Documents Table */}
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">{doc.title}</span>
                      <Badge variant="outline" size="sm">
                        {doc.sourceOrg || 'Source'}
                      </Badge>
                      <Badge
                        variant={doc.status === 'INDEXED' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {doc.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span>{isAr ? 'المصدر: ' : 'Source: '}{doc.sourceName}</span>
                      <span>•</span>
                      <span>{isAr ? 'التصنيف: ' : 'Category: '}{doc.metadata?.category}</span>
                      <span>•</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {doc.chunksCount} {isAr ? 'مقطع متجهي مفهرس' : 'chunks indexed'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInspectDoc(doc.id)}
                      leftIcon={
                        selectedDocId === doc.id ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {selectedDocId === doc.id
                        ? (isAr ? 'إخفاء المقاطع' : 'Hide Chunks')
                        : (isAr ? 'فحص المقاطع (Chunks)' : 'Inspect Chunks')}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleIngestDocument(doc.id)}
                      disabled={ingestingDocId === doc.id}
                      leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${ingestingDocId === doc.id ? 'animate-spin' : ''}`} />}
                    >
                      {ingestingDocId === doc.id
                        ? (isAr ? 'جاري المعالجة...' : 'Ingesting...')
                        : (isAr ? 'تشغيل خط الأنابيب' : 'Run Pipeline')}
                    </Button>
                  </div>
                </div>

                {/* Chunks Inspector Drawer */}
                {selectedDocId === doc.id && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-950/90 border border-cyan-900/40 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                      <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        {isAr ? 'المقاطع المتجهية المفهرسة في Vector DB:' : 'Indexed Vector DB Chunks:'} ({docChunks.length})
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {isAr ? 'أبعاد المتجه: 128 Dense Dimension' : '128-dim Dense Vectors'}
                      </span>
                    </div>

                    {loadingChunks ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        {isAr ? 'جاري قراءة المقاطع...' : 'Loading chunks...'}
                      </div>
                    ) : docChunks.length === 0 ? (
                      <div className="py-4 text-center text-xs text-amber-400">
                        {isAr ? 'لم يتم تقطيع أو فهرسة هذا المستند بعد. اضغط "تشغيل خط الأنابيب" أعلاه.' : 'No chunks found. Run the ingestion pipeline.'}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto pe-1">
                        {docChunks.map((c) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-lg bg-slate-900 border border-slate-800/90 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="font-semibold text-slate-200 flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px]">
                                  Chunk #{c.chunkIndex}
                                </span>
                                <span>{c.heading || 'Clinical Section'}</span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {c.characterCount} chars • ~{c.tokenCount} tokens
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950 p-2 rounded border border-slate-800/60 font-mono">
                              {c.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RETRIEVAL & RERANKING SANDBOX */}
      {/* ========================================================================= */}
      {activeTab === 'sandbox' && (
        <div className="space-y-5">
          <Card className="bg-slate-900/90 border-slate-800 p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'مختبر الاسترجاع الدلالي وإعادة الترتيب (Medical Retrieval Sandbox)' : 'Live Retrieval & Reranking Sandbox'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'اختبر استرجاع الأدلة السريرية الحية، تفكيك نية السؤال، ومطابقة متجهات جيب التمام، والترتيب متعدد العوامل'
                  : 'Test query intent understanding, vector cosine similarity, multi-factor reranking, and grounded evidence prompt generation.'}
              </p>
            </div>

            {/* Quick Test Query Presets */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-400 font-medium">
                {isAr ? 'نماذج استفسارات طبية شائعة لاختبار الاسترجاع:' : 'Quick Presets to Test Retrieval:'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'ما هي أهداف وإرشادات علاج ارتفاع ضغط الدم عند البالغين؟',
                  'ألم ضاغط في الصدر مع ضيق تنفس حاد وتطرق للذراع الأيسر',
                  'جرعة ميتفورمين لمرضى السكري والتحذير من القصور الكلوي',
                  'أعراض صدمة الحساسية المفرطة Anaphylaxis وجرعة الإبينفرين',
                  'علامات السكتة الدماغية الحادة وفق مقياس FAST',
                  'هل يمكن تناول مسكن الإيبوبروفين مع مميع الدم الوارفارين؟',
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => setSandboxQuery(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] transition-all cursor-pointer text-start"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Query Input Box */}
            <div className="space-y-2 pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sandboxQuery}
                  onChange={(e) => setSandboxQuery(e.target.value)}
                  placeholder={isAr ? 'اكتب استفساراً أو عَرَضاً سريرياً...' : 'Type a clinical inquiry...'}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                />
                <div className="w-28 shrink-0">
                  <select
                    value={sandboxTopK}
                    onChange={(e) => setSandboxTopK(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={2}>Top 2 Chunks</option>
                    <option value={3}>Top 3 Chunks</option>
                    <option value={4}>Top 4 Chunks</option>
                    <option value={6}>Top 6 Chunks</option>
                  </select>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleRunSandboxQuery}
                  disabled={isQuerying}
                  leftIcon={<Search className="w-4 h-4" />}
                >
                  {isQuerying ? (isAr ? 'جاري الاسترجاع...' : 'Searching...') : (isAr ? 'استرجاع الأدلة' : 'Retrieve')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Sandbox Results Display */}
          {retrievalResult && (
            <div className="space-y-4 animate-fadeIn">
              {/* Step 1: Query Understanding Card */}
              <Card className="bg-slate-900/90 border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? '1. فهم السؤال والتحليل الدلالي (Query Understanding):' : '1. Query Understanding & Entity Extraction:'}</span>
                  </span>
                  <Badge variant="primary" size="sm">
                    Intent: {retrievalResult.queryUnderstanding.intent}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'المجال السريري المحدد:' : 'Clinical Topic:'}</span>
                    <span className="font-bold text-cyan-300">{retrievalResult.queryUnderstanding.clinicalTopic}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'الكيانات المستخرجة:' : 'Extracted Entities:'}</span>
                    <span className="text-slate-200 font-mono text-[11px]">
                      {[
                        ...retrievalResult.queryUnderstanding.identifiedSymptoms,
                        ...retrievalResult.queryUnderstanding.identifiedConditions,
                        ...retrievalResult.queryUnderstanding.identifiedMedications,
                        ...retrievalResult.queryUnderstanding.identifiedLabBiomarkers,
                      ].join(', ') || 'General clinical inquiry'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'زمن الاسترجاع الكلي:' : 'Retrieval Latency:'}</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {retrievalResult.metrics.totalLatencyMs} ms
                    </span>
                  </div>
                </div>
              </Card>

              {/* Step 2: Scored & Reranked Vector Chunks */}
              <Card className="bg-slate-900/90 border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>
                      {isAr
                        ? `2. المقاطع المتجهية المسترجعة والمرتبة (${retrievalResult.topEvidenceChunks.length} مقطع):`
                        : `2. Retrieved & Reranked Chunks (${retrievalResult.topEvidenceChunks.length} chunks):`}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Weights: 40% Vector + 25% Keyword + 20% Authority + 15% Recency
                  </span>
                </div>

                <div className="space-y-2.5">
                  {retrievalResult.topEvidenceChunks.map((scored: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="font-bold text-cyan-300 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] flex items-center justify-center font-mono">
                            #{scored.rank || idx + 1}
                          </span>
                          <span>{scored.chunk.metadata?.sectionHeading || 'Clinical Evidence'}</span>
                          <span className="text-[10px] text-slate-400">
                            ({scored.source?.organization || 'Guideline'})
                          </span>
                        </div>

                        {/* Scores Breakdown Badges */}
                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-300 border border-emerald-800/40">
                            Final: {(scored.rerankedScore * 100).toFixed(1)}%
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-cyan-800/40">
                            Cosine: {(scored.vectorSimilarity * 100).toFixed(1)}%
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-amber-800/40">
                            Keyword: {(scored.keywordScore * 100).toFixed(1)}%
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-purple-300 border border-purple-800/40">
                            Auth: {scored.authorityWeight}x
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/70 font-mono">
                        {scored.chunk.content}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span className="text-slate-400">
                          {isAr ? 'المرجع الرسمي: ' : 'Reference: '}{scored.documentTitle}
                        </span>
                        <a
                          href={scored.source?.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                        >
                          <span>{isAr ? 'فتح الرابط الأصلي' : 'Open URL'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Step 3: Verified Strict Citations (Zero Fake Citations) */}
              <Card className="bg-slate-900/90 border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>
                      {isAr
                        ? '3. الاستشهادات والمصادر الموثقة بدون هلوسة (Strict Citations):'
                        : '3. Authenticated Citations (Zero-Hallucination Policy):'}
                    </span>
                  </span>
                  <Badge variant="success" size="sm">
                    {retrievalResult.citations.length} Verified Sources
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {retrievalResult.citations.map((cite: any, cIdx: number) => (
                    <div
                      key={cIdx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-cyan-300">{cite.organization}</span>
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {isAr ? 'تم التحقق' : 'Verified'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-200 font-medium">{cite.title}</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed italic line-clamp-2">
                        "{cite.excerpt}"
                      </p>
                      <div className="text-[10px] text-slate-500 font-mono pt-1">
                        {isAr ? 'تاريخ التحديث: ' : 'Updated: '}{cite.lastUpdated || '2023-2024'}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Step 4: Grounded Prompt Injection Preview */}
              <Card className="bg-slate-900/90 border-slate-800 p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span>{isAr ? '4. السياق المقيد الممرر لنموذج الذكاء الاصطناعي (Grounded Context Prompt):' : '4. Grounded Context Prompt Fed to AI Model:'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/40">
                    Strict Bounded Prompt
                  </span>
                </div>

                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                  {retrievalResult.groundedContextPrompt}
                </pre>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUTOMATED VERIFICATION TEST SUITE */}
      {/* ========================================================================= */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <span>{isAr ? 'حزمة التحقق الآلي والاعتماد السريري (Medical RAG Test Suite)' : 'Automated Verification Test Suite'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'فحص آلي شامل لـ 6 مراحل: إضافة مصدر، إضافة وثيقة، تشغيل خط الأنابيب، الاسترجاع الدلالي، ومطابقة الاستشهادات الحقيقية ومنع الهلوسة.'
                  : 'Automated 6-stage end-to-end verification ensuring zero citation fabrication.'}
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleRunTestSuite}
              disabled={isRunningTests}
              leftIcon={<Play className={`w-4 h-4 ${isRunningTests ? 'animate-spin' : 'text-emerald-300'}`} />}
            >
              {isRunningTests
                ? (isAr ? 'جاري تنفيذ الاختبارات...' : 'Executing Tests...')
                : (isAr ? 'تنفيذ حزمة الاختبارات الشاملة' : 'Execute Full Test Suite')}
            </Button>
          </div>

          {/* Test Suite Summary Banner */}
          {testSuiteResults && (
            <Card className="bg-slate-900/90 border-slate-800 p-5 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-xl ${testSuiteResults.success ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                    {testSuiteResults.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">
                      {testSuiteResults.success
                        ? (isAr ? 'نجحت جميع الاختبارات السريرية بنسبة 100%' : 'All Clinical RAG Tests Passed (100%)')
                        : (isAr ? 'فشلت بعض الاختبارات' : 'Some Tests Failed')}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {testSuiteResults.passCount} / {testSuiteResults.totalTests} Passed • Total Duration: {testSuiteResults.durationTotalMs}ms
                    </p>
                  </div>
                </div>

                <Badge variant={testSuiteResults.success ? 'success' : 'danger'} size="md">
                  {testSuiteResults.overallStatus}
                </Badge>
              </div>

              {/* Individual Test Cards */}
              <div className="space-y-2.5 pt-1">
                {testSuiteResults.tests.map((t: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3"
                  >
                    <div className="mt-0.5 shrink-0">
                      {t.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">{t.title}</span>
                        <span className="font-mono text-[10px] text-slate-500">{t.durationMs}ms</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{t.details}</p>
                      {t.metrics && (
                        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400 pt-1">
                          {Object.entries(t.metrics).map(([k, v]) => (
                            <span key={k} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                              {k}: {Array.isArray(v) ? v.join(', ') : String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
