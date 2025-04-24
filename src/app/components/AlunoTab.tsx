import React, { useEffect, useState } from "react";
import { Card, Text, Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from "@fluentui/react-components";
import { getStudentLogs, getStudentQuizzes } from "../services/api";
import { useNavigate } from "react-router-dom";

// ...imports...

export function AlunoTab({ aluno, grade, turma, bookId }: { aluno: any; grade: string; turma: string; bookId: string }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [booksRead, setBooksRead] = useState<any[]>([]);
    const [booksReading, setBooksReading] = useState<any[]>([]);
    const navigate = useNavigate();
    useEffect(() => {
        async function load() {
            const logsData = await getStudentLogs(aluno.email);
            setLogs(logsData);
            const quizzesData = await getStudentQuizzes(aluno.email);
            setQuizzes(quizzesData);

            // Agrupa livros por título usando log.bookTitle
            const books: Record<string, any[]> = logsData.reduce((acc: Record<string, any[]>, log: any) => {
                if (!acc[log.bookTitle]) acc[log.bookTitle] = [];
                acc[log.bookTitle].push(log);
                return acc;
            }, {});
            const finishedBooks: string[] = [];
            const readingBooks: string[] = [];
            Object.entries(books).forEach(([bookTitle, logs]: [string, any[]]) => {
                const finished = logs.some((l) => l.status === "finished");
                if (finished) finishedBooks.push(bookTitle);
                else readingBooks.push(bookTitle);
            });
            setBooksRead(finishedBooks);
            setBooksReading(readingBooks);
        }
        if (aluno?.email) load();
    }, [aluno]);

    function formatDate(dateStr?: string) {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "-";
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    }
    function formatTime(dateStr?: string) {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? "-" : d.toLocaleTimeString();
    }

    return (
        <div style={{ padding: 24 }}>
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
        <Text size={700} weight="bold">👤 Perfil do Aluno</Text>
    <Card style={{ margin: "16px 0", padding: 16 }}>
                <Text size={600} weight="semibold">{aluno.name}</Text>
                <div><b>Email:</b> {aluno.email}</div>
                <div><b>Turma:</b> {grade} - {turma}</div>
            </Card>

            <Card style={{ margin: "16px 0", padding: 16 }}>
                <Text weight="semibold">📚 Livros lidos</Text>
                <div>
                    {booksRead.length === 0 ? (
                        <span>Nenhum livro finalizado.</span>
                    ) : (
                        booksRead.map((bookTitle, i) => (
                            <Badge key={i} appearance="filled" color="brand" style={{ marginRight: 8 }}>
                                {bookTitle}
                            </Badge>
                        ))
                    )}
                </div>
                <Text weight="semibold" style={{ marginTop: 12, display: "block" }}>📖 Livros em leitura</Text>
                <div>
                    {booksReading.length === 0 ? (
                        <span>Nenhum livro em leitura.</span>
                    ) : (
                        booksReading.map((bookTitle, i) => (
                            <Badge key={i} appearance="outline" color="important" style={{ marginRight: 8 }}>
                                {bookTitle}
                            </Badge>
                        ))
                    )}
                </div>
            </Card>

            <Card style={{ margin: "16px 0", padding: 16 }}>
                <Text weight="semibold">🕒 Horários e Dias de Leitura</Text>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell>Data</TableHeaderCell>
                            <TableHeaderCell>Horário</TableHeaderCell>
                            <TableHeaderCell>Livro</TableHeaderCell>
                            <TableHeaderCell>Página</TableHeaderCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4}>Nenhum log encontrado.</TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log, i) => (
                                <TableRow key={i}>
                                    <TableCell>{formatDate(log.timestamp)}</TableCell>
                                    <TableCell>{formatTime(log.timestamp)}</TableCell>
                                    <TableCell>{log.bookTitle}</TableCell>
                                    <TableCell>{log.pageNumber}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <Card style={{ margin: "16px 0", padding: 16 }}>
                <Text weight="semibold">📝 Quizzes Respondidos</Text>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell>Livro</TableHeaderCell>
                            <TableHeaderCell>Capítulo</TableHeaderCell>
                            <TableHeaderCell>Pontuação</TableHeaderCell>
                            <TableHeaderCell>Data</TableHeaderCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {quizzes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4}>Nenhum quiz respondido.</TableCell>
                            </TableRow>
                        ) : (
                            quizzes.map((quiz, i) => (
                                <TableRow key={i}>
                                    <TableCell>{quiz.bookTitle || quiz.bookId}</TableCell>
                                    <TableCell>{quiz.capitulo ?? "-"}</TableCell>
                                    <TableCell>{quiz.pontuacao ?? "-"}</TableCell>
                                    <TableCell>{formatDate(quiz.respondidoEm)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}