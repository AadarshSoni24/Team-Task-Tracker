'use client'

import { STATUS_META, STATUS_ORDER } from '@/lib/status'
import type { TaskStatus } from '@/lib/types'
import { IconChevronDown } from './icons'
import { SelectMenu, type MenuOption } from './SelectMenu'
import { StatusIcon } from './StatusIcon'

const OPTIONS: MenuOption<TaskStatus>[] = STATUS_ORDER.map((s) => ({
  value: s,
  label: STATUS_META[s].label,
  icon: <StatusIcon status={s} />,
}))

const TRIGGERS = {
  icon: 'relative z-10 -m-1 flex size-6 shrink-0 items-center justify-center rounded-md transition-colors duration-150 hover:bg-white/[0.07]',
  chip: 'inline-flex h-7 items-center gap-1.5 rounded-md border border-line-strong bg-white/[0.02] px-2 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:bg-white/[0.06]',
  field:
    'flex h-8 w-full items-center gap-2 rounded-md px-2 text-[13px] text-fg transition-colors duration-150 hover:bg-white/[0.05]',
}

export function StatusDropdown({
  status,
  onChange,
  variant = 'icon',
  disabled,
}: {
  status: TaskStatus
  onChange: (status: TaskStatus) => void
  variant?: keyof typeof TRIGGERS
  disabled?: boolean
}) {
  return (
    <SelectMenu
      value={status}
      options={OPTIONS}
      onChange={onChange}
      label={`Status: ${STATUS_META[status].label}. Change status`}
      heading="Change status"
      triggerClassName={TRIGGERS[variant]}
      disabled={disabled}
      width={196}
    >
      <StatusIcon status={status} />
      {variant !== 'icon' && <span>{STATUS_META[status].label}</span>}
      {variant === 'field' && <IconChevronDown size={13} className="ml-auto text-faint" />}
    </SelectMenu>
  )
}

