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
  Input,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  Field,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import { updateQuiz, getDesafios, getClassStudents, getQuiz, getBooks, removeQuiz, removerDesafio, getAllQuizByBookId, getCompletedDesafios } from "../services/api";
import { TeacherDesafioForm } from "./TeacherDesafioForm";
import { useNavigate } from "react-router-dom";
export function TeacherQuizzesChallengesTab({ grade, turma, email }: { grade: string; turma: string; email: string }) {
  const [desafios, setDesafios] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [editQuizDialogOpen, setEditQuizDialogOpen] = useState(false);
  const [editQuizQuestions, setEditQuizQuestions] = useState<any[]>([]);
  const [editQuizCapitulo, setEditQuizCapitulo] = useState<number | null>(null);
  const [editQuizCurrentIdx, setEditQuizCurrentIdx] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, string[]>>({});
  const [editQuizLeituraDedicada, setEditQuizLeituraDedicada] = useState<string>("");
  const [editQuizDeadline, setEditQuizDeadline] = useState<string>("");
  const navigate = useNavigate();
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const livros = await getBooks(grade);
      console.log("livros", livros);
      setBooks(livros);
      setSelectedBook(livros[0]);
      try {
        const alunos = await getClassStudents(grade, turma);
        setStudents(alunos);
        const dsf = await getDesafios(grade, turma);
        setDesafios(dsf);

        // Fetch completed challenges for each student
        const completedChallengesMap: Record<string, string[]> = {};
        for (const aluno of alunos) {
          console.log("aluno", aluno);
          const completed = await getCompletedDesafios(aluno.email);
          completedChallengesMap[aluno.email] = completed.map((c: any) => c.desafioId);
        }
        setCompletedChallenges(completedChallengesMap);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [grade, turma]);

  useEffect(() => {
    async function fetchBookData() {
      if (!selectedBook) return;
      setLoading(true);
      // Desafios são gerais da turma, não por livro
      const dsf = await getDesafios(grade, turma);
      console.log("Desafios:", dsf);
      setDesafios(dsf);
      // Quizzes são por livro selecionado
      const quizzesData = await getAllQuizByBookId(selectedBook.id);
      setQuizzes(Array.isArray(quizzesData) ? quizzesData : quizzesData.perguntas || []);
      console.log("Quizzes:", quizzesData);
      setLoading(false);
    }
    if (selectedBook) fetchBookData();
  }, [selectedBook, grade, turma]);

  // Editar quiz (exemplo: abrir modal)
  const handleEditQuiz = (quiz: any) => {
    setEditingQuiz(quiz);
    setEditQuizQuestions(quiz.perguntas || []);
    setEditQuizCapitulo(quiz.capitulo);
    setEditQuizCurrentIdx(0);
    setEditQuizDialogOpen(true);
    
    // Set the dates from the selected book's chapter
    const chapter = selectedBook?.capitulos?.find((c: any) => c.historia === quiz.capitulo);
    if (chapter) {
      setEditQuizLeituraDedicada(chapter.leituraDedicada);
      setEditQuizDeadline(chapter.quizDeadline);
    }
  };

  const handlePrevQuestion = () => {
    setEditQuizCurrentIdx((prev) => Math.max(prev - 1, 0));
  };

  const handleNextQuestion = () => {
    setEditQuizCurrentIdx((prev) => Math.min(prev + 1, editQuizQuestions.length - 1));
  };

  // Salvar edição do quiz
  const handleSaveQuizEdit = async () => {
    if (!editingQuiz) return;
    await updateQuiz({
      id: editingQuiz.id,
      perguntas: editQuizQuestions,
      capitulo: editingQuiz.capitulo,
      livroId: selectedBook.id,
      bookId: selectedBook.id,
      ciclo: selectedBook.ciclo || "1",
      grade: grade,
    });
    setEditQuizDialogOpen(false);
    setEditingQuiz(null);
    // Atualize a lista de quizzes após salvar
    const quizzesData = await getAllQuizByBookId(selectedBook.id);
    setQuizzes(Array.isArray(quizzesData) ? quizzesData : quizzesData.perguntas || []);
  };

  // Adicionar nova pergunta
  const handleAddQuestion = () => {
    setEditQuizQuestions([
      ...editQuizQuestions,
      { enunciado: "", alternativas: ["", ""], correta: [] }
    ]);
  };
  
  // Adicionar alternativa à pergunta atual
  const handleAddAlternative = () => {
    const arr = [...editQuizQuestions];
    arr[editQuizCurrentIdx].alternativas.push("");
    setEditQuizQuestions(arr);
  };
  
  // Remover alternativa da pergunta atual (mínimo 2)
  const handleRemoveAlternative = (aIdx: number) => {
    const arr = [...editQuizQuestions];
    if (arr[editQuizCurrentIdx].alternativas.length > 2) {
      arr[editQuizCurrentIdx].alternativas.splice(aIdx, 1);
      // Remove índice da correta se necessário
      let corretas = arr[editQuizCurrentIdx].correta;
      if (Array.isArray(corretas)) {
        corretas = corretas.filter((idx: number) => idx !== aIdx).map((idx: number) => (idx > aIdx ? idx - 1 : idx));
        arr[editQuizCurrentIdx].correta = corretas;
      }
      setEditQuizQuestions(arr);
    }
  };
  
  const handleRemoveQuestion = (idx: number) => {
    const newQuestions = editQuizQuestions.filter((_, i) => i !== idx);
    setEditQuizQuestions(newQuestions);
    // Ajusta o índice para não ultrapassar o novo tamanho do array
    setEditQuizCurrentIdx((prev) => {
      if (newQuestions.length === 0) return 0;
      if (prev >= newQuestions.length) return newQuestions.length - 1;
      return prev;
    });
  };

  // Remover quiz
  const handleRemoveQuiz = async (quizId: string) => {
    await removeQuiz(quizId);
    setQuizzes(quizzes.filter((q: any) => q.id !== quizId));
  };

  // Remover desafio
  const handleRemoveDesafio = async (desafioId: string) => {
    await removerDesafio(desafioId);
    setDesafios(desafios.filter((d: any) => d.id !== desafioId));
  };

  const getAlunosDesafio = (desafioId: string) => {
    return {
      concluidos: students.filter((a: any) => completedChallenges[a.email]?.includes(desafioId)),
      pendentes: students.filter((a: any) => !completedChallenges[a.email]?.includes(desafioId)),
    };
  };

  const handleDesafioCreated = async () => {
    setShowCreateDialog(false);
    const dsf = await getDesafios(grade, turma);
    setDesafios(dsf);
  };
  
  return (
    <div style={{ padding: "2rem" }}>
      <h1>🏁 Gerenciar Quizzes e Desafios</h1>
      <Divider />
      <button
            style={{
                marginBottom: 16,
                marginRight: 16,
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: "#e5e5e5",
                cursor: "pointer",
                fontWeight: 500
            }}
            onClick={() => navigate("/teacher-dashboard")}
        >
            ← Voltar  
        </button>
      {/* Trocar livro */}
      <Field label="Livro">
        <Dropdown
          value={selectedBook?.titulo || selectedBook?.title || ""}
          onOptionSelect={(_, data) => {
            const livro = books.find((b: any) => b.titulo === data.optionValue || b.title === data.optionValue);
            setSelectedBook(livro);
          }}
        >
          {books.map((b: any) => (
            <Option key={b.id} value={b.titulo || b.title}>{b.titulo || b.title}</Option>
          ))}
        </Dropdown>
      </Field>

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

      {/* Quizzes por capítulo */}
      <Card style={{ margin: "1rem 0", padding: 16 }}>
        <Text weight="semibold">✏️ Quizzes deste livro</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Capítulo</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2}>Nenhum quiz cadastrado para este livro.</TableCell>
              </TableRow>
            ) : (
              quizzes.map((quiz: any) => (
                <TableRow key={quiz.id}>
                  <TableCell>Capítulo {quiz.capitulo}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleEditQuiz(quiz)}>
                      Editar
                    </Button>
                    <Button size="small" appearance="secondary" style={{ marginLeft: 8 }} onClick={() => handleRemoveQuiz(quiz.id)}>
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Desafios agendados */}
      <Card style={{ margin: "1rem 0", padding: 16 }}>
        <Text weight="semibold">📅 Desafios Agendados</Text>
        {loading ? (
          <Spinner />
        ) : (
          desafios.length === 0 ? (
            <Text>Nenhum desafio cadastrado.</Text>
          ) : (
            desafios.map((d) => {
              const alunos = getAlunosDesafio(d.id);
              return (
                <Card key={d.id} style={{ marginBottom: "1rem", padding: 12 }}>
                  <Text size={500} weight="semibold">{d.titulo}</Text>
                  <div><b>Capítulo:</b> {d.capitulo}</div>
                  <div><b>Descrição:</b> {d.descricao}</div>
                  <div><b>Tipo:</b> {d.tipo}</div>
                  <div><b>Livro:</b> {d.livroId}</div>
                  <div><b>Turma:</b> {d.turma}</div>
                  <div><b>Ano:</b> {d.grade}</div>
                  <div><b>Data de início:</b> {new Date(d.dataInicio).toLocaleDateString()}</div>
                  <div><b>Data limite:</b> {new Date(d.dataFim).toLocaleDateString()}</div>
                  {d.badge && <div><b>Medalha:</b> {d.badge.nome}</div>}
                  <div style={{ marginTop: 8 }}>
                    <Text weight="semibold">Completaram:</Text>
                    {alunos.concluidos.length === 0 ? (
                      <span> Nenhum aluno completou ainda.</span>
                    ) : (
                      alunos.concluidos.map((a: any) => (
                        <Badge key={a.email} appearance="filled" color="brand" style={{ marginRight: 8 }}>
                          {a.name}
                        </Badge>
                      ))
                    )}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Text weight="semibold">Pendentes:</Text>
                    {alunos.pendentes.length === 0 ? (
                      <span> Todos completaram!</span>
                    ) : (
                      alunos.pendentes.map((a: any) => (
                        <Badge key={a.email} appearance="outline" color="danger" style={{ marginRight: 8 }}>
                          {a.name}
                        </Badge>
                      ))
                    )}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Button size="small" appearance="secondary" onClick={() => handleRemoveDesafio(d.id)}>
                      Remover Desafio
                    </Button>
                  </div>
                </Card>
              );
            })
          )
        )}
      </Card>

      {/* Modal de edição de quiz */}
      <Dialog open={editQuizDialogOpen} onOpenChange={(_, data) => { if (!data.open) setEditQuizDialogOpen(false); }}>
        <DialogSurface style={{ minWidth: 700, maxWidth: 1000, width: "100vw" }}>
          <DialogBody>
            <DialogTitle>Editar Quiz - Capítulo {editQuizCapitulo}</DialogTitle>
            <Card style={{ marginBottom: 12, padding: 24, minWidth: 480 }}>
              <Field label={`Pergunta ${editQuizCurrentIdx + 1}`}>
                <Input
                  value={editQuizQuestions[editQuizCurrentIdx]?.enunciado || ""}
                  style={{ fontSize: 18, padding: 12, minHeight: 48 }}
                  onChange={e => {
                    const arr = [...editQuizQuestions];
                    if (!arr[editQuizCurrentIdx]) {
                      arr[editQuizCurrentIdx] = { enunciado: "", alternativas: ["", ""], correta: [] };
                    }
                    arr[editQuizCurrentIdx].enunciado = e.target.value;
                    setEditQuizQuestions(arr);
                  }}
                />
              </Field>
              <Field label="Alternativas">
                {(editQuizQuestions[editQuizCurrentIdx]?.alternativas || []).map((alt: string, aIdx: number) => (
                  <div key={aIdx} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                    <Input
                      value={alt}
                      style={{ marginRight: 12, fontSize: 16, padding: 10, minWidth: 300, minHeight: 40 }}
                      onChange={e => {
                        const arr = [...editQuizQuestions];
                        if (!arr[editQuizCurrentIdx]) {
                          arr[editQuizCurrentIdx] = { enunciado: "", alternativas: ["", ""], correta: [] };
                        }
                        arr[editQuizCurrentIdx].alternativas[aIdx] = e.target.value;
                        setEditQuizQuestions(arr);
                      }}
                    />
                    <input
                      type="checkbox"
                      style={{ width: 22, height: 22 }}
                      name={`correta-${editQuizCurrentIdx}-${aIdx}`}
                      checked={Array.isArray(editQuizQuestions[editQuizCurrentIdx]?.correta)
                        ? editQuizQuestions[editQuizCurrentIdx].correta.includes(aIdx)
                        : editQuizQuestions[editQuizCurrentIdx]?.correta === aIdx}
                      onChange={e => {
                        const arr = [...editQuizQuestions];
                        if (!arr[editQuizCurrentIdx]) {
                          arr[editQuizCurrentIdx] = { enunciado: "", alternativas: ["", ""], correta: [] };
                        }
                        let corretas = arr[editQuizCurrentIdx].correta;
                        if (!Array.isArray(corretas)) corretas = [corretas].filter(v => v !== undefined);
                        if (e.target.checked) {
                          if (!corretas.includes(aIdx)) corretas.push(aIdx);
                        } else {
                          corretas = corretas.filter((idx: number) => idx !== aIdx);
                        }
                        arr[editQuizCurrentIdx].correta = corretas;
                        setEditQuizQuestions(arr);
                      }}
                    />
                    <span style={{ marginLeft: 8, fontSize: 15 }}>Correta</span>
                    <Button
                      size="small"
                      appearance="subtle"
                      style={{ marginLeft: 8 }}
                      onClick={() => handleRemoveAlternative(aIdx)}
                      disabled={editQuizQuestions[editQuizCurrentIdx].alternativas.length <= 2}
                      title="Remover alternativa"
                    >
                      🗑️
                    </Button>
                  </div>
                ))}
                <Button
                  size="small"
                  appearance="secondary"
                  style={{ marginTop: 8 }}
                  onClick={handleAddAlternative}
                >
                  + Adicionar Alternativa
                </Button>
              </Field>
              <Button size="medium" appearance="secondary" style={{ marginTop: 12 }} onClick={() => handleRemoveQuestion(editQuizCurrentIdx)}>
                Remover Pergunta
              </Button>
              <div style={{ marginTop: 24, borderTop: "1px solid #e1e1e1", paddingTop: 16 }}>
                <Text weight="semibold" style={{ marginBottom: 16 }}>Datas do Quiz</Text>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Field label="Data de Leitura Dedicada">
                    <Input
                      type="date"
                      value={editQuizLeituraDedicada}
                      onChange={(e) => setEditQuizLeituraDedicada(e.target.value)}
                      style={{ fontSize: 16, padding: 8 }}
                    />
                  </Field>
                  <Field label="Prazo do Quiz">
                    <Input
                      type="date"
                      value={editQuizDeadline}
                      onChange={(e) => setEditQuizDeadline(e.target.value)}
                      style={{ fontSize: 16, padding: 8 }}
                    />
                  </Field>
                </div>
              </div>
            </Card>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <Button size="medium" onClick={handlePrevQuestion} disabled={editQuizCurrentIdx === 0}>
                ← Anterior
              </Button>
              <Button size="medium" onClick={handleAddQuestion}>
                + Adicionar Pergunta
              </Button>
              <Button size="medium" onClick={handleNextQuestion} disabled={editQuizCurrentIdx === editQuizQuestions.length - 1}>
                Próxima →
              </Button>
            </div>
            <DialogActions>
              <Button onClick={() => setEditQuizDialogOpen(false)}>Cancelar</Button>
              <Button appearance="primary" onClick={handleSaveQuizEdit}>
                Salvar
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}