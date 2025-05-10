import { useState, useEffect } from "react";
import {
    Button,
    Input,
    Text,
    Card,
    Select,
    Dialog,
    DialogSurface,
    DialogBody,
    DialogTitle,
    DialogContent,
    DialogActions,
    Field,
} from "@fluentui/react-components";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import { criarDesafio } from "../services/api";
import { getBooks } from "../services/api";

interface TeacherDesafioFormProps {
    turma: string;
    ano: string;
    teacherEmail: string;
    onDesafioCreated: () => void;
}

export function TeacherDesafioForm({ turma,ano, teacherEmail, onDesafioCreated }: TeacherDesafioFormProps) {
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [tipo, setTipo] = useState<"geral" | "livro-especifico">("geral");
    const [livroId, setLivroId] = useState<string>("");
    const [dataInicio, setDataInicio] = useState<Date | null>(null);
    const [dataFim, setDataFim] = useState<Date | null>(null);
    const [metaTipo, setMetaTipo] = useState<"paginas" | "livros" | "tempo">("paginas");
    const [metaValor, setMetaValor] = useState<number>(0);
    const [badgeId, setBadgeId] = useState("");
    const [badgeNome, setBadgeNome] = useState("");
    const [livros, setLivros] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadLivros = async () => {
        try {
            const books = await getBooks(ano);
            console.log("Loaded books:", books); // Debug log
            setLivros(books);
        } catch (err) {
            console.error("Erro ao carregar livros:", err);
            setError("Erro ao carregar lista de livros");
        }
    };

    // Load books when component mounts
    useEffect(() => {
        loadLivros();
    }, []);

    const handleSubmit = async () => {
        if (!dataInicio || !dataFim) {
            setError("Por favor, selecione as datas de início e fim");
            return;
        }

        if (!badgeNome) {
            setError("Por favor, defina um nome para o badge");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await criarDesafio({
                titulo,
                descricao,
                tipo,
                livroId: tipo === "livro-especifico" ? livroId : undefined,
                turma,
                grade: ano,
                dataInicio: dataInicio.toISOString(),
                dataFim: dataFim.toISOString(),
                meta: {
                    tipo: metaTipo,
                    points: metaValor
                },
                badge: {
                    id: badgeId,
                    nome: badgeNome
                },
                criadoPor: teacherEmail
            });

            onDesafioCreated();
            // Reset form
            setTitulo("");
            setDescricao("");
            setTipo("geral");
            setLivroId("");
            setDataInicio(null);
            setDataFim(null);
            setMetaTipo("paginas");
            setMetaValor(0);
            setBadgeId("");
            setBadgeNome("");
        } catch (err) {
            setError("Erro ao criar desafio. Tente novamente mais tarde.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card style={{ padding: "1rem", marginBottom: "1rem" }}>
            <Text size={600} weight="bold" style={{ marginBottom: "1rem" }}>
                Criar Novo Desafio
            </Text>

            {error && (
                <Text style={{ color: "red", marginBottom: "1rem" }}>{error}</Text>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Field label="Título">
                    <Input
                        value={titulo}
                        onChange={(_, data) => setTitulo(data.value)}
                        placeholder="Título do desafio"
                    />
                </Field>

                <Field label="Descrição">
                    <Input
                        value={descricao}
                        onChange={(_, data) => setDescricao(data.value)}
                        placeholder="Descrição do desafio"
                    />
                </Field>

                <Field label="Tipo de Desafio">
                    <Select
                        value={tipo}
                        onChange={(_, data) => {
                            setTipo(data.value as "geral" | "livro-especifico");
                            if (data.value === "geral") setLivroId("");
                        }}
                    >
                        <option value="geral">Geral</option>
                        <option value="livro-especifico">Livro Específico</option>
                    </Select>
                </Field>

                {tipo === "livro-especifico" && (
                    <Field label="Livro">
                        <Select
                            value={livroId}
                            onChange={(_, data) => setLivroId(data.value)}
                            onClick={loadLivros}
                        >
                            <option value="">Selecione um livro</option>
                            {livros.map(livro => (
                                console.log("livro", livro),    
                                <option key={livro.id} value={livro.id}>
                                    {livro.titulo} - {livro.autor}
                                </option>
                            ))}
                        </Select>
                    </Field>
                )}

                <Field label="Data de Início">
                    <DatePicker
                        value={dataInicio}
                        onSelectDate={(date) => setDataInicio(date || null)}
                    />
                </Field>

                <Field label="Data de Fim">
                    <DatePicker
                        value={dataFim}
                        onSelectDate={(date) => setDataFim(date || null)}
                    />
                </Field>

                <Field label="Tipo de Meta">
                    <Select
                        value={metaTipo}
                        onChange={(_, data) => setMetaTipo(data.value as "paginas" | "livros" | "tempo")}
                    >
                        <option value="paginas">Número de Páginas</option>
                        <option value="livros">Número de Livros</option>
                        <option value="tempo">Tempo de Leitura (minutos)</option>
                    </Select>
                </Field>

                <Field label="Valor da Meta">
                    <Input
                        type="number"
                        value={metaValor.toString()}
                        onChange={(_, data) => setMetaValor(Number(data.value))}
                        placeholder="Valor da meta"
                    />
                </Field>

                <Field label="Nome do Badge" hint="Nome que será exibido para os alunos">
                    <Input
                        value={badgeNome}
                        onChange={(_, data) => setBadgeNome(data.value)}
                        placeholder="Ex: Leitor Ávido, Mestre da Leitura"
                    />
                </Field>

                <Field label="ID do Badge" hint="Identificador único do badge (para uso interno)">
                    <Input
                        value={badgeId}
                        onChange={(_, data) => setBadgeId(data.value)}
                        placeholder="Ex: leitor-avido, mestre-leitura"
                    />
                </Field>

                <Button
                    appearance="primary"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Criando..." : "Criar Desafio"}
                </Button>
            </div>
        </Card>
    );
} 