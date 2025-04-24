// ChallengesTab.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  Divider,
  Spinner,
  Text,
  Badge,
} from "@fluentui/react-components";
import { getDesafios, getPoints,getCompletedDesafios } from "../services/api";
export function ChallengesTab({ userRole, email, grade, turma }: {
  userRole: "student" | "teacher";
  email: string;
  grade: string;
  turma: string;
}) {
  const [desafios, setDesafios] = useState<any[]>([]);
  const [pontos, setPontos] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [concluidos, setConcluidos] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (userRole === "student") {
        const [dsf, pts, concluidosResp] = await Promise.all([
          getDesafios(grade, turma),
          getPoints(email),
          getCompletedDesafios(email)
        ]);
        setDesafios(dsf);
        setPontos(pts.total);
        setConcluidos(concluidosResp.map((c: any) => c.desafioId));
      }
      setLoading(false);
    }
    fetchData();
  }, [email, turma, userRole]);

  const isExpired = (validade: string) => {
    const hoje = new Date();
    const limite = new Date(validade);
    return hoje > limite;
  };

  return (
    <div style={{ padding: "1.6rem" }}>
      <h1>🏆 Desafios de Leitura</h1>
      <Divider />

      {userRole === "student" && (
        loading ? <Spinner /> : (
          <>
            <Card style={{ margin: "1rem 0", padding: 16 }}>
              <Text size={600} weight="semibold">Seus Pontos: {pontos}</Text>
            </Card>

            <h2>📢 Desafios da Turma</h2>
            {desafios.length === 0 ? (
              <Text>Nenhum desafio ativo.</Text>
            ) : (
              desafios.map((d) => {
                const expirado = isExpired(d.validade);
                const jaConcluido = concluidos.includes(d.id);
                return (
                  <Card key={d.id} style={{ marginBottom: "1rem" }}>
                    <CardHeader
                      header={d.titulo}
                      description={`📘 Capítulo ${d.capitulo} | Até: ${d.validade}`}
                    />
                    <div style={{ padding: "0 1rem 1rem" }}>
                      <Text>{d.descricao}</Text><br />
                      {jaConcluido && <Badge color="brand" appearance="filled">✅ Concluído</Badge>}
                      {!jaConcluido && expirado && <Badge color="danger" appearance="outline">⏰ Prazo Encerrado</Badge>}
                      {!jaConcluido && !expirado && <Badge appearance="outline">⏳ Em andamento</Badge>}
                    </div>
                  </Card>
                );
              })
            )}
          </>
        )
      )}

      {userRole === "teacher" && (
        <div>
          {/* Conteúdo do professor será implementado aqui futuramente */}
        </div>
      )}
    </div>
  );
}
