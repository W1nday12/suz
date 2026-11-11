import { ArrowRight, Check, X } from 'lucide-react'
import clsx from 'clsx'
import { useT } from '../../lib/i18n'

export type AnswerState = 'idle' | 'correct' | 'wrong'

interface FooterProps {
  state: AnswerState
  canCheck?: boolean
  onCheck: () => void
  onNext: () => void
  note?: string
  correctAnswer?: string
  idleHint?: string
  hideCheck?: boolean
}

export function Footer({
  state,
  canCheck = true,
  onCheck,
  onNext,
  note,
  correctAnswer,
  idleHint,
  hideCheck,
}: FooterProps) {
  const t = useT()

  return (
    <footer className={clsx('lesson-footer', state)}>
      {state !== 'idle' && (
        <div className="feedback-row">
          <span className={clsx('feedback-icon', state)}>
            {state === 'correct' ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
          </span>
          <div className="feedback-copy">
            <strong>{state === 'correct' ? `${t('correct')}!` : `${t('mistake')}!`}</strong>
            {state === 'wrong' && correctAnswer && (
              <span>
                Дөрес җавап: <b>{correctAnswer}</b>
              </span>
            )}
            {note && <span>{note}</span>}
          </div>
        </div>
      )}

      {state === 'idle' && idleHint && <p className="footer-hint">{idleHint}</p>}

      {hideCheck ? (
        state !== 'idle' && (
          <button type="button" className="btn btn-primary btn-block" onClick={onNext}>
            {t('continue')} <ArrowRight size={18} />
          </button>
        )
      ) : (
        <button
          type="button"
          className={clsx('btn btn-block', state === 'idle' ? 'btn-primary' : state === 'correct' ? 'btn-primary' : 'btn-danger')}
          disabled={state === 'idle' && !canCheck}
          onClick={state === 'idle' ? onCheck : onNext}
        >
          {state === 'idle' ? t('check') : t('continue')}
          {state !== 'idle' && <ArrowRight size={18} />}
        </button>
      )}
    </footer>
  )
}
