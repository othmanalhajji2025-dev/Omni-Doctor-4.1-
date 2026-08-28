import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Database,
  Layers,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Search,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, Badge, Button, Modal, LoadingState, Alert } from '../../components/ui/index.js';

interface KnowledgeSource {
  id: string;
  name: string;
  nameAr: string;
  authorityLevel: 'TIER_1_REGULATORY' | 'TIER_2_FORMULARY' | 'TIER_3_REGIONAL';
  organization: string;
  country: string;
  description: string;
  descriptionAr: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'SYNCING';
  documentsCount?: number;
  lastSyncDate?: string;
  websiteUrl?: string;
}

interface KnowledgeDocument {
  id: string;
  sourceId: string;
  title: string;
  titleEn?: string;
  content: string;
  metadata: {
    category: string;
    specialty: string;
    tags: string[];
    language: string;
  };
  status: 'PROCESSING' | 'INDEXED' | 'FAILED' | 'ARCHIVED';
  chunksCount: number;
  publishedDate?: string;
  createdAt: string;
}

export const AdminMedicalKnowledgeTab: React.FC = () => {
  const { language } = useLanguage();
  const { fetchWithAuth } = useAuth();
  const isAr = language === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'SOURCES' | 'DOCUMENTS' | 'VECTOR_DB'>('SOURCES');
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isIngestDocOpen, setIsIngestDocOpen] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);

  // New Source Form
  const [srcId, setSrcId] = useState('');
  const [srcName, setSrcName] = useState('');
  const [srcNameAr, setSrcNameAr] = useState('');
  const [srcOrg, setSrcOrg] = useState('');
  const [srcCountry, setSrcCountry] = useState('Global');
  const [srcTier, setSrcTier] = useState<'TIER_1_REGULATORY' | 'TIER_2_FORMULARY' | 'TIER_3_REGIONAL'>('TIER_1_REGULATORY');
  const [srcDesc, setSrcDesc] = useState('');
  const [srcDescAr, setSrcDescAr] = useState('');
  const [srcUrl, setSrcUrl] = useState('');

  // Ingest Document Form
  const [docSourceId, setDocSourceId] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docTitleEn, setDocTitleEn] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('Clinical Medicine');
  const [docCategory, setDocCategory] = useState('GENERAL');
  const [docTags, setDocTags] = useState('clinical-guideline, triage');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [srcRes, docRes] = await Promise.all([
        fetchWithAuth('/api/admin/knowledge/sources'),
        fetchWithAuth('/api/admin/knowledge/documents'),
      ]);

      if (srcRes.ok) {
        const srcData = await srcRes.json();
        setSources(srcData.sources || []);
        if (srcData.sources?.length > 0 && !docSourceId) {
          setDocSourceId(srcData.sources[0].id);
        }
      }
      if (docRes.ok) {
        const docData = await docRes.json();
        setDocuments(docData.documents || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load medical knowledge base');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srcName || !srcNameAr || !srcOrg) {
      setError(isAr ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const id = srcId.trim() || 'SRC_' + srcName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
      const res = await fetchWithAuth('/api/admin/knowledge/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: srcName,
          nameAr: srcNameAr,
          organization: srcOrg,
          country: srcCountry,
          authorityLevel: srcTier,
          description: srcDesc || srcName,
          descriptionAr: srcDescAr || srcNameAr,
          websiteUrl: srcUrl || undefined,
          status: 'ACTIVE',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.messageAr || data.error || 'Failed to register source');

      setSuccessMsg(data.messageAr || (isAr ? 'تم تسجيل المصدر المعتمد بنجاح' : 'Source registered'));
      setIsAddSourceOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIngestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docContent || !docSourceId) {
      setError(isAr ? 'يرجى تعبئة العنوان والمحتوى واختيار المصدر' : 'Title, content, and source are required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const tagsArray = docTags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetchWithAuth('/api/admin/knowledge/documents/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: docSourceId,
          title: docTitle,
          titleEn: docTitleEn || docTitle,
          content: docContent,
          metadata: {
            category: docCategory,
            specialty: docSpecialty,
            tags: tagsArray,
            language: 'both',
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.messageAr || data.error || 'Failed to ingest document');

      setSuccessMsg(data.messageAr || (isAr ? 'تمت معالجة وفهرسة الوثيقة بنجاح' : 'Document ingested'));
      setIsIngestDocOpen(false);
      setDocTitle('');
      setDocTitleEn('');
      setDocContent('');
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/knowledge/reindex', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.messageAr || data.error || 'Re-indexing failed');

      setSuccessMsg(data.messageAr || (isAr ? 'تمت إعادة فهرسة قاعدة بيانات المتجهات بنجاح' : 'Vector DB re-indexed'));
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsReindexing(false);
    }
  };

  const totalChunks = documents.reduce((acc, d) => acc + (d.chunksCount || 0), 0);
  const activeSources = sources.filter(s => s.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'المصادر المعتمدة' : 'Verified Sources'}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{activeSources} / {sources.length}</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'الوثائق السريرية' : 'Clinical Docs'}</span>
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-400 mt-2">{documents.length}</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'المقاطع المتجهية (Chunks)' : 'Vector Chunks'}</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400 mt-2">{totalChunks}</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'حالة محرك الاسترجاع RAG' : 'RAG Engine Status'}</span>
            <Badge variant="success" size="sm">ACTIVE</Badge>
          </div>
          <p className="text-sm font-bold text-slate-200 mt-2">Cosine 768-D Indexed</p>
        </Card>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="danger" title={isAr ? 'تنبيه المصادر والمعرفة' : 'Knowledge Error'}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success" title={isAr ? 'نجاح العملية' : 'Success'}>
          {successMsg}
        </Alert>
      )}

      {/* Sub-Tabs Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('SOURCES')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'SOURCES'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isAr ? 'المصادر المعتمدة (Sources)' : 'Authoritative Sources'}
          </button>
          <button
            onClick={() => setActiveSubTab('DOCUMENTS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'DOCUMENTS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isAr ? 'الوثائق والإرشادات (Documents)' : 'Clinical Documents'}
          </button>
          <button
            onClick={() => setActiveSubTab('VECTOR_DB')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'VECTOR_DB'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isAr ? 'فهرس المتجهات (Vector DB)' : 'Vector Database'}
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            {isAr ? 'تحديث' : 'Refresh'}
          </Button>

          {activeSubTab === 'SOURCES' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddSourceOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              {isAr ? 'تسجيل مصدر جديد' : 'Add Source'}
            </Button>
          )}

          {activeSubTab === 'DOCUMENTS' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsIngestDocOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              {isAr ? 'إدراج وثيقة سريرية' : 'Ingest Document'}
            </Button>
          )}
        </div>
      </div>

      {/* Sub-Tab 1: Sources */}
      {activeSubTab === 'SOURCES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((src) => (
            <Card key={src.id} className="p-4 bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{isAr ? src.nameAr : src.name}</span>
                    <Badge
                      variant={
                        src.authorityLevel === 'TIER_1_REGULATORY'
                          ? 'primary'
                          : src.authorityLevel === 'TIER_2_FORMULARY'
                          ? 'info'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {src.authorityLevel}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{src.organization} • {src.country}</p>
                </div>
                <Badge variant={src.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                  {src.status}
                </Badge>
              </div>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {isAr ? src.descriptionAr : src.description}
              </p>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span>{isAr ? 'المعرف المعياري:' : 'ID:'} <code className="text-emerald-400">{src.id}</code></span>
                {src.websiteUrl && (
                  <a
                    href={src.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    <span>{isAr ? 'الموقع الرسمي' : 'Official Portal'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Sub-Tab 2: Documents */}
      {activeSubTab === 'DOCUMENTS' && (
        <Card className="p-0 overflow-hidden border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-start">{isAr ? 'الوثيقة الطبية' : 'Document Title'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'المصدر المعتمد' : 'Source'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'التخصص' : 'Specialty'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'المقاطع (Chunks)' : 'Chunks'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'حالة الفهرسة' : 'Status'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'تاريخ الإدراج' : 'Created'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span>{doc.title}</span>
                          {doc.titleEn && doc.titleEn !== doc.title && (
                            <div className="text-[10px] text-slate-500 font-normal">{doc.titleEn}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-400">
                      {doc.sourceId}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="info" size="sm">{doc.metadata?.specialty || 'General'}</Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-purple-400">
                      {doc.chunksCount} chunks
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          doc.status === 'INDEXED'
                            ? 'success'
                            : doc.status === 'PROCESSING'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {doc.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(doc.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Sub-Tab 3: Vector Database */}
      {activeSubTab === 'VECTOR_DB' && (
        <div className="space-y-4">
          <Card className="p-5 bg-slate-900/90 border-slate-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'محرك البحث المتجهي والاسترجاع المعزز (Vector Engine)' : 'Vector Embedding Engine'}</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
                  {isAr
                    ? 'يقوم محرك المتجهات بتحويل المعايير والإرشادات السريرية إلى فضاء متجهي دلالي 768-D لتمكين خوارزميات الاسترجاع (Cosine Similarity) من إرفاق الأدلة الموثوقة فورياً.'
                    : 'Embeds clinical guidelines and protocols into 768-dimensional semantic vectors for instant hybrid retrieval.'}
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleReindex}
                isLoading={isReindexing}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                {isAr ? 'إعادة فهرسة قاعدة المتجهات' : 'Re-index Vector DB'}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-500 block">{isAr ? 'أبعاد التضمين' : 'Embedding Dimension'}</span>
                <span className="text-lg font-bold text-slate-200">768-Dimensional</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-500 block">{isAr ? 'مقياس التشابه' : 'Similarity Metric'}</span>
                <span className="text-lg font-bold text-emerald-400">Cosine Similarity (Top-K)</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-500 block">{isAr ? 'إجمالي المقاطع المفهرسة' : 'Total Vectors'}</span>
                <span className="text-lg font-bold text-purple-400">{totalChunks} Chunks</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add Source Modal */}
      <Modal
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
        title={isAr ? 'تسجيل مصدر سريري معتمد جديد' : 'Register Authoritative Medical Source'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSource} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'اسم المصدر بالعربي' : 'Source Name (Arabic)'} *
              </label>
              <input
                type="text"
                required
                value={srcNameAr}
                onChange={(e) => setSrcNameAr(e.target.value)}
                placeholder="وزارة الصحة العامة والسكان"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'اسم المصدر بالإنجليزي' : 'Source Name (English)'} *
              </label>
              <input
                type="text"
                required
                value={srcName}
                onChange={(e) => setSrcName(e.target.value)}
                placeholder="Ministry of Public Health"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'المؤسسة / المنظمة' : 'Organization'} *
              </label>
              <input
                type="text"
                required
                value={srcOrg}
                onChange={(e) => setSrcOrg(e.target.value)}
                placeholder="MoPHP Yemen"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'الدولة / النطاق' : 'Country'}
              </label>
              <input
                type="text"
                value={srcCountry}
                onChange={(e) => setSrcCountry(e.target.value)}
                placeholder="Yemen / Global"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'المستوى الرقابي' : 'Authority Tier'}
              </label>
              <select
                value={srcTier}
                onChange={(e) => setSrcTier(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="TIER_1_REGULATORY">TIER 1 (Regulatory: WHO, MOH, FDA)</option>
                <option value="TIER_2_FORMULARY">TIER 2 (Formulary: BNF, SFDA)</option>
                <option value="TIER_3_REGIONAL">TIER 3 (Regional: YemenMD, Local)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isAr ? 'الوصف السريري والمعايير' : 'Clinical Description'}
            </label>
            <textarea
              rows={2}
              value={srcDescAr}
              onChange={(e) => setSrcDescAr(e.target.value)}
              placeholder="إرشادات المعالجة القياسية الوطنية وبروتوكولات الطوارئ السريرية..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddSourceOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {isAr ? 'تسجيل المصدر' : 'Register Source'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ingest Document Modal */}
      <Modal
        isOpen={isIngestDocOpen}
        onClose={() => setIsIngestDocOpen(false)}
        title={isAr ? 'إدراج وثيقة وإرشادات سريرية جديدة (Chunking & Embeddings)' : 'Ingest Clinical Guideline Document'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleIngestDocument} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'المصدر المعتمد' : 'Authoritative Source'} *
              </label>
              <select
                required
                value={docSourceId}
                onChange={(e) => setDocSourceId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {isAr ? s.nameAr : s.name} ({s.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'التخصص الطبي' : 'Specialty Domain'}
              </label>
              <input
                type="text"
                value={docSpecialty}
                onChange={(e) => setDocSpecialty(e.target.value)}
                placeholder="Cardiology / Infectious Diseases"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'عنوان الوثيقة (عربي)' : 'Title (Arabic)'} *
              </label>
              <input
                type="text"
                required
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="دليل معالجة حمى الضنك والنزفية"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'العنوان (إنجليزي)' : 'Title (English)'}
              </label>
              <input
                type="text"
                value={docTitleEn}
                onChange={(e) => setDocTitleEn(e.target.value)}
                placeholder="Dengue Fever Clinical Management Guidelines"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isAr ? 'المحتوى الطبي الكامل للوثيقة' : 'Full Clinical Text Content'} *
            </label>
            <textarea
              required
              rows={8}
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="ألصق نص الإرشادات السريرية، معايير التشخيص، الجرعات، وموانع الاستعمال هنا..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsIngestDocOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {isAr ? 'بدء المعالجة والتقطيع والتضمين' : 'Ingest & Index'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
