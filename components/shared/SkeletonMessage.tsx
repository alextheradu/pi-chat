'use client'

export function SkeletonMessage() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 16px', alignItems: 'flex-start' }}>
      <div
        className="skeleton-shimmer"
        style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skeleton-shimmer" style={{ width: 120, height: 10, borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ width: '85%', height: 10, borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ width: '60%', height: 10, borderRadius: 4 }} />
      </div>
    </div>
  )
}

export function SkeletonMessageList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 8 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonMessage key={i} />
      ))}
    </div>
  )
}
