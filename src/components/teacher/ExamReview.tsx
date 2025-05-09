import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  AlertTriangle, 
  ArrowLeft, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Clock, 
  Edit, 
  Save, 
  User, 
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Exam, Question, ExamSubmission } from "@/types";
import { examSubmissionService } from "@/services/examSubmissionService";

const mockExam: Exam = {
  id: "e1",
  title: "Mid-term Mathematics",
  description: "Covers chapters 1-5 of the textbook",
  classId: "c1",
  teacherId: "t1",
  questions: [
    {
      id: "q1",
      text: "What is the value of π (pi) to two decimal places?",
      type: "multiple-choice",
      options: ["3.10", "3.14", "3.16", "3.18"],
      correctAnswer: 1,
      points: 5,
    },
    {
      id: "q2",
      text: "Solve the equation: 2x + 5 = 15",
      type: "multiple-choice",
      options: ["x = 5", "x = 7", "x = 10", "x = 15"],
      correctAnswer: 0,
      points: 5,
    },
    {
      id: "q3",
      text: "Explain the Pythagorean theorem in your own words.",
      type: "text",
      points: 10,
    },
    {
      id: "q4",
      text: "Is the statement 'All squares are rectangles' true or false?",
      type: "true-false",
      correctAnswer: true,
      points: 5,
    },
    {
      id: "q5",
      text: "Solve for x: 3x² - 12 = 0",
      type: "multiple-choice",
      options: ["x = 2", "x = ±2", "x = 4", "x = ±4"],
      correctAnswer: 1,
      points: 5,
    },
  ],
  duration: 90,
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
  studentIds: [],
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const ExamReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentGrades, setCurrentGrades] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");

  // Load exam data and submissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await examSubmissionService.getExamSubmissionForReview(id!);
        
        if (response.exam) {
          setExam(response.exam);
          setSubmissions([response.submission]);
          
          if (response.submission) {
            setCurrentGrades(response.submission.grades || {});
            setFeedback(response.submission.feedback || "");
          }
        } else {
          throw new Error('Invalid exam data received');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching exam:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load exam data",
        });
        setLoading(false);
      }
    };

    fetchData();
  }, [id, toast]);

  // Update grades when changing submission
  useEffect(() => {
    if (submissions.length > 0 && currentSubmissionIndex < submissions.length) {
      setCurrentGrades(submissions[currentSubmissionIndex].grades || {});
      setFeedback(submissions[currentSubmissionIndex].feedback || "");
    }
  }, [currentSubmissionIndex, submissions]);

  const handleGradeChange = (questionId: string, points: number) => {
    setCurrentGrades(prev => ({
      ...prev,
      [questionId]: points
    }));
  };

  const saveGrades = async () => {
    try {
      const updatedSubmission = await examSubmissionService.saveExamGrades(
        id!,
        currentGrades,
        feedback
      );
      
      const updatedSubmissions = [...submissions];
      updatedSubmissions[currentSubmissionIndex] = updatedSubmission;
      setSubmissions(updatedSubmissions);
      
      toast({
        title: "Grades Saved",
        description: `Grades and feedback saved for ${updatedSubmission.studentName}.`,
      });
      
      // Navigate back to exams page after successful save
      navigate("/dashboard/exams");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save grades and feedback",
      });
    }
  };

  const handleNextSubmission = () => {
    saveGrades();
    if (currentSubmissionIndex < submissions.length - 1) {
      setCurrentSubmissionIndex(currentSubmissionIndex + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const handlePreviousSubmission = () => {
    saveGrades();
    if (currentSubmissionIndex > 0) {
      setCurrentSubmissionIndex(currentSubmissionIndex - 1);
      setCurrentQuestionIndex(0);
    }
  };

  const handleNextQuestion = () => {
    if (!exam) return;
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getTotalScore = () => {
    return Object.values(currentGrades).reduce((sum, grade) => sum + grade, 0);
  };

  const getMaxScore = () => {
    if (!exam) return 0;
    return exam.questions.reduce((sum, q) => sum + q.points, 0);
  };

  const getScorePercentage = () => {
    const total = getTotalScore();
    const max = getMaxScore();
    return max > 0 ? Math.round((total / max) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading exam data...</p>
        </div>
      </div>
    );
  }

  if (!exam || submissions.length === 0) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Exam Not Found</h2>
        <p className="mb-4">The exam you're looking for does not exist or has no submissions.</p>
        <Button onClick={() => navigate("/dashboard/exams")}>Return to Exams</Button>
      </div>
    );
  }

  const currentSubmission = submissions[currentSubmissionIndex];
  const currentQuestion = exam.questions[currentQuestionIndex];
  const studentAnswer = currentSubmission.answers[currentQuestion.id];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/dashboard/exams")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exams
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">{exam.title} - Review</h2>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <User className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{currentSubmission.studentName}</span>
        </div>

        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            Submitted on {new Date(currentSubmission.submittedAt).toLocaleDateString()}
          </div>
          <div className="text-lg font-medium">
            Score: {getTotalScore()} / {getMaxScore()} ({getScorePercentage()}%)
          </div>
        </div>
      </div>

      <Tabs defaultValue="questions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions" className="space-y-6 mt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-2/3 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Question {currentQuestionIndex + 1}: {currentQuestion.text}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Student's Answer:</h3>
                    
                    {currentQuestion.type === "multiple-choice" && (
                      <div className="space-y-2 pl-4">
                        {currentQuestion.options?.map((option, index) => (
                          <div 
                            key={index} 
                            className={`flex items-center space-x-2 p-2 rounded-md ${
                              studentAnswer === index 
                                ? 'bg-secondary/20'
                                : ''
                            }`}
                          >
                            <div className={`h-4 w-4 rounded-full ${
                              studentAnswer === index 
                                ? 'bg-primary'
                                : 'bg-gray-200'
                            }`} />
                            <span>{option}</span>
                            {currentQuestion.correctAnswer === index && (
                              <Check className="h-4 w-4 text-green-500 ml-auto" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {currentQuestion.type === "text" && (
                      <div className="pl-4 border p-3 rounded-md bg-secondary/10">
                        {studentAnswer || "No answer provided"}
                      </div>
                    )}
                    
                    {currentQuestion.type === "true-false" && (
                      <div className="space-y-2 pl-4">
                        <div className={`flex items-center space-x-2 p-2 rounded-md ${
                          studentAnswer === true ? 'bg-secondary/20' : ''
                        }`}>
                          <div className={`h-4 w-4 rounded-full ${
                            studentAnswer === true ? 'bg-primary' : 'bg-gray-200'
                          }`} />
                          <span>True</span>
                          {currentQuestion.correctAnswer === true && (
                            <Check className="h-4 w-4 text-green-500 ml-auto" />
                          )}
                        </div>
                        
                        <div className={`flex items-center space-x-2 p-2 rounded-md ${
                          studentAnswer === false ? 'bg-secondary/20' : ''
                        }`}>
                          <div className={`h-4 w-4 rounded-full ${
                            studentAnswer === false ? 'bg-primary' : 'bg-gray-200'
                          }`} />
                          <span>False</span>
                          {currentQuestion.correctAnswer === false && (
                            <Check className="h-4 w-4 text-green-500 ml-auto" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Correct Answer:</h3>
                    
                    {currentQuestion.type === "multiple-choice" && (
                      <div className="pl-4 text-green-600">
                        {currentQuestion.options?.[currentQuestion.correctAnswer as number]}
                      </div>
                    )}
                    
                    {currentQuestion.type === "text" && (
                      <div className="pl-4 text-muted-foreground">
                        <em>Manual grading required</em>
                      </div>
                    )}
                    
                    {currentQuestion.type === "true-false" && (
                      <div className="pl-4 text-green-600">
                        {currentQuestion.correctAnswer ? "True" : "False"}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t">
                  <div className="text-sm">
                    {currentQuestion.points} points possible
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline"
                      disabled={currentQuestionIndex === 0}
                      onClick={handlePreviousQuestion}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={currentQuestionIndex === exam.questions.length - 1}
                      onClick={handleNextQuestion}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
            
            <div className="w-full md:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle>Grading</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="points">Points for this question</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="points"
                        type="number"
                        min="0"
                        max={currentQuestion.points}
                        value={currentGrades[currentQuestion.id] || 0}
                        onChange={(e) => handleGradeChange(
                          currentQuestion.id, 
                          Math.min(currentQuestion.points, Math.max(0, parseInt(e.target.value) || 0))
                        )}
                      />
                      <span>/ {currentQuestion.points}</span>
                    </div>
                  </div>
                  
                  <Progress
                    value={(currentGrades[currentQuestion.id] || 0) / currentQuestion.points * 100}
                    className="h-2"
                  />
                  
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={saveGrades}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Grades
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Exam Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Total Score</h3>
                  <div className="text-xl font-bold">
                    {getTotalScore()} / {getMaxScore()} ({getScorePercentage()}%)
                  </div>
                </div>
                
                <Progress value={getScorePercentage()} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Questions Overview</h3>
                
                {exam.questions.map((question, index) => (
                  <div 
                    key={question.id} 
                    className="p-4 flex justify-between items-center hover:bg-muted/50 cursor-pointer"
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    <div>
                      <div className="font-medium">Question {index + 1}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                        {question.text}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${
                        (currentGrades[question.id] || 0) === question.points ? 'text-green-600' : 
                        (currentGrades[question.id] || 0) === 0 ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {currentGrades[question.id] || 0} / {question.points}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Add feedback for this student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={5}
                />
              </div>
              
              <Button 
                className="w-full"
                onClick={saveGrades}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Feedback & Grades
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExamReview;

