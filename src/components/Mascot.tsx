import { motion } from 'motion/react'
import clsx from 'clsx'

export type Mood = 'idle' | 'happy' | 'sad' | 'think' | 'celebrate'

interface MascotProps {
  mood?: Mood
  size?: number
  className?: string
  animate?: boolean
}

export function Mascot({ mood = 'idle', size = 140, className, animate = true }: MascotProps) {
  const eyeY = mood === 'think' ? 58 : 60
  const eyeShift = mood === 'think' ? 5 : 0
  const mouth =
    mood === 'sad'
      ? 'M70 82 Q80 74 90 82'
      : mood === 'celebrate'
        ? 'M69 78 Q80 92 91 78'
        : mood === 'happy'
          ? 'M71 79 Q80 87 89 79'
          : 'M73 81 Q80 85 87 81'

  const content = (
    <svg
      width={size}
      height={size * 1.18}
      viewBox="0 0 160 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('mascot', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="m-petal" x1="52" y1="22" x2="110" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F48362" />
          <stop offset="1" stopColor="#D94F3D" />
        </linearGradient>
        <linearGradient id="m-leaf" x1="62" y1="110" x2="104" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7FD3AC" />
          <stop offset="1" stopColor="#3C9A72" />
        </linearGradient>
        <linearGradient id="m-pot" x1="48" y1="154" x2="112" y2="182" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D97B52" />
          <stop offset="1" stopColor="#B55638" />
        </linearGradient>
      </defs>

      <ellipse cx="80" cy="181" rx="45" ry="6" fill="#17352B" opacity=".12" />

      <path d="M80 98V160" stroke="#4FB98A" strokeWidth="9" strokeLinecap="round" />
      <path d="M79 132C62 131 50 121 46 105C63 105 76 114 79 132Z" fill="url(#m-leaf)" />
      <path d="M81 148C98 147 110 137 114 121C97 121 84 130 81 148Z" fill="url(#m-leaf)" opacity=".9" />

      <path
        d="M80 16C64 38 60 60 67 78C72 91 72 101 67 111C76 115 84 115 93 111C88 101 88 91 93 78C100 60 96 38 80 16Z"
        fill="url(#m-petal)"
      />
      <path
        d="M80 24C70 40 68 56 73 70C76 79 76 87 72 94C77 97 83 97 88 94C84 87 84 79 87 70C92 56 90 40 80 24Z"
        fill="#F7A07E"
        opacity=".55"
      />
      <path d="M67 111C58 101 57 90 63 79C71 84 74 94 73 105C71 108 69 110 67 111Z" fill="#E96B4E" opacity=".72" />
      <path d="M93 111C102 101 103 90 97 79C89 84 86 94 87 105C89 108 91 110 93 111Z" fill="#E96B4E" opacity=".72" />

      <g fill="#17352B">
        <ellipse cx={68 + eyeShift} cy={eyeY} rx="4.2" ry="5.3" />
        <ellipse cx={92 + eyeShift} cy={eyeY} rx="4.2" ry="5.3" />
      </g>
      <circle cx="60" cy="74" r="5.5" fill="#F2B441" opacity=".55" />
      <circle cx="100" cy="74" r="5.5" fill="#F2B441" opacity=".55" />
      <path d={mouth} stroke="#17352B" strokeWidth="3" strokeLinecap="round" fill="none" />

      <path d="M52 158H108L102 181C101 184 98 186 95 186H65C62 186 59 184 58 181L52 158Z" fill="url(#m-pot)" />
      <rect x="48" y="154" width="64" height="10" rx="5" fill="#E8916A" />
      <path d="M68 168H92" stroke="#F7C9A9" strokeWidth="3" strokeLinecap="round" opacity=".7" />

      {mood === 'celebrate' && (
        <g fill="#F2B441">
          <path d="M28 42l2.4 6.2L37 50l-6.6 1.8L28 58l-2.4-6.2L19 50l6.6-1.8L28 42Z" />
          <path d="M130 34l1.8 4.7 4.9 1.3-4.9 1.3L130 46l-1.8-4.7-4.9-1.3 4.9-1.3L130 34Z" />
        </g>
      )}
    </svg>
  )

  if (!animate) return content

  return (
    <motion.div
      className="mascot-motion"
      animate={
        mood === 'celebrate'
          ? { y: [0, -8, 0], rotate: [0, -2, 2, 0] }
          : mood === 'sad'
            ? { y: [0, 2, 0], rotate: [0, -1, 1, 0] }
            : { y: [0, -4, 0] }
      }
      transition={{
        duration: mood === 'celebrate' ? 0.9 : 3.4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {content}
    </motion.div>
  )
}

export function TulipMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 54V30" stroke="#4FB98A" strokeWidth="5" strokeLinecap="round" />
      <path d="M31 42C22 42 16 36 14 27C24 27 30 32 31 42Z" fill="#7FD3AC" />
      <path d="M33 47C42 47 48 41 50 32C40 32 34 37 33 47Z" fill="#7FD3AC" opacity=".9" />
      <path d="M32 6C24 16 22 26 25 34C27 40 27 44 25 49C29 51 35 51 39 49C37 44 37 40 39 34C42 26 40 16 32 6Z" fill="#E4654C" />
      <path d="M32 10C27 17 26 24 28 31C30 35 30 38 28 42C31 43 33 43 36 42C34 38 34 35 36 31C38 24 37 17 32 10Z" fill="#F7A07E" opacity=".6" />
      <g fill="#17352B">
        <circle cx="28" cy="28" r="1.7" />
        <circle cx="36" cy="28" r="1.7" />
      </g>
      <path d="M29 33c2 2 4 2 6 0" stroke="#17352B" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}
