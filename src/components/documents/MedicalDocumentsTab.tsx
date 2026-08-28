import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Eye,
  Trash2,
  Sparkles,
  ShieldAlert,
  Edit3,
  Save,
  ArrowRight,
  Info,
  Clock,
  Building,
  UserCheck,
  RefreshCw,
  FileUp,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  MedicalDocumentRecord,
  ExtractedLabItem,
  DocumentCategory,
} from '../../../server/documents/types.js';

interface MedicalDocumentsTabProps {
  onDocumentConfirmed?: (doc: MedicalDocumentRecord) => void;
}

export const MedicalDocumentsTab: React.FC<MedicalDocumentsTabProps> = ({ onDocumentConfirmed }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';

  const [documents, setDocuments] = useState<MedicalDocumentRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<MedicalDocumentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);

  // Review & Confirmation State
  const [editingItems, setEditingItems] = useState<ExtractedLabItem[]>([]);
  const [userReviewNotes, setUserReviewNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmSuccessMsg, setConfirmSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleReports = [
    {
      id: 'cbc_renal',
      titleAr: 'تقرير تعداد الدم ووظائف الكلى (CBC + Renal)',
      titleEn: 'CBC & Renal Function Panel (PDF)',
      fileName: 'Sample_CBC_Renal_Panel.pdf',
      fileType: 'PDF',
      fileSize: '340 KB',
      descriptionAr: 'يحتوي على خضاب الدم والهيماتوكريت والصفائح والكرياتينين والسكر الصائم.',
      descriptionEn: 'Contains Hemoglobin, WBC, Platelets, Creatinine, and Fasting Glucose.',
    },
    {
      id: 'diabetic_lipid',
      titleAr: 'فحص السكر التراكمي والدهون (Diabetes & Lipids)',
      titleEn: 'Diabetic & Lipid Profile Report (PNG)',
      fileName: 'Sample_Diabetic_Lipids.png',
      fileType: 'PNG',
      fileSize: '510 KB',
      descriptionAr: 'يحتوي على السكر التراكمي (HbA1c) والكوليسترول الكلي والضار LDL والإنزيمات.',
      descriptionEn: 'Contains HbA1c, Total Cholesterol, LDL, ALT enzyme, and Serum Creatinine.',
    },
    {
      id: 'emergency_cardiac',
      titleAr: 'تقرير طوارئ لإنزيمات القلب والأملاح (STAT Cardiac)',
      titleEn: 'Emergency Cardiac & Electrolyte STAT (JPG)',
      fileName: 'Emergency_Cardiac_Troponin_STAT.jpg',
      fileType: 'JPG',
      fileSize: '420 KB',
      descriptionAr: 'يحتوي على تروبونين القلب وبوتاسيوم وصوديوم مع تنبيهات للحالات الحرجة.',
      descriptionEn: 'Contains Cardiac Troponin I, Potassium, Sodium, and Creatinine with Critical Alert.',
    },
  ];

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
        if (!selectedDoc && data.documents.length > 0) {
          setSelectedDoc(data.documents[0]);
          setEditingItems(data.documents[0].extractedLabResults || []);
        }
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSelectDocument = (doc: MedicalDocumentRecord) => {
    setSelectedDoc(doc);
    setEditingItems(
      doc.status === 'CONFIRMED' && doc.confirmedLabResults?.length
        ? doc.confirmedLabResults
        : doc.extractedLabResults
    );
    setUserReviewNotes(doc.userReviewNotes || '');
    setConfirmSuccessMsg(null);
    setUploadError(null);
  };

  const processUpload = async (fileName: string, mimeType: string, fileSize: number, sampleId?: string, base64?: string) => {
    setIsUploading(true);
    setUploadError(null);
    setConfirmSuccessMsg(null);

    // Animate Pipeline Steps for user feedback
    setPipelineStep(1); // Uploading
    await new Promise((r) => setTimeout(r, 300));
    setPipelineStep(2); // Text extraction
    await new Promise((r) => setTimeout(r, 400));
    setPipelineStep(3); // Classification
    await new Promise((r) => setTimeout(r, 300));
    setPipelineStep(4); // Data extraction

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          mimeType,
          fileSizeBytes: fileSize,
          sampleId,
          base64Data: base64,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setUploadError(isAr ? data.messageAr || data.error : data.error);
        setPipelineStep(0);
        return;
      }

      setPipelineStep(5); // Ready for Confirmation
      const newDoc: MedicalDocumentRecord = data.document;
      setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
      setSelectedDoc(newDoc);
      setEditingItems(newDoc.extractedLabResults || []);
    } catch (err: any) {
      setUploadError(err?.message || 'Network error during upload');
      setPipelineStep(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (<15MB)
    if (file.size > 15 * 1024 * 1024) {
      setUploadError(
        isAr
          ? 'حجم الملف يتجاوز الحد الأقصى المسموح به (15 ميغابايت).'
          : 'File size exceeds 15MB maximum limit.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      processUpload(file.name, file.type, file.size, undefined, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmAndSave = async () => {
    if (!selectedDoc) return;
    setIsConfirming(true);
    setUploadError(null);

    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewedItems: editingItems,
          userReviewNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setUploadError(isAr ? data.messageAr || data.error : data.error);
        return;
      }

      const updatedDoc: MedicalDocumentRecord = data.document;
      setSelectedDoc(updatedDoc);
      setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
      setConfirmSuccessMsg(
        isAr
          ? 'تم اعتماد نتائج التحاليل وتخزينها بنجاح في السجل الصحي والخط الزمني!'
          : 'Lab parameters verified and saved to structured health records & timeline!'
      );
      if (onDocumentConfirmed) {
        onDocumentConfirmed(updatedDoc);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to confirm document');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleItemValueChange = (index: number, val: string | number) => {
    const next = [...editingItems];
    next[index] = {
      ...next[index],
      resultValue: val,
      editedByUser: true,
    };
    setEditingItems(next);
  };

  const handleItemUnitChange = (index: number, unit: string) => {
    const next = [...editingItems];
    next[index] = {
      ...next[index],
      unit,
      editedByUser: true,
    };
    setEditingItems(next);
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من رغبتك في حذف هذا المستند؟' : 'Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
        setEditingItems([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Critical':
        return 'bg-red-500/20 text-red-300 border-red-500/60 animate-pulse font-bold';
      case 'High':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold';
      case 'Low':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/60 font-semibold';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone & Format Guidance */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileUp className="w-5 h-5 text-cyan-400" />
              <span>{isAr ? 'رفع ومسح المستندات والتقارير الطبية' : 'Medical Document & Lab Scanner'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'يدعم ملفات PDF و صور PNG, JPG, JPEG حتى 15 ميغابايت مع حماية سرية تامة ومراجعة أمان OCR.'
                : 'Supports PDF, PNG, JPG, JPEG up to 15MB with encrypted access control & OCR safety review.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              PDF
            </span>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              PNG
            </span>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              JPG / JPEG
            </span>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
              Max 15MB
            </span>
          </div>
        </div>

        {/* Drag & Drop Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                processUpload(file.name, file.type, file.size, undefined, reader.result as string);
              };
              reader.readAsDataURL(file);
            }
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
            onChange={handleManualFileUpload}
          />
          <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-200 mb-1">
            {isAr ? 'اسحب وأفلت تقريرك الطبي هنا، أو اضغط للتصفح' : 'Drag & drop your medical document here, or browse'}
          </p>
          <p className="text-xs text-slate-400 mb-4">
            {isAr
              ? 'يتم فحص وتصنيف التقرير واستخراج التحاليل تلقائياً مع تمكين المراجعة قبل الاعتماد.'
              : 'Automated text extraction, classification, and biomarker parsing with human-in-the-loop safety.'}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {isAr ? 'جارٍ المعالجة واستخراج البيانات...' : 'Processing Pipeline...'}
              </span>
            ) : (
              <span>{isAr ? 'اختيار ملف من الجهاز' : 'Select File from Device'}</span>
            )}
          </button>
        </div>

        {/* 1-Click Clinical Demo Samples */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'نماذج وتقارير تجريبية سريعة بنقرة واحدة:' : '1-Click Clinical Benchmark Samples:'}</span>
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sampleReports.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => processUpload(sample.fileName, sample.fileType === 'PDF' ? 'application/pdf' : 'image/png', 350000, sample.id)}
                disabled={isUploading}
                className="text-start p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {isAr ? sample.titleAr : sample.titleEn}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {sample.fileType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {isAr ? sample.descriptionAr : sample.descriptionEn}
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                  <span>{isAr ? 'اختبار هذا النموذج' : 'Load Sample'}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Progress Indicator */}
        {isUploading && (
          <div className="mt-5 p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-300 mb-2">
              <span>{isAr ? 'مسار معالجة المستند الطبي:' : 'Document Pipeline Flow:'}</span>
              <span>Step {pipelineStep} of 5</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
              <div className={`p-1.5 rounded ${pipelineStep >= 1 ? 'bg-cyan-500 text-white font-bold' : 'bg-slate-800 text-slate-500'}`}>
                1. Upload
              </div>
              <div className={`p-1.5 rounded ${pipelineStep >= 2 ? 'bg-cyan-500 text-white font-bold' : 'bg-slate-800 text-slate-500'}`}>
                2. OCR Extract
              </div>
              <div className={`p-1.5 rounded ${pipelineStep >= 3 ? 'bg-cyan-500 text-white font-bold' : 'bg-slate-800 text-slate-500'}`}>
                3. Classify
              </div>
              <div className={`p-1.5 rounded ${pipelineStep >= 4 ? 'bg-cyan-500 text-white font-bold' : 'bg-slate-800 text-slate-500'}`}>
                4. Data Parse
              </div>
              <div className={`p-1.5 rounded ${pipelineStep >= 5 ? 'bg-cyan-500 text-white font-bold' : 'bg-slate-800 text-slate-500'}`}>
                5. Review
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {uploadError && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Success Alert */}
        {confirmSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{confirmSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Split: Documents List vs Selected Document OCR & Review Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Saved Documents List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isAr ? 'المستندات المحفوظة' : 'Uploaded Documents'} ({documents.length})
              </h3>
              <button
                onClick={fetchDocuments}
                className="text-xs text-slate-400 hover:text-white p-1"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                {isAr ? 'لا توجد مستندات مرفوعة حالياً.' : 'No documents uploaded yet.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {documents.map((doc) => {
                  const isSelected = selectedDoc?.id === doc.id;
                  const isConfirmed = doc.status === 'CONFIRMED';
                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDocument(doc)}
                      className={`p-3 rounded-xl border text-start cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/80 shadow-sm'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-slate-200 truncate">{doc.fileName}</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                            isConfirmed
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {isConfirmed ? (isAr ? 'معتمد وموثق' : 'Confirmed') : (isAr ? 'قيد المراجعة' : 'Pending')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                        <span>{doc.classification.categoryAr || doc.classification.categoryEn}</span>
                        <span>{doc.classification.documentDate || doc.uploadedAt.split('T')[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Selected Document Detail & OCR Safety Review */}
        <div className="lg:col-span-8 space-y-4">
          {selectedDoc ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
              {/* Document Header & Metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{selectedDoc.fileName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedDoc.fileType}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{selectedDoc.classification.issuingFacility || 'Clinical Lab'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedDoc.classification.documentDate || selectedDoc.uploadedAt.split('T')[0]}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedDoc.classification.doctorName || 'Attending Physician'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteDocument(selectedDoc.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 transition-colors"
                    title={isAr ? 'حذف المستند' : 'Delete Document'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* OCR Safety Warning Banner */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isAr ? 'إشعار أمان استخراج النصوص (OCR Safety Policy)' : 'OCR Safety Verification Policy'}</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  {isAr
                    ? 'تنبيه أمان: لا يُعتبر الاستخراج الآلي للبيانات (OCR) صحيحاً بنسبة 100%. يرجى مراجعة وتعديل اسم التحليل والنتيجة والوحدة والمعدل المرجعي أدناه قبل الاعتماد النهائي.'
                    : 'Safety Rule: OCR extraction is never considered 100% accurate. Please review and edit the test names, values, units, and reference ranges below before confirming.'}
                </p>
              </div>

              {/* Extracted Lab Tests Table (Editable) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isAr ? 'التحاليل المستخرجة للمراجعة والتعديل:' : 'Extracted Lab Parameters for Review:'}</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {editingItems.length} {isAr ? 'تحليل مستخرج' : 'parameters found'}
                  </span>
                </div>

                {editingItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800">
                    {isAr
                      ? 'لم يتم العثور على قيم تحاليل رقمية واضحة في هذا التقرير. يمكنك مراجعة النص الخام أدناه.'
                      : 'No numeric lab parameters were automatically identified. View raw OCR text below.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/50">
                    <table className="w-full text-start text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="p-3 text-start">{isAr ? 'اسم التحليل' : 'Test Name'}</th>
                          <th className="p-3 text-start">{isAr ? 'النتيجة' : 'Result'}</th>
                          <th className="p-3 text-start">{isAr ? 'الوحدة' : 'Unit'}</th>
                          <th className="p-3 text-start">{isAr ? 'المعدل الطبيعي' : 'Ref Range'}</th>
                          <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {editingItems.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-3 font-semibold text-slate-200">
                              <div>{isAr ? item.testNameAr : item.testName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{item.testName}</div>
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                step="any"
                                value={item.resultValue}
                                onChange={(e) => handleItemValueChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => handleItemUnitChange(idx, e.target.value)}
                                className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:border-cyan-400 focus:outline-none"
                              />
                            </td>
                            <td className="p-3 text-slate-400 text-[11px]">
                              {item.referenceRange.textRange}
                            </td>
                            <td className="p-3">
                              <span className={`text-[10px] px-2.5 py-1 rounded-md border ${getStatusBadge(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* User Notes and Confirmation Actions */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-300">
                  {isAr ? 'ملاحظات المريض / الطبيب المراجع:' : 'Patient / Reviewer Clinical Notes:'}
                </label>
                <textarea
                  value={userReviewNotes}
                  onChange={(e) => setUserReviewNotes(e.target.value)}
                  placeholder={isAr ? 'أدخل أي ملاحظات إضافية بخصوص هذا الفحص...' : 'Add any clinical notes regarding this document...'}
                  rows={2}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-cyan-400 focus:outline-none"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {selectedDoc.status === 'CONFIRMED'
                        ? isAr
                          ? 'هذا المستند تم اعتماده مسبقاً، يمكنك إعادة حفظ التعديلات.'
                          : 'Document is confirmed; you can update and re-commit.'
                        : isAr
                        ? 'الاعتماد سيقوم بحفظ النتائج المهيكلة في ملفك الصحي والخط الزمني.'
                        : 'Confirming will store structured biomarkers into your Health Timeline.'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmAndSave}
                    disabled={isConfirming || editingItems.length === 0}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isConfirming ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{isAr ? 'اعتماد وحفظ في السجل الطبي' : 'Confirm & Save to Records'}</span>
                  </button>
                </div>
              </div>

              {/* Raw OCR Text Viewer (Collapsible) */}
              <details className="pt-3 border-t border-slate-800 group">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300 font-semibold flex items-center justify-between">
                  <span>{isAr ? 'عرض النص المستخرج من المستند (Raw OCR Output)' : 'View Raw Extracted Text (OCR Source)'}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Source: {selectedDoc.extractionSource}</span>
                </summary>
                <pre className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                  {selectedDoc.rawExtractedText}
                </pre>
              </details>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2">
              <FileText className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-400">
                {isAr ? 'اختر مستنداً من القائمة أو ارفع تقريراً جديداً' : 'Select a document or upload a new report to review'}
              </p>
              <p className="text-xs text-slate-500">
                {isAr ? 'ستتم معالجة التقرير وعرض النتائج المستخرجة للتحقق منها.' : 'The extracted biomarkers and clinical interpretations will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
