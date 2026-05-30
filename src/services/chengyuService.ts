import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export const fetchChengyuList = async () => {
  const snap = await getDocs(
    collection(db, 'masterData', 'chengyu', 'list')
  );

  return snap.docs.map(doc => ({
    zh: doc.data().chinese,
    py: doc.data().pinyin,
    ja: doc.data().japanese,
  }));
};

export const parseChengyuImportText = (text: string) => {
  const lines = text.split('\n').filter((l: string) => l.trim());

  return lines
    .map((line: string) => {
      const pts = line
        .split(/[,\t\s\u3000]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s);

      if (pts.length < 2) return null;

      const zh = pts[0];
      const ja = pts[pts.length - 1];
      const py = pts.length > 2 ? pts.slice(1, -1).join(' ') : '';

      return { zh, py, ja };
    })
    .filter(
      (
        item
      ): item is {
        zh: string;
        py: string;
        ja: string;
      } => item !== null
    );
};
