import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardFooter,
  Divider,
  Table,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
  TableHeaderCell,
  ProgressBar,
  Input,
} from "@fluentui/react-components";
import {
  
  Trophy20Regular,
  Add20Regular,
  ClipboardTask20Regular,
} from "@fluentui/react-icons";

// Mock Data (Replace with API Calls)
const studentProfile = {
  booksRead: 20,
  pagesPerWeek: 150,
  streak: 10,
  achievements: ["First Book Read", "5 Books Milestone", "30-Day Streak"],
  personalGoals: ["Read 2 books this month", "Finish 50 pages per day"],
};

const teacherProfile = {
  studentInsights: [
    { student: "Alice", booksRead: 12, streak: "5 Days" },
    { student: "Bob", booksRead: 9, streak: "3 Days" },
  ],
  classPerformance: {
    avgBooksPerStudent: 8,
    topReader: "Alice (12 books)",
  },
};

export function ProfileTab({ userRole }: { userRole: "student" | "teacher" }) {
  const [newGoal, setNewGoal] = useState("");

  return (
    <div style={{ padding: "1.6rem" }}>
      <h1>📊 Reading Profile & Insights</h1>
      <Divider />

      {/* Student View */}
      {userRole === "student" && (
        <>
          {/* Reading Statistics */}
          <h2>📊 Your Reading Stats</h2>
          <Card>
            <CardHeader
              header={`📚 Books Read: ${studentProfile.booksRead}`}
            />
            <CardHeader
              header={`📖 Pages Per Week: ${studentProfile.pagesPerWeek}`}
            />
            <CardHeader
              header={`🔥 Reading Streak: ${studentProfile.streak} Days`}
            />
          </Card>

          {/* Achievements */}
          <h2>🎖 Achievements Unlocked</h2>
          {studentProfile.achievements.map((achievement, index) => (
            <Card key={index} style={{ marginBottom: "1rem" }}>
              <CardHeader header={`🏅 ${achievement}`} />
            </Card>
          ))}

          {/* Personal Reading Goals */}
          <h2>📝 Personal Reading Goals</h2>
          {studentProfile.personalGoals.map((goal, index) => (
            <Card key={index} style={{ marginBottom: "1rem" }}>
              <CardHeader header={`📌 ${goal}`} />
            </Card>
          ))}
          <Input
            placeholder="Set a new reading goal..."
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            style={{ width: "100%", marginBottom: "1rem" }}
          />
          <Button icon={<Add20Regular />} appearance="primary">
            Add Goal
          </Button>
        </>
      )}

      {/* Teacher View */}
      {userRole === "teacher" && (
        <>
          {/* Student Insights */}
          <h2>📌 Student Insights</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Student</TableHeaderCell>
                <TableHeaderCell>Books Read</TableHeaderCell>
                <TableHeaderCell>Streak</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacherProfile.studentInsights.map((student, index) => (
                <TableRow key={index}>
                  <TableCell>{student.student}</TableCell>
                  <TableCell>{student.booksRead}</TableCell>
                  <TableCell>{student.streak}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Class Performance Dashboard */}
          <h2>📊 Class Performance</h2>
          <Card>
            <CardHeader
              header={`📚 Avg Books Per Student: ${teacherProfile.classPerformance.avgBooksPerStudent}`}
            />
            <CardHeader
              header={`🏆 Top Reader: ${teacherProfile.classPerformance.topReader}`}
            />
          </Card>

          {/* Parent Reports (Optional) */}
          <h2>📑 Generate Parent Reports</h2>
          <Button icon={<ClipboardTask20Regular />} appearance="primary">
            Generate Report
          </Button>
        </>
      )}
    </div>
  );
}
