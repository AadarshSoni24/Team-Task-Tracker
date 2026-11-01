'use client'

import type { TeamMember, UserRef } from '@/lib/types'
import { Avatar } from './Avatar'
import { IconChevronDown, IconUser } from './icons'
import { SelectMenu } from './SelectMenu'

const TRIGGERS = {
  chip: 'inline-flex h-7 max-w-[200px] items-center gap-1.5 rounded-md border border-line-strong bg-white/[0.02] px-2 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:bg-white/[0.06]',
  field:
    'flex h-8 w-full items-center gap-2 rounded-md px-2 text-[13px] text-fg transition-colors duration-150 hover:bg-white/[0.05]',
}

export function AssigneeDropdown({
  members,
  value,
  onChange,
  variant = 'chip',
  disabled,
}: {
  members: TeamMember[]
  value: UserRef | null
  onChange: (memberId: string) => void
  variant?: keyof typeof TRIGGERS
  disabled?: boolean
}) {
  const options = members.map((m) => ({
    value: m.id,
    label: m.name,
    icon: <Avatar name={m.name} id={m.id} size="xs" />,
  }))
  return (
    <SelectMenu
      value={value?.id ?? null}
      options={options}
      onChange={onChange}
      label={value ? `Assignee: ${value.name}. Change assignee` : 'Choose assignee'}
      heading="Assign to team member"
      triggerClassName={TRIGGERS[variant]}
      disabled={disabled}
      width={240}
      emptyText="This team has no members yet"
    >
      {value ? (
        <Avatar name={value.name} id={value.id} size="xs" />
      ) : (
        <IconUser size={14} className="text-faint" />
      )}
      <span className={`truncate ${value ? '' : 'text-muted'}`}>{value ? value.name : 'Assignee'}</span>
      {variant === 'field' && <IconChevronDown size={13} className="ml-auto shrink-0 text-faint" />}
    </SelectMenu>
  )
}

