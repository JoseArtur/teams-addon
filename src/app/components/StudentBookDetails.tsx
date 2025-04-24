// StudentBookDetails.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  Slider,
  Button,
  Badge,
  ProgressBar,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@fluentui/react-components";
import {
  getBookById,
  registerReadingProgress,
  getCurrentPageByBookId,
  getQuiz,
  getAnsweredQuizzes,
  addPointsToUser,
  getStudentStatsToday
} from "../services/api";
import { QuizFlyout } from "./QuizFlyout";

interface Chapter {
  titulo: string;
  inicio: number;
  fim: number;
  leituraDedicada: string;
  quizDeadline: string;
}

interface Book {
  capa: any;
  id: string;
  titulo: string;
  autor: string;
  paginas: number;
  capitulos: Chapter[];
}

export function StudentBookDetails({
  email,
  bookId,
  onRegisterProgress,
  progressJustRegistered = false

}: {
  email: string;
  bookId: string;
  onRegisterProgress: () => Promise<void>;
  progressJustRegistered?: boolean;

}) {
  const [book, setBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [lastRegisteredPage, setLastRegisteredPage] = useState<number>(0);
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [answeredChapters, setAnsweredChapters] = useState<number[]>([]);

  const [quizOpen, setQuizOpen] = useState(false);
  const [quizChapter, setQuizChapter] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [showFinishFlyout, setShowFinishFlyout] = useState(false);
  const [showReadingStreakFlyout, setShowReadingStreakFlyout] = useState<number | null>(null);
  const [showDailyFlyout, setShowDailyFlyout] = useState(false);
  const [readingDays, setReadingDays] = useState(0);

    const [earnedFinishPoints, setEarnedFinishPoints] = useState<number | null>(null);
    const [earnedFinishBadge, setEarnedFinishBadge] = useState<boolean>(false);

    const [reviewQuizOpen, setReviewQuizOpen] = useState(false);
const [reviewQuizQuestions, setReviewQuizQuestions] = useState<any[]>([]);
const [reviewQuizAnswers, setReviewQuizAnswers] = useState<string[]>([]);
const [reviewIndex, setReviewIndex] = useState(0);
const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const data = await getBookById(bookId);
      if (!isMounted) return;
      setBook(data);

      const page = await getCurrentPageByBookId(email, bookId);
      if (!isMounted) return;
      setCurrentPage(page);
      setLastRegisteredPage(page);

      const respostas = await getAnsweredQuizzes(email);
      const respondidos = respostas
        .filter((r: any) => r.bookId === bookId)
        .map((r: any) => r.capitulo - 1);
      setAnsweredChapters(respondidos);
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [bookId, email]);

  useEffect(() => {
    if (!book || !Array.isArray(book.capitulos)) return;
    const concluido = book.capitulos
      .filter((c, index) => currentPage >= c.fim)
      .map((_, i) => i);
    setCompletedChapters(concluido);
  }, [currentPage, book]);

  const handleRegistrar = async () => {
    if (currentPage < lastRegisteredPage) {
      const confirm = window.confirm("Você está diminuindo o número da página. Tem certeza que deseja registrar esse progresso?");
      if (!confirm) return;
    }
  
    const stats = await getStudentStatsToday(email);
    if (!stats.alreadyRegisteredToday) {
      setShowDailyFlyout(true);
      setReadingDays(stats.daysReading);
    }
  
    await registerReadingProgress(email, bookId, currentPage);
    setLastRegisteredPage(currentPage);
  
    // Checa se finalizou o livro
    if (book && currentPage >= book.paginas && !showFinishFlyout) {
      await addPointsToUser(email, "livro", 50, `Livro ${book.titulo}`);
      setEarnedFinishPoints(50);
      setEarnedFinishBadge(true);
      setShowFinishFlyout(true);
    }
  
    if (onRegisterProgress) {
      await onRegisterProgress();
    }
  };

  const handleQuizFinished = (chapterIndex: number) => {
    setAnsweredChapters((prev) => [...prev, chapterIndex]);
    setQuizOpen(false);
  };

  if (!book) return <Text>Carregando livro...</Text>;
  const progresso = Math.round((currentPage / book.paginas) * 100);

  const isAfterLeituraDate = (dateStr: string) => {
    const now = new Date();
    const leituraDate = new Date(dateStr);
    return now >= leituraDate;
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {book.capa && (
          <img
            src={book.capa}
            alt={`Capa do livro ${book.titulo}`}
            style={{ width: 120, height: "auto", borderRadius: 8, boxShadow: "0 2px 8px #0001" }}
          />
        )}
        <div>
          <Text size={700} weight="bold">📘 {book.titulo}</Text><br />
          <Text>{book.autor}</Text>
        </div>
      </div>

      <Card style={{ padding: 16, marginTop: 16 }}>
    <Text>📖 Página atual: {currentPage} / {book.paginas}</Text>
    <Slider
      min={0}
      max={book.paginas}
      value={currentPage}
      onChange={(_, d) => setCurrentPage(d.value)}
      disabled={lastRegisteredPage >= book.paginas}
    />
    <ProgressBar value={progresso} max={100} />
    {lastRegisteredPage >= book.paginas ? (
      <Button appearance="primary" disabled style={{ marginTop: 12 }}>
        Livro concluído!
      </Button>
    ) : progressJustRegistered ? (
      <Button appearance="secondary" style={{ marginTop: 12, background: "#DFF6DD", color: "#256029" }} disabled>
        Progresso registrado!
      </Button>
    ) : (
      <Button appearance="primary" onClick={handleRegistrar} style={{ marginTop: 12 }}>
        Registrar Progresso
      </Button>
    )}
  </Card>

      <Card style={{ marginTop: 24 }}>
        <Text weight="semibold">📚 Capítulos</Text>
        {Array.isArray(book.capitulos) ? (
  book.capitulos.map((c, i) => {
    const isConcluido = currentPage >= c.fim;
    const leituraLiberada = isAfterLeituraDate(c.leituraDedicada);
    const quizRespondido = answeredChapters.includes(i);
    // O quiz só pode ser feito se o progresso registrado (lastRegisteredPage) for suficiente
    const quizLiberado = lastRegisteredPage >= c.fim && leituraLiberada;

    return (
      <div key={i} style={{ marginTop: 12 }}>
        <Text>{c.titulo} ({c.inicio}–{c.fim})</Text><br />
        <Text size={200}>Leitura: {c.leituraDedicada} | Quiz até: {c.quizDeadline} </Text>
        {quizRespondido ? (
  <>
    <Badge appearance="filled" color="brand">✅ Concluído</Badge>
    <Button
      appearance="secondary"
      size="small"
      style={{ marginLeft: 8 }}
      onClick={async () => {
        // Busca as respostas do aluno e as perguntas do quiz
        const respostas = await getAnsweredQuizzes(email);
        console.log("Respostas do quiz:", respostas);
        const respostaCap = respostas.find((r: any) => r.bookId === bookId && r.capitulo - 1 === i);
        const quiz = await getQuiz(book.id, i + 1);
        const formattedQuestions = (quiz.perguntas || [])
          .filter((p: any) => p && p.enunciado && Array.isArray(p.alternativas))
          .map((p: any) => ({
            question: p.enunciado,
            options: p.alternativas,
            correct: p.alternativas[p.correta],
            correctIndex: p.correta,
          }));
        setReviewQuizQuestions(formattedQuestions);
        setReviewQuizAnswers(respostaCap?.respostas || []);
        setReviewQuizOpen(true);
      }}
    >
      Ver Respostas
    </Button>
  </>
) : isConcluido && !leituraLiberada ? (
  <Badge appearance="outline" color="warning">⏳ Aguardando data de leitura</Badge>
) : (
  <Badge appearance="outline">
    Chegue até a página {c.fim} para desbloquear o Quiz
  </Badge>
)}
        {isConcluido && leituraLiberada && !quizRespondido && (
          <Button
            style={{ marginLeft: 8 }}
            onClick={async () => {
              if (!quizLiberado) {
                // Mostra um flyout/modal informando que precisa registrar progresso
                setQuizChapter(null);
                setQuizQuestions([]);
                setQuizOpen(false);
                window.alert(`Você ainda não chegou na página ${c.fim}. Clique em "Registrar Progresso" para avançar.`);
                return;
              }
              setQuizChapter(c);
              try {
                const quiz = await getQuiz(book.id, i + 1);
                const formattedQuestions = (quiz.perguntas || [])
                  .filter((p: any) => p && p.enunciado && Array.isArray(p.alternativas))
                  .map((p: any) => ({
                    question: p.enunciado,
                    options: p.alternativas,
                    answer: p.alternativas[p.correta]
                  }));
                if (formattedQuestions.length === 0) {
                  alert("Não há quiz disponível para este capítulo.");
                  return;
                }
                setQuizQuestions(formattedQuestions);
                setQuizOpen(true);
              } catch (err) {
                alert("Erro ao carregar o quiz.");
                console.error(err);
              }
            }}
          >
            Fazer Quiz
          </Button>
        )}
      </div>
    );
  })
) : (
  <Text>Este livro não possui capítulos cadastrados.</Text>
)}
      </Card>

  {showDailyFlyout && (
  <Dialog open={showDailyFlyout} onOpenChange={(_, data) => !data.open && setShowDailyFlyout(false)}>
    <DialogSurface>
      <DialogBody>
        <DialogTitle>📖 Boa leitura!</DialogTitle>
        <div style={{ margin: "1rem 0" }}>
          <Text size={600}>Parabéns por começar a leitura hoje!</Text>
          <Text size={400} block>
            Já estás a ler há <strong>{readingDays}</strong> {readingDays === 1 ? "dia" : "dias"} . Continua assim! 🚀
          </Text>
        </div>
        <DialogActions>
          <Button appearance="primary" onClick={() => setShowDailyFlyout(false)}>
            Fechar
          </Button>
        </DialogActions>
      </DialogBody>
    </DialogSurface>
  </Dialog>
)}

{showFinishFlyout && (
        <Dialog open={showFinishFlyout} onOpenChange={(_, data) => !data.open && setShowFinishFlyout(false)}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>🎉 Parabéns!</DialogTitle>
              <div style={{ margin: "1rem 0" }}>
                <Text size={600} weight="bold">
                  📘 Você ganhou {earnedFinishPoints} pontos por concluir o livro!
                </Text>
                {earnedFinishBadge && (
                  <Text block style={{ marginTop: 12 }}>
                    🏅 Medalha conquistada: <b>Leitor Completo</b>
                  </Text>
                )}
              </div>
              <DialogActions>
                <Button appearance="primary" onClick={() => setShowFinishFlyout(false)}>
                  Fechar
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}


      {quizChapter && quizQuestions.length > 0 && (
        <QuizFlyout
          open={quizOpen}
          onClose={() => setQuizOpen(false)}
          chapter={quizChapter}
          questions={quizQuestions}
          email={email}
          bookId={bookId}
          chapterIndex={book.capitulos.findIndex((c) => c.titulo === quizChapter.titulo)}
          onQuizFinished={handleQuizFinished}
        />
      )}
{reviewQuizOpen && (
  <Dialog open={reviewQuizOpen} onOpenChange={(_, data) => !data.open && setReviewQuizOpen(false)}>
    <DialogSurface>
      <DialogBody>
        <DialogTitle>Respostas do Quiz</DialogTitle>
        <div style={{ margin: "1rem 0" }}>
          {reviewQuizQuestions.length > 0 && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <Text weight="semibold">{reviewQuizQuestions[currentReviewIndex].question}</Text>
                <div style={{ display: "flex", flexDirection: "row", gap: 12, marginTop: 8 }}>
                  {reviewQuizQuestions[currentReviewIndex].options.map((opt: string, j: number) => {
                    const isUser = reviewQuizAnswers[currentReviewIndex] === opt;
                    const isCorrect = reviewQuizQuestions[currentReviewIndex].correct === opt;
                    // Mostra em vermelho se o estudante marcou e está errada
                    const isUserWrong = isUser && !isCorrect;
                    return (
                      <div
                        key={j}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 6,
                          border: isCorrect
                            ? "2px solid #256029"
                            : isUserWrong
                            ? "2px solid #A4262C"
                            : isUser
                            ? "2px solid #888"
                            : "1px solid #eee",
                          background: isCorrect
                            ? "#DFF6DD"
                            : isUserWrong
                            ? "#FDE7E9"
                            : isUser
                            ? "#F3F2F1"
                            : "#fafafa",
                          fontWeight: isCorrect ? "bold" : isUser ? "bold" : "normal",
                          color: isCorrect
                            ? "#256029"
                            : isUserWrong
                            ? "#A4262C"
                            : isUser
                            ? "#333"
                            : "#333",
                          minWidth: 120,
                          textAlign: "center",
                          position: "relative",
                        }}
                      >
                        {opt}
                        {isCorrect && (
                          <span style={{ fontSize: 12, display: "block", color: "#256029" }}>
                            (Correta)
                          </span>
                        )}
                        {isUserWrong && (
                          <span style={{ fontSize: 12, display: "block", color: "#A4262C" }}>
                            (Sua resposta)
                          </span>
                        )}
                        {isUser && isCorrect && (
                          <span style={{ fontSize: 12, display: "block", color: "#256029" }}>
                            (Você acertou)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Button
                  appearance="secondary"
                  disabled={currentReviewIndex === 0}
                  onClick={() => setCurrentReviewIndex((i) => Math.max(0, i - 1))}
                >
                  Anterior
                </Button>
                <Text>
                  {currentReviewIndex + 1} / {reviewQuizQuestions.length}
                </Text>
                <Button
                  appearance="secondary"
                  disabled={currentReviewIndex === reviewQuizQuestions.length - 1}
                  onClick={() => setCurrentReviewIndex((i) => Math.min(reviewQuizQuestions.length - 1, i + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogActions>
          <Button appearance="primary" onClick={() => setReviewQuizOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </DialogBody>
    </DialogSurface>
  </Dialog>
)}
    </div>

    
  );
}
