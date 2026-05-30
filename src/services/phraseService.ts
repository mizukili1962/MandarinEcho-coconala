import type { Phrase } from '../types';

export const parsePhraseImportText = (text: string): Phrase[] => {
  const lines = text.split('\n').filter((l) => l.trim());

  return lines
    .map((line) => {
      const pts = line
        .split(/[,\t\s\u3000]+/)
        .map((s) => s.trim())
        .filter((s) => s);

      if (pts.length < 2) return null;

      const zh = pts[0];
      const ja = pts[pts.length - 1];
      const py = pts.length > 2 ? pts.slice(1, -1).join(' ') : '';

      return {
        id: Math.random().toString(36).substr(2, 9),
        zh,
        py,
        ja,
      };
    })
    .filter((item): item is Phrase => item !== null);
};
