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
  Input,
  Textarea,
  DialogContent
} from "@fluentui/react-components";
import {
  getBookById,
  registerReadingProgress,
  getCurrentPageByBookId,
  getQuiz,
  getAnsweredQuizzes,
  addPointsToUser,
  getStudentStatsToday,
  getEscolhidoQuizQuestion,
  verificarConclusaoDesafio,
  getAnsweredEscolhidoQuizzes,
  setEscolhidoBook,
  addGamificationPoints
} from "../services/api";
import { QuizFlyout } from "./QuizFlyout";
import { removeBookFromShelf, updateBookDetails } from "../services/api";
import { ConfirmDialog } from "./ConfirmDialog";

interface Chapter {
  titulo: string;
  inicio: number;
  fim: number;
  leituraDedicada: string;
  quizDeadline: string;
}

interface Quiz {
  milestone: string;
  completed: boolean;
}

interface Book {
  capa: any;
  id: string;
  titulo: string;
  autor: string;
  paginas: number;
  capitulos: Chapter[];
}

interface ChapterProgress {
  title: string;
  start: number;
  end: number;
  completed: boolean;
}

interface ChapterQuiz {
  title: string;
  completed: boolean;
}

interface EscolhidoQuizDialogProps {
  open: boolean;
  onClose: () => void;
  terco: number;
  perguntas: string[];
  quizId: string;
  onQuizSubmitted: (terco: number, respostas: string[],quizId: string) => void;
}

function EscolhidoQuizDialog({ open, onClose, terco, perguntas, quizId, onQuizSubmitted }: EscolhidoQuizDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState<string[]>(Array(perguntas.length).fill(""));
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    console.log("handleSubmit2", { terco, respostas,quizId });
    setSubmitted(true);
    onQuizSubmitted(terco, respostas,quizId);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Quiz do Livro Escolhido - Parte {terco}</DialogTitle>
          <DialogContent>
            {!submitted ? (
              <>
                <Text block>Pergunta {currentIndex + 1} de {perguntas.length}</Text>
                <Text weight="semibold" style={{ marginTop: 16 }}>{perguntas[currentIndex]}</Text>
                <Textarea
                  value={respostas[currentIndex]}
                  onChange={(_, data) => {
                    const newRespostas = [...respostas];
                    newRespostas[currentIndex] = data.value;
                    setRespostas(newRespostas);
                  }}
                  style={{ marginTop: 16, minHeight: 100 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                  <Button
                    appearance="secondary"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    appearance="primary"
                    disabled={currentIndex === perguntas.length - 1}
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </>
            ) : (
              <Text block>Quiz enviado com sucesso!</Text>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Fechar</Button>
            {!submitted && (
              <Button
                appearance="primary"
                onClick={handleSubmit}
                disabled={respostas.some(r => !r.trim())}
              >
                Enviar Respostas
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

interface StudentBookDetailsProps {
  email: string;
  bookId: string;
  onRegisterProgress: () => Promise<void>;
  progressJustRegistered?: boolean;
  isEscolhido?: boolean;
  escolhido?: any;
  onEscolherLivro?: (book: any) => void;
  studentGrade?: string;
  onQuizSubmitted?: () => void;
  onEscolhidoUpdate?: (book: any) => void;
  handleSubmitEscolhidoQuiz?: (terco: number, resposta: string[],quizId: string) => Promise<void>;
  streak?: number;
}

export function StudentBookDetails({
  email,
  bookId,
  onRegisterProgress,
  progressJustRegistered = false,
  isEscolhido = false,
  escolhido,
  onEscolherLivro,
  studentGrade,
  onQuizSubmitted,
  onEscolhidoUpdate,
  handleSubmitEscolhidoQuiz,
  streak = 0
}: StudentBookDetailsProps) {
  const [book, setBook] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [lastRegisteredPage, setLastRegisteredPage] = useState(0);
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

  // State para o quiz aberto do livro escolhido
  const [openQuizDialog, setOpenQuizDialog] = useState<{ terco: number; label: string; quizId: string } | null>(null);
  const [quizRespostas, setQuizRespostas] = useState<string[]>([]);
  const [quizPerguntas, setQuizPerguntas] = useState<string[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [currentTerco, setCurrentTerco] = useState<number | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [completedChallenge, setCompletedChallenge] = useState<any>(null);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showDailyStatsFlyout, setShowDailyStatsFlyout] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);

  const [showEscolhidoQuiz, setShowEscolhidoQuiz] = useState(false);
  const [answeredEscolhidoQuizzes, setAnsweredEscolhidoQuizzes] = useState<number[]>([]);

  const [viewingQuizAnswers, setViewingQuizAnswers] = useState<{terco: number, respostas: string[], perguntas: string[]} | null>(null);
  const [removingBook, setRemovingBook] = useState(false);
  const [editingBook, setEditingBook] = useState(false);
  const [newPageCount, setNewPageCount] = useState("");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleRemoveBook = async () => {
    try {
      setRemovingBook(true);
      await removeBookFromShelf(email, bookId);
      // Refresh the book list by calling onRegisterProgress
      await onRegisterProgress();
      // Reload the page after successful removal
      window.location.reload();
    } catch (error) {
      console.error("Error removing book:", error);
    } finally {
      setRemovingBook(false);
      setShowRemoveConfirm(false);
    }
  };
  
  const handleEditPages = async () => {
    try {
      setEditingBook(true);
      setNewPageCount(book.paginas.toString());
    } catch (error) {
      console.error("Error preparing to edit book:", error);
    }
  };
  
  const handleSavePages = async () => {
    try {
      // Sanitize and validate the input
      const sanitizedPages = newPageCount.replace(/[^0-9]/g, ''); // Remove non-numeric characters
      const pages = parseInt(sanitizedPages);
      
      if (isNaN(pages) || pages <= 0) {
        throw new Error("O número de páginas deve ser um número inteiro positivo");
      }
  
      await updateBookDetails(bookId, { paginas: pages });
      
      // Refresh the book data
      const updatedBook = await getBookById(bookId);
      setBook(updatedBook);
    } catch (error) {
      console.error("Error updating book pages:", error);
    } finally {
      setEditingBook(false);
      setNewPageCount("");
    }
  };
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
      .filter((c: Chapter, index: number) => currentPage >= c.fim)
      .map((_: Chapter, i: number) => i);
    setCompletedChapters(concluido);
  }, [currentPage, book]);

  useEffect(() => {
    async function loadAnsweredQuizzes() {
      if (!email) return;
      const answered = await getAnsweredEscolhidoQuizzes(email);
      const answeredTerco = answered
        .filter((quiz: any) => quiz.bookId === bookId)
        .map((quiz: any) => parseInt(quiz.capitulo.split('-')[1]));
      setAnsweredEscolhidoQuizzes(answeredTerco);
    }
    loadAnsweredQuizzes();
  }, [email, bookId]);

  const handleRegistrar = async () => {
    if (isRegistering) return;
    setIsRegistering(true);

    if (currentPage < lastRegisteredPage) {
        const confirmed = window.confirm("Você está tentando diminuir o número de páginas. Tem certeza?");
        if (!confirmed) return;
    }

    // Check if we're passing a milestone that requires quiz completion
    const totalPages = book?.paginas || 0;
    const oneThird = Math.floor(totalPages / 3);
    const twoThirds = Math.floor((totalPages * 2) / 3);

    if ((currentPage >= oneThird && lastRegisteredPage < oneThird) ||
        (currentPage >= twoThirds && lastRegisteredPage < twoThirds)) {
        const milestone = currentPage >= twoThirds ? "2/3" : "1/3";
        const quiz = book?.capitulos?.find((c: Chapter) => c.fim === currentPage);
        if (quiz && !answeredChapters.includes(book?.capitulos?.findIndex((c: Chapter) => c.titulo === quiz.titulo) || -1)) {
            alert(`Você precisa completar o quiz de ${milestone} do livro antes de continuar.`);
            return;
        }
    }

    try {
        // Get daily student stats
        const stats = await getStudentStatsToday(email);
        if (!stats.alreadyRegisteredToday) {
            setShowDailyFlyout(true);
            setReadingDays(stats.daysReading);
        }

        // Register reading progress
        await registerReadingProgress(email, bookId, currentPage);

        // Check for challenge completion
        const response = await verificarConclusaoDesafio(email, currentPage, "livro-especifico", bookId);
        if (response.completed && response.challenge) {
            setCompletedChallenge(response.challenge);
            setCompletedChallenges(prev => {
                const newSet = new Set(prev);
                newSet.add(response.challenge.id);
                return newSet;
            });
            setShowChallengeDialog(true);
        }

        // If book is completed, award points and badge
        if (currentPage >= totalPages) {
            setEarnedFinishPoints(50);
            setEarnedFinishBadge(true);
            setShowFinishFlyout(true);
            setShowCompletionDialog(true);
        }

        setLastRegisteredPage(currentPage);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
        if (onRegisterProgress) {
            await onRegisterProgress();
        }

        // Check for escolhido quiz after registering progress
        await checkAndShowEscolhidoQuiz(currentPage);
    } catch (error) {
        console.error("Erro ao registrar progresso:", error);
        alert("Erro ao registrar progresso. Tente novamente mais tarde.");
    } finally {
        setIsRegistering(false);
    }
  };

  const handleQuizFinished = async (chapterIndex: number) => {
    setAnsweredChapters((prev) => [...prev, chapterIndex]);
    setQuizOpen(false);

    // Refresh answered quizzes after completion
    const respostas = await getAnsweredQuizzes(email);
    const respondidos = respostas
      .filter((r: any) => r.bookId === bookId)
      .map((r: any) => r.capitulo - 1);
    setAnsweredChapters(respondidos);

    // Check for challenge completion
    const response = await verificarConclusaoDesafio(email, currentPage, "quiz", bookId);
    if (response.completed && response.challenge) {
      setCompletedChallenge(response.challenge);
      setCompletedChallenges(prev => {
        const newSet = new Set(prev);
        newSet.add(response.challenge.id);
        return newSet;
      });
      setShowChallengeDialog(true);
    }
  };

  const handleEscolhidoQuizSubmit = async (terco: number, respostas: string[],quizId: string) => {
    try {
      if (handleSubmitEscolhidoQuiz) {
        await handleSubmitEscolhidoQuiz(terco, respostas,quizId);
      } else {
        // Update the escolhido state with new quiz responses
        const updated = {
          ...escolhido,
          quizzesRespondidos: [...(escolhido.quizzesRespondidos || []), terco],
          respostas: { ...(escolhido.respostas || {}), [terco]: respostas }
        };
        
        // Update in the database
        await setEscolhidoBook(email, updated);
        
        // Update local state
        if (onEscolhidoUpdate) {
          onEscolhidoUpdate(updated);
        }
        
        // Add gamification points
        await addGamificationPoints({
          email,
          tipo: "quiz-escolhido",
          points: 10,
          detalhes: `Respondeu à parte ${terco} do livro escolhido`,
          earnedAt: new Date().toISOString()
        });

        // Check for challenge completion
        const challengeResponse = await verificarConclusaoDesafio(
          email,
          currentPage,
          "escolhido",
          bookId
        );

        if (challengeResponse.completed && challengeResponse.challenge) {
          setCompletedChallenge(challengeResponse.challenge);
          setCompletedChallenges(prev => {
            const newSet = new Set(prev);
            newSet.add(challengeResponse.challenge.id);
            return newSet;
          });
          setShowChallengeDialog(true);
        }
      }

      // Update local UI state
      setShowEscolhidoQuiz(false);
      setQuizPerguntas(null);
      setCurrentTerco(null);
      setQuizId(null);
      // Notify parent component
      if (onQuizSubmitted) {
        onQuizSubmitted();
      }
    } catch (error) {
      console.error("Erro ao enviar respostas do quiz:", error);
      alert("Erro ao enviar respostas. Tente novamente mais tarde.");
    }
  };

  const checkAndShowEscolhidoQuiz = async (currentPage: number) => {
    if (!escolhido || !book || !["5", "6", "7", "8"].includes(studentGrade || "")) return;

    const totalPages = book.paginas;
    const terco1 = Math.floor(totalPages / 3);
    const terco2 = Math.floor((totalPages * 2) / 3);
    const terco3 = totalPages;

    let terco = null;
    if (currentPage >= terco1 && currentPage < terco2) terco = 1;
    else if (currentPage >= terco2 && currentPage < terco3) terco = 2;
    else if (currentPage >= terco3) terco = 3;

    if (terco && !escolhido.quizzesRespondidos?.includes(terco)) {
      try {
        const {perguntas,quizId} = await getEscolhidoQuizQuestion(terco.toString(), email);
        if (perguntas && perguntas.length > 0) {
          setQuizPerguntas(perguntas);
          setCurrentTerco(terco);
          setQuizId(quizId);
          setShowEscolhidoQuiz(true);
        }
      } catch (error) {
        console.error("Erro ao buscar perguntas do quiz:", error);
      }
    }
  };

  const handleQuizSubmitted = async () => {
    if (currentTerco !== null) {
      await getAnsweredQuizzes(email);
      await verificarConclusaoDesafio(
        email,
        currentPage,
        "escolhido",
        bookId
      );
      if (onQuizSubmitted) {
        onQuizSubmitted();
      }
    }
  };

  if (!book) return <Text>Carregando livro...</Text>;
  const progresso = Math.round((currentPage / book.paginas) * 100);

  const isAfterLeituraDate = (dateStr: string) => {
    const now = new Date();
    const leituraDate = new Date(dateStr);
    return now >= leituraDate;
  };

  const chapters: ChapterProgress[] = book?.capitulos?.map((c: Chapter, index: number) => ({
    title: c.titulo,
    start: c.inicio,
    end: c.fim,
    completed: completedChapters.includes(index)
  })) || [];

  const chapterQuizzes: ChapterQuiz[] = book?.capitulos?.map((c: Chapter, i: number) => ({
    title: c.titulo,
    completed: answeredChapters.includes(i)
  })) || [];

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
{/* Edit and Remove buttons - only show for personal or manual books and unfinished books */}
{(book.type === "personal" || book.type === "manual") && currentPage < book.paginas && (
  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
    {editingBook ? (
      <div style={{ display: "flex", gap: "4px" }}>
        <Input
          type="text"
          value={newPageCount}
          onChange={(_, data) => {
            // Only allow positive integers
            const sanitized = data.value.replace(/[^0-9]/g, '');
            setNewPageCount(sanitized);
          }}
          style={{ width: "80px" }}
          placeholder="Páginas"
        />
        <Button
          appearance="primary"
          onClick={handleSavePages}
          disabled={!newPageCount || parseInt(newPageCount) <= 0}
        >
          Salvar
        </Button>
        <Button
          appearance="subtle"
          onClick={() => {
            setEditingBook(false);
            setNewPageCount("");
          }}
        >
          Cancelar
        </Button>
      </div>
    ) : (
      <>
        <Button
          appearance="subtle"
          onClick={handleEditPages}
        >
          Editar Páginas
        </Button>
        <Button
          appearance="subtle"
          onClick={() => setShowRemoveConfirm(true)}
          disabled={removingBook}
          style={{ color: "#A4262C" }}
        >
          {removingBook ? "Removendo..." : "Remover Livro"}
        </Button>
      </>
    )}
  </div>
)}

     
          {/* Indicação visual se for o livro escolhido */}
          {escolhido && escolhido.bookId === book.id && (
            <div style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              <Badge color="brand" appearance="filled">Livro Escolhido</Badge>
              <span role="img" aria-label="estrela">⭐</span>
            </div>
          )}
        </div>
      </div>
      <Card style={{ padding: 16, marginTop: 16 }}>
        <Text>📖 Página atual: {currentPage} / {book.paginas}</Text>
        <Slider
          min={0}
          max={book.paginas}
          value={currentPage}
          onChange={(_, data) => setCurrentPage(data.value)}
          disabled={lastRegisteredPage >= book.paginas}
        />
        <ProgressBar value={progresso} max={100} />
        {lastRegisteredPage >= book.paginas ? (
          <Button appearance="primary" disabled style={{ marginTop: 12 }}>
            Livro concluído!
          </Button>
        ) : showSuccessMessage ? (
          <Button appearance="secondary" style={{ marginTop: 12, background: "#DFF6DD", color: "#256029" }} disabled>
            Progresso registrado!
          </Button>
        ) : (
          <Button 
            appearance="primary" 
            onClick={handleRegistrar} 
            style={{ marginTop: 12 }}
            disabled={isRegistering}
          >
            {isRegistering ? "Registrando..." : "Registrar Progresso"}
          </Button>
        )}
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Text weight="semibold">📚 Capítulos</Text>
        {Array.isArray(book.capitulos) ? (
          book.capitulos.map((c: Chapter, i: number) => {
            const isConcluido = currentPage >= c.fim;
            const leituraLiberada = isAfterLeituraDate(c.leituraDedicada);

            return (
              <div key={i} style={{ marginTop: 12 }}>
                <Text>{c.titulo} ({c.inicio}–{c.fim})</Text><br />
                <Text size={200}>Leitura: {c.leituraDedicada}</Text>
                {isConcluido && !leituraLiberada ? (
                  <Badge appearance="outline" color="warning">⏳ Aguardando data de leitura</Badge>
                ) : (
                  <Badge appearance="outline">
                    Chegue até a página {c.fim} para desbloquear o Quiz Final
                  </Badge>
                )}
              </div>
            );
          })
        ) : (
          <Text>Este livro não possui capítulos cadastrados.</Text>
        )}
      </Card>

      {["5", "6", "7", "8"].includes(studentGrade || "") && (
        <Card style={{ marginTop: 24 }}>
          <Text weight="semibold" size={500}>📘 Quiz Final do Livro</Text>
          <div style={{ marginTop: 12 }}>
            <Text>
              Progresso: {lastRegisteredPage} / {book.paginas} páginas (
              {Math.round((lastRegisteredPage / book.paginas) * 100)}%)
            </Text>
            {(() => {
              const milestone = book.paginas;
              const respondido = answeredEscolhidoQuizzes.includes(3);
              const liberado = lastRegisteredPage >= milestone;
              return (
                <div style={{ marginTop: 16 }}>
                  <Text weight="semibold">Quiz Final (100%) — pág. {milestone}</Text>
                  <br />
                  {respondido ? (
                    <Button
                      size="small"
                      appearance="secondary"
                      style={{ marginTop: 6 }}
                      onClick={async () => {
                        try {
                          const {perguntas,quizId} = await getEscolhidoQuizQuestion("3", email);
                          const answeredQuizzes = await getAnsweredEscolhidoQuizzes(email);
                          const quizAnswer = answeredQuizzes.find(
                            (quiz: any) => quiz.bookId === bookId && quiz.capitulo === "terco-3"
                          );
                          setViewingQuizAnswers({ 
                            terco: 3, 
                            respostas: quizAnswer?.respostas || [], 
                            perguntas: perguntas 
                          });
                        } catch (error) {
                          console.error("Erro ao buscar respostas do quiz:", error);
                          setShowQuizDialog(true);
                        }
                      }}
                    >
                      Ver Quiz Final
                    </Button>
                  ) : liberado ? (
                    <Button
                      size="small"
                      appearance="primary"
                      style={{ marginTop: 6 }}
                      onClick={async () => {
                        setQuizRespostas([]);
                        setCurrentQuestionIndex(0);
                        if (openQuizDialog?.terco !== 3) {
                          console.log("Buscando perguntas do quiz...");
                          try {
                            const { perguntas, quizId } = await getEscolhidoQuizQuestion("3", email);
                            console.log("Perguntas do quiz:", perguntas);
                            if (!perguntas || perguntas.length === 0) {
                              setShowQuizDialog(true);
                              return;
                            }
                            setQuizPerguntas(perguntas);
                            setQuizRespostas(Array(perguntas.length).fill(""));
                            setOpenQuizDialog({ terco: 3, label: "Quiz Final", quizId });
                          } catch (error) {
                            console.error("Erro ao buscar perguntas do quiz:", error);
                            setShowQuizDialog(true);
                          }
                        } else {
                          setOpenQuizDialog({ terco: 3, label: "Quiz Final", quizId: openQuizDialog.quizId });
                        }
                      }}
                    >
                      Responder Quiz Final
                    </Button>
                  ) : (
                    <Badge appearance="outline" color="warning">
                      Para desbloquear o quiz final, registre progresso até a página {milestone}.
                    </Badge>
                  )}
                </div>
              );
            })()}
          </div>
        </Card>
      )}

      <Dialog open={showQuizDialog} onOpenChange={(_, data) => !data.open && setShowQuizDialog(false)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Perguntas indisponíveis</DialogTitle>
            <Text>As perguntas não estão disponíveis ainda para este quiz. Tente novamente mais tarde.</Text>
            <DialogActions>
              <Button appearance="primary" onClick={() => setShowQuizDialog(false)}>
                Fechar
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Modal de resposta aberta do quiz do livro escolhido */}
      <Dialog open={!!openQuizDialog} onOpenChange={(_, data) => { if (!data.open) setOpenQuizDialog(null); }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 150}}>
                {openQuizDialog ? openQuizDialog.label : ""}
              </div>
            </DialogTitle>
            {quizPerguntas && quizPerguntas.length > 0 && (
              <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                <Text
                  weight="semibold"
                  style={{
                    textAlign: "center",
                    marginTop: 10,
                    marginBottom: 15,
                    width: "100%",
                    fontSize: 20 // Aumenta o tamanho da fonte da pergunta
                  }}
                >          Pergunta: {quizPerguntas[currentQuestionIndex]}
                </Text>
                <div style={{ width: "100%", display: "flex", justifyContent: "center", marginLeft: 100 }}>
                  <Textarea
                    placeholder="Digite sua resposta aqui..."
                    value={quizRespostas[currentQuestionIndex] || ""}
                    onChange={e => {
                      const arr = [...quizRespostas];
                      arr[currentQuestionIndex] = e.target.value;
                      setQuizRespostas(arr);
                    }}
                    style={{
                      minHeight: 220,
                      minWidth: 400,
                      maxWidth: 700,
                      width: "100%",
                      marginTop: 8,
                      resize: "vertical",
                      display: "block",
                      textAlign: "left"
                    }}
                  />
                </div>
                {/* Botões de navegação abaixo do campo de resposta */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 24, width: "100%", maxWidth: 700, gap: 24 }}>
                  <Button
                    appearance="secondary"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
                  >
                    Anterior
                  </Button>
                  <Text>
                    {currentQuestionIndex + 1} / {quizPerguntas.length}
                  </Text>
                  <Button
                    appearance="secondary"
                    disabled={currentQuestionIndex === quizPerguntas.length - 1}
                    onClick={() => setCurrentQuestionIndex(i => Math.min(quizPerguntas.length - 1, i + 1))}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
            <DialogActions style={{ justifyContent: "center" }}>
              <Button onClick={() => setOpenQuizDialog(null)}>Cancelar</Button>
              <Button
                appearance="primary"
                disabled={quizRespostas.some(r => !r.trim())}
                onClick={async () => {
                  console.log("handleSubmit1", { terco: openQuizDialog?.terco, respostas: quizRespostas });
                  if (openQuizDialog) {
                    await handleEscolhidoQuizSubmit(openQuizDialog.terco, quizRespostas,openQuizDialog.quizId);
                    setOpenQuizDialog(null);
                  }
                }}
              >
                Enviar Respostas
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      
      {showDailyFlyout && (
        <Dialog open={showDailyFlyout} onOpenChange={(_, data) => !data.open && setShowDailyFlyout(false)}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>📖 Boa leitura!</DialogTitle>
              <div style={{ margin: "1rem 0" }}>
                <Text size={600}>Parabéns por começar a leitura hoje!</Text>
                <Text size={400} block>
                  Já estás a ler há <strong>{streak}</strong> {streak === 1 ? "dia" : "dias"} . Continua assim! 
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

      {completedChallenge && (
        <Dialog open={true} onOpenChange={() => setCompletedChallenge(null)}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle className="text-center">
                <div className="text-4xl mb-2">🎉 🏆 🎯</div>
                <div className="text-2xl font-bold text-primary">Parabéns, Campeão!</div>
              </DialogTitle>
              <DialogContent className="text-center space-y-4">
                <div className="bg-yellow-100 p-4 rounded-lg shadow-inner">
                  <Text className="text-xl font-semibold text-amber-800">
                    {completedChallenge.titulo}
                  </Text>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-3xl">🎖️</div>
                  <Text className="text-lg font-medium">
                    Badge conquistado: {completedChallenge.badge.nome}
                  </Text>
                </div>
                <div className="flex justify-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-2xl">⭐</span>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-lg">
                  <Text className="text-sm italic">
                    "Cada desafio superado é um passo para se tornar um leitor incrível!"
                  </Text>
                </div>
              </DialogContent>
              <DialogActions className="justify-center">
                <Button 
                  appearance="primary" 
                  onClick={() => setCompletedChallenge(null)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transform hover:scale-105 transition-transform"
                >
                  Continuar a Aventura!
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}

      {quizChapter && quizQuestions.length > 0 && book?.capitulos && (
        <QuizFlyout
          open={quizOpen}
          onClose={() => setQuizOpen(false)}
          chapter={quizChapter}
          questions={quizQuestions}
          email={email}
          bookId={bookId}
          chapterIndex={book.capitulos.findIndex((c: Chapter) => c.titulo === quizChapter.titulo)}
          onQuizSubmitted={() => handleQuizFinished(book.capitulos.findIndex((c: Chapter) => c.titulo === quizChapter.titulo))}
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

      {showEscolhidoQuiz && currentTerco && quizPerguntas && (
        <EscolhidoQuizDialog
          open={showEscolhidoQuiz}
          onClose={() => setShowEscolhidoQuiz(false)}
          terco={currentTerco}
          perguntas={quizPerguntas}
          quizId={quizId || ""} 
          onQuizSubmitted={handleEscolhidoQuizSubmit}
        />
      )}

      {/* Dialog para visualizar respostas do quiz */}
      <Dialog open={!!viewingQuizAnswers} onOpenChange={(_, data) => !data.open && setViewingQuizAnswers(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Respostas do Quiz {viewingQuizAnswers?.terco}</DialogTitle>
            <DialogContent>
              {viewingQuizAnswers?.perguntas.map((pergunta, index) => (
                <div key={index} style={{ marginBottom: 24 }}>
                  <Text weight="semibold" style={{ marginBottom: 8 }}>Pergunta {index + 1}:</Text>
                  <Text style={{ marginBottom: 16 }}>{pergunta}</Text>
                  <div style={{ 
                    padding: 12, 
                    backgroundColor: "#f5f5f5", 
                    borderRadius: 4,
                    marginBottom: 8
                  }}>
                    <Text weight="semibold" style={{ marginBottom: 4 }}>Sua resposta:</Text>
                    <Text>{viewingQuizAnswers.respostas[index] || "Sem resposta"}</Text>
                  </div>
                </div>
              ))}
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={() => setViewingQuizAnswers(null)}>
                Fechar
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <ConfirmDialog
        open={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={handleRemoveBook}
        title="Remover Livro"
        message="Tem certeza que deseja remover este livro da sua estante? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
      />
    </div>


  );
}
