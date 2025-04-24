// StudentRanking.tsx
import React, { useEffect, useState } from "react";
import {
  Card,
  Text,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Spinner,
} from "@fluentui/react-components";
import { getStudentRanking } from "../services/api";

export function StudentRanking({ email }: { email: string }) {
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Fetching ranking for user:", email);
    getStudentRanking(email).then((data) => {
      console.log("Dados do ranking:", data);
      // data.classmates é o array de ranking
      if (Array.isArray(data.classmates)) {
        setRanking(data.classmates);
      } else {
        setRanking([]);
      }
      setLoading(false);
    });
  }, [email]);
  if (loading) return <Spinner label="Carregando ranking..." />;

  return (
    <div style={{ padding: 20 }}>
      <Text size={700} weight="bold">🏆 Ranking da Turma</Text>
      <Text size={400} style={{ marginBottom: 16 }}>
        Veja sua posição em comparação com seus colegas com base nos pontos de leitura acumulados.
      </Text>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Posição</TableHeaderCell>
              <TableHeaderCell>Nome</TableHeaderCell>
              <TableHeaderCell>Pontos</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
  {ranking.map((entry, index) => (
    <TableRow key={entry.studentId}>
      <TableCell>{index + 1}</TableCell>
      <TableCell>
        {entry.name} {entry.studentId === email && <strong>👈 você</strong>}
      </TableCell>
      <TableCell>{entry.points}</TableCell>
    </TableRow>
  ))}
</TableBody>
        </Table>
      </Card>
    </div>
  );
}
