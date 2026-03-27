import React from 'react'
import { cn } from '../../utils/cn'

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-gradient-to-r from-gray-200 via-gray-50 to-gray-200 bg-[length:1000px_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
