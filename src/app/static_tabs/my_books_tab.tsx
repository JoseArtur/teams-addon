import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardFooter,
  CardPreview,
  Divider,
  Image,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableCellLayout,
  TableRowId,
} from "@fluentui/react-components";
import { Add20Regular, CheckmarkCircle20Regular } from "@fluentui/react-icons";

// Mock Data (Replace with API Calls)
const studentBooks = {
  currentlyReading: [
    { title: "Harry Potter", author: "J.K. Rowling", progress: "50%" },
    { title: "Percy Jackson", author: "Rick Riordan", progress: "30%" },
  ],
  completedBooks: [
    { title: "1984", author: "George Orwell", rating: 5 },
    { title: "The Hobbit", author: "J.R.R. Tolkien", rating: 4 },
  ],
  wantToRead: [
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
    { title: "Moby Dick", author: "Herman Melville" },
  ],
};

const teacherData = {
  studentLogs: [
    { student: "Alice", book: "1984", status: "Pending" },
    { student: "Bob", book: "The Hobbit", status: "Approved" },
  ],
  topBooks: ["1984", "The Hobbit", "Harry Potter"],
};

export function MyBooksTab({ userRole }: { userRole: "student" | "teacher" }) {
  const [selectedRow, setSelectedRow] = useState<TableRowId | null>(null);

  return (
    <div style={{ padding: "1.6rem" }}>
      <h1>📚 My Books</h1>
      <Divider />

      {/* Student View */}
      {userRole === "student" && (
        <>
          <Button
            icon={<Add20Regular />}
            appearance="primary"
            style={{ margin: "1rem 0" }}
          >
            Add a New Book
          </Button>

          {/* Currently Reading */}
          <h2>📖 Currently Reading</h2>
          {studentBooks.currentlyReading.map((book, index) => (
            <Card key={index} style={{ marginBottom: "1rem" }}>
              <CardHeader
                header={book.title}
                description={`by ${book.author} - Progress: ${book.progress}`}
              />
            </Card>
          ))}

          {/* Completed Books */}
          <h2>✅ Completed Books</h2>
          {studentBooks.completedBooks.map((book, index) => (
            <Card key={index} style={{ marginBottom: "1rem" }}>
              <CardHeader
                header={book.title}
                description={`by ${book.author} - Rating: ⭐ ${book.rating}/5`}
              />
            </Card>
          ))}

          {/* Want to Read */}
          <h2>🎯 Want to Read</h2>
          {studentBooks.wantToRead.map((book, index) => (
            <Card key={index} style={{ marginBottom: "1rem" }}>
              <CardHeader header={book.title} description={`by ${book.author}`} />
            </Card>
          ))}
        </>
      )}

      {/* Teacher View */}
      {userRole === "teacher" && (
        <>
          {/* Monitor Student Reading Logs */}
          <h2>👀 Student Reading Logs</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Student</TableHeaderCell>
                <TableHeaderCell>Book</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacherData.studentLogs.map((log, index) => (
                <TableRow key={index} id={index.toString()}>
                <TableCell>{log.student}</TableCell>
                  <TableCell>{log.book}</TableCell>
                  <TableCell>{log.status}</TableCell>
                  <TableCell>
                    {log.status === "Pending" && (
                      <Button
                        icon={<CheckmarkCircle20Regular />}
                        appearance="primary"
                        onClick={() => alert(`Approved ${log.book} for ${log.student}`)}
                      >
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Track Reading Trends */}
          <h2>📊 Most Read Books</h2>
          {teacherData.topBooks.map((book, index) => (
            <Card key={index} style={{ marginBottom: "1rem" }}>
              <CardHeader header={book} />
            </Card>
          ))}

          {/* Export Reports */}
          <Button appearance="secondary" style={{ marginTop: "1rem" }}>
            📤 Export Reports
          </Button>
        </>
      )}
    </div>
  );
}
