import { Router, Response } from 'express';
import { userDataStore } from '../db/userDataStore.js';
import {
  ProfileUpdateSchema,
  ConditionSchema,
  AllergySchema,
  MedicationSchema,
  SurgerySchema,
} from '../db/schema.js';
import { authenticateToken, AuthenticatedRequest } from '../auth/middleware.js';

export const healthRouter = Router();

// Ensure all routes in healthRouter are authenticated with strict data isolation
healthRouter.use(authenticateToken);

// 1. Aggregated User Dashboard
healthRouter.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const dashboard = userDataStore.getDashboardData(user);
    res.json(dashboard);
  } catch (error: any) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to load user health dashboard' });
  }
});

// 2. Personal Information (Profile)
healthRouter.get('/profile', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const profile = userDataStore.getProfile(user, user.id);
    res.json(profile);
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

healthRouter.put('/profile', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parseResult = ProfileUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten(),
        messageAr: 'يرجى مراجعة وتصحيح القيم المدخلة للملف الصحي',
      });
    }

    const updated = userDataStore.updateProfile(user, user.id, parseResult.data);
    res.json({
      message: 'Profile updated successfully',
      messageAr: 'تم حفظ وتحديث المعلومات الشخصية بنجاح',
      profile: updated,
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

// 3. Medical Conditions (الأمراض والحالات الصحية)
healthRouter.get('/conditions', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const conditions = userDataStore.getConditions(user, user.id);
    res.json(conditions);
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

healthRouter.post('/conditions', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parseResult = ConditionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten(),
        messageAr: 'يرجى إدخال اسم الحالة وسنة التشخيص بصورة صحيحة',
      });
    }

    const condition = userDataStore.addCondition(user, user.id, parseResult.data);
    res.status(201).json({
      message: 'Condition recorded',
      messageAr: 'تمت إضافة الحالة الصحية للملف الطبي بنجاح',
      condition,
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

healthRouter.delete('/conditions/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const deleted = userDataStore.deleteCondition(user, user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Condition not found or unauthorized' });
    }
    res.json({
      message: 'Condition removed',
      messageAr: 'تم حذف الحالة الصحية من الملف',
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

// 4. Allergies (الحساسية)
healthRouter.get('/allergies', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const allergies = userDataStore.getAllergies(user, user.id);
    res.json(allergies);
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

healthRouter.post('/allergies', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parseResult = AllergySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten(),
        messageAr: 'يرجى إدخال مسبب الحساسية ورد الفعل ودرجة الخطورة',
      });
    }

    const allergy = userDataStore.addAllergy(user, user.id, parseResult.data);
    res.status(201).json({
      message: 'Allergy recorded',
      messageAr: 'تم توثيق الحساسية في ملف الأمان الدوائي والغذائي',
      allergy,
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

healthRouter.delete('/allergies/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const deleted = userDataStore.deleteAllergy(user, user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Allergy not found or unauthorized' });
    }
    res.json({
      message: 'Allergy removed',
      messageAr: 'تم حذف سجل الحساسية من الملف',
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

// 5. Medications (الأدوية الحالية)
healthRouter.get('/medications', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const medications = userDataStore.getMedications(user, user.id);
    res.json(medications);
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

healthRouter.post('/medications', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parseResult = MedicationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten(),
        messageAr: 'يرجى إدخال اسم الدواء والجرعة والتكرار',
      });
    }

    const medication = userDataStore.addMedication(user, user.id, parseResult.data);
    res.status(201).json({
      message: 'Medication added',
      messageAr: 'تم تسجيل الدواء بنجاح في ملف العلاجات الحالية',
      medication,
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

healthRouter.delete('/medications/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const deleted = userDataStore.deleteMedication(user, user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Medication not found or unauthorized' });
    }
    res.json({
      message: 'Medication removed',
      messageAr: 'تمت إزالة الدواء من السجل الطبي',
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

// 6. Surgeries (العمليات السابقة)
healthRouter.get('/surgeries', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const surgeries = userDataStore.getSurgeries(user, user.id);
    res.json(surgeries);
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

healthRouter.post('/surgeries', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parseResult = SurgerySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten(),
        messageAr: 'يرجى إدخال اسم العملية الجراحية وسنة إجرائها',
      });
    }

    const surgery = userDataStore.addSurgery(user, user.id, parseResult.data);
    res.status(201).json({
      message: 'Surgery recorded',
      messageAr: 'تم توثيق العملية الجراحية في التاريخ الجراحي',
      surgery,
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

healthRouter.delete('/surgeries/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const deleted = userDataStore.deleteSurgery(user, user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Surgery not found or unauthorized' });
    }
    res.json({
      message: 'Surgery removed',
      messageAr: 'تم حذف سجل العملية الجراحية من التاريخ الطبي',
    });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});

// 7. Past Consultations / Encounters
healthRouter.get('/consultations', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const consultations = userDataStore.getConsultations(user, user.id);
    res.json(consultations);
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Access denied' });
  }
});
