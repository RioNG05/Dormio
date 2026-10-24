'use client'

import React from 'react'

export function StaffOverviewSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-pulse">
      {/* Banner Skeleton */}
      <div className="bg-card rounded-3xl border border-line shadow-2xs p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2.5 flex-1">
          <div className="h-5 w-24 bg-line rounded-full" />
          <div className="h-8 w-64 bg-line rounded-xl" />
          <div className="h-4 w-48 bg-card-hover rounded-md" />
        </div>
        <div className="h-14 w-48 bg-line rounded-2xl shrink-0" />
      </div>

      {/* 2-Column Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-3xl border border-line shadow-2xs p-6 sm:p-7 space-y-6">
            <div className="flex justify-between items-center pb-5 border-b border-line">
              <div className="space-y-2">
                <div className="h-4 w-28 bg-line rounded-md" />
                <div className="h-7 w-52 bg-line rounded-lg" />
              </div>
              <div className="h-8 w-32 bg-line rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-20 bg-card-hover rounded-2xl" />
              <div className="h-20 bg-card-hover rounded-2xl" />
              <div className="h-20 bg-card-hover rounded-2xl" />
            </div>
            <div className="h-48 bg-card-hover rounded-2xl" />
            <div className="space-y-3 pt-2">
              <div className="h-5 w-36 bg-line rounded-md" />
              <div className="h-16 bg-surface rounded-2xl border border-line" />
              <div className="h-16 bg-surface rounded-2xl border border-line" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-3xl border border-line shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="h-5 w-32 bg-line rounded-md" />
            <div className="h-16 bg-card-hover rounded-2xl" />
            <div className="h-16 bg-card-hover rounded-2xl" />
          </div>
          <div className="bg-card rounded-3xl border border-line shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="h-5 w-40 bg-line rounded-md" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 bg-card-hover rounded-2xl" />
              <div className="h-20 bg-card-hover rounded-2xl" />
              <div className="h-20 bg-card-hover rounded-2xl" />
              <div className="h-20 bg-card-hover rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
