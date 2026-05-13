import axios from 'axios';
import { Journal } from '@/types/journal';
import { SearchResponse, SortBy, SearchFilters } from '@/types/search';

const BASE_URL = '/api';

/**
 * Journal Service
 * Rule: Anti-Crash, Multi-Source Integration
 */
export const journalService = {
  async search(query: string, limit: number = 10, offset: number = 0, provider: string = 'default', filters?: SearchFilters): Promise<SearchResponse> {
    try {
      // Use 'q' param for consistency with backend rules
      const response = await axios.get(`${BASE_URL}/search`, {
        params: {
          q: query,
          limit,
          offset,
          provider,
          ...filters
        }
      });
      
      // If backend follows { success, data, ... } format
      if (response.data.success) {
        return {
          total: response.data.total || 0,
          offset: offset,
          data: response.data.data || [],
          success: true,
          intelligence: response.data.intelligence,
          pagination: response.data.pagination // Pass through pagination metadata
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('[JOURNAL SERVICE] Search Error:', error.response?.data || error.message);
      return { 
        total: 0, 
        offset: 0, 
        data: [], 
        error: true, 
        message: "Gagal menghubungkan ke mesin pencari JurnalStar." 
      };
    }
  },

  async getDetail(paperId: string, source: string = 'semantic'): Promise<any> {
    try {
      const normalizedSource = source?.toLowerCase().trim() || 'semantic';
      const url = `${BASE_URL}/paper/${encodeURIComponent(paperId)}?source=${normalizedSource}`;
      
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();
      
      if (!response.ok || data.error) {
        return {
          error: true,
          message: data.message || "Gagal memuat detail jurnal.",
          source: normalizedSource,
          id: paperId
        };
      }
      
      return data;
    } catch (error: any) {
      console.error('[JOURNAL SERVICE] Detail Error:', error.message);
      return { 
        error: true, 
        message: "Gangguan koneksi saat mengambil detail jurnal.",
        source: source,
        id: paperId
      };
    }
  },

  async getRecommendations(paperId: string): Promise<Journal[]> {
    try {
      const response = await axios.get(`${BASE_URL}/recommendations/${paperId}`);
      return response.data.data || response.data.recommendedPapers || [];
    } catch (error: any) {
      console.error('[JOURNAL SERVICE] Recommendations Error:', error.message);
      return [];
    }
  }
};

