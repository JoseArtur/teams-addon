import { Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Button, Text, Spinner } from "@fluentui/react-components";
import { getPointsExplanation, PointsExplanation } from "../services/api";
import { useEffect, useState } from "react";

interface PointsHistoryFlyoutProps {
    open: boolean;
    onClose: () => void;
    email: string;
}

interface PointEntry {
    type: string;
    points: number;
    description: string;
    date: string;
    bookTitle?: string;
}

export function PointsHistoryFlyout({ open, onClose, email }: PointsHistoryFlyoutProps) {
    const [loading, setLoading] = useState(true);
    const [pointsData, setPointsData] = useState<PointsExplanation | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && email) {
            setLoading(true);
            setError(null);
            getPointsExplanation(email)
                .then(data => {
                    setPointsData(data);
                })
                .catch(err => {
                    setError("Não foi possível carregar as informações dos pontos. Tente novamente mais tarde.");
                    console.error("Error fetching points explanation:", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [open, email]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>Seus Pontos</DialogTitle>
                    <DialogContent style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                <Spinner label="Carregando..." />
                            </div>
                        ) : error ? (
                            <Text>{error}</Text>
                        ) : pointsData && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 4px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <Text size={500} weight="semibold">
                                        Total de Pontos: {pointsData.totalPoints}
                                    </Text>
                                </div>

                                <div>
                                    <Text weight="semibold">Como você ganhou pontos:</Text>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0' }}>
                                        <li>✨ {pointsData.pointsByType.completion} pontos por completar livros</li>
                                        <li>📝 {pointsData.pointsByType.quiz} pontos por responder quizzes</li>
                                        <li>🎯 {pointsData.pointsByType.firstProgress} pontos por primeiro registro</li>
                                        <li>🔥 {pointsData.pointsByType.streak} pontos por manter sequência</li>
                                        <li>🏆 {pointsData.pointsByType.challenges} pontos por conquistas</li>
                                    </ul>
                                </div>

                                {pointsData.lastPoints.length > 0 && (
                                    <div>
                                        <Text weight="semibold">Últimos pontos ganhos:</Text>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0' }}>
                                            {pointsData.lastPoints.map((point, index) => (
                                                <li key={index} style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                                    <Text>
                                                        <Text weight="semibold">{point.points} pontos</Text>
                                                        <br />
                                                        <Text size={300}>
                                                            {point.description}
                                                            {point.bookTitle && (
                                                                <Text size={300} style={{ color: '#666' }}>
                                                                    {' '}• {point.bookTitle}
                                                                </Text>
                                                            )}
                                                        </Text>
                                                        <br />
                                                        <Text size={200} style={{ color: '#666' }}>
                                                            {formatDate(point.date)}
                                                        </Text>
                                                    </Text>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="primary" onClick={onClose}>
                            Entendi!
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
} 