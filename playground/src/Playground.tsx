import { useRef, useState, useEffect } from 'react'

const WIDGETS = [
  {
    label: 'find_matches',
    src: '/widget.html',
    payload: JSON.stringify(
      {
        structuredContent: {
          subject: { name: 'Alex Johnson', id: 'abc-123' },
          matches: [
            {
              person: { id: '1', name: 'Jordan Lee', age: 29, location: 'San Francisco' },
              about: 'Architect, coffee lover, weekend hiker',
              matchmaker_note: "Jordan's curious and adventurous nature pairs naturally with yours — you both share a creative side, which tends to make for genuine connection.",
            },
            {
              person: { id: '2', name: 'Morgan Patel', age: 32, location: 'New York' },
              about: 'Teacher, world traveler, book club host',
              matchmaker_note: "Morgan's ambitious personality and passion for travel complement your profile well. A strong foundation for something real.",
            },
            {
              person: { id: '3', name: 'Sam Rivera', age: 27, location: 'Austin' },
              about: 'Founder, yoga instructor, music enthusiast',
              matchmaker_note: "Sam's warm and creative energy aligns with what you're looking for — purpose-driven and emotionally available.",
            },
          ],
        },
      },
      null,
      2
    ),
  },
  {
    label: 'get_person',
    src: '/person-widget.html',
    payload: JSON.stringify(
      {
        structuredContent: {
          person: {
            id: 'mock-1',
            name: 'Jordan Lee',
            age: 29,
            location: 'San Francisco',
            gender: 'woman',
            personality: {
              traits: ['curious', 'adventurous'],
              interests: ['hiking', 'coffee', 'architecture'],
            },
            preferences: {
              ageRange: { min: 27, max: 36 },
              genders: ['man'],
              locations: ['San Francisco', 'New York'],
            },
            notes: "Met at the SF design week event. Very intentional about what she's looking for — values depth over chemistry.",
          },
        },
      },
      null,
      2
    ),
  },
  {
    label: 'list_introductions',
    src: '/introductions-widget.html',
    payload: JSON.stringify(
      {
        structuredContent: {
          introductions: [
            { id: 'intro-1', person_a_id: 'mock-1', person_b_id: 'mock-2', status: 'dating', notes: 'Great first date at Bar Agricole. Both expressed interest in a second meeting.', created_at: '2026-01-10T00:00:00Z', updated_at: '2026-02-01T00:00:00Z', person_a: { id: 'mock-1', name: 'Jordan Lee', location: 'San Francisco' }, person_b: { id: 'mock-2', name: 'Morgan Patel', location: 'New York' } },
            { id: 'intro-2', person_a_id: 'mock-1', person_b_id: 'mock-3', status: 'pending', notes: 'Intro email sent. Waiting on Jordan to respond.', created_at: '2026-02-20T00:00:00Z', updated_at: '2026-02-20T00:00:00Z', person_a: { id: 'mock-1', name: 'Jordan Lee', location: 'San Francisco' }, person_b: { id: 'mock-3', name: 'Sam Rivera', location: 'Austin' } },
            { id: 'intro-3', person_a_id: 'mock-2', person_b_id: 'mock-3', status: 'declined', notes: 'Morgan felt the distance was too much of an obstacle.', created_at: '2025-11-05T00:00:00Z', updated_at: '2025-11-12T00:00:00Z', person_a: { id: 'mock-2', name: 'Morgan Patel', location: 'New York' }, person_b: { id: 'mock-3', name: 'Sam Rivera', location: 'Austin' } },
          ],
        },
      },
      null,
      2
    ),
  },
  {
    label: 'get_introduction',
    src: '/introduction-widget.html',
    payload: JSON.stringify(
      {
        structuredContent: {
          introduction: {
            id: 'intro-1', person_a_id: 'mock-1', person_b_id: 'mock-2',
            status: 'dating',
            notes: 'Great first date at Bar Agricole. Both expressed strong interest in a second meeting. Jordan mentioned she felt immediately comfortable.',
            created_at: '2026-01-10T00:00:00Z', updated_at: '2026-02-01T00:00:00Z',
            person_a: { id: 'mock-1', name: 'Jordan Lee', age: 29, location: 'San Francisco', gender: 'woman', personality: { traits: ['curious', 'adventurous'], interests: ['hiking', 'coffee', 'architecture'] } },
            person_b: { id: 'mock-2', name: 'Morgan Patel', age: 32, location: 'New York', gender: 'woman', personality: { traits: ['ambitious', 'thoughtful'], interests: ['travel', 'books', 'teaching'] } },
          },
        },
      },
      null,
      2
    ),
  },
  {
    label: 'list_feedback',
    src: '/feedback-widget.html',
    payload: JSON.stringify(
      {
        structuredContent: {
          introduction_id: 'intro-1',
          feedback: [
            { id: 'fb-1', introduction_id: 'intro-1', from_person_id: 'mock-1', content: "Really enjoyed the evening. We talked for hours and I'd love to see them again.", sentiment: 'positive', created_at: '2026-02-03T00:00:00Z', from_person: { id: 'mock-1', name: 'Jordan Lee' } },
            { id: 'fb-2', introduction_id: 'intro-1', from_person_id: 'mock-2', content: "Jordan is lovely but I'm not sure there's a romantic spark. Open to a second date though.", sentiment: 'neutral', created_at: '2026-02-04T00:00:00Z', from_person: { id: 'mock-2', name: 'Morgan Patel' } },
          ],
        },
      },
      null,
      2
    ),
  },
  {
    label: 'list_people',
    src: '/people-widget.html',
    payload: JSON.stringify(
      {
        structuredContent: {
          people: [
            { id: 'mock-1', name: 'Jordan Lee', age: 29, location: 'San Francisco', gender: 'woman' },
            { id: 'mock-2', name: 'Morgan Patel', age: 32, location: 'New York', gender: 'woman' },
            { id: 'mock-3', name: 'Sam Rivera', age: 27, location: 'Austin', gender: 'woman' },
            { id: 'mock-4', name: 'Alex Chen', age: 31, location: 'Los Angeles', gender: 'man' },
          ],
        },
      },
      null,
      2
    ),
  },
]

export function Playground() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [payload, setPayload] = useState(WIDGETS[0].payload)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  // Pending payload to send once the widget handshake completes
  const pendingPayload = useRef<unknown>(null)

  const activeWidget = WIDGETS[activeIndex]

  // Listen for messages from the widget iframe
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const win = iframeRef.current?.contentWindow
      if (!win || e.source !== win) return
      const { jsonrpc, id, method } = e.data ?? {}
      if (jsonrpc !== '2.0') return

      // Widget sends ui/initialize — respond with host info
      if (method === 'ui/initialize') {
        win.postMessage(
          {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: e.data.params?.protocolVersion ?? '2024-11-05',
              hostInfo: { name: 'playground', version: '1.0.0' },
              hostCapabilities: {},
              hostContext: { theme: 'light' },
            },
          },
          '*'
        )
      }

      // Widget confirms initialized — deliver any pending payload
      if (method === 'ui/notifications/initialized') {
        if (pendingPayload.current !== null) {
          win.postMessage(
            { jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: pendingPayload.current },
            '*'
          )
          pendingPayload.current = null
          setSent(true)
          setTimeout(() => setSent(false), 1500)
        }
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function selectWidget(idx: number) {
    setActiveIndex(idx)
    setPayload(WIDGETS[idx].payload)
    setError(null)
    setSent(false)
  }

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

    const win = iframeRef.current?.contentWindow
    if (!win) return

    // Queue the payload — it will be delivered after the widget handshakes
    pendingPayload.current = parsed

    // If widget is already connected, deliver immediately
    win.postMessage(
      { jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: parsed },
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
        {/* Widget selector */}
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            gap: 6,
          }}
        >
          {WIDGETS.map((w, i) => (
            <button
              key={w.label}
              onClick={() => selectWidget(i)}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: `1px solid ${i === activeIndex ? '#111827' : '#e5e7eb'}`,
                background: i === activeIndex ? '#111827' : 'transparent',
                color: i === activeIndex ? '#fff' : '#374151',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Payload header */}
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
              fontFamily: 'monospace',
            }}
          >
            {activeWidget.label}
          </span>
        </div>
        <iframe
          key={activeWidget.src}
          ref={iframeRef}
          src={activeWidget.src}
          style={{ flex: 1, border: 'none', width: '100%' }}
          title="Widget Preview"
        />
      </div>
    </div>
  )
}
