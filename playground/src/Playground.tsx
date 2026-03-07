import { useRef, useState } from 'react'

const SAMPLE_PAYLOAD = JSON.stringify(
  {
    structuredContent: {
      subject: { name: 'Alex Johnson', id: 'abc-123' },
      matches: [
        {
          person: { id: '1', name: 'Jordan Lee', age: 29, location: 'San Francisco' },
          about: 'Architect, coffee lover, weekend hiker',
          matchmaker_note: 'Values depth, curiosity, and emotional honesty',
        },
        {
          person: { id: '2', name: 'Morgan Patel', age: 32, location: 'New York' },
          about: 'Teacher, world traveler, book club host',
          matchmaker_note: 'Thoughtful, ambitious, and family-oriented',
        },
        {
          person: { id: '3', name: 'Sam Rivera', age: 27, location: 'Austin' },
          about: 'Founder, yoga instructor, music enthusiast',
          matchmaker_note: 'Creative, warm, and purpose-driven',
        },
      ],
    },
  },
  null,
  2
)

export function Playground() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [payload, setPayload] = useState(SAMPLE_PAYLOAD)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function sendToWidget() {
    setError(null)
    setSent(false)

    let parsed: unknown
    try {
      parsed = JSON.parse(payload)
    } catch {
      setError('Invalid JSON')
      return
    }

    iframeRef.current?.contentWindow?.postMessage(
      {
        jsonrpc: '2.0',
        method: 'ui/notifications/tool-result',
        params: parsed,
      },
      '*'
    )
    setSent(true)
    setTimeout(() => setSent(false), 1500)
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Left: editor panel */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e5e7eb',
          background: '#f9fafb',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Tool Result Payload</span>
            <span
              style={{
                marginLeft: 8,
                fontSize: 12,
                color: '#6b7280',
                fontFamily: 'monospace',
              }}
            >
              structuredContent
            </span>
          </div>
          <button
            onClick={sendToWidget}
            style={{
              background: sent ? '#16a34a' : '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {sent ? 'Sent!' : 'Send →'}
          </button>
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: 12,
              padding: '6px 16px',
              borderBottom: '1px solid #fecaca',
            }}
          >
            {error}
          </div>
        )}

        <textarea
          value={payload}
          onChange={e => setPayload(e.target.value)}
          spellCheck={false}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            resize: 'none',
            padding: 16,
            fontFamily: '"Fira Code", "Cascadia Code", monospace',
            fontSize: 12,
            lineHeight: 1.6,
            background: '#f9fafb',
            color: '#111827',
          }}
        />
      </div>

      {/* Right: widget preview */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #e5e7eb',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          Widget Preview
          <span
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: '#6b7280',
              background: '#f3f4f6',
              borderRadius: 4,
              padding: '2px 6px',
            }}
          >
            iframe
          </span>
        </div>
        <iframe
          ref={iframeRef}
          src="/widget.html"
          style={{ flex: 1, border: 'none', width: '100%' }}
          title="Widget Preview"
        />
      </div>
    </div>
  )
}
