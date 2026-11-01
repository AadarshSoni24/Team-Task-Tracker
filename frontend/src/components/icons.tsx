import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconGrid = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1.2" />
    <rect x="9" y="2.5" width="4.5" height="4.5" rx="1.2" />
    <rect x="2.5" y="9" width="4.5" height="4.5" rx="1.2" />
    <rect x="9" y="9" width="4.5" height="4.5" rx="1.2" />
  </Icon>
)
export const IconPlus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 3.5v9M3.5 8h9" />
  </Icon>
)
export const IconChevronRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6.5 4 4 4-4 4" />
  </Icon>
)
export const IconChevronDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="m4 6.5 4 4 4-4" />
  </Icon>
)
export const IconArrowLeft = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12.5 8h-9M7 4.5 3.5 8 7 11.5" />
  </Icon>
)
export const IconLogOut = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 13.5H3.8a1.3 1.3 0 0 1-1.3-1.3V3.8a1.3 1.3 0 0 1 1.3-1.3H6M10.5 11l3-3-3-3M13.5 8H6" />
  </Icon>
)
export const IconMenu = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h7" />
  </Icon>
)
export const IconX = (p: IconProps) => (
  <Icon {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Icon>
)
export const IconList = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.5 4h8M5.5 8h8M5.5 12h8" />
    <circle cx="2.75" cy="4" r=".6" fill="currentColor" />
    <circle cx="2.75" cy="8" r=".6" fill="currentColor" />
    <circle cx="2.75" cy="12" r=".6" fill="currentColor" />
  </Icon>
)
export const IconBoard = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="2.5" width="3.5" height="11" rx="1" />
    <rect x="6.25" y="2.5" width="3.5" height="7.5" rx="1" />
    <rect x="10.5" y="2.5" width="3.5" height="9" rx="1" />
  </Icon>
)
export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="m3.5 8.5 3 3 6-7" />
  </Icon>
)
export const IconPencil = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10.5 3 13 5.5 6 12.5l-3 .5.5-3L10.5 3Z" />
  </Icon>
)
export const IconMessage = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 3.5h10a.8.8 0 0 1 .8.8v6.4a.8.8 0 0 1-.8.8H7l-3 2.3V11.5H3a.8.8 0 0 1-.8-.8V4.3A.8.8 0 0 1 3 3.5Z" />
  </Icon>
)
export const IconUserPlus = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6.5" cy="5.5" r="2.5" />
    <path d="M2 13.5c.5-2.3 2.3-3.5 4.5-3.5s4 1.2 4.5 3.5M12.5 4.5v4M10.5 6.5h4" />
  </Icon>
)
export const IconUsers = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="5.5" r="2.3" />
    <path d="M1.8 13.2c.4-2.1 2-3.3 4.2-3.3s3.8 1.2 4.2 3.3M10.5 3.4a2.3 2.3 0 0 1 0 4.3M12 9.9c1.2.4 2 1.5 2.2 3.3" />
  </Icon>
)
export const IconSparkle = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 2.5v3M8 10.5v3M2.5 8h3M10.5 8h3M4.3 4.3l1.6 1.6M10.1 10.1l1.6 1.6M11.7 4.3l-1.6 1.6M5.9 10.1l-1.6 1.6" />
  </Icon>
)
export const IconSwap = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 5.5h9.5L10 3M13 10.5H3.5L6 13" />
  </Icon>
)
export const IconMail = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
    <path d="m2.5 4.5 5.5 4 5.5-4" />
  </Icon>
)
export const IconCalendar = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
    <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
  </Icon>
)
export const IconClock = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M8 5v3l2 1.5" />
  </Icon>
)
export const IconUser = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="5.5" r="2.5" />
    <path d="M3 13.5c.6-2.4 2.6-3.6 5-3.6s4.4 1.2 5 3.6" />
  </Icon>
)
export const IconActivity = (p: IconProps) => (
  <Icon {...p}>
    <path d="M1.5 8h3l1.5-4 3 8 1.5-4h4" />
  </Icon>
)
export const IconCheckSquare = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" />
    <path d="m5.5 8 1.8 1.8L10.5 6" />
  </Icon>
)

