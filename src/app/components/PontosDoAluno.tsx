// PontosDoAluno.tsx
import React, { useEffect, useState } from "react";
import { Text, Card, Spinner } from "@fluentui/react-components";
import { getPoints } from "../services/api";

export function PontosDoAluno({ email }: { email: string }) {
  const [pontos, setPontos] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPoints(email)
      .then((res) => {
        setPontos(res.total);
      })
      .finally(() => setLoading(false));
  }, [email]);

  return (
    <Card style={{ padding: 16, marginBottom: 16 }}>
      <Text size={600} weight="semibold">🏅 Pontuação Atual</Text><br />
      {loading ? <Spinner /> : <Text size={500}>{pontos} pontos</Text>}
    </Card>
  );
}
