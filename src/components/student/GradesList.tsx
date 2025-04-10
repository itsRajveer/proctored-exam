
import React from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, TrendingUp } from "lucide-react";

// Mock data
const mockGrades = [
  {
    id: "g1",
    examId: "e1",
    examTitle: "Mid-term Mathematics",
    date: "2025-03-15",
    score: 85,
    totalPoints: 100,
    percentage: 85,
    grade: "B",
    feedback: "Good work on the algebraic equations. Work on geometry concepts."
  },
  {
    id: "g2",
    examId: "e2",
    examTitle: "Introduction to Physics",
    date: "2025-03-05",
    score: 92,
    totalPoints: 100,
    percentage: 92,
    grade: "A",
    feedback: "Excellent understanding of mechanics principles."
  },
  {
    id: "g3",
    examId: "e3",
    examTitle: "English Literature Quiz",
    date: "2025-02-20",
    score: 78,
    totalPoints: 100,
    percentage: 78,
    grade: "C",
    feedback: "Good analysis of themes. Work more on character development interpretation."
  },
  {
    id: "g4",
    examId: "e4",
    examTitle: "Chemistry Lab Test",
    date: "2025-02-10",
    score: 88,
    totalPoints: 100,
    percentage: 88,
    grade: "B+",
    feedback: "Strong on lab procedures, need improvement on chemical equations."
  },
];

const chartData = [
  { name: "Mathematics", score: 85, average: 79 },
  { name: "Physics", score: 92, average: 75 },
  { name: "English", score: 78, average: 81 },
  { name: "Chemistry", score: 88, average: 76 },
];

const gradeDistribution = [
  { name: "A", value: 1 },
  { name: "B", value: 2 },
  { name: "C", value: 1 },
  { name: "D", value: 0 },
  { name: "F", value: 0 },
];

const COLORS = ["#4ade80", "#60a5fa", "#fb923c", "#f87171", "#a1a1aa"];

export const GradesList: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = React.useState("all");
  
  const totalExams = mockGrades.length;
  const averageScore = Math.round(
    mockGrades.reduce((acc, grade) => acc + grade.percentage, 0) / totalExams
  );
  
  const highestScore = Math.max(...mockGrades.map((grade) => grade.percentage));
  const lowestScore = Math.min(...mockGrades.map((grade) => grade.percentage));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">My Grades</h2>
        
        <Select
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="current">Current Semester</SelectItem>
            <SelectItem value="last">Last Semester</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Exams
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExams}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Highest Score
            </CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highestScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lowest Score
            </CardTitle>
            <div className="h-4 w-4 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowestScore}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison</CardTitle>
            <CardDescription>
              Your scores compared to class average
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#3b82f6" name="Your Score" />
                  <Bar dataKey="average" fill="#94a3b8" name="Class Average" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>
              Breakdown of your grade results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Results</CardTitle>
          <CardDescription>
            A detailed list of all your exam results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="hidden md:table-cell">Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockGrades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell>{grade.examTitle}</TableCell>
                  <TableCell>{new Date(grade.date).toLocaleDateString()}</TableCell>
                  <TableCell>{grade.score}/{grade.totalPoints} ({grade.percentage}%)</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div 
                        className={`h-2 w-2 rounded-full mr-2 ${
                          grade.grade === "A" ? "bg-green-500" :
                          grade.grade === "B" ? "bg-blue-500" :
                          grade.grade === "C" ? "bg-yellow-500" :
                          grade.grade === "D" ? "bg-orange-500" : "bg-red-500"
                        }`} 
                      />
                      {grade.grade}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate">
                    {grade.feedback}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradesList;
