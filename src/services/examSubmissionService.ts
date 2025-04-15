import api from './api';
import { Exam, ExamSubmission, Answer } from '@/types';

interface ExamDetailsResponse {
  exam: Exam;
  submission: ExamSubmission | null;
}

export const examSubmissionService = {
  getStudentExams: async (): Promise<Exam[]> => {
    const response = await api.get('/api/exam-submissions/student');
    return response.data;
  },

  getExamDetails: async (examId: string): Promise<ExamDetailsResponse> => {
    const response = await api.get(`/api/exam-submissions/${examId}`);
    return response.data;
  },

  getExamSubmissionForReview: async (examId: string): Promise<ExamDetailsResponse> => {
    const response = await api.get(`/api/exam-submissions/${examId}/review`);
    return response.data;
  },

  submitExam: async (examId: string, answers: Record<string, any>): Promise<ExamSubmission> => {
    const response = await api.post(`/api/exam-submissions/${examId}/submit`, { answers });
    return response.data;
  },

  saveExamProgress: async (examId: string, answers: Record<string, any>): Promise<ExamSubmission> => {
    const response = await api.post(`/api/exam-submissions/${examId}/save`, { answers });
    return response.data;
  },

  async saveExamGrades(examId: string, grades: { [questionId: string]: number }, feedback: string): Promise<ExamSubmission> {
    const response = await api.post(`/api/exam-submissions/${examId}/grades`, {
      grades,
      feedback
    });
    return response.data;
  },

  getExamSubmission: async (submissionId: string): Promise<ExamSubmission> => {
    const response = await api.get(`/api/exam-submissions/${submissionId}`);
    return response.data;
  }
}; 