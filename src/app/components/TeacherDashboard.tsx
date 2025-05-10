import React, { useState, useEffect } from "react";
import {
  Text,
  Card,
  Divider,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  getClasses,
  getClassStudents,
  getBooks,
  getStudentBookProgressByClass,
} from "../services/api";
import { Badge } from "@fluentui/react-components";
import { getQuiz } from "../services/api"; // Certifique-se de ter esta função
import { Button } from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function TeacherDashboard({ email }: { email: string }) {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [livros, setLivros] = useState<any[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<any>(null);
  const [livroSelecionado, setLivroSelecionado] = useState<any>(null);
  const [classData, setClassData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<"points" | "progress">("points");
  const [quizStats, setQuizStats] = useState<any[]>([]);
  const [recentBadges, setRecentBadges] = useState<any[]>([]);
  const navigate = useNavigate();

  // Carrega turmas do backend
  useEffect(() => {
    async function loadInitial() {
      const turmasBE = await getClasses(email); // [{ grade, turma }]
      console.log("Turmas BE:", turmasBE);
      setTurmas(turmasBE);
      if (turmasBE.length > 0) {
        setTurmaSelecionada(turmasBE[0]);
      }
    }
    loadInitial();
  }, [email]);
  useEffect(() => {
    if (
      turmaSelecionada &&
      ["5", "6", "7", "8"].includes(String(turmaSelecionada.grade))
    ) {
      navigate("/teacher-escolhidos", { state: { email, turmaSelecionada } });
    }
  }, [turmaSelecionada, navigate]);

  // Carrega livros do backend ao mudar turma
  useEffect(() => {
    async function loadBooks() {
      console.log("Carregando livros para a turma:", turmaSelecionada);
      if (!turmaSelecionada) return;

      const livrosBE = await getBooks(turmaSelecionada.grade);
      console.log("Livros BE:", livrosBE);
      setLivros(livrosBE);
      if (livrosBE.length > 0) setLivroSelecionado(livrosBE[0]);
    }
    loadBooks();
  }, [turmaSelecionada]);

  // Carrega dados dos alunos da turma selecionada e progresso do livro selecionado
  useEffect(() => {
    async function loadClassData() {
      if (!turmaSelecionada || !livroSelecionado) return;
      const progressList = await getStudentBookProgressByClass(
        turmaSelecionada.grade,
        turmaSelecionada.turma,
        livroSelecionado.id || livroSelecionado // id do livro
      );
      setClassData(progressList);

      // Leaderboard por pontos (se disponível)
      console.log("Progresso dos alunos:", progressList);
      const leaderboardData = progressList
        .map((s: any) => ({
          name: s.name,
          email: s.email,
          points: s.points || 0,
          progress: s.progress || 0,
        }))
        .sort((a: any, b: any) => b.points - a.points);
      setLeaderboard(leaderboardData);
    }
    if (turmaSelecionada && livroSelecionado) {
      loadClassData();
    }
  }, [turmaSelecionada, livroSelecionado]);

  useEffect(() => {
    async function loadQuizStatsAndBadges() {
      if (!classData || !livroSelecionado) return;
      // Para cada capítulo do livro, busca quantos responderam e média de pontos
      if (!livroSelecionado.capitulos) return;
      const stats = await Promise.all(
        livroSelecionado.capitulos.map(async (cap: any, idx: number) => {
          // Supondo que cada aluno em classData tem quizzesRespondidos: [{capitulo, score}]
          const alunosComQuiz = classData.filter((aluno: any) =>
            Array.isArray(aluno.quizzesRespondidos) &&
            aluno.quizzesRespondidos.some((q: any) => q.capitulo === idx + 1)
          );
          const total = alunosComQuiz.length;
          const media =
            total > 0
              ? Math.round(
                  alunosComQuiz.reduce((acc: number, aluno: any) => {
                    const q = aluno.quizzesRespondidos.find((q: any) => q.capitulo === idx + 1);
                    return acc + (q?.score || 0);
                  }, 0) / total
                )
              : 0;
          return {
            capitulo: cap.titulo,
            total,
            media,
          };
        })
      );
      console.log("Estatísticas dos quizzes:", stats);
      setQuizStats(stats);

      // Destaque de medalhas recentes (exemplo: pega últimos 5 alunos que ganharam medalha)
      const badges: any[] = [];
      console.log("Dados da turma:", classData);
      classData.forEach((aluno: any) => {
        if (Array.isArray(aluno.badges)) {
          aluno.badges.forEach((badge: any) => {
            badges.push({ name: aluno.name, badge, date: badge.date || "" });
          });
        }
      });
      badges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentBadges(badges.slice(0, 5));
    }
    if (classData && livroSelecionado && livroSelecionado.capitulos) {
      loadQuizStatsAndBadges();
    }
  }, [classData, livroSelecionado]);


  const mediaLivro =
    classData && classData.length > 0
      ? Math.round(
          classData.reduce((acc: number, s: any) => acc + (s.progress || 0), 0) /
            classData.length
        )
      : 0;

      const sortedLeaderboard = [...leaderboard].sort((a, b) =>
        sortBy === "points"
          ? b.points - a.points
          : b.progress - a.progress
      );

      return (
    
    <div style={{ padding: "2rem" }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <Button appearance="primary" onClick={() => navigate("/meus-alunos", { state: { turmaSelecionada, livroSelecionado } })}>
          Meus Alunos
        </Button>
        <Button
  appearance="secondary"
  onClick={() =>
    navigate("/quizzes-desafios", {
      state: { turmaSelecionada, livroSelecionado },
    })
  }
>
  Quizzes e Desafios
</Button>
        {classData && classData.length > 0 && (
          <Dropdown
            placeholder="Ver como Aluno"
            onOptionSelect={(_, data) => {
              const student = classData.find((s: any) => s.name === data.optionValue);
              if (student) {
                navigate("/student-dashboard", { 
                  state: { 
                    studentInfo: {
                      email: student.email,
                      name: student.name,
                      grade: turmaSelecionada.grade,
                      turma: turmaSelecionada.turma
                    },
                    isTeacherView: true
                  }
                });
              }
            }}
          >
            {classData.map((student: any) => (
              <Option key={student.email} value={student.name}>
                {student.name}
              </Option>
            ))}
          </Dropdown>
        )}
          </div>
      <Text size={700} weight="bold">
        👩‍🏫 Painel do Professor
      </Text>
      <Divider style={{ margin: "1rem 0" }} />

      <Dropdown
        placeholder="Selecione a Turma"
        value={turmaSelecionada ? `${turmaSelecionada.grade} - ${turmaSelecionada.turma}` : ""}
        onOptionSelect={(_, data) => {
          const turma = turmas.find(
            (t) => `${t.grade} - ${t.turma}` === data.optionValue
          );
          setTurmaSelecionada(turma);
        }}
        style={{ marginBottom: "1rem" }}
      >
        {turmas.map((turma) => (
              <Option
              key={`${turma.grade}-${turma.turma}`}
              value={`${turma.grade} - ${turma.turma}`}
              text={`${turma.grade} - ${turma.turma}`}
            >
              {turma.grade} - {turma.turma}
            </Option>
        ))}
      </Dropdown>

      <Dropdown
        placeholder="Livro"
        value={livroSelecionado ? livroSelecionado.titulo || livroSelecionado.title : ""}
        onOptionSelect={(_, data) => {
          const livro = livros.find(
            (l) => (l.titulo || l.title) === data.optionValue
          );
          setLivroSelecionado(livro);
        }}
        style={{ marginBottom: "1rem" }}
      >
        {livros.map((livro) => (
          <Option key={livro.id || livro.title} value={livro.titulo || livro.title}>
            {livro.titulo || livro.title}
          </Option>
        ))}
      </Dropdown>

      {classData && (
        <>
          <Card style={{ padding: "1rem", marginBottom: "1rem" }}>
            <Text size={600} weight="semibold">
              📈 Resumo da Turma
            </Text>
            <p>
              <strong>Turma:</strong> {turmaSelecionada.grade} - {turmaSelecionada.turma}
            </p>
            <p>
              <strong>Alunos:</strong> {classData.length}
            </p>
            <p>
              <strong>Média de Progresso no Livro:</strong> {mediaLivro}%
            </p>
          </Card>

          <Card style={{ padding: "1rem", marginBottom: "1rem" }}>
        <Text weight="semibold">🏆 Ranking da Turma (por pontos ou progresso)</Text>
        <div style={{ marginBottom: 12 }}>
          <label>
            <input
              type="radio"
              name="sort"
              value="points"
              checked={sortBy === "points"}
              onChange={() => setSortBy("points")}
              style={{ marginRight: 4 }}
            />
            Ordenar por Pontos
          </label>
          <label style={{ marginLeft: 16 }}>
            <input
              type="radio"
              name="sort"
              value="progress"
              checked={sortBy === "progress"}
              onChange={() => setSortBy("progress")}
              style={{ marginRight: 4 }}
            />
            Ordenar por Progresso (%)
          </label>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>#</TableHeaderCell>
              <TableHeaderCell>Aluno</TableHeaderCell>
              <TableHeaderCell>Pontos</TableHeaderCell>
              <TableHeaderCell>Progresso (%)</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLeaderboard.map((entry, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{entry.name}</TableCell>
                <TableCell>{entry.points}</TableCell>
                <TableCell>{entry.progress}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

          <Card style={{ padding: "1rem" }}>
            <Text weight="semibold">
              📊 Gráfico de Progresso no Livro – {livroSelecionado?.titulo || livroSelecionado?.title}
            </Text>
            <Bar
              data={{
                labels: classData.map((s: any) => s.name),
                datasets: [
                  {
                    label: "Progresso (%)",
                    data: classData.map((s: any) => s.progress || 0),
                    backgroundColor: "#0078D4",
                  },
                  {
                    label: "Pontos",
                    data: classData.map((s: any) => s.points || 0),
                    backgroundColor: "#107C10",
                  },
                ],
              }}
              options={{ responsive: true }}
            />
          </Card>
        </>
      )}
  
      {/* 🧠 Progresso nos quizzes */}
      {quizStats.length > 0 && (
        <Card style={{ padding: "1rem", marginBottom: "1rem" }}>
          <Text weight="semibold">🧠 Progresso nos Quizzes</Text>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Capítulo</TableHeaderCell>
                <TableHeaderCell>Alunos que responderam</TableHeaderCell>
                <TableHeaderCell>Pontuação média</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizStats.map((stat, idx) => (
                <TableRow key={idx}>
                  <TableCell>{stat.capitulo}</TableCell>
                  <TableCell>{stat.total}</TableCell>
                  <TableCell>{stat.media}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 🏆 Gamificação da turma */}
      <Card style={{ padding: "1rem", marginBottom: "1rem" }}>
        <Text weight="semibold">🏆 Gamificação da Turma</Text>
        <Text block style={{ marginBottom: 8 }}>Ranking dos alunos por pontos totais:</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>#</TableHeaderCell>
              <TableHeaderCell>Aluno</TableHeaderCell>
              <TableHeaderCell>Pontos</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLeaderboard.map((entry, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{entry.name}</TableCell>
                <TableCell>{entry.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Text block style={{ marginTop: 16, marginBottom: 8 }}>🏅 Medalhas recentes:</Text>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {recentBadges.length === 0 && <Text>Nenhuma medalha recente.</Text>}
          {recentBadges.map((b, i) => (
           <Badge key={i} appearance="filled" color="brand">
           {b.badge.name} — {b.name}
           {b.badge.date && (
             <span style={{ fontSize: 12, marginLeft: 8, color: "#666" }}>
               ({new Date(b.badge.date).toLocaleDateString()})
             </span>
           )}
         </Badge>
          ))}
        </div>
      </Card>

      {/* ...restante do dashboard... */}
    </div>
  );
}