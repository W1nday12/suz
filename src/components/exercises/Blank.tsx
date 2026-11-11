import { useState } from 'react'
import clsx from 'clsx'
import { useScript } from '../../lib/i18n'
import { toLatin } from '../../lib/translit'
import type { BlankExercise } from '../../lib/exercises'
import { Footer, type AnswerState } from './Footer'
import type { ExerciseProps } from './types'

export function BlankView({ exercise, onAnswer, onNext }: ExerciseProps<BlankExercise>) {
  const script = useScript()
  const [selected, setSelected] = useState<string | null>(null)
  const [state, setState] = useState<AnswerState>('idle')

  const display = (text: string) => (script === 'latin' ? toLatin(text) : text)
  const fullSentence = `${display(exercise.before)} ${display(exercise.answer)} ${display(exercise.after)}`
    .replace(/\s+([.,!?;:…])/g, '$1')
    .trim()

  const check = () => {
    if (!selected) return
    const correct = selected === exercise.answer
    setState(correct ? 'correct' : 'wrong')
    onAnswer(correct, exercise.wordId)
  }

  return (
    <div className="exercise blank-exercise">
      <div className="exercise-scroll">
        <p className="exercise-kicker">Буш урынны тутыр</p>
        <h2 className="exercise-title">Вставь пропущенное слово</h2>

        <div className="sentence-blank-card">
          <p className="blank-sentence">
            {display(exercise.before)}{' '}
            <span className={clsx('blank-slot', selected && 'filled', state !== 'idle' && state)}>
              {selected ? display(selected) : '\u00A0\u00A0\u00A0\u00A0'}
            </span>{' '}
            {display(exercise.after)}
          </p>
          <p className="prompt-sub">{exercise.ru}</p>
        </div>

        <div className="options-grid blank-options">
          {exercise.options.map((option) => {
            const isSelected = selected === option
            const isCorrect = state !== 'idle' && option === exercise.answer
            const isWrong = state === 'wrong' && isSelected && option !== exercise.answer
            return (
              <button
                key={option}
                type="button"
                className={clsx('option', isSelected && 'selected', isCorrect && 'correct', isWrong && 'wrong')}
                onClick={() => state === 'idle' && setSelected(option)}
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
        correctAnswer={display(exercise.answer)}
        note={
          state === 'wrong'
            ? `Полное предложение: ${fullSentence} — ${exercise.ru}`
            : undefined
        }
        idleHint={!selected ? 'Выбери слово' : undefined}
      />
    </div>
  )
}
