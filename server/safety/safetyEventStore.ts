import fs from 'fs';
import path from 'path';
import { SafetyEvent, SafetyRiskLevel } from '../types/safety.js';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const SAFETY_EVENTS_FILE = path.join(DATA_DIR, 'safety_events.json');
const MAX_EVENTS_IN_MEMORY = 500;

class SafetyEventStore {
  private events: SafetyEvent[] = [];

  constructor() {
    this.ensureDirectory();
    this.loadEvents();
  }

  private ensureDirectory(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[SafetyEventStore] Could not initialize directory:', err);
    }
  }

  private loadEvents(): void {
    try {
      if (fs.existsSync(SAFETY_EVENTS_FILE)) {
        const raw = fs.readFileSync(SAFETY_EVENTS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.events = parsed;
        }
      }
    } catch (err) {
      console.warn('[SafetyEventStore] Could not read safety_events.json, starting empty:', err);
      this.events = [];
    }
  }

  private persistEvents(): void {
    try {
      this.ensureDirectory();
      // Only keep the most recent MAX_EVENTS_IN_MEMORY on disk
      const trimmed = this.events.slice(-MAX_EVENTS_IN_MEMORY);
      fs.writeFileSync(SAFETY_EVENTS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[SafetyEventStore] Could not write safety_events.json:', err);
    }
  }

  /**
   * Log a safety event into SafetyEvents collection
   * Adheres strictly to the Privacy Principle: Do not record raw clinical transcripts or PII
   */
  public logEvent(
    data: Omit<SafetyEvent, 'eventId' | 'timestamp'>
  ): SafetyEvent {
    const event: SafetyEvent = {
      eventId: 'se_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      riskLevel: data.riskLevel,
      triggeredRules: data.triggeredRules.map(r => ({
        ruleId: r.ruleId,
        category: r.category,
        trigger: r.trigger,
        riskLevel: r.riskLevel,
      })),
      actionTaken: data.actionTaken,
      reviewStatus: data.reviewStatus || (data.riskLevel === 'EMERGENCY' || data.riskLevel === 'URGENT' ? 'PENDING_REVIEW' : 'RESOLVED'),
      anonymizedContext: {
        symptomCategory: data.anonymizedContext.symptomCategory,
        characterCount: data.anonymizedContext.characterCount,
        hasVitals: Boolean(data.anonymizedContext.hasVitals),
        painScale: data.anonymizedContext.painScale,
        sessionId: data.anonymizedContext.sessionId
          ? 'sess_' + data.anonymizedContext.sessionId.slice(-6)
          : undefined,
      },
    };

    this.events.unshift(event);
    if (this.events.length > MAX_EVENTS_IN_MEMORY) {
      this.events = this.events.slice(0, MAX_EVENTS_IN_MEMORY);
    }

    this.persistEvents();
    return event;
  }

  /**
   * Retrieve safety events with optional filtering
   */
  public getEvents(filter?: {
    riskLevel?: SafetyRiskLevel;
    reviewStatus?: 'PENDING_REVIEW' | 'INVESTIGATED' | 'DISMISSED' | 'RESOLVED';
    limit?: number;
  }): SafetyEvent[] {
    let result = this.events;
    if (filter?.riskLevel) {
      result = result.filter(e => e.riskLevel === filter.riskLevel);
    }
    if (filter?.reviewStatus) {
      result = result.filter(e => (e.reviewStatus || 'PENDING_REVIEW') === filter.reviewStatus);
    }
    const limit = filter?.limit || 50;
    return result.slice(0, limit);
  }

  /**
   * Update review status and supervisor notes for a safety event
   */
  public updateReviewStatus(
    eventId: string,
    reviewStatus: 'PENDING_REVIEW' | 'INVESTIGATED' | 'DISMISSED' | 'RESOLVED',
    reviewedBy: string,
    reviewerNotes?: string
  ): SafetyEvent | null {
    const event = this.events.find(e => e.eventId === eventId);
    if (!event) return null;

    event.reviewStatus = reviewStatus;
    event.reviewedBy = reviewedBy;
    event.reviewerNotes = reviewerNotes || event.reviewerNotes;
    event.reviewedAt = new Date().toISOString();

    this.persistEvents();
    return event;
  }

  /**
   * Retrieve aggregate safety metrics
   */
  public getMetrics(): {
    totalEvents: number;
    emergencyCount: number;
    urgentCount: number;
    highCount: number;
    moderateCount: number;
    lowCount: number;
    emergencyOverrides: number;
  } {
    const counts = {
      totalEvents: this.events.length,
      emergencyCount: 0,
      urgentCount: 0,
      highCount: 0,
      moderateCount: 0,
      lowCount: 0,
      emergencyOverrides: 0,
    };

    for (const e of this.events) {
      if (e.riskLevel === 'EMERGENCY') counts.emergencyCount++;
      else if (e.riskLevel === 'URGENT') counts.urgentCount++;
      else if (e.riskLevel === 'HIGH') counts.highCount++;
      else if (e.riskLevel === 'MODERATE') counts.moderateCount++;
      else if (e.riskLevel === 'LOW') counts.lowCount++;

      if (e.actionTaken === 'EMERGENCY_OVERRIDE') {
        counts.emergencyOverrides++;
      }
    }

    return counts;
  }

  /**
   * Clear events (used primarily in tests)
   */
  public clear(): void {
    this.events = [];
    this.persistEvents();
  }
}

export const safetyEventStore = new SafetyEventStore();
