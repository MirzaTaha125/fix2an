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

/** Matches Offers list cards (image + details + button + chevron). */
function OfferRequestListCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 md:p-4 flex flex-col h-full">
      <div className="flex gap-3 md:gap-4 flex-1 items-stretch min-h-0">
        <Skeleton className="w-28 h-16 md:w-32 md:h-20 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col">
          <Skeleton className="h-4 w-3/4 mb-1.5" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <div className="mt-auto pt-4 flex items-center gap-3.5 shrink-0">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-5 w-5 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Matches My Cases “current” tab cards. */
function MyCaseCurrentCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 md:p-4 flex flex-col h-full">
      <Skeleton className="h-6 w-28 rounded-full mb-3" />
      <div className="flex gap-3 items-start">
        <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-5 w-14 shrink-0" />
      </div>
      <div className="h-px bg-gray-100 my-3" />
      <div className="flex gap-3 items-center mb-3">
        <Skeleton className="w-20 h-[5rem] md:w-24 md:h-[4.75rem] rounded-xl shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <Skeleton className="h-[18px] w-[18px] shrink-0" />
      </div>
      <Skeleton className="h-9 w-full rounded-lg mb-3" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  )
}

function PageHeaderSkeleton({ titleClassName = 'h-9 w-40', descClassName = 'h-4 w-64' }) {
  return (
    <div className="mb-5 md:mb-7 space-y-2">
      <Skeleton className={titleClassName} />
      <Skeleton className={descClassName} />
    </div>
  )
}

/** Profile menu (mobile/tablet/web unified layout). */
function ProfileMenuSkeleton({ menuRows = 3, avatarClassName = 'rounded-full' }) {
  return (
    <div className="app-page-container max-w-2xl md:max-w-5xl lg:max-w-7xl pt-24 md:pt-32 pb-24 max-lg:pb-24 flex-1">
      <PageHeaderSkeleton titleClassName="h-8 w-40 max-w-full" descClassName="h-4 w-64 max-w-full" />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-5 flex items-center gap-3">
        <Skeleton className={`w-14 h-14 shrink-0 ${avatarClassName}`} />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-5 w-36 max-w-full" />
          <Skeleton className="h-3 w-48 max-w-full" />
        </div>
        <Skeleton className="w-5 h-5 shrink-0 rounded-md" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {Array.from({ length: menuRows }).map((_, i) => (
          <div
            key={i}
            className={`p-4 flex items-center gap-3${i < menuRows - 1 ? ' border-b border-gray-100' : ''}`}
          >
            <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="h-3 w-52 max-w-full" />
            </div>
            <Skeleton className="w-5 h-5 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  )
}

export {
  Skeleton,
  OfferRequestListCardSkeleton,
  MyCaseCurrentCardSkeleton,
  PageHeaderSkeleton,
  ProfileMenuSkeleton,
}
