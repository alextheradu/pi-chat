'use client'

import { useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { Bold as BoldExt } from '@tiptap/extension-bold'
import { Italic as ItalicExt } from '@tiptap/extension-italic'
import { Strike } from '@tiptap/extension-strike'
import { Code } from '@tiptap/extension-code'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Link as LinkExt } from '@tiptap/extension-link'
import { HardBreak } from '@tiptap/extension-hard-break'
import { History } from '@tiptap/extension-history'
import { Document } from '@tiptap/extension-document'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { createLowlight } from 'lowlight'
import java from 'highlight.js/lib/languages/java'
import python from 'highlight.js/lib/languages/python'
import typescript from 'highlight.js/lib/languages/typescript'
import { Bold, Italic, Code as CodeIcon, FileCode, AtSign, Smile, Paperclip, Send } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { useTyping } from '@/hooks/useTyping'
import type { Editor } from '@tiptap/react'

const lowlight = createLowlight()
lowlight.register({ java, python, typescript })

interface MessageComposerProps {
  channelId: string
  placeholder?: string
}

function parsePollCommand(text: string): { question: string; options: string[] } | null {
  if (!text.startsWith('/poll ')) return null
  const parts = text.replace(/^\/poll\s+/, '').split('|').map(s => s.trim()).filter(Boolean)
  if (parts.length < 3) return null
  return { question: parts[0]!, options: parts.slice(1) }
}

export function MessageComposer({ channelId, placeholder = 'Message...' }: MessageComposerProps) {
  const { socket } = useSocket()
  const { startTyping, stopTyping } = useTyping(channelId)
  const editorRef = useRef<Editor | null>(null)

  const sendMessage = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const text = editor.getText()
    const poll = parsePollCommand(text)
    if (poll) {
      stopTyping()
      socket.emit('poll:create', { channelId, question: poll.question, options: poll.options })
      editor.commands.clearContent()
      return
    }
    const content = editor.getHTML()
    if (!content || content === '<p></p>') return
    stopTyping()
    socket.emit('message:send', { channelId, content })
    editor.commands.clearContent()
  }, [socket, channelId, stopTyping])

  const editor = useEditor({
    extensions: [
      Document, Paragraph, Text,
      BoldExt, ItalicExt, Strike, Code,
      CodeBlockLowlight.configure({ lowlight }),
      LinkExt.configure({ openOnClick: false }),
      HardBreak.extend({
        addKeyboardShortcuts() {
          return { 'Shift-Enter': () => this.editor.commands.setHardBreak() }
        },
      }),
      History,
    ],
    editorProps: {
      attributes: {
        style: 'outline: none; min-height: 44px; max-height: 200px; overflow-y: auto; font-size: 14px; color: var(--text-primary); padding: 8px 12px;',
        'data-placeholder': placeholder,
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          sendMessage()
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: e }) => {
      editorRef.current = e
      startTyping()
    },
    onCreate: ({ editor: e }) => {
      editorRef.current = e
    },
  })

  const runCmd = useCallback((cmd: () => void) => { cmd(); editor?.commands.focus() }, [editor])

  return (
    <div style={{ padding: '0 16px 12px' }}>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
          {[
            { icon: Bold, label: 'Bold', cmd: () => editor?.chain().focus().toggleBold().run() },
            { icon: Italic, label: 'Italic', cmd: () => editor?.chain().focus().toggleItalic().run() },
            { icon: CodeIcon, label: 'Inline code', cmd: () => editor?.chain().focus().toggleCode().run() },
            { icon: FileCode, label: 'Code block', cmd: () => editor?.chain().focus().toggleCodeBlock().run() },
          ].map(({ icon: Icon, label, cmd }) => (
            <button key={label} aria-label={label} type="button" onClick={() => runCmd(cmd)} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4, color: 'var(--text-muted)' }}>
              <Icon size={14} />
            </button>
          ))}
          <div style={{ width: 1, height: 16, background: 'var(--border-default)', margin: '0 4px' }} />
          {[{ icon: AtSign, label: 'Mention' }, { icon: Smile, label: 'Emoji' }, { icon: Paperclip, label: 'Attach file' }].map(({ icon: Icon, label }) => (
            <button key={label} aria-label={label} type="button" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4, color: 'var(--text-muted)' }}>
              <Icon size={14} />
            </button>
          ))}
        </div>
        <EditorContent editor={editor} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 6px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Drag files here</span>
          <button aria-label="Send message" onClick={sendMessage} style={{ width: 28, height: 28, background: 'var(--yellow)', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-inverse)' }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
