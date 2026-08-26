import { useMemo, useState } from "react";

type HubCard = { title: string; subtitle: string; icon: string; href: string; gradient: string };

const cards: HubCard[] = [
  { title: "مقاطع ريلز", subtitle: "مقاطع قصيرة ومحتوى يومي", icon: "▶", href: "https://www.youtube.com/shorts", gradient: "linear-gradient(135deg,#ff4d8d,#ff8a3d)" },
  { title: "فيديوهات جديدة", subtitle: "فيديوهات حديثة من الويب", icon: "🎬", href: "https://www.youtube.com/feed/trending", gradient: "linear-gradient(135deg,#7c4dff,#00b8d4)" },
  { title: "الأصدقاء", subtitle: "تواصل ومشاركة مع الأصدقاء", icon: "👥", href: "https://www.facebook.com/friends", gradient: "linear-gradient(135deg,#1877f2,#4facfe)" },
  { title: "المنشورات", subtitle: "آخر المنشورات والأخبار", icon: "📝", href: "https://x.com/explore", gradient: "linear-gradient(135deg,#111827,#475569)" },
  { title: "المجموعات", subtitle: "اكتشف المجتمعات النشطة", icon: "👨‍👩‍👧‍👦", href: "https://www.facebook.com/groups/feed/", gradient: "linear-gradient(135deg,#00a86b,#34d399)" },
  { title: "المقالات", subtitle: "مقالات وأخبار من الويب", icon: "📰", href: "https://news.google.com/", gradient: "linear-gradient(135deg,#ffb300,#ff7043)" },
  { title: "الألعاب", subtitle: "ألعاب وتطبيقات Google Play", icon: "🎮", href: "https://play.google.com/store/games", gradient: "linear-gradient(135deg,#8e24aa,#3949ab)" }
];

export default function App() {
  const [query, setQuery] = useState("");
  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((card) => `${card.title} ${card.subtitle}`.toLowerCase().includes(q));
  }, [query]);

  const searchGoogle = () => {
    const q = query.trim();
    if (q) window.location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  };

  return (
    <main className="app-shell" dir="rtl">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <section className="phone-stage">
        <header className="hero">
          <div className="brand-mark">G</div>
          <div className="brand-copy"><span className="eyebrow">Dr. Malek • Smart Hub</span><h1>مركزك الرقمي</h1><p>بحث، فيديو، أصدقاء، منشورات، مجموعات، مقالات وألعاب في واجهة واحدة.</p></div>
        </header>
        <section className="search-card" aria-label="Google search">
          <div className="google-letter">G</div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && searchGoogle()} placeholder="ابحث في Google..." aria-label="ابحث في Google" />
          <button className="search-button" onClick={searchGoogle} aria-label="بحث">⌕</button>
        </section>
        <section className="grid" aria-label="الأقسام">
          {filteredCards.map((card) => <a className="hub-card" key={card.title} href={card.href} rel="noreferrer"><span className="card-icon" style={{ background: card.gradient }}>{card.icon}</span><span className="card-text"><strong>{card.title}</strong><small>{card.subtitle}</small></span><span className="arrow">←</span></a>)}
        </section>
        {filteredCards.length === 0 && <div className="empty">لا توجد نتيجة داخل الأقسام. اضغط Enter للبحث في Google.</div>}
        <footer className="footer-card"><div><strong>تصميم وبرمجة الدكتور / مالك الرميمة</strong><span>واجهة عالية الدقة • تعمل على الويب وAndroid</span></div><a href="tel:771134103">771134103</a></footer>
      </section>
    </main>
  );
}
