import { useState } from 'react'
import { Check, Plus, UserRound } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../../store/useStore'
import { useUiStore } from '../../store/useUiStore'
import { levelInfo } from '../../lib/progress'
import { Sheet } from '../Sheet'

const avatars = ['🦊', '🐱', '🐻', '🐯', '🐰', '🦉', '🌷', '⭐']

export function ProfileModal() {
  const open = useUiStore((state) => state.profileOpen)
  const close = useUiStore((state) => state.closeProfile)
  const profiles = useStore((state) => state.profiles)
  const activeProfileId = useStore((state) => state.activeProfileId)
  const progressById = useStore((state) => state.progressById)
  const selectProfile = useStore((state) => state.selectProfile)
  const addProfile = useStore((state) => state.addProfile)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(avatars[1])

  const create = () => {
    if (!name.trim()) return
    addProfile(name.trim(), avatar)
    setName('')
    setAvatar(avatars[1])
    setAdding(false)
    close()
  }

  return (
    <Sheet open={open} onClose={close} title="Профили">
      <div className="profiles-sheet">
        <p className="muted">
          Два человека могут учиться на одном устройстве. У каждого — свой прогресс, серия и
          настройки.
        </p>
        <div className="profile-list">
          {profiles.map((profile) => {
            const progress = progressById[profile.id]
            const level = levelInfo(progress?.xp ?? 0)
            const active = profile.id === activeProfileId
            return (
              <button
                key={profile.id}
                type="button"
                className={clsx('profile-option', active && 'active')}
                onClick={() => {
                  selectProfile(profile.id)
                  close()
                }}
              >
                <span className="profile-option-avatar">{profile.avatar}</span>
                <span className="profile-option-copy">
                  <strong>{profile.name}</strong>
                  <small>
                    Уровень {level.level} · {progress?.seenWords.length ?? 0} слов · серия{' '}
                    {progress?.streak ?? 0}
                  </small>
                </span>
                {active ? (
                  <span className="profile-option-check">
                    <Check size={15} />
                  </span>
                ) : (
                  <span className="profile-option-switch">Переключить</span>
                )}
              </button>
            )
          })}
        </div>

        {!adding ? (
          <button type="button" className="btn btn-soft btn-block" onClick={() => setAdding(true)}>
            <Plus size={17} /> Добавить профиль
          </button>
        ) : (
          <div className="new-profile">
            <label className="field-label" htmlFor="profile-name">Имя</label>
            <input
              id="profile-name"
              className="text-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Например, Лалә"
              maxLength={20}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === 'Enter') create()
              }}
            />
            <label className="field-label">Аватар</label>
            <div className="avatar-grid compact">
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
            <div className="add-actions">
              <button type="button" className="btn btn-primary" disabled={!name.trim()} onClick={create}>
                <UserRound size={16} /> Создать профиль
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>
                Отмена
              </button>
            </div>
          </div>
        )}

        <p className="fine-print">
          Переключение мгновенное: данные профилей лежат рядом в IndexedDB и не смешиваются.
        </p>
      </div>
    </Sheet>
  )
}
