import { useState } from 'react'
import { Code2, ChevronDown, ChevronUp } from 'lucide-react'

export default function SQLViewer({ sql }) {
  const [open, setOpen] = useState(false)
  if (!sql) return null
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs text-gray-500 hover:text-gray-700"
      >
        <span className="flex items-center gap-2"><Code2 size={13} /> Generated SQL</span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <pre className="px-4 pb-4 text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap border-t border-gray-200 pt-3">
          {sql}
        </pre>
      )}
    </div>
  )
}