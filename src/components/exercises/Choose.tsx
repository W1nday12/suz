import { useState } from 'react'
import clsx from 'clsx'
import { useScript, useT } from '../../lib/i18n'
import { toLatin } from '../../lib/translit'
import type { ChooseExercise } from '../../lib/exercises'
import { Footer, type AnswerState } from './Footer'
import type { ExerciseProps } from './types'

export function ChooseView({ exercise, onAnswer, onNext }: ExerciseProps<ChooseExercise>) {
  const script = useScript()
  const t = useT()
  const [selected, setSelected] = useState<string | null>(null)
  const [state, setState] = useState<AnswerState>('idle')

  const display = (value: string) =>
    exercise.optionLang === 'tt' && script === 'latin' ? toLatin(value) : value

  const promptTt = (value: string) => (script === 'latin' ? toLatin(value) : value)

  const prompt =
    exercise.mode === 'tt-ru' ? promptTt(exercise.prompt) : exercise.prompt

  const answerPair = `${promptTt(exercise.answerTt)} — ${exercise.answerRu}`

  const title =
    exercise.mode === 'tt-ru'
      ? 'Переведи на русский'
      : exercise.mode === 'ru-tt'
        ? 'Как будет по-татарски?'
        : 'Что на картинке?'

  const check = () => {
    if (!selected) return
    const correct = selected === exercise.answer
    setState(correct ? 'correct' : 'wrong')
    onAnswer(correct, exercise.wordId)
  }

  return (
    <div className="exercise choose-exercise">
      <div className="exercise-scroll">
        <p className="exercise-kicker">
          {exercise.reinforced
            ? 'Кабатлау · ошибка'
            : exercise.mode === 'tt-ru'
              ? 'Татарча → русча'
              : exercise.mode === 'ru-tt'
                ? 'Русча → татарча'
                : 'Рәсем → татарча'}
        </p>
        <h2 className="exercise-title">{title}</h2>
        <div className={clsx('prompt-card', exercise.mode === 'emoji' && 'emoji-mode')}>
          {exercise.mode === 'emoji' ? (
            <>
              <span className="prompt-emoji" aria-hidden="true">
                {exercise.prompt}
              </span>
              <p className="prompt-translation">{exercise.promptRu}</p>
            </>
          ) : (
            <h2 className="prompt-word">{prompt}</h2>
          )}
          <p className="prompt-sub">{exercise.sub}</p>
        </div>

        <div className={clsx('options-grid', exercise.optionLang === 'tt' && 'tt-options')}>
          {exercise.options.map((option) => {
            const isSelected = selected === option
            const isCorrect = state !== 'idle' && option === exercise.answer
            const isWrong = state === 'wrong' && isSelected && option !== exercise.answer
            return (
              <button
                key={option}
                type="button"
                className={clsx('option', isSelected && 'selected', isCorrect && 'correct', isWrong && 'wrong')}
                onClick={() => {
                  if (state !== 'idle') return
                  setSelected(option)
                }}
                disabled={state !== 'idle'}
              >
                <span>{display(option)}</span>
                {isCorrect && <span className="option-mark">✓</span>}
                {isWrong && <span className="option-mark">×</span>}
              </button>
            )
          })}
        </div>
      </div>

      <Footer
        state={state}
        canCheck={!!selected}
        onCheck={check}
        onNext={onNext}
        correctAnswer={answerPair}
        note={
          state === 'wrong'
            ? 'Перевод показан выше. Слово добавлено в банк ошибок — оно вернётся в повторении.'
            : state === 'correct'
              ? `Слово: ${promptTt(exercise.answerTt)} — ${exercise.answerRu}`
              : undefined
        }
        idleHint={!selected ? 'Выбери один вариант' : undefined}
      />
      <span className="sr-only">{t('question')}</span>
    </div>
  )
}
