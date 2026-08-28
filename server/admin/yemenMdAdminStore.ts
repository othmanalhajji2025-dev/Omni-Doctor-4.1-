/**
 * YemenMD Local Healthcare & Epidemiological Intelligence Data Store
 * Admin governance for local outbreaks, facility network, and dialect medical lexicon
 */

import fs from 'fs';
import path from 'path';

export interface YemenOutbreakRecord {
  id: string;
  diseaseNameAr: string;
  diseaseNameEn: string;
  category: 'INFECTIOUS' | 'WATERBORNE' | 'VECTOR_BORNE' | 'CHRONIC_EPIDEMIC' | 'NUTRITIONAL';
  governoratesAffected: string[];
  alertLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'MONITORING';
  caseCountEstimated: number;
  reportedDate: string;
  transmissionModeAr: string;
  transmissionModeEn: string;
  clinicalAdvisoryAr: string;
  clinicalAdvisoryEn: string;
  emergencyProtocolAr: string;
  updatedAt: string;
}

export interface YemenFacilityRecord {
  id: string;
  nameAr: string;
  nameEn: string;
  governorateAr: string;
  governorateEn: string;
  cityAr: string;
  facilityType: 'TERTIARY_HOSPITAL' | 'PUBLIC_HOSPITAL' | 'EMERGENCY_CENTER' | 'SPECIALIZED_CLINIC';
  emergencyHotline: string;
  secondaryPhone?: string;
  has24HourEmergency: boolean;
  hasOxygenSupply: boolean;
  hasIcuCapacity: boolean;
  hasBloodBank: boolean;
  ambulanceAvailable: boolean;
  addressAr: string;
  latitude?: number;
  longitude?: number;
  operationalStatus: 'FULLY_OPERATIONAL' | 'LIMITED_CAPACITY' | 'EMERGENCY_ONLY';
  updatedAt: string;
}

export interface YemenDialectLexiconItem {
  id: string;
  dialectPhraseAr: string;
  phoneticPronunciation: string;
  region: 'SANAANI' | 'ADENI' | 'TAIZI' | 'HODIEDAH_TIHAMA' | 'HADRAMI' | 'PAN_YEMENI';
  standardArabicMeaning: string;
  medicalConceptEn: string;
  clinicalCategory: 'SYMPTOM' | 'ANATOMICAL' | 'TEMPORAL' | 'SEVERITY';
  clinicalContextAr: string;
  icd10Hint?: string;
  updatedAt: string;
}

export class YemenMdAdminStore {
  private dataDir = path.join(process.cwd(), 'server', 'data');
  private outbreaksFile = path.join(this.dataDir, 'yemen_outbreaks.json');
  private facilitiesFile = path.join(this.dataDir, 'yemen_facilities.json');
  private lexiconFile = path.join(this.dataDir, 'yemen_dialect_lexicon.json');

  private outbreaks: YemenOutbreakRecord[] = [];
  private facilities: YemenFacilityRecord[] = [];
  private lexicon: YemenDialectLexiconItem[] = [];

  constructor() {
    this.ensureDirectory();
    this.initializeData();
  }

  private ensureDirectory(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (err) {
      console.warn('[YemenMdAdminStore] Directory creation warning:', err);
    }
  }

  private initializeData(): void {
    // 1. Outbreaks
    try {
      if (fs.existsSync(this.outbreaksFile)) {
        this.outbreaks = JSON.parse(fs.readFileSync(this.outbreaksFile, 'utf-8'));
      } else {
        this.seedOutbreaks();
        this.persistOutbreaks();
      }
    } catch (err) {
      this.seedOutbreaks();
    }

    // 2. Facilities
    try {
      if (fs.existsSync(this.facilitiesFile)) {
        this.facilities = JSON.parse(fs.readFileSync(this.facilitiesFile, 'utf-8'));
      } else {
        this.seedFacilities();
        this.persistFacilities();
      }
    } catch (err) {
      this.seedFacilities();
    }

    // 3. Dialect Lexicon
    try {
      if (fs.existsSync(this.lexiconFile)) {
        this.lexicon = JSON.parse(fs.readFileSync(this.lexiconFile, 'utf-8'));
      } else {
        this.seedLexicon();
        this.persistLexicon();
      }
    } catch (err) {
      this.seedLexicon();
    }
  }

  private persistOutbreaks(): void {
    try {
      fs.writeFileSync(this.outbreaksFile, JSON.stringify(this.outbreaks, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed saving outbreaks:', err);
    }
  }

  private persistFacilities(): void {
    try {
      fs.writeFileSync(this.facilitiesFile, JSON.stringify(this.facilities, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed saving facilities:', err);
    }
  }

  private persistLexicon(): void {
    try {
      fs.writeFileSync(this.lexiconFile, JSON.stringify(this.lexicon, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed saving lexicon:', err);
    }
  }

  private seedOutbreaks(): void {
    const today = new Date().toISOString().split('T')[0];
    this.outbreaks = [
      {
        id: 'OUT_CHOLERA_2025',
        diseaseNameAr: 'الكوليرا والإسهال المائي الحاد (AWD)',
        diseaseNameEn: 'Cholera & Acute Watery Diarrhea',
        category: 'WATERBORNE',
        governoratesAffected: ['صنعاء', 'الحديدة', 'حجة', 'تعز', 'إب', 'عمران'],
        alertLevel: 'CRITICAL',
        caseCountEstimated: 4280,
        reportedDate: today,
        transmissionModeAr: 'المياه الملوثة والأطعمة غير المطهوة ونقص الصرف الصحي',
        transmissionModeEn: 'Contaminated water sources, oral-fecal transmission',
        clinicalAdvisoryAr: 'فحص فوري لعلامات الجفاف الشديد (غور العينين، فقدان مرونة الجلد، النبض الخيطي). بدء محلول التروية الفموي (ORS) فوراً والتحويل لمراكز معالجة الإسهالات (DTC) مع حقن رينجر لاكتات الوريدي للحالات الشديدة.',
        clinicalAdvisoryEn: 'Immediate dehydration assessment. Initiate oral rehydration therapy (ORS) and IV Ringer Lactate in DTC centers.',
        emergencyProtocolAr: 'بروتوكول الطوارئ: Ringer Lactate 100ml/kg + زنك للأطفال + دوكسيسيكلين للبالغين.',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'OUT_DENGUE_2025',
        diseaseNameAr: 'حمى الضنك والنزفية الفيروسية',
        diseaseNameEn: 'Dengue Fever & Hemorrhagic Manifestations',
        category: 'VECTOR_BORNE',
        governoratesAffected: ['الحديدة', 'تعز', 'عدن', 'لحج', 'أبين'],
        alertLevel: 'HIGH',
        caseCountEstimated: 2150,
        reportedDate: today,
        transmissionModeAr: 'لسعات بعوض الزاعجة المصرية (Aedes aegypti) في المياه الراكدة',
        transmissionModeEn: 'Aedes aegypti mosquito vectors breeding in open water containers',
        clinicalAdvisoryAr: 'مراقبة هبوط الصفائح الدموية (Platelets < 100,000) وارتفاع الهيماتوكريت. تحذير صارم: يمنع استخدام الأسبرين والبروفين ومضادات الالتهاب غير الستيرويدية (NSAIDs) نهائياً لتفادي النزيف الداخلي الحاد؛ استخدم الباراسيتامول فقط.',
        clinicalAdvisoryEn: 'Strict prohibition of NSAIDs/Aspirin due to hemorrhage risk. Paracetamol is the safe analgesic of choice.',
        emergencyProtocolAr: 'فحص CBC يومي + محاليل وريدية متوازنة في حال هبوط الضغط وعلامات صدمة الضنك.',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'OUT_MALARIA_FALCIPARUM',
        diseaseNameAr: 'الملاريا المنجلية الحادة (Plasmodium Falciparum)',
        diseaseNameEn: 'Severe Falciparum Malaria',
        category: 'VECTOR_BORNE',
        governoratesAffected: ['الحديدة', 'حجة', 'المحويت', 'ريمة', 'لحج'],
        alertLevel: 'HIGH',
        caseCountEstimated: 3400,
        reportedDate: today,
        transmissionModeAr: 'لسعات بعوض الأنوفيلس (Anopheles)',
        transmissionModeEn: 'Anopheles mosquito bite transmission in coastal and valley areas',
        clinicalAdvisoryAr: 'فحص شريط الملاريا السريع (RDT) ومسحة الدم السميكة. استخدام خط العلاج الأول المعتمد وطنياً (Artesunate + Amodiaquine أو Artemether + Lumefantrine). التحويل الفوري للحالات الدماغية المصحوبة بغيبوبة أو تشنجات.',
        clinicalAdvisoryEn: 'First-line ACT therapy (Artesunate/Artemether combos). Rapid referral for cerebral malaria signs.',
        emergencyProtocolAr: 'أرتيسونات وريدي 2.4 ملغ/كغ عند الإدخال لملاريا الدماغ.',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'OUT_KHAT_CARDIO',
        diseaseNameAr: 'اعتلال القلب ومتلازمات التسمم الحاد بالقات (Cathinone Toxicity)',
        diseaseNameEn: 'Khat-Induced Acute Cardiovascular Toxicity & Hypertension Crisis',
        category: 'CHRONIC_EPIDEMIC',
        governoratesAffected: ['صنعاء', 'ذمار', 'عمران', 'صعدة', 'إب', 'تعز'],
        alertLevel: 'HIGH',
        caseCountEstimated: 1800,
        reportedDate: today,
        transmissionModeAr: 'تعاطي نبتة القات المحتوية على الكاثينون والكاثين والمبيدات الزراعية الفوسفورية',
        transmissionModeEn: 'Excessive khat chewing releasing sympathomimetic cathinone and residual organophosphates',
        clinicalAdvisoryAr: 'تسرع القلب الجيبي، نوبات ارتفاع ضغط الدم الانقباضي والانبساطي الحادة، زيادة استهلاك الأكسجين القلبي وخطر الاحتشاء التاجي (AMI)، قرحة المعدة الحادة، والأرق والذهان الحاد. يمنع إعطاء حاصرات بيتا النقية بمفردها لتجنب تفاقم التضيق الوعائي (Unopposed Alpha Stimulation).',
        clinicalAdvisoryEn: 'Sympathomimetic surge. Avoid un-opposed beta-blockade; use combined alpha/beta blockers or vasodilators and sedatives.',
        emergencyProtocolAr: 'إيكولوجيا: مراقبة ECG + نيتروجليسرين / ديازيبام للتخفيف من التوتر الوعائي الودي.',
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  private seedFacilities(): void {
    this.facilities = [
      {
        id: 'FAC_SNA_001',
        nameAr: 'مستشفى الثورة العام النموذجي',
        nameEn: 'Al-Thawra Modern General Hospital',
        governorateAr: 'صنعاء',
        governorateEn: 'Sana’a',
        cityAr: 'أمانة العاصمة',
        facilityType: 'TERTIARY_HOSPITAL',
        emergencyHotline: '01-246060',
        secondaryPhone: '01-246061',
        has24HourEmergency: true,
        hasOxygenSupply: true,
        hasIcuCapacity: true,
        hasBloodBank: true,
        ambulanceAvailable: true,
        addressAr: 'شارع تعز - صنعاء',
        operationalStatus: 'FULLY_OPERATIONAL',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'FAC_SNA_002',
        nameAr: 'مستشفى الكويت الجامعي',
        nameEn: 'Al-Kuwait University Hospital',
        governorateAr: 'صنعاء',
        governorateEn: 'Sana’a',
        cityAr: 'شارع الزراعة',
        facilityType: 'PUBLIC_HOSPITAL',
        emergencyHotline: '01-203001',
        has24HourEmergency: true,
        hasOxygenSupply: true,
        hasIcuCapacity: true,
        hasBloodBank: true,
        ambulanceAvailable: true,
        addressAr: 'شارع الزراعة - الدائري الغربي - صنعاء',
        operationalStatus: 'FULLY_OPERATIONAL',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'FAC_ADN_001',
        nameAr: 'هيئة مستشفى الجمهورية التعليمي',
        nameEn: 'Al-Jumhouria Teaching Hospital',
        governorateAr: 'عدن',
        governorateEn: 'Aden',
        cityAr: 'خور مكسر',
        facilityType: 'TERTIARY_HOSPITAL',
        emergencyHotline: '02-231122',
        has24HourEmergency: true,
        hasOxygenSupply: true,
        hasIcuCapacity: true,
        hasBloodBank: true,
        ambulanceAvailable: true,
        addressAr: 'ساحل خور مكسر - عدن',
        operationalStatus: 'FULLY_OPERATIONAL',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'FAC_TAZ_001',
        nameAr: 'مستشفى الثورة العام بتعز',
        nameEn: 'Al-Thawra General Hospital Taiz',
        governorateAr: 'تعز',
        governorateEn: 'Taiz',
        cityAr: 'تعز',
        facilityType: 'TERTIARY_HOSPITAL',
        emergencyHotline: '04-211550',
        has24HourEmergency: true,
        hasOxygenSupply: true,
        hasIcuCapacity: true,
        hasBloodBank: true,
        ambulanceAvailable: true,
        addressAr: 'حي الثورة - مدينة تعز',
        operationalStatus: 'LIMITED_CAPACITY',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'FAC_HOD_001',
        nameAr: 'مستشفى هيئة الثورة بالحديدة',
        nameEn: 'Al-Thawra Hospital Authority Hodeidah',
        governorateAr: 'الحديدة',
        governorateEn: 'Hodeidah',
        cityAr: 'الحديدة',
        facilityType: 'TERTIARY_HOSPITAL',
        emergencyHotline: '03-217800',
        has24HourEmergency: true,
        hasOxygenSupply: true,
        hasIcuCapacity: true,
        hasBloodBank: true,
        ambulanceAvailable: true,
        addressAr: 'شارع صنعاء - الكورنيش - الحديدة',
        operationalStatus: 'FULLY_OPERATIONAL',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'FAC_HOD_002',
        nameAr: 'مركز العزل ومعالجة الكوليرا والضنك المركزي',
        nameEn: 'Central DTC & Dengue Fever Treatment Center',
        governorateAr: 'الحديدة',
        governorateEn: 'Hodeidah',
        cityAr: 'الحديدة',
        facilityType: 'EMERGENCY_CENTER',
        emergencyHotline: '03-241233',
        has24HourEmergency: true,
        hasOxygenSupply: true,
        hasIcuCapacity: true,
        hasBloodBank: false,
        ambulanceAvailable: true,
        addressAr: 'حي 7 يوليو - الحديدة',
        operationalStatus: 'EMERGENCY_ONLY',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'FAC_MUK_001',
        nameAr: 'مستشفى ابن سينا العام بالمكلا',
        nameEn: 'Ibn Sina General Hospital Mukalla',
        governorateAr: 'حضرموت',
        governorateEn: 'Hadramout',
        cityAr: 'المكلا',
        facilityType: 'TERTIARY_HOSPITAL',
        emergencyHotline: '05-312011',
        has24HourEmergency: true,
        hasOxygenSupply: true,
        hasIcuCapacity: true,
        hasBloodBank: true,
        ambulanceAvailable: true,
        addressAr: 'المكلا - فوه - حضرموت',
        operationalStatus: 'FULLY_OPERATIONAL',
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  private seedLexicon(): void {
    this.lexicon = [
      {
        id: 'LEX_001',
        dialectPhraseAr: 'حريقة بالصدر أو المعدة',
        phoneticPronunciation: 'Hareeqah bel-sadr',
        region: 'PAN_YEMENI',
        standardArabicMeaning: 'حرقة الفؤاد وحموضة المعدة الحادة (ارتجاع مريئي)',
        medicalConceptEn: 'Heartburn / Gastroesophageal Reflux (GERD) / Dyspepsia',
        clinicalCategory: 'SYMPTOM',
        clinicalContextAr: 'شائعة جداً بعد جلسات تخزين القات والوجبات الدسمة؛ تتطلب التمييز عن ألم الذبحة الصدرية الإقفاري.',
        icd10Hint: 'K21.9',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'LEX_002',
        dialectPhraseAr: 'لويخة ولهاث مع ضيق نفس',
        phoneticPronunciation: 'Lwaykha wa luhat',
        region: 'SANAANI',
        standardArabicMeaning: 'دوخة مفاجئة وغثيان مع زلة تنفسية وتسارع ضربات القلب',
        medicalConceptEn: 'Presyncope / Dyspnea with Tachycardia',
        clinicalCategory: 'SYMPTOM',
        clinicalContextAr: 'تستدعي فحص العلامات الحيوية لاستبعاد هبوط الضغط، التسمم، أو نوبات الربو الحادة.',
        icd10Hint: 'R42 / R06.0',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'LEX_003',
        dialectPhraseAr: 'فتور وكسار بالعظام وسخونة تفوح',
        phoneticPronunciation: 'Futoor wa kussar bel-edham',
        region: 'ADENI',
        standardArabicMeaning: 'إعياء عام شديد، آلام مبرحة بالمفاصل والعضلات، وحمى متصاعدة',
        medicalConceptEn: 'Severe myalgia, arthralgia, and high pyrexia (Breakbone syndrome)',
        clinicalCategory: 'SYMPTOM',
        clinicalContextAr: 'العرض الكلاسيكي لحمى الضنك (Dengue) وشيكونغونيا؛ يمنع استخدام NSAIDs فوراً.',
        icd10Hint: 'A90',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'LEX_004',
        dialectPhraseAr: 'عصرة ومغص مقطع بالبطن',
        phoneticPronunciation: 'Asrah wa maghs mqatta',
        region: 'TAIZI',
        standardArabicMeaning: 'مغص معوي حاد تشنجي مع زحير وإسهال',
        medicalConceptEn: 'Severe abdominal colic / Tenesmus / Gastroenteritis',
        clinicalCategory: 'SYMPTOM',
        clinicalContextAr: 'يرتبط بنوبات الدوسنتاريا الأميبية أو عدوى الكوليرا المائية الأولية.',
        icd10Hint: 'A09',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'LEX_005',
        dialectPhraseAr: 'نغزات وضربة بالخاصرة',
        phoneticPronunciation: 'Naghzat bel-khasirah',
        region: 'HODIEDAH_TIHAMA',
        standardArabicMeaning: 'ألم حاد طاعن في الخاصرة المشع إلى أسفل البطن (مغص كلوي)',
        medicalConceptEn: 'Renal colic / Ureteric calculus',
        clinicalCategory: 'SYMPTOM',
        clinicalContextAr: 'شائع في المناطق الساحلية والحارة نتيجة الجفاف الشديد وقلة شرب السوائل.',
        icd10Hint: 'N23',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'LEX_006',
        dialectPhraseAr: 'طشاش بالعيون ودوار غاشي',
        phoneticPronunciation: 'Tashash bel-oyoon',
        region: 'PAN_YEMENI',
        standardArabicMeaning: 'تشوش الرؤية والدوار قبل الإغماء',
        medicalConceptEn: 'Blurred vision, pre-syncopal dizziness',
        clinicalCategory: 'SYMPTOM',
        clinicalContextAr: 'قد يعكس هبوط السكر الحاد، أزمة ارتفاع الضغط، أو الأنيميا الحادة.',
        icd10Hint: 'H53.8',
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  // --- CRUD for Outbreaks ---
  public getOutbreaks(): YemenOutbreakRecord[] {
    return this.outbreaks;
  }

  public getOutbreakById(id: string): YemenOutbreakRecord | undefined {
    return this.outbreaks.find(o => o.id === id);
  }

  public createOutbreak(data: Omit<YemenOutbreakRecord, 'id' | 'updatedAt'>): YemenOutbreakRecord {
    const id = 'OUT_' + Date.now().toString(36).toUpperCase();
    const newRecord: YemenOutbreakRecord = {
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.outbreaks.unshift(newRecord);
    this.persistOutbreaks();
    return newRecord;
  }

  public updateOutbreak(id: string, updates: Partial<Omit<YemenOutbreakRecord, 'id'>>): YemenOutbreakRecord | null {
    const item = this.getOutbreakById(id);
    if (!item) return null;
    Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    this.persistOutbreaks();
    return item;
  }

  public deleteOutbreak(id: string): boolean {
    const initialLen = this.outbreaks.length;
    this.outbreaks = this.outbreaks.filter(o => o.id !== id);
    this.persistOutbreaks();
    return this.outbreaks.length < initialLen;
  }

  // --- CRUD for Facilities ---
  public getFacilities(): YemenFacilityRecord[] {
    return this.facilities;
  }

  public getFacilityById(id: string): YemenFacilityRecord | undefined {
    return this.facilities.find(f => f.id === id);
  }

  public createFacility(data: Omit<YemenFacilityRecord, 'id' | 'updatedAt'>): YemenFacilityRecord {
    const id = 'FAC_' + Date.now().toString(36).toUpperCase();
    const newRecord: YemenFacilityRecord = {
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.facilities.unshift(newRecord);
    this.persistFacilities();
    return newRecord;
  }

  public updateFacility(id: string, updates: Partial<Omit<YemenFacilityRecord, 'id'>>): YemenFacilityRecord | null {
    const item = this.getFacilityById(id);
    if (!item) return null;
    Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    this.persistFacilities();
    return item;
  }

  public deleteFacility(id: string): boolean {
    const initialLen = this.facilities.length;
    this.facilities = this.facilities.filter(f => f.id !== id);
    this.persistFacilities();
    return this.facilities.length < initialLen;
  }

  // --- CRUD for Dialect Lexicon ---
  public getLexicon(): YemenDialectLexiconItem[] {
    return this.lexicon;
  }

  public createLexiconItem(data: Omit<YemenDialectLexiconItem, 'id' | 'updatedAt'>): YemenDialectLexiconItem {
    const id = 'LEX_' + Date.now().toString(36).toUpperCase();
    const newRecord: YemenDialectLexiconItem = {
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.lexicon.unshift(newRecord);
    this.persistLexicon();
    return newRecord;
  }

  public updateLexiconItem(id: string, updates: Partial<Omit<YemenDialectLexiconItem, 'id'>>): YemenDialectLexiconItem | null {
    const item = this.lexicon.find(l => l.id === id);
    if (!item) return null;
    Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    this.persistLexicon();
    return item;
  }

  public deleteLexiconItem(id: string): boolean {
    const initialLen = this.lexicon.length;
    this.lexicon = this.lexicon.filter(l => l.id !== id);
    this.persistLexicon();
    return this.lexicon.length < initialLen;
  }
}

export const yemenMdAdminStore = new YemenMdAdminStore();
