'use client';

import { 
  FileText, 
  Search, 
  Lightbulb, 
  Type, 
  TrendingUp, 
  UserCircle, 
  Tags, 
  BarChart2, 
  Quote, 
  BookOpen 
} from 'lucide-react';
import { AIFeatureCard } from './AIFeatureCard';

interface AIJournalAnalysisProps {
  paperId: string;
  abstract: string;
  title: string;
}

export const AIJournalAnalysis = ({ paperId, abstract, title }: AIJournalAnalysisProps) => {
  const features = [
    {
      title: "AI Summarizer",
      description: "Ringkasan jurnal menjadi bahasa yang mudah dipahami.",
      icon: FileText,
      endpoint: "/api/summary",
    },
    {
      title: "Research Gap Analyzer",
      description: "Temukan celah penelitian dan peluang baru dari jurnal ini.",
      icon: Search,
      endpoint: "/api/research-gap",
    },
    {
      title: "Keyword Optimizer",
      description: "Optimalkan keyword untuk pencarian jurnal internasional.",
      icon: TrendingUp,
      endpoint: "/api/keywords",
    },
    {
      title: "Smart Title Generator",
      description: "Buat 5 judul penelitian modern berdasarkan topik ini.",
      icon: Type,
      endpoint: "/api/title-generator",
    },
    {
      title: "Future Research Ideas",
      description: "Ide pengembangan dan aplikasi praktis dari penelitian ini.",
      icon: Lightbulb,
      endpoint: "/api/future-research",
    },
    {
      title: "Simple Explainer",
      description: "Penjelasan isi jurnal dengan gaya ELI5 (Anak 5 tahun).",
      icon: UserCircle,
      endpoint: "/api/explainer",
    },
    {
      title: "Auto Tag Generator",
      description: "Generate hashtag dan tag otomatis yang relevan.",
      icon: Tags,
      endpoint: "/api/tags",
    },
    {
      title: "AI Citation Helper",
      description: "Generate sitasi APA, MLA, dan IEEE secara otomatis.",
      icon: Quote,
      endpoint: "/api/citation",
    },
    {
      title: "AI Study Recommendation",
      description: "Rekomendasi topik dan jurnal terkait untuk dipelajari.",
      icon: BookOpen,
      endpoint: "/api/recommendations",
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <AIFeatureCard
          key={index}
          {...feature}
          paperId={paperId}
          abstract={abstract}
          paperTitle={title}
        />
      ))}
      
      {/* Comparison is separate since it might need more UI for picking multiple papers */}
      <AIFeatureCard
        title="AI Comparison Insight"
        description="Bandingkan jurnal ini dengan penelitian serupa lainnya."
        icon={BarChart2}
        endpoint="/api/comparison"
        paperId={paperId}
        abstract={abstract}
        paperTitle={title}
      />
    </div>
  );
};
