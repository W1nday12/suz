import { useEffect, useRef, useState, type JSX } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useActiveProgress, useStore } from './store/useStore'
import { useUiStore, type Screen } from './store/useUiStore'
import { clearDuelHash, parseDuelFromLocation } from './lib/duel'
import { initInstallPrompt } from './lib/install'
import { Header } from './components/Header'
import { BottomNav } from './components/BottomNav'
import { ToastStack } from './components/ToastStack'
import { Mascot } from './components/Mascot'
import { SettingsModal } from './components/modals/SettingsModal'
import { InstallModal } from './components/modals/InstallModal'
import { ProfileModal } from './components/modals/ProfileModal'
import { Onboarding } from './screens/Onboarding'
import { LearnScreen } from './screens/Learn'
import { ReviewScreen } from './screens/Review'
import { LeagueScreen } from './screens/League'
import { DictionaryScreen } from './screens/Dictionary'
import { ProfileScreen } from './screens/Profile'
import { Lesson } from './screens/Lesson'
import type { Settings } from './store/types'

function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated())
  useEffect(() => {
    const finish = useStore.persist.onFinishHydration(() => setHydrated(true))
    if (useStore.persist.hasHydrated()) setHydrated(true)
    return finish
  }, [])
  return hydrated
}

function useTheme(settings: Settings): void {
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = settings.theme === 'system' ? (media.matches ? 'dark' : 'light') : settings.theme
      root.dataset.theme = resolved
      root.dataset.reduceMotion = String(settings.reduceMotion)
      const meta = document.querySelector('meta[name="theme-color"]')
      meta?.setAttribute('content', resolved === 'dark' ? '#0B1F19' : '#0E6B4F')
    }
    apply()
    if (settings.theme !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [settings.theme, settings.reduceMotion])
}

function useAppTick(): void {
  useEffect(() => {
    useStore.getState().tick()
    const timer = window.setInterval(() => useStore.getState().tick(), 60_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') useStore.getState().tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}

function useDuelListener(): void {
  const activeProfileId = useStore((state) => state.activeProfileId)
  const importOpponent = useStore((state) => state.importOpponent)
  const pushToast = useUiStore((state) => state.pushToast)
  const setScreen = useUiStore((state) => state.setScreen)
  const handled = useRef(false)

  useEffect(() => {
    if (!activeProfileId || handled.current) return
    const payload = parseDuelFromLocation()
    if (!payload) return
    handled.current = true
    clearDuelHash()

    const self = useStore.getState().profiles.find((profile) => profile.id === activeProfileId)
    if (self && payload.id === self.id) {
      pushToast({
        title: 'Это твоя ссылка',
        body: 'Отправь её другу — не открывай сам.',
      })
      return
    }

    importOpponent({
      id: payload.id,
      name: payload.name,
      avatar: payload.avatar,
      weekStart: payload.weekStart,
      xp: payload.xp,
      streak: payload.streak,
      lessons: payload.lessons,
      accuracy: payload.accuracy,
    })
    setScreen('league')
    pushToast({
      title: `Дуэль: ${payload.name}`,
      body: `${payload.xp} XP за неделю добавлено в лигу.`,
    })
  }, [activeProfileId, importOpponent, pushToast, setScreen])
}

function Splash() {
  return (
    <div className="splash">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="splash-inner"
      >
        <Mascot mood="happy" size={160} />
        <div className="splash-copy">
          <span className="splash-name">Сүз</span>
          <span className="splash-tag">Сүздән җөмләгә</span>
        </div>
        <div className="splash-dots" aria-label="Загрузка">
          <span />
          <span />
          <span />
        </div>
      </motion.div>
    </div>
  )
}

const screenComponents: Record<Screen, () => JSX.Element | null> = {
  learn: LearnScreen,
  review: ReviewScreen,
  league: LeagueScreen,
  dictionary: DictionaryScreen,
  profile: ProfileScreen,
}

export default function App() {
  const hydrated = useHydrated()
  const activeProfileId = useStore((state) => state.activeProfileId)
  const settings = useActiveProgress().settings
  const screen = useUiStore((state) => state.screen)
  const lesson = useUiStore((state) => state.lesson)

  useTheme(settings)
  useAppTick()
  useDuelListener()

  useEffect(() => {
    initInstallPrompt()
  }, [])

  if (!hydrated) return <Splash />
  if (!activeProfileId) return <Onboarding />

  const ScreenView = screenComponents[screen]

  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="screen-wrap"
          >
            <ScreenView />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <ToastStack />
      <SettingsModal />
      <InstallModal />
      <ProfileModal />
      <AnimatePresence>{lesson && <Lesson />}</AnimatePresence>
    </div>
  )
}
