import { Journal } from '@/types/journal';

export function generateCitation(journal: Journal, format: 'APA' | 'MLA' | 'IEEE'): string {
  const authors = journal.authors?.map(a => a.name) || ['Unknown Author'];
  const year = journal.year || 'n.d.';
  const title = journal.title;
  const venue = journal.venue || 'N/A';

  switch (format) {
    case 'APA':
      const apaAuthors = authors.length > 1 
        ? `${authors[0]}, et al.` 
        : authors[0];
      return `${apaAuthors} (${year}). ${title}. ${venue}.`;

    case 'MLA':
      const mlaAuthors = authors.length > 1 
        ? `${authors[0]}, et al.` 
        : authors[0];
      return `${mlaAuthors}. "${title}." ${venue}, ${year}.`;

    case 'IEEE':
      const ieeeAuthors = authors.length > 1 
        ? `${authors[0]} et al.,` 
        : `${authors[0]},`;
      return `${ieeeAuthors} "${title}," ${venue}, ${year}.`;

    default:
      return '';
  }
}
