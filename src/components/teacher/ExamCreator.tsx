
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarIcon,
  Clock,
  FilePlus,
  Plus,
  Save,
  Trash2,
  X,
  ClipboardCheck,
  ClipboardList,
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
import { Class, Question } from "@/types";

// Mock classes
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

export const ExamCreator: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
    // Reset current question
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
    
    // In a real app, you would send this data to your API
    toast({
      title: "Exam Created",
      description: "The exam has been created successfully.",
    });
    
    navigate("/dashboard/exams");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Create Exam</h2>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
            <CardDescription>
              Set the basic information for your exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Exam Title</FormLabel>
              <Input 
                placeholder="e.g. Midterm Mathematics Exam"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <FormLabel>Description (Optional)</FormLabel>
              <Textarea 
                placeholder="Add a description for your exam"
                value={examDescription}
                onChange={(e) => setExamDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <FormLabel>Class</FormLabel>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {mockClasses.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <FormLabel>Duration (minutes)</FormLabel>
              <Input 
                type="number"
                placeholder="60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
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
                <FormLabel>Start Time</FormLabel>
                <Input 
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
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
                <FormLabel>End Time</FormLabel>
                <Input 
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
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
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Add Question</CardTitle>
          <CardDescription>
            Create a new question for the exam
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Question Type</FormLabel>
              <RadioGroup
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
              <FormLabel>Question Text</FormLabel>
              <Textarea
                placeholder="Enter your question here"
                value={currentQuestion.text}
                onChange={(e) =>
                  setCurrentQuestion({ ...currentQuestion, text: e.target.value })
                }
              />
            </div>
            
            <div className="space-y-2">
              <FormLabel>Points</FormLabel>
              <Input
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
                <FormLabel>Options</FormLabel>
                <div className="space-y-2">
                  {currentQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={index.toString()}
                        id={`option-${index}`}
                        checked={currentQuestion.correctAnswer === index}
                        onClick={() =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            correctAnswer: index,
                          })
                        }
                      />
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
                <FormLabel>Correct Answer</FormLabel>
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
        </CardContent>
        <CardFooter>
          <div className="flex w-full justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/exams")}
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
    </div>
  );
};

export default ExamCreator;
