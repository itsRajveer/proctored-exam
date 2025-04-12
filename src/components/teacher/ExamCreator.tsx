
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarIcon,
  Check,
  Clock,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileText,
  FilePlus,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { Class, Question, Exam } from "@/types";

const mockClasses: Class[] = [
  {
    id: "c1",
    name: "Mathematics 101",
    description: "Introduction to algebra and calculus",
    teacherId: "t1",
    studentIds: ["s1", "s2", "s3", "s4", "s5"]
  },
  {
    id: "c2",
    name: "Physics 101",
    description: "Introduction to mechanics and thermodynamics",
    teacherId: "t1",
    studentIds: ["s1", "s2", "s3"]
  }
];

const mockStudents = [
  { id: "s1", name: "John Doe", email: "john.doe@example.com" },
  { id: "s2", name: "Jane Smith", email: "jane.smith@example.com" },
  { id: "s3", name: "Michael Brown", email: "michael.brown@example.com" },
  { id: "s4", name: "Emily Johnson", email: "emily.johnson@example.com" },
  { id: "s5", name: "David Wilson", email: "david.wilson@example.com" },
];

// Mock exams for the ExamList tab
const mockExams: Exam[] = [
  {
    id: "e1",
    title: "Mid-term Mathematics",
    description: "Covers chapters 1-5 of the textbook",
    classId: "c1",
    teacherId: "t1",
    questions: [
      // Using simplified questions for the exam list view
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
    ],
    duration: 90,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    isActive: true,
  },
  {
    id: "e2",
    title: "Physics Quiz",
    description: "Basic concepts of mechanics",
    classId: "c2",
    teacherId: "t1",
    questions: [],
    duration: 45,
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // tomorrow
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 + 1000 * 60 * 45).toISOString(),
    isActive: false,
  }
];

// Component for displaying submission status
const SubmissionStatus = ({ count, total }: { count: number; total: number }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className="flex items-center space-x-2">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-primary h-2.5 rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span className="text-sm font-medium">
        {count}/{total}
      </span>
    </div>
  );
};

export const ExamCreator: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for tabs
  const [activeTab, setActiveTab] = useState("create");
  
  // State for exam creation
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [duration, setDuration] = useState("60");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState("10:00");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: "",
    text: "",
    type: "multiple-choice",
    options: ["", "", "", ""],
    correctAnswer: 0,
    points: 5,
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [classStudents, setClassStudents] = useState<{id: string, name: string}[]>([]);
  
  // State for exam list and search
  const [searchTerm, setSearchTerm] = useState("");
  const [exams, setExams] = useState<typeof mockExams>(mockExams);

  // Setup form for better form handling
  const examForm = useForm({
    defaultValues: {
      examTitle: "",
      examDescription: "",
      classId: "",
      duration: "60",
    }
  });

  useEffect(() => {
    if (classId) {
      const selectedClass = mockClasses.find(c => c.id === classId);
      if (selectedClass) {
        const students = selectedClass.studentIds.map(id => 
          mockStudents.find(s => s.id === id)
        ).filter(Boolean).map(s => ({ id: s!.id, name: s!.name }));
        
        setClassStudents(students);
        setSelectedStudents(students.map(s => s.id));
      } else {
        setClassStudents([]);
        setSelectedStudents([]);
      }
    } else {
      setClassStudents([]);
      setSelectedStudents([]);
    }
  }, [classId]);

  // Filter exams based on search term
  const filteredExams = exams.filter(exam => 
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addQuestion = () => {
    if (!currentQuestion.text) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Question text is required.",
      });
      return;
    }
    
    if (currentQuestion.type === "multiple-choice") {
      if (currentQuestion.options?.some(option => !option)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "All options must have text.",
        });
        return;
      }
    }
    
    const newQuestion = {
      ...currentQuestion,
      id: `q${Date.now()}`,
    };
    
    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      id: "",
      text: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 5,
    });
    
    toast({
      title: "Question Added",
      description: "The question has been added to the exam.",
    });
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId));
    
    toast({
      title: "Question Removed",
      description: "The question has been removed from the exam.",
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!currentQuestion.options) return;
    
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleQuestionTypeChange = (type: "multiple-choice" | "text" | "true-false") => {
    if (type === "multiple-choice") {
      setCurrentQuestion({
        ...currentQuestion,
        type,
        options: ["", "", "", ""],
        correctAnswer: 0,
      });
    } else if (type === "true-false") {
      setCurrentQuestion({
        ...currentQuestion,
        type,
        options: undefined,
        correctAnswer: true,
      });
    } else {
      setCurrentQuestion({
        ...currentQuestion,
        type,
        options: undefined,
        correctAnswer: undefined,
      });
    }
  };

  const saveExam = () => {
    if (!examTitle) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Exam title is required.",
      });
      return;
    }
    
    if (!classId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a class for the exam.",
      });
      return;
    }
    
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Start and end dates are required.",
      });
      return;
    }
    
    if (questions.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one question to the exam.",
      });
      return;
    }
    
    if (selectedStudents.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one student for the exam.",
      });
      return;
    }
    
    // Create a new exam
    const newExam: Exam = {
      id: `e${Date.now()}`,
      title: examTitle,
      description: examDescription,
      classId: classId,
      teacherId: "t1", // Using mock teacher ID
      questions: questions,
      duration: parseInt(duration),
      startTime: startDate!.toISOString(),
      endTime: endDate!.toISOString(),
      isActive: true,
    };
    
    // Add the new exam to the list
    setExams([...exams, newExam]);
    
    // Reset form
    setExamTitle("");
    setExamDescription("");
    setClassId("");
    setDuration("60");
    setStartDate(undefined);
    setStartTime("09:00");
    setEndDate(undefined);
    setEndTime("10:00");
    setQuestions([]);
    setSelectedStudents([]);
    
    toast({
      title: "Exam Created",
      description: `The exam has been created successfully for ${selectedStudents.length} students.`,
    });
    
    // Switch to exam list tab
    setActiveTab("list");
  };

  const toggleAllStudents = () => {
    if (selectedStudents.length === classStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(classStudents.map(s => s.id));
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const viewExamResults = (examId: string) => {
    navigate(`/dashboard/exam/${examId}/review`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Exams Management</h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">
            <FileText className="h-4 w-4 mr-2" />
            Existing Exams
          </TabsTrigger>
          <TabsTrigger value="create">
            <FilePlus className="h-4 w-4 mr-2" />
            Create New Exam
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          {filteredExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExams.map(exam => {
                const classData = mockClasses.find(c => c.id === exam.classId);
                const totalStudents = classData?.studentIds.length || 0;
                // For demo purposes: random submission counts
                const submissionCount = Math.floor(Math.random() * (totalStudents + 1));
                
                const now = new Date();
                const startTime = new Date(exam.startTime);
                const endTime = new Date(exam.endTime);
                
                const isUpcoming = startTime > now;
                const isOngoing = startTime <= now && endTime >= now;
                const isPast = endTime < now;
                
                return (
                  <Card key={exam.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{exam.title}</CardTitle>
                        {isOngoing && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ongoing
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Upcoming
                          </span>
                        )}
                        {isPast && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Completed
                          </span>
                        )}
                      </div>
                      <CardDescription>{exam.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Class:</span>
                          <span className="font-medium">{classData?.name || "Unknown Class"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{exam.duration} minutes</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Questions:</span>
                          <span>{exam.questions.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Submissions:</span>
                          <span className="flex items-center">
                            <SubmissionStatus count={submissionCount} total={totalStudents} />
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Start:</span>
                          <span>{format(new Date(exam.startTime), "MMM dd, yyyy HH:mm")}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Clone the exam for reuse
                          setExamTitle(exam.title);
                          setExamDescription(exam.description);
                          setClassId(exam.classId);
                          setDuration(exam.duration.toString());
                          setQuestions([...exam.questions]);
                          setActiveTab("create");
                          
                          toast({
                            title: "Exam Cloned",
                            description: "You can now edit this copy of the exam.",
                          });
                        }}
                      >
                        Clone
                      </Button>
                      <Button 
                        onClick={() => viewExamResults(exam.id)} 
                        disabled={!isPast && !isOngoing}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {isPast ? "View Results" : isOngoing ? "Monitor" : "Not Available"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-gray-400 mb-2" />
              <h3 className="font-medium">No Exams Found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {searchTerm 
                  ? `No exams match your search for "${searchTerm}". Try a different search term.`
                  : "You haven't created any exams yet. Click on 'Create New Exam' to get started."}
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="create" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Exam Details</CardTitle>
                <CardDescription>
                  Set the basic information for your exam
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...examForm}>
                  <div className="space-y-2">
                    <Label htmlFor="examTitle">Exam Title</Label>
                    <Input 
                      id="examTitle"
                      placeholder="e.g. Midterm Mathematics Exam"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="examDescription">Description (Optional)</Label>
                    <Textarea 
                      id="examDescription"
                      placeholder="Add a description for your exam"
                      value={examDescription}
                      onChange={(e) => setExamDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="classSelect">Class</Label>
                    <Select value={classId} onValueChange={setClassId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockClasses.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name} ({classItem.studentIds.length} students)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input 
                      id="duration"
                      type="number"
                      placeholder="60"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="startDate"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input 
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="endDate"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input 
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Students</CardTitle>
                <CardDescription>
                  Select students who will take this exam
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {classId ? (
                  <>
                    {classStudents.length > 0 ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="selectAll" 
                            checked={selectedStudents.length === classStudents.length}
                            onCheckedChange={toggleAllStudents}
                          />
                          <Label htmlFor="selectAll">Select All Students</Label>
                        </div>
                        <Separator className="my-2" />
                        <div className="h-[300px] overflow-auto space-y-2">
                          {classStudents.map((student) => (
                            <div key={student.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`student-${student.id}`} 
                                checked={selectedStudents.includes(student.id)}
                                onCheckedChange={() => toggleStudent(student.id)}
                              />
                              <Label htmlFor={`student-${student.id}`}>{student.name}</Label>
                            </div>
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedStudents.length} of {classStudents.length} students selected
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] text-center">
                        <Users className="h-12 w-12 text-gray-400 mb-2" />
                        <h3 className="font-medium">No Students Found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          The selected class has no registered students
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <Users className="h-12 w-12 text-gray-400 mb-2" />
                    <h3 className="font-medium">Select a Class First</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select a class to see available students
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                Add questions to your exam
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] overflow-auto space-y-4">
              {questions.length > 0 ? (
                questions.map((q, index) => (
                  <Card key={q.id} className="relative">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-2 h-6 w-6"
                      onClick={() => removeQuestion(q.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <h4 className="font-medium">
                            Question {index + 1}
                          </h4>
                          <span className="text-sm text-muted-foreground">
                            {q.points} points
                          </span>
                        </div>
                        <p>{q.text}</p>
                        {q.type === "multiple-choice" && (
                          <div className="space-y-2 pl-2">
                            {q.options?.map((option, i) => (
                              <div key={i} className="flex items-center space-x-2">
                                <div className={`h-4 w-4 rounded-full ${
                                  q.correctAnswer === i ? "bg-primary" : "bg-gray-200"
                                }`} />
                                <span>{option}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === "true-false" && (
                          <div className="space-y-2 pl-2">
                            <div className="flex items-center space-x-2">
                              <div className={`h-4 w-4 rounded-full ${
                                q.correctAnswer === true ? "bg-primary" : "bg-gray-200"
                              }`} />
                              <span>True</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`h-4 w-4 rounded-full ${
                                q.correctAnswer === false ? "bg-primary" : "bg-gray-200"
                              }`} />
                              <span>False</span>
                            </div>
                          </div>
                        )}
                        {q.type === "text" && (
                          <div className="pl-2 text-sm text-muted-foreground">
                            Text answer required
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ClipboardList className="h-12 w-12 text-gray-400 mb-2" />
                  <h3 className="font-medium">No Questions Added</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add questions using the form below
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
                {questions.length} question(s), {questions.reduce((sum, q) => sum + q.points, 0)} total points
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Add Question</CardTitle>
              <CardDescription>
                Create a new question for the exam
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...examForm}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionType">Question Type</Label>
                    <RadioGroup
                      defaultValue="multiple-choice"
                      value={currentQuestion.type}
                      onValueChange={(value) =>
                        handleQuestionTypeChange(value as "multiple-choice" | "text" | "true-false")
                      }
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="multiple-choice" id="multiple-choice" />
                        <Label htmlFor="multiple-choice">Multiple Choice</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="text" id="text" />
                        <Label htmlFor="text">Text</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true-false" id="true-false" />
                        <Label htmlFor="true-false">True/False</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="question-text">Question Text</Label>
                    <Textarea
                      id="question-text"
                      placeholder="Enter your question here"
                      value={currentQuestion.text}
                      onChange={(e) =>
                        setCurrentQuestion({ ...currentQuestion, text: e.target.value })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="question-points">Points</Label>
                    <Input
                      id="question-points"
                      type="number"
                      min="1"
                      placeholder="5"
                      value={currentQuestion.points}
                      onChange={(e) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          points: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-24"
                    />
                  </div>
                  
                  {currentQuestion.type === "multiple-choice" && (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      <div className="space-y-2">
                        {currentQuestion.options?.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroup
                              value={currentQuestion.correctAnswer === index ? index.toString() : ""}
                              onValueChange={() => {
                                setCurrentQuestion({
                                  ...currentQuestion,
                                  correctAnswer: index,
                                });
                              }}
                            >
                              <RadioGroupItem
                                value={index.toString()}
                                id={`option-${index}`}
                                checked={currentQuestion.correctAnswer === index}
                              />
                            </RadioGroup>
                            <Input
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {currentQuestion.type === "true-false" && (
                    <div className="space-y-2">
                      <Label>Correct Answer</Label>
                      <RadioGroup
                        value={currentQuestion.correctAnswer ? "true" : "false"}
                        onValueChange={(value) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            correctAnswer: value === "true",
                          })
                        }
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="true" />
                          <Label htmlFor="true">True</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="false" />
                          <Label htmlFor="false">False</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                  
                  <Button
                    onClick={addQuestion}
                    variant="secondary"
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </div>
              </Form>
            </CardContent>
            <CardFooter>
              <div className="flex w-full justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (questions.length > 0 || examTitle || examDescription) {
                      if (confirm("Are you sure you want to cancel? All unsaved changes will be lost.")) {
                        navigate("/dashboard/exams");
                      }
                    } else {
                      navigate("/dashboard/exams");
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={saveExam}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Exam
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExamCreator;

