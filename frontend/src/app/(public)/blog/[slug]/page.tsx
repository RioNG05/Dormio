'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Calendar, Clock, ChevronRight, ArrowLeft, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Text, Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'

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
              <Avatar
                src={post.author.avatar}
                name={post.author.name}
                size="md"
                bordered
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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <Text
                  as="h1"
                  variant="heading"
                  size={{ base: 'xl', sm: '2xl' }}
                  weight="black"
                  className="mt-8 mb-4 first:mt-0 tracking-tight"
                >
                  {children}
                </Text>
              ),
              h2: ({ children }) => (
                <Text
                  as="h2"
                  variant="heading"
                  size={{ base: 'lg', sm: 'xl' }}
                  weight="extrabold"
                  className="mt-8 mb-3 first:mt-0 tracking-tight"
                >
                  {children}
                </Text>
              ),
              h3: ({ children }) => (
                <Text
                  as="h3"
                  variant="heading"
                  size={{ base: 'base', sm: 'lg' }}
                  weight="bold"
                  className="mt-6 mb-3 first:mt-0 tracking-tight text-foreground"
                >
                  {children}
                </Text>
              ),
              h4: ({ children }) => (
                <Text
                  as="h4"
                  variant="heading"
                  size="sm"
                  weight="bold"
                  className="mt-5 mb-2 first:mt-0 tracking-tight"
                >
                  {children}
                </Text>
              ),
              p: ({ children }) => (
                <Text
                  as="p"
                  variant="body"
                  size={{ base: 'xs', sm: 'sm' }}
                  className="my-3 leading-relaxed text-foreground/90"
                >
                  {children}
                </Text>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-foreground">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-foreground/80">
                  {children}
                </em>
              ),
              ul: ({ children }) => (
                <ul className="my-4 space-y-2 list-disc list-inside text-xs sm:text-sm text-foreground/90 pl-1">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="my-4 space-y-2 list-decimal list-inside text-xs sm:text-sm text-foreground/90 pl-1">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed marker:text-[#2AC1BC]">
                  {children}
                </li>
              ),
              hr: () => <hr className="my-8 border-line" />,
              blockquote: ({ children }) => (
                <blockquote className="my-4 border-l-4 border-[#2AC1BC] bg-card-hover/40 rounded-r-xl py-3 px-4 italic text-muted text-xs sm:text-sm">
                  {children}
                </blockquote>
              ),
              code: ({ children, className }) => (
                <code className={cn('px-1.5 py-0.5 rounded-md bg-card-hover text-[#2AC1BC] font-mono text-xs', className)}>
                  {children}
                </code>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target={href?.startsWith('http') ? '_blank' : undefined}
                  rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="text-[#2AC1BC] hover:underline font-semibold"
                >
                  {children}
                </a>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
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
