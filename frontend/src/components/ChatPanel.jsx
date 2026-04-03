import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { queryBI, speakText, transcribeAudio } from '../lib/api'
import { useDashboardStore } from '../store/dashboardStore'

export default function ChatPanel() {
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const bottomRef = useRef(null)

  const {
    messages, addMessage, setResults, setLoading,
    isLoading, voiceEnabled, toggleVoice
  } = useDashboardStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text) => {
    const question = text || input.trim()
    if (!question || isLoading) return
    setInput('')

    addMessage({ role: 'user', content: question })
    setLoading(true)

    try {
      const history = messages.slice(-6).map(m => ({
        role: m.role, content: m.content
      }))
      const result = await queryBI(question, history)

      if (result.error) {
        addMessage({ role: 'assistant', content: `Error: ${result.error}`, isError: true })
      } else {
        addMessage({
          role: 'assistant',
          content: result.answer,
          sql: result.sql,
          rowCount: result.row_count,
        })
        setResults(result.chart_specs, result.insights, result.sql)

        // Auto-speak if voice enabled
        if (voiceEnabled && result.answer) {
          handleSpeak(result.answer)
        }
      }
    } catch (e) {
      addMessage({ role: 'assistant', content: `Connection error: ${e.message}`, isError: true })
    } finally {
      setLoading(false)
    }
  }

  const handleSpeak = async (text) => {
    try {
      const blob = await speakText(text)
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.play()
      audio.onended = () => URL.revokeObjectURL(url)
    } catch (e) {
      console.error('TTS error:', e)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        stream.getTracks().forEach(t => t.stop())
        try {
          const { text } = await transcribeAudio(blob)
          if (text) handleSend(text)
        } catch (e) {
          console.error('STT error:', e)
        }
      }
      mr.start()
      mediaRef.current = mr
      setIsRecording(true)
    } catch (e) {
      alert('Microphone access denied')
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    setIsRecording(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-700">Chat</span>
        <button
          onClick={toggleVoice}
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-colors ${
            voiceEnabled
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}
        >
          {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
          Voice {voiceEnabled ? 'on' : 'off'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm pt-8">
            <p className="mb-4">Ask anything about your data</p>
            <div className="space-y-2">
              {[
                'What is total profit by category?',
                'Show monthly sales revenue for 2004',
                'Which product line generates most revenue?',
                'Top 5 sub-categories by profit',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="block w-full text-left text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-lg px-3 py-2 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'bg-blue-600 text-white'
                : m.isError
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-gray-100 text-gray-800'
            }`}>
              <p className="leading-relaxed">{m.content}</p>
              {m.sql && (
                <details className="mt-2">
                  <summary className="text-xs opacity-60 cursor-pointer">SQL · {m.rowCount} rows</summary>
                  <pre className="mt-1 text-xs font-mono opacity-80 whitespace-pre-wrap">{m.sql}</pre>
                </details>
              )}
              {m.role === 'assistant' && !m.isError && voiceEnabled && (
                <button onClick={() => handleSpeak(m.content)} className="mt-1 flex items-center gap-1 text-xs opacity-50 hover:opacity-80">
                  <Volume2 size={10} /> Play
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about your data..."
            className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
          />
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-1 rounded-lg transition-colors ${
              isRecording ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-30"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}