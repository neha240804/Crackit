// Drag-and-drop (or click-to-browse) resume upload.

import { FileUp } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'

import { cn } from '@/lib/utils'

const ACCEPTED = ['.pdf', '.docx', '.txt']
const MAX_BYTES = 5 * 1024 * 1024

interface Props {
  onFile: (file: File) => void
  onInvalid: (message: string) => void
  busy: boolean
}

export function UploadDropzone({ onFile, onInvalid, busy }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  // Check in the browser first for instant feedback; the backend checks again
  // (never trust the client alone).
  function handle(file: File | undefined) {
    if (!file) return
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!ACCEPTED.includes(ext)) return onInvalid('Please upload a PDF, DOCX or TXT file.')
    if (file.size > MAX_BYTES) return onInvalid('File is larger than 5 MB.')
    onFile(file)
  }

  function onDrop(event: DragEvent) {
    event.preventDefault() // otherwise the browser opens the dropped file
    setDragging(false)
    if (!busy) handle(event.dataTransfer.files[0])
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'flex w-full flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10',
        'text-center transition-colors disabled:cursor-wait',
        dragging ? 'border-brand-500 bg-brand-50' : 'border-ink-300 bg-white/60 hover:border-brand-500 hover:bg-white',
      )}
    >
      <FileUp className="mb-3 size-6 text-brand-600" aria-hidden />
      <span className="text-sm font-medium">
        {busy ? 'Reading your resume with AI…' : 'Drop your resume here or click to browse'}
      </span>
      <span className="mt-1 text-xs text-ink-500">PDF, DOCX or TXT · up to 5 MB</span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(e) => {
          handle(e.target.files?.[0])
          e.target.value = '' // allow choosing the same file again
        }}
      />
    </button>
  )
}
