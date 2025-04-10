
export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Student extends User {
  role: 'student';
  classIds: string[];
}

export interface Teacher extends User {
  role: 'teacher';
  classIds: string[];
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  studentIds: string[];
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'text' | 'true-false';
  options?: string[];
  correctAnswer?: string | number | boolean;
  points: number;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  classId: string;
  teacherId: string;
  questions: Question[];
  duration: number; // in minutes
  startTime: Date | string;
  endTime: Date | string;
  isActive: boolean;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  startTime: Date | string;
  endTime?: Date | string;
  answers: {
    questionId: string;
    answer: string | number | boolean;
  }[];
  completed: boolean;
  grade?: number;
  monitoringFlags: {
    timestamp: Date | string;
    type: 'no-face' | 'multiple-faces' | 'looking-away' | 'other';
    description?: string;
  }[];
}

export interface FaceDetection {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: {
    x: number;
    y: number;
  }[];
  headPose?: {
    pitch: number;
    yaw: number;
    roll: number;
  };
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
