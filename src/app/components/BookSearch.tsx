import { useState } from "react";
import { Button, Input, Card, Text, Spinner } from "@fluentui/react-components";
import { Search24Regular } from "@fluentui/react-icons";
import { getBooks } from "../services/api";

interface Book {
  id: string;
  titulo: string;
  autor: string;
  capa: string;
  paginas: number;
}

interface BookSearchProps {
  onSelectBook: (book: Book) => void;
  studentGrade: string;
  studentEmail: string;
}

export function BookSearch({ onSelectBook, studentGrade, studentEmail }: BookSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const allBooks = await getBooks(studentEmail);
      const filteredBooks = allBooks.filter((book: Book) => 
        book.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.autor.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setBooks(filteredBooks);
    } catch (err) {
      setError("Erro ao buscar livros. Tente novamente mais tarde.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <Input
          placeholder="Buscar por título ou autor..."
          value={searchTerm}
          onChange={(_, data) => setSearchTerm(data.value)}
          style={{ flex: 1 }}
        />
        <Button 
          appearance="primary" 
          icon={<Search24Regular />}
          onClick={handleSearch}
          disabled={loading}
        >
          Buscar
        </Button>
      </div>

      {error && (
        <Text style={{ color: "red", marginBottom: "1rem" }}>{error}</Text>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <Spinner size="large" />
        </div>
      )}

      {!loading && books.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {books.map(book => (
            <Card key={book.id} style={{ padding: "1rem" }}>
              {book.capa && (
                <img
                  src={book.capa}
                  alt={`Capa do livro ${book.titulo}`}
                  style={{ width: "100%", height: "auto", marginBottom: "0.5rem" }}
                />
              )}
              <Text weight="semibold" block>{book.titulo}</Text>
              <Text size={200} block>Autor: {book.autor}</Text>
              <Text size={200} block>Páginas: {book.paginas}</Text>
              {["5", "6", "7", "8"].includes(studentGrade) && (
                <Button
                  appearance="primary"
                  style={{ marginTop: "0.5rem", width: "100%" }}
                  onClick={() => onSelectBook(book)}
                >
                  Escolher este livro
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {!loading && searchTerm && books.length === 0 && (
        <Text style={{ textAlign: "center", padding: "2rem" }}>
          Nenhum livro encontrado para "{searchTerm}"
        </Text>
      )}
    </div>
  );
} 