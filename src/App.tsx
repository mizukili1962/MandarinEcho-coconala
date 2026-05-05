import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signOut, 
  type User
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Mic, LogOut, ChevronLeft, 
  Plus, Trash2, Edit2,
  Volume2,
  FileText, X, RotateCcw
} from 'lucide-react';
import './App.css'



const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'fluency-trainer-v5';


// --- UI Components (Ornate Icons) ---
const OrnatePlum = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 25 L35 45 L85 75 M35 45 L55 60 M55 60 L65 50 M55 60 L50 80" strokeWidth="4" />
    <g transform="translate(25, 25) scale(0.6)">
      <circle cx="0" cy="-10" r="10" fill="white" stroke="currentColor" />
      <circle cx="10" cy="0" r="10" fill="white" stroke="currentColor" />
      <circle cx="0" cy="10" r="10" fill="white" stroke="currentColor" />
      <circle cx="-10" cy="0" r="10" fill="white" stroke="currentColor" />
      <circle cx="0" cy="0" r="4" fill="currentColor" />
    </g>
    <g transform="translate(55, 55) scale(0.7)">
      <circle cx="0" cy="-10" r="10" fill="white" stroke="currentColor" />
      <circle cx="10" cy="0" r="10" fill="white" stroke="currentColor" />
      <circle cx="0" cy="10" r="10" fill="white" stroke="currentColor" />
      <circle cx="-10" cy="0" r="10" fill="white" stroke="currentColor" />
      <circle cx="0" cy="0" r="4" fill="currentColor" />
    </g>
    <circle cx="45" cy="48" r="3" fill="currentColor" />
  </svg>
);


const OrnateOrchid = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M50 80 C50 60 40 40 25 25" />
    <path d="M25 25 Q15 15 25 5 Q35 15 25 25" fill="currentColor" fillOpacity="0.2" />
    <path d="M25 25 Q35 35 45 25 Q35 15 25 25" fill="currentColor" fillOpacity="0.2" />
    <path d="M50 80 C65 70 85 40 70 20" strokeWidth="2" opacity="0.6" />
    <path d="M50 80 C35 70 15 40 30 20" strokeWidth="2" opacity="0.6" />
  </svg>
);


const OrnateBamboo = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="butt" className={className}>
    <path d="M40 90 L40 68 M40 62 L40 40 M40 34 L40 10" />
    <path d="M70 90 L70 72 M70 66 L70 48 M70 42 L70 25" strokeWidth="5" opacity="0.7" />
    <path d="M34 65 H46 M34 37 H46 M66 69 H74 M66 45 H74" strokeWidth="2" />
    <g fill="currentColor" stroke="none">
      <path d="M40 40 L25 55 L35 50 Z" />
      <path d="M70 48 L85 38 L75 42 Z" />
    </g>
  </svg>
);


const OrnateChrysanthemum = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    {[...Array(16)].map((_, i) => {
      const deg = i * (360 / 16);
      return (
        <g key={i} transform={`rotate(${deg} 50 50)`}>
          <path d="M50 40 C55 35 58 10 50 5 C42 10 45 35 50 40" fill="currentColor" fillOpacity="0.1" />
          <path d="M50 40 L50 15" strokeOpacity="0.4" strokeWidth="1" />
        </g>
      );
    })}
    {[...Array(16)].map((_, i) => {
      const deg = (i * (360 / 16)) + (360 / 32);
      return (
        <g key={`inner-${i}`} transform={`rotate(${deg} 50 50)`}>
          <path d="M50 42 C54 38 56 25 50 20 C44 25 46 38 50 42" fill="currentColor" fillOpacity="0.2" />
        </g>
      );
    })}
  </svg>
);


// --- 成語データベース ---
const CHENGYU_LIST = [
  { zh: "温故知新", py: "wēn gù zhī xīn", ja: "昔の事を研究して、新しい知識を得ること" },
  { zh: "一心一意", py: "yī xīn yī yì", ja: "一つのことに心を集中させること" },
  { zh: "自由自在", py: "zì yóu zì zài", ja: "思う通りに振る舞うこと" },
  { zh: "日新月异", py: "rì xīn yuè yì", ja: "絶えず進歩し、変化すること" },
  { zh: "入木三分", py: "rù mù sān fēn", ja: "見識や描写が非常に鋭く深いこと" },
  { zh: "半途而废", py: "bàn tú ér fèi", ja: "物事を途中で投げ出すこと" },
  { zh: "不可思议", py: "bù kě sī yì", ja: "想像もできないほど不思議なこと" },
  { zh: "自强不息", py: "zì qiáng bù xī", ja: "自ら進んで努力し、怠らないこと" },
  { zh: "胸有成竹", py: "xiōng yǒu chéng zhú", ja: "成算がすでにあること" },
  { zh: "大同小异", py: "dà tóng xiǎo yì", ja: "だいたい同じで、少し違うだけのこと" },
  { zh: "一见钟情", py: "yī jiàn zhōng qíng", ja: "一目惚れすること" },
  { zh: "名副其实", py: "míng fù qí shí", ja: "名実ともに備わっていること" },
  { zh: "坚持不懈", py: "jiān chí bù xiè", ja: "最後までたゆまずやり抜くこと" },
  { zh: "守口如瓶", py: "shǒu kǒu rú píng", ja: "口が非常に堅いこと" },
  { zh: "心曠神怡", py: "xīn kuàng shén yí", ja: "心が広々として気持ちが良いこと" },
  { zh: "精益求精", py: "jīng yì qiú jīng", ja: "良いものをさらに良くしようとすること" },
  { zh: "井底之蛙", py: "jǐng dǐ zhī wā", ja: "井の中の蛙、見識の狭いこと" },
  { zh: "画蛇添足", py: "huà shé tiān zú", ja: "余計な付け足しをすること" },
  { zh: "塞翁失马", py: "sài wēng shī mǎ", ja: "人生の幸福や不幸は予測できないこと" },
  { zh: "青出于蓝", py: "qīng chū yú lán", ja: "弟子が師匠よりも優れていること" },
  { zh: "落花流水", py: "luò huā liú shuǐ", ja: "無残に打ち負かされること" },
  { zh: "一石二鸟", py: "yī shí èr niǎo", ja: "一石二鳥、一つの行動で二つの利益を得ること" },
  { zh: "破釜沉舟", py: "pò fǔ chén zhōu", ja: "決死の覚悟で事に当たること" },
  { zh: "前程似锦", py: "qián chéng sì jǐn", ja: "前途が輝かしく希望に満ちていること" },
  { zh: "走马观花", py: "zǒu mǎ guān huā", ja: "物事を表面だけ見て深く理解しないこと" },
  { zh: "纸上谈兵", py: "zhǐ shàng tán bīng", ja: "机上の空論、実行の伴わない議論" },
  { zh: "顺其自然", py: "shùn qí zì rán", ja: "あるがまま、自然の流れに任せること" },
  { zh: "万无一失", py: "wàn wú yī shī", ja: "絶対に間違いがない、万全であること" },
  { zh: "废寝忘食", py: "fèi qǐn wàng shí", ja: "寝食を忘れて没頭すること" },
  { zh: "望尘莫及", py: "wàng chén mò jí", ja: "はるかに及ばないこと" },
  { zh: "全力以赴", py: "quán lì yǐ fù", ja: "全力を尽くして取り組むこと" },
  { zh: "众志成城", py: "zhòng zhì chéng chéng", ja: "団結すれば何事も成し遂げられること" }
];


const INITIAL_PHRASES = [
  { id: '1', zh: "日本", py: "rì běn", ja: "日本" },
  { id: '2', zh: "谢谢", py: "xiè xie", ja: "ありがとう" },
  { id: '3', zh: "谢谢", py: "xiexie", ja: "ありがとう", focus: "舌面音x" },
  { id: '4', zh: "早上好", py: "zaoshanghao", ja: "おはよう", focus: "そり舌音sh" },
  { id: '5', zh: "喝水", py: "heshui", ja: "水を飲む", focus: "喉の奥のe" },
  { id: '6', zh: "你是", py: "nishi", ja: "あなたは〜です", focus: "nとsh" }
];


const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [phrases, setPhrases] = useState<Array<{id: string; zh: string; py: string; ja: string}>>([]);
  const [shuffleQueue, setShuffleQueue] = useState<number[]>([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [view, setView] = useState('start'); 
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("待機中");
  const [lastResult, setLastResult] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<{id: string; zh: string; py: string; ja: string} | null>(null);
  const [importText, setImportText] = useState("");


  const [isManualListening, setIsManualListening] = useState(false);

  const isAborted = useRef(false);
  const recognitionRef = useRef<any>(null);


  const [randomChengyu, setRandomChengyu] = useState(CHENGYU_LIST[0]);


  useEffect(() => {
    if (view === 'start') {
      const idx = Math.floor(Math.random() * CHENGYU_LIST.length);
      setRandomChengyu(CHENGYU_LIST[idx]);
    }
  }, [view]);


  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (e) {}
      const unsubscribe = onAuthStateChanged(auth, (u: User | null) => {
        setUser(u);
        setLoading(false);
      });
      return unsubscribe;
    };
    initAuth();
  }, []);


  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data');
    return onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.phrases) setPhrases(data.phrases);
      } else {
        setPhrases(INITIAL_PHRASES);
        setDoc(userDocRef, { phrases: INITIAL_PHRASES });
      }
    }, (err) => console.error(err));
  }, [user]);


  const saveToCloud = async (newPhrases: Array<{id: string; zh: string; py: string; ja: string}>): Promise<void> => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data');
      await setDoc(userDocRef, { phrases: newPhrases }, { merge: true });
    } catch (error) {}
  };


  const speak = (text: string, lang: string = 'zh-CN'): Promise<void> => {
    return new Promise((resolve: (value: void) => void) => {
      if (isAborted.current) return resolve();
      window.speechSynthesis.cancel();
      const ut = new SpeechSynthesisUtterance(text);
      ut.lang = lang;
      ut.rate = lang === 'ja-JP' ? 1.4 : 0.85;
      ut.pitch = 1.0;
      ut.volume = 1.0;
      ut.onend = () => resolve();
      ut.onerror = () => resolve();
      window.speechSynthesis.speak(ut);
    });
  };


  const listenAndAdvance = (targetZh: string): Promise<boolean> => {
    return new Promise((resolve: (value: boolean) => void) => {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) return resolve(false);
      const rec = new (SpeechRecognition as any)();
      recognitionRef.current = rec;
      rec.lang = 'zh-CN';
      rec.onstart = (): void => setIsListening(true);
      rec.onresult = (e: any): void => {
        const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
        setLastResult(transcript);
        if (transcript.includes(targetZh)) { 
          rec.onend = null; 
          rec.stop(); 
          setIsListening(false);
          resolve(true); 
        }
      };
      rec.onerror = (): void => resolve(false);
      rec.onend = (): void => { setIsListening(false); resolve(false); };
      rec.start();
    });
  };


  const runSession = async (currentQueue: number[], currentIndex: number, trainingData?: Array<{id: string; zh: string; py: string; ja: string}>, retryCount: number = 0): Promise<void> => {
    // trainingDataが渡されなかった場合は現在のphrasesを使用
    const data = trainingData || phrases;
    const MAX_RETRIES = 3; // 最大再試行回数
    
    if (isAborted.current || currentIndex >= currentQueue.length) {
      if (currentIndex >= currentQueue.length) {
        setStatus("完了");
        await speak("お疲れ様でした", "ja-JP");
        setTimeout(() => setView('start'), 1200);
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
      setLastResult("");
      setStatus(`再試行... (${retryCount}/${MAX_RETRIES})`);
      await new Promise(r => setTimeout(r, 400));
    }

    setStatus("お手本...");
    await speak(phrase.zh, 'zh-CN');
    
    if (isAborted.current) return;
    
    setStatus("聞き取り中...");
    const success = await listenAndAdvance(phrase.zh);
    
    if (isAborted.current) return;
    
    if (success) {
      setStatus("正解");
      await speak(phrase.ja, 'ja-JP');
      setTimeout(() => runSession(currentQueue, currentIndex + 1, trainingData, 0), 300);
    } else {
      // 再試行回数をチェック
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => runSession(currentQueue, currentIndex, trainingData, retryCount + 1), 400);
      } else {
        // 最大再試行回数に達したためスキップ
        setStatus("スキップ");
        setTimeout(() => runSession(currentQueue, currentIndex + 1, trainingData, 0), 1500);
      }
    }
  };


  const handleStartTrainingFlow = async (): Promise<void> => {
    console.log("練習開始ボタン押下 - phrases:", phrases.length);
    
    // phrasesが空の場合、CHENGYU_LISTをデフォルトとして使用
    const trainingPhrases = phrases.length > 0 ? phrases : CHENGYU_LIST.map((item, idx) => ({
      id: idx.toString(),
      zh: item.zh,
      py: item.py,
      ja: item.ja
    }));
    
    if (trainingPhrases.length === 0) {
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
      const warmup = new SpeechSynthesisUtterance("");
      warmup.volume = 0;
      window.speechSynthesis.speak(warmup);
      console.log("ステップ2: 音声合成ウォームアップ完了");
      
      const q = Array.from({length: trainingPhrases.length}, (_, i) => i).sort(() => Math.random() - 0.5);
      isAborted.current = false;
      
      console.log("ステップ3: UI更新開始");
      // phrasesを更新（学習画面で表示するため）
      setPhrases(trainingPhrases);
      setShuffleQueue(q);
      setQueueIdx(0);
      setView('learn');
      
      // 3. UI遷移を待ってからセッション開始
      console.log("ステップ4: セッション開始予定");
      setTimeout(() => {
        console.log("セッション実行開始");
        runSession(q, 0, trainingPhrases);
      }, 300);
      
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


      {user && (
        <>
          <header className={`app-header ${isHandsFree ? 'handsfree' : 'normal'}`}>
            <div className="app-header-title">
              <Volume2 size={20} className={isHandsFree ? 'text-[#ffd700]' : 'text-white'} />
              <h1 className={`font-ja ${isHandsFree ? 'text-[#ffd700]' : 'text-white'}`}>Mandarin Echo</h1>
            </div>
            <button onClick={() => signOut(auth)} className="text-white"><LogOut size={20} /></button>
          </header>


          <main className="app-main">
            {view === 'start' && (
              <div className="start-view">
                <div className={`chengyu-card ${isHandsFree ? 'handsfree' : 'normal'}`}>
                  <div className={`chengyu-display font-zh ${isHandsFree ? 'text-[#ffd700]' : 'text-white'}`}>{randomChengyu.zh}</div>
                  <div className="chengyu-pinyin font-zh">{randomChengyu.py}</div>
                  <div className="chengyu-meaning font-ja">{randomChengyu.ja}</div>
                </div>
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


            {view === 'learn' && shuffleQueue.length > 0 && queueIdx < shuffleQueue.length && phrases.length > 0 && phrases[shuffleQueue[queueIdx]] && (
              <div className="learn-view">
                <button onClick={() => { isAborted.current = true; setView('start'); window.speechSynthesis.cancel(); if(recognitionRef.current) recognitionRef.current.stop(); }} className="back-btn font-ja"><ChevronLeft size={18}/> 戻る</button>
                <div className={`phrase-card ${isHandsFree ? 'handsfree' : 'normal'}`}>
                   <div className={`phrase-zh font-zh ${isHandsFree ? 'text-[#ffd700]' : 'text-white'}`}>{phrases[shuffleQueue[queueIdx]].zh}</div>
                   <div className="phrase-py font-zh">{phrases[shuffleQueue[queueIdx]].py}</div>
                   <div className="phrase-ja font-ja">{phrases[shuffleQueue[queueIdx]].ja}</div>
                </div>
                <div className="status-box">
                   <div className="status-label font-ja">{status}</div>
                   {isListening ? (
                     <div className={`status-text listening font-zh ${isHandsFree ? 'text-[#ffd700]' : 'text-white'}`}>{lastResult || "..."}</div>
                   ) : <Mic size={32} className="opacity-20" />}
                </div>
                <div className="button-group">
                  <button onClick={() => { window.speechSynthesis.cancel(); const ut = new SpeechSynthesisUtterance(phrases[shuffleQueue[queueIdx]].zh); ut.lang = 'zh-CN'; ut.rate = 0.85; window.speechSynthesis.speak(ut); }} className="example-btn font-ja"><Volume2 size={18} /> お手本</button>
                  <button onClick={async () => {
                    // 現在の聞き取りを中断
                    if (recognitionRef.current) {
                      recognitionRef.current.abort();
                    }
                    setLastResult("");
                    setIsManualListening(true);
                    setStatus("聞き取り中...");
                    
                    // 手動で聞き取りを再開
                    const recognized = await listenAndAdvance(phrases[shuffleQueue[queueIdx]].zh);
                    if (recognized) {
                      setStatus("認識されました！");
                      await speak(phrases[shuffleQueue[queueIdx]].ja, 'ja-JP');
                      setStatus("進行中...");
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
            const fd = new FormData(e.currentTarget);
            const newItem = { id: editingPhrase?.id || Date.now().toString(), zh: fd.get('zh') as string, py: fd.get('py') as string, ja: fd.get('ja') as string };
            const up = editingPhrase ? phrases.map(p => p.id === editingPhrase.id ? newItem : p) : [...phrases, newItem];
            setPhrases(up); await saveToCloud(up); setIsModalOpen(false);
          }} className="modal-content">
             <h3 className="modal-header">単語を{editingPhrase ? '編集' : '追加'}</h3>
             <div className="modal-form">
               <input name="zh" defaultValue={editingPhrase?.zh} placeholder="中国語" required className="form-input font-zh" />
               <input name="py" defaultValue={editingPhrase?.py} placeholder="ピンイン" className="form-input font-zh" />
               <input name="ja" defaultValue={editingPhrase?.ja} placeholder="意味" required className="form-input font-ja" />
               <div className="modal-button-group">
                <button type="button" onClick={() => setIsModalOpen(false)} className="modal-cancel-btn">戻る</button>
                <button type="submit" className="modal-submit-btn">保存</button>
               </div>
             </div>
          </form>
        </div>
      )}


      {isImportModalOpen && (
        <div className="modal-overlay font-ja">
          <div className="modal-content relative">
             <button onClick={() => setIsImportModalOpen(false)} className="modal-close-btn"><X size={20}/></button>
             <h3 className="modal-header">一括インポート</h3>
             <div className="modal-form">
               <textarea value={importText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImportText(e.target.value)} placeholder="你好 nǐ hǎo こんにちは" className="form-textarea" />
               <button onClick={async (): Promise<void> => {
                  const lines = importText.split('\n').filter((l: string) => l.trim());
                  const newItems = lines.map((line: string) => {
                    const pts = line.split(/[,\t\s]+/).map((s: string) => s.trim()).filter((s: string) => s);
                    if (pts.length < 2) return null;
                    return { id: Math.random().toString(36).substr(2, 9), zh: pts[0], py: pts.length === 3 ? pts[1] : "", ja: pts.length === 3 ? pts[2] : pts[1] };
                  }).filter((i: any): i is {id: string; zh: string; py: string; ja: string} => i !== null);
                  if (newItems.length > 0) { const up = [...phrases, ...newItems]; setPhrases(up); await saveToCloud(up); setIsImportModalOpen(false); setImportText(""); }
               }} className="modal-submit-btn">実行</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default App;