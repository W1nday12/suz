import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { ArrowRight, Heart, RefreshCw, Sparkles, Star, X } from 'lucide-react'
import clsx from 'clsx'
import type { Exercise } from '../lib/exercises'
import { makeReinforcementExercise } from '../lib/exercises'
import type { AchievementDef } from '../lib/achievements'
import { useActiveProgress, useStore } from '../store/useStore'
import { useUiStore } from '../store/useUiStore'
import { errorHaptic, successHaptic, tapHaptic } from '../lib/haptics'
import { BlankView, BuildView, ChooseView, MatchView, TypeView } from './exercises'
import { ConfirmDialog } from './ConfirmDialog'
import { Mascot } from './Mascot'

export interface SessionSummary {
  correct: number
  wrong: number
  total: number
  durationSeconds: number
}

export interface SessionReward {
  xp: number
  gems: number
  accuracy: number
  stars?: number
  perfect?: boolean
  passed?: boolean
  unlocked?: AchievementDef[]
}

interface SessionViewProps {
  kind: 'lesson' | 'review'
  title: string
  subtitle?: string
  exercises: Exercise[]
  onExit: () => void
  onFinish: (summary: SessionSummary) => SessionReward
  onContinue: () => void
  onRepeat?: () => void
}

export function SessionView({
  kind,
  title,
  subtitle,
  exercises,
  onExit,
  onFinish,
  onContinue,
  onRepeat,
}: SessionViewProps) {
  const progress = useActiveProgress()
  const answerWord = useStore((state) => state.answerWord)
  const loseHeart = useStore((state) => state.loseHeart)
  const refillHearts = useStore((state) => state.refillHearts)
  const pushToast = useUiStore((state) => state.pushToast)
  const [index, setIndex] = useState(0)
  const [queue, setQueue] = useState<Exercise[]>(exercises)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [reward, setReward] = useState<SessionReward | null>(null)
  const [showExit, setShowExit] = useState(false)
  const [showHeartGate, setShowHeartGate] = useState(false)
  const startedAt = useRef(Date.now())
  const finishing = useRef(false)
  const reinforced = useRef(new Set<string>())

  const current = queue[index]
  const total = queue.length
  const hearts = progress.settings.heartsEnabled ? progress.hearts : Infinity
  const percent = total ? (index / total) * 100 : 0

  const scheduleReinforcement = (wordId: string) => {
    if (reinforced.current.size >= 4 || reinforced.current.has(wordId)) return
    reinforced.current.add(wordId)
    const extra = makeReinforcementExercise(wordId, index + 1)
    if (extra) setQueue((items) => (items.some((item) => item.id === extra.id) ? items : [...items, extra]))
  }

  useEffect(() => {
    if (!reward) return
    successHaptic()
    if (progress.settings.reduceMotion) return
    if (reward.passed === false) return
    const colors = ['#0E6B4F', '#F2B441', '#E4654C', '#7FD3AC', '#FBF6EA']
    confetti({ particleCount: 90, spread: 76, origin: { y: 0.68 }, colors, scalar: 0.9 })
    const timer = window.setTimeout(
      () => confetti({ particleCount: 55, spread: 110, origin: { y: 0.6 }, colors, scalar: 0.75 }),
      260,
    )
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reward])

  if (!total) {
    return (
      <div className="session-screen">
        <div className="session-empty">
          <p>Нет упражнений для этой сессии.</p>
          <button type="button" className="btn btn-primary" onClick={onExit}>
            Вернуться
          </button>
        </div>
      </div>
    )
  }

  const handleAnswer = (isCorrect: boolean, wordId?: string, relatedWordIds?: string[]) => {
    if (isCorrect) {
      setCorrect((value) => value + 1)
      successHaptic()
    } else {
      setWrong((value) => value + 1)
      errorHaptic()
    }
    const ids = new Set<string>()
    if (wordId) ids.add(wordId)
    relatedWordIds?.forEach((id) => ids.add(id))
    ids.forEach((id) => answerWord(id, isCorrect))
    if (!isCorrect) {
      if (progress.settings.heartsEnabled) loseHeart()
      const focus = wordId ?? relatedWordIds?.[0]
      if (focus) scheduleReinforcement(focus)
    }
  }

  const handleWordResult = (wordId: string, isCorrect: boolean) => {
    answerWord(wordId, isCorrect)
    if (!isCorrect) scheduleReinforcement(wordId)
  }

  const finish = () => {
    if (finishing.current) return
    finishing.current = true
    const summary: SessionSummary = {
      correct,
      wrong,
      total: correct + wrong,
      durationSeconds: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
    }
    setReward(onFinish(summary))
  }

  const next = () => {
    tapHaptic()
    if (index + 1 >= total) {
      finish()
      return
    }
    if (progress.settings.heartsEnabled && progress.hearts <= 0) {
      setShowHeartGate(true)
      return
    }
    setIndex((value) => value + 1)
  }

  const renderExercise = () => {
    const shared = {
      onAnswer: handleAnswer,
      onNext: next,
      onWordResult: handleWordResult,
    }
    switch (current.kind) {
      case 'choose':
        return <ChooseView key={current.id} exercise={current} {...shared} />
      case 'match':
        return <MatchView key={current.id} exercise={current} {...shared} />
      case 'build':
        return <BuildView key={current.id} exercise={current} {...shared} />
      case 'blank':
        return <BlankView key={current.id} exercise={current} {...shared} />
      case 'type':
        return <TypeView key={current.id} exercise={current} {...shared} />
      default:
        return null
    }
  }

  if (reward) {
    const passed = reward.passed !== false
    const stars = reward.stars ?? 0
    return (
      <div className={clsx('session-screen result-screen', passed ? 'passed' : 'failed')}>
        <div className="session-result">
          <Mascot mood={passed ? 'celebrate' : 'sad'} size={158} />
          <p className="eyebrow">{passed ? 'Дәрес тәмам' : 'Тагын бер тапкыр'}</p>
          <h1>{passed ? (kind === 'lesson' ? 'Урок пройден!' : 'Повторение готово!') : 'Почти получилось'}</h1>
          <p className="result-sub">
            {passed
              ? kind === 'lesson'
                ? title
                : `Повторено слов: ${correct + wrong}. Закрепление — тоже прогресс.`
              : 'Для контрольной точки нужно набрать 80%. Ошибки уже в банке — повтори их.'}
          </p>

          {kind === 'lesson' && (
            <div className="result-stars" aria-label={`${stars} из 3 звёзд`}>
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  size={34}
                  className={star <= stars ? 'star-on' : 'star-off'}
                  fill={star <= stars ? 'currentColor' : 'none'}
                />
              ))}
            </div>
          )}

          <div className="result-stats">
            <div>
              <span>Опыт</span>
              <strong>+{reward.xp} XP</strong>
            </div>
            <div>
              <span>Точность</span>
              <strong>{reward.accuracy}%</strong>
            </div>
            <div>
              <span>Кристаллы</span>
              <strong>+{reward.gems} 💎</strong>
            </div>
          </div>

          {!!reward.unlocked?.length && (
            <div className="result-achievements">
              <p>
                <Sparkles size={16} /> Новое достижение
              </p>
              {reward.unlocked.map((achievement) => (
                <div key={achievement.id} className="result-achievement">
                  <span>{achievement.title}</span>
                  <small>
                    {achievement.description} · +{achievement.gems} 💎
                  </small>
                </div>
              ))}
            </div>
          )}

          <div className="result-actions">
            {passed ? (
              <>
                <button type="button" className="btn btn-primary btn-block" onClick={onContinue}>
                  {kind === 'lesson' ? 'К урокам' : 'Готово'} <ArrowRight size={18} />
                </button>
                {onRepeat && (
                  <button type="button" className="btn btn-ghost btn-block" onClick={onRepeat}>
                    <RefreshCw size={16} /> Пройти ещё раз
                  </button>
                )}
              </>
            ) : (
              <>
                {onRepeat && (
                  <button type="button" className="btn btn-primary btn-block" onClick={onRepeat}>
                    <RefreshCw size={16} /> Пройти снова
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-block" onClick={onContinue}>
                  Вернуться к урокам
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="session-screen">
      <header className="session-top">
        <button type="button" className="icon-btn" onClick={() => setShowExit(true)} aria-label="Выйти из урока">
          <X size={22} />
        </button>
        <div className="session-progress" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${percent}%` }} />
        </div>
        <div className={clsx('session-hearts', hearts === 0 && 'empty')} title="Сердца">
          <Heart size={17} fill={hearts === Infinity ? 'none' : 'currentColor'} />
          <span>{hearts === Infinity ? '∞' : hearts}</span>
        </div>
      </header>

      <div className="session-caption">
        <span>{title}</span>
        <span className="session-count">
          {index + 1} / {total}
        </span>
      </div>
      {subtitle && <p className="session-subtitle">{subtitle}</p>}

      <div className="session-body">{renderExercise()}</div>

      <ConfirmDialog
        open={showExit}
        title="Выйти из урока?"
        body="Незавершённый урок не сохранится. Слова, которые ты уже повторил, останутся в статистике."
        confirmLabel="Выйти"
        cancelLabel="Остаться"
        danger
        onConfirm={onExit}
        onClose={() => setShowExit(false)}
      />

      {showHeartGate && (
        <div className="heart-gate-root">
          <div className="heart-gate">
            <span className="heart-gate-icon">
              <Heart size={30} />
            </span>
            <h2>Сердца закончились</h2>
            <p>
              Можно пополнить сердце за кристаллы или выйти и вернуться позже — сердце
              восстанавливается само.
            </p>
            <div className="heart-gate-actions">
              <button
                type="button"
                className="btn btn-primary btn-block"
                disabled={progress.gems < 50}
                onClick={() => {
                  if (refillHearts(50)) {
                    setShowHeartGate(false)
                    setIndex((value) => value + 1)
                  } else {
                    pushToast({ title: 'Не хватает кристаллов', body: 'Пройди урок или повторение, чтобы заработать.' })
                  }
                }}
              >
                Пополнить за 50 💎
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => {
                  setShowHeartGate(false)
                  onExit()
                }}
              >
                Выйти из урока
              </button>
            </div>
            <button
              type="button"
              className="reset-line"
              onClick={() => {
                setShowHeartGate(false)
                onExit()
              }}
            >
              Сердца восстанавливаются раз в 20 минут
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
