import React, { useEffect, useState } from "react";
import { Card, Text, Button } from "@fluentui/react-components";
import { getDesafios, completeDesafio } from "../services/api";

export function DesafiosAtivos({ email,grade, turma }: { email: string,grade:string, turma: string }) {
  const [desafios, setDesafios] = useState<any[]>([]);

  useEffect(() => {
    getDesafios(grade,turma).then(setDesafios);
  }, [turma]);

  const handleConcluir = async (desafioId: string) => {
    await completeDesafio(email, desafioId);
    alert("Desafio concluído! Pontos adicionados.");
    setDesafios(prev => prev.filter(d => d.id !== desafioId));
  };

  return (
    <Card style={{ padding: 16, marginTop: 24 }}>
      <Text size={600} weight="semibold">📢 Desafios da Turma</Text>
      {desafios.length === 0 ? (
        <Text>Nenhum desafio ativo.</Text>
      ) : (
        desafios.map((d) => (
          <div key={d.id} style={{ marginTop: 12 }}>
            <Text>{d.titulo}</Text><br />
            <Text size={200}>{d.descricao}</Text><br />
            <Text size={200}>🏁 Até: {d.validade}</Text>
            <br />
            <Button appearance="primary" onClick={() => handleConcluir(d.id)} style={{ marginTop: 8 }}>
              Concluir desafio
            </Button>
          </div>
        ))
      )}
    </Card>
  );
}
