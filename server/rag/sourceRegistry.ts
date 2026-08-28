import { KnowledgeSource } from '../types/rag.js';

class SourceRegistry {
  private sources: Map<string, KnowledgeSource> = new Map();

  constructor() {
    this.seedInitialSources();
  }

  private seedInitialSources(): void {
    const initialSources: KnowledgeSource[] = [
      {
        id: 'SRC_MOH_SA',
        name: 'Saudi Ministry of Health Clinical Guidelines',
        nameAr: 'الأدلة الإرشادية الإكلينيكية - وزارة الصحة السعودية',
        organization: 'MOH_SA',
        url: 'https://www.moh.gov.sa/Ministry/MediaCenter/Publications/Pages/Clinical-Practice-Guidelines.aspx',
        contentType: 'CLINICAL_PRACTICE_GUIDELINE',
        authorityLevel: 'TIER_1_GLOBAL_MINISTRY',
        lastReviewed: '2024-01-15',
        status: 'ACTIVE',
        descriptionAr: 'الأدلة والمسارات السريرية الوطنية المعتمدة من وزارة الصحة في المملكة العربية السعودية للرعاية الأولية والتخصصية.',
        descriptionEn: 'National clinical practice guidelines and pathways issued by the Saudi Ministry of Health for primary and specialized care.',
        documentCount: 2,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      },
      {
        id: 'SRC_WHO',
        name: 'World Health Organization (WHO)',
        nameAr: 'منظمة الصحة العالمية (WHO)',
        organization: 'WHO',
        url: 'https://www.who.int/publications/guidelines',
        contentType: 'PUBLIC_HEALTH_ADVISORY',
        authorityLevel: 'TIER_1_GLOBAL_MINISTRY',
        lastReviewed: '2023-11-20',
        status: 'ACTIVE',
        descriptionAr: 'المعايير الدولية والمبادئ التوجيهية العالمية لتدبير الأمراض السارية والمزمنة وترشيد العلاجات.',
        descriptionEn: 'International health guidelines, essential medicines recommendations, and global disease management standards.',
        documentCount: 2,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2023-11-20T00:00:00.000Z',
      },
      {
        id: 'SRC_NICE',
        name: 'National Institute for Health and Care Excellence (NICE)',
        nameAr: 'المعهد الوطني للتميز السريري (NICE - المملكة المتحدة)',
        organization: 'NICE',
        url: 'https://www.nice.org.uk/guidance',
        contentType: 'CLINICAL_PRACTICE_GUIDELINE',
        authorityLevel: 'TIER_1_GLOBAL_MINISTRY',
        lastReviewed: '2023-12-05',
        status: 'ACTIVE',
        descriptionAr: 'إرشادات سريرية دقيقة مبنية على البراهين لتشخيص وعلاج الأمراض الباطنية والمزمنة وحالات الطوارئ.',
        descriptionEn: 'Evidence-based clinical guidelines and quality standards for diagnosis, intervention, and chronic disease management.',
        documentCount: 3,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2023-12-05T00:00:00.000Z',
      },
      {
        id: 'SRC_CDC',
        name: 'Centers for Disease Control and Prevention (CDC)',
        nameAr: 'مراكز السيطرة على الأمراض والوقاية منها (CDC)',
        organization: 'CDC',
        url: 'https://www.cdc.gov/clinical-guidance',
        contentType: 'PUBLIC_HEALTH_ADVISORY',
        authorityLevel: 'TIER_1_GLOBAL_MINISTRY',
        lastReviewed: '2024-02-10',
        status: 'ACTIVE',
        descriptionAr: 'بروتوكولات الوقاية، مكافحة العدوى، والاستخدام الرشيد للمضادات الحيوية في العيادات الخارجية.',
        descriptionEn: 'Protocols for infection control, disease surveillance, and outpatient antibiotic stewardship.',
        documentCount: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-02-10T00:00:00.000Z',
      },
      {
        id: 'SRC_AHA_ACC',
        name: 'American Heart Association / American College of Cardiology (AHA/ACC)',
        nameAr: 'جمعية القلب الأمريكية والكلية الأمريكية لأمراض القلب (AHA/ACC)',
        organization: 'AHA/ACC',
        url: 'https://www.ahajournals.org/guidelines',
        contentType: 'CLINICAL_PRACTICE_GUIDELINE',
        authorityLevel: 'TIER_2_SPECIALTY_COLLEGE',
        lastReviewed: '2023-10-18',
        status: 'ACTIVE',
        descriptionAr: 'المعايير التخصصية الرائدة لتقييم آلام الصدر، المتلازمة التاجية الحادة، وفشل القلب، والإنعاش القلبي.',
        descriptionEn: 'Leading clinical cardiology guidelines on acute chest pain evaluation, acute coronary syndromes, and heart failure.',
        documentCount: 2,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2023-10-18T00:00:00.000Z',
      },
      {
        id: 'SRC_ADA',
        name: 'American Diabetes Association (ADA Standards of Care)',
        nameAr: 'الجمعية الأمريكية للسكري (معايير الرعاية الطبية ADA)',
        organization: 'ADA',
        url: 'https://diabetesjournals.org/care/issue',
        contentType: 'CLINICAL_PRACTICE_GUIDELINE',
        authorityLevel: 'TIER_2_SPECIALTY_COLLEGE',
        lastReviewed: '2024-01-02',
        status: 'ACTIVE',
        descriptionAr: 'معايير الرعاية السنوية الشاملة لضبط السكر التراكمي، الوقاية من مضاعفات السكري، وإرشادات الأدوية الحديثة.',
        descriptionEn: 'Annual comprehensive standards of medical care in diabetes, glycemic targets, pharmacotherapy, and cardiovascular-renal protection.',
        documentCount: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
      {
        id: 'SRC_UPTODATE',
        name: 'UpToDate Clinical Decision Support & Systematic Reviews',
        nameAr: 'مستودع المراجعات المنهجية وقرارات العلاج (UpToDate)',
        organization: 'UpToDate',
        url: 'https://www.uptodate.com/contents/search',
        contentType: 'SYSTEMATIC_REVIEW',
        authorityLevel: 'TIER_3_ACADEMIC_INSTITUTE',
        lastReviewed: '2024-02-01',
        status: 'ACTIVE',
        descriptionAr: 'مراجعات سريرية وبحثية محكّمة لممارسات الطب المبني على البراهين والتفاعلات الدوائية المعقدة.',
        descriptionEn: 'Peer-reviewed clinical evidence synthesis and decision support for specialized differential diagnosis and pharmacovigilance.',
        documentCount: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z',
      },
    ];

    for (const src of initialSources) {
      this.sources.set(src.id, src);
    }
  }

  public getAllSources(): KnowledgeSource[] {
    return Array.from(this.sources.values());
  }

  public getSourceById(id: string): KnowledgeSource | undefined {
    return this.sources.get(id);
  }

  public validateSource(sourceData: Partial<KnowledgeSource>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!sourceData.name || sourceData.name.trim().length < 3) {
      errors.push('Source Name must be at least 3 characters.');
    }
    if (!sourceData.organization || sourceData.organization.trim().length < 2) {
      errors.push('Organization identifier is required.');
    }
    if (!sourceData.url || !/^https?:\/\//i.test(sourceData.url)) {
      errors.push('Valid HTTPS/HTTP URL is required.');
    }
    if (!sourceData.contentType) {
      errors.push('Content Type must be specified.');
    }
    if (!sourceData.authorityLevel) {
      errors.push('Authority Level (Tier 1/2/3) must be specified.');
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public registerSource(data: Omit<KnowledgeSource, 'id' | 'createdAt' | 'updatedAt' | 'documentCount'> & { id?: string }): KnowledgeSource {
    const validation = this.validateSource(data);
    if (!validation.valid) {
      throw new Error(`Source validation failed: ${validation.errors.join(', ')}`);
    }

    const id = data.id || `SRC_${data.organization.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const newSource: KnowledgeSource = {
      ...data,
      id,
      nameAr: data.nameAr || data.name,
      documentCount: 0,
      status: data.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    this.sources.set(id, newSource);
    return newSource;
  }

  public updateSource(id: string, updates: Partial<Omit<KnowledgeSource, 'id' | 'createdAt'>>): KnowledgeSource {
    const existing = this.sources.get(id);
    if (!existing) {
      throw new Error(`Source with ID "${id}" not found.`);
    }

    const updated: KnowledgeSource = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.sources.set(id, updated);
    return updated;
  }

  public deleteSource(id: string): boolean {
    return this.sources.delete(id);
  }

  public updateDocumentCount(sourceId: string, delta: number): void {
    const src = this.sources.get(sourceId);
    if (src) {
      src.documentCount = Math.max(0, (src.documentCount || 0) + delta);
      src.updatedAt = new Date().toISOString();
    }
  }
}

export const sourceRegistry = new SourceRegistry();
