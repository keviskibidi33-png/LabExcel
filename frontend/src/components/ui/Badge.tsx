import React from 'react'

interface BadgeProps {
  count: number
  className?: string
}

export default function Badge({ count, className = '' }: BadgeProps) {
  if (count === 0) return null
  
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-white bg-blue-600 rounded-full min-w-[20px] ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

