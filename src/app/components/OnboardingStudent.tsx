import React, { useState } from "react";
import {
  Text,
  Dropdown,
  Option,
  Card,
  Button,
  Input,
  Spinner,
} from "@fluentui/react-components";
import { registerStudentRequest } from "../services/api";
import { useNavigate } from "react-router-dom";

export function OnboardingStudent() {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [classLetter, setClassLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const years = ["3", "4", "5", "6", "7", "8", "9"];
  const classes = ["A", "B", "C", "D", "E"];

  const handleSubmit = async () => {
    if (isSubmitted) return;
    
    try {
      setIsSubmitting(true);
      await registerStudentRequest({
        name,
        year,
        classLetter,
        timestamp: new Date().toISOString()
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: "200px"
  };

  const formGroupStyle = {
    display: "grid",
    gridTemplateColumns: "100px 1fr",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1rem"
  };

  return (
    <div style={{ padding: "2rem", backgroundColor: "#f9f9f9", borderRadius: "8px", textAlign: "center" }}>
      <Card style={{ maxWidth: 420, margin: "2rem auto", padding: "2rem" }}>
        <Text size={700} weight="bold" style={{ color: "#ff6f61" }}>
          🚫 Ainda não estás registado!
        </Text>
        <Text style={{ marginTop: "1.5rem", fontSize: "1.2rem", color: "#555", display: "block" }}>
          Fala com o teu professor para participares :)
        </Text>

        <div style={{ marginTop: "2rem", textAlign: "left" }}>
          <Text size={500} weight="semibold" style={{ marginBottom: "1rem" }}>
            Quero participar!
          </Text>
          <br />
          <br />
          
          {isSubmitted ? (
            <div style={{ textAlign: "center", padding: "1rem" }}>
              <Text size={500} style={{ color: "#107C10" }}>
                ✅ Pedido enviado com sucesso!
              </Text>
              <Text style={{ marginTop: "1rem", color: "#555" }}>
                <br></br>O teu professor irá processar o teu pedido em breve.
              </Text>
            </div>
          ) : (
            <>
              <div style={formGroupStyle}>
                <Text size={400}>Nome:</Text>
                <Input
                  value={name}
                  onChange={(_, data) => setName(data.value)}
                  placeholder="Escreve o teu nome"
                  style={inputStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <Text size={400}>Ano:</Text>
                <Dropdown
                  value={year}
                  onOptionSelect={(_, data) => setYear(data.optionText || "")}
                  style={inputStyle}
                >
                  {years.map((y) => (
                    <Option key={y} text={y}>
                      {y}º ano
                    </Option>
                  ))}
                </Dropdown>
              </div>

              <div style={formGroupStyle}>
                <Text size={400}>Turma:</Text>
                <Dropdown
                  value={classLetter}
                  onOptionSelect={(_, data) => setClassLetter(data.optionText || "")}
                  style={inputStyle}
                >
                  {classes.map((c) => (
                    <Option key={c} text={c}>
                      Turma {c}
                    </Option>
                  ))}
                </Dropdown>
              </div>

              <Button
                appearance="primary"
                onClick={handleSubmit}
                disabled={!name || !year || !classLetter || isSubmitting || isSubmitted}
                style={{ width: "100%", marginTop: "1rem" }}
              >
                {isSubmitting ? <Spinner size="tiny" /> : "Enviar Pedido"}
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}