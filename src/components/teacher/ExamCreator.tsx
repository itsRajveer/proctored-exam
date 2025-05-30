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
  AlertTriangle,
  Upload,
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
import { Class, Question, Exam, Student } from "@/types";
import { classService } from "@/services/classService";
import { examService } from "@/services/examService";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export const ExamCreator: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for tabs
  const [activeTab, setActiveTab] = useState("list");
  
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
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [examDuration, setExamDuration] = useState(60);

  // State for file upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Setup form for better form handling
  const examForm = useForm({
    defaultValues: {
      examTitle: "",
      examDescription: "",
      classId: "",
      duration: "60",
    }
  });

  // Fetch classes and exams on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesData, examsData] = await Promise.all([
          classService.getClasses(),
          examService.getTeacherExams()
        ]);
        setClasses(classesData);
        setExams(examsData);
        setError(null);
      } catch (err) {
        setError("Failed to load data. Please try again later.");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  useEffect(() => {
    if (classId) {
      const selectedClass = classes.find(c => c.id === classId);
      if (selectedClass) {
        setSelectedClass(selectedClass);
        // Get student data for the selected class
        const fetchStudents = async () => {
          try {
            const students = await classService.getStudentsByIds(selectedClass.studentIds);
            setClassStudents(students.map(student => ({
              id: student.id,
              name: student.name
            })));
            setSelectedStudents(students.map(student => student.id));
          } catch (error) {
            console.error('Error fetching students:', error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to load students for this class",
            });
          }
        };
        fetchStudents();
      } else {
        setSelectedClass(null);
        setClassStudents([]);
        setSelectedStudents([]);
      }
    } else {
      setSelectedClass(null);
      setClassStudents([]);
      setSelectedStudents([]);
    }
  }, [classId, classes, toast]);

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

  const saveExam = async () => {
    if (!classId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a class",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one question",
      });
      return;
    }

    try {
      // Combine date and time for start and end times
      const combineDateTime = (date: Date | undefined, time: string) => {
        if (!date) return new Date().toISOString();
        
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours, minutes, 0, 0);
        return newDate.toISOString();
      };

      const newExam = {
        title: examTitle,
        description: examDescription,
        duration: parseInt(duration),
        classId: classId,
        startTime: combineDateTime(startDate, startTime),
        endTime: combineDateTime(endDate, endTime),
        questions: questions.map((q, index) => ({
          ...q,
          order: index + 1
        })),
        studentIds: selectedStudents
      };

      await examService.createExam(newExam);
      toast({
        title: "Success",
        description: "Exam created successfully"
      });
      
      // Reset form
      setExamTitle('');
      setExamDescription('');
      setDuration('60');
      setQuestions([]);
      setClassId('');
      setSelectedClass(null);
      setClassStudents([]);
      setSelectedStudents([]);
      setStartDate(undefined);
      setStartTime('09:00');
      setEndDate(undefined);
      setEndTime('10:00');
      setActiveTab('list');

      window.location.reload();
    } catch (error) {
      console.error('Error creating exam:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create exam"
      });
    }
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUploadQuestions = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No file selected.',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    const token = localStorage.getItem('authToken');
    console.log('Token from localStorage:', token); // Debug log

    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No token found. Please log in again.',
      });
      return;
    }

    try {
      console.log('Making request to upload-mcq endpoint...'); // Debug log
      const response = await fetch('http://localhost:5000/exams/upload-mcq', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      console.log('Response status:', response.status); // Debug log
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData); // Debug log
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const data = await response.json();
      console.log('Success response:', data); // Debug log

      const newQuestions = data.questions.map((q: any, index: number) => ({
        id: `q${Date.now()}-${index}`,
        text: q.text,
        type: 'multiple-choice',
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points || 5, // Use the points from the parsed question, default to 5 if not specified
      }));
      setQuestions([...questions, ...newQuestions]);
      setSelectedFile(null);
      toast({
        title: 'Questions Added',
        description: 'Questions from the document have been added.',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload and process the file.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Data</h2>
        <p className="mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

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
                const classData = classes.find(c => c.id === exam.classId);
                const totalStudents = classData?.studentIds.length || 0;
                
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
                          <span className="text-muted-foreground">Students:</span>
                          <span>{exam.studentIds.length}</span>
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
                        {classes.map((classItem) => (
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
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept=".doc,.docx"
                          onChange={handleFileChange}
                          className="cursor-pointer"
                        />
                      </div>
                      <Button
                        onClick={handleUploadQuestions}
                        disabled={!selectedFile}
                        className="flex items-center"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload MCQ Questions
                      </Button>
                    </div>
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected file: {selectedFile.name}
                      </p>
                    )}
                  </div>
                  
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

