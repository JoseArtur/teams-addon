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
  onQuizSubmitted
}: {
  open: boolean;
  onClose: () => void;
  chapter: { titulo: string };
  questions?: { question: string; options: string[]; answer: string }[];
  email: string;
  bookId: string;
  chapterIndex: number;
  onQuizSubmitted?: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [bonus, setBonus] = useState<number | null>(null);
  const [isLate, setIsLate] = useState(false);
  const [badgeEarned, setBadgeEarned] = useState(false);
  const [completedChallenge, setCompletedChallenge] = useState<any>(null);

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
      
      // Check for completed challenges
      if (response.desafiosCompletados && response.desafiosCompletados.length > 0) {
        setCompletedChallenge(response.desafiosCompletados[0]);
        return;
      }

      // Call onQuizSubmitted to trigger updates in parent components
    
    } catch (err) {
      alert("Erro ao enviar o quiz.");
      console.error(err);
    }
  };

  const onCloseHandler = () => {
    onClose();
    // Reset states but keep completedChallenge
    setCurrentIndex(0);
    setAnswers(Array(questions.length).fill(null));
    setSubmitted(false);
    setEarnedPoints(null);
    setBonus(null);
    setBadgeEarned(false);

    if (onQuizSubmitted) {
      onQuizSubmitted();
    }
  };

  const handleBadgeClose = () => {
    const hadCompletedChallenge = !!completedChallenge;
    setCompletedChallenge(null);
    onCloseHandler();
    // Only call onQuizSubmitted if there was a completed challenge
    if (hadCompletedChallenge && onQuizSubmitted) {
      onQuizSubmitted();
    }
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
    <>
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
                      Você ganhou <strong>{earnedPoints}</strong> pontos! 🏆
                    </Text>
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

      {completedChallenge && (
        <Dialog open={true} onOpenChange={(_, data) => !data.open && handleBadgeClose()}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle className="text-center">
                <div className="text-4xl mb-2">🎯 🎲 🎮</div>
                <div className="text-2xl font-bold text-primary">Você é um Mestre do Quiz!</div>
              </DialogTitle>
              <DialogContent className="text-center space-y-4">
                <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg shadow-inner">
                  <Text className="text-xl font-semibold text-emerald-800">
                    {completedChallenge.titulo}
                  </Text>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-3xl">💰</div>
                  <Text className="text-lg font-medium">
                    Pontos conquistados: {completedChallenge.reward.pontos}
                  </Text>
                </div>
                <div className="flex justify-center space-x-1">
                  {Array.from({ length: completedChallenge.reward.pontos / 5 }).map((_, i) => (
                    <span key={i} className="text-2xl">✨</span>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-lg">
                  <Text className="text-sm italic">
                    "Seu conhecimento brilha como estrelas no céu!"
                  </Text>
                </div>
              </DialogContent>
              <DialogActions className="justify-center">
                <Button 
                  appearance="primary" 
                  onClick={handleBadgeClose}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transform hover:scale-105 transition-transform"
                >
                  Próximo Desafio!
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </>
  );
}
