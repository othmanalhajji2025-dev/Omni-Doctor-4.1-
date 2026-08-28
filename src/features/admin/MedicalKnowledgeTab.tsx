import React, { useState, useEffect } from 'react';
import {
  Building,
  FileText,
  Layers,
  Cpu,
  RefreshCw,
  Plus,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, Badge, Button, Input, Select, Modal, Alert, LoadingState } from '../../components/ui/index.js';

interface KnowledgeSource {
  id: string;
  name: string;
  nameAr: string;
  organization: string;
  url: string;
  contentType: string;
  authorityLevel: string;
  lastReviewed: string;
  status: 'ACTIVE' | 'PENDING_VALIDATION' | 'DEPRECATED';
  documentsCount?: number;
  descriptionAr?: string;
  descriptionEn?: string;
}

interface KnowledgeDoc {
  id: string;
  title: string;
  sourceId: string;
  sourceName?: string;
  specialty: string;
  status: 'INDEXED' | 'DRAFT' | 'UPDATED' | 'FAILED';
  chunksCount: number;
  publishedDate: string;
  updatedDate: string;
  contentSnippet?: string;
}

interface VectorStatus {
  totalSources: number;
  totalDocuments: number;
  indexedDocuments: number;
  pendingDocuments: number;
  failedDocuments: number;
  vectorDb: {
    totalChunks: number;
    vectorDimension: number;
    vocabularySize: number;
    embeddingModel: string;
    lastUpdated: string;
  };
}

export const MedicalKnowledgeTab: React.FC = () => {
  const { language } = useLanguage();
  const { fetchWithAuth } = useAuth();
  const isAr = language === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'sources' | 'documents' | 'processing' | 'status'>('sources');
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [statusData, setStatusData] = useState<VectorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isIngestingBatch, setIsIngestingBatch] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);

  const [sourceForm, setSourceForm] = useState({
    name: '',
    nameAr: '',
    organization: '',
    url: '',
    contentType: 'CLINICAL_GUIDELINE',
    authorityLevel: 'TIER_1_GLOBAL_HEALTH_AUTHORITY',
    descriptionAr: '',
    descriptionEn: '',
  });

  const [docForm, setDocForm] = useState({
    title: '',
    sourceId: '',
    specialty: 'Internal Medicine',
    fullText: '',
    guidelineLevel: 'PRIMARY_CARE',
    targetAudience: 'PHYSICIAN',
    keywords: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sourcesRes, docsRes, statusRes] = await Promise.all([
        fetchWithAuth('/api/admin/knowledge/sources'),
        fetchWithAuth('/api/admin/knowledge/documents'),
        fetchWithAuth('/api/admin/knowledge/status'),
      ]);

      if (sourcesRes.ok) {
        const sData = await sourcesRes.json();
        setSources(sData.sources || []);
        if (sData.sources?.length > 0 && !docForm.sourceId) {
          setDocForm((prev) => ({ ...prev, sourceId: sData.sources[0].id }));
        }
      }

      if (docsRes.ok) {
        const dData = await docsRes.json();
        setDocuments(dData.documents || []);
      }

      if (statusRes.ok) {
        const stData = await statusRes.json();
        setStatusData(stData.status || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load medical knowledge data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/knowledge/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register source');

      setSuccessMsg(data.messageAr || (isAr ? 'تم تسجيل المصدر بنجاح' : 'Source registered successfully'));
      setIsAddSourceOpen(false);
      setSourceForm({
        name: '',
        nameAr: '',
        organization: '',
        url: '',
        contentType: 'CLINICAL_GUIDELINE',
        authorityLevel: 'TIER_1_GLOBAL_HEALTH_AUTHORITY',
        descriptionAr: '',
        descriptionEn: '',
      });
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...docForm,
        keywords: docForm.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        autoIngest: true,
      };

      const res = await fetchWithAuth('/api/admin/knowledge/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create document');

      setSuccessMsg(data.messageAr || (isAr ? 'تم إنشاء المستند ومعالجته بنجاح' : 'Document created and indexed'));
      setIsAddDocOpen(false);
      setDocForm({
        title: '',
        sourceId: sources[0]?.id || '',
        specialty: 'Internal Medicine',
        fullText: '',
        guidelineLevel: 'PRIMARY_CARE',
        targetAudience: 'PHYSICIAN',
        keywords: '',
      });
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIngestSingleDoc = async (docId: string) => {
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/admin/knowledge/documents/${docId}/ingest`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ingestion failed');

      setSuccessMsg(data.messageAr || (isAr ? 'تمت فهرسة المستند بنجاح' : 'Document indexed'));
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBatchIngestAll = async () => {
    setIsIngestingBatch(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/knowledge/ingest-all', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch ingestion failed');

      setSuccessMsg(data.messageAr || (isAr ? 'تمت إعادة فهرسة جميع المستندات بنجاح' : 'Batch ingestion completed'));
      loadData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsIngestingBatch(false);
    }
  };

  const getAuthorityBadge = (level: string) => {
    if (level.includes('TIER_1')) {
      return <Badge variant="primary" size="sm">Tier 1 (WHO/Global)</Badge>;
    }
    if (level.includes('TIER_2')) {
      return <Badge variant="success" size="sm">Tier 2 (MOH/National)</Badge>;
    }
    return <Badge variant="secondary" size="sm">Tier 3 (Academic)</Badge>;
  };

  return (
    <div className="space-y-6">
      {statusData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
              <Building className="w-4 h-4" />
              <span>{isAr ? 'المصادر المعتمدة' : 'Sources'}</span>
            </div>
            <div className="text-2xl font-black text-slate-100">{statusData.totalSources}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{isAr ? 'WHO, SFDA, MoPHP...' : 'Global & Regional'}</div>
          </Card>

          <Card className="p-4 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
              <FileText className="w-4 h-4" />
              <span>{isAr ? 'المستندات السريرية' : 'Documents'}</span>
            </div>
            <div className="text-2xl font-black text-slate-100">{statusData.totalDocuments}</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">
              {statusData.indexedDocuments} {isAr ? 'مفهرس بنجاح' : 'Indexed'}
            </div>
          </Card>

          <Card className="p-4 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold mb-1">
              <Layers className="w-4 h-4" />
              <span>{isAr ? 'مقاطع المتجهات' : 'Vector Chunks'}</span>
            </div>
            <div className="text-2xl font-black text-slate-100">{statusData.vectorDb.totalChunks}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {statusData.vectorDb.vectorDimension}D {isAr ? 'أبعاد' : 'Dimensions'}
            </div>
          </Card>

          <Card className="p-4 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
              <Cpu className="w-4 h-4" />
              <span>{isAr ? 'حالة المتجهات' : 'Vector DB'}</span>
            </div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {isAr ? 'نشطة ومتزامنة' : 'Active & Synced'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{statusData.vectorDb.embeddingModel}</div>
          </Card>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('sources')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'sources'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>{isAr ? 'المصادر (Sources)' : 'Sources'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('documents')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'documents'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isAr ? 'المستندات (Documents)' : 'Documents'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('processing')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'processing'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isAr ? 'خط المعالجة (Processing)' : 'Processing'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('status')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'status'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isAr ? 'الحالة (Status)' : 'Status'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {isAr ? 'تحديث' : 'Refresh'}
          </Button>

          {activeSubTab === 'sources' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddSourceOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              {isAr ? 'إضافة مصدر' : 'Add Source'}
            </Button>
          )}

          {activeSubTab === 'documents' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddDocOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              {isAr ? 'إضافة مستوند' : 'Add Document'}
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* SOURCES */}
      {activeSubTab === 'sources' && (
        <Card className="overflow-hidden bg-slate-900/70 border-slate-800 p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">{isAr ? 'المصدر' : 'Source'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'المنظمة' : 'Organization'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'المستوى' : 'Authority'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'المستندات' : 'Docs'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-100">{s.nameAr || s.name}</td>
                    <td className="py-3.5 px-4 text-slate-300">{s.organization}</td>
                    <td className="py-3.5 px-4">{getAuthorityBadge(s.authorityLevel)}</td>
                    <td className="py-3.5 px-4 font-bold text-cyan-400">{s.documentsCount || 0}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 border border-emerald-800 text-emerald-300">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* DOCUMENTS */}
      {activeSubTab === 'documents' && (
        <Card className="overflow-hidden bg-slate-900/70 border-slate-800 p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">{isAr ? 'عنوان المستند' : 'Title'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'المصدر' : 'Source'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'التخصص' : 'Specialty'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'المقاطع' : 'Chunks'}</th>
                  <th className="py-3.5 px-4 text-center">{isAr ? 'معالجة' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-100">{d.title}</td>
                    <td className="py-3.5 px-4 text-slate-300">{d.sourceName || d.sourceId}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="secondary" size="sm">{d.specialty}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-purple-400">{d.chunksCount} مقطع</td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleIngestSingleDoc(d.id)}
                        leftIcon={<Play className="w-3 h-3 text-cyan-400" />}
                      >
                        {isAr ? 'إعادة فهرسة' : 'Re-index'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PROCESSING */}
      {activeSubTab === 'processing' && (
        <Card className="p-6 bg-slate-900/80 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-100">{isAr ? 'خط المعالجة والتضمين المجمّع' : 'Batch Ingestion'}</h3>
              <p className="text-xs text-slate-400">{isAr ? 'إعادة معالجة وتقطيع وتضمين كافة مستندات المعرفة الطبية' : 'Re-chunk and compute 384D embeddings'}</p>
            </div>
            <Button
              variant="primary"
              onClick={handleBatchIngestAll}
              isLoading={isIngestingBatch}
              leftIcon={<Play className="w-4 h-4" />}
            >
              {isAr ? 'فهرسة الكل الآن' : 'Index All'}
            </Button>
          </div>
        </Card>
      )}

      {/* STATUS */}
      {activeSubTab === 'status' && statusData && (
        <Card className="p-6 bg-slate-900/80 border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            {isAr ? 'مؤشرات أداء محرك الاسترجاع الطبي' : 'RAG Engine Status'}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div>Model: <span className="font-bold text-slate-200">{statusData.vectorDb.embeddingModel}</span></div>
              <div>Dimension: <span className="font-bold text-slate-200">{statusData.vectorDb.vectorDimension}D</span></div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div>Total Chunks: <span className="font-bold text-purple-400">{statusData.vectorDb.totalChunks}</span></div>
              <div>Vocabulary: <span className="font-bold text-emerald-400">{statusData.vectorDb.vocabularySize} tokens</span></div>
            </div>
          </div>
        </Card>
      )}

      {/* Modal: Add Source */}
      <Modal
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
        title={isAr ? 'تسجيل مصدر سريري معتمد' : 'Register Source'}
      >
        <form onSubmit={handleCreateSource} className="space-y-4">
          <Input
            label={isAr ? 'اسم المصدر (بالعربية)' : 'Source Name (Arabic)'}
            required
            value={sourceForm.nameAr}
            onChange={(e) => setSourceForm({ ...sourceForm, nameAr: e.target.value })}
            placeholder="منظمة الصحة العالمية"
          />
          <Input
            label={isAr ? 'اسم المصدر (بالإنجليزية)' : 'Source Name (English)'}
            required
            value={sourceForm.name}
            onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
            placeholder="World Health Organization"
          />
          <Input
            label={isAr ? 'المنظمة / الناشر' : 'Organization'}
            required
            value={sourceForm.organization}
            onChange={(e) => setSourceForm({ ...sourceForm, organization: e.target.value })}
            placeholder="WHO"
          />
          <Input
            label={isAr ? 'رابط المرجع (URL)' : 'Reference URL'}
            required
            value={sourceForm.url}
            onChange={(e) => setSourceForm({ ...sourceForm, url: e.target.value })}
            placeholder="https://who.int"
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAddSourceOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isAr ? 'تسجيل' : 'Register'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Doc */}
      <Modal
        isOpen={isAddDocOpen}
        onClose={() => setIsAddDocOpen(false)}
        title={isAr ? 'إضافة مستند وبروتوكول سريري' : 'Add Clinical Document'}
        size="lg"
      >
        <form onSubmit={handleCreateDoc} className="space-y-4">
          <Input
            label={isAr ? 'عنوان المستند' : 'Title'}
            required
            value={docForm.title}
            onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
            placeholder="البروتوكول السريري لإدارة السكري"
          />
          <Input
            label={isAr ? 'التخصص الطبي' : 'Specialty'}
            required
            value={docForm.specialty}
            onChange={(e) => setDocForm({ ...docForm, specialty: e.target.value })}
            placeholder="Endocrinology"
          />
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{isAr ? 'النص السريري الكامل' : 'Full Text'}</label>
            <textarea
              required
              rows={5}
              value={docForm.fullText}
              onChange={(e) => setDocForm({ ...docForm, fullText: e.target.value })}
              placeholder={isAr ? 'اكتب أو الصق نص الدليل السريري...' : 'Paste guideline text...'}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAddDocOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isAr ? 'إنشاء وفهرسة' : 'Create & Index'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
