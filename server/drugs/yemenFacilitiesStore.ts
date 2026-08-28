/**
 * YemenMD Healthcare Facilities & Endemic Surveillance Store
 * Phase 9 — Administration Module
 */

import fs from 'fs';
import path from 'path';

export interface YemenFacility {
  id: string;
  nameAr: string;
  nameEn: string;
  governorate: 'Sanaa' | 'Aden' | 'Taiz' | 'Hodeidah' | 'Ibb' | 'Hadramout' | 'Dhamar' | 'Marib';
  type: 'PUBLIC_HOSPITAL' | 'PRIVATE_HOSPITAL' | 'EMERGENCY_CENTER' | 'SPECIALIZED_CLINIC';
  emergencyHotline: string;
  oxygenAvailable: boolean;
  icuBedsAvailable: number;
  coldChainVaccineStorage: boolean;
  operationalStatus: 'OPERATIONAL' | 'LIMITED_CAPACITY' | 'CRITICAL_SHORTAGE';
  addressAr: string;
  lastVerified: string;
}

export interface YemenEndemicAlert {
  id: string;
  diseaseNameAr: string;
  diseaseNameEn: string;
  category: 'CHOLERA' | 'DENGUE_FEVER' | 'MALARIA' | 'DIPHTHERIA' | 'MALNUTRITION' | 'OTHER';
  affectedGovernorates: string[];
  severity: 'CRITICAL_OUTBREAK' | 'HIGH_TRANSMISSION' | 'MODERATE_WATCH' | 'CONTAINED';
  guidelineSummaryAr: string;
  reportedCasesThisWeek: number;
  reportedDeathsThisWeek: number;
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const FACILITIES_FILE = path.join(DATA_DIR, 'yemen_facilities.json');
const ENDEMICS_FILE = path.join(DATA_DIR, 'yemen_endemics.json');

export class YemenFacilitiesStore {
  private facilities: YemenFacility[] = [];
  private endemicAlerts: YemenEndemicAlert[] = [];

  constructor() {
    this.ensureDirectory();
    this.loadData();
  }

  private ensureDirectory(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[YemenFacilitiesStore] Failed to initialize directory:', err);
    }
  }

  private loadData(): void {
    try {
      if (fs.existsSync(FACILITIES_FILE)) {
        this.facilities = JSON.parse(fs.readFileSync(FACILITIES_FILE, 'utf-8'));
      } else {
        this.seedInitialFacilities();
        this.saveFacilities();
      }

      if (fs.existsSync(ENDEMICS_FILE)) {
        this.endemicAlerts = JSON.parse(fs.readFileSync(ENDEMICS_FILE, 'utf-8'));
      } else {
        this.seedInitialEndemics();
        this.saveEndemics();
      }
    } catch (err) {
      console.warn('[YemenFacilitiesStore] Error loading data, using seeds:', err);
      this.seedInitialFacilities();
      this.seedInitialEndemics();
    }
  }

  private saveFacilities(): void {
    try {
      this.ensureDirectory();
      fs.writeFileSync(FACILITIES_FILE, JSON.stringify(this.facilities, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[YemenFacilitiesStore] Failed to save facilities:', err);
    }
  }

  private saveEndemics(): void {
    try {
      this.ensureDirectory();
      fs.writeFileSync(ENDEMICS_FILE, JSON.stringify(this.endemicAlerts, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[YemenFacilitiesStore] Failed to save endemics:', err);
    }
  }

  private seedInitialFacilities(): void {
    this.facilities = [
      {
        id: 'FAC_SAN_001',
        nameAr: 'مستشفى الثورة العام النموذجي - صنعاء',
        nameEn: 'Al-Thawra Modern General Hospital - Sana\'a',
        governorate: 'Sanaa',
        type: 'PUBLIC_HOSPITAL',
        emergencyHotline: '+967 1 246966',
        oxygenAvailable: true,
        icuBedsAvailable: 14,
        coldChainVaccineStorage: true,
        operationalStatus: 'OPERATIONAL',
        addressAr: 'شارع الزبيري، صنعاء',
        lastVerified: '2025-01-15',
      },
      {
        id: 'FAC_SAN_002',
        nameAr: 'مستشفى الكويت الجامعي - صنعاء',
        nameEn: 'Al-Kuwait University Hospital - Sana\'a',
        governorate: 'Sanaa',
        type: 'PUBLIC_HOSPITAL',
        emergencyHotline: '+967 1 203020',
        oxygenAvailable: true,
        icuBedsAvailable: 8,
        coldChainVaccineStorage: true,
        operationalStatus: 'LIMITED_CAPACITY',
        addressAr: 'مذبح، شارع الستين الغربي، صنعاء',
        lastVerified: '2025-01-14',
      },
      {
        id: 'FAC_ADN_003',
        nameAr: 'هيئة مستشفى الجمهورية التعليمي - عدن',
        nameEn: 'Al-Jumhouriya Teaching Hospital Authority - Aden',
        governorate: 'Aden',
        type: 'PUBLIC_HOSPITAL',
        emergencyHotline: '+967 2 232014',
        oxygenAvailable: true,
        icuBedsAvailable: 10,
        coldChainVaccineStorage: true,
        operationalStatus: 'OPERATIONAL',
        addressAr: 'خور مكسر، عدن',
        lastVerified: '2025-01-16',
      },
      {
        id: 'FAC_TAZ_004',
        nameAr: 'هيئة مستشفى الثورة العام - تعز',
        nameEn: 'Al-Thawra General Hospital Authority - Taiz',
        governorate: 'Taiz',
        type: 'PUBLIC_HOSPITAL',
        emergencyHotline: '+967 4 220055',
        oxygenAvailable: true,
        icuBedsAvailable: 4,
        coldChainVaccineStorage: true,
        operationalStatus: 'LIMITED_CAPACITY',
        addressAr: 'حوض الأشراف، تعز',
        lastVerified: '2025-01-12',
      },
      {
        id: 'FAC_HOD_005',
        nameAr: 'هيئة مستشفى الثورة - الحديدة',
        nameEn: 'Al-Thawra Hospital Authority - Hodeidah',
        governorate: 'Hodeidah',
        type: 'PUBLIC_HOSPITAL',
        emergencyHotline: '+967 3 211012',
        oxygenAvailable: true,
        icuBedsAvailable: 6,
        coldChainVaccineStorage: true,
        operationalStatus: 'LIMITED_CAPACITY',
        addressAr: 'شارع صنعاء، الحديدة',
        lastVerified: '2025-01-10',
      },
      {
        id: 'FAC_HAD_006',
        nameAr: 'هيئة مستشفى ابن سينا العام - المكلا',
        nameEn: 'Ibn Sina General Hospital Authority - Mukalla',
        governorate: 'Hadramout',
        type: 'PUBLIC_HOSPITAL',
        emergencyHotline: '+967 5 361555',
        oxygenAvailable: true,
        icuBedsAvailable: 12,
        coldChainVaccineStorage: true,
        operationalStatus: 'OPERATIONAL',
        addressAr: 'فوة، المكلا، حضرموت',
        lastVerified: '2025-01-15',
      },
    ];
  }

  private seedInitialEndemics(): void {
    this.endemicAlerts = [
      {
        id: 'END_CHOL_01',
        diseaseNameAr: 'الكوليرا والإسهالات المائية الحادة (AWD)',
        diseaseNameEn: 'Cholera & Acute Watery Diarrhea Outbreak Surveillance',
        category: 'CHOLERA',
        affectedGovernorates: ['Sanaa', 'Hodeidah', 'Taiz', 'Dhamar', 'Ibb'],
        severity: 'CRITICAL_OUTBREAK',
        guidelineSummaryAr: 'تطبيق بروتوكول الإماهة الفموية السريعة (ORS) ومحاليل رينجر لاكتات الوريدية للحالات الشديدة، مع عزل الحالات والإبلاغ الفوري.',
        reportedCasesThisWeek: 412,
        reportedDeathsThisWeek: 3,
        lastUpdated: '2025-01-18',
      },
      {
        id: 'END_DENG_02',
        diseaseNameAr: 'حمى الضنك والحميات النزفية (Dengue Fever)',
        diseaseNameEn: 'Dengue Fever Epidemic Surveillance',
        category: 'DENGUE_FEVER',
        affectedGovernorates: ['Aden', 'Taiz', 'Hodeidah', 'Hadramout'],
        severity: 'HIGH_TRANSMISSION',
        guidelineSummaryAr: 'منع استخدام مضادات الالتهاب غير الستيرويدية (NSAIDs) كالأسبرين والبروفين لتجنب النزف. استخدام الباراسيتامول فقط ومراقبة الصفائح الدموية والهيماتوكريت.',
        reportedCasesThisWeek: 285,
        reportedDeathsThisWeek: 1,
        lastUpdated: '2025-01-17',
      },
      {
        id: 'END_MAL_03',
        diseaseNameAr: 'الملاريا المنجلية (Falciparum Malaria)',
        diseaseNameEn: 'Plasmodium Falciparum Malaria',
        category: 'MALARIA',
        affectedGovernorates: ['Hodeidah', 'Taiz', 'Marib'],
        severity: 'MODERATE_WATCH',
        guidelineSummaryAr: 'اعتماد علاجات الخط الأول المركبة القائمة على مادة الأرتيميسينين (Artemether + Lumefantrine) مع الفحص المجهري أو اختبار التشخيص السريع (RDT).',
        reportedCasesThisWeek: 164,
        reportedDeathsThisWeek: 0,
        lastUpdated: '2025-01-16',
      },
    ];
  }

  // Facility Management
  public getAllFacilities(): YemenFacility[] {
    return this.facilities;
  }

  public addFacility(facility: Omit<YemenFacility, 'id' | 'lastVerified'>): YemenFacility {
    const newFacility: YemenFacility = {
      ...facility,
      id: `FAC_${facility.governorate.substring(0, 3).toUpperCase()}_${Date.now().toString(36)}`,
      lastVerified: new Date().toISOString().split('T')[0],
    };
    this.facilities.push(newFacility);
    this.saveFacilities();
    return newFacility;
  }

  public updateFacility(id: string, updates: Partial<Omit<YemenFacility, 'id'>>): YemenFacility | null {
    const facility = this.facilities.find((f) => f.id === id);
    if (!facility) return null;
    Object.assign(facility, updates, { lastVerified: new Date().toISOString().split('T')[0] });
    this.saveFacilities();
    return facility;
  }

  public deleteFacility(id: string): boolean {
    const initialLen = this.facilities.length;
    this.facilities = this.facilities.filter((f) => f.id !== id);
    this.saveFacilities();
    return this.facilities.length < initialLen;
  }

  // Endemic Alerts Management
  public getAllEndemics(): YemenEndemicAlert[] {
    return this.endemicAlerts;
  }

  public addEndemicAlert(alert: Omit<YemenEndemicAlert, 'id' | 'lastUpdated'>): YemenEndemicAlert {
    const newAlert: YemenEndemicAlert = {
      ...alert,
      id: `END_${alert.category.substring(0, 4)}_${Date.now().toString(36)}`,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    this.endemicAlerts.push(newAlert);
    this.saveEndemics();
    return newAlert;
  }

  public updateEndemicAlert(id: string, updates: Partial<Omit<YemenEndemicAlert, 'id'>>): YemenEndemicAlert | null {
    const alert = this.endemicAlerts.find((a) => a.id === id);
    if (!alert) return null;
    Object.assign(alert, updates, { lastUpdated: new Date().toISOString().split('T')[0] });
    this.saveEndemics();
    return alert;
  }

  public deleteEndemicAlert(id: string): boolean {
    const initialLen = this.endemicAlerts.length;
    this.endemicAlerts = this.endemicAlerts.filter((a) => a.id !== id);
    this.saveEndemics();
    return this.endemicAlerts.length < initialLen;
  }
}

export const yemenFacilitiesStore = new YemenFacilitiesStore();
