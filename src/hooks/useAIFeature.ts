import { useState, useCallback } from 'react';

interface UseAIFeatureProps {
  endpoint: string;
  paperId: string;
  abstract: string;
  title: string;
}

export const useAIFeature = ({ endpoint, paperId, abstract, title }: UseAIFeatureProps) => {
  const [data, setData] = useState<string | null>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    setData(null);
    setIntelligence(null);

    const model = typeof window !== 'undefined' ? localStorage.getItem('selected_ai_model') : null;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, abstract, title, model }),
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        if (result.intelligence) setIntelligence(result.intelligence);
      } else {
        setError(result.message || "Gagal memproses data AI");
      }
    } catch (err: any) {
      setError("AI sedang sibuk atau koneksi terputus");
    } finally {
      setLoading(false);
    }
  }, [endpoint, paperId, abstract, title, loading]);

  return { data, intelligence, loading, error, generate };
};
