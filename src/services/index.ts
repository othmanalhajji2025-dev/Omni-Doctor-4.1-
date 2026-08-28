import { apiRequest } from './apiClient.js';
import { TriageResult, VitalsInput, DrugInteraction, LabParameterResult, UserProfile } from '../types/index.js';

export const triageService = {
  async runTriage(data: {
    symptoms: string;
    duration?: string;
    painScale?: number;
    severity?: string;
    vitals?: VitalsInput;
  }): Promise<TriageResult> {
    return apiRequest<TriageResult>('/api/triage/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const drugsService = {
  async checkInteractions(drugs: string[]): Promise<{
    checkedCount: number;
    interactionsCount: number;
    interactions: DrugInteraction[];
  }> {
    return apiRequest('/api/drugs/check-interactions', {
      method: 'POST',
      body: JSON.stringify({ drugs }),
    });
  },
};

export const labsService = {
  async interpretLab(parameters: Array<{ name: string; value: number; unit: string }>): Promise<{
    parametersAnalyzed: number;
    results: LabParameterResult[];
  }> {
    return apiRequest('/api/labs/interpret', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
    });
  },
};

export const recordsService = {
  async getProfile(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/records/profile');
  },
  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/records/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },
};
