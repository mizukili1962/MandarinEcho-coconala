export const recordLearningProgress = async (
  phraseId: string,
  success: boolean
): Promise<void> => {
  console.log("学習記録", phraseId, success);
};
