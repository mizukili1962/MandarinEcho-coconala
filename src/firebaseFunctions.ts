import { writeBatch, collection, getDocs, doc } from 'firebase/firestore';
import { db } from './firebase';

export const saveToCloud = async (
  user: any,
  newPhrases: any
): Promise<void> => {
  if (!user) return;

  try {
    const batch = writeBatch(db);

    const existingSnap = await getDocs(
      collection(db, 'users', user.uid, 'phrases')
    );

    existingSnap.docs.forEach(doc => batch.delete(doc.ref));

    newPhrases.forEach((phrase: any) => {
      batch.set(doc(db, 'users', user.uid, 'phrases', phrase.id), {
        chinese: phrase.zh,
        pinyin: phrase.py,
        japanese: phrase.ja,
        isLearned: false,
        attempts: 0,
        lastAttemptAt: null,
        createdAt: new Date()
      });
    });

    await batch.commit();

    console.log(`[Firestore] ${newPhrases.length} 件のフレーズを保存しました`);
  } catch (error) {
    console.error('[Firestore] 保存エラー:', error);
  }
};
