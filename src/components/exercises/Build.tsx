import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { RotateCcw } from 'lucide-react'
import { useScript } from '../../lib/i18n'
import { toLatin } from '../../lib/translit'
import type { BuildExercise } from '../../lib/exercises'
import { Footer, type AnswerState } from './Footer'
import type { ExerciseProps } from './types'

interface Tile {
  id: number
  text: string
}

export function BuildView({ exercise, onAnswer, onNext }: ExerciseProps<BuildExercise>) {
  const script = useScript()
  const tiles = useMemo<Tile[]>(
    () => exercise.tokens.map((text, id) => ({ id, text })),
    [exercise.id],
  )
  const [picked, setPicked] = useState<Tile[]>([])
  const [state, setState] = useState<AnswerState>('idle')

  const display = (text: string) => (script === 'latin' ? toLatin(text) : text)
  const fullAnswer = exercise.answer.join(' ')
  const isComplete = picked.length === exercise.answer.length

  const pick = (tile: Tile) => {
    if (state !== 'idle') return
    setPicked((items) => [...items, tile])
  }

  const unpick = (tile: Tile) => {
    if (state !== 'idle') return
    setPicked((items) => items.filter((item) => item.id !== tile.id))
  }

  const check = () => {
    const attempt = picked.map((tile) => tile.text).join(' ')
    const correct = attempt === fullAnswer
    setState(correct ? 'correct' : 'wrong')
    onAnswer(correct, undefined, exercise.wordIds)
  }

  return (
    <div className="exercise build-exercise">
      <div className="exercise-scroll">
        <p className="exercise-kicker">Җөмлә төзе</p>
        <h2 className="exercise-title">Собери предложение</h2>
        <div className="prompt-card sentence-prompt">
          <p className="prompt-sub">Переведи на татарский</p>
          <p className="prompt-sentence">{exercise.ru}</p>
        </div>

        <div className={clsx('build-answer', state !== 'idle' && state, isComplete && 'complete')}>
          {picked.length === 0 && <span className="build-placeholder">Нажимай на слова ниже</span>}
          {picked.map((tile) => (
            <button
              key={`p-${tile.id}`}
              type="button"
              className="token token-picked"
              onClick={() => unpick(tile)}
              disabled={state !== 'idle'}
            >
              {display(tile.text)}
            </button>
          ))}
        </div>

        <div className="build-bank">
          {tiles.map((tile) => {
            const used = picked.some((item) => item.id === tile.id)
            return (
              <button
                key={`b-${tile.id}`}
                type="button"
                className={clsx('token', used && 'token-used')}
                onClick={() => pick(tile)}
                disabled={used || state !== 'idle'}
              >
                {display(tile.text)}
              </button>
            )
          })}
        </div>

        {state !== 'idle' && (
          <button
            type="button"
            className="reset-line"
            onClick={() => {
              setPicked([])
              setState('idle')
            }}
            hidden={state === 'correct'}
          >
            <RotateCcw size={14} /> Собрать заново
          </button>
        )}
      </div>

      <Footer
        state={state}
        canCheck={isComplete}
        onCheck={check}
        onNext={onNext}
        correctAnswer={display(fullAnswer)}
        idleHint={!isComplete ? 'Сначала выбери все слова' : undefined}
      />
    </div>
  )
}
