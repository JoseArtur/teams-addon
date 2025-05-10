import React, { useEffect, useState } from "react";
import {
  Card, Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell,
  Dropdown, Option, Button, Text, Badge, Dialog, DialogSurface, DialogBody, DialogTitle, DialogActions, Textarea, Input
} from "@fluentui/react-components";
import { getClasses, getAlunosEscolhidos, patchQuizAnswer, getStudentQuizzes } from "../services/api";
import { useLocation, useNavigate } from "react-router-dom";
import { getTeacherQuiz, setTeacherQuiz, deleteTeacherQuiz, getTeacherQuizById } from "../services/api";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export function TeacherEscolhidosDashboard({ email }: { email: string }) {
  
  const [turmas, setTurmas] = useState<any[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<any>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);

  const [quizEditOpen, setQuizEditOpen] = useState(false);
  const [editingTerco, setEditingTerco] = useState<number | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<string[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [perguntasQuiz, setPerguntasQuiz] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Carrega turmas do professor
  useEffect(() => {
    async function loadTurmas() {
      const turmasBE = await getClasses(email);
      setTurmas(turmasBE);

      // Usa turma do state de navegação, se existir
      if (location.state?.turmaSelecionada) {
        const turmaNav = turmasBE.find(
          (t: any) =>
            t.grade === location.state.turmaSelecionada.grade &&
            t.turma === location.state.turmaSelecionada.turma
        );
        setTurmaSelecionada(turmaNav || turmasBE[0] || null);
      } else {
        setTurmaSelecionada(turmasBE[0] || null);
      }
    }
    loadTurmas();
  }, [email, location.state]);

  // Redireciona para TeacherDashboard se selecionar turma do 3º ou 4º ano
  useEffect(() => {
    if (
      turmaSelecionada &&
      ["3", "4"].includes(String(turmaSelecionada.grade))
    ) {
      navigate("/teacher-dashboard", { state: { email } });
    }
  }, [turmaSelecionada, navigate]);

  // Busca alunos da turma selecionada
  useEffect(() => {
    if (turmaSelecionada) {
      getAlunosEscolhidos(turmaSelecionada.grade, turmaSelecionada.turma).then(setAlunos);
    }
  }, [turmaSelecionada]);

  const handleEditQuiz = async (terco: number) => {
    setEditingTerco(terco);
    setQuizLoading(true);
    try {
      console.log("turmaSelecionada", turmaSelecionada);
      const result: { perguntas: string[] } = await getTeacherQuiz({
        grade: turmaSelecionada?.grade,
        turma: turmaSelecionada?.turma,
        terco,
      });
      console.log('result', result);
      
      setQuizQuestions(result.perguntas || [""]);
    } catch {
      setQuizQuestions([""]);
    }
    setQuizLoading(false);
    setQuizEditOpen(true);
  };

  // Salvar perguntas do quiz
  const handleSaveQuizQuestions = async () => {
    if (!turmaSelecionada || editingTerco == null) return;
    await setTeacherQuiz({
      grade: turmaSelecionada.grade,
      turma: turmaSelecionada.turma,
      terco: editingTerco.toString(),
      perguntas: quizQuestions.filter(q => q.trim() !== ""),
      professorEmail: email,
    });
    setQuizEditOpen(false);
    setEditingTerco(null);
  };

  // Excluir quiz do terço
  const handleDeleteQuiz = async () => {
    if (!turmaSelecionada || editingTerco == null) return;
    await deleteTeacherQuiz({
      grade: turmaSelecionada.grade,
      turma: turmaSelecionada.turma,
      terco: editingTerco,
    });
    setQuizEditOpen(false);
    setEditingTerco(null);
  };

  const handleShowQuiz = async (quizId: string, alunoEmail?: string) => {
    console.log("quizId", quizId);
    // Busca o quiz (perguntas, etc)
    const quizMeta = await getTeacherQuizById(quizId);
    console.log("quizMeta", quizMeta);
    // Busca respostas do aluno
    let respostaAluno = null;
    if (alunoEmail) {
      try {
        const respostas = await import("../services/api").then(m => m.getAnsweredEscolhidoQuizzes(alunoEmail));
        respostaAluno = respostas.find((r: any) => r.quizId === quizId || r.id === quizId);
      } catch (e) {
        respostaAluno = null;
      }
    }
    // Monta objeto para o dialog
    setSelectedQuiz({
      ...quizMeta,
      respostas: respostaAluno?.respostas || [],
      alunoNome: respostaAluno?.alunoNome || respostaAluno?.nome || undefined,
      fase: respostaAluno?.capitulo || quizMeta?.terco || quizMeta?.fase,
      nota: respostaAluno?.nota,
      comentario: respostaAluno?.comentario,
      anulado: respostaAluno?.anulado,
      id: respostaAluno?.id || quizMeta?.id,
    });
    setShowQuizDialog(true);
  };

  const pontosData = {
    labels: alunos.map((a: any) => a.nome),
    datasets: [
      {
        label: "Pontos",
        data: alunos.map((a: any) => a.pontos ?? 0),
        backgroundColor: "#0078D4",
      },
    ],
  };

  // Dados para gráfico de quizzes respondidos por terço
  
  const quizzesPorTerco = [1, 2, 3].map((terco) =>
    alunos.filter((a: any) =>
      a.quizzes?.find((q: any) => q.fase === terco && q.respostas && q.respostas.length > 0)
    ).length
  );
  const quizzesData = {
    labels: ["Quiz 1", "Quiz 2", "Quiz Final"],
    datasets: [
      {
        label: "Quizzes Respondidos",
        data: quizzesPorTerco,
        backgroundColor: "#FFAA44",
      },
    ],
  };

  useEffect(() => {
    if (selectedQuiz?.quizId) {
      getTeacherQuizById(selectedQuiz.quizId)
        .then((quiz) => {
          setQuizQuestions(quiz.perguntas || []);
        })
        .catch((error) => {
          console.error("Error fetching quiz questions:", error);
          setQuizQuestions([]);
        });
    } else {
      setQuizQuestions([]);
    }
  }, [selectedQuiz?.quizId]);

  return (
    <div style={{ padding: 32 }}>
    <Text size={700} weight="bold">👨‍🏫 Painel de Livros Escolhidos</Text>

<div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
  <Button
    appearance="secondary"
    onClick={() =>
      navigate("/teacher-challenges", {
        state: { turmaSelecionada: turmaSelecionada, email },
      })
    }
  >
    Quizzes e Desafios
  </Button>
  {alunos && alunos.length > 0 && (
    <Dropdown
      placeholder="Ver como Aluno"
      onOptionSelect={(_, data) => {
        const student = alunos.find((s: any) => s.nome === data.optionValue);
        if (student) {
          navigate("/student-dashboard", { 
            state: { 
              studentInfo: {
                email: student.email,
                name: student.nome,
                grade: turmaSelecionada.grade,
                turma: turmaSelecionada.turma
              },
              isTeacherView: true
            }
          });
        }
      }}
    >
      {alunos.map((student: any) => (
        <Option key={student.email} value={student.nome}>
          {student.nome}
        </Option>
      ))}
    </Dropdown>
  )}
</div>
      <div style={{ display: "flex", gap: 16, margin: "24px 0" }}>
        <Dropdown
          value={turmaSelecionada ? `${turmaSelecionada.grade} - ${turmaSelecionada.turma}` : ""}
          onOptionSelect={(_, d) => {
            const t = turmas.find((t: any) => `${t.grade} - ${t.turma}` === d.optionValue);
            setTurmaSelecionada(t);
          }}
        >
          {turmas.map(t => (
            <Option key={`${t.grade}-${t.turma}`} value={`${t.grade} - ${t.turma}`} text={`${t.grade} - ${t.turma}`}>
              {t.grade} - {t.turma}
            </Option>
          ))}
        </Dropdown>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Button
            appearance="primary"
            onClick={() => handleEditQuiz(3)}
            disabled={!turmaSelecionada}
          >
            Editar Quiz Final
          </Button>
      </div>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Aluno</TableHeaderCell>
              <TableHeaderCell>Livros</TableHeaderCell>
              <TableHeaderCell>Progresso</TableHeaderCell>
              <TableHeaderCell>Pontos</TableHeaderCell>
              <TableHeaderCell>Quiz Final</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.map((aluno: any) => (
              <TableRow key={aluno.email}>
                <TableCell>
                  <Button
                    appearance="subtle"
                    style={{ padding: 0, minWidth: 0, color: "#0078D4", textDecoration: "underline", background: "none" }}
                    onClick={() =>
                      navigate("/aluno", {
                        state: {
                          aluno,
                          grade: turmaSelecionada?.grade,
                          turma: turmaSelecionada?.turma,
                        },
                      })
                    }
                  >
                    {aluno.nome}
                  </Button>
                </TableCell>
                <TableCell>
                  {aluno.livros?.map((livro: any) => (
                    <div key={livro.id} style={{ marginBottom: 8 }}>
                      <Text>{livro.titulo}</Text>
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  {aluno.livros?.map((livro: any) => (
                    <div key={livro.id} style={{ marginBottom: 8 }}>
                      <Text>{livro.progresso}%</Text>
                    </div>
                  ))}
                </TableCell>
                <TableCell>{aluno.pontos ?? 0}</TableCell>
                <TableCell>
                  {aluno.livros?.map((livro: any) => {
                    if (!livro.quiz) return <Badge key={livro.id} appearance="outline" color="danger">❌ Não respondido</Badge>;
                    if (livro.quiz.anulado) return <Badge key={livro.id} appearance="outline" color="danger">✏️ Anulado</Badge>;
                    if (livro.quiz.nota) return <Badge key={livro.id} appearance="filled" color="brand">✅ Avaliado</Badge>;
                    return <Badge key={livro.id} appearance="outline" color="warning">🟡 Aguardando avaliação</Badge>;
                  })}
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", gap: 8 }}>
                    {aluno.livros?.map((livro: any) => {
                      if (!livro.quiz) return null;
                      return (
                <Button
                          key={livro.id}
      size="small"
                          onClick={() => handleShowQuiz(livro.quiz.quizId, aluno.email)}
    >
                          Ver Quiz de {livro.titulo}
                        </Button>
                      );
                    })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog para ver/corrigir respostas */}
      <Dialog open={showQuizDialog} onOpenChange={(_, d) => {
  if (!d.open) {
    setShowQuizDialog(false);
    setSelectedQuiz(null);
  }
}}>
  <DialogSurface>
    <DialogBody>
      <DialogTitle>
        Respostas de {selectedQuiz?.alunoNome || selectedQuiz?.nome || "-"}
      </DialogTitle>
      {selectedQuiz && (
        <Card style={{ margin: "16px 0" }}>
          <Text weight="semibold">
            Quiz {selectedQuiz.fase}
          </Text>
          <div style={{ margin: "8px 0" }}>
                  {selectedQuiz.respostas?.map((resp: string, i: number) => {
                    const question = selectedQuiz.perguntas?.[i] || `Pergunta ${i + 1}`;
                    return (
              <div key={i} style={{ marginBottom: 8 }}>
                        <Text weight="semibold">{question}:</Text>
                <Textarea value={resp} readOnly style={{ width: "100%", minHeight: 60 }} />
              </div>
                    );
                  })}
          </div>
          <div style={{ margin: "8px 0" }}>
            <Dropdown
              value={selectedQuiz.nota || ""}
                    onOptionSelect={(_, d) => {
                      setSelectedQuiz((prev: any) => ({ 
                        ...prev, 
                        nota: d.optionValue,
                        anulado: d.optionValue === "reprovado"
                      }));
                    }}
            >
              <Option value="aprovado">✅ Aprovado</Option>
              <Option value="correcao">⚠️ Requer correção</Option>
              <Option value="reprovado">❌ Reprovado</Option>
            </Dropdown>
            <Input
              placeholder="Comentário do professor"
              value={selectedQuiz.comentario || ""}
                    onChange={(_, data) => {
                      setSelectedQuiz((prev: any) => ({ ...prev, comentario: data.value }));
                    }}
            />
                  {selectedQuiz.anulado && (
                    <Badge appearance="outline" color="danger" style={{ marginLeft: 8 }}>Pontos anulados</Badge>
                  )}
                  <Button 
                    appearance="primary" 
                    style={{ marginLeft: 8 }}
                    onClick={async () => {
                      await patchQuizAnswer(selectedQuiz.id, {
                        nota: selectedQuiz.nota,
                        comentario: selectedQuiz.comentario,
                        anulado: selectedQuiz.anulado
                      });
                      if (turmaSelecionada) {
                        const updatedAlunos = await getAlunosEscolhidos(turmaSelecionada.grade, turmaSelecionada.turma);
                        setAlunos(updatedAlunos);
                      }
                      setShowQuizDialog(false);
                    }}
                  >
                    Confirmar
            </Button>
          </div>
        </Card>
      )}
      <DialogActions>
              <Button onClick={async () => {
                setShowQuizDialog(false);
                if (turmaSelecionada) {
                  const updatedAlunos = await getAlunosEscolhidos(turmaSelecionada.grade, turmaSelecionada.turma);
                  setAlunos(updatedAlunos);
                }
              }}>Fechar</Button>
      </DialogActions>
    </DialogBody>
  </DialogSurface>
</Dialog>
      {/* Dialog para editar quiz */}
      <Dialog open={quizEditOpen} onOpenChange={(_, d) => !d.open && setQuizEditOpen(false)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              {editingTerco
                ? `Quiz Final — Turma ${turmaSelecionada?.grade} - ${turmaSelecionada?.turma}`
                : "Editar Quiz"}
            </DialogTitle>
            {quizLoading ? (
              <Text>Carregando...</Text>
            ) : (
              <div>
                {quizQuestions.map((q, idx) => (
                  <div key={idx} style={{ marginBottom: 12 }}>
                    <Text weight="semibold">Pergunta {idx + 1}</Text>
                    <Textarea
                      value={q}
                      onChange={e => {
                        const arr = [...quizQuestions];
                        arr[idx] = e.target.value;
                        setQuizQuestions(arr);
                      }}
                      style={{ width: "100%", minHeight: 40 }}
                    />
                  </div>
                ))}
                <Button
                  size="small"
                  onClick={() => setQuizQuestions([...quizQuestions, ""])}
                  style={{ marginBottom: 12 }}
                >
                  + Adicionar Pergunta
                </Button>
              </div>
            )}
            <DialogActions>
              <Button onClick={() => setQuizEditOpen(false)}>Cancelar</Button>
              <Button appearance="secondary" onClick={handleDeleteQuiz} disabled={quizLoading}>
                Excluir Quiz
              </Button>
              <Button appearance="primary" onClick={handleSaveQuizQuestions} disabled={quizLoading}>
                Salvar
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <div style={{ display: "flex", gap: 32,flexDirection: "column",  margin: "24px 0" }}>
      <div style={{ width: "80%"}}>
        <Text weight="semibold">Pontos por Aluno</Text>
        <Bar data={pontosData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </div>
      <div style={{  width: "80%" }}>
        <Text weight="semibold">Quizzes Respondidos por Terço</Text>
        <Bar data={quizzesData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </div>
    </div>
    </div>
  );
}