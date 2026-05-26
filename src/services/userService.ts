import { collection, getDocs } from 'firebase/firestore';
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
