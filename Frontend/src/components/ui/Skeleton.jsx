import React from 'react'
import { cn } from '../../utils/cn'

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-md bg-gradient-to-r from-gray-200 via-gray-50 to-gray-200 bg-[length:1000px_100%]',
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

/** Generic vehicle / request / job list card. */
function ListCardSkeleton({ withActions = 1 } = {}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 md:p-4">
      <div className="flex gap-3 md:gap-4">
        <Skeleton className="w-28 h-16 md:w-32 md:h-20 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      {withActions > 0 && (
        <div className="flex gap-2 mt-4">
          {Array.from({ length: withActions }).map((_, i) => (
            <Skeleton key={i} className="h-10 flex-1 rounded-xl" />
          ))}
        </div>
      )}
    </div>
  )
}

/** Workshop New cases / Ongoing jobs list row (case no + title + vehicle + status). */
function WorkshopCaseRowSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-4/5 max-w-[14rem]" />
        <Skeleton className="h-3.5 w-2/5 max-w-[9rem]" />
        <Skeleton className="h-3 w-3/5 max-w-[11rem] mt-1" />
      </div>
      <div className="relative shrink-0 self-stretch flex items-center justify-end min-w-[5.5rem] pl-1">
        <Skeleton className="absolute top-0 right-0 h-5 w-[4.5rem] rounded-full" />
        <Skeleton className="h-5 w-5 rounded-md ml-auto" />
      </div>
    </div>
  )
}

/** Underline filter tabs shimmer (full width). */
function UnderlineTabsSkeleton({ count = 3 } = {}) {
  return (
    <div className="flex w-full border-b border-gray-200 mb-2 pt-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 min-w-0 pb-3 flex justify-center">
          <Skeleton className="h-3.5 w-16 max-w-[80%]" />
        </div>
      ))}
    </div>
  )
}

/** Workshop New cases page loading shell. */
function WorkshopCasesListSkeleton({ rows = 4 } = {}) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-5 shrink-0 space-y-2">
        <Skeleton className="h-8 w-40 max-w-full" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <UnderlineTabsSkeleton count={4} />
      <div className="flex-1 min-h-0 space-y-3 mt-4 pb-2">
        {Array.from({ length: rows }).map((_, i) => (
          <WorkshopCaseRowSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="shrink-0 mt-4 h-[52px] w-full rounded-xl" />
    </div>
  )
}

/** Workshop Ongoing jobs page loading shell. */
function WorkshopJobsListSkeleton({ rows = 4 } = {}) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-5 shrink-0">
        <Skeleton className="h-8 w-44 max-w-full" />
      </div>
      <UnderlineTabsSkeleton count={3} />
      <div className="flex-1 min-h-0 space-y-3 mt-4 pb-2">
        {Array.from({ length: rows }).map((_, i) => (
          <WorkshopCaseRowSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="shrink-0 mt-4 h-[52px] w-full rounded-xl" />
    </div>
  )
}

/** Matches My Cases list cards (case no + title + vehicle + status pill). */
function MyCaseCurrentCardSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-2">
      <div className="min-w-0 flex-1 pr-1 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-4/5 max-w-[14rem]" />
        <Skeleton className="h-3.5 w-2/5 max-w-[8rem]" />
        <Skeleton className="h-3 w-3/5 max-w-[11rem] mt-1" />
      </div>
      <div className="relative shrink-0 self-stretch flex items-center justify-end min-w-[3.25rem]">
        <Skeleton className="absolute top-0 right-0 h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-5 rounded-md" />
      </div>
    </div>
  )
}

/** Full My Cases tab loading shell (title + tabs + list). */
function MyCasesListSkeleton({ rows = 4 } = {}) {
  return (
    <div className="w-full max-w-md mx-auto lg:max-w-none lg:mx-0 flex flex-col h-full min-h-0">
      <Skeleton className="h-8 w-40 max-w-full mb-2 shrink-0" />
      <Skeleton className="h-4 w-64 max-w-full mb-5 shrink-0" />
      <UnderlineTabsSkeleton count={2} />
      <div className="flex-1 min-h-0 space-y-3 pb-2">
        {Array.from({ length: rows }).map((_, i) => (
          <MyCaseCurrentCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="shrink-0 mt-2 h-[42px] lg:h-[52px] w-full rounded-lg lg:rounded-xl" />
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

/** Auth / gate screens while session resolves. */
function AuthPageSkeleton() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-10 w-48 mx-auto rounded-xl" />
        <Skeleton className="h-4 w-64 max-w-full mx-auto" />
        <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4 mt-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/** PrivateRoute / generic page shell while auth loads. */
function RouteLoadingSkeleton({ cards = 6 } = {}) {
  return (
    <div className="list-page-shell bg-white">
      <div className="list-page-content max-w-7xl pt-24 md:pt-28">
        <Skeleton className="h-9 w-48 max-w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: cards }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Customer / workshop dashboard overview. */
function DashboardPageSkeleton({ stats = 4, rows = 3, showHeader = true } = {}) {
  return (
    <div className="w-full">
      {showHeader && (
        <>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-8" />
        </>
      )}
      {stats > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {Array.from({ length: stats }).map((_, i) => (
            <Skeleton key={i} className="h-28 sm:h-32 rounded-2xl" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

/** Conversation / message inbox rows. */
function ConversationListSkeleton({ rows = 4 } = {}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white divide-y divide-[#EEF0F4] overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="w-11 h-11 rounded-full shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-3.5 w-32 max-w-[55%]" />
              <Skeleton className="h-3 w-12 shrink-0" />
            </div>
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Form page (quote / settings fields). */
function FormPageSkeleton({ fields = 5 } = {}) {
  return (
    <div className="max-w-xl space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-28 w-full rounded-xl" />
      {Array.from({ length: fields }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-xl" />
      ))}
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  )
}

/** Table body shimmer rows. */
function TableRowsSkeleton({ rows = 5, cols = 4 } = {}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <tr key={row} className="border-b border-gray-50">
          {Array.from({ length: cols }).map((_, col) => (
            <td key={col} className="py-4 px-3">
              <Skeleton className={`h-4 rounded ${col === cols - 1 ? 'w-16 ml-auto' : 'w-24'}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/** Case detail screen (customer + workshop) — title, pills, description, next step, summary. */
function CaseDetailSkeleton() {
  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-8 w-36 max-w-[70%] rounded-lg" />
        <Skeleton className="h-6 w-14 rounded-full shrink-0 mt-1" />
      </div>
      <Skeleton className="h-4 w-48 max-w-[85%] mt-3 rounded-md" />
      <Skeleton className="h-3 w-56 max-w-full mt-2 rounded-md" />

      <div className="flex gap-2 mt-5 mb-6">
        <Skeleton className="h-8 w-[4.5rem] rounded-xl shrink-0" />
        <Skeleton className="h-8 w-[4.5rem] rounded-xl shrink-0" />
        <Skeleton className="h-8 w-[5.5rem] rounded-xl shrink-0" />
      </div>

      <Skeleton className="h-4 w-24 mb-2 rounded-md" />
      <Skeleton className="h-4 w-full max-w-sm rounded-md" />
      <Skeleton className="h-4 w-3/4 max-w-xs mt-1.5 rounded-md" />

      <div className="rounded-2xl bg-[#F5F7F9] p-4 mt-5 space-y-3">
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
        <Skeleton className="h-[52px] w-full rounded-xl mt-1" />
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <Skeleton className="h-5 w-24 mb-3 rounded-md" />
        <div className="divide-y divide-gray-100">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-3">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Cost summary / payment overview (title, case card, workshop card, cost rows, CTAs). */
function CostSummarySkeleton() {
  return (
    <div className="w-full max-w-xl" aria-hidden>
      <Skeleton className="h-8 w-44 max-w-[70%] rounded-lg" />
      <Skeleton className="h-4 w-64 max-w-[90%] mt-3 mb-5 rounded-md" />

      <Skeleton className="h-3 w-24 mb-2 rounded" />
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5 flex items-center gap-3 mb-5">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-40 max-w-[75%] rounded-md" />
          <Skeleton className="h-3 w-32 max-w-[60%] rounded-md" />
        </div>
        <Skeleton className="w-5 h-5 rounded-md shrink-0" />
      </div>

      <Skeleton className="h-3 w-20 mb-2 rounded" />
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5 flex items-center gap-3 mb-5">
        <Skeleton className="w-11 h-11 rounded-full shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-28 max-w-[50%] rounded-md" />
          <Skeleton className="h-3 w-48 max-w-[85%] rounded-md" />
        </div>
      </div>

      <Skeleton className="h-4 w-28 mb-3 rounded-md" />
      <div className="space-y-3 mb-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-3.5 w-14 rounded" />
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 pt-3 mb-5 flex justify-between items-center">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>

      <Skeleton className="h-[52px] w-full rounded-xl mb-3" />
      <Skeleton className="h-[52px] w-full rounded-xl" />
    </div>
  )
}

/** Choose-a-date booking calendar (title, workshop card, month grid, legend, hint). */
function BookingCalendarSkeleton() {
  return (
    <div className="w-full" aria-hidden>
      <Skeleton className="h-8 w-44 max-w-[70%] rounded-lg" />
      <Skeleton className="h-4 w-56 max-w-[85%] mt-3 mb-5 rounded-md" />

      <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-start gap-3">
        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <Skeleton className="h-4 w-28 max-w-[60%] rounded-md" />
          <Skeleton className="h-3 w-44 max-w-[90%] rounded-md" />
          <Skeleton className="h-3.5 w-28 max-w-[50%] rounded-md mt-1" />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-36 rounded-md" />
          <div className="flex items-center gap-1">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-1 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`dow-${i}`} className="flex justify-center">
              <Skeleton className="h-3 w-7 rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={`day-${i}`} className="h-11 flex items-center justify-center">
              <Skeleton className="w-9 h-9 rounded-full" />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3.5">
        <Skeleton className="w-5 h-5 rounded-md shrink-0" />
        <Skeleton className="h-4 w-full max-w-[16rem] rounded-md" />
      </div>
    </div>
  )
}

/** Review / rating list cards. */
function ReviewListSkeleton({ rows = 3 } = {}) {
  return (
    <div className="space-y-4">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-5 w-40" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  )
}

export {
  Skeleton,
  OfferRequestListCardSkeleton,
  ListCardSkeleton,
  WorkshopCaseRowSkeleton,
  UnderlineTabsSkeleton,
  WorkshopCasesListSkeleton,
  WorkshopJobsListSkeleton,
  MyCaseCurrentCardSkeleton,
  MyCasesListSkeleton,
  CaseDetailSkeleton,
  PageHeaderSkeleton,
  ProfileMenuSkeleton,
  AuthPageSkeleton,
  RouteLoadingSkeleton,
  DashboardPageSkeleton,
  ConversationListSkeleton,
  FormPageSkeleton,
  TableRowsSkeleton,
  BookingCalendarSkeleton,
  CostSummarySkeleton,
  ReviewListSkeleton,
}
