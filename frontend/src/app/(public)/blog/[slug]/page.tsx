'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Calendar, Clock, ChevronRight, ArrowLeft, Copy, Check } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Text } from '@/components/ui'

export default function BlogDetailPage() {
  const tGuest = useTranslations('guest')
  const tNav = useTranslations('nav')

  const params = useParams()
  const _slug = params?.slug || 'kinh-nghiem-quan-ly-nha-tro-chong-that-thoat-dien-nuoc'
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Mock Post Detail
  const post = {
    title: tGuest('guestBlogDetailPostTitle'),
    date: '25/08/2026',
    readTime: `6 ${tGuest('guestBlogDetailReadTimePrefix')}`,
    category: tGuest('guestBlogDetailPostCategory'),
    author: {
      name: 'Nguyễn Văn Hùng',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      role: tGuest('guestBlogDetailAuthorRole'),
    },
    image:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
    content: tGuest('guestBlogDetailPostContent'),
  }

  const relatedPosts = [
    {
      slug: 'mau-hop-dong-thue-phong-tro-chuan-phap-ly-2026',
      title: tGuest('guestBlogDetailRelated1Title'),
      image:
        'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=600&q=80',
      date: '20/08/2026',
    },
    {
      slug: 'gach-no-tu-dong-vietqr-tang-30-percent-dong-tien',
      title: tGuest('guestBlogDetailRelated2Title'),
      image:
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
      date: '12/08/2026',
    },
  ]

  return (
    <div className="bg-surface/50 min-h-screen pb-24">
      {/* Breadcrumb Bar */}
      <div className="bg-card border-b border-line py-3 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl flex items-center gap-2 text-muted overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-[#2AC1BC]">
            <Text as="span" size="xs" weight="semibold" color="inherit">
              {tNav('home')}
            </Text>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />
          <Link href="/blog" className="hover:text-[#2AC1BC]">
            <Text as="span" size="xs" weight="semibold" color="inherit">
              {tNav('blog')}
            </Text>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />
          <Text as="span" size="xs" weight="semibold" color="brand" clamp={1}>
            {post.title}
          </Text>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-muted hover:text-[#2AC1BC] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <Text as="span" size="xs" weight="bold" color="inherit">
            {tGuest('guestBlogDetailBackToBlog')}
          </Text>
        </Link>

        {/* Article Header */}
        <div className="flex flex-col gap-4 mb-8">
          <Text
            as="span"
            variant="badge"
            size="xs"
            weight="bold"
            color="brand"
            className="px-3.5 py-1 rounded-full bg-[#2ac1bc]/10 w-fit"
          >
            {post.category}
          </Text>
          <Text
            as="h1"
            variant="heading"
            size="2xl"
            weight="black"
            className="sm:text-4xl leading-tight [text-wrap:balance]"
          >
            {post.title}
          </Text>

          {/* Author Card & Meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-b border-line py-4">
            <div className="flex items-center gap-3">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover border border-line"
              />
              <div>
                <Text as="span" size="xs" weight="bold" className="block">
                  {post.author.name}
                </Text>
                <Text as="span" variant="caption" size="3xs" color="subtle" className="block">
                  {post.author.role}
                </Text>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Text as="span" size="xs" color="secondary" className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <Text as="span" color="inherit">
                  {post.date}
                </Text>
              </Text>
              <Text as="span" size="xs" color="secondary" className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <Text as="span" color="inherit">
                  {post.readTime}
                </Text>
              </Text>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleCopyLink}
                leftIcon={
                  copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
              >
                {copied ? tGuest('guestBlogDetailCopied') : tGuest('guestBlogDetailShare')}
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Cover Image */}
        <div className="rounded-3xl overflow-hidden aspect-[16/9] bg-card-hover mb-10 shadow-md">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        </div>

        {/* Article Body Content */}
        <div className="bg-card rounded-3xl p-6 sm:p-10 border border-line shadow-sm mb-12">
          <Text
            as="div"
            variant="body"
            size="xs"
            weight="medium"
            className="prose prose-zinc max-w-none sm:text-sm leading-relaxed whitespace-pre-line"
          >
            {post.content}
          </Text>
        </div>

        {/* RELATED ARTICLES */}
        <div className="pt-8 border-t border-line">
          <Text as="h3" variant="heading" size="xl" weight="bold" className="mb-6">
            {tGuest('guestBlogDetailRelatedPosts')}
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedPosts.map((item, idx) => (
              <Link
                key={idx}
                href={`/blog/${item.slug}`}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-line hover:border-[#2ac1bc]/40 hover:shadow-md transition-all"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-card-hover">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div>
                  <Text
                    as="span"
                    variant="caption"
                    size="3xs"
                    color="subtle"
                    className="flex items-center gap-1 mb-1"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <Text as="span" color="inherit">
                      {item.date}
                    </Text>
                  </Text>
                  <Text
                    as="h4"
                    variant="heading"
                    size="xs"
                    weight="bold"
                    clamp={2}
                    className="group-hover:text-[#2ac1bc] leading-snug"
                  >
                    {item.title}
                  </Text>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
