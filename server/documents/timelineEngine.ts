import { HealthTimelineEvent, BiomarkerTrendSeries, BiomarkerTrendPoint } from './types.js';
import { documentStore } from './documentStore.js';
import { userDataStore } from '../db/userDataStore.js';
import { UserRecord } from '../db/schema.js';
import { BIOMARKER_DATABASE } from './labInterpretationEngine.js';

export class TimelineEngine {
  /**
   * Builds the comprehensive longitudinal Health Timeline for a patient
   * correlating: Date -> Symptom -> Consultation -> Medication -> Test -> Result
   */
  public generateHealthTimeline(user?: UserRecord | null, targetUserId?: string): {
    timelineEvents: HealthTimelineEvent[];
    biomarkerTrends: BiomarkerTrendSeries[];
    summary: {
      totalEvents: number;
      symptomsCount: number;
      consultationsCount: number;
      medicationsCount: number;
      testsCount: number;
      resultsCount: number;
      criticalAlertsCount: number;
    };
  } {
    const effectiveUserId = targetUserId || user?.id || 'usr_pat_001';
    const events: HealthTimelineEvent[] = [];

    // 1. Fetch consultations & symptoms from UserDataStore
    const consultations = userDataStore.getConsultations(user || null, effectiveUserId);
    for (const c of consultations) {
      const dateStr = c.timestamp.split('T')[0];

      // A) Symptom Event
      events.push({
        id: `timeline_symp_${c.id}`,
        date: dateStr,
        type: 'SYMPTOM',
        titleAr: 'شكوى سريرية وأعراض مسجلة',
        titleEn: 'Reported Clinical Symptom',
        descriptionAr: c.symptoms,
        descriptionEn: `Patient reported: ${c.symptoms}`,
        category: 'Clinical Intake',
        statusBadge: {
          textAr: c.urgencyLabelAr || 'فرز سريري',
          textEn: c.urgencyLabelEn || 'Triage',
          variant: c.urgency === 'EMERGENCY' ? 'critical' : c.urgency === 'URGENT' ? 'warning' : 'info',
        },
        associatedData: {
          symptomName: c.symptoms,
          urgency: c.urgency,
        },
      });

      // B) Consultation Encounter Event
      events.push({
        id: `timeline_cons_${c.id}`,
        date: dateStr,
        type: 'CONSULTATION',
        titleAr: `استشارة وفرز سريري (${c.urgencyLabelAr})`,
        titleEn: `Clinical Consultation (${c.urgencyLabelEn})`,
        descriptionAr: c.summaryAr || 'تم إجراء الفرز السريري وتقييم الحالة وفق البروتوكولات المعتمدة.',
        descriptionEn: c.summaryEn || 'Clinical evaluation and differential analysis completed.',
        category: 'Consultation',
        statusBadge: {
          textAr: c.status === 'COMPLETED' ? 'مكتملة' : 'محالة للعيادة',
          textEn: c.status === 'COMPLETED' ? 'Completed' : 'Referred',
          variant: 'success',
        },
        associatedData: {
          urgency: c.urgency,
          doctorName: 'Clinical Triage Board',
        },
      });
    }

    // 2. Fetch Medications from UserDataStore
    const medications = userDataStore.getMedications(user || null, effectiveUserId);
    for (const med of medications) {
      const medDate = med.startDate || med.createdAt.split('T')[0];
      events.push({
        id: `timeline_med_${med.id}`,
        date: medDate,
        type: 'MEDICATION',
        titleAr: `بدء علاج: ${med.nameAr}`,
        titleEn: `Prescribed Medication: ${med.nameEn || med.nameAr}`,
        descriptionAr: `الجرعة: ${med.dosage} (${med.frequency}). دواعي الاستعمال: ${med.indication || 'حسب إرشادات الطبيب'}.`,
        descriptionEn: `Dosage: ${med.dosage} (${med.frequency}). Indication: ${med.indication || 'Per physician instruction'}.`,
        category: 'Pharmacotherapy',
        statusBadge: {
          textAr: med.status === 'ACTIVE' ? 'نشط ومستمر' : 'متوقف',
          textEn: med.status === 'ACTIVE' ? 'Active' : 'Discontinued',
          variant: med.status === 'ACTIVE' ? 'success' : 'info',
        },
        associatedData: {
          medicationName: med.nameAr,
          dosage: `${med.dosage} - ${med.frequency}`,
          doctorName: med.prescriber,
        },
      });
    }

    // 3. Fetch Documents & Tests
    const documents = documentStore.getDocumentsForUser(user || null, effectiveUserId);
    for (const doc of documents) {
      const docDate = doc.classification.documentDate || doc.uploadedAt.split('T')[0];

      // A) Test Ordered/Uploaded Event
      events.push({
        id: `timeline_test_${doc.id}`,
        date: docDate,
        type: 'TEST',
        titleAr: `فحص تشخيصي: ${doc.classification.categoryAr}`,
        titleEn: `Diagnostic Test: ${doc.classification.categoryEn}`,
        descriptionAr: `${doc.classification.summaryAr} (الجهة: ${doc.classification.issuingFacility || 'مختبرات معتمدة'}).`,
        descriptionEn: `${doc.classification.summaryEn} (Facility: ${doc.classification.issuingFacility || 'Accredited Lab'}).`,
        category: doc.classification.category,
        statusBadge: {
          textAr: doc.status === 'CONFIRMED' ? 'معتمد وموثق' : 'قيد مراجعة المريض',
          textEn: doc.status === 'CONFIRMED' ? 'Verified' : 'Pending Review',
          variant: doc.status === 'CONFIRMED' ? 'success' : 'warning',
        },
        associatedData: {
          testName: doc.fileName,
          doctorName: doc.classification.doctorName,
          documentId: doc.id,
        },
      });

      // B) Results Events (for confirmed lab items)
      const labItems = doc.confirmedLabResults || (doc.status === 'CONFIRMED' ? doc.extractedLabResults : []);
      for (const item of labItems) {
        let badgeVariant: HealthTimelineEvent['statusBadge']['variant'] = 'normal';
        let badgeTextAr = 'طبيعي';
        let badgeTextEn = 'Normal';

        if (item.status === 'Critical') {
          badgeVariant = 'critical';
          badgeTextAr = 'حرج وإسعافي';
          badgeTextEn = 'Critical Alert';
        } else if (item.status === 'High') {
          badgeVariant = 'warning';
          badgeTextAr = 'مرتفع';
          badgeTextEn = 'High';
        } else if (item.status === 'Low') {
          badgeVariant = 'warning';
          badgeTextAr = 'منخفض';
          badgeTextEn = 'Low';
        }

        events.push({
          id: `timeline_res_${doc.id}_${item.id}`,
          date: docDate,
          type: 'RESULT',
          titleAr: `نتيجة تحليل: ${item.testNameAr} (${item.resultValue} ${item.unit})`,
          titleEn: `Lab Result: ${item.testName} (${item.resultValue} ${item.unit})`,
          descriptionAr: item.interpretation.flagExplanationAr,
          descriptionEn: item.interpretation.flagExplanationEn,
          category: item.category,
          statusBadge: {
            textAr: badgeTextAr,
            textEn: badgeTextEn,
            variant: badgeVariant,
          },
          associatedData: {
            testName: item.testName,
            resultValue: item.resultValue,
            unit: item.unit,
            referenceRange: item.referenceRange.textRange,
            documentId: doc.id,
          },
        });
      }
    }

    // Sort all events chronologically (latest first for display, or earliest first)
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 4. Generate Longitudinal Biomarker Trend Series (e.g. Glucose, HbA1c, Creatinine, Hemoglobin)
    const confirmedLabs = documentStore.getConfirmedLabsForUser(effectiveUserId);
    const biomarkerTrends: BiomarkerTrendSeries[] = [];

    // Group confirmed labs by biomarker canonical name
    const groupedLabs = new Map<string, Array<{ date: string; value: number; unit: string; status: any; docId: string }>>();

    for (const cl of confirmedLabs) {
      if (cl.isNumeric && typeof cl.resultValue === 'number') {
        const key = cl.testName;
        if (!groupedLabs.has(key)) {
          groupedLabs.set(key, []);
        }
        groupedLabs.get(key)!.push({
          date: cl.date,
          value: cl.resultValue,
          unit: cl.unit,
          status: cl.status,
          docId: cl.documentId,
        });
      }
    }

    // Format into trend series
    for (const [testName, points] of groupedLabs.entries()) {
      const dbMatch = BIOMARKER_DATABASE.find(
        (b) => b.nameEn.toLowerCase() === testName.toLowerCase() || b.aliases.some((a) => testName.toLowerCase().includes(a))
      );

      const standardMin = dbMatch?.referenceRanges[0]?.min || 0;
      const standardMax = dbMatch?.referenceRanges[0]?.max || 100;
      const testNameAr = dbMatch?.nameAr || testName;

      // Sort points chronologically (oldest to newest for charting)
      const sortedPoints: BiomarkerTrendPoint[] = points
        .map((p) => ({
          date: p.date,
          value: p.value,
          unit: p.unit,
          status: p.status,
          referenceMin: standardMin,
          referenceMax: standardMax,
          documentId: p.docId,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      biomarkerTrends.push({
        testName,
        testNameAr,
        unit: points[0]?.unit || '',
        points: sortedPoints,
        standardMin,
        standardMax,
      });
    }

    // Metrics summary
    const summary = {
      totalEvents: events.length,
      symptomsCount: events.filter((e) => e.type === 'SYMPTOM').length,
      consultationsCount: events.filter((e) => e.type === 'CONSULTATION').length,
      medicationsCount: events.filter((e) => e.type === 'MEDICATION').length,
      testsCount: events.filter((e) => e.type === 'TEST').length,
      resultsCount: events.filter((e) => e.type === 'RESULT').length,
      criticalAlertsCount: events.filter((e) => e.statusBadge?.variant === 'critical').length,
    };

    return {
      timelineEvents: events,
      biomarkerTrends,
      summary,
    };
  }
}

export const timelineEngine = new TimelineEngine();
