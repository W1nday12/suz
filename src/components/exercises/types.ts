export interface ExerciseProps<T> {
  exercise: T
  onAnswer: (correct: boolean, wordId?: string, relatedWordIds?: string[]) => void
  onNext: () => void
  onWordResult?: (wordId: string, correct: boolean) => void
}
