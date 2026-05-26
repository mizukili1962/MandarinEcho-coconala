import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider,
  signInWithPopup,
  type User
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, writeBatch, collection, getDocs, query } from 'firebase/firestore';
import { 
  Mic, LogOut, ChevronLeft, 
  Plus, Trash2, Edit2,
  Volume2,
  FileText, X, RotateCcw
} from 'lucide-react';
import './App.css'
import { initializeMasterData } from './services/userService';
import { auth, db } from './firebase';
import { saveToCloud } from './firebaseFunctions';
import { initializeMasterData, recordLearningProgress } from './services/userService';
import { OrnatePlum } from './components_見た目/icons_装飾/OrnatePlum';
import { OrnateOrchid } from './components_見た目/icons_装飾/OrnateOrchid';
import { OrnateBamboo } from './components_見た目/icons_装飾/OrnateBamboo';
import { OrnateChrysanthemum } from './components_見た目/icons_装飾/OrnateChrysanthemum';
import { fetchChengyuList } from './services/chengyuService';


// Firestore から動的に取得するため、ハードコードされたデータは削除


const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [phrases, setPhrases] = useState<Array<{id: string; zh: string; py: string; ja: string}>>([]);
  const [trainingPhrases, setTrainingPhrases] = useState<Array<{id: string; zh: string; py: string; ja: string}>>([]);
  const [shuffleQueue, setShuffleQueue] = useState<number[]>([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [view, setView] = useState('start'); 
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("待機中");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<{id: string; zh: string; py: string; ja: string} | null>(null);
  
  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  
  const [importState, setImportState] = useState({
  text: "",
  message: "",
  success: false,
});
  
  const [modalMessage, setModalMessage] = useState("");
  const [modalSuccess, setModalSuccess] = useState(false);


  const [isManualListening, setIsManualListening] = useState(false);
  const [isChengyuModalOpen, setIsChengyuModalOpen] = useState(false);
  const [isChengyuManageModalOpen, setIsChengyuManageModalOpen] = useState(false);
  const [isChengyuImportModalOpen, setIsChengyuImportModalOpen] = useState(false);
  const [editingChengyu, setEditingChengyu] = useState<{zh: string; py: string; ja: string} | null>(null);
  const [chengyuModalMessage, setChengyuModalMessage] = useState("");
  const [chengyuModalSuccess, setChengyuModalSuccess] = useState(false);
  const [chengyuImportText, setChengyuImportText] = useState("");
  const [chengyuImportMessage, setChengyuImportMessage] = useState("");
  const [chengyuImportSuccess, setChengyuImportSuccess] = useState(false);

  const isAborted = useRef(false);
  const recognitionRef = useRef<any>(null);
  const importFormRef = useRef<HTMLFormElement>(null);
  const chengyuImportFormRef = useRef<HTMLFormElement>(null);


  const [randomChengyu, setRandomChengyu] = useState<{zh: string; py: string; ja: string} | null>(null);
  const [allChengyuList, setAllChengyuList] = useState<Array<{zh: string; py: string; ja: string}>>([]);


  useEffect(() => {
    if (view === 'start' && allChengyuList.length > 0) {
      const idx = Math.floor(Math.random() * allChengyuList.length);
      setRandomChengyu(allChengyuList[idx]);
    }
  }, [view, allChengyuList]);

  // Firestore から成語リストを取得
  useEffect(() => {
    const loadChengyuList = async () => {
      try {


        const list = await fetchChengyuList();
       
        setAllChengyuList(list);
        if (list.length > 0) {
          setRandomChengyu(list[0]);
        }
      } catch (error) {
        console.error('[Firestore] 成語リスト取得エラー:', error);
      }
    };
    loadChengyuList();
  }, []);

  // 成語を保存
  const saveChengyuToCloud = async (newChengyuList: Array<{zh: string; py: string; ja: string}>): Promise<void> => {
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


  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (e) {}
      
      // マスターデータを初期化
      await initializeMasterData();
      
      const unsubscribe = onAuthStateChanged(auth, async (u: User | null) => {
        setUser(u);
        if (u) {
          // ユーザー初期化：新規ユーザーの場合のみデータを登録
          await initializeUserData(u.uid, u.email || '', u.displayName || 'ゲスト');
        }
        setLoading(false);
      });
      return unsubscribe;
    };
    initAuth();
  }, []);

useEffect(() => {
  if (!user) return;

  const phrasesCollectionRef = collection(db, 'users', user.uid, 'phrases');

  const unsubscribe = onSnapshot(
    phrasesCollectionRef,
    (snap) => {
      if (view === 'learn') return;

      const loadedPhrases = snap.docs.map((d) => ({
        id: d.id,
        zh: d.data().chinese || '',
        py: d.data().pinyin || '',
        ja: d.data().japanese || ''
      }));

      setPhrases(loadedPhrases);
    },
    (err) => console.error('[Firestore] リスナーエラー:', err)
  );

  return unsubscribe;
}, [user, view]);

  // ユーザー初期化：新規ユーザーの場合、Firestore に必要なデータを作成
  const initializeUserData = async (uid: string, email: string, displayName: string): Promise<void> => {
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

  // フレーズデータを Firestore から読み込み（onSnapshot で自動同期されるため不要）
  // 削除して、useEffect の onSnapshot で対応

  // 学習進捗を記録

  const speak = (text: string, lang: string = 'zh-CN'): Promise<void> => {
    return new Promise((resolve: (value: void) => void) => {
      if (isAborted.current) return resolve();
      
      // すべての音声合成をキャンセルし、キューをクリア
      window.speechSynthesis.cancel();
      
      // タイムアウト設定（最大3秒）
      const timeoutId = setTimeout(() => {
        console.warn(`[音声合成] タイムアウト: "${text}"`);
        resolve();
      }, 3000);
      
      // キャンセル後、キューが完全にクリアされるまで少し待機
      setTimeout(() => {
        if (isAborted.current) return;
        
        const ut = new SpeechSynthesisUtterance(text);
        ut.lang = lang;
        ut.rate = lang === 'ja-JP' ? 1.4 : 0.85;
        ut.pitch = 1.0;
        ut.volume = 1.0;
        
        ut.onend = () => {
          clearTimeout(timeoutId);
          console.log(`[音声合成] 完了: "${text}"`);
          resolve();
        };
        
        ut.onerror = (e) => {
          clearTimeout(timeoutId);
          console.error(`[音声合成] エラー: ${e.error}`);
          resolve();
        };
        
        window.speechSynthesis.speak(ut);
      }, 50);
    });
  };


  const listenAndAdvance = (targetZh: string): Promise<boolean> => {
    return new Promise((resolve: (value: boolean) => void) => {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) return resolve(false);
      
      const rec = new (SpeechRecognition as any)();
      recognitionRef.current = rec;
      rec.lang = 'zh-CN';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 3;
      
      let timeoutId: any = null;
      const MAX_LISTEN_TIME = 7000; // 7秒のタイムアウト
      const IGNORE_FIRST_RESULTS_MS = 1000; // 最初の1秒の結果を無視（お手本完全終了を確保）
      let recognitionStartTime = 0;
      let hasReceivedValidResult = false; // 有効な結果を受け取ったかどうか
      let hasResolved = false; // 既に結果を返したかどうかのフラグ
      
      const resolveOnce = (result: boolean) => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(timeoutId);
        setIsListening(false);
        resolve(result);
      };
      
      // 認識開始時にタイムアウトを設定
      rec.onstart = (): void => {
        recognitionStartTime = Date.now();
        setIsListening(true);
        timeoutId = setTimeout(() => {
          resolveOnce(false);
          rec.stop();
        }, MAX_LISTEN_TIME);
      };
      
      rec.onresult = (e: any): void => {
        if (hasResolved) return; // 既に結果を返していたら処理しない
        
        let interimTranscript = '';
        let finalTranscript = '';
        
        // 最初の2秒の結果を無視
        const elapsedTime = Date.now() - recognitionStartTime;
        if (elapsedTime < IGNORE_FIRST_RESULTS_MS) {
          console.log(`[音声認識] 無視中: ${elapsedTime}ms - 最初の${IGNORE_FIRST_RESULTS_MS}msは無視します`);
          return;
        }
        
        hasReceivedValidResult = true;
        
        // すべての結果を処理
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript.trim();
          
          if (e.results[i].isFinal) {
            // 最終結果を使用
            finalTranscript += transcript + ' ';
          } else {
            // 中間結果
            interimTranscript += transcript;
          }
        }
        
        // 最終結果をチェック
        if (finalTranscript) {
          const results = finalTranscript.trim().split(/\s+/);
          for (const result of results) {
            console.log(`[音声認識] 認識結果: "${result}" 対象: "${targetZh}"`);
            
            // 空文字を除外して、完全一致、または部分一致をチェック
            if (result && (result === targetZh || result.includes(targetZh) || targetZh.includes(result))) {
              console.log(`[音声認識] 完全一致: "${result}"`);
              resolveOnce(true);
              rec.stop();
              return;
            }
            
            // 類似度チェック（編集距離を使用した簡易実装）
            const similarity = calculateSimilarity(result, targetZh);
            if (similarity > 0.65) {
              console.log(`[音声認識] 類似度一致: "${result}" (${(similarity * 100).toFixed(1)}%)`);
              resolveOnce(true);
              rec.stop();
              return;
            }
          }
        }
      };
      
      rec.onerror = (e: any): void => {
        console.error('[音声認識] エラー:', e.error);
        resolveOnce(false);
      };
      
      rec.onend = (): void => {
        console.log(`[音声認識] 終了 (有効な結果受取: ${hasReceivedValidResult})`);
        resolveOnce(false);
      };
      
      rec.start();
    });
  };

  // 文字列の類似度を計算（Levenshtein距離を使用）
  const calculateSimilarity = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];
    
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return 1 - (distance / maxLen);
  };


  const runSession = async (currentQueue: number[], currentIndex: number, trainingData?: Array<{id: string; zh: string; py: string; ja: string}>, retryCount: number = 0): Promise<void> => {
    // trainingDataが渡されなかった場合は現在のphrasesを使用
    const data = trainingData || phrases;
    const MAX_RETRIES = 3; // 最大再試行回数
    
    if (isAborted.current || currentIndex >= currentQueue.length) {
      if (currentIndex >= currentQueue.length) {
        setStatus("完了");
        await speak("お疲れ様でした", "ja-JP");
        setTimeout(() => { setView('start'); setTrainingPhrases([]); }, 1200);
      }
      return;
    }

    setQueueIdx(currentIndex);
    const phraseIdx = currentQueue[currentIndex];
    const phrase = data[phraseIdx];
    
    if (!phrase) return runSession(currentQueue, currentIndex + 1, trainingData, 0);
    
    // 初回読み上げ前の待機時間を最適化 (安定性のために少し長めに確保)
    if (retryCount === 0 && currentIndex === 0) {
      await new Promise(r => setTimeout(r, 600));
    }

    // 再試行の表示
    if (retryCount > 0) {
      setStatus(`再試行... (${retryCount}/${MAX_RETRIES})`);
      await new Promise(r => setTimeout(r, 400));
    }

    setStatus("お手本...");
    await speak(phrase.zh, 'zh-CN');
    
    if (isAborted.current) return;
    
    // お手本の余韻を完全に避けるため、1.5秒待機
    await new Promise(r => setTimeout(r, 1000));
    
    if (isAborted.current) return;
    
    setStatus("聞き取り中...");
    const success = await listenAndAdvance(phrase.zh);
    
    if (isAborted.current) return;
    
    if (success) {
      setStatus("正解");
      // 学習進捗を記録
      await recordLearningProgress(phrase.id, true);
      await speak(phrase.ja, 'ja-JP');
      setTimeout(() => runSession(currentQueue, currentIndex + 1, trainingData, 0), 300);
    } else {
      // 再試行回数をチェック
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => runSession(currentQueue, currentIndex, trainingData, retryCount + 1), 400);
      } else {
        // 最大再試行回数に達したためスキップ
        setStatus("スキップ");
        // スキップ時も試行回数を記録
        await recordLearningProgress(phrase.id, false);
        setTimeout(() => runSession(currentQueue, currentIndex + 1, trainingData, 0), 1500);
      }
    }
  };


  const handleStartTrainingFlow = async (): Promise<void> => {
    console.log("練習開始ボタン押下 - phrases:", phrases.length);
    
    // phrasesを使用（Firestoreから自動で取得される）
    const trainingData = phrases.length > 0 ? phrases : [];
    
    if (trainingData.length === 0) {
      console.warn("エラー: フレーズが登録されていません");
      return;
    }
    
    try {
      console.log("ステップ1: マイク権限確認開始");
      // 1. マイク権限の確認
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      console.log("ステップ1: マイク権限確認完了");
      
      // 2. 音声合成エンジンのウォームアップ（重要: これで最初の読み上げの途切れを防ぐ）
      console.log("ステップ2: 音声合成ウォームアップ開始");
      window.speechSynthesis.cancel();
      
      // シンプルなウォームアップ（タイムアウト付き）
      await Promise.race([
        speak("準備中", "ja-JP"),
        new Promise(r => setTimeout(r, 1500))
      ]);
      window.speechSynthesis.cancel();
      
      console.log("ステップ2: 音声合成ウォームアップ完了");
      
      const q = Array.from({length: trainingData.length}, (_, i) => i).sort(() => Math.random() - 0.5);
      isAborted.current = false;
      
      console.log("ステップ3: UI更新開始");
      // 学習用フレーズを保存（学習中はこのデータを使用）
      setTrainingPhrases(trainingData);
      setShuffleQueue(q);
      setQueueIdx(0);
      setView('learn');
      
      // 3. UI遷移を待ってからセッション開始
      console.log("ステップ4: セッション開始予定");
      setTimeout(() => {
        console.log("セッション実行開始");
        runSession(q, 0, trainingData);
      }, 800);
      
    } catch (err) {
      console.error("エラー発生:", err);
    }
  };


  if (loading) return (
    <div className="min-h-screen bg-[#3F9877] flex flex-col items-center justify-center text-white p-6">
      <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );


  return (
    <div className={`app-container ${isHandsFree ? 'handsfree' : 'normal'}`}>

      {!user && (
        <div className="login-container">
          <div className="login-content">
            <div className="login-header font-ja">
              <h1>Mandarin Echo</h1>
            </div>
            
            <div className="login-buttons">
              <button
                onClick={async () => {
                  try {
                    const provider = new GoogleAuthProvider();
                    await signInWithPopup(auth, provider);
                  } catch (error) {
                    console.error('ログインエラー:', error);
                  }
                }}
                className="login-btn google-login-btn font-ja"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1"></circle>
                  <path d="M12 1v6m0 6v6"></path>
                  <path d="M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24"></path>
                  <path d="M1 12h6m6 0h6"></path>
                  <path d="M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
                </svg>
                Googleでログイン
              </button>
            </div>
          </div>
        </div>
      )}

      {user && (
        <>
          <header className={`app-header ${isHandsFree ? 'handsfree' : 'normal'}`}>
            <div className="app-header-title">
              <Volume2 size={20} className={isHandsFree ? 'text-[#ffd700]' : 'text-white'} />
              <h1 className={`font-ja ${isHandsFree ? 'text-[#ffd700]' : 'text-white'}`}>Mandarin Echo</h1>
            </div>
            <div className="app-header-user">
              {user && (
                <>
                  <div className="user-info font-ja">
                    <div className="user-name">{user.displayName || user.email || 'ゲスト'}</div>
                  </div>
                  <button onClick={() => signOut(auth)} className="text-white"><LogOut size={20} /></button>
                </>
              )}
            </div>
          </header>


          <main className="app-main">
            {view === 'start' && (
              <div className="start-view">
                {randomChengyu && (
                  <div className={`chengyu-card ${isHandsFree ? 'handsfree' : 'normal'}`}>
                    <div className={`chengyu-display font-zh ${isHandsFree ? 'text-[#ffd700]' : 'text-white'}`}>{randomChengyu.zh}</div>
                    <div className="chengyu-pinyin font-zh">{randomChengyu.py}</div>
                    <div className="chengyu-meaning font-ja">{randomChengyu.ja}</div>
                    <div className="chengyu-button-group font-ja">
                      <button onClick={() => setIsChengyuManageModalOpen(true)} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '2px solid white', cursor: 'pointer', backgroundColor: 'transparent', color: 'white' }}><Edit2 size={18}/></button>
                    </div>
                  </div>
                )}
                <div className="start-button-group">
                  <button onClick={handleStartTrainingFlow} className={`start-training-btn font-ja ${isHandsFree ? 'handsfree' : 'normal'}`}>
                    <OrnatePlum size={32} /> 練習開始
                  </button>
                  <button onClick={() => setIsHandsFree(!isHandsFree)} className="autoplay-btn font-ja">
                    <OrnateOrchid size={20} /> オートプレイ: {isHandsFree ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}


            {view === 'learn' && shuffleQueue.length > 0 && queueIdx < shuffleQueue.length && trainingPhrases.length > 0 && trainingPhrases[shuffleQueue[queueIdx]] && (
              <div className="learn-view">
                <button onClick={() => { isAborted.current = true; setView('start'); setTrainingPhrases([]); window.speechSynthesis.cancel(); if(recognitionRef.current) recognitionRef.current.stop(); }} className="back-btn font-ja"><ChevronLeft size={18}/> 戻る</button>
                <div className={`phrase-card ${isHandsFree ? 'handsfree' : 'normal'}`}>
                   <div className={`phrase-zh font-zh ${isHandsFree ? 'text-[#ffd700]' : 'text-white'}`}>{trainingPhrases[shuffleQueue[queueIdx]].zh}</div>
                   <div className="phrase-py font-zh">{trainingPhrases[shuffleQueue[queueIdx]].py}</div>
                   <div className="phrase-ja font-ja">{trainingPhrases[shuffleQueue[queueIdx]].ja}</div>
                </div>
                <div className="status-box">
                   <div className="status-label font-ja">{status}</div>
                   {isListening ? (
                     <Volume2 size={32} className={`animate-pulse ${isHandsFree ? 'text-[#ffd700]' : 'text-white'}`} />
                   ) : <Mic size={32} className="opacity-20" />}
                </div>
                <div className="button-group">
                  <button onClick={() => { window.speechSynthesis.cancel(); const ut = new SpeechSynthesisUtterance(trainingPhrases[shuffleQueue[queueIdx]].zh); ut.lang = 'zh-CN'; ut.rate = 0.85; window.speechSynthesis.speak(ut); }} className="example-btn font-ja"><Volume2 size={18} /> お手本</button>
                  <button onClick={async () => {
                    // 現在の聞き取りを中断
                    if (recognitionRef.current) {
                      recognitionRef.current.abort();
                    }
                    setIsManualListening(true);
                    setStatus("聞き取り中...");
                    
                    // 手動で聞き取りを再開
                    const recognized = await listenAndAdvance(trainingPhrases[shuffleQueue[queueIdx]].zh);
                    if (recognized) {
                      setStatus("認識されました！");
                      // 学習進捗を記録
                      await recordLearningProgress(trainingPhrases[shuffleQueue[queueIdx]].id, true);
                      await speak(trainingPhrases[shuffleQueue[queueIdx]].ja, 'ja-JP');
                      setStatus("進行中...");
                    } else {
                      // 失敗時も試行回数を記録
                      await recordLearningProgress(trainingPhrases[shuffleQueue[queueIdx]].id, false);
                    }
                    setIsManualListening(false);
                  }} disabled={isManualListening} className={`retry-btn font-ja ${isHandsFree ? 'handsfree' : 'normal'}`}><RotateCcw size={18} /> 再挑戦</button>
                </div>
              </div>
            )}


            {view === 'words' && (
              <div className="words-view font-ja">
                <div className="words-header">
                  <h2 className={`words-title ${isHandsFree ? 'text-[#ffd700]' : 'text-white'}`}>単語帳</h2>
                  <div className="words-actions">
                    <button onClick={() => setIsImportModalOpen(true)} className="icon-btn"><FileText size={20}/></button>
                    <button onClick={() => { setEditingPhrase(null); setIsModalOpen(true); }} className={`icon-btn ${isHandsFree ? 'bg-[#ffd700] text-[#700000]' : 'bg-white text-[#3F9877]'}`}><Plus size={20}/></button>
                  </div>
                </div>
                <div className="words-list">
                  {phrases.map(p => (
                    <div key={p.id} className="word-item">
                      <div className="word-content">
                        <div className="word-zh">
                          <span className="word-zh-text font-zh">{p.zh}</span>
                          <span className="word-py font-zh">{p.py}</span>
                        </div>
                        <div className="word-ja font-ja">{p.ja}</div>
                      </div>
                      <div className="word-actions">
                        <button onClick={() => { setEditingPhrase(p); setIsModalOpen(true); }} className="word-action-btn"><Edit2 size={14}/></button>
                        <button onClick={() => { const up = phrases.filter(i => i.id !== p.id); setPhrases(up); saveToCloud(up); }} className="word-action-btn"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>


          <nav className={`app-nav font-ja ${isHandsFree ? 'handsfree' : 'normal'}`}>
            <button onClick={() => setView('start')} className={`nav-btn ${view !== 'words' ? 'active' : 'inactive'}`}><OrnateBamboo size={18}/> 学習</button>
            <button onClick={() => setView('words')} className={`nav-btn ${view === 'words' ? 'active' : 'inactive'}`}><OrnateChrysanthemum size={18}/> 単語帳</button>
          </nav>
        </>
      )}


      {isModalOpen && (
        <div className="modal-overlay font-ja">
          <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            
            // メッセージを即座に表示
            const isEditing = !!editingPhrase;
            setModalMessage(isEditing ? '✓ 編集しました' : '✓ 追加しました');
            setModalSuccess(true);
            
            const fd = new FormData(e.currentTarget);
            const zh = fd.get('zh') as string;
            const py = fd.get('py') as string;
            const ja = fd.get('ja') as string;
            
            // 重複チェック（編集時は除外）
            if (!editingPhrase) {
              const isDuplicate = phrases.some(p => p.zh === zh);
              if (isDuplicate) {
                alert(`「${zh}」は既に登録されています`);
                setModalMessage("");
                setModalSuccess(false);
                return;
              }
            }
            
            const newItem = { id: editingPhrase?.id || Date.now().toString(), zh, py, ja };
            const up = editingPhrase ? phrases.map(p => p.id === editingPhrase.id ? newItem : p) : [...phrases, newItem];
            
            setPhrases(up);
            await saveToCloud(up);
            
            // 1.5秒後にモーダルを閉じる
            setTimeout(() => {
              setIsModalOpen(false);
              setModalMessage("");
              setModalSuccess(false);
            }, 1500);
          }} className="modal-content relative">
             <button onClick={() => { setIsModalOpen(false); setModalMessage(""); setModalSuccess(false); }} className="modal-close-btn"><X size={20}/></button>
             <h3 className="modal-header">単語を{editingPhrase ? '編集' : '追加'}</h3>
             <div className="modal-form">
               <input name="zh" defaultValue={editingPhrase?.zh} placeholder="中国語" required className="form-input font-zh" disabled={modalMessage !== ""} />
               <input name="py" defaultValue={editingPhrase?.py} placeholder="ピンイン" className="form-input font-zh" disabled={modalMessage !== ""} />
               <input name="ja" defaultValue={editingPhrase?.ja} placeholder="意味" required className="form-input font-ja" disabled={modalMessage !== ""} />
               {modalMessage && (
                 <div className={`status-message ${modalSuccess ? 'success' : 'error'}`}>
                   {modalMessage}
                 </div>
               )}
               <div className="modal-button-group">
                <button type="button" onClick={() => { setIsModalOpen(false); setModalMessage(""); setModalSuccess(false); }} className="modal-cancel-btn">戻る</button>
                <button type="submit" className="modal-submit-btn" disabled={modalMessage !== ""}>保存</button>
               </div>
             </div>
          </form>
        </div>
      )}


      {isChengyuManageModalOpen && (
        <div className="modal-overlay font-ja">
          <div className="modal-content chengyu-manage-modal-content">
            <button onClick={() => setIsChengyuManageModalOpen(false)} className="modal-close-btn"><X size={20}/></button>
            <h3 className="modal-header">成語を管理</h3>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button onClick={() => { setEditingChengyu(null); setIsChengyuManageModalOpen(false); setIsChengyuModalOpen(true); }} className="chengyu-add-button font-ja">+ 新規追加</button>
              <button onClick={() => setIsChengyuImportModalOpen(true)} className="chengyu-add-button-bulk font-ja" style={{ flex: 1 }}>一括登録</button>
            </div>
            <div className="chengyu-list">
              {allChengyuList.map((chengyu, idx) => (
                <div key={idx} className="chengyu-list-item">
                  <div className="chengyu-list-item-left">
                    <div className="chengyu-list-item-zh font-zh">{chengyu.zh}</div>
                    <div className="chengyu-list-item-py font-zh">{chengyu.py}</div>
                    <div className="chengyu-list-item-ja font-ja">{chengyu.ja}</div>
                  </div>
                  <div className="chengyu-list-item-right">
                    <button onClick={() => { setEditingChengyu(chengyu); setIsChengyuManageModalOpen(false); setIsChengyuModalOpen(true); }} className="chengyu-button-small edit font-ja">編集</button>
                    <button onClick={() => { if (confirm('本当に削除しますか？')) { const updated = allChengyuList.filter(c => c.zh !== chengyu.zh); setAllChengyuList(updated); saveChengyuToCloud(updated); if (updated.length === 0) setRandomChengyu(null); } }} className="chengyu-button-small delete font-ja">削除</button>
                  </div>
                </div>
              ))}
              {allChengyuList.length === 0 && (
                <div className="chengyu-empty-message font-ja">成語がまだ登録されていません</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isChengyuImportModalOpen && (
        <div className="modal-overlay font-ja">
          <form ref={chengyuImportFormRef} className="modal-content relative" onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            
            if (!chengyuImportText.trim()) {
              setChengyuImportMessage("テキストを入力してください");
              setChengyuImportSuccess(false);
              return;
            }
            
            const lines = chengyuImportText.split('\n').filter((l: string) => l.trim());
            const allItems = lines.map((line: string) => {
              const pts = line.split(/[,\t\s\u3000]+/).map((s: string) => s.trim()).filter((s: string) => s);
              if (pts.length < 2) return null;
              const zh = pts[0];
              const ja = pts[pts.length - 1];
              const py = pts.length > 2 ? pts.slice(1, -1).join(' ') : '';
              return { zh, py, ja };
            }).filter((i: any): i is {zh: string; py: string; ja: string} => i !== null);
            
            // 既存の中国語を集める
            const existingZh = new Set(allChengyuList.map(c => c.zh));
            
            // 重複していないアイテムのみフィルタリング
            const newItems = allItems.filter(item => !existingZh.has(item.zh));
            const duplicateCount = allItems.length - newItems.length;
            
            if (newItems.length === 0 && allItems.length > 0) {
              setChengyuImportMessage(`登録済み: ${duplicateCount}件 (新規登録なし)`);
              setChengyuImportSuccess(false);
              return;
            }
            
            if (newItems.length > 0) {
              // 成功メッセージを即座に表示
              const msg = duplicateCount > 0 
                ? `✓ ${newItems.length}件登録しました (重複: ${duplicateCount}件)`
                : `✓ ${newItems.length}件登録しました`;
              setChengyuImportMessage(msg);
              setChengyuImportSuccess(true);
              setChengyuImportText("");
              
              // その後、登録処理を実行
              const updated = [...allChengyuList, ...newItems];
              setAllChengyuList(updated);
              await saveChengyuToCloud(updated);
              
              // 1.5秒後にモーダルを關じる
              setTimeout(() => {
                setIsChengyuImportModalOpen(false);
                setChengyuImportMessage("");
                setChengyuImportSuccess(false);
                chengyuImportFormRef.current?.reset();
              }, 1500);
            } else {
              setChengyuImportMessage("有効なデータがありません");
              setChengyuImportSuccess(false);
            }
          }}>
             <button type="button" onClick={() => { chengyuImportFormRef.current?.reset(); setChengyuImportText(""); setIsChengyuImportModalOpen(false); setChengyuImportMessage(""); setChengyuImportSuccess(false); }} className="modal-close-btn"><X size={20}/></button>
             <h3 className="modal-header">成語を一括登録</h3>
             <div className="modal-form">
               <textarea value={chengyuImportText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setChengyuImportText(e.target.value)} placeholder="一矢 yĭ shǔ 盗賌 響龜" className="form-textarea" />
               {chengyuImportMessage && (
                 <div className={`status-message large ${chengyuImportSuccess ? 'success' : 'error'}`}>
                   {chengyuImportMessage}
                 </div>
               )}
               <button type="submit" className="modal-submit-btn">実行</button>
             </div>
          </form>
        </div>
      )}

      {isChengyuModalOpen && (
        <div className="modal-overlay font-ja">
          <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            
            const isEditing = !!editingChengyu;
            setChengyuModalMessage(isEditing ? '✓ 編集しました' : '✓ 追加しました');
            setChengyuModalSuccess(true);
            
            const fd = new FormData(e.currentTarget);
            const zh = fd.get('zh') as string;
            const py = fd.get('py') as string;
            const ja = fd.get('ja') as string;
            
            // 重複チェック（編集時は除外）
            if (!editingChengyu) {
              const isDuplicate = allChengyuList.some(c => c.zh === zh);
              if (isDuplicate) {
                alert(`「${zh}」は既に登録されています`);
                setChengyuModalMessage("");
                setChengyuModalSuccess(false);
                return;
              }
            }
            
            const newItem = { zh, py, ja };
            const updated = editingChengyu 
              ? allChengyuList.map(c => c.zh === editingChengyu.zh ? newItem : c)
              : [...allChengyuList, newItem];
            
            setAllChengyuList(updated);
            await saveChengyuToCloud(updated);
            setRandomChengyu(updated[0]);
            
            // 1.5秒後にモーダルを閉じる
            setTimeout(() => {
              setIsChengyuModalOpen(false);
              setEditingChengyu(null);
              setChengyuModalMessage("");
              setChengyuModalSuccess(false);
              // 管理モーダルを再度開く
              setIsChengyuManageModalOpen(true);
            }, 1500);
          }} className="modal-content relative">
             <button onClick={() => { setIsChengyuModalOpen(false); setEditingChengyu(null); setChengyuModalMessage(""); setChengyuModalSuccess(false); }} className="modal-close-btn"><X size={20}/></button>
             <h3 className="modal-header">成語を{editingChengyu ? '編集' : '追加'}</h3>
             <div className="modal-form">
               <input name="zh" defaultValue={editingChengyu?.zh} placeholder="中国語" required className="form-input font-zh" disabled={chengyuModalMessage !== ""} />
               <input name="py" defaultValue={editingChengyu?.py} placeholder="ピンイン" className="form-input font-zh" disabled={chengyuModalMessage !== ""} />
               <input name="ja" defaultValue={editingChengyu?.ja} placeholder="意味" required className="form-input font-ja" disabled={chengyuModalMessage !== ""} />
               {chengyuModalMessage && (
                 <div className={`status-message ${chengyuModalSuccess ? 'success' : 'error'}`}>
                   {chengyuModalMessage}
                 </div>
               )}
               <div className="modal-button-group">
                <button type="button" onClick={() => { setIsChengyuModalOpen(false); setEditingChengyu(null); setChengyuModalMessage(""); setChengyuModalSuccess(false); }} className="modal-cancel-btn">戻る</button>
                <button type="submit" className="modal-submit-btn" disabled={chengyuModalMessage !== ""}>保存</button>
               </div>
             </div>
          </form>
        </div>
      )}

      {isImportModalOpen && (
        <div className="modal-overlay font-ja">
          <form ref={importFormRef} className="modal-content relative" onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            
            if (!importText.trim()) {
              setImportMessage("テキストを入力してください");
              setImportSuccess(false);
              return;
            }
            
            const lines = importText.split('\n').filter((l: string) => l.trim());
            const allItems = lines.map((line: string) => {
              const pts = line.split(/[,\t\s\u3000]+/).map((s: string) => s.trim()).filter((s: string) => s);
              if (pts.length < 2) return null;
              const zh = pts[0];
              const ja = pts[pts.length - 1];
              const py = pts.length > 2 ? pts.slice(1, -1).join(' ') : '';
              return { id: Math.random().toString(36).substr(2, 9), zh, py, ja };
            }).filter((i: any): i is {id: string; zh: string; py: string; ja: string} => i !== null);
            
            // 既存の中国語を集める
            const existingZh = new Set(phrases.map(p => p.zh));
            
            // 重複していないアイテムのみフィルタリング
            const newItems = allItems.filter(item => !existingZh.has(item.zh));
            const duplicateCount = allItems.length - newItems.length;
            
            if (newItems.length === 0 && allItems.length > 0) {
              setImportMessage(`登録済み: ${duplicateCount}件 (新規登録なし)`);
              setImportSuccess(false);
              return;
            }
            
            if (newItems.length > 0) {
              // 成功メッセージを即座に表示
              const msg = duplicateCount > 0 
                ? `✓ ${newItems.length}件登録しました (重複: ${duplicateCount}件)`
                : `✓ ${newItems.length}件登録しました`;
              setImportMessage(msg);
              setImportSuccess(true);
              setImportText("");
              
              // その後、登録処理を実行
              const up = [...phrases, ...newItems];
              setPhrases(up);
              await saveToCloud(up);
            } else {
              setImportMessage("有効なデータがありません");
              setImportSuccess(false);
            }
          }}>
             <button type="button" onClick={() => { importFormRef.current?.reset(); setImportText(""); setIsImportModalOpen(false); setImportMessage(""); setImportSuccess(false); }} className="modal-close-btn"><X size={20}/></button>
             <h3 className="modal-header">一括インポート</h3>
             <div className="modal-form">
               <textarea value={importText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImportText(e.target.value)} placeholder="你好 nǐ hǎo こんにちは" className="form-textarea" />
               {importMessage && (
                 <div className={`status-message large ${importSuccess ? 'success' : 'error'}`}>
                   {importMessage}
                 </div>
               )}
               <button type="submit" className="modal-submit-btn">実行</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};


export default App;
