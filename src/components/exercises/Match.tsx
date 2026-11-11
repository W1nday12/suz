import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Check } from 'lucide-react'
import { useScript } from '../../lib/i18n'
import { toLatin } from '../../lib/translit'
import type { MatchExercise } from '../../lib/exercises'
import { Footer, type AnswerState } from './Footer'
import type { ExerciseProps } from './types'

function shuffled<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
}

export function MatchView({ exercise, onAnswer, onNext, onWordResult }: ExerciseProps<MatchExercise>) {
  const script = useScript()
  const left = useMemo(() => shuffled(exercise.pairs), [exercise.id])
  const right = useMemo(() => shuffled(exercise.pairs), [exercise.id])
  const [selected, setSelected] = useState<{ side: 'left' | 'right'; wordId: string } | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const [errors, setErrors] = useState(0)
  const [shake, setShake] = useState<string | null>(null)
  const [hint, setHint] = useState<{ tt: string; ru: string } | null>(null)
  const [state, setState] = useState<AnswerState>('idle')

  const finish = (nextMatched: string[], nextErrors: number) => {
    if (nextMatched.length !== exercise.pairs.length) return
    const perfect = nextErrors === 0
    setState(perfect ? 'correct' : 'wrong')
    onAnswer(perfect)
  }

  const choose = (side: 'left' | 'right', wordId: string) => {
    if (state !== 'idle' || matched.includes(wordId)) return
    if (!selected) {
      setHint(null)
      setSelected({ side, wordId })
      return
    }
    if (selected.side === side) {
      setSelected({ side, wordId })
      return
    }

    if (selected.wordId === wordId) {
      const nextMatched = [...matched, wordId]
      setMatched(nextMatched)
      setSelected(null)
      setHint(null)
      onWordResult?.(wordId, true)
      finish(nextMatched, errors)
    } else {
      const nextErrors = errors + 1
      setErrors(nextErrors)
      const pair = exercise.pairs.find((item) => item.wordId === selected.wordId)
      if (pair) setHint({ tt: pair.tt, ru: pair.ru })
      setShake(`${selected.side}-${selected.wordId}`)
      onWordResult?.(selected.wordId, false)
      window.setTimeout(() => {
        setShake(null)
        setSelected(null)
      }, 480)
      setSelected(null)
    }
  }

  return (
    <div className="exercise match-exercise">
      <div className="exercise-scroll">
        <p className="exercise-kicker">Парларны тап</p>
        <h2 className="exercise-title">Соедини пары</h2>
        <p className="exercise-note">Татарское слово → русский перевод. Ошибки тоже считаются.</p>

        <div className="match-grid">
          <div className="match-col">
            {left.map((pair) => {
              const done = matched.includes(pair.wordId)
              return (
                <button
                  key={`l-${pair.wordId}`}
                  type="button"
                  className={clsx(
                    'match-item',
                    done && 'matched',
                    selected?.side === 'left' && selected.wordId === pair.wordId && 'selected',
                    shake === `left-${pair.wordId}` && 'shake',
                  )}
                  onClick={() => choose('left', pair.wordId)}
                  disabled={done}
                >
                  <span>{script === 'latin' ? toLatin(pair.tt) : pair.tt}</span>
                  {done && <Check size={15} />}
                </button>
              )
            })}
          </div>
          <div className="match-col">
            {right.map((pair) => {
              const done = matched.includes(pair.wordId)
              return (
                <button
                  key={`r-${pair.wordId}`}
                  type="button"
                  className={clsx(
                    'match-item ru',
                    done && 'matched',
                    selected?.side === 'right' && selected.wordId === pair.wordId && 'selected',
                    shake === `right-${pair.wordId}` && 'shake',
                  )}
                  onClick={() => choose('right', pair.wordId)}
                  disabled={done}
                >
                  <span>{pair.ru}</span>
                  {done && <Check size={15} />}
                </button>
              )
            })}
          </div>
        </div>
        {errors > 0 && <p className="match-errors">Хата: {errors}. Продолжай.</p>}
        {hint && (
          <p className="match-hint">
            Правильная пара: <b>{script === 'latin' ? toLatin(hint.tt) : hint.tt}</b> — {hint.ru}
          </p>
        )}
      </div>

      <Footer
        state={state}
        hideCheck
        onCheck={() => undefined}
        onNext={onNext}
        note={state === 'wrong' ? 'Пара собрана, но были ошибки. Повтори слова в банке ошибок.' : undefined}
        idleHint="Выбери слово слева, затем перевод справа"
      />
    </div>
  )
}
