import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import QRCode from 'qrcode'
import {
  ArrowRight,
  Check,
  Copy,
  Crown,
  Info,
  Link2,
  Medal,
  QrCode,
  Share2,
  Trash2,
  Trophy,
  UserPlus,
} from 'lucide-react'
import clsx from 'clsx'
import { useActiveProgress, useStore } from '../store/useStore'
import { useUiStore } from '../store/useUiStore'
import { buildDuelPayload, decodeDuel, duelLink, type DuelPayload } from '../lib/duel'
import { humanDay } from '../lib/date'
import { totalAccuracy } from '../lib/progress'
import { Mascot } from '../components/Mascot'
import { Sheet } from '../components/Sheet'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function LeagueScreen() {
  const progress = useActiveProgress()
  const profile = useStore((state) => state.profiles.find((item) => item.id === state.activeProfileId))
  const importOpponent = useStore((state) => state.importOpponent)
  const removeOpponent = useStore((state) => state.removeOpponent)
  const pushToast = useUiStore((state) => state.pushToast)
  const [shareOpen, setShareOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [qr, setQr] = useState('')
  const [code, setCode] = useState('')
  const [preview, setPreview] = useState<DuelPayload | null>(null)
  const [error, setError] = useState('')
  const [removeId, setRemoveId] = useState<string | null>(null)

  const link = useMemo(() => {
    if (!profile) return ''
    return duelLink(buildDuelPayload(profile, progress))
  }, [profile, progress.weekly, progress.streak])

  useEffect(() => {
    if (!shareOpen || !link) {
      setQr('')
      return
    }
    let alive = true
    QRCode.toDataURL(link, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0B5641', light: '#FFFFFF' },
    })
      .then((url) => {
        if (alive) setQr(url)
      })
      .catch(() => {
        if (alive) setQr('')
      })
    return () => {
      alive = false
    }
  }, [shareOpen, link])

  if (!profile) return null

  const weekly = progress.weekly
  const rivals = progress.league.filter((entry) => entry.weekStart === weekly.weekStart)
  const staleCount = progress.league.filter((entry) => entry.weekStart !== weekly.weekStart).length
  const selfEntry = {
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    xp: weekly.xp,
    streak: progress.streak,
    lessons: weekly.lessons,
    accuracy: totalAccuracy(weekly.correct, weekly.total),
    isSelf: true,
  }
  const ranking = [
    ...rivals.map((entry) => ({ ...entry, isSelf: false })),
    selfEntry,
  ].sort((a, b) => b.xp - a.xp)
  const selfRank = ranking.findIndex((entry) => entry.isSelf) + 1

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      pushToast({ title: 'Ссылка скопирована', body: 'Отправь её другу в мессенджере.' })
    } catch {
      const area = document.createElement('textarea')
      area.value = text
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      try {
        document.execCommand('copy')
        pushToast({ title: 'Ссылка скопирована', body: 'Отправь её другу в мессенджере.' })
      } catch {
        pushToast({ title: 'Не удалось скопировать', body: 'Выдели ссылку вручную.' })
      }
      document.body.removeChild(area)
    }
  }

  const share = async () => {
    if (navigator.share && link) {
      try {
        await navigator.share({
          title: 'Сүз — дуэль',
          text: 'Сравним недельный прогресс в татарском?',
          url: link,
        })
        return
      } catch {
        // Пользователь закрыл системное окно — просто предложим скопировать.
      }
    }
    if (link) void copy(link)
  }

  const parseCode = (raw: string) => {
    setError('')
    setPreview(null)
    const trimmed = raw.trim()
    if (!trimmed) return
    const part = trimmed.includes('#duel=') ? trimmed.split('#duel=')[1] : trimmed
    const payload = decodeDuel(part.split('&')[0])
    if (!payload) {
      setError('Не получилось прочитать ссылку. Скопируй её целиком — она начинается с https://')
      return
    }
    if (payload.id === profile.id) {
      setError('Это твоя собственная ссылка. Попроси ссылку у друга.')
      return
    }
    setPreview(payload)
  }

  const confirmImport = () => {
    if (!preview) return
    importOpponent({
      id: preview.id,
      name: preview.name,
      avatar: preview.avatar,
      weekStart: preview.weekStart,
      xp: preview.xp,
      streak: preview.streak,
      lessons: preview.lessons,
      accuracy: preview.accuracy,
    })
    pushToast({
      title: `Дуэль с ${preview.name}`,
      body: `Результат добавлен: ${preview.xp} XP за неделю.`,
    })
    setPreview(null)
    setCode('')
    setAddOpen(false)
  }

  return (
    <div className="page league-page">
      <motion.section className="league-hero card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="league-hero-copy">
          <p className="eyebrow">Дуэль икәү</p>
          <h1>Лига <span className="accent">двоих</span></h1>
          <p className="lead">
            Никаких аккаунтов и серверов: обменяйтесь ссылкой или QR-кодом раз в неделю и
            сравнивайте прогресс. Данные остаются на устройствах.
          </p>
          <div className="league-actions">
            <button type="button" className="btn btn-primary" onClick={() => setShareOpen(true)}>
              <Share2 size={18} /> Поделиться результатом
            </button>
            <button type="button" className="btn btn-soft" onClick={() => setAddOpen(true)}>
              <UserPlus size={18} /> Добавить друга
            </button>
          </div>
        </div>
        <div className="league-hero-side">
          <Mascot mood="happy" size={140} />
          <div className="league-rank">
            <span>Место</span>
            <strong>#{selfRank}</strong>
            <small>из {ranking.length}</small>
          </div>
        </div>
      </motion.section>

      <section className="card league-board">
        <header className="section-head">
          <div>
            <p className="eyebrow">Атна · {humanDay(weekly.weekStart)}</p>
            <h2>Таблица недели</h2>
          </div>
          <span className="badge soft">
            <Trophy size={14} /> {weekly.xp} XP
          </span>
        </header>

        <div className="league-list">
          {ranking.map((entry, index) => (
            <div
              key={entry.id}
              className={clsx('league-row', entry.isSelf && 'self', index === 0 && 'leader')}
            >
              <span className={clsx('league-place', index === 0 && 'gold', index === 1 && 'silver', index === 2 && 'bronze')}>
                {index === 0 ? <Crown size={18} /> : index + 1}
              </span>
              <span className="league-avatar">{entry.avatar}</span>
              <div className="league-person">
                <strong>
                  {entry.name} {entry.isSelf && <em>ты</em>}
                </strong>
                <small>
                  {entry.lessons} уроков · {entry.accuracy}% точность
                </small>
              </div>
              <div className="league-streak">🔥 {entry.streak}</div>
              <div className="league-xp">
                <strong>{entry.xp}</strong>
                <span>XP</span>
              </div>
              {!entry.isSelf && (
                <button
                  type="button"
                  className="icon-btn subtle"
                  onClick={() => setRemoveId(entry.id)}
                  aria-label={`Удалить ${entry.name}`}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>

        {ranking.length === 1 && (
          <div className="league-empty">
            <div>
              <strong>Пока ты один на пьедестале.</strong>
              <p>
                Отправь другу ссылку — когда он откроет её, твой результат появится у него. А его
                результат ты увидишь, когда он пришлёт свою ссылку.
              </p>
            </div>
            <button type="button" className="btn btn-soft" onClick={() => setShareOpen(true)}>
              <Link2 size={16} /> Отправить ссылку
            </button>
          </div>
        )}

        {staleCount > 0 && (
          <p className="league-note">
            <Info size={14} /> {staleCount} результат(ов) прошлых недель сохранены, но не участвуют в
            текущем рейтинге.
          </p>
        )}
      </section>

      <section className="league-how card">
        <h2>Как это работает</h2>
        <ol className="how-list">
          <li>
            <span>1</span>
            <p><strong>Поделись результатом.</strong> Ссылка содержит только имя, XP за неделю, серию и точность.</p>
          </li>
          <li>
            <span>2</span>
            <p><strong>Друг открывает ссылку.</strong> Приложение само добавит твой результат в его лигу.</p>
          </li>
          <li>
            <span>3</span>
            <p><strong>Обменяйтесь в обе стороны.</strong> Чтобы увидеть друга у себя, попроси его нажать «Поделиться».</p>
          </li>
        </ol>
        <p className="muted small">
          Позже можно включить бесплатную синхронизацию через Supabase — инструкция будет в
          репозитории. Сейчас всё работает офлайн и без регистрации.
        </p>
      </section>

      <Sheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Дуэль по ссылке"
      >
        <div className="share-sheet">
          <p className="muted">
            Отправь friend-ссылку или дай отсканировать QR. Внутри — результат за неделю с{' '}
            {humanDay(weekly.weekStart)}.
          </p>
          <div className="qr-box">
            {qr ? (
              <img src={qr} alt="QR-код со ссылкой на дуэль" width={280} height={280} />
            ) : (
              <div className="qr-loading">
                <QrCode size={40} />
                <span>Готовим QR…</span>
              </div>
            )}
          </div>
          <div className="share-stat-row">
            <span><strong>{weekly.xp}</strong> XP</span>
            <span><strong>{weekly.lessons}</strong> уроков</span>
            <span><strong>{progress.streak}</strong> дней серия</span>
          </div>
          <label className="field-label" htmlFor="duel-link">Ссылка</label>
          <div className="copy-row">
            <input id="duel-link" className="text-input" value={link} readOnly onFocus={(event) => event.target.select()} />
            <button type="button" className="btn btn-soft" onClick={() => void copy(link)} aria-label="Скопировать ссылку">
              <Copy size={16} />
            </button>
          </div>
          <div className="share-actions">
            <button type="button" className="btn btn-primary" onClick={() => void share()}>
              <Share2 size={17} /> Отправить
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShareOpen(false)}>
              Закрыть
            </button>
          </div>
          <p className="fine-print">
            Ссылка меняется каждую неделю. Старые результаты не влияют на новый рейтинг.
          </p>
        </div>
      </Sheet>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Добавить друга">
        <div className="add-sheet">
          <p className="muted">
            Вставь ссылку, которую прислал друг, или её код после <code>#duel=</code>.
          </p>
          <textarea
            className="text-input textarea"
            rows={4}
            placeholder="https://w1nday12.github.io/suz/#duel=..."
            value={code}
            onChange={(event) => {
              setCode(event.target.value)
              setError('')
              setPreview(null)
            }}
          />
          <div className="add-actions">
            <button type="button" className="btn btn-soft" onClick={() => parseCode(code)} disabled={!code.trim()}>
              <Check size={16} /> Проверить ссылку
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}

          {preview && (
            <div className="duel-preview">
              <span className="league-avatar big">{preview.avatar}</span>
              <div>
                <strong>{preview.name}</strong>
                <small>
                  {preview.xp} XP · {preview.lessons} уроков · {preview.accuracy}% точность
                </small>
                <small className="muted">неделя с {humanDay(preview.weekStart)}</small>
              </div>
            </div>
          )}

          {preview && (
            <button type="button" className="btn btn-primary btn-block" onClick={confirmImport}>
              <UserPlus size={17} /> Добавить в лигу
            </button>
          )}

          <div className="add-hint">
            <Info size={15} />
            <p>
              Это офлайн-дуэль: приложение не отправляет данные само. Ссылка — единственный канал
              обмена.
            </p>
          </div>
        </div>
      </Sheet>

      <ConfirmDialog
        open={!!removeId}
        title="Удалить друга из лиги?"
        body="Результат исчезнет с этого устройства. Присланную ссылку можно будет добавить снова."
        confirmLabel="Удалить"
        danger
        onConfirm={() => {
          if (removeId) removeOpponent(removeId)
          setRemoveId(null)
        }}
        onClose={() => setRemoveId(null)}
      />
    </div>
  )
}
