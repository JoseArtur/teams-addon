import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableBody,
  TableCellLayout,
  tokens,
  makeStyles,
  Field,
  shorthands,
  Button,
  ProgressBar,
  Badge,
  Card,
  Text,
} from "@fluentui/react-components";
import { SearchBox } from "@fluentui/react-search-preview";
import { getClassStudents, getStudentBookProgress } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Person24Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    backgroundColor: tokens.colorSubtleBackgroundHover,
  },
  cell: {
    display: "flex",
    justifyContent: "center",
  },
  fieldWrapper: {
    ...shorthands.padding(
      tokens.spacingVerticalMNudge,
      tokens.spacingHorizontalMNudge
    ),
  },
  badgeList: {
    display: "flex",
    flexWrap: "wrap",
  },
});

export function StudentsTab({ grade, turma, bookId }: { grade: string; turma: string; bookId: string }) {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const alunos = await getClassStudents(grade, turma);
      // Para cada aluno, busca progresso no livro selecionado
      const alunosComProgresso = await Promise.all(
        alunos.map(async (aluno: any) => {
          const progresso = await getStudentBookProgress(aluno.email, bookId);
          return {
            ...aluno,
            ...progresso,
          };
        })
      );
      setStudents(alunosComProgresso);
      setLoading(false);
    }
    if (grade && turma && bookId) load();
  }, [grade, turma, bookId]);

  const filteredStudents = students.filter((aluno) =>
    aluno.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div
        style={{
          backgroundColor: "#f4f4f4",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          padding: "0px",
          marginBottom: "2px",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Text size={600} weight="bold" style={{ marginLeft: 12 }}>
            👩‍🎓 Alunos da Turma
          </Text>
          <div className={styles.fieldWrapper} style={{ marginLeft: "auto" }}>
            <Field>
              <SearchBox
                size="small"
                placeholder="Buscar aluno"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </div>
      <Table aria-label="Alunos" className={styles.root}>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Nome</TableHeaderCell>
            <TableHeaderCell>Progresso</TableHeaderCell>
            <TableHeaderCell>Pontos</TableHeaderCell>
            <TableHeaderCell>Última leitura</TableHeaderCell>
            <TableHeaderCell>Badges</TableHeaderCell>
            <TableHeaderCell>Atrasos</TableHeaderCell>
            <TableHeaderCell></TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7}>Carregando...</TableCell>
            </TableRow>
          ) : filteredStudents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7}>Nenhum aluno encontrado.</TableCell>
            </TableRow>
          ) : (
            filteredStudents.map((aluno, idx) => (
              <TableRow key={aluno.email || idx}>
                <TableCell>
                  <TableCellLayout media={<Person24Regular />}>
                    {aluno.name}
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <ProgressBar
                    value={aluno.percentage || 0}
                    max={100}
                    style={{ width: 100 }}
                  />
                  <span style={{ marginLeft: 8 }}>
                    {aluno.currentPage || 0}/{aluno.totalPages || 1}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge appearance="filled" color="brand">
                    {aluno.points || 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  {aluno.lastReadDate
                    ? new Date(aluno.lastReadDate).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className={styles.badgeList}>
                    {(aluno.badges || []).length === 0 && <span>-</span>}
                    {(aluno.badges || []).map((badge: any, i: number) => (
                      <Badge key={i} appearance="outline" color="important">
                        {badge.name || badge}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {(aluno.delays || []).length > 0 ? (
                    <Badge appearance="outline" color="danger">
                      {aluno.delays.length} atraso(s)
                    </Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    appearance="primary"
                    size="small"
                    onClick={() =>
                      navigate(`/aluno`, {
                        state: {
                          aluno,
                          grade,
                          turma,
                          bookId,
                        },
                      })
                    }
                  >
                    Ver detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}