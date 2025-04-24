import React, { useEffect, useState } from "react";
import {
  Text,
  Card,
  CardHeader,
  Divider,
  Spinner,
  Button,
} from "@fluentui/react-components";
import { Add20Regular } from "@fluentui/react-icons";
import { getStudentBooks } from "../services/api";

export function StudentBooks({ email }: { email: string }) {
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<{
    currentlyReading: { id: string; title: string; author: string; progress: number; cover: string; totalPages?: number }[];
    completed: { id: string; title: string; author: string; progress: number; cover: string; totalPages?: number }[];
    wantToRead: { id: string; title: string; author: string; progress: number; cover: string; totalPages?: number }[];
  }>({
    currentlyReading: [],
    completed: [],
    wantToRead: [],
  });

  useEffect(() => {
    async function fetchBooks() {
      try {
        console.log("Fetching books for user:", email);
        const data: { id: string; title: string; author: string; progress: number; cover: string; totalPages?: number }[] = await getStudentBooks(email);
        console.log("Books data:", data);
        // Categorize books based on progress
        const currentlyReading = data.filter((book: any) => book.progress > 0 && book.progress < 100);
        const completed = data.filter((book: any) => book.progress === 100);
        const wantToRead = data.filter((book: any) => book.progress === 0);
        console.log("Books categorized:", { currentlyReading, completed, wantToRead });
        setBooks({ currentlyReading, completed, wantToRead });
      } catch (err) {
        console.error("Erro ao buscar livros do aluno:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, [email]);

  if (loading) return <Spinner label="Carregando seus livros..." />;

  return (
    <div style={{ padding: "1.6rem" }}>
      <Text size={700} weight="bold">📚 Meus Livros</Text>
      <Divider style={{ marginBottom: "1rem" }} />
      {/* 📖 Currently Reading */}
      <h2>📖 Em Leitura</h2>
      {books.currentlyReading.length > 0 ? (
        console.log("Livros em leitura:", books.currentlyReading),
        books.currentlyReading.map((book) => (
          <Card key={book.id} style={{ marginBottom: "1rem" }}>
            <CardHeader
              header={book.title}
              description={`Autor: ${book.author} - Progresso: ${book.progress}%`}
            />
            <img
              src={book.cover}
              alt={book.title}
              style={{ height: "150px", width: "100px", objectFit: "cover", borderRadius: "4px" }}
            />
          </Card>
        ))
      ) : <Text>Nenhum livro em leitura no momento.</Text>}

      {/* ✅ Completed Books */}
      <h2>✅ Finalizados</h2>
      {books.completed.length > 0 ? (
        books.completed.map((book) => (
          <Card key={book.id} style={{ marginBottom: "1rem" }}>
            <CardHeader
              header={book.title}
              description={`Autor: ${book.author} - Páginas: ${book.totalPages}`}
            />
            <img
              src={book.cover}
              alt={book.title}
              style={{ height: "150px", width: "100px", objectFit: "cover", borderRadius: "4px" }}
            />
          </Card>
        ))
      ) : <Text>Você ainda não finalizou nenhum livro.</Text>}

      {/* 🎯 Want to Read */}
      <h2>🎯 Ainda por iniciar</h2>
    {books.wantToRead.length > 0 ? (
        books.wantToRead.map((book) => (
          <Card key={book.id} style={{ marginBottom: "1rem" }}>
            <CardHeader
              header={book.title}
              description={`Autor: ${book.author}`}
            />
            <img
              src={book.cover}
              alt={book.title}
              style={{ height: "150px", width: "100px", objectFit: "cover", borderRadius: "4px" }}
            />
          </Card>
        ))
      ) : <Text>Nenhum livro na lista de leitura futura.</Text>}
    </div>
  );
}