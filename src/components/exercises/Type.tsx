import { useRef, useState } from 'react'
import clsx from 'clsx'
import { Delete, Keyboard } from 'lucide-react'
import { useScript } from '../../lib/i18n'
import { checkTyped, latinKeyboard, tatarKeyboard } from '../../lib/translit'
import type { TypeExercise } from '../../lib/exercises'
import { Footer, type AnswerState } from './Footer'
import type { ExerciseProps } from './types'

export function TypeView({ exercise, onAnswer, onNext }: ExerciseProps<TypeExercise>) {
  const script = useScript()
  const [value, setValue] = useState('')
  const [state, setState] = useState<AnswerState>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  const insert = (letter: string) => {
    if (state !== 'idle') return
    setValue((current) => current + letter)
    inputRef.current?.focus()
  }

  const check = () => {
    if (!value.trim()) return
    const correct = checkTyped(value, exercise.answer, exercise.latin)
    setState(correct ? 'correct' : 'wrong')
    onAnswer(correct, exercise.wordId)
  }

  const giveUp = () => {
    if (state !== 'idle') return
    setState('wrong')
    onAnswer(false, exercise.wordId)
  }

  return (
    <div className="exercise type-exercise">
      <div className="exercise-scroll">
        <p className="exercise-kicker">Яз</p>
        <h2 className="exercise-title">Напиши по-татарски</h2>

        <div className="prompt-card type-prompt">
          <span className="prompt-emoji small" aria-hidden="true">
            {exercise.emoji}
          </span>
          <p className="prompt-word">{exercise.ru}</p>
          <p className="prompt-sub">
            {script === 'latin' ? 'Можно латиницей или кириллицей' : 'Можно кириллицей или латиницей'}
          </p>
        </div>

        <input
          ref={inputRef}
          className={clsx('text-input big type-input', state !== 'idle' && state)}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Слово…"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          disabled={state !== 'idle'}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            if (state === 'idle') check()
            else onNext()
          }}
        />

        {state === 'idle' && (
          <div className="type-keyboard">
            <div className="keyboard-head">
              <Keyboard size={14} /> Татарские буквы
            </div>
            <div className="keyboard-row">
              {tatarKeyboard.map((letter) => (
                <button key={letter} type="button" className="key" onClick={() => insert(letter)}>
                  {letter}
                </button>
              ))}
              <button
                type="button"
                className="key key-wide"
                onClick={() => setValue((current) => current.slice(0, -1))}
                aria-label="Удалить последнюю букву"
              >
                <Delete size={16} />
              </button>
            </div>
            <div className="keyboard-row latin-keys">
              {latinKeyboard.map((letter) => (
                <button key={letter} type="button" className="key" onClick={() => insert(letter)}>
                  {letter}
                </button>
              ))}
            </div>
          </div>
        )}

        {state === 'idle' && (
          <button type="button" className="reset-line" onClick={giveUp}>
            Не знаю — показать ответ
          </button>
        )}
      </div>

      <Footer
        state={state}
        canCheck={!!value.trim()}
        onCheck={check}
        onNext={onNext}
        correctAnswer={`${exercise.answer} · ${exercise.latin} — ${exercise.ru}`}
        idleHint={!value.trim() ? 'Введи слово или нажми «Не знаю»' : undefined}
      />
    </div>
  )
}
