import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  BookOpen,
  Check,
  ChevronRight,
  Flame,
  Footprints,
  Gem,
  GraduationCap,
  Heart,
  Library,
  Medal,
  Repeat,
  RotateCcw,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
  Crown,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'
import { courseStats } from '../data/course'
import { useActiveProgress, useStore } from '../store/useStore'
import { useUiStore } from '../store/useUiStore'
import { achievements } from '../lib/achievements'
import { levelInfo, totalAccuracy } from '../lib/progress'
import { lastDays } from '../lib/date'
import { HEART_MAX } from '../lib/srs'
import { ProgressRing } from '../components/ProgressRing'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Mascot } from '../components/Mascot'

const achievementIcons: Record<string, LucideIcon> = {
  footprints: Footprints,
  sparkles: Sparkles,
  book: BookOpen,
  library: Library,
  crown: Crown,
  flame: Flame,
  zap: Zap,
  trophy: Trophy,
  target: Target,
  medal: Medal,
  repeat: Repeat,
  star: Star,
  graduation: GraduationCap,
  users: Users,
}

export function ProfileScreen() {
  const progress = useActiveProgress()
  const profile = useStore((state) => state.profiles.find((item) => item.id === state.activeProfileId))
  const refillHearts = useStore((state) => state.refillHearts)
  const resetProgress = useStore((state) => state.resetProgress)
  const openSettings = useUiStore((state) => state.openSettings)
  const openInstall = useUiStore((state) => state.openInstall)
  const openProfile = useUiStore((state) => state.openProfile)
  const setScreen = useUiStore((state) => state.setScreen)
  const pushToast = useUiStore((state) => state.pushToast)
  const [resetOpen, setResetOpen] = useState(false)

  const level = levelInfo(progress.xp)
  const accuracy = totalAccuracy(progress.weekly.correct, progress.weekly.total)
  const unlocked = new Set(progress.achievements)
  const days = useMemo(() => lastDays(28), [])
  const maxXp = Math.max(1, ...days.map((day) => progress.history[day]?.xp ?? 0))
  const activeDays = days.filter((day) => (progress.history[day]?.xp ?? 0) > 0).length
  const goalPercent = Math.min(1, progress.dailyXp / progress.settings.dailyGoal)

  if (!profile) return null

  return (
    <div className="page profile-page">
      <motion.section className="profile-hero card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="profile-avatar-wrap">
          <span className="profile-avatar">{profile.avatar}</span>
          <span className="profile-level">Ур. {level.level}</span>
        </div>
        <div className="profile-copy">
          <p className="eyebrow">Мин</p>
          <h1>{profile.name}</h1>
          <p className="muted">
            С нами с {new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(profile.createdAt)}
            {' · '}
            {progress.settings.script === 'latin' ? 'Zamanälif' : 'кириллица'}
          </p>
          <div className="profile-levelbar">
            <div className="profile-levelbar-copy">
              <span>{level.current} / {level.need} XP до уровня {level.level + 1}</span>
              <span>{progress.xp} XP всего</span>
            </div>
            <div className="progress-line">
              <span style={{ width: `${level.percent}%` }} />
            </div>
          </div>
        </div>
        <div className="profile-hero-actions">
          <button type="button" className="icon-btn" onClick={openSettings} aria-label="Настройки">
            <Settings size={20} />
          </button>
          <button type="button" className="btn btn-ghost small" onClick={openProfile}>
            Профили
          </button>
        </div>
      </motion.section>

      <section className="profile-stats">
        <div className="card profile-stat">
          <span className="quick-icon streak"><Flame size={18} /></span>
          <strong>{progress.streak}</strong>
          <span>дней подряд</span>
          <small>рекорд {progress.bestStreak}</small>
        </div>
        <div className="card profile-stat">
          <span className="quick-icon words"><Star size={18} /></span>
          <strong>{progress.seenWords.length}</strong>
          <span>слов изучено</span>
          <small>из {courseStats.words}</small>
        </div>
        <div className="card profile-stat">
          <span className="quick-icon accuracy"><Target size={18} /></span>
          <strong>{accuracy}%</strong>
          <span>точность недели</span>
          <small>{progress.weekly.correct} верных</small>
        </div>
        <div className="card profile-stat">
          <span className="quick-icon gems"><Gem size={18} /></span>
          <strong>{progress.gems}</strong>
          <span>кристаллов</span>
          <small>{progress.freezes} заморозки</small>
        </div>
      </section>

      <section className="profile-two-col">
        <article className="card activity-card">
          <header className="section-head">
            <div>
              <p className="eyebrow">Активлык</p>
              <h2>Последние 4 недели</h2>
            </div>
            <span className="badge soft">{activeDays} / 28 дней</span>
          </header>
          <div className="heatmap" aria-label="Активность за последние 28 дней">
            {days.map((day) => {
              const xp = progress.history[day]?.xp ?? 0
              const level = xp === 0 ? 0 : xp < 10 ? 1 : xp < 30 ? 2 : xp < 60 ? 3 : 4
              return (
                <span
                  key={day}
                  className={clsx('heat-cell', `heat-${level}`)}
                  title={`${new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(day))}: ${xp} XP`}
                />
              )
            })}
          </div>
          <div className="heatmap-legend">
            <span>меньше</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <i key={level} className={clsx('heat-cell', `heat-${level}`)} />
            ))}
            <span>больше</span>
          </div>
          <div className="week-summary">
            <div>
              <span>Неделя</span>
              <strong>{progress.weekly.xp} XP</strong>
            </div>
            <div>
              <span>Уроков</span>
              <strong>{progress.weekly.lessons}</strong>
            </div>
            <div>
              <span>Повторений</span>
              <strong>{progress.weekly.reviews}</strong>
            </div>
          </div>
        </article>

        <article className="card goal-card">
          <header className="section-head">
            <div>
              <p className="eyebrow">Максат</p>
              <h2>Цель дня</h2>
            </div>
            <button type="button" className="icon-btn subtle" onClick={openSettings} aria-label="Изменить цель">
              <Settings size={16} />
            </button>
          </header>
          <div className="goal-visual">
            <ProgressRing value={goalPercent} size={128} stroke={12}>
              <strong>{progress.dailyXp}</strong>
              <span>из {progress.settings.dailyGoal} XP</span>
            </ProgressRing>
            <Mascot mood={goalPercent >= 1 ? 'celebrate' : 'happy'} size={112} />
          </div>
          <p className="muted">
            {goalPercent >= 1
              ? 'Цель выполнена. Можно остановиться или продолжить — опыт всё равно капает.'
              : `Осталось ${Math.max(0, progress.settings.dailyGoal - progress.dailyXp)} XP. Это примерно ${Math.max(1, Math.ceil((progress.settings.dailyGoal - progress.dailyXp) / 10))} коротких подхода.`}
          </p>
          <button type="button" className="btn btn-soft btn-block" onClick={() => setScreen('learn')}>
            <Zap size={16} /> Продолжить учиться
          </button>
        </article>
      </section>

      <section className="card hearts-card">
        <div className="hearts-copy">
          <span className="heart-big"><Heart size={22} /></span>
          <div>
            <h2>Сердца</h2>
            <p className="muted">
              {progress.settings.heartsEnabled
                ? 'Ошибки расходуют сердца. Одно восстанавливается каждые 20 минут.'
                : 'Сердца отключены в настройках — учись без ограничений.'}
            </p>
          </div>
        </div>
        {progress.settings.heartsEnabled && (
          <div className="hearts-right">
            <div className="hearts-row" aria-label={`${progress.hearts} из ${HEART_MAX} сердец`}>
              {Array.from({ length: HEART_MAX }).map((_, index) => (
                <Heart
                  key={index}
                  size={20}
                  className={index < progress.hearts ? 'heart-on' : 'heart-off'}
                  fill={index < progress.hearts ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            {progress.hearts < HEART_MAX && (
              <button
                type="button"
                className="btn btn-soft small"
                disabled={progress.gems < 50}
                onClick={() => {
                  if (!refillHearts(50)) {
                    pushToast({ title: 'Не хватает кристаллов', body: 'Нужно 50 💎.' })
                  }
                }}
              >
                Пополнить за 50 💎
              </button>
            )}
          </div>
        )}
      </section>

      <section className="card achievements-card">
        <header className="section-head">
          <div>
            <p className="eyebrow">Казанышлар</p>
            <h2>Достижения</h2>
          </div>
          <span className="badge soft">
            {unlocked.size} / {achievements.length}
          </span>
        </header>
        <div className="achievement-grid">
          {achievements.map((achievement) => {
            const Icon = achievementIcons[achievement.icon] ?? Trophy
            const isUnlocked = unlocked.has(achievement.id)
            return (
              <div
                key={achievement.id}
                className={clsx('achievement', `tier-${achievement.tier}`, isUnlocked && 'unlocked')}
                title={achievement.description}
              >
                <span className="achievement-icon">
                  {isUnlocked ? <Icon size={22} /> : <Shield size={20} />}
                </span>
                <div>
                  <strong>{isUnlocked ? achievement.title : 'Закрыто'}</strong>
                  <small>{achievement.description}</small>
                </div>
                <span className="achievement-gems">+{achievement.gems} 💎</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card profile-actions-card">
        <div className="action-list">
          <button type="button" className="action-row" onClick={() => setScreen('dictionary')}>
            <span className="action-icon"><Library size={18} /></span>
            <span><strong>Словарь</strong><small>300 слов и примеры</small></span>
            <ChevronRight size={17} />
          </button>
          <button type="button" className="action-row" onClick={openInstall}>
            <span className="action-icon"><Smartphone size={18} /></span>
            <span><strong>Установить приложение</strong><small>Android APK или iPhone PWA</small></span>
            <ChevronRight size={17} />
          </button>
          <button type="button" className="action-row" onClick={openProfile}>
            <span className="action-icon"><Users size={18} /></span>
            <span><strong>Профили</strong><small>Два человека на одном устройстве</small></span>
            <ChevronRight size={17} />
          </button>
          <button type="button" className="action-row" onClick={openSettings}>
            <span className="action-icon"><Settings size={18} /></span>
            <span><strong>Настройки</strong><small>Тема, письменность, сердца</small></span>
            <ChevronRight size={17} />
          </button>
          <button type="button" className="action-row danger" onClick={() => setResetOpen(true)}>
            <span className="action-icon"><RotateCcw size={18} /></span>
            <span><strong>Сбросить прогресс</strong><small>Начать этот профиль заново</small></span>
            <ChevronRight size={17} />
          </button>
        </div>
        <p className="fine-print">
          <Check size={14} /> Прогресс хранится только на этом устройстве в IndexedDB. Резервную
          копию можно сделать через экспорт в настройках.
        </p>
      </section>

      <ConfirmDialog
        open={resetOpen}
        title="Сбросить прогресс?"
        body="XP, серия, слова, достижения и результаты уроков этого профиля будут удалены. Отменить нельзя."
        confirmLabel="Сбросить"
        danger
        onConfirm={() => {
          resetProgress()
          pushToast({ title: 'Профиль начат заново', body: 'Первый урок снова открыт.' })
        }}
        onClose={() => setResetOpen(false)}
      />
    </div>
  )
}
