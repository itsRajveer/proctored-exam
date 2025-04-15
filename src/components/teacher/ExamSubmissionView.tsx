import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { examSubmissionService } from '@/services/examSubmissionService';
import { ExamSubmission } from '@/types';

export const ExamSubmissionView = () => {
  const { examId, studentId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<ExamSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<{ [questionId: string]: number }>({});
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const data = await examSubmissionService.getExamSubmission(examId!, studentId!);
        setSubmission(data);
        // Initialize grades with existing values or 0
        const initialGrades = data.answers.reduce((acc, answer) => {
          acc[answer.questionId] = answer.grade || 0;
          return acc;
        }, {} as { [questionId: string]: number });
        setGrades(initialGrades);
        setFeedback(data.feedback || '');
      } catch (err) {
        setError('Failed to load exam submission');
        toast.error('Failed to load exam submission');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [examId, studentId]);

  const handleGradeChange = (questionId: string, value: number) => {
    setGrades(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSaveGrades = async () => {
    try {
      await examSubmissionService.saveExamGrades(examId!, grades, feedback);
      toast.success('Grades saved successfully');
      navigate(-1); // Go back to the previous page
    } catch (err) {
      toast.error('Failed to save grades');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!submission) return <div>No submission found</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Grade Exam Submission</h1>
      <div className="space-y-6">
        {submission.answers.map((answer) => (
          <div key={answer.questionId} className="border p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Question {answer.questionId}</h3>
            <p className="mb-2">{answer.questionText}</p>
            <p className="mb-2">Student's Answer: {answer.answer}</p>
            <div className="flex items-center gap-4">
              <label>Grade:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={grades[answer.questionId]}
                onChange={(e) => handleGradeChange(answer.questionId, parseInt(e.target.value))}
                className="border rounded px-2 py-1 w-20"
              />
              <span>/100</span>
            </div>
          </div>
        ))}
        <div className="mt-4">
          <label className="block font-semibold mb-2">Feedback:</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full border rounded p-2"
            rows={4}
          />
        </div>
        <button
          onClick={handleSaveGrades}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Save Grades
        </button>
      </div>
    </div>
  );
}; 