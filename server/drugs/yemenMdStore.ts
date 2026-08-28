/**
 * YemenMD Local Market Pharmaceutical Registry Module
 * 
 * Separate Module & Database Store:
 * Required Fields:
 * - GenericName
 * - BrandName
 * - Strength
 * - DosageForm
 * - Manufacturer
 * - Country
 * - Availability
 * - LastUpdated
 * 
 * Architectural Rule:
 * Strictly separates local market distribution, pricing, and availability
 * from Global Drug Knowledge (pharmacology & clinical rules).
 */

import fs from 'fs';
import path from 'path';
import { YemenMdRecord, YemenMdAvailability } from './types.js';

export class YemenMdStore {
  private dataDir: string;
  private dbFile: string;
  private records: YemenMdRecord[] = [];

  constructor() {
    this.dataDir = path.join(process.cwd(), 'server', 'data');
    this.dbFile = path.join(this.dataDir, 'yemenmd_registry.json');
    this.initializeStore();
  }

  private initializeStore() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dbFile)) {
        const content = fs.readFileSync(this.dbFile, 'utf-8');
        this.records = JSON.parse(content);
      } else {
        this.seedInitialYemenData();
        this.saveToFile();
      }
    } catch (err) {
      console.warn('[YemenMD] Warning loading registry, seeding in-memory:', err);
      this.seedInitialYemenData();
    }
  }

  private saveToFile() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.dbFile, JSON.stringify(this.records, null, 2), 'utf-8');
    } catch (err) {
      console.error('[YemenMD] Failed to write registry file:', err);
    }
  }

  private seedInitialYemenData() {
    const today = '2025-01-10';

    this.records = [
      // 1. Shaphaco (Local Domestic Producer - Sana'a)
      {
        id: 'YMD_SHP_001',
        GenericName: 'Paracetamol',
        BrandName: 'Febradol',
        Strength: '500 mg',
        DosageForm: 'Tablet',
        Manufacturer: 'Shaphaco Pharmaceutical Industry',
        Country: 'Yemen',
        Availability: 'AVAILABLE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-2018-0412',
        estimatedPriceYer: 1200,
        localDistributor: 'Shaphaco Distribution Network (Sana’a, Aden, Taiz, Hodeidah)',
        storageNotesAr: 'يحفظ في درجة حرارة دون 25 مئوية في مكان جاف بعيداً عن الرطوبة وأشعة الشمس.',
        notesAr: 'منتج وطني يمني واسع الانتشار، يتوفر في كافة الصيدليات والمراكز الصحية.',
      },
      {
        id: 'YMD_SHP_002',
        GenericName: 'Amoxicillin and Clavulanate Potassium',
        BrandName: 'Amoclan',
        Strength: '625 mg',
        DosageForm: 'Film-Coated Tablet',
        Manufacturer: 'Shaphaco Pharmaceutical Industry',
        Country: 'Yemen',
        Availability: 'AVAILABLE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-2019-0881',
        estimatedPriceYer: 4500,
        localDistributor: 'Shaphaco Distribution Network',
        storageNotesAr: 'يحفظ في عبوته الأصلية المغلقة بإحكام تحت 25 درجة مئوية.',
        notesAr: 'مضاد حيوي واسع الطيف، متوفر بتركيزات 625 ملغ و 1000 ملغ للأطفال والكبار.',
      },
      {
        id: 'YMD_SHP_003',
        GenericName: 'Ibuprofen',
        BrandName: 'Doloraz',
        Strength: '400 mg',
        DosageForm: 'Tablet',
        Manufacturer: 'Shaphaco Pharmaceutical Industry',
        Country: 'Yemen',
        Availability: 'AVAILABLE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-2020-0115',
        estimatedPriceYer: 1800,
        localDistributor: 'Shaphaco Distribution Network',
        storageNotesAr: 'يحفظ في مكان بارد وجاف.',
        notesAr: 'مسكن ومضاد التهاب غير ستيرويدي محلي الصنع.',
      },
      {
        id: 'YMD_SHP_004',
        GenericName: 'Atorvastatin',
        BrandName: 'Atorva',
        Strength: '20 mg',
        DosageForm: 'Tablet',
        Manufacturer: 'Shaphaco Pharmaceutical Industry',
        Country: 'Yemen',
        Availability: 'AVAILABLE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-2021-0309',
        estimatedPriceYer: 3200,
        localDistributor: 'Shaphaco Distribution Network',
        storageNotesAr: 'يحفظ دون 30 مئوية بعيداً عن الضوء.',
        notesAr: 'خافض للكوليسترول بديل وطني عالي الجودة للعلامات المستوردة.',
      },

      // 2. Modern Pharma / HSA Group (Local Domestic Producer - Sana'a / Taiz)
      {
        id: 'YMD_MP_001',
        GenericName: 'Metformin hydrochloride',
        BrandName: 'Formin',
        Strength: '500 mg',
        DosageForm: 'Tablet',
        Manufacturer: 'Modern Pharma (HSA Group)',
        Country: 'Yemen',
        Availability: 'AVAILABLE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-2017-0624',
        estimatedPriceYer: 1500,
        localDistributor: 'Natco Pharma / HSA Trading Distribution',
        storageNotesAr: 'يحفظ في مكان جاف بدرجة حرارة الغرفة.',
        notesAr: 'متوفر بعبوات 30 و 100 قرص لمرضى السكري المزمن.',
      },
      {
        id: 'YMD_MP_002',
        GenericName: 'Ciprofloxacin',
        BrandName: 'Ciproxin MP',
        Strength: '500 mg',
        DosageForm: 'Tablet',
        Manufacturer: 'Modern Pharma (HSA Group)',
        Country: 'Yemen',
        Availability: 'AVAILABLE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-2019-0552',
        estimatedPriceYer: 2800,
        localDistributor: 'Natco Pharma / HSA Trading Distribution',
        storageNotesAr: 'يحفظ بعيداً عن الضوء المباشر.',
        notesAr: 'مضاد حيوي فلوروكينولون لعلاج التهابات المسالك البولية والجهاز الهضمي.',
      },
      {
        id: 'YMD_MP_003',
        GenericName: 'Furosemide',
        BrandName: 'Frusid',
        Strength: '40 mg',
        DosageForm: 'Tablet',
        Manufacturer: 'Modern Pharma (HSA Group)',
        Country: 'Yemen',
        Availability: 'AVAILABLE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-2018-0901',
        estimatedPriceYer: 1100,
        localDistributor: 'Natco Pharma / HSA Trading Distribution',
        storageNotesAr: 'يحفظ في عبوة محكمة الإغلاق.',
        notesAr: 'مدر للبول عروي أساسي لمرضى قصور القلب وارتفاع ضغط الدم.',
      },

      // 3. Yadico Pharma (Yemeni Co. for Industry & Trade - Sana'a)
      {
        id: 'YMD_YAD_001',
        GenericName: 'Omeprazole',
        BrandName: 'Gastrozol',
        Strength: '20 mg',
        DosageForm: 'Delayed-Release Capsule',
        Manufacturer: 'Yadico Pharmaceutical Co.',
        Country: 'Yemen',
        Availability: 'AVAILABLE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-2020-0441',
        estimatedPriceYer: 2600,
        localDistributor: 'Yadico Central Agencies',
        storageNotesAr: 'كبسولات معوية مقاومة لأحماض المعدة، تحفظ بعيداً عن الرطوبة.',
        notesAr: 'مثبط لمضخة البروتون لعلاج الحموضة وقرحة المعدة والارتجاع المريئي.',
      },
      {
        id: 'YMD_YAD_002',
        GenericName: 'Paracetamol',
        BrandName: 'Yadidol Junior',
        Strength: '120 mg / 5 mL',
        DosageForm: 'Oral Suspension',
        Manufacturer: 'Yadico Pharmaceutical Co.',
        Country: 'Yemen',
        Availability: 'AVAILABLE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-2019-0122',
        estimatedPriceYer: 900,
        localDistributor: 'Yadico Central Agencies',
        storageNotesAr: 'يرج جيداً قبل الاستعمال، يحفظ في درجة حرارة دون 25 مئوية.',
        notesAr: 'شراب خافض للحرارة ومسكن مخصص للرضع والأطفال بنكهة الفواكه.',
      },

      // 4. Imported & Regional Brand Medications in Yemeni Formulary
      {
        id: 'YMD_IMP_001',
        GenericName: 'Atorvastatin',
        BrandName: 'Lipitor',
        Strength: '20 mg',
        DosageForm: 'Film-Coated Tablet',
        Manufacturer: 'Pfizer Pharmaceuticals',
        Country: 'Ireland / USA (Imported)',
        Availability: 'SCARCE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-IMP-2015-1102',
        estimatedPriceYer: 14500,
        localDistributor: 'Al-Mamoon Medical Agencies',
        storageNotesAr: 'يحفظ في درجة حرارة بين 15 و 25 درجة مئوية.',
        notesAr: 'العلامة المرجعية العالمية المبتكرة، تخضع لتقلبات سلاسل الإمداد والاستيراد.',
      },
      {
        id: 'YMD_IMP_002',
        GenericName: 'Metformin hydrochloride',
        BrandName: 'Glucophage',
        Strength: '500 mg',
        DosageForm: 'Film-Coated Tablet',
        Manufacturer: 'Merck Santé S.A.S.',
        Country: 'France (Imported)',
        Availability: 'AVAILABLE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-IMP-2014-0819',
        estimatedPriceYer: 4200,
        localDistributor: 'Universal Medical Supplies (Aden / Sana’a)',
        storageNotesAr: 'يحفظ في مكان جاف.',
        notesAr: 'المستحضر المرجعي لشركة ميرك، متوفر بانتظام في الصيدليات الكبرى.',
      },
      {
        id: 'YMD_IMP_003',
        GenericName: 'Amoxicillin and Clavulanate Potassium',
        BrandName: 'Augmentin',
        Strength: '1 g (1000 mg)',
        DosageForm: 'Film-Coated Tablet',
        Manufacturer: 'GlaxoSmithKline (GSK)',
        Country: 'United Kingdom / Egypt (Imported)',
        Availability: 'AVAILABLE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-IMP-2013-0501',
        estimatedPriceYer: 8500,
        localDistributor: 'Middle East Medical Agencies',
        storageNotesAr: 'عبوة مغلفة بفويل ألمنيوم مزدوج لحماية الدواء من الرطوبة العالية.',
        notesAr: 'أوجمنتين الأصلي البريطاني المسجل لدى وزارة الصحة العامة والسكان.',
      },
      {
        id: 'YMD_IMP_004',
        GenericName: 'Warfarin sodium',
        BrandName: 'Marevan / Coumadin',
        Strength: '5 mg',
        DosageForm: 'Scored Tablet',
        Manufacturer: 'Aspen Pharmacare / Orion Pharma',
        Country: 'United Kingdom / South Africa (Imported)',
        Availability: 'SCARCE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-IMP-2016-0129',
        estimatedPriceYer: 7200,
        localDistributor: 'Yemen Medical Supply Depot',
        storageNotesAr: 'يحفظ بعيداً عن الضوء والرطوبة، قرص قابل للكسر لتسهيل معايرة الجرعة.',
        notesAr: 'شحيح في بعض الفترات؛ متوفر في مراكز القلب والمستشفيات التخصصية.',
      },
      {
        id: 'YMD_IMP_005',
        GenericName: 'Clopidogrel',
        BrandName: 'Plavix',
        Strength: '75 mg',
        DosageForm: 'Film-Coated Tablet',
        Manufacturer: 'Sanofi Winthrop Industrie',
        Country: 'France (Imported)',
        Availability: 'SCARCE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-IMP-2014-0994',
        estimatedPriceYer: 18000,
        localDistributor: 'Yemen French Medical Agencies',
        storageNotesAr: 'يحفظ دون 30 درجة مئوية.',
        notesAr: 'مستحضر أصلي لمانع تجلط الصفائح، تتوفر له بدائل محلية وإقليمية أرخص سعراً.',
      },
      {
        id: 'YMD_IMP_006',
        GenericName: 'Tramadol hydrochloride',
        BrandName: 'Tramal',
        Strength: '50 mg',
        DosageForm: 'Capsule / Ampoule for Injection',
        Manufacturer: 'Grünenthal GmbH',
        Country: 'Germany (Imported)',
        Availability: 'HOSPITAL_RESTRICTED',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-CTRL-2012-0018',
        estimatedPriceYer: 5500,
        localDistributor: 'Supreme Board of Drugs and Medical Appliances (SBDMA)',
        storageNotesAr: 'دواء مراقب ومقيد أمنياً (خاضع للرقابة الدوائية الصارمة في المستشفيات فقط).',
        notesAr: 'محظور صرفه في صيدليات المجتمع دون وصفة جدول مخدرات موثقة ومختومة من استشاري.',
      },
      {
        id: 'YMD_IMP_007',
        GenericName: 'Furosemide',
        BrandName: 'Lasix',
        Strength: '40 mg',
        DosageForm: 'Scored Tablet',
        Manufacturer: 'Sanofi Aventis',
        Country: 'Germany / Egypt (Imported)',
        Availability: 'AVAILABLE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-IMP-2011-0422',
        estimatedPriceYer: 2100,
        localDistributor: 'Al-Wadi Medical Supplies',
        storageNotesAr: 'يحفظ بعيداً عن الرطوبة.',
        notesAr: 'لازكس الأصلي متوفر بانتظام.',
      },
      {
        id: 'YMD_IMP_008',
        GenericName: 'Escitalopram',
        BrandName: 'Cipralex',
        Strength: '10 mg',
        DosageForm: 'Film-Coated Tablet',
        Manufacturer: 'H. Lundbeck A/S',
        Country: 'Denmark (Imported)',
        Availability: 'SCARCE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-IMP-2017-0773',
        estimatedPriceYer: 16500,
        localDistributor: 'Arab Medical Trading Co.',
        storageNotesAr: 'يحفظ في درجة حرارة الغرفة دون 25 مئوية.',
        notesAr: 'مستحضر لوندبيك الدنماركي، قد تنقطع سلاسل إمداده دورياً وتتوفر له بدائل هندية وأردنية.',
      },
      {
        id: 'YMD_IMP_009',
        GenericName: 'Lisinopril',
        BrandName: 'Zestril',
        Strength: '10 mg',
        DosageForm: 'Tablet',
        Manufacturer: 'AstraZeneca UK Limited',
        Country: 'United Kingdom (Imported)',
        Availability: 'SCARCE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-IMP-2013-0318',
        estimatedPriceYer: 9500,
        localDistributor: 'Ibn Sina Agencies',
        storageNotesAr: 'يحفظ في مكان جاف.',
        notesAr: 'زيستريل الأصلي البريطاني.',
      },
      {
        id: 'YMD_IMP_010',
        GenericName: 'Spironolactone',
        BrandName: 'Aldactone',
        Strength: '25 mg',
        DosageForm: 'Film-Coated Tablet',
        Manufacturer: 'Pfizer / Searle',
        Country: 'United States (Imported)',
        Availability: 'AVAILABLE',
        LastUpdated: today,
        registrationNumber: 'YEM-MOPHP-IMP-2015-0811',
        estimatedPriceYer: 6800,
        localDistributor: 'Al-Mamoon Medical Agencies',
        storageNotesAr: 'يحفظ دون 25 مئوية.',
        notesAr: 'مدر البول الحافظ للبوتاسيوم، متوفر بتركيزات 25 و 100 ملغ.',
      },
    ];
  }

  public getAllDrugs(): YemenMdRecord[] {
    return this.records;
  }

  public search(
    query: string,
    filters?: {
      availability?: YemenMdAvailability;
      manufacturer?: string;
      country?: string;
      dosageForm?: string;
    }
  ): YemenMdRecord[] {
    const q = (query || '').trim().toLowerCase();

    return this.records.filter(item => {
      // Query search on GenericName, BrandName, Manufacturer, Country, DosageForm
      const matchesQuery =
        !q ||
        item.GenericName.toLowerCase().includes(q) ||
        item.BrandName.toLowerCase().includes(q) ||
        item.Manufacturer.toLowerCase().includes(q) ||
        item.Country.toLowerCase().includes(q) ||
        item.DosageForm.toLowerCase().includes(q) ||
        item.Strength.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      // Apply Filters
      if (filters?.availability && item.Availability !== filters.availability) {
        return false;
      }
      if (filters?.manufacturer && !item.Manufacturer.toLowerCase().includes(filters.manufacturer.toLowerCase())) {
        return false;
      }
      if (filters?.country && !item.Country.toLowerCase().includes(filters.country.toLowerCase())) {
        return false;
      }
      if (filters?.dosageForm && !item.DosageForm.toLowerCase().includes(filters.dosageForm.toLowerCase())) {
        return false;
      }

      return true;
    });
  }

  public getById(id: string): YemenMdRecord | null {
    return this.records.find(r => r.id.toLowerCase() === id.toLowerCase()) || null;
  }

  public getByGeneric(genericName: string): YemenMdRecord[] {
    const q = genericName.trim().toLowerCase();
    return this.records.filter(
      r => r.GenericName.toLowerCase().includes(q) || q.includes(r.GenericName.toLowerCase())
    );
  }

  public getManufacturers(): string[] {
    const set = new Set(this.records.map(r => r.Manufacturer));
    return Array.from(set).sort();
  }

  public getCountries(): string[] {
    const set = new Set(this.records.map(r => r.Country));
    return Array.from(set).sort();
  }

  public getDosageForms(): string[] {
    const set = new Set(this.records.map(r => r.DosageForm));
    return Array.from(set).sort();
  }

  public getStatistics() {
    const total = this.records.length;
    const available = this.records.filter(r => r.Availability === 'AVAILABLE').length;
    const scarce = this.records.filter(r => r.Availability === 'SCARCE').length;
    const hospitalRestricted = this.records.filter(r => r.Availability === 'HOSPITAL_RESTRICTED').length;
    const discontinued = this.records.filter(r => r.Availability === 'DISCONTINUED').length;
    const domestic = this.records.filter(r => r.Country === 'Yemen').length;
    const imported = total - domestic;

    return {
      totalProducts: total,
      domesticManufacturedCount: domestic,
      importedCount: imported,
      domesticPercentage: total > 0 ? Math.round((domestic / total) * 100) : 0,
      availabilityBreakdown: {
        AVAILABLE: available,
        SCARCE: scarce,
        HOSPITAL_RESTRICTED: hospitalRestricted,
        DISCONTINUED: discontinued,
      },
      lastUpdated: this.records[0]?.LastUpdated || '2025-01-10',
    };
  }

  public addDrug(drug: Omit<YemenMdRecord, 'id' | 'LastUpdated'>): YemenMdRecord {
    const newRecord: YemenMdRecord = {
      ...drug,
      id: `YMD_CUSTOM_${Date.now()}`,
      LastUpdated: new Date().toISOString().split('T')[0],
    };
    this.records.push(newRecord);
    this.saveToFile();
    return newRecord;
  }
}

// Singleton Instance
export const yemenMdStore = new YemenMdStore();
