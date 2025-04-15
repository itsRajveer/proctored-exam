import { Class, Student } from '@/types';
import api from './api';

export const classService = {
  // Get all classes for the current teacher
  async getClasses(): Promise<Class[]> {
    const response = await api.get('/classes');
    return response.data;
  },

  // Get students by IDs
  async getStudentsByIds(studentIds: string[]): Promise<Student[]> {
    const response = await api.post('/classes/students', { studentIds });
    return response.data;
  },

  // Create a new class
  async createClass(data: { 
    name: string; 
    description?: string; 
    studentIds?: string[] 
  }): Promise<Class> {
    const response = await api.post('/classes', data);
    return response.data;
  },

  // Update a class
  async updateClass(id: string, data: { 
    name?: string; 
    description?: string;
    studentIds?: string[];
  }): Promise<Class> {
    const response = await api.put(`/classes/${id}`, data);
    return response.data;
  },

  // Delete a class
  async deleteClass(id: string): Promise<void> {
    await api.delete(`/classes/${id}`);
  },

  // Add student to class
  async addStudentToClass(classId: string, email: string): Promise<Class> {
    const response = await api.post(`/classes/${classId}/students`, { email });
    return response.data;
  },

  // Remove student from class
  async removeStudentFromClass(classId: string, studentId: string): Promise<Class> {
    const response = await api.delete(`/classes/${classId}/students/${studentId}`);
    return response.data;
  },
}; 