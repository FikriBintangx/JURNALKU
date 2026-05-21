import { useState } from 'react';

interface UseAIFeatureProps {
  endpoint: string;
  paperId: string;
  abstract: string;
  title: string;
}

export const useAIFeature = ({ endpoint, paperId, abstract, title }: UseAIFeatureProps) => {
  const [data, setData] = useState<any>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, abstract, title }),
      });
      
      const result = await response.json();
      
      if (!response.ok || result.error) {
        throw new Error(result.error || result.message || 'Gagal menghubungi Intelligence Engine');
      }

      // Handle various response shapes
      const responseData = result.data || result.text || result.summary || result.content || result;
      
      // If it's still an object, we stringify it to avoid React rendering errors
      if (typeof responseData === 'object' && responseData !== null && !result.data) {
         setData(JSON.stringify(responseData, null, 2));
      } else {
         setData(responseData);
      }
      
      setIntelligence(result.intelligence || null);
    } catch (err: any) {
      console.error('[useAIFeature] Error:', err);
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return { data, intelligence, loading, error, generate };
};
