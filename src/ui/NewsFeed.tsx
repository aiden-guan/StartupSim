import { useEffect, useRef, useState } from "react";
import { formatDate } from "../simulation/date";
import type { GameState, Mail, NewsItem } from "../simulation/types";
import { useGame } from "../state/store";

type FeedItem = {
  id: string;
  kind: "news" | "mail";
  at: GameState["clock"]["date"];
  source: string;
  headline: string;
  preview: string;
  body: string;
  impact?: string;
  unread: boolean;
  major: boolean;
  createdTick: number;
  mail?: Mail;
  news?: NewsItem;
};

function itemsFrom(game: GameState): FeedItem[] {
  const news = game.news.map((item) => ({
    id: item.id,
    kind: "news" as const,
    at: item.at,
    source: item.source ?? "The Wire",
    headline: item.headline,
    preview: item.body,
    body: item.body,
    impact: item.impact,
    unread: item.read === false,
    major: item.tone === "panic",
    createdTick: item.createdTick ?? 0,
    news: item,
  }));
  const mail = game.inbox.filter((item) => item.eventKind).map((item) => ({
    id: item.id,
    kind: "mail" as const,
    at: item.at,
    source: item.from,
    headline: item.subject,
    preview: item.body,
    body: item.body,
    impact: item.impact,
    unread: !item.read,
    major: Boolean(item.requiresResponse),
    createdTick: item.createdTick ?? 0,
    mail: item,
  }));
  return [...mail, ...news].sort((a, b) => b.createdTick - a.createdTick).slice(0, 18);
}

export function NewsFeed({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const setDrawer = useGame((s) => s.setDrawer);
  const [openId, setOpenId] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const feed = itemsFrom(game);
  const unread = feed.filter((item) => item.unread).length;
  const opened = feed.find((item) => item.id === openId) ?? null;

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpenId(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function open(item: FeedItem) {
    setOpenId(item.id === openId ? null : item.id);
    if (item.kind === "news") dispatch({ type: "readNews", newsId: item.id });
    if (item.kind === "mail") dispatch({ type: "readMail", mailId: item.id });
  }

  return (
    <aside className="news-feed" ref={root} aria-label="World feed">
      <header className="news-feed-head">
        <span className="eyebrow">The Wire</span>
        {unread > 0 ? <b>{unread}</b> : <small>Live</small>}
      </header>
      <div className="news-feed-list">
        {feed.length === 0 ? <p className="news-feed-empty">The wire is quiet.</p> : null}
        {feed.map((item) => (
          <button
            key={item.id}
            className={`news-feed-item ${item.unread ? "unread" : ""} ${item.major ? "major" : ""} ${openId === item.id ? "open" : ""}`}
            aria-expanded={openId === item.id}
            onClick={() => open(item)}
          >
            <span className="news-feed-avatar" aria-hidden="true">{item.source.slice(0, 1).toUpperCase()}</span>
            <span className="news-feed-copy">
              <span className="news-feed-meta">{item.source} · {formatDate(item.at)}</span>
              <strong>{item.headline}</strong>
              <em>{item.preview}</em>
            </span>
            {item.unread ? <i className="news-unread" /> : null}
          </button>
        ))}
      </div>
      {opened ? (
        <article className="news-feed-story" role="dialog" aria-label={opened.headline}>
          <header>
            <span className="eyebrow">{opened.source} · {formatDate(opened.at)}</span>
            <button type="button" aria-label="Close story" onClick={() => setOpenId(null)}>✕</button>
          </header>
          <h3>{opened.headline}</h3>
          <p>{opened.body}</p>
          {opened.impact ? <aside><strong>What it means</strong>{opened.impact}</aside> : null}
          {opened.mail?.requiresResponse ? (
            <button className="news-feed-cta" onClick={() => { setDrawer("inbox"); setOpenId(null); }}>Open event brief →</button>
          ) : null}
        </article>
      ) : null}
    </aside>
  );
}
