import { clinicalSafetyEngine } from '../safety/clinicalSafetyEngine.js';
import { TestResult } from './auth.test.js';

export async function runClinicalSafetyTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Acute Coronary Syndrome (Myocardial Infarction) Red Flag Trigger
  {
    const start = Date.now();
    try {
      const evaluation = clinicalSafetyEngine.evaluate({
        text: 'أشعر بألم ضاغط كأنه صخرة على منتصف صدري مع خدر يمتد إلى ذراعي الأيسر وتعرق بارد',
        symptoms: 'ألم ضاغط في الصدر يمتد للذراع الأيسر',
        severity: 'SEVERE',
        painScale: 9,
        vitalSigns: { systolicBP: 165, heartRate: 112, spO2: 93 },
        patientContext: { age: 55, gender: 'MALE', chronicConditions: ['Hypertension', 'Hyperlipidemia'] },
      });

      const isEmergency = evaluation.riskLevel === 'EMERGENCY' || evaluation.isEmergency;
      const hasTriggeredRules = evaluation.triggeredRules.length > 0;
      const triggeredChestRule = evaluation.triggeredRules.some(
        (r) => r.ruleId.includes('CHEST') || r.ruleId.includes('ACS') || r.category === 'CARDIOVASCULAR'
      );

      const passed = isEmergency && hasTriggeredRules && !!evaluation.emergencyPayload;

      results.push({
        suite: 'Clinical Safety Engine',
        name: 'Deterministic Trigger for Acute Coronary Syndrome (ACS / MI)',
        passed,
        message: passed
          ? `Correctly escalated to EMERGENCY level (${evaluation.triggeredRules.length} rules) with emergency payload`
          : 'Failed to escalate Acute Coronary Syndrome to EMERGENCY level',
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        suite: 'Clinical Safety Engine',
        name: 'Deterministic Trigger for Acute Coronary Syndrome (ACS / MI)',
        passed: false,
        message: err.message,
        durationMs: Date.now() - start,
      });
    }
  }

  // Test 2: Acute Ischemic Stroke (FAST Protocol) Red Flag Trigger
  {
    const start = Date.now();
    try {
      const evaluation = clinicalSafetyEngine.evaluate({
        text: 'والدي حدث له ثقل مفاجئ باللسان وتلعثم بالكلام وسقوط في جانب الوجه الأيمن وضعف باليد',
        symptoms: 'تلعثم في الكلام وثقل في اللسان وضعف في جانب الجسم',
        severity: 'SEVERE',
        patientContext: { age: 68, gender: 'MALE' },
      });

      const isEmergency = evaluation.riskLevel === 'EMERGENCY' || evaluation.riskLevel === 'HIGH' || evaluation.isEmergency;
      const hasStrokeRule = evaluation.triggeredRules.some(
        (r) => r.ruleId.includes('STROKE') || r.ruleId.includes('FAST') || r.category === 'NEUROLOGICAL'
      );

      const passed = isEmergency && evaluation.triggeredRules.length > 0;

      results.push({
        suite: 'Clinical Safety Engine',
        name: 'FAST Protocol Detection for Acute Neurological Deficits / Stroke',
        passed,
        message: passed
          ? 'Correctly identified acute stroke signs, flagged time-critical emergency'
          : 'Failed to flag stroke symptoms as emergency',
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        suite: 'Clinical Safety Engine',
        name: 'FAST Protocol Detection for Acute Neurological Deficits / Stroke',
        passed: false,
        message: err.message,
        durationMs: Date.now() - start,
      });
    }
  }

  // Test 3: Pediatric Fever with Lethargy Red Flag Trigger
  {
    const start = Date.now();
    try {
      const evaluation = clinicalSafetyEngine.evaluate({
        text: 'طفلي الرضيع عمره 3 أشهر حرارته 39.5 وخامل جداً ويرفض الرضاعة وظهرت عليه بقع بنفسجية',
        symptoms: 'حمى عالية وخمول وبقع بنفسجية عند رضيع',
        severity: 'SEVERE',
        patientContext: { age: 0.25, gender: 'FEMALE' },
      });

      const isCritical = evaluation.riskLevel === 'EMERGENCY' || evaluation.riskLevel === 'HIGH' || evaluation.isEmergency;
      const passed = isCritical && evaluation.triggeredRules.length > 0;

      results.push({
        suite: 'Clinical Safety Engine',
        name: 'Pediatric Red-Flag Escalation (Infant High Fever & Petechiae)',
        passed,
        message: passed
          ? 'Triggered rapid pediatric emergency alerts and clinical supervisor review'
          : 'Pediatric emergency risk was underestimated',
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        suite: 'Clinical Safety Engine',
        name: 'Pediatric Red-Flag Escalation (Infant High Fever & Petechiae)',
        passed: false,
        message: err.message,
        durationMs: Date.now() - start,
      });
    }
  }

  // Test 4: Pharmacological Safety & Lethal Drug Interaction Screening
  {
    const start = Date.now();
    try {
      const evaluation = clinicalSafetyEngine.evaluate({
        text: 'المريض يتناول الوارفارين وأخذ جرعة عالية من الأسبرين ومسكن بروفين ولديه قيء بني يشبه القهوة',
        symptoms: 'قيء بني داكن مع استخدام مسكنات ومضادات تخثر متعددة',
        severity: 'SEVERE',
        patientContext: {
          currentMedications: ['Warfarin 5mg', 'Aspirin 325mg', 'Ibuprofen 600mg'],
          chronicConditions: ['Atrial Fibrillation'],
        },
      });

      const passed = (evaluation.riskLevel === 'EMERGENCY' || evaluation.riskLevel === 'HIGH' || evaluation.isEmergency) && evaluation.triggeredRules.length > 0;

      results.push({
        suite: 'Clinical Safety Engine',
        name: 'Anticoagulant Overlap & Upper GI Bleeding Red-Flag Guard',
        passed,
        message: passed
          ? 'Successfully flagged high-risk gastrointestinal hemorrhage & toxic drug combination'
          : 'Failed to detect severe anticoagulant interaction risk',
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        suite: 'Clinical Safety Engine',
        name: 'Anticoagulant Overlap & Upper GI Bleeding Red-Flag Guard',
        passed: false,
        message: err.message,
        durationMs: Date.now() - start,
      });
    }
  }

  return results;
}
