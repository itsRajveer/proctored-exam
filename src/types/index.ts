export type UserRole = "student" | "teacher";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
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
  description: string;
  teacherId: string;
  studentIds: string[];
  students?: Student[];
  examCount: number;
  studentCount: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'text' | 'true-false';
  options?: string[];
  correctAnswer?: string | number | boolean;
  points: number;
  order?: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  startTime: string;
  endTime: string;
  questions: Question[];
  studentIds: string[];
  teacherId: string;
  classId: string;
  status: 'draft' | 'scheduled' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
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
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  answers: {
    questionId: string;
    answer: string | number | boolean;
  }[];
  grades: Record<string, number>;
  feedback: string;
  status: 'submitted' | 'graded';
  submittedAt: string;
  gradedAt?: string;
}

export interface Answer {
  questionId: string;
  questionText: string;
  answer: string | number | boolean;
  grade?: number;
}
