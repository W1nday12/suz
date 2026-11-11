import { Flame, Gem, Heart, Settings } from 'lucide-react'
import { useActiveProgress, useStore } from '../store/useStore'
import { useUiStore } from '../store/useUiStore'
import { TulipMark } from './Mascot'

export function Header() {
  const progress = useActiveProgress()
  const profile = useStore((state) =>
    state.profiles.find((item) => item.id === state.activeProfileId),
  )
  const setScreen = useUiStore((state) => state.setScreen)
  const openSettings = useUiStore((state) => state.openSettings)

  return (
    <header className="topbar">
      <button type="button" className="brand" onClick={() => setScreen('learn')} aria-label="Сүз — на главную">
        <span className="brand-mark">
          <TulipMark size={28} />
        </span>
        <span className="brand-copy">
          <span className="brand-name">Сүз</span>
          <span className="brand-sub">{profile?.name ?? 'татарча өйрән'}</span>
        </span>
      </button>

      <div className="top-stats" aria-label="Прогресс">
        <div className="stat-pill" title="Стрик">
          <Flame size={16} className="stat-flame" />
          <span>{progress.streak}</span>
        </div>
        <div className={progress.hearts === 0 ? 'stat-pill stat-danger' : 'stat-pill'} title="Сердца">
          <Heart size={16} className="stat-heart" />
          <span>{progress.settings.heartsEnabled ? progress.hearts : '∞'}</span>
        </div>
        <div className="stat-pill" title="Кристаллы">
          <Gem size={16} className="stat-gem" />
          <span>{progress.gems}</span>
        </div>
      </div>

      <button type="button" className="icon-btn topbar-settings" onClick={openSettings} aria-label="Настройки">
        <Settings size={20} />
      </button>
    </header>
  )
}
