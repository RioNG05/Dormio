"use client";

import React, { useState } from "react";
import { Sparkles, Calendar, User, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "@/context/LanguageContext";

export default function BlogPage() {
  const t = useTranslations("blogPage");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getCategoryName = (cat: string) => {
    if (cat === "management") return t("catMgmt");
    if (cat === "tenant") return t("catTenant");
    if (cat === "legal") return t("catLegal");
    return cat;
  };

  const articles = [
    {
      id: "1",
      category: "management",
      title: t("article1Title"),
      desc: t("article1Desc"),
      author: "Nguyễn Văn Rio",
      date: "26/08/2026",
      readTime: t("article1ReadTime"),
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
      featured: true
    },
    {
      id: "2",
      category: "tenant",
      title: t("article2Title"),
      desc: t("article2Desc"),
      author: "Trần Thị Lan",
      date: "24/08/2026",
      readTime: t("article2ReadTime"),
      image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      featured: false
    },
    {
      id: "3",
      category: "legal",
      title: t("article3Title"),
      desc: t("article3Desc"),
      author: "Lê Hoàng Nam",
      date: "20/08/2026",
      readTime: t("article3ReadTime"),
      image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80",
      featured: false
    },
    {
      id: "4",
      category: "management",
      title: t("article4Title"),
      desc: t("article4Desc"),
      author: "Phạm Văn Đức",
      date: "15/08/2026",
      readTime: t("article4ReadTime"),
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      featured: false
    },
    {
      id: "5",
      category: "management",
      title: t("article5Title"),
      desc: t("article5Desc"),
      author: "Nguyễn Văn Rio",
      date: "10/08/2026",
      readTime: t("article5ReadTime"),
      image: "https://images.unsplash.com/photo-1556742049-0a67d577c77e?auto=format&fit=crop&w=800&q=80",
      featured: false
    },
    {
      id: "6",
      category: "tenant",
      title: t("article6Title"),
      desc: t("article6Desc"),
      author: "Nguyễn Hà My",
      date: "05/08/2026",
      readTime: t("article6ReadTime"),
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      featured: false
    }
  ];

  const featuredPost = articles.find((a) => a.featured) || articles[0];

  const filteredArticles = articles.filter((item) => {
    const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchQuery =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20 overflow-x-hidden">
      
      {/* 100% Full-Width Screen Hero Banner Header */}
      <section className="relative w-full py-12 sm:py-20 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2AC1BC]/20 text-[#2AC1BC] text-xs font-black rounded-full border border-[#2AC1BC]/30 shadow-lg">
            <Sparkles className="w-3.5 h-3.5" /> {t("badge")}
          </span>

          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.2] drop-shadow-md">
            <span>{t("title1")}</span> <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] via-[#FFAE42] to-[#FF6B35] bg-clip-text text-transparent">
              {t("title2")}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-xl mx-auto text-balance">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-12 w-full">
        
        {/* Featured Article Spotlight Card (Leveraging Primary Orange #FF6B35 - 100% Mobile Responsive) */}
        {featuredPost && (
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 rounded-3xl p-5 sm:p-8 text-white shadow-2xl border border-[#FF6B35]/30 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center group cursor-pointer hover:border-[#FF6B35] hover:shadow-xl hover:shadow-[#FF6B35]/15 transition-all duration-300">
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="px-3 py-1 bg-[#FF6B35] text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-lg shadow-[#FF6B35]/30 flex items-center gap-1.5 shrink-0">
                  <Sparkles className="w-3 h-3 fill-white" /> {t("featuredBadge")}
                </span>
                <span className="text-xs text-zinc-400 font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#FF6B35]" /> {featuredPost.date}
                </span>
              </div>

              <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-snug group-hover:text-[#FF6B35] transition-colors">
                {featuredPost.title}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed line-clamp-3">
                {featuredPost.desc}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-bold">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-[#FF6B35]" /> {t("authorLabel")} {featuredPost.author}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{featuredPost.readTime}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#FF6B35] group-hover:translate-x-1.5 transition-transform">
                  <span>{t("readNow")}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 aspect-video overflow-hidden rounded-2xl bg-zinc-800 border border-[#FF6B35]/20 shadow-lg relative group">
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute bottom-3 right-3 px-3 py-1 bg-zinc-950/80 backdrop-blur-md text-[#FF6B35] text-[10px] font-black rounded-full border border-[#FF6B35]/30">
                {t("hotTopic")}
              </span>
            </div>
          </div>
        )}

        {/* Filter Tabs & Real-Time Search Bar (100% Mobile Responsive Stack) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-zinc-100 pb-6">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 w-full md:w-auto">
            {[
              { id: "all", label: t("catAll") },
              { id: "management", label: t("catMgmt") },
              { id: "tenant", label: t("catTenant") },
              { id: "legal", label: t("catLegal") },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 sm:px-4 py-2 rounded-full font-extrabold text-xs transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[#2AC1BC] text-white shadow-md shadow-[#2AC1BC]/25"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Real-time Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
            />
          </div>
        </div>

        {/* Articles Grid (100% Reliable Images & Clean Cards) */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-zinc-50 rounded-3xl border border-zinc-200 space-y-2">
            <h3 className="text-lg font-black text-zinc-800">{t("notFoundTitle")}</h3>
            <p className="text-xs text-zinc-500">{t("notFoundSub")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredArticles.map((article) => (
              <div
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
                    <span className="absolute top-3 left-3 px-3 py-1 bg-zinc-900/80 backdrop-blur-md text-[#2AC1BC] text-[10px] font-extrabold rounded-full">
                      {getCategoryName(article.category)}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-semibold">
                      <span className="flex items-center gap-1"><User className="w-3 h-3 text-[#2AC1BC]" /> {article.author}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.date}</span>
                    </div>

                    <h3 className="font-extrabold text-zinc-900 text-base leading-snug group-hover:text-[#2AC1BC] transition-colors line-clamp-2">
                      {article.title}
                    </h3>

                    <p className="text-xs text-zinc-500 font-medium leading-relaxed line-clamp-3">
                      {article.desc}
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6 pt-0 border-t border-zinc-100/60 mt-4 flex items-center justify-between text-xs font-bold text-[#2AC1BC]">
                  <span>{article.readTime}</span>
                  <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>{t("readMore")}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA Banner (100% Mobile Responsive) */}
        <div className="bg-zinc-900 rounded-3xl p-6 sm:p-12 text-white text-center space-y-6 shadow-2xl border border-zinc-800 mt-12">
          <h2 className="text-xl sm:text-4xl font-black text-white leading-snug">
            {t("title1")} {t("title2")}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto font-medium leading-relaxed">
            {t("subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <Link href="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/30 transition-all cursor-pointer hover:scale-105">
                {t("readNow")} &rarr;
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

