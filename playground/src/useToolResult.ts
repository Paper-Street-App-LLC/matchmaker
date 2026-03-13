import { useEffect, useRef } from 'react'

/**
 * Buffers `ui/notifications/tool-result` postMessages that arrive before the
 * SDK transport completes the ui/initialize handshake. Once isConnected is
 * true, replays any buffered result through the provided callback.
 *
 * This fixes a race condition where fast tool calls (get_person, etc.) deliver
 * their result before the widget's App has finished connecting.
 */
export function useToolResultBuffer(
	isConnected: boolean,
	onResult: (params: unknown) => void,
) {
	const buffered = useRef<unknown>(null)
	const onResultRef = useRef(onResult)
	onResultRef.current = onResult

	// Capture any tool-result that arrives before the SDK processes it.
	// Only the most recent result is buffered — if two results arrive before
	// isConnected, the first is overwritten. This is acceptable because each
	// tool invocation replaces the previous widget state anyway.
	useEffect(() => {
		function onMessage(e: MessageEvent) {
			if (e.data?.method === 'ui/notifications/tool-result') {
				buffered.current = e.data.params
			}
		}
		window.addEventListener('message', onMessage)
		return () => window.removeEventListener('message', onMessage)
	}, [])

	// Once connected, replay the buffered result if the SDK missed it
	useEffect(() => {
		if (isConnected && buffered.current !== null) {
			onResultRef.current(buffered.current)
			buffered.current = null
		}
	}, [isConnected])

	// Clear the buffer when a new tool input starts
	function clearBuffer() {
		buffered.current = null
	}

	return { clearBuffer }
}
