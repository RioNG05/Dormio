'use client'

import React, { useEffect } from 'react'
import './globals.css'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[Dormio Global Crash Boundary]', error)
  }, [error])

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <html lang="vi" className="h-full">
      <body className="h-full min-h-screen flex items-center justify-center p-4 sm:p-8 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased">
        <div className="w-full max-w-lg text-center space-y-6">
          {/* Status Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 shadow-md">
            <svg
              className="w-12 h-12 stroke-[1.75]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              Lỗi ứng dụng nghiêm trọng
            </h1>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Hệ thống gặp sự cố tại tầng giao diện gốc. Vui lòng thử tải lại trang hoặc quay về trang chủ.
            </p>
          </div>

          {/* Error Message Box */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400">
              <span>Chi tiết lỗi:</span>
              {error?.digest && (
                <span className="font-mono text-[11px] text-zinc-500">
                  Digest: {error.digest}
                </span>
              )}
            </div>
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 font-mono text-xs text-zinc-800 dark:text-zinc-200 break-words leading-relaxed">
              {error?.message || 'Unknown critical error occurred.'}
            </div>
          </div>

          {/* Action Buttons: [Thử lại], [Quay lại], [Về trang chủ] */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm cursor-pointer"
            >
              Thử lại
            </button>

            <button
              type="button"
              onClick={handleGoBack}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors shadow-sm cursor-pointer"
            >
              Quay lại
            </button>

            <button
              type="button"
              onClick={handleGoHome}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

