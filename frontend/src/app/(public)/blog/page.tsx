import React from "react";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";

export default function BlogPage() {
  const posts = [
    {
      id: "1",
      title: "Kinh nghiệm quản lý nhà trọ chống thất thoát điện nước",
      excerpt: "Chia sẻ những bí quyết thực tế giúp chủ trọ quản lý chỉ số điện nước chính xác, tránh tình trạng gian lận và thất thoát...",
      date: "20 Tháng 10, 2026",
      category: "Kinh nghiệm",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "2",
      title: "Mẫu hợp đồng thuê phòng trọ chuẩn pháp lý mới nhất 2026",
      excerpt: "Tổng hợp các mẫu hợp đồng thuê nhà, phòng trọ chặt chẽ, đầy đủ điều khoản pháp lý giúp bảo vệ quyền lợi của cả hai bên...",
      date: "15 Tháng 10, 2026",
      category: "Pháp lý",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "3",
      title: "Bí kíp giữ chân khách thuê trọ ở lâu dài",
      excerpt: "Khách thuê liên tục chuyển đi là nỗi đau đầu của nhiều chủ nhà. Dưới đây là những cách đơn giản nhưng hiệu quả để giữ chân khách tốt...",
      date: "05 Tháng 10, 2026",
      category: "Vận hành",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "4",
      title: "Phần mềm quản lý nhà trọ giúp tối ưu lợi nhuận như thế nào?",
      excerpt: "Thay vì dùng sổ sách hay Excel dễ nhầm lẫn, việc chuyển đổi số với các nền tảng SaaS mang lại giá trị vượt trội về hiệu suất...",
      date: "01 Tháng 10, 2026",
      category: "Công nghệ",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <section className="pt-16 pb-12 bg-zinc-50 border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl mb-4">
            Blog & Tin tức
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Cập nhật những kiến thức, kinh nghiệm và tin tức mới nhất về quản lý nhà trọ, bất động sản cho thuê.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-10">
            {posts.map((post) => (
              <article key={post.id} className="group flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="sm:w-2/5 aspect-[4/3] sm:aspect-auto relative overflow-hidden bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                    {post.category}
                  </div>
                </div>
                <div className="sm:w-3/5 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center text-xs text-zinc-400 mb-3 gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </div>
                    <Link href={`/blog/${post.id}`} className="block group-hover:text-primary transition-colors">
                      <h3 className="text-xl font-bold text-zinc-900 leading-tight mb-3 line-clamp-2">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-zinc-600 text-sm line-clamp-3 leading-relaxed mb-6">
                      {post.excerpt}
                    </p>
                  </div>
                  <Link href={`/blog/${post.id}`} className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
                    Đọc tiếp <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
