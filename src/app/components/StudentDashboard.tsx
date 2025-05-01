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
} from "@fluentui/react-components";
import {
  Add20Regular,
  FireFilled,
} from "@fluentui/react-icons";
import { useRef } from "react";

import { addBookToShelf, getBadgeInfo, getCurricularBooks, getStudentHistory, registerReadingProgress } from "../services/api";
import { StudentBookDetails } from "./StudentBookDetails";
import { GetStudentInfoResponse } from "../services/api";
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


  const toggleSelectBook = (titulo: string) => {
    setSelectedCurricularBooks((prev) =>
      prev.includes(titulo) ? prev.filter((t) => t !== titulo) : [...prev, titulo]
    );
  };

  const email = studentInfo?.email || "";
  const grade = studentInfo?.grade || "";

  useEffect(() => {
    getStudentHistory(email).then(async (data) => {
      console.log("Dados do aluno:", data);
      const enrichedBooks = data.currentlyReading.map((entry: any) => ({
        id: entry.book.id,
        title: entry.book.titulo,
        author: entry.book.autor,
        cover: entry.book.capa,
        totalPages: entry.book.paginas,
        currentPage: entry.currentPage || 0,
      }));
      setBooks(enrichedBooks);
      const badgesRaw = data.badges || [];
      const badgeInfos = await Promise.all(
        badgesRaw.map(async (id: string) => {
          try {
            return await getBadgeInfo(id);
          } catch {
            return { id, titulo: id, icone: "🏅", cor: "brand" };
          }
        })
      );
      setBadges(badgeInfos);
            console.log("Badges:", data);
            console.log("Badges1:", badgeInfos);
      setStreak(data.readingStreak || 0);
      console.log("Streak:", data.readingStreak);
      if (enrichedBooks.length > 0) setSelectedBook(enrichedBooks[0]);
      console.log("Livros:", enrichedBooks);
      setStudentName(studentInfo.name);

      console.log("Nome do aluno:", studentInfo.name);
      setLoading(false);
      console.log("ooks.length > 1 , books:", books.length >= 1 );
    });
  }, [email]);

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
    const enrichedBooks = data.currentlyReading.map((entry: any) => ({
      id: entry.book.id,
      title: entry.book.titulo,
      author: entry.book.autor,
      cover: entry.book.capa,
      totalPages: entry.book.paginas,
      currentPage: entry.currentPage || 0,
    }));
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



  if (loading) return <Spinner label="Carregando..." />;

  const progresso = selectedBook
  ? Math.round((selectedBook.currentPage / selectedBook.totalPages) * 100)
  : 0;

return (
  <div style={{ padding: "2rem" }}>
    <Text size={700} weight="bold">
      👋 Olá, {studentName}!
    </Text>


    {selectedBook ? (
      <StudentBookDetails
        email={email}
        bookId={selectedBook.id}
        onRegisterProgress={handleProgressSubmit}
        progressJustRegistered={progressJustRegistered}

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


    {books.length > 1 && (
      <>
      
        <Text size={600} weight="semibold" style={{ marginTop: "2rem" }}>
          📚 Outros Livros em Leitura
        </Text>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
          {books
            .filter((book) => !selectedBook || book.id !== selectedBook.id)
            .map((book) => (
              <Card key={book.id} style={{ width: "200px" }}>
                <img
                  src={book.cover}
                  alt="Capa do livro"
                  style={{ height: "100px", margin: "1rem auto", display: "block" }}
                />
                <Text weight="semibold">{book.title}</Text>
                <Text size={300}>Autor: {book.author}</Text>
                <Button
                  appearance="secondary"
                  style={{ marginTop: "0.5rem" }}
                  onClick={() => setSelectedBook(book)}
                >
                  Selecionar
                </Button>
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
            {badge.nome || badge.titulo}
          </Text>
          {badge.descricao && (
            <Text size={300} style={{ color: "#666", textAlign: "center", marginTop: 4 }}>
              {badge.descricao}
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
    </div>
  );
}
