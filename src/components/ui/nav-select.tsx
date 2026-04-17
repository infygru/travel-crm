"use client"

import { useRouter } from "next/navigation"

/**
 * A <select> that navigates to a URL on change.
 * Used in server component pages where onChange can't be passed inline.
 * Options use href values — the selected option's value is the URL to push.
 */
export function NavSelect({
  value,
  options,
  className,
}: {
  value: string
  options: { label: string; href: string }[]
  className?: string
}) {
  const router = useRouter()
  return (
    <select
      value={value}
      onChange={(e) => router.push(e.target.value)}
      className={className}
    >
      {options.map((opt) => (
        <option key={opt.href} value={opt.href}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
