import { calculateSimilarity } from '../utils/stringUtils';

export const listenAndAdvance = (
  targetZh: string,
  setIsListening: (value: boolean) => void
): Promise<boolean> => {
  return new Promise((resolve) => {

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) return resolve(false);

    const rec = new SpeechRecognition();

    rec.lang = 'zh-CN';

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onend = () => {
      setIsListening(false);
      resolve(false);
    };

    rec.onresult = (e: any) => {
      const result = e.results[0][0].transcript.trim();

      const similarity = calculateSimilarity(result, targetZh);

      if (similarity > 0.65) {
        resolve(true);
        rec.stop();
      }
    };

    rec.start();
  });
};
