import React, { useState } from "react";
import {
  Text,
  Dropdown,
  Option,
  Card,
  Button,
  Checkbox,
  Spinner,
} from "@fluentui/react-components";
import { getCurricularBooksByGrade, registerStudentAndBooks } from "../services/api";
import { useNavigate } from "react-router-dom";

export function OnboardingStudent() {
  return (
    <div style={{ padding: "2rem", backgroundColor: "#f9f9f9", borderRadius: "8px", textAlign: "center" }}>
      <Card style={{ maxWidth: 420, margin: "2rem auto", padding: "2rem" }}>
        <Text size={700} weight="bold" style={{ color: "#ff6f61" }}>
          🚫 Você ainda não está registrado!
        </Text>
        <Text style={{ marginTop: "1.5rem", fontSize: "1.2rem", color: "#555", display: "block" }}>
          Fale com seu professor para participar :)
        </Text>
      </Card>
    </div>
  );
}