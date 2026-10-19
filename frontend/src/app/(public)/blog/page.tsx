'use client'

import React, { useState } from 'react'
import { Sparkles, Calendar, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from '@/context/LanguageContext'
import { Button, ChipGroup, SearchInput, Text } from '@/components/ui'

export default function BlogPage() {
  const t = useTranslations('guest')

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const articles = [
    {
      id: '1',
      category: 'management',
      categoryName: t('guestBlogCatMgmt'),
      title: t('guestBlogArticle1Title'),
      desc: t('guestBlogArticle1Desc'),
      author: 'Nguyễn Văn Rio',
      date: '26/08/2026',
      readTime: t('guestBlogArticle1ReadTime'),
      image:
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
      featured: true,
    },
    {
      id: '2',
      category: 'tenant',
      categoryName: t('guestBlogCatTenant'),
      title: t('guestBlogArticle2Title'),
      desc: t('guestBlogArticle2Desc'),
      author: 'Trần Thị Lan',
      date: '24/08/2026',
      readTime: t('guestBlogArticle2ReadTime'),
      image:
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      featured: false,
    },
    {
      id: '3',
      category: 'legal',
      categoryName: t('guestBlogCatLegal'),
      title: t('guestBlogArticle3Title'),
      desc: t('guestBlogArticle3Desc'),
      author: 'Lê Hoàng Nam',
      date: '20/08/2026',
      readTime: t('guestBlogArticle3ReadTime'),
      image:
        'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      featured: false,
    },
    {
      id: '4',
      category: 'management',
      categoryName: t('guestBlogCatMgmt'),
      title: t('guestBlogArticle4Title'),
      desc: t('guestBlogArticle4Desc'),
      author: 'Phạm Văn Đức',
      date: '15/08/2026',
      readTime: t('guestBlogArticle4ReadTime'),
      image:
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      featured: false,
    },
    {
      id: '5',
      category: 'management',
      categoryName: t('guestBlogCatMgmt'),
      title: t('guestBlogArticle5Title'),
      desc: t('guestBlogArticle5Desc'),
      author: 'Nguyễn Văn Rio',
      date: '10/08/2026',
      readTime: t('guestBlogArticle5ReadTime'),
      image:
        'https://images.unsplash.com/photo-1556742049-0a67d577c77e?auto=format&fit=crop&w=800&q=80',
      featured: false,
    },
    {
      id: '6',
      category: 'tenant',
      categoryName: t('guestBlogCatTenant'),
      title: t('guestBlogArticle6Title'),
      desc: t('guestBlogArticle6Desc'),
      author: 'Nguyễn Hà My',
      date: '05/08/2026',
      readTime: t('guestBlogArticle6ReadTime'),
      image:
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      featured: false,
    },
  ]

  const featuredPost = articles.find(a => a.featured) || articles[0]

  const filteredArticles = articles.filter(item => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchQuery =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchQuery
  })

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20 overflow-x-hidden">
      {/* 100% Full-Width Screen Hero Banner Header */}
      <section className="relative w-full py-12 sm:py-20 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <div>
            <Text
              as="h1" variant='heading' weight='extrabold' color="white"
              className='text-3xl sm:text-5xl lg:text-6xl leading-[1.18] drop-shadow-md'
            >
              {t('guestBlogTitle1')}
            </Text>{' '}
            <br className="hidden sm:inline" />
            <Text
              as="h1" variant='heading' weight='extrabold'
              className='text-3xl sm:text-5xl lg:text-6xl leading-[1.18] drop-shadow-md bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] via-[#FFAE42] to-[#FF6B35] bg-clip-text text-transparent'
            >
              {t('guestBlogTitle2')}
            </Text>
          </div>

          <Text
            variant="subtitle"
            size="xs"
            weight="medium"
            className="sm:text-sm text-zinc-300 leading-relaxed max-w-xl mx-auto text-balance"
          >
            {t('guestBlogSubtitle')}
          </Text>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-12 w-full">
        {/* Featured Article Spotlight Card */}
        {featuredPost && (
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 rounded-3xl p-5 sm:p-8 text-white shadow-2xl border border-[#FF6B35]/30 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center group cursor-pointer hover:border-[#FF6B35] hover:shadow-xl hover:shadow-[#FF6B35]/15 transition-all duration-300">
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div>
                  <Text
                    as="span"
                    variant="badge"
                    weight="black"
                    color="white"
                    size='xs'
                    uppercase
                    className="px-3 py-1 bg-[#FF6B35] rounded-full tracking-wider shadow-lg shadow-[#FF6B35]/30 shrink-0"
                  >
                    {t('guestBlogFeaturedBadge')}
                  </Text>
                </div>
                <div className='flex items-center justify-center gap-1'>
                  <Calendar className="w-3.5 h-3.5 text-[#FF6B35]" />
                  <Text
                    as="span"
                    size="xs"
                    weight="bold"
                    color="subtle"
                  >
                    {featuredPost.date}
                  </Text>
                </div>
              </div>

              <Text
                as="h2"
                variant="heading"
                weight="black"
                color="white"
                className="text-xl sm:text-3xl lg:text-4xl leading-snug group-hover:text-[#FF6B35] transition-colors"
              >
                {featuredPost.title}
              </Text>

              <Text
                variant="body"
                size="xs"
                weight="medium"
                clamp={3}
                className="sm:text-sm text-zinc-300 leading-relaxed"
              >
                {featuredPost.desc}
              </Text>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Text
                    as="span"
                    size="xs"
                    weight="bold"
                    color="subtle"
                    className="flex items-center gap-1"
                  >
                    <User className="w-3.5 h-3.5 text-[#FF6B35]" />
                    <Text as="span" color="inherit">
                      {t('guestBlogAuthorLabel')} {featuredPost.author}
                    </Text>
                  </Text>
                  <Text as="span" size="xs" weight="bold" color="subtle" className="hidden sm:inline">
                    •
                  </Text>
                  <Text as="span" size="xs" weight="bold" color="subtle">
                    {featuredPost.readTime}
                  </Text>
                </div>

                <Link
                  href={`/blog/${featuredPost.id}`}
                  className="inline-flex items-center gap-1.5 text-[#FF6B35] group-hover:translate-x-1.5 transition-transform"
                >
                  <Text as="span" size="xs" weight="black" color="orange">
                    {t('guestBlogReadNow')}
                  </Text>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 aspect-video overflow-hidden rounded-2xl bg-zinc-800 border border-[#FF6B35]/20 shadow-lg relative group">
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <Text
                as="span"
                variant="badge"
                size="3xs"
                weight="black"
                color="orange"
                className="absolute bottom-3 right-3 px-3 py-1 bg-zinc-950/80 backdrop-blur-md rounded-full border border-[#FF6B35]/30"
              >
                {t('guestBlogHotTopic')}
              </Text>
            </div>
          </div>
        )}

        {/* Filter Tabs using ChipGroup & Real-Time Search Bar using SearchInput */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-zinc-100 pb-6">
          <ChipGroup
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[
              { value: 'all', label: t('guestBlogCatAll') },
              { value: 'management', label: t('guestBlogCatMgmt') },
              { value: 'tenant', label: t('guestBlogCatTenant') },
              { value: 'legal', label: t('guestBlogCatLegal') },
            ]}
            className="justify-center sm:justify-start w-full md:w-auto"
          />

          <SearchInput
            value={searchQuery}
            onImmediateChange={setSearchQuery}
            onChange={setSearchQuery}
            placeholder={t('guestBlogSearchPlaceholder')}
            containerClassName="w-full md:w-72"
            className="bg-zinc-50 rounded-full"
          />
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-zinc-50 rounded-3xl border border-zinc-200 space-y-2">
            <Text as="h3" variant="heading" size="lg" weight="black">
              {t('guestBlogNotFoundTitle')}
            </Text>
            <Text variant="subtitle" size="xs">
              {t('guestBlogNotFoundSub')}
            </Text>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredArticles.map(article => (
              <Link
                href={`/blog/${article.id}`}
                key={article.id}
                className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <Text
                      as="span"
                      variant="badge"
                      size="3xs"
                      weight="extrabold"
                      color="brand"
                      className="absolute top-3 left-3 px-3 py-1 bg-zinc-900/80 backdrop-blur-md rounded-full"
                    >
                      {article.categoryName}
                    </Text>
                  </div>

                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <Text
                        as="span"
                        variant="caption"
                        size="2xs"
                        weight="semibold"
                        color="subtle"
                        className="flex items-center gap-1"
                      >
                        <User className="w-3 h-3 text-[#2AC1BC]" />
                        <Text as="span" color="inherit">
                          {article.author}
                        </Text>
                      </Text>
                      <Text as="span" variant="caption" size="2xs" weight="semibold" color="subtle">
                        •
                      </Text>
                      <Text
                        as="span"
                        variant="caption"
                        size="2xs"
                        weight="semibold"
                        color="subtle"
                        className="flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        <Text as="span" color="inherit">
                          {article.date}
                        </Text>
                      </Text>
                    </div>

                    <Text
                      as="h3"
                      variant="heading"
                      size="base"
                      weight="extrabold"
                      clamp={2}
                      className="leading-snug group-hover:text-[#2AC1BC] transition-colors"
                    >
                      {article.title}
                    </Text>

                    <Text
                      variant="body"
                      size="xs"
                      weight="medium"
                      color="secondary"
                      clamp={3}
                      className="leading-relaxed"
                    >
                      {article.desc}
                    </Text>
                  </div>
                </div>

                <div className="p-5 sm:p-6 pt-0 border-t border-zinc-100/60 mt-4 flex items-center justify-between text-[#2AC1BC]">
                  <Text as="span" size="xs" weight="bold" color="brand">
                    {article.readTime}
                  </Text>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Bottom CTA Banner */}
        <div className="bg-zinc-900 rounded-3xl p-6 sm:p-12 text-white text-center space-y-6 shadow-2xl border border-zinc-800 mt-12">
          <Text
            as="h2"
            variant="heading"
            size="xl"
            weight="black"
            color="white"
            className="sm:text-4xl leading-snug"
          >
            {t('guestContactCtaTitle')}
          </Text>
          <Text
            variant="subtitle"
            size="xs"
            weight="medium"
            color="subtle"
            className="sm:text-sm max-w-lg mx-auto leading-relaxed"
          >
            {t('guestContactCtaSubtitle')}
          </Text>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<span>&rarr;</span>}
                className="w-full sm:w-auto rounded-2xl shadow-lg shadow-[#2AC1BC]/30 hover:scale-105"
              >
                {t('guestFeaturesTrialBtn')}
              </Button>
            </Link>
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button
                variant="dark"
                size="lg"
                className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 rounded-2xl"
              >
                {t('guestFeaturesViewPricingBtn')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
