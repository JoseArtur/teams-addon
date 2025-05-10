import React, { useState, useEffect } from "react";
import {
  Card,
  Divider,
  Spinner,
  Text,
  Badge,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from "@fluentui/react-components";
import { getDesafios, getClassStudents, removerDesafio } from "../services/api";
import { useNavigate } from "react-router-dom";
import { TeacherDesafioForm } from "./TeacherDesafioForm";
import { Delete24Regular } from "@fluentui/react-icons";

export function TeacherChallengesTab({ grade, turma, email}: { grade: string; turma: string, email: string }) {
  const [desafios, setDesafios] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const alunos = await getClassStudents(grade, turma);
        setStudents(alunos);
        const dsf = await getDesafios(grade, turma);
        setDesafios(dsf);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [grade, turma]);

  const handleRemoveDesafio = async (desafioId: string) => {
    try {
      await removerDesafio(desafioId);
      setDesafios(desafios.filter((d: any) => d.id !== desafioId));
    } catch (err) {
      console.error("Erro ao remover desafio:", err);
      // You might want to show an error message to the user here
    }
  };

  const handleDesafioCreated = async () => {
    setShowCreateDialog(false);
    try {
      const dsf = await getDesafios(grade, turma);
      setDesafios(dsf);
    } catch (error) {
      console.error("Error refreshing challenges:", error);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <Button
        appearance="secondary"
        onClick={() => navigate("/teacher-escolhidos", { state: { email: email, turmaSelecionada: { grade, turma } } })}
        style={{ marginBottom: 16 }}
      >
        ← Voltar para Painel de Livros Escolhidos
      </Button>
      <Divider />
      <h1>🏁 Gerenciar Desafios de Leitura</h1>
      <Divider />

      <Button appearance="primary" onClick={() => setShowCreateDialog(true)} style={{ margin: "16px 0" }}>
        ➕ Criar novo desafio
      </Button>

      {showCreateDialog && (  
        <TeacherDesafioForm
          turma={turma}
          ano={grade}
          teacherEmail={email}
          onDesafioCreated={handleDesafioCreated}
        />
      )}

      {/* Desafios agendados */}
      <Card style={{ margin: "1rem 0", padding: 16 }}>
        <Text weight="semibold">📅 Desafios Agendados</Text>
        {loading ? (
          <Spinner />
        ) : (
          desafios.length === 0 ? (
            <Text>Nenhum desafio cadastrado.</Text>
          ) : (
            desafios.map((d) => (
              <Card key={d.id} style={{ marginBottom: "1rem", padding: 12 }}>
                <Text size={500} weight="semibold">{d.titulo}</Text>
                <div><b>Descrição:</b> {d.descricao}</div>
                <div><b>Tipo:</b> {d.tipo === "geral" ? "Geral" : "Livro Específico"}</div>
                {d.livroId && <div><b>Livro ID:</b> {d.livroId}</div>}
                <div><b>Data de Início:</b> {new Date(d.dataInicio).toLocaleDateString()}</div>
                <div><b>Data de Fim:</b> {new Date(d.dataFim).toLocaleDateString()}</div>
                <div><b>Meta:</b> {d.meta.points} {d.meta.tipo}</div>
                <div><b>Badge:</b> {d.badge.nome} ({d.badge.id})</div>
                <div style={{ marginTop: 8 }}>
                  <Button
                    appearance="subtle"
                    icon={<Delete24Regular />}
                    onClick={() => handleRemoveDesafio(d.id)}
                  >
                    Remover
                  </Button>
                </div>
              </Card>
            ))
          )
        )}
      </Card>
    </div>
  );
}