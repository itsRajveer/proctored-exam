import api from './api';
import { Exam, Question, ExamSubmission } from '@/types';

const API_URL = '/exams';

export const examService = {
  // Create a new exam
  async createExam(examData: {
    title: string;
    description: string;
    classId: string;
    duration: number;
    startTime: string;
    endTime: string;
    questions: Question[];
    studentIds: string[];
  }): Promise<Exam> {
    const response = await api.post(API_URL, examData);
    return response.data;
  },

  // Get all exams for the current teacher
  async getTeacherExams(): Promise<Exam[]> {
    const response = await api.get(API_URL);
    return response.data;
  },

  // Get a specific exam by ID
  async getExam(examId: string): Promise<Exam> {
    const response = await api.get(`${API_URL}/${examId}`);
    return response.data;
  },

  // Update an exam
  async updateExam(examId: string, examData: Partial<Exam>): Promise<Exam> {
    const response = await api.put(`${API_URL}/${examId}`, examData);
    return response.data;
  },

  // Delete an exam
  async deleteExam(examId: string): Promise<void> {
    await api.delete(`${API_URL}/${examId}`);
  },

  // Submit exam answers
  async submitExam(examId: string, answers: Record<string, any>): Promise<ExamSubmission> {
    const response = await api.post(`${API_URL}/${examId}/submit`, { answers });
    return response.data;
  },

  // Get exam submissions
  async getExamSubmissions(examId: string): Promise<ExamSubmission[]> {
    const response = await api.get(`${API_URL}/${examId}/submissions`);
    return response.data;
  },

  // Grade a submission
  async gradeSubmission(submissionId: string, grades: Record<string, number>, feedback: string): Promise<ExamSubmission> {
    const response = await api.post(`${API_URL}/${submissionId}/grade`, { grades, feedback });
    return response.data;
  }
}; 