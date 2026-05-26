import { collection, getDocs,
  doc,
  setDoc,
  query } from 'firebase/firestore';
import { db } from '../firebase';

export const initializeMasterData = async (): Promise<void> => {
try {
const chengyuSnap = await getDocs(collection(db, 'masterData', 'chengyu', 'list'));

if (!chengyuSnap.empty) {  
  console.log(`[Firestore] マスターデータ確認済み (成語: ${chengyuSnap.docs.length}件)`);  
} else {  
  console.warn('[Firestore] マスターデータが見つかりません。Firebase Consoleから登録してください。');  
}

} catch (error) {
console.error('[Firestore] マスターデータ確認エラー:', error);
}
};

  const recordLearningProgress = async (phraseId: string, success: boolean): Promise<void> => {
    if (!user) return;
    try {
      const phraseRef = doc(db, 'users', user.uid, 'phrases', phraseId);
      const phraseSnap = await getDocs(query(collection(db, 'users', user.uid, 'phrases')));
      const phrase = phraseSnap.docs.find(doc => doc.id === phraseId);
      
      if (phrase) {
        const currentAttempts = phrase.data().attempts || 0;
        const currentLearned = phrase.data().isLearned || false;
        
        await setDoc(phraseRef, {
          attempts: currentAttempts + 1,
          isLearned: success ? true : currentLearned,
          lastAttemptAt: new Date()
        }, { merge: true });
      }
    } catch (error) {
      console.error('[Firestore] 学習進捗記録エラー:', error);
    }
  };
