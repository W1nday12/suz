import { useMemo, useState } from 'react'
import { getLessonWords, getUnit } from '../data/course'
import { generateLesson, makeReinforcementExercise, type Exercise } from '../lib/exercises'
import { useActiveProgress, useStore } from '../store/useStore'
import { useUiStore } from '../store/useUiStore'
import { SessionView } from '../components/SessionView'

const MAX_MISTAKE_WORDS = 3

export function Lesson() {
  const lesson = useUiStore((state) => state.lesson)
  const closeLesson = useUiStore((state) => state.closeLesson)
  const setScreen = useUiStore((state) => state.setScreen)
  const finishLesson = useStore((state) => state.finishLesson)
  const progress = useActiveProgress()
  const [seed, setSeed] = useState(0)

  const unit = lesson ? getUnit(lesson.unitId) : null
  const exercises = useMemo(() => {
    if (!lesson) return []
    const base = generateLesson(lesson.unitId, lesson.lesson, seed + 1)
    const currentWordIds = new Set(
      getLessonWords(lesson.unitId, lesson.lesson).map((word) => word.id),
    )
    const mistakeIds = Object.entries(progress.mistakes)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .filter((id) => !currentWordIds.has(id))
      .slice(0, MAX_MISTAKE_WORDS)

    const repeats = mistakeIds
      .map((id, index) => makeReinforcementExercise(id, seed + index + 1))
      .filter((exercise): exercise is Exercise => !!exercise)

    return [...base, ...repeats]
    // Ошибки фиксируем на старте урока, чтобы список не менялся во время занятия.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, seed])

  if (!lesson || !unit) return null

  const isCheckpoint = lesson.lesson === 0
  const title = isCheckpoint
    ? `Контрольная · ${unit.titleRu}`
    : `Юнит ${unit.id} · урок ${lesson.lesson}`

  return (
    <SessionView
      key={`${lesson.unitId}-${lesson.lesson}-${seed}`}
      kind="lesson"
      title={title}
      subtitle={unit.grammar[0] ? `Грамматика: ${unit.grammar[0].title}` : unit.subtitle}
      exercises={exercises}
      onExit={closeLesson}
      onRepeat={() => setSeed((value) => value + 1)}
      onFinish={(summary) =>
        finishLesson({
          unitId: lesson.unitId,
          lesson: lesson.lesson,
          correct: summary.correct,
          wrong: summary.wrong,
          total: summary.total,
          durationSeconds: summary.durationSeconds,
        })
      }
      onContinue={() => {
        closeLesson()
        setScreen('learn')
      }}
    />
  )
}
