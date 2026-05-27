import { collection, getDocs,
  doc,
  setDoc,
  query,
  writeBatch} from 'firebase/firestore';
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

export const initializeUserData = async (uid: string, email: string, displayName: string): Promise<void> => {
    try {
      const userDocRef = doc(db, 'users', uid);
      
      // ユーザードキュメント作成（merge: true で既存データを保護）
      await setDoc(userDocRef, {
        email: email,
        displayName: displayName,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });
      
      // サブコレクション存在チェック：phrasesが存在するかで初期化済み判定
      const phrasesSnap = await getDocs(collection(db, 'users', uid, 'phrases'));
      
      if (phrasesSnap.empty) {
        // 初期化が必要
        console.log(`[Firestore] ユーザー ${uid} のマスターデータコピーを開始します`);
        const batch = writeBatch(db);
        
        // マスターデータから成語をコピー
        const chengyuSnap = await getDocs(collection(db, 'masterData', 'chengyu', 'list'));
        if (!chengyuSnap.empty) {
          chengyuSnap.docs.forEach((masterDoc) => {
            batch.set(doc(db, 'users', uid, 'chengyu', masterDoc.id), {
              chinese: masterDoc.data().chinese,
              pinyin: masterDoc.data().pinyin,
              japanese: masterDoc.data().japanese,
              isLearned: false,
              attempts: 0,
              lastAttemptAt: null,
              createdAt: new Date()
            });
          });
          console.log(`[Firestore] マスター成語 ${chengyuSnap.docs.length} 件をコピーしました`);
        }
        
        // マスターデータからフレーズをコピー
        const phrasesSnapMaster = await getDocs(collection(db, 'masterData', 'phrases', 'list'));
        let phraseCount = 0;
        if (!phrasesSnapMaster.empty) {
          phrasesSnapMaster.docs.forEach((masterDoc) => {
            batch.set(doc(db, 'users', uid, 'phrases', masterDoc.id), {
              chinese: masterDoc.data().chinese,
              pinyin: masterDoc.data().pinyin,
              japanese: masterDoc.data().japanese,
              isLearned: false,
              attempts: 0,
              lastAttemptAt: null,
              createdAt: new Date()
            });
            phraseCount++;
          });
          console.log(`[Firestore] マスターフレーズ ${phrasesSnapMaster.docs.length} 件をコピーしました`);
        }
        
        await batch.commit();
        console.log(`[Firestore] ユーザー ${uid} を初期化しました`);
      } else {
        console.log(`[Firestore] ユーザー ${uid} は既に初期化済みです`);
      }
    } catch (error) {
      console.error('[Firestore] ユーザー初期化エラー:', error);
    }
  };
