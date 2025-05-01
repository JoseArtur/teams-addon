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
import { updateQuiz,getDesafios, getClassStudents, getQuiz, createDesafio, getBooks, removeQuiz, removeDesafio, getAllQuizByBookId } from "../services/api";

export function TeacherQuizzesChallengesTab({ grade, turma }: { grade: string; turma: string }) {
  const [desafios, setDesafios] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [editQuizDialogOpen, setEditQuizDialogOpen] = useState(false);
  const [editQuizQuestions, setEditQuizQuestions] = useState<any[]>([]);
  const [editQuizCapitulo, setEditQuizCapitulo] = useState<number | null>(null);
  const [editQuizCurrentIdx, setEditQuizCurrentIdx] = useState(0);
  const [newDesafio, setNewDesafio] = useState({
    titulo: "",
    descricao: "", // Assuming you might add a description field later
    tipo: "ler-paginas", // Default type
    valor: "", // For pages or chapter number
    validade: "",
    livroId: "",
    pontos: 0, // Initialize pontos
  });
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const livros = await getBooks(grade);
      setBooks(livros);
      setSelectedBook(livros[0]);
      const alunos = await getClassStudents(grade, turma);
      setStudents(alunos);
      setLoading(false);
    }
    fetchData();
  }, [grade, turma]);

  useEffect(() => {
    async function fetchBookData() {
      if (!selectedBook) return;
      setLoading(true);
      // Desafios são gerais da turma, não por livro
      const dsf = await getDesafios(grade, turma);
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
    await removeDesafio(desafioId);
    setDesafios(desafios.filter((d: any) => d.id !== desafioId));
  };

  const getAlunosDesafio = (desafioId: string) => {
    const desafio = desafios.find((d) => d.id === desafioId);
    const concluidos = desafio?.concluidos || [];
    return {
      concluidos: students.filter((a: any) => concluidos.includes(a.email)),
      pendentes: students.filter((a: any) => !concluidos.includes(a.email)),
    };
  };
  const handleCreateDesafio = async () => {
    setCreating(true);
    // Prepare data based on type
    const desafioData: any = {
      titulo: newDesafio.titulo,
      tipo: newDesafio.tipo,
      validade: newDesafio.validade,
      pontos: newDesafio.pontos,
      grade,
      turma,
      livroId: selectedBook.id, // Associate with the selected book
    };
  
    // Add 'valor' (pages or chapter) if applicable
    if (newDesafio.tipo === "ler-paginas" || newDesafio.tipo === "concluir-capitulo" || newDesafio.tipo === "responder-quiz") {
      desafioData.valor = Number(newDesafio.valor);
    }
    // If type is 'responder-quiz' or 'concluir-capitulo', 'valor' represents the chapter
    if (newDesafio.tipo === "concluir-capitulo" || newDesafio.tipo === "responder-quiz") {
      desafioData.capitulo = Number(newDesafio.valor);
    }
    // If type is 'ler-paginas', 'valor' represents the number of pages
    if (newDesafio.tipo === "ler-paginas") {
      desafioData.paginas = Number(newDesafio.valor);
    }
  
    await createDesafio(desafioData);
  
    setShowCreateDialog(false);
    setCreating(false);
    // Reset state including new fields
    setNewDesafio({
      titulo: "",
      descricao: "",
      tipo: "ler-paginas",
      valor: "",
      validade: "",
      livroId: "",
      pontos: 0,
    });
    // Refetch desafios after creation
    const dsf = await getDesafios(grade, turma);
    setDesafios(dsf);
  };
  
  return (
    <div style={{ padding: "2rem" }}>
      <h1>🏁 Gerenciar Quizzes e Desafios</h1>
      <Divider />

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

    
<Dialog open={showCreateDialog} onOpenChange={(_, data) => !data.open && setShowCreateDialog(false)}>
  {/* Increase the size of the DialogSurface */}
  <DialogSurface style={{ minWidth: 600, width: "80vw", maxWidth: 800 }}> 
      <DialogBody>
        <DialogTitle>🎯 Criar novo desafio</DialogTitle>

        <Field label="Tipo de desafio" hint="Escolha o tipo de meta que os alunos devem cumprir.">
          <Dropdown
            value={newDesafio.tipo} // Use the text value for display if needed, or manage selectedKey separately
            selectedOptions={[newDesafio.tipo]} // Control selection via state
            onOptionSelect={(_, data) => {
              if (data.optionValue) {
                setNewDesafio((d) => ({
                  ...d,
                  tipo: data.optionValue as string,
                  valor: "", // Reset valor when type changes
                }));
              }
            }}
          >
            <Option value="ler-paginas">📖 Ler X páginas até data</Option>
            <Option value="concluir-capitulo">📘 Ler até capítulo X</Option>
            <Option value="concluir-livro">🏁 Concluir o livro</Option>
            <Option value="responder-quiz">🧠 Responder ao quiz do capítulo X</Option>
          </Dropdown>
        </Field>

        <Field label="Título do desafio">
          <Input
            placeholder="Ex: Ler até o final do capítulo 2"
            value={newDesafio.titulo}
            onChange={(e) => setNewDesafio((d) => ({ ...d, titulo: e.target.value }))}
            required // Make title required
          />
        </Field>

        {/* Conditionally render based on type */}
        {(newDesafio.tipo === "ler-paginas" || newDesafio.tipo === "concluir-capitulo" || newDesafio.tipo === "responder-quiz") && (
          <Field label={newDesafio.tipo === "ler-paginas" ? "Número de páginas" : "Capítulo"}>
            <Input
              type="number"
              value={newDesafio.valor || ""}
              onChange={(e) => setNewDesafio((d) => ({ ...d, valor: e.target.value }))}
              required // Make value required if field is shown
              min="1" // Ensure positive number
            />
          </Field>
        )}

        <Field label="Data limite">
          <Input
            type="date"
            value={newDesafio.validade}
            onChange={(e) => setNewDesafio((d) => ({ ...d, validade: e.target.value }))}
            required // Make date required
          />
        </Field>

        <Field label="Pontos a atribuir" hint="Quantos pontos os alunos ganham se cumprirem?">
          <Input
            type="number"
            value={newDesafio.pontos !== undefined ? String(newDesafio.pontos) : ""} // Ensure value is a string
            onChange={(e) => setNewDesafio((d) => ({ ...d, pontos: parseInt(e.target.value) || 0 }))}
            required // Make points required
            min="0" // Ensure non-negative points
          />
        </Field>

      <DialogActions>
        <Button onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
        <Button appearance="primary" onClick={handleCreateDesafio} disabled={creating}>
          {creating ? <Spinner size="tiny" /> : "Criar desafio"}
        </Button>
      </DialogActions>
    </DialogBody>
  </DialogSurface>
</Dialog>

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
                  <div><b>Data limite:</b> {d.validade}</div>
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
  <DialogSurface style={{ minWidth: 700, maxWidth: 900, width: "90vw" }}>
    <DialogBody>
      <DialogTitle>Editar Quiz - Capítulo {editQuizCapitulo}</DialogTitle>
      {editQuizQuestions.length > 0 && (
 <Card style={{ marginBottom: 12, padding: 24, minWidth: 480 }}>
 <Field label={`Pergunta ${editQuizCurrentIdx + 1}`}>
   <Input
     value={editQuizQuestions[editQuizCurrentIdx].enunciado}
     style={{ fontSize: 18, padding: 12, minHeight: 48 }}
     onChange={e => {
       const arr = [...editQuizQuestions];
       arr[editQuizCurrentIdx].enunciado = e.target.value;
       setEditQuizQuestions(arr);
     }}
   />
 </Field>
 <Field label="Alternativas">
  {editQuizQuestions[editQuizCurrentIdx].alternativas.map((alt: string, aIdx: number) => (
    <div key={aIdx} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
      <Input
        value={alt}
        style={{ marginRight: 12, fontSize: 16, padding: 10, minWidth: 320, minHeight: 40 }}
        onChange={e => {
          const arr = [...editQuizQuestions];
          arr[editQuizCurrentIdx].alternativas[aIdx] = e.target.value;
          setEditQuizQuestions(arr);
        }}
      />
      <input
        type="checkbox"
        style={{ width: 22, height: 22 }}
        name={`correta-${editQuizCurrentIdx}-${aIdx}`}
        checked={Array.isArray(editQuizQuestions[editQuizCurrentIdx].correta)
          ? editQuizQuestions[editQuizCurrentIdx].correta.includes(aIdx)
          : editQuizQuestions[editQuizCurrentIdx].correta === aIdx}
        onChange={e => {
          const arr = [...editQuizQuestions];
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
</Card>
      )}
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