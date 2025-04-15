import api from './api';

export interface Grade {
  id: string;
  examId: string;
  examTitle: string;
  date: string;
  score: number;
  totalPoints: number;
  percentage: number;
  grade: string;
  feedback: string;
  classAverage?: number;
}

export interface GradeStatistics {
  totalExams: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
}

export interface GradesResponse {
  grades: Grade[];
  statistics: GradeStatistics;
}

export const gradesService = {
  getStudentGrades: async (): Promise<GradesResponse> => {
    const response = await api.get('/api/exam-submissions/student/grades');
    return response.data;
  }
}; 