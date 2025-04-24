import React, { useState } from "react";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Text,
  ProgressBar
} from "@fluentui/react-components";
import { submitQuizAnswers } from "../services/api";

export function QuizFlyout({
  open,
  onClose,
  chapter,
  questions = [],
  email,
  bookId,
  chapterIndex,
  onQuizFinished
}: {
  open: boolean;
  onClose: () => void;
  chapter: { titulo: string };
  questions?: { question: string; options: string[]; answer: string }[];
  email: string;
  bookId: string;
  chapterIndex: number;
  onQuizFinished?: (chapterIndex: number) => void; // <-- Tipagem
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [bonus, setBonus] = useState<number | null>(null);
  const [isLate, setIsLate] = useState(false);
  const [badgeEarned, setBadgeEarned] = useState(false);

  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const progress = Math.round(((currentIndex + (answers[currentIndex] ? 1 : 0)) / total) * 100);

  const handleSelect = (option: string) => {
    const updated = [...answers];
    updated[currentIndex] = option;
    setAnswers(updated);

    if (currentIndex < total - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 500);
    } else {
      handleSubmit(updated.filter((answer): answer is string => answer !== null));
    }
  };

  const handleSubmit = async (finalAnswers: string[]) => {
    try {
      const response = await submitQuizAnswers({
        email,
        bookId,
        capitulo: chapterIndex + 1,
        respostas: finalAnswers
      });
      setEarnedPoints(response.score);
      setBonus(response.bonus || 0);
      setIsLate(response.isLate || false);
      setBadgeEarned(response.badgeEarned || false);
      setSubmitted(true);
      
    } catch (err) {
      alert("Erro ao enviar o quiz.");
      console.error(err);
    }
  };

  const onCloseHandler = () => {
    if (onQuizFinished) onQuizFinished(chapterIndex); // <-- Atualize o estado no pai
    onClose();
  };
  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers(Array(questions.length).fill(null));
    setSubmitted(false);
    setEarnedPoints(null);
    setBonus(null);
    setBadgeEarned(false);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {submitted ? "🎉 Quiz enviado!" : `🧠 Quiz: ${chapter.titulo}`}
          </DialogTitle>
          <DialogContent>
            {submitted ? (
              <>
                <Text block>Obrigado por responder ao quiz! 🎉</Text>
                {earnedPoints !== null && (
                  <Text block>
                    Você ganhou <strong>{earnedPoints}</strong> pontos! 🏆                  </Text>
                )}
                {bonus && bonus > 0 && (
                  <Text block>⭐ Bônus: +{bonus} pontos por responder nos dias iniciais!</Text>
                )}
                {isLate && (
                  <Text block>⚠️ Respondeu após o prazo. Sua pontuação foi reduzida.</Text>
                )}
                {badgeEarned && (
                  <Text block>🏅 Parabéns! Você foi o primeiro a responder este quiz e ganhou uma medalha!</Text>
                )}
              </>
            ) : (
              <>
                <Text block>
                  Pergunta {currentIndex + 1} de {total}
                </Text>
                <ProgressBar value={progress} max={100} />
                <div style={{ marginTop: 16 }}>
                  <Text weight="semibold">{currentQuestion.question}</Text>
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    {currentQuestion.options.map((opt, i) => (
                      <Button
                        key={i}
                        appearance="secondary"
                        onClick={() => handleSelect(opt)}
                        disabled={!!answers[currentIndex]}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={submitted ? onCloseHandler : onCloseHandler}>
              {submitted ? "Fechar" : "Cancelar"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
