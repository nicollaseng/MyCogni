import { contourPath, ringOpacity } from '@/features/mood/contour'

const rings = 9
const ink = '#eef1ea'

export function ArticleImage({ title }: { title: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        backgroundColor: '#1f3a33',
        color: ink,
        fontFamily: 'Newsreader',
      }}
    >
      <svg
        width="760"
        height="760"
        viewBox="0 0 300 300"
        style={{ position: 'absolute', right: -170, top: -40 }}
      >
        {Array.from({ length: rings }, (_, ring) => (
          <path
            key={ring}
            d={contourPath(ring, { rings, valence: 0.82, time: 0 })}
            fill="none"
            stroke={ink}
            strokeOpacity={ringOpacity(ring, rings) * 0.32}
            strokeWidth={ring === 0 ? 1.4 : 1}
          />
        ))}
      </svg>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          padding: '64px 72px',
        }}
      >
        <div style={{ display: 'flex', fontSize: 34, letterSpacing: '-0.02em', opacity: 0.85 }}>
          MyCogniAI
        </div>
        <div
          style={{
            display: 'flex',
            maxWidth: 760,
            fontSize: title.length > 48 ? 64 : 76,
            lineHeight: 1.06,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </div>
      </div>
    </div>
  )
}
