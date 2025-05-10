// DiscoverTab.tsx
import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardFooter,
  Input,
  Text,
  Spinner,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  Checkbox,
} from "@fluentui/react-components";
import {
  Search20Regular,
  Add20Regular,
} from "@fluentui/react-icons";
import { addBookToShelf, getPersonalBooks, getCurricularBooks, searchBooksApi } from "../services/api";
import { GetStudentInfoResponse } from "../services/api";

export function DiscoverTab({ userRole, studentInfo }: { userRole: "student" | "teacher"; studentInfo: GetStudentInfoResponse | undefined }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myBooks, setMyBooks] = useState<any[]>([]);
  const [availableCurricularBooks, setAvailableCurricularBooks] = useState<any[]>([]);
  const [selectedCurricularBooks, setSelectedCurricularBooks] = useState<string[]>([]);
  const [showCurricularFlyout, setShowCurricularFlyout] = useState(false);

  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualPages, setManualPages] = useState("");

  const handleAddManualBook = async () => {
    const formatted = {
      titulo: manualTitle,
      autor: manualAuthor,
      paginas: Number(manualPages) || 1,
      capa: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3slNee41Ulz9F4KR8Y4m9evVmp4h_IKhtXg&s.png",
      type: "manual"
    };
    if (!myBooks.find((b) => b.titulo === formatted.titulo)) {
      setMyBooks([...myBooks, formatted]);
      try {
        await addBookToShelf(email, formatted);
      } catch (err) {
        console.error("Erro ao salvar livro manual:", err);
      }
    }
    setShowManualDialog(false);
    setManualTitle("");
    setManualAuthor("");
    setManualPages("");
  };

  const email = studentInfo?.email || "";
  const grade = studentInfo?.grade || "";

  async function searchBooks(query: string) {
    // Agora chama o backend, que faz o request ao Google Books
    const books = await searchBooksApi(query,studentInfo?.grade || "");
    return books;
  }
  
  const handleSearch = async () => {
    setLoading(true);
    const res = await searchBooks(searchQuery);
    setResults(res);
    setLoading(false);
  };
 
  const handleAddBook = async (book: any) => {
    const formatted = {
      titulo: book.title,
      autor: book.author,
      paginas: book.pageCount || 100,
      capa: book.thumbnail,
      type: "personal"
    };

    if (!myBooks.find((b) => b.titulo === formatted.titulo)) {
      setMyBooks([...myBooks, formatted]);
      try {
        console.log("Adicionando livro à estante:", formatted);
        await addBookToShelf(email, formatted);
        
      } catch (err) {
        console.error("Erro ao salvar na DB:", err);
      }
    }
  };

  const handleOpenCurricularFlyout = async () => {
    try {
      const books = await getCurricularBooks(grade);
      const notOwned = books.filter((book: any) => !myBooks.find((b) => b.titulo === book.titulo));
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
      setMyBooks((prev) => [...prev, book]);
      await addBookToShelf(email, { ...book, type: "curricular" });
    }
    setShowCurricularFlyout(false);
  };

  const toggleSelectBook = (titulo: string) => {
    setSelectedCurricularBooks((prev) =>
      prev.includes(titulo) ? prev.filter((t) => t !== titulo) : [...prev, titulo]
    );
  };

  React.useEffect(() => {
    async function fetchBooks() {
      try {
        const books = await getPersonalBooks(email);
        console.log("Livros encontrados:", books);
        setMyBooks(books);
      } catch (err) {
        console.error("Erro ao buscar livros do estudante:", err);
      }
    }
    if (userRole === "student") {
      fetchBooks();
    }
  }, [email, userRole]);

  return (
    <div style={{ padding: "1.6rem" }}>
      <h1>🔍 Descobrir Livros</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
        <Input
          contentBefore={<Search20Regular />}
          placeholder="Buscar livros infantis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button onClick={handleSearch} appearance="primary">Buscar</Button>
      </div>

      {loading && <Spinner label="Buscando livros..." />}

      {results.length > 0 && (
        <>
          <h2>🔎 Resultados da Busca</h2>
          <div style={{ display: "flex", overflowX: "auto", gap: 16 }}>
            {results.map((book, idx) => (
              <Card key={idx} style={{ minWidth: 240 }}>
                <CardHeader
  header={book.title}
  description={`por ${book.author}${book.pageCount ? ` • ${book.pageCount} páginas` : ""}`}
/>
                {book.thumbnail && (
                  <img src={book.thumbnail} alt="Capa" style={{ maxWidth: 100, margin: 8 }} />
                )}
                <CardFooter>
                  <Button size="small" onClick={() => handleAddBook(book)}>
                    📥 Adicionar à estante
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
      {results.length === 0 && !loading && (
  <div style={{ margin: "2rem 0", textAlign: "center" }}>
    <Text size={400}>
      Nenhum livro encontrado.<br />
      <span style={{ color: "#666" }}>
        Você pode adicionar um livro manualmente clicando em <b>➕ Adicionar Livro Manualmente</b> abaixo.
      </span>
    </Text>
  </div>
)}

      {userRole === "student" && (
        <>
         <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      
        <Button appearance="secondary" onClick={() => setShowManualDialog(true)}>
          ➕ Adicionar Livro Manualmente
        </Button>
      </div>
      {/* ...restante do código... */}
      <Dialog open={showManualDialog} onOpenChange={(_, data) => !data.open && setShowManualDialog(false)}>
  <DialogSurface>
    <DialogBody>
      <DialogTitle>Adicionar Livro Manualmente</DialogTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
        <Input
          placeholder="Título do livro"
          value={manualTitle}
          onChange={e => setManualTitle(e.target.value)}
        />
        <Input
          placeholder="Autor"
          value={manualAuthor}
          onChange={e => setManualAuthor(e.target.value)}
        />
        <Input
  placeholder="Número de páginas"
  type="number"
  min={1}
  value={manualPages}
  onChange={e => {
    // Permite apenas inteiros positivos (remove sinais negativos e zeros à esquerda)
    let val = e.target.value.replace(/[^0-9]/g, "");
    // Remove zeros à esquerda
    val = val.replace(/^0+/, "");
    setManualPages(val);
  }}
/>
      </div>
      <DialogActions>
        <Button onClick={() => setShowManualDialog(false)}>Cancelar</Button>
        <Button
  appearance="primary"
  disabled={
    !manualTitle.trim() ||
    !manualAuthor.trim() ||
    !manualPages.trim() ||
    isNaN(Number(manualPages)) ||
    Number(manualPages) <= 0 ||
    !Number.isInteger(Number(manualPages))
  }
  onClick={handleAddManualBook}
>
  Adicionar
</Button>
      </DialogActions>
    </DialogBody>
  </DialogSurface>
</Dialog>
          <Button appearance="secondary" onClick={handleOpenCurricularFlyout} style={{ marginBottom: "1rem" }}>
            ➕ Adicionar Livros Curriculares do {grade}º ano
          </Button>
          <h2>📚 Minha Estante</h2>

          {myBooks.length === 0 ? (
            <Text>Você ainda não adicionou nenhum livro.</Text>
          ) : (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {myBooks.map((book, index) => (
                <Card key={index} style={{ width: 220, marginBottom: "1rem" }}>
                  <CardHeader
                    header={book.title || book.titulo}
                    description={`Autor: ${book.author || book.autor}${book.progress !== undefined ? ` - Progresso: ${book.progress}%` : ""}`}
                  />
                  <img
                    src={book.thumbnail || book.cover || book.capa}
                    alt={book.title || book.titulo}
                    style={{ height: "150px", width: "100px", objectFit: "cover", borderRadius: "4px", margin: "0 auto" }}
                  />
                  {book.progress !== undefined && (
                    <div style={{ marginTop: 8 }}>
                      <Text size={300}>Progresso: {book.progress}%</Text>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

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
        </>
      )}

      {userRole === "teacher" && (
        <>
          <h2>📌 Criar Lista de Livros</h2>
          <Button icon={<Add20Regular />} appearance="primary">
            Adicionar Livro Recomendado
          </Button>
        </>
      )}
    </div>
  );
}