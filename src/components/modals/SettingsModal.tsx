import { useState, type ReactNode } from 'react'
import {
  Download,
  Flame,
  Heart,
  Monitor,
  Moon,
  RotateCcw,
  Shield,
  Sun,
  Type,
  Wand2,
} from 'lucide-react'
import clsx from 'clsx'
import { useActiveProgress, useStore } from '../../store/useStore'
import { useUiStore } from '../../store/useUiStore'
import { Sheet } from '../Sheet'
import { ConfirmDialog } from '../ConfirmDialog'
import type { Settings } from '../../store/types'

const themes: Array<{ value: Settings['theme']; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Системная', icon: Monitor },
]

const scripts: Array<{ value: Settings['script']; label: string; example: string }> = [
  { value: 'cyrillic', label: 'Кириллица', example: 'Сүз' },
  { value: 'latin', label: 'Zamanälif', example: 'Süz' },
]

const immersions: Array<{ value: Settings['immersion']; label: string; hint: string }> = [
  { value: 'off', label: 'Выкл', hint: 'Интерфейс только по-русски' },
  { value: 'gradual', label: 'Постепенно', hint: 'Выученные слова заменяют подписи' },
  { value: 'full', label: 'Полностью', hint: 'Максимум татарского' },
]

const goals = [20, 30, 50]

function Toggle({
  checked,
  onChange,
  label,
  hint,
  icon,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  hint: string
  icon?: ReactNode
}) {
  return (
    <button
      type="button"
      className="settings-toggle"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="settings-toggle-icon">{icon}</span>
      <span className="settings-toggle-copy">
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <span className={clsx('switch', checked && 'on')} aria-hidden="true">
        <span />
      </span>
    </button>
  )
}

export function SettingsModal() {
  const open = useUiStore((state) => state.settingsOpen)
  const close = useUiStore((state) => state.closeSettings)
  const openInstall = useUiStore((state) => state.openInstall)
  const pushToast = useUiStore((state) => state.pushToast)
  const progress = useActiveProgress()
  const updateSettings = useStore((state) => state.updateSettings)
  const resetProgress = useStore((state) => state.resetProgress)
  const [resetOpen, setResetOpen] = useState(false)
  const settings = progress.settings

  return (
    <>
      <Sheet open={open} onClose={close} title="Настройки" full>
        <div className="settings-sheet">
          <section className="settings-block">
            <h3 className="settings-label">Тема</h3>
            <div className="segmented">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={clsx(settings.theme === value && 'active')}
                  onClick={() => updateSettings({ theme: value })}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </section>

          <section className="settings-block">
            <h3 className="settings-label">
              <Type size={16} /> Письменность
            </h3>
            <div className="segmented">
              {scripts.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={clsx(settings.script === item.value && 'active')}
                  onClick={() => updateSettings({ script: item.value })}
                >
                  {item.label}
                  <small>{item.example}</small>
                </button>
              ))}
            </div>
            <p className="settings-hint">
              Латиница Zamanälif хранится для каждого слова отдельно. В упражнениях можно отвечать
              любым алфавитом.
            </p>
          </section>

          <section className="settings-block">
            <h3 className="settings-label">
              <Wand2 size={16} /> Погружение
            </h3>
            <div className="settings-choices">
              {immersions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={clsx('settings-choice', settings.immersion === item.value && 'selected')}
                  onClick={() => updateSettings({ immersion: item.value })}
                >
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                  <span className="choice-radio" />
                </button>
              ))}
            </div>
          </section>

          <section className="settings-block">
            <h3 className="settings-label">Практика</h3>
            <Toggle
              checked={settings.heartsEnabled}
              onChange={(value) => updateSettings({ heartsEnabled: value })}
              label="Сердца"
              hint="Ошибки отнимают сердце; одно восстанавливается за 20 минут"
              icon={<Heart size={18} />}
            />
            <Toggle
              checked={settings.reduceMotion}
              onChange={(value) => updateSettings({ reduceMotion: value })}
              label="Меньше анимации"
              hint="Спокойные переходы и без конфетти"
              icon={<Flame size={18} />}
            />
            <div className="goal-setting">
              <div>
                <strong>Цель дня</strong>
                <small>Сколько XP набирать каждый день</small>
              </div>
              <div className="goal-buttons">
                {goals.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    className={clsx(settings.dailyGoal === goal && 'active')}
                    onClick={() => updateSettings({ dailyGoal: goal })}
                  >
                    {goal} XP
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="settings-block">
            <h3 className="settings-label">Приложение</h3>
            <button type="button" className="settings-link" onClick={openInstall}>
              <span className="settings-toggle-icon"><Download size={18} /></span>
              <span>
                <strong>Установить на телефон</strong>
                <small>Android APK / iPhone PWA</small>
              </span>
            </button>
            <div className="settings-link static">
              <span className="settings-toggle-icon"><Shield size={18} /></span>
              <span>
                <strong>Данные только у тебя</strong>
                <small>Прогресс хранится в IndexedDB, без аккаунта</small>
              </span>
            </div>
          </section>

          <section className="settings-block">
            <h3 className="settings-label">Профиль</h3>
            <button
              type="button"
              className="settings-link danger"
              onClick={() => setResetOpen(true)}
            >
              <span className="settings-toggle-icon"><RotateCcw size={18} /></span>
              <span>
                <strong>Сбросить прогресс</strong>
                <small>Удалить XP, серию и историю этого профиля</small>
              </span>
            </button>
            <button
              type="button"
              className="settings-link"
              onClick={() => {
                close()
                pushToast({
                  title: 'Совет',
                  body: 'Ссылку на установку можно открыть с телефона: w1nday12.github.io/suz',
                })
              }}
            >
              <span className="settings-toggle-icon"><Download size={18} /></span>
              <span>
                <strong>Ссылка для установки</strong>
                <small>w1nday12.github.io/suz</small>
              </span>
            </button>
          </section>

          <section className="settings-about">
            <p>
              <strong>Сүз</strong> · версия 0.1.0
            </p>
            <p className="muted">
              Учебный курс татарского. Содержание проверяется носителем; спорные слова отмечены
              знаком ≈. Аудио появится позже — архитектура к нему готова.
            </p>
            <a href="https://github.com/W1nday12/suz" target="_blank" rel="noreferrer">
              Открыть репозиторий на GitHub
            </a>
          </section>
        </div>
      </Sheet>

      <ConfirmDialog
        open={resetOpen}
        title="Сбросить весь прогресс?"
        body="Это удалит XP, серию, достижения и историю уроков. Слова и достижения придётся открывать заново."
        confirmLabel="Сбросить"
        danger
        onConfirm={() => {
          resetProgress()
          pushToast({ title: 'Прогресс сброшен', body: 'Можно начать заново.' })
        }}
        onClose={() => setResetOpen(false)}
      />
    </>
  )
}
