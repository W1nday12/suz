import { useState } from 'react'
import {
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  Info,
  MoreVertical,
  Share,
  Smartphone,
} from 'lucide-react'
import clsx from 'clsx'
import { useUiStore } from '../../store/useUiStore'
import {
  isAndroid,
  isIos,
  isStandalone,
  promptInstall,
  useInstallAvailable,
} from '../../lib/install'
import { Sheet } from '../Sheet'

type Platform = 'iphone' | 'android' | 'desktop'

const SITE_URL = 'https://w1nday12.github.io/suz/'

export function InstallModal() {
  const open = useUiStore((state) => state.installOpen)
  const close = useUiStore((state) => state.closeInstall)
  const pushToast = useUiStore((state) => state.pushToast)
  const canInstall = useInstallAvailable()
  const [platform, setPlatform] = useState<Platform>(() =>
    isIos() ? 'iphone' : isAndroid() ? 'android' : 'desktop',
  )
  const installed = isStandalone()

  const install = async () => {
    const result = await promptInstall()
    if (result === 'accepted') {
      pushToast({ title: 'Установлено', body: 'Сүз появится на главном экране.' })
      close()
    } else if (result === 'dismissed') {
      pushToast({ title: 'Установка отменена', body: 'Можно попробовать позже.' })
    } else {
      pushToast({
        title: 'Браузер пока не предлагает установку',
        body: 'Используй инструкцию ниже.',
      })
    }
  }

  return (
    <Sheet open={open} onClose={close} title="Установить Сүз">
      <div className="install-sheet">
        <div className="install-hero">
          <span className="install-icon">🌷</span>
          <div>
            <h3>Сүз на твоём телефоне</h3>
            <p className="muted">
              Работает офлайн, открывается с иконки, обновляется автоматически. Без аккаунта и
              подписок.
            </p>
          </div>
        </div>

        {installed ? (
          <div className="installed-note">
            <Check size={20} />
            <div>
              <strong>Уже установлено</strong>
              <p className="muted">Ты открываешь приложение в режиме standalone. Всё готово.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="platform-tabs" role="tablist" aria-label="Платформа">
              <button
                type="button"
                role="tab"
                aria-selected={platform === 'iphone'}
                className={clsx(platform === 'iphone' && 'active')}
                onClick={() => setPlatform('iphone')}
              >
                iPhone
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={platform === 'android'}
                className={clsx(platform === 'android' && 'active')}
                onClick={() => setPlatform('android')}
              >
                Android
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={platform === 'desktop'}
                className={clsx(platform === 'desktop' && 'active')}
                onClick={() => setPlatform('desktop')}
              >
                Компьютер
              </button>
            </div>

            {platform === 'iphone' && (
              <div className="install-steps">
                <p className="install-warn">
                  <Info size={15} /> На iPhone установка работает только в Safari.
                </p>
                <div className="install-step">
                  <span>1</span>
                  <p>Открой <b>{SITE_URL}</b> в Safari.</p>
                </div>
                <div className="install-step">
                  <span>2</span>
                  <p>Нажми кнопку «Поделиться» <Share size={16} /> внизу экрана.</p>
                </div>
                <div className="install-step">
                  <span>3</span>
                  <p>Выбери «На экран „Домой“» и добавь «Сүз».</p>
                </div>
                <div className="install-step">
                  <span>4</span>
                  <p>Открой иконку — приложение запустится без адресной строки.</p>
                </div>
                <p className="fine-print">
                  App Store не нужен: это PWA. Ограничение iOS — нет push-уведомлений, но все уроки
                  и прогресс работают.
                </p>
              </div>
            )}

            {platform === 'android' && (
              <div className="install-steps">
                {canInstall ? (
                  <button type="button" className="btn btn-primary btn-block" onClick={() => void install()}>
                    <Download size={17} /> Установить сейчас
                  </button>
                ) : (
                  <>
                    <div className="install-step">
                      <span>1</span>
                      <p>Открой сайт в Chrome: <b>{SITE_URL}</b>.</p>
                    </div>
                    <div className="install-step">
                      <span>2</span>
                      <p>
                        Нажми меню <MoreVertical size={16} /> в правом верхнем углу.
                      </p>
                    </div>
                    <div className="install-step">
                      <span>3</span>
                      <p>Выбери «Установить приложение» или «Добавить на главный экран».</p>
                    </div>
                  </>
                )}
                <div className="apk-note">
                  <Smartphone size={18} />
                  <p>
                    <strong>APK для Android</strong> будет в GitHub Releases. Пока PWA ничем не
                    хуже: тот же офлайн-режим и обновления.
                  </p>
                  <a
                    href="https://github.com/W1nday12/suz/releases"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost small"
                  >
                    Releases <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}

            {platform === 'desktop' && (
              <div className="install-steps">
                {canInstall ? (
                  <button type="button" className="btn btn-primary btn-block" onClick={() => void install()}>
                    <Download size={17} /> Установить приложение
                  </button>
                ) : (
                  <>
                    <div className="install-step">
                      <span>1</span>
                      <p>Открой <b>{SITE_URL}</b> в Chrome, Edge или Safari.</p>
                    </div>
                    <div className="install-step">
                      <span>2</span>
                      <p>
                        Нажми иконку установки в адресной строке или меню браузера{' '}
                        <MoreVertical size={16} />.
                      </p>
                    </div>
                    <div className="install-step">
                      <span>3</span>
                      <p>Выбери «Установить Сүз».</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        <div className="install-links">
          <button
            type="button"
            className="link-row"
            onClick={() => {
              void navigator.clipboard?.writeText(SITE_URL)
              pushToast({ title: 'Ссылка скопирована', body: SITE_URL })
            }}
          >
            Скопировать ссылку <ArrowRight size={16} />
          </button>
          <a className="link-row" href={SITE_URL} target="_blank" rel="noreferrer">
            Открыть сайт <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </Sheet>
  )
}
