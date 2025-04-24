import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  Divider,
  Dropdown,
  Text,
  Table,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
  TableHeaderCell,
  Option
} from "@fluentui/react-components";
import {
  Book20Regular,
  PeopleCommunity20Regular,
  CheckmarkCircle20Regular,
  Star20Regular,
  Trophy20Regular,
} from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";

// Mock Data (Replace with API Calls)
const studentData = {
  currentBook: "Harry Potter and the Sorcerer’s Stone",
  badges: ["First Book!", "5 Books Read!", "Reading Streak: 7 Days"],
  readingStreak: 7,
  leaderboard: [
    { name: "Alice", booksRead: 10 },
    { name: "Bob", booksRead: 8 },
    { name: "You", booksRead: 6 },
  ],
};

const teacherData = {
  classProgress: 75, // 75% students actively reading
  recentLogs: [
    { student: "Alice", book: "1984" },
    { student: "Bob", book: "The Hobbit" },
    { student: "Charlie", book: "The Catcher in the Rye" },
  ],
  challenges: ["Read 3 Books This Month", "Finish a Classic Novel"],
};

// User role options
// Define role type explicitly
type UserRole = "student" | "teacher";

// Role options
const roleOptions: { key: UserRole; text: string }[] = [
  { key: "student", text: "Student 👦" },
  { key: "teacher", text: "Teacher 👩‍🏫" },
];
export function WelcomeTab({ onRoleSelect }: { onRoleSelect: (role: UserRole) => void }) {
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole);
      navigate(selectedRole === "student" ? "/student-dashboard" : "/teacher-dashboard");
    }
  };

  return (
    <div style={{ padding: "1.6rem", textAlign: "center" }}>
      <h2>👤 Choose Your Role</h2>
      <Dropdown
        placeholder="Select your role..."
        value={selectedRole}
        onOptionSelect={(_, data) => {
          if (data.optionValue) setSelectedRole(data.optionValue as UserRole);
        }}
        style={{ width: "60%", marginBottom: "1rem" }}
      >
        {roleOptions.map((role) => role.text.charAt(0).toUpperCase() + role.text.slice(1))}
      </Dropdown>

      <Button
        icon={<CheckmarkCircle20Regular />}
        appearance="primary"
        disabled={!selectedRole}
        onClick={handleContinue}
      >
        Continue as {selectedRole === "student" ? "Student 👦" : "Teacher 👩‍🏫"}
      </Button>
    </div>
  );
}
