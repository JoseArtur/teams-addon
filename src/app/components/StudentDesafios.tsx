import { useState, useEffect } from "react";
import { Card, Text, ProgressBar, Badge } from "@fluentui/react-components";
import { getDesafiosAluno } from "../services/api";

interface Desafio {
    id: string;
    titulo: string;
    descricao: string;
    tipo: "geral" | "livro-especifico" | "quiz";
    status: "em-andamento" | "concluido" | "ativo";
    meta: {
        tipo: "paginas" | "livros" | "tempo" | "quiz";
        points: number;
        quiz?: {
            bookId: string;
            capitulo: number;
            tipo: string;
        };
    };
    progresso: number;
    dataInicio: string;
    dataFim: string;
    livroId?: string;
    badge?: {
        id: string;
        nome: string;
        icone?: string;
    };
    grade?: string;
    turma?: string;
}

interface StudentDesafiosProps {
    email: string;
}

export function StudentDesafios({ email }: StudentDesafiosProps) {
    const [desafios, setDesafios] = useState<Desafio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDesafios();
    }, [email]);

    const loadDesafios = async () => {
        try {
            const data = await getDesafiosAluno(email);
            // Sort challenges by status (completed first) and then by end date
            const sortedData = data.sort((a: Desafio, b: Desafio) => {
                if (a.status === "concluido" && b.status !== "concluido") return -1;
                if (a.status !== "concluido" && b.status === "concluido") return 1;
                return new Date(a.dataFim).getTime() - new Date(b.dataFim).getTime();
            });
            setDesafios(sortedData);
            console.log('Desafios carregados:', sortedData);
        } catch (err) {
          //  setError("Erro ao carregar desafios. Tente novamente mais tarde.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Text>Carregando desafios...</Text>;
    }

    if (error) {
        return <Text style={{ color: "red" }}>{error}</Text>;
    }

    if (desafios.length === 0) {
        return (
            <Card style={{ padding: "1rem", textAlign: "center" }}>
                <Text>Nenhum desafio ativo no momento.</Text>
            </Card>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {desafios.map(desafio => (
                <Card key={desafio.id} style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text size={500} weight="bold">
                            {desafio.tipo === "quiz" ? `Quiz do Capítulo ${desafio.meta.quiz?.capitulo}` : desafio.titulo}
                        </Text>
                        <Badge appearance="filled" color={
                            desafio.status === "concluido" ? "success" : 
                            desafio.status === "ativo" ? "brand" : "warning"
                        }>
                            {desafio.status === "concluido" ? "Concluído" : 
                             desafio.status === "ativo" ? "Ativo" : "Em Andamento"}
                        </Badge>
                    </div>

                    <Text style={{ marginTop: "0.5rem" }}>
                        {desafio.tipo === "quiz" 
                            ? `Complete o quiz do capítulo ${desafio.meta.quiz?.capitulo} para ganhar pontos e medalhas!`
                            : desafio.descricao}
                    </Text>

                    {desafio.tipo === "livro-especifico" && (
                        <Text size={200} style={{ marginTop: "0.5rem" }}>
                            Livro: {desafio.livroId}
                        </Text>
                    )}

                    <div style={{ marginTop: "1rem" }}>
                        {desafio.tipo === "quiz" ? (
                            <div>
                                <Text size={200}>
                                    Status: {desafio.progresso === 100 ? "Quiz Concluído" : "Quiz Pendente"}
                                </Text>
                                <ProgressBar
                                    value={desafio.progresso || 0}
                                    max={100}
                                    style={{ marginTop: "0.5rem" }}
                                />
                            </div>
                        ) : (
                            <>
                                <Text size={200}>
                                    Meta: {desafio.meta.points} {desafio.meta.tipo === "paginas" ? "páginas" : 
                                        desafio.meta.tipo === "livros" ? "livros" : "minutos"}
                                </Text>
                                <ProgressBar
                                    value={desafio.progresso || 0}
                                    max={desafio.meta.points}
                                    style={{ marginTop: "0.5rem" }}
                                />
                                <Text size={200} style={{ marginTop: "0.5rem" }}>
                                    Progresso: {desafio.progresso || 0} / {desafio.meta.points}
                                </Text>
                            </>
                        )}
                    </div>

                    <div style={{ marginTop: "1rem" }}>
                        <Text size={200}>
                            {desafio.tipo === "quiz" 
                                ? `Prazo: até ${new Date(desafio.dataFim).toLocaleDateString()}`
                                : `Período: ${new Date(desafio.dataInicio).toLocaleDateString()} até ${new Date(desafio.dataFim).toLocaleDateString()}`}
                        </Text>
                    </div>

                    {desafio.status === "concluido" && desafio.badge && (
                        <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Badge appearance="filled" color="success">🏆</Badge>
                            <Text>Você ganhou o badge {desafio.badge.nome} por completar este desafio!</Text>
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
} 