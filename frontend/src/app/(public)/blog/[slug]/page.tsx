"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check
} from "lucide-react";
import { useTranslations } from "@/context/LanguageContext";

export default function BlogDetailPage() {
  const tGuest = useTranslations("guest");
  const tNav = useTranslations("nav");

  const params = useParams();
  const slug = params?.slug || "kinh-nghiem-quan-ly-nha-tro-chong-that-thoat-dien-nuoc";
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Mock Post Detail
  const post = {
    title: tGuest("guestBlogDetailPostTitle"),
    date: "25/08/2026",
    readTime: `6 ${tGuest("guestBlogDetailReadTimePrefix")}`,
    category: tGuest("guestBlogDetailPostCategory"),
    author: {
      name: "Nguyễn Văn Hùng",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      role: tGuest("guestBlogDetailAuthorRole"),
    },
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
    content: tGuest("guestBlogDetailPostContent"),
  };

  const relatedPosts = [
    {
      slug: "mau-hop-dong-thue-phong-tro-chuan-phap-ly-2026",
      title: tGuest("guestBlogDetailRelated1Title"),
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=600&q=80",
      date: "20/08/2026",
    },
    {
      slug: "gach-no-tu-dong-vietqr-tang-30-percent-dong-tien",
      title: tGuest("guestBlogDetailRelated2Title"),
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
      date: "12/08/2026",
    },
  ];

  return (
    <div className="bg-zinc-50/50 min-h-screen pb-24">
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-zinc-200/80 py-3 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl flex items-center gap-2 text-xs font-semibold text-zinc-500 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-[#2AC1BC]">{tNav("home")}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <Link href="/blog" className="hover:text-[#2AC1BC]">{tNav("blog")}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-[#2AC1BC] line-clamp-1">{post.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Back Link */}
        <Link href="/blog" className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-[#2AC1BC] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {tGuest("guestBlogDetailBackToBlog")}
        </Link>

        {/* Article Header */}
        <div className="flex flex-col gap-4 mb-8">
          <span className="px-3.5 py-1 rounded-full bg-[#2ac1bc]/10 text-[#2ac1bc] text-xs font-bold w-fit">
            {post.category}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 leading-tight [text-wrap:balance]">
            {post.title}
          </h1>

          {/* Author Card & Meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-b border-zinc-200/80 py-4">
            <div className="flex items-center gap-3">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover border border-zinc-200"
              />
              <div>
                <span className="text-xs font-bold text-zinc-900 block">{post.author.name}</span>
                <span className="text-[10px] text-zinc-400 block">{post.author.role}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {post.readTime}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 font-bold hover:bg-zinc-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? tGuest("guestBlogDetailCopied") : tGuest("guestBlogDetailShare")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Featured Cover Image */}
        <div className="rounded-3xl overflow-hidden aspect-[16/9] bg-zinc-100 mb-10 shadow-md">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body Content */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200/80 shadow-sm mb-12">
          <div className="prose prose-zinc max-w-none text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-line font-medium">
            {post.content}
          </div>
        </div>

        {/* RELATED ARTICLES */}
        <div className="pt-8 border-t border-zinc-200">
          <h3 className="text-xl font-bold text-zinc-900 mb-6">{tGuest("guestBlogDetailRelatedPosts")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedPosts.map((item, idx) => (
              <Link
                key={idx}
                href={`/blog/${item.slug}`}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-zinc-200/80 hover:border-[#2ac1bc]/40 hover:shadow-md transition-all"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-100">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> {item.date}
                  </span>
                  <h4 className="text-xs font-bold text-zinc-900 group-hover:text-[#2ac1bc] line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
