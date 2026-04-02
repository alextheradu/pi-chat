type Props = { src?: string | null; name: string; size?: number }

export default function Avatar({ src, name, size = 32 }: Props) {
  const initial = (name?.[0] ?? '?').toUpperCase()
  return src ? (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'var(--yellow)', color: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 700,
      }}
    >
      {initial}
    </div>
  )
}
