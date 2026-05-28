export const speak = (
  text: string,
  lang: string = 'zh-CN'
): Promise<void> => {
  return new Promise((resolve) => {

    // すべての音声合成をキャンセル
    window.speechSynthesis.cancel();

    // タイムアウト
    const timeoutId = setTimeout(() => {
      console.warn(`[音声合成] タイムアウト: "${text}"`);
      resolve();
    }, 3000);

    // 少し待ってから再生
    setTimeout(() => {

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

      ut.onerror = (e: any) => {
        clearTimeout(timeoutId);
        console.error(`[音声合成] エラー: ${e.error}`);
        resolve();
      };

      window.speechSynthesis.speak(ut);

    }, 50);
  });
};
