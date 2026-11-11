import { BookOpen, Library, RotateCcw, UserRound, Users } from 'lucide-react'
import clsx from 'clsx'
import { useUiStore, type Screen } from '../store/useUiStore'
import { useT, type UiKey } from '../lib/i18n'

const items: Array<{ screen: Screen; icon: typeof BookOpen; key: UiKey }> = [
  { screen: 'learn', icon: BookOpen, key: 'learn' },
  { screen: 'review', icon: RotateCcw, key: 'review' },
  { screen: 'league', icon: Users, key: 'friends' },
  { screen: 'dictionary', icon: Library, key: 'dictionary' },
  { screen: 'profile', icon: UserRound, key: 'me' },
]

export function BottomNav() {
  const screen = useUiStore((state) => state.screen)
  const setScreen = useUiStore((state) => state.setScreen)
  const t = useT()

  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {items.map(({ screen: target, icon: Icon, key }) => {
        const active = screen === target
        return (
          <button
            key={target}
            type="button"
            className={clsx('nav-item', active && 'active')}
            onClick={() => setScreen(target)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="nav-icon">
              <Icon size={21} strokeWidth={active ? 2.6 : 2} />
            </span>
            <span className="nav-label">{t(key)}</span>
          </button>
        )
      })}
    </nav>
  )
}
