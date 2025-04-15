import api from './api';
import { Exam } from '@/types';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  eventType: 'exam';
  location?: string;
}

export const calendarService = {
  getStudentEvents: async (): Promise<CalendarEvent[]> => {
    const response = await api.get('/api/exam-submissions/student');
    const exams: Exam[] = response.data;

    return exams.map(exam => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      startTime: exam.startTime,
      endTime: exam.endTime,
      eventType: 'exam' as const,
      location: 'Online Exam'
    }));
  }
}; 