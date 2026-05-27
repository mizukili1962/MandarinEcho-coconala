import { writeBatch, collection, getDocs, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { Phrase, Chengyu } from './types';

export const saveToCloud = async (
  user: any,
  newPhrases: Phrase[]
): Promise<void> => {
  if (!user) return;

  try {
    const batch = writeBatch(db);

    const existingSnap = await getDocs(
      collection(db, 'users', user.uid, 'phrases')
    );

    existingSnap.docs.forEach(doc => batch.delete(doc.ref));

    newPhrases.forEach((phrase: Phrase) => {
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

export  const saveChengyuToCloud = async (newChengyuList: Chengyu[]): Promise<void> => {
    try {
      const batch = writeBatch(db);
      
      // 既存の成語をすべて削除
      const existingSnap = await getDocs(collection(db, 'masterData', 'chengyu', 'list'));
      existingSnap.docs.forEach(doc => batch.delete(doc.ref));
      
      // 新しい成語を登録
      newChengyuList.forEach((chengyu, idx) => {
        batch.set(doc(db, 'masterData', 'chengyu', 'list', idx.toString()), {
          chinese: chengyu.zh,
          pinyin: chengyu.py,
          japanese: chengyu.ja,
          createdAt: new Date()
        });
      });
      
      await batch.commit();
      console.log(`[Firestore] ${newChengyuList.length} 件の成語を保存しました`);
    } catch (error) {
      console.error('[Firestore] 成語保存エラー:', error);
    }
  };
