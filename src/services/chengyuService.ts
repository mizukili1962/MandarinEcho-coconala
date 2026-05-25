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
