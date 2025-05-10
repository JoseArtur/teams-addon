import React from "react";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Text,
} from "@fluentui/react-components";

interface PointsInfoFlyoutProps {
  open: boolean;
  onClose: () => void;
}

export function PointsInfoFlyout({ open, onClose }: PointsInfoFlyoutProps) {
  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>🎯 Como Ganhar Pontos</DialogTitle>
          <DialogContent>
            <Text weight="semibold" size={500} style={{ marginBottom: 16 }}>
              Existem muitas formas divertidas de ganhar pontos na plataforma:
            </Text>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <Text weight="semibold">📚 Terminar um Livro: </Text>
                <Text>Ganha 50 pontos quando terminares de ler um livro! É como uma medalha de ouro! 🏅</Text>
              </div>
              <div>
                <Text weight="semibold">📝 Responder a Quizzes: </Text>
                <Text>Ganha 25 pontos por cada quiz que responderes ao final do livro! Mostra o que aprendeste! 🌟</Text>
              </div>
              <div>
                <Text weight="semibold">🔥 Manter o Ritmo: </Text>
                <Text>
                  Lê todos os dias e vê as tuas pontos a crescer:
                  <ul style={{ marginTop: 8, marginLeft: 16 }}>
                    <li>1º dia: 1 ponto ⭐</li>
                    <li>2º dia: 2 pontos ⭐⭐</li>
                    <li>3º dia: 3 pontos ⭐⭐⭐</li>
                    <li>E continua a crescer... 🌟</li>
                  </ul>
                  <Text size={200} style={{ marginTop: 8, color: "#666" }}>
                    Se esqueceres de ler um dia, voltas a começar com 1 ponto. Não desistas! 💪
                  </Text>
                </Text>
              </div>
              <div>
                <Text weight="semibold">📖 Começar um Livro: </Text>
                <Text>Ganha 10 pontos quando começares a ler um livro novo! É o teu primeiro passo! 🚀</Text>
              </div>
              <div>
                <Text weight="semibold">🏆 Desafios Especiais: </Text>
                <Text>Completa desafios divertidos e ganha pontos especiais! Cada desafio é uma nova aventura! 🎮</Text>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={onClose}>
              Já Entendi!
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
} 