import React, { useEffect, useState } from "react";
import {
  Text,
  Card,
  CardHeader,
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Slider,
  Badge,
  Spinner,
  Checkbox,
  Divider,
  Textarea,
} from "@fluentui/react-components";
import {
  Add20Regular,
  FireFilled,
} from "@fluentui/react-icons";
import { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { addBookToShelf, getBadgeInfo, getCurricularBooks, getStudentHistory, registerReadingProgress, setEscolhidoBook, getEscolhidoBook, addGamificationPoints, submitEscolhidoQuizAnswers, removeBookFromShelf, updateBookDetails, getCurrentPageByBookId, submitSupport } from "../services/api";
import { StudentBookDetails } from "./StudentBookDetails";
import { GetStudentInfoResponse } from "../services/api";
import { BookSearch } from "./BookSearch";
import { StudentDesafios } from "./StudentDesafios";
import { PointsInfoFlyout } from "./PointsInfoFlyout";
import { ConfirmDialog } from "./ConfirmDialog";
import { PointsHistoryFlyout } from "./PointsHistoryFlyout";

export function StudentDashboard({ studentInfo }: { studentInfo: GetStudentInfoResponse }) {
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [studentName, setStudentName] = useState<string>("");
  const [streakAnimating, setStreakAnimating] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [myBooks, setMyBooks] = useState<any[]>([]);
  const [availableCurricularBooks, setAvailableCurricularBooks] = useState<any[]>([]);
  const [selectedCurricularBooks, setSelectedCurricularBooks] = useState<string[]>([]);
  const [showCurricularFlyout, setShowCurricularFlyout] = useState(false);

  const [progressJustRegistered, setProgressJustRegistered] = useState(false);
  const progressTimeout = useRef<NodeJS.Timeout | null>(null);
  const [escolhido, setEscolhido] = useState<any>(null);
  const [showEscolhidoConfirm, setShowEscolhidoConfirm] = useState(false);
  const [pendingEscolhidoBook, setPendingEscolhidoBook] = useState<any>(null);

  const [showBookSearch, setShowBookSearch] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [removingBook, setRemovingBook] = useState<string | null>(null);

  const [editingBook, setEditingBook] = useState<string | null>(null);
  const [newPageCount, setNewPageCount] = useState<string>("");

  const [bookPages, setBookPages] = useState<Record<string, number>>({});

  const [showPointsInfo, setShowPointsInfo] = useState(false);

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [bookToRemove, setBookToRemove] = useState<string | null>(null);

  const [showPointsHistory, setShowPointsHistory] = useState(false);

  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isTeacherView = location.state?.isTeacherView || false;

  useEffect(() => {
    async function fetchEscolhido() {
      if (studentInfo?.email) {
        const data = await getEscolhidoBook(studentInfo.email);
        setEscolhido(data);
      }
    }
    fetchEscolhido();
  }, [studentInfo?.email, refreshKey]);

  const handleEscolherLivro = async (book: any) => {
    // Se já existe um livro escolhido diferente, pede confirmação
    if (
      escolhido &&
      escolhido.bookId &&
      escolhido.bookId !== book.id
    ) {
      setPendingEscolhidoBook(book);
      setShowEscolhidoConfirm(true);
      return;
    }
    // Só permite se for do 5º ao 8º ano
    if (!["5", "6", "7", "8"].includes(studentInfo.grade)) return;
    await setEscolhidoBook(studentInfo.email, {
      bookId: book.id,
      dataLimite: null,
      quizzesRespondidos: [],
      respostas: {}
    });
    setEscolhido({
      bookId: book.id,
      dataLimite: null,
      quizzesRespondidos: [],
      respostas: {}
    });
  };


  const handleSubmitEscolhidoQuiz = async (terco: number, respostas: string[],quizId: string) => {
    try {
      if (!selectedBook) return;

      // Submit quiz answers
      console.log("selectedBook", selectedBook);
      await submitEscolhidoQuizAnswers(studentInfo.email, selectedBook.id, terco, respostas,quizId);

      // Update local state
      const updatedEscolhido = {
      ...escolhido,
        respostas: {
          ...escolhido?.respostas,
          [terco]: respostas
        },
        terco: [...(escolhido?.terco || []), terco]
      };

      // Update database
      await setEscolhidoBook(studentInfo.email, updatedEscolhido);

      // Update local state
      setEscolhido(updatedEscolhido);
    } catch (error) {
      console.error("Error submitting escolhido quiz:", error);
    }
  };

  const toggleSelectBook = (titulo: string) => {
    setSelectedCurricularBooks((prev) =>
      prev.includes(titulo) ? prev.filter((t) => t !== titulo) : [...prev, titulo]
    );
  };

  const email = studentInfo?.email || "";
  const grade = studentInfo?.grade || "";

  useEffect(() => {
    getStudentHistory(email).then(async (data) => {
      const enrichedBooks = [
        ...data.currentlyReading
          .filter((entry: any) => entry?.book) // Filter out entries without books
          .map((entry: any) => ({
            id: entry.book?.id,
            title: entry.book?.titulo,
            author: entry.book?.autor,
            cover: entry.book?.capa,
            totalPages: entry.book?.paginas,
            currentPage: entry.currentPage || 0,
            type: entry.book?.type,
            status: 'reading'
          })),
        ...data.booksRead
          .filter((entry: any) => entry?.book && !data.currentlyReading.some((current: any) => current?.book?.id === entry.book?.id))
          .map((entry: any) => ({
            id: entry.book?.id,
            title: entry.book?.titulo,
            author: entry.book?.autor,
            cover: entry.book?.capa,
            totalPages: entry.book?.paginas,
            currentPage: entry.book?.paginas,
            type: entry.book?.type,
            status: 'completed'
          }))
      ];
      setBooks(enrichedBooks);
      
      // Update badges state with the new structure
      const badgesData = data.badges || [];
      setBadges(badgesData);
      
      setStreak(data.readingStreak || 0);
      console.log("Streak:", data.readingStreak);
      if (enrichedBooks.length > 0) setSelectedBook(enrichedBooks[0]);
      console.log("Livros:", enrichedBooks);
      setStudentName(studentInfo.name);
      console.log("Nome do aluno:", studentInfo.name);
      setLoading(false);
      console.log("ooks.length > 1 , books:", books.length >= 1 );
    });
  }, [email, refreshKey]);

  useEffect(() => {
    async function fetchCurrentPages() {
      const pages: Record<string, number> = {};
      for (const book of books) {
        try {
          const currentPage = await getCurrentPageByBookId(studentInfo.email, book.id);
          pages[book.id] = currentPage;
        } catch (error) {
          console.error(`Error fetching current page for book ${book.id}:`, error);
          pages[book.id] = 0;
        }
      }
      setBookPages(pages);
    }
    if (books.length > 0) {
      fetchCurrentPages();
    }
  }, [books, studentInfo.email]);

  const handleOpenCurricularFlyout = async () => {
    try {
      const booksFromApi = await getCurricularBooks(grade);
      const notOwned = booksFromApi.filter((book: any) => !books.find((b) => b.title === book.titulo));
      setAvailableCurricularBooks(notOwned);
      setSelectedCurricularBooks([]);
      setShowCurricularFlyout(true);
    } catch (err) {
      console.error("Erro ao buscar livros curriculares:", err);
    }
  };

  const handleConfirmAddCurricular = async () => {
    const booksToAdd = availableCurricularBooks.filter((book) => selectedCurricularBooks.includes(book.titulo));
    for (const book of booksToAdd) {
      await addBookToShelf(email, { ...book, type: "curricular" });
    }
    setShowCurricularFlyout(false);
  
    // Recarrega os livros do estudante após adicionar
    setLoading(true);
    const data = await getStudentHistory(email);
    const enrichedBooks = [
      ...data.currentlyReading
        .filter((entry: any) => entry?.book) // Filter out entries without books
        .map((entry: any) => ({
          id: entry.book?.id,
          title: entry.book?.titulo,
          author: entry.book?.autor,
          cover: entry.book?.capa,
          totalPages: entry.book?.paginas,
          currentPage: entry.currentPage || 0,
          type: entry.book?.type,
          status: 'reading'
        })),
      ...data.booksRead
        .filter((entry: any) => entry?.book && !data.currentlyReading.some((current: any) => current?.book?.id === entry.book?.id))
        .map((entry: any) => ({
          id: entry.book?.id,
          title: entry.book?.titulo,
          author: entry.book?.autor,
          cover: entry.book?.capa,
          totalPages: entry.book?.paginas,
          currentPage: entry.book?.paginas,
          type: entry.book?.type,
          status: 'completed'
        }))
    ];
    setBooks(enrichedBooks);
    if (enrichedBooks.length > 0) setSelectedBook(enrichedBooks[0]);
    setLoading(false);
  };


  const handleProgressSubmit = async () => {
    
    // Atualiza streak do backend
    const data = await getStudentHistory(email);
    const novoStreak = data.readingStreak || 0;
    if (novoStreak > streak) {
      setStreakAnimating(true);
      setTimeout(() => setStreakAnimating(false), 1200); // duração da animação
    }
    console.log("Streak atualizada:", novoStreak);
    setStreak(novoStreak);

    setProgressJustRegistered(true);
    if (progressTimeout.current) clearTimeout(progressTimeout.current);
    progressTimeout.current = setTimeout(() => setProgressJustRegistered(false), 3000);

    setBooks((prev) =>
      prev.map((book) =>
        book.id === selectedBook.id ? { ...book, currentPage } : book
      )
    ); setStreak(novoStreak);

    setProgressJustRegistered(true);
    if (progressTimeout.current) clearTimeout(progressTimeout.current);
    progressTimeout.current = setTimeout(() => setProgressJustRegistered(false), 3000);

    setBooks((prev) =>
      prev.map((book) =>
        book.id === selectedBook.id ? { ...book, currentPage } : book
      )
    );
  };

  const handleSelectBook = async (book: any) => {
    await handleEscolherLivro(book);
    setShowBookSearch(false);
  };

  const handleQuizSubmitted = async () => {
    // Refresh student data
    const data = await getStudentHistory(email);
    const enrichedBooks = [
      ...data.currentlyReading
        .filter((entry: any) => entry?.book) // Filter out entries without books
        .map((entry: any) => ({
          id: entry.book?.id,
          title: entry.book?.titulo,
          author: entry.book?.autor,
          cover: entry.book?.capa,
          totalPages: entry.book?.paginas,
          currentPage: entry.currentPage || 0,
          type: entry.book?.type,
          status: 'reading'
        })),
      ...data.booksRead
        .filter((entry: any) => entry?.book && !data.currentlyReading.some((current: any) => current?.book?.id === entry.book?.id))
        .map((entry: any) => ({
          id: entry.book?.id,
          title: entry.book?.titulo,
          author: entry.book?.autor,
          cover: entry.book?.capa,
          totalPages: entry.book?.paginas,
          currentPage: entry.book?.paginas,
          type: entry.book?.type,
          status: 'completed'
        }))
    ];
    setBooks(enrichedBooks);
    setBadges(data.badges || []);
    setStreak(data.readingStreak || 0);
    if (enrichedBooks.length > 0) setSelectedBook(enrichedBooks[0]);

    // Increment refreshKey to update StudentDesafios
    setRefreshKey(prev => prev + 1);
  };

  const handleRemoveBook = async (bookId: string) => {
    try {
      setRemovingBook(bookId);
      await removeBookFromShelf(email, bookId);
      // Refresh the books list
      const data = await getStudentHistory(email);
      const enrichedBooks = [
        ...data.currentlyReading
          .filter((entry: any) => entry?.book)
          .map((entry: any) => ({
            id: entry.book?.id,
            title: entry.book?.titulo,
            author: entry.book?.autor,
            cover: entry.book?.capa,
            totalPages: entry.book?.paginas,
            currentPage: entry.currentPage || 0,
            type: entry.book?.type,
            status: 'reading'
          })),
        ...data.booksRead
          .filter((entry: any) => entry?.book && !data.currentlyReading.some((current: any) => current?.book?.id === entry.book?.id))
          .map((entry: any) => ({
            id: entry.book?.id,
            title: entry.book?.titulo,
            author: entry.book?.autor,
            cover: entry.book?.capa,
            totalPages: entry.book?.paginas,
            currentPage: entry.book?.paginas,
            type: entry.book?.type,
            status: 'completed'
          }))
      ];
      setBooks(enrichedBooks);
      if (selectedBook?.id === bookId) {
        setSelectedBook(enrichedBooks.find((b: { id: string }) => b.id === bookId) || null);
      }
      // Reload the page after successful removal
      window.location.reload();
    } catch (error) {
      console.error("Error removing book:", error);
    } finally {
      setRemovingBook(null);
      setShowRemoveConfirm(false);
      setBookToRemove(null);
    }
  };

  const handleEditPages = async (bookId: string, currentPages: number) => {
    try {
      setEditingBook(bookId);
      setNewPageCount(currentPages.toString());
    } catch (error) {
      console.error("Error preparing to edit book:", error);
    }
  };

  const handleSavePages = async (bookId: string) => {
    try {
      // Sanitize and validate the input
      const sanitizedPages = newPageCount.replace(/[^0-9]/g, ''); // Remove non-numeric characters
      const pages = parseInt(sanitizedPages);
      
      if (isNaN(pages) || pages <= 0) {
        throw new Error("O número de páginas deve ser um número inteiro positivo");
      }

      await updateBookDetails(bookId, { paginas: pages });
      
      // Refresh the books list
      const data = await getStudentHistory(studentInfo.email);
      const enrichedBooks = [
        ...data.currentlyReading
          .filter((entry: any) => entry?.book) // Filter out entries without books
          .map((entry: any) => ({
            id: entry.book?.id,
            title: entry.book?.titulo,
            author: entry.book?.autor,
            cover: entry.book?.capa,
            totalPages: entry.book?.paginas,
            currentPage: entry.currentPage || 0,
            type: entry.book?.type,
            status: 'reading'
          })),
        ...data.booksRead
          .filter((entry: any) => entry?.book && !data.currentlyReading.some((current: any) => current?.book?.id === entry.book?.id))
          .map((entry: any) => ({
            id: entry.book?.id,
            title: entry.book?.titulo,
            author: entry.book?.autor,
            cover: entry.book?.capa,
            totalPages: entry.book?.paginas,
            currentPage: entry.book?.paginas,
            type: entry.book?.type,
            status: 'completed'
          }))
      ];
      setBooks(enrichedBooks);
      if (selectedBook?.id === bookId) {
        setSelectedBook(enrichedBooks.find((b: { id: string }) => b.id === bookId) || null);
      }
    } catch (error) {
      console.error("Error updating book pages:", error);
      // You might want to show an error message to the user here
    } finally {
      setEditingBook(null);
      setNewPageCount("");
    }
  };

  const handleSubmitSupport = async () => {
    try {
      setIsSubmittingSupport(true);
      await submitSupport(studentInfo.email, studentInfo.name, supportMessage);
      setSupportMessage("");
      setShowSupportDialog(false);
    } catch (error) {
      console.error("Error submitting support request:", error);
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  if (loading) return <Spinner label="Carregando..." />;

  const progresso = selectedBook
  ? Math.round((selectedBook.currentPage / selectedBook.totalPages) * 100)
  : 0;

return (
  <div style={{ padding: "2rem" }}>
    {isTeacherView && (
      <div style={{ marginBottom: "1rem" }}>
        <Button appearance="primary" onClick={() => navigate("/teacher-dashboard")}>
          ← Voltar para o Painel do Professor
        </Button>
        <Text size={500} weight="semibold" style={{ marginTop: "1rem", display: "block" }}>
          Visualizando como: {studentInfo.name}
        </Text>
      </div>
    )}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
    <Text size={700} weight="bold" style={{ marginBottom: 16 }}>
        Olá, {studentInfo?.name || 'Estudante'}
    </Text>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div 
          style={{ 
            backgroundColor: "#f0f0f0", 
            padding: "8px 16px", 
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer"
          }}
          onClick={() => setShowPointsHistory(true)}
        >
          <Text weight="semibold" size={400}>⭐</Text>
          <Text weight="semibold" size={400}>Ver Pontos</Text>
        </div>
        <Button
          appearance="subtle"
          onClick={() => setShowSupportDialog(true)}
          style={{ marginLeft: 8 }}
        >
          Algum Problema? Clique aqui
        </Button>
      </div>
      <Button
        appearance="subtle"
        onClick={() => setShowPointsInfo(true)}
        style={{ marginTop: 8 }}
      >
        Como ganhar pontos?
      </Button>
    </div>
    <Divider style={{ margin: "1rem 0" }} />

    {!escolhido && ["5", "6", "7", "8"].includes(studentInfo.grade) && (
      <Card style={{ margin: "2rem 0", padding: 24, textAlign: "center" }}>
        <Text size={500}>Você ainda não escolheu um livro para leitura. Escolha um livro para começar!</Text>
        <Button
          appearance="primary"
          icon={<Add20Regular />}
          style={{ marginTop: 16 }}
          onClick={() => setShowBookSearch(true)}
        >
          Escolher Livro
        </Button>
      </Card>
    )}

    {showBookSearch && (
      <BookSearch
        onSelectBook={handleSelectBook}
        studentGrade={studentInfo.grade}
        studentEmail={studentInfo.email}
      />
    )}

    {selectedBook ? (
      <StudentBookDetails
      email={email}
      bookId={selectedBook.id}
      onRegisterProgress={handleProgressSubmit}
      progressJustRegistered={progressJustRegistered}
      studentGrade={studentInfo.grade}
        handleSubmitEscolhidoQuiz={handleSubmitEscolhidoQuiz}
        onQuizSubmitted={handleQuizSubmitted}
        streak={streak}
    />
    ) : (
      <Card style={{ margin: "2rem 0", padding: 24, textAlign: "center" }}>
      <Text size={500}>Você ainda não tem livros em leitura. Adicione um livro para começar sua jornada!</Text>
      <Button
        appearance="primary"
        icon={<Add20Regular />}
        style={{ marginTop: 16 }}
        onClick={handleOpenCurricularFlyout}
            >
        Adicionar Livro
      </Button>
    </Card>
    )}

{/* Outros livros em leitura */}
{books.length > 1 && (
  <>
    <Text size={600} weight="semibold" style={{ marginTop: "2rem" }}>
      📚 Outros Livros em Leitura
    </Text>
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
      {books
        .filter((book) => !selectedBook || book.id !== selectedBook.id)
        .map((book) => (
          console.log("book is a:", book.type),
          <Card key={book.id} style={{ width: "200px", position: "relative" }}>
            <img
              src={book.cover}
              alt="Capa do livro"
              style={{ height: "100px", margin: "1rem auto", display: "block" }}
            />
            <Text weight="semibold">{book.title}</Text>
            <Text size={300}>Autor: {book.author}</Text>
            <Text size={300} style={{ color: "#666" }}>
              Página {bookPages[book.id] || 0} de {book.totalPages}
            </Text>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            <Button
              appearance="secondary"
              onClick={() => setSelectedBook(book)}
            >
              Selecionar
            </Button>
              {/* Edit pages button - only show for manually added books and unfinished books */}
              {book.type === "manual" && book.currentPage < book.totalPages && (
                editingBook === book.id ? (
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
                      onClick={() => handleSavePages(book.id)}
                      disabled={!newPageCount || parseInt(newPageCount) <= 0}
                    >
                      Salvar
                    </Button>
                    <Button
                      appearance="subtle"
                      onClick={() => {
                        setEditingBook(null);
                        setNewPageCount("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    appearance="subtle"
                    onClick={() => handleEditPages(book.id, book.totalPages)}
                  >
                    Editar Páginas
                  </Button>
                )
              )}
              {(book.type === "personal" || book.type === "manual") && (
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <Button
                    appearance="subtle"
                    onClick={() => {
                      setBookToRemove(book.id);
                      setShowRemoveConfirm(true);
                    }}
                    disabled={removingBook === book.id}
                    style={{ color: "#A4262C" }}
                  >
                    {removingBook === book.id ? "Removendo..." : "Remover Livro"}
              </Button>
                </div>
            )}
            </div>
            {/* Indicação visual se for o livro escolhido */}
            {(
        <div style={{
          marginTop: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6
        }}>
          
          <Text size={200} style={{ color: "#256029", marginTop: 4, textAlign: "center" }}>
            Selecione o livro para ver e responder os quizzes!
          </Text>
        </div>
      )}
    </Card>
        ))}
    </div>
  </>
)}

      <Card style={{ marginTop: "2rem" }}>
        
      <CardHeader
  header={<Text weight="semibold">🔥 Streak de Leitura</Text>}
  description={
    streak === 1
      ? "Você está lendo há 1 dia seguido!"
      : `Você está lendo há ${streak} dias seguidos!`
  }
/>
        <Text>
          Mantenha sua sequência de leitura para ganhar recompensas e medalhas!
        </Text>
        <div style={{ marginTop: "0.5rem" }}>
  {Array.from({ length: streak }).map((_, i) => (
    <FireFilled
      key={i}
      style={{
        color: "orange",
        marginRight: 4,
        transition: "transform 0.4s",
        transform: streakAnimating && i === streak - 1 ? "scale(1.5)" : "scale(1)"
      }}
    />
  ))}
</div>
      </Card>

      <Card style={{ marginTop: "1rem" }}>
  <CardHeader header={<Text weight="semibold">🎖 Medalhas Conquistadas</Text>} />
  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: 12 }}>
    {badges.length === 0 ? (
      <Text size={300} style={{ color: "#888" }}>Nenhuma medalha conquistada ainda.</Text>
    ) : (
      badges.map((badge: any, i: number) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: 120,
            padding: 12,
            background: "#f5f6fa",
            borderRadius: 12,
            boxShadow: "0 2px 8px #0001",
            border: "1px solid #e0e0e0"
          }}
        >
          <Badge
            appearance="filled"
            color={badge.cor || "brand"}
            style={{ fontSize: 32, marginBottom: 8, padding: 12 }}
          >
            {badge.icone || "🏅"}
          </Badge>
          <Text weight="semibold" size={400} style={{ textAlign: "center" }}>
                  {badge.name || badge.nome || badge.titulo}
          </Text>
                {badge.date && (
                  <Text size={200} style={{ color: "#666", textAlign: "center", marginTop: 4 }}>
                    {new Date(badge.date).toLocaleDateString()}
            </Text>
          )}
        </div>
      ))
    )}
  </div>
</Card>
<Dialog open={showCurricularFlyout} onOpenChange={(_, data) => !data.open && setShowCurricularFlyout(false)}>
  <DialogSurface>
    <DialogBody style={{ maxHeight: "80vh", overflowY: "auto" }}>
      <DialogTitle>📘 Livros Curriculares do {grade}º ano</DialogTitle>
      {availableCurricularBooks.length === 0 ? (
        <Text>Todos os livros já estão na sua estante.</Text>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          {availableCurricularBooks.map((book, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Checkbox
                checked={selectedCurricularBooks.includes(book.titulo)}
                onChange={() => toggleSelectBook(book.titulo)}
                label={`${book.titulo} – ${book.autor}`}
              />
              {book.capa && (
                <img src={book.capa} alt="Capa" style={{ height: 48, borderRadius: 4 }} />
              )}
            </div>
          ))}
        </div>
      )}
      <DialogActions>
        <Button onClick={() => setShowCurricularFlyout(false)}>Cancelar</Button>
        <Button appearance="primary" onClick={handleConfirmAddCurricular} disabled={selectedCurricularBooks.length === 0}>
          Adicionar à Estante
        </Button>
      </DialogActions>
    </DialogBody>
  </DialogSurface>
</Dialog>
    {/* Flyout de confirmação para trocar o livro escolhido */}
      <Dialog open={showEscolhidoConfirm} onOpenChange={(_, data) => !data.open && setShowEscolhidoConfirm(false)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Trocar Livro Escolhido?</DialogTitle>
            <Text>
              Você já possui um livro escolhido: <b>{books.find(b => b.id === escolhido?.bookId)?.title || "Livro anterior"}</b>.<br />
              Deseja trocar pelo livro <b>{pendingEscolhidoBook?.title || pendingEscolhidoBook?.titulo}</b>?<br /><br />
              <span style={{ color: "#A4262C" }}>
                <b>Essa ação vai apagar todas as respostas dos quizzes do livro escolhido anterior.</b>
              </span>
            </Text>
            <DialogActions>
              <Button onClick={() => setShowEscolhidoConfirm(false)}>Cancelar</Button>
              <Button
                appearance="primary"
                onClick={async () => {
                  if (!pendingEscolhidoBook) return;
                  await setEscolhidoBook(studentInfo.email, {
                    bookId: pendingEscolhidoBook.id,
                    dataLimite: null,
                    quizzesRespondidos: [],
                    respostas: {}
                  });
                  setEscolhido({
                    bookId: pendingEscolhidoBook.id,
                    dataLimite: null,
                    quizzesRespondidos: [],
                    respostas: {}
                  });
                  setShowEscolhidoConfirm(false);
                  setPendingEscolhidoBook(null);
                }}
              >
                Trocar Livro Escolhido
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Desafios Section */}
      <div style={{ marginTop: "2rem" }}>
        <Text size={600} weight="semibold">🎯 Desafios Ativos</Text>
        <StudentDesafios email={studentInfo.email} key={refreshKey} />
      </div>

      <PointsInfoFlyout
        open={showPointsInfo}
        onClose={() => setShowPointsInfo(false)}
      />

      <PointsHistoryFlyout
        open={showPointsHistory}
        onClose={() => setShowPointsHistory(false)}
        email={studentInfo?.email || ''}
      />

      <ConfirmDialog
        open={showRemoveConfirm}
        onClose={() => {
          setShowRemoveConfirm(false);
          setBookToRemove(null);
        }}
        onConfirm={() => bookToRemove && handleRemoveBook(bookToRemove)}
        title="Remover Livro"
        message="Tem certeza que deseja remover este livro da sua estante? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
      />

      {/* Support Dialog */}
      <Dialog open={showSupportDialog} onOpenChange={(_, data) => !data.open && setShowSupportDialog(false)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Precisas de Ajuda?</DialogTitle>
            <DialogContent>
              <Text size={400} style={{ marginBottom: 16 }}>
                Conta-nos o que está a acontecer e vamos ajudar-te! Por exemplo:
              </Text>
              <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
                <li>O meu nome está errado</li>
                <li>Estou na turma errada</li>
                <li>Não consigo ver os meus livros</li>
                <li>Tenho um problema com os pontos</li>
              </ul>
              <Text size={400} style={{ marginBottom: 16 }}>
                Escreve aqui o teu problema e a nossa equipa vai ajudar-te o mais depressa possível!
              </Text>
              <Textarea
                value={supportMessage}
                onChange={(_, data) => setSupportMessage(data.value)}
                placeholder="Descreva o problema aqui..."
                style={{ width: "100%", minHeight: "150px" }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowSupportDialog(false)}>Cancelar</Button>
              <Button
                appearance="primary"
                onClick={handleSubmitSupport}
                disabled={!supportMessage.trim() || isSubmittingSupport}
              >
                {isSubmittingSupport ? "Enviando..." : "Enviar"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

    </div>
  );
}
