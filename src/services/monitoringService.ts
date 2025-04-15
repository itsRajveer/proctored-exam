import api from '@/services/api';

export interface MonitoringSession {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: 'active' | 'ended';
  violations: number;
  lastViolationTime: string | null;
  peerId: string | null;
  aiFlags: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export const monitoringService = {
  getActiveSessions: async (examId?: string): Promise<MonitoringSession[]> => {
    const url = examId 
      ? `/api/monitoring/active?examId=${examId}`
      : '/api/monitoring/active';
    
    const response = await api.get(url);
    return response.data;
  },

  startMonitoring: async (examId: string, studentId: string): Promise<MonitoringSession> => {
    const response = await api.post('/api/monitoring/start', {
      examId,
      studentId
    });
    return response.data;
  },

  stopMonitoring: async (sessionId: string): Promise<void> => {
    await api.post(`/api/monitoring/${sessionId}/stop`);
  },

  updatePeerId: async (sessionId: string, data: RTCIceCandidateInit | RTCSessionDescriptionInit) => {
    return api.post(`/monitoring/${sessionId}/peer`, data);
  },

  reportViolation: async (sessionId: string, type: string, description: string): Promise<void> => {
    await api.post(`/api/monitoring/${sessionId}/violation`, {
      type,
      description
    });
  }
}; 