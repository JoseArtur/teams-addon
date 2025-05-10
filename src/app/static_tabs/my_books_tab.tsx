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


export function MyBooksTab({ userRole }: { userRole: "student" | "teacher" }) {
  const [selectedRow, setSelectedRow] = useState<TableRowId | null>(null);

  return (
    <div style={{ padding: "1.6rem" }}>
      <h1>📚</h1>
      <Divider />

    </div>
  );
}
