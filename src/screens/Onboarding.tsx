import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Check } from 'lucide-react'
import clsx from 'clsx'
import { Mascot, TulipMark } from '../components/Mascot'
import { useStore } from '../store/useStore'
import type { Settings } from '../store/types'

const avatars = ['🦊', '🐱', '🐻', '🐯', '🐰', '🦉', '🌷', '⭐']

const goals = [
  { value: 20, title: '10 минут в день', sub: 'Спокойный старт' },
  { value: 30, title: '15 минут в день', sub: 'Хороший ритм' },
  { value: 50, title: '25 минут в день', sub: 'Серьёзный подход' },
]

export function Onboarding() {
  const createProfile = useStore((state) => state.createProfile)
  const updateSettings = useStore((state) => state.updateSettings)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(avatars[0])
  const [goal, setGoal] = useState(20)
  const [immersion, setImmersion] = useState<Settings['immersion']>('gradual')

  const next = () => setStep((value) => Math.min(4, value + 1))
  const finish = () => {
    createProfile(name.trim() || 'Дус', avatar, goal)
    updateSettings({ immersion })
  }

  return (
    <div className="onboarding">
      <div className="onboarding-art">
        <div className="onboarding-badge">
          <TulipMark size={20} />
          <span>Сүз</span>
        </div>
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          className="onboarding-mascot"
        >
          <Mascot mood={step === 4 ? 'celebrate' : step === 2 ? 'think' : 'happy'} size={190} />
        </motion.div>
        <div className="onboarding-dots" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((dot) => (
            <span key={dot} className={clsx('dot', dot <= step && 'active')} />
          ))}
        </div>
      </div>

      <div className="onboarding-panel">
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="eyebrow">Татар телен уйнап өйрән</p>
            <h1>
              Сүздән — <span className="accent">җөмләгә</span>
            </h1>
            <p className="lead">
              Короткие уроки, живые фразы и 300 слов. Учись составлять простые предложения
              по-татарски — по 10 минут в день.
            </p>
            <div className="feature-row">
              <span className="mini-chip">12 юнитов</span>
              <span className="mini-chip">300 слов</span>
              <span className="mini-chip">без звука — пока</span>
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={next}>
              Начать <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="eyebrow">Знакомство</p>
            <h1>Как тебя зовут?</h1>
            <p className="lead">Имя нужно для профиля и таблицы друзей. Можно любое.</p>
            <input
              className="text-input big"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Например, Азат"
              maxLength={20}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === 'Enter') next()
              }}
            />
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={next}
              disabled={!name.trim()}
            >
              Дальше <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="eyebrow">Аватар</p>
            <h1>Выбери спутника</h1>
            <p className="lead">Он будет появляться в профиле и лиге друзей.</p>
            <div className="avatar-grid">
              {avatars.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={clsx('avatar-option', avatar === item && 'selected')}
                  onClick={() => setAvatar(item)}
                  aria-label={`Аватар ${item}`}
                >
                  {item}
                  {avatar === item && (
                    <span className="avatar-check">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={next}>
              Дальше <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="eyebrow">Цель</p>
            <h1>Сколько в день?</h1>
            <p className="lead">Цель можно поменять в настройках в любой момент.</p>
            <div className="choice-list">
              {goals.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={clsx('choice', goal === item.value && 'selected')}
                  onClick={() => setGoal(item.value)}
                >
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.sub}</small>
                  </span>
                  <span className="choice-radio" />
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={next}>
              Дальше <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="eyebrow">Погружение</p>
            <h1>Как учить слова?</h1>
            <p className="lead">
              Интерфейс будет постепенно переходить на татарский по мере того, как ты узнаёшь
              слова.
            </p>
            <div className="choice-list">
              {[
                {
                  value: 'off' as const,
                  title: 'Пока по-русски',
                  sub: 'Все подписи на русском',
                },
                {
                  value: 'gradual' as const,
                  title: 'Постепенно',
                  sub: 'Выученные слова заменяют русские подписи',
                },
                {
                  value: 'full' as const,
                  title: 'Сразу по-татарски',
                  sub: 'Максимум татарского с первого дня',
                },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={clsx('choice', immersion === item.value && 'selected')}
                  onClick={() => setImmersion(item.value)}
                >
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.sub}</small>
                  </span>
                  <span className="choice-radio" />
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={finish}>
              Начать учиться <ArrowRight size={18} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
