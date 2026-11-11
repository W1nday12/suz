import type { CSSProperties } from 'react'
import { Check, ChevronRight, Flame, Gem, Lock, Play, RotateCcw, Star, Target, Trophy, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import clsx from 'clsx'
import { units, courseStats, getUnit } from '../data/course'
import { useActiveProgress } from '../store/useStore'
import { useUiStore } from '../store/useUiStore'
import { useT } from '../lib/i18n'
import { toLatin } from '../lib/translit'
import { levelInfo, totalAccuracy } from '../lib/progress'
import { nextLesson, isLessonDone, isLessonUnlocked, isUnitUnlocked, unitDoneCount, unitProgress } from '../lib/courseProgress'
import { Mascot } from '../components/Mascot'
import { ProgressRing } from '../components/ProgressRing'

export function LearnScreen() {
  const progress = useActiveProgress()
  const openLesson = useUiStore((state) => state.openLesson)
  const setScreen = useUiStore((state) => state.setScreen)
  const t = useT()
  const next = nextLesson(progress)
  const script = progress.settings.script
  const goal = progress.settings.dailyGoal
  const goalValue = Math.min(1, progress.dailyXp / goal)
  const level = levelInfo(progress.xp)
  const accuracy = totalAccuracy(progress.weekly.correct, progress.weekly.total)

  const greeting = 'Исәнме!'
  const todayLesson = next
    ? next.lesson === 0
      ? `Юнит ${next.unitId}: контрольная`
      : `Юнит ${next.unitId} · Урок ${next.lesson}`
    : 'Все уроки пройдены — пора повторять'

  return (
    <div className="page learn-page">
      <motion.section
        className="hero card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="hero-copy">
          <div className="hero-topline">
            <span className="hero-greeting">{greeting}</span>
            <span className="hero-level">Уровень {level.level}</span>
          </div>
          <h1>
            Сүздән — <span className="accent">җөмләгә</span>
          </h1>
          <p className="hero-sub">
            {next
              ? `${todayLesson}. ${progress.streak > 0 ? `Стрик ${progress.streak} көн.` : 'Начни сегодня.'}`
              : 'Повтори слова, чтобы они остались в памяти.'}
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (next) openLesson(next.unitId, next.lesson)
                else setScreen('review')
              }}
            >
              <Play size={18} fill="currentColor" />
              {next ? t('continue') : t('repeat')}
              <ChevronRight size={18} />
            </button>
            {next && (
              <span className="hero-hint">
                {next.lesson === 0 ? 'Проверь весь юнит' : `${getUnit(next.unitId).words.filter((word) => word.lesson === next.lesson).length} сүз`}
              </span>
            )}
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-mascot">
            <Mascot mood={progress.streak > 0 ? 'happy' : 'idle'} size={150} />
          </div>
          <ProgressRing value={goalValue} size={86} stroke={9} className="goal-ring">
            <strong>{progress.dailyXp}</strong>
            <span>из {goal} XP</span>
          </ProgressRing>
        </div>
      </motion.section>

      <section className="quick-stats">
        <button type="button" className="quick-stat card" onClick={() => setScreen('profile')}>
          <span className="quick-icon streak">
            <Flame size={18} />
          </span>
          <span>
            <strong>{progress.streak}</strong>
            <small>көн рәттән</small>
          </span>
        </button>
        <button type="button" className="quick-stat card" onClick={() => setScreen('dictionary')}>
          <span className="quick-icon words">
            <Star size={18} />
          </span>
          <span>
            <strong>{progress.seenWords.length}</strong>
            <small>из {courseStats.words} сүз</small>
          </span>
        </button>
        <button type="button" className="quick-stat card" onClick={() => setScreen('profile')}>
          <span className="quick-icon accuracy">
            <Target size={18} />
          </span>
          <span>
            <strong>{accuracy}%</strong>
            <small>төгәллек</small>
          </span>
        </button>
        <button type="button" className="quick-stat card" onClick={() => setScreen('league')}>
          <span className="quick-icon gems">
            <Gem size={18} />
          </span>
          <span>
            <strong>{progress.gems}</strong>
            <small>кристалл</small>
          </span>
        </button>
      </section>

      <section className="card quests-card">
        <header className="section-head">
          <div>
            <p className="eyebrow">Бүгенге план</p>
            <h2>Задания дня</h2>
          </div>
          <span className="section-note">до полуночи</span>
        </header>
        <div className="quest-list">
          {progress.quests.items.map((quest) => {
            const Icon =
              quest.type === 'xp'
                ? Zap
                : quest.type === 'lessons'
                  ? Play
                  : quest.type === 'review'
                    ? RotateCcw
                    : Target
            return (
              <div key={quest.id} className={clsx('quest', quest.claimed && 'done')}>
                <span className="quest-icon">
                  {quest.claimed ? <Check size={16} /> : <Icon size={16} />}
                </span>
                <div className="quest-copy">
                  <div className="quest-title">
                    <strong>{quest.title}</strong>
                    <span>
                      {quest.progress}/{quest.target}
                    </span>
                  </div>
                  <div className="quest-bar">
                    <span style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }} />
                  </div>
                </div>
                <span className="quest-reward">+{quest.reward} 💎</span>
              </div>
            )
          })}
        </div>
      </section>

      <div className="path-heading">
        <p className="eyebrow">Юл</p>
        <h2>12 юнит</h2>
        <p className="muted">Иди по пути, открывай новые слова и контрольные точки.</p>
      </div>

      <div className="units">
        {units.map((unit) => {
          const unlocked = isUnitUnlocked(progress, unit.id)
          const done = unitDoneCount(progress, unit.id)
          const percent = unitProgress(progress, unit.id)
          const isCurrent = next?.unitId === unit.id
          return (
            <section
              key={unit.id}
              className={clsx('unit', !unlocked && 'unit-locked', isCurrent && 'unit-current')}
              style={{ '--unit-color': unit.color } as CSSProperties}
            >
              <header className="unit-head">
                <span className="unit-number">
                  {unlocked ? String(unit.id).padStart(2, '0') : <Lock size={16} />}
                </span>
                <div className="unit-title">
                  <h3>{script === 'latin' ? toLatin(unit.titleTt) : unit.titleTt}</h3>
                  <p>{unit.titleRu}</p>
                </div>
                <div className="unit-progress">
                  <span>
                    {done}/5
                  </span>
                  <div className="unit-progress-bar">
                    <span style={{ width: `${percent * 100}%` }} />
                  </div>
                </div>
              </header>

              <div className="path">
                {[1, 2, 3, 4, 0].map((lesson, index) => {
                  const lessonDone = isLessonDone(progress, unit.id, lesson)
                  const lessonUnlocked = isLessonUnlocked(progress, unit.id, lesson)
                  const isCheckpoint = lesson === 0
                  const Icon = lessonDone
                    ? isCheckpoint
                      ? Trophy
                      : Check
                    : lessonUnlocked
                      ? isCheckpoint
                        ? Trophy
                        : Play
                      : Lock
                  const side = index % 2 === 0 ? 'left' : 'right'
                  const result = progress.completed[`u${unit.id}-l${lesson}`]
                  return (
                    <div key={lesson} className={clsx('node-row', side, lessonDone && 'done', !lessonUnlocked && 'locked')}>
                      <button
                        type="button"
                        className={clsx('node', lessonDone && 'node-done', !lessonUnlocked && 'node-locked', isCurrent && !lessonDone && 'node-current')}
                        onClick={() => lessonUnlocked && openLesson(unit.id, lesson)}
                        disabled={!lessonUnlocked}
                        aria-label={isCheckpoint ? `Контрольная юнита ${unit.id}` : `Урок ${lesson} юнита ${unit.id}`}
                      >
                        <Icon size={22} strokeWidth={2.4} />
                      </button>
                      <div className="node-label">
                        <strong>
                          {isCheckpoint ? 'Контрольная' : `Урок ${lesson}`}
                        </strong>
                        <span>
                          {isCheckpoint
                            ? 'Весь юнит'
                            : lessonDone
                              ? 'Пройден'
                              : lessonUnlocked
                                ? 'Можно начинать'
                                : 'Закрыт'}
                        </span>
                        {result && (
                          <span className="node-stars" aria-label={`${result.stars} из 3 звёзд`}>
                            {[1, 2, 3].map((star) => (
                              <Star
                                key={star}
                                size={11}
                                fill={star <= result.stars ? 'currentColor' : 'none'}
                                className={star <= result.stars ? 'star-on' : 'star-off'}
                              />
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <div className="path-footer">
        <Mascot mood="happy" size={110} />
        <p>
          <strong>Сүздән җөмләгә.</strong> Курс собран из 300 слов и 96 фраз. Дальше — больше
          диалогов, повторений и твоих собственных предложений.
        </p>
      </div>
    </div>
  )
}
