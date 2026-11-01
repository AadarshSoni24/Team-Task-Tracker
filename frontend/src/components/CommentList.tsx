'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Comment, FieldErrors, User } from '@/lib/types'
import { fullDate, relativeTime } from '@/lib/time'
import { useTick } from '@/lib/useTick'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { FieldError } from './Field'
import { Skeleton } from './Skeleton'

export function CommentList({
  comments,
  loading,
  currentUser,
  onSubmit,
}: {
  comments: Comment[]
  loading: boolean
  currentUser: User
  /** Resolves to field errors on validation failure, or null on success. */
  onSubmit: (text: string) => Promise<FieldErrors | null>
}) {
  const now = useTick()
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [posting, setPosting] = useState(false)

  async function submit(e?: FormEvent) {
    e?.preventDefault()
    const value = text.trim()
    if (!value || posting) {
      if (!value) setErrors({ text: ['Write something before posting.'] })
      return
    }
    setPosting(true)
    setErrors({})
    const result = await onSubmit(value)
    setPosting(false)
    if (result) setErrors(result)
    else setText('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <section aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="flex items-center gap-2 text-[13px] font-semibold">
        Comments
        {!loading && <span className="text-[12px] font-normal text-faint tabular-nums">{comments.length}</span>}
      </h2>

      <div className="mt-3">
        {loading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading comments">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-6 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong">
            <EmptyState art="comments" compact title="No comments yet" description="Start the conversation. Updates, questions and decisions all belong here." />
          </div>
        ) : (
          <ol className="space-y-1">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 -mx-2 hover:bg-white/[0.02] animate-fade-up">
                <Avatar name={c.user.name} id={c.user.id} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-medium text-fg">{c.user.name}</span>
                    <time dateTime={c.created_at} title={fullDate(c.created_at)} className="text-[11.5px] text-faint">
                      {relativeTime(c.created_at, now)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed whitespace-pre-wrap text-text-secondary [overflow-wrap:anywhere]">
                    {c.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <form onSubmit={submit} className="mt-4 flex gap-3" noValidate>
        <Avatar name={currentUser.name} id={currentUser.id} size="md" className="mt-1.5" />
        <div className="min-w-0 flex-1">
          <div className="rounded-lg border border-line-strong bg-canvas/60 transition-colors duration-150 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/15">
            <label htmlFor="comment-text" className="sr-only">
              Add a comment
            </label>
            <textarea
              id="comment-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Leave a comment…"
              rows={3}
              aria-invalid={!!errors.text}
              aria-describedby={errors.text ? 'comment-err' : undefined}
              className="block w-full resize-none bg-transparent px-3 pt-2.5 text-[13px] text-fg placeholder:text-faint focus:outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="pl-1 text-[11px] text-faint">Ctrl + Enter to post</span>
              <Button type="submit" size="sm" variant="primary" loading={posting}>
                Comment
              </Button>
            </div>
          </div>
          <FieldError id="comment-err" messages={errors.text} />
        </div>
      </form>
    </section>
  )
}

