import { useMemo, useState } from "react";
import { ACTOR_BY_ID } from "../../data/social";
import { formatDate } from "../../simulation/date";
import type { GameState, SocialDm, SocialPost } from "../../simulation/types";
import { useGame } from "../../state/store";

export function SocialPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const social = game.social ?? { posts: [], dms: [], triggeredMilestones: [], lastAmbientTick: 0 };
  const [activeTab, setActiveTab] = useState<"feed" | "dms">("feed");

  const unreadDmsCount = social.dms.filter((d) => !d.read).length;

  // Group DMs by actor
  const dmsByActor = useMemo(() => {
    const map = new Map<string, SocialDm[]>();
    for (const dm of social.dms) {
      const list = map.get(dm.actorId) ?? [];
      list.push(dm);
      map.set(dm.actorId, list);
    }
    return map;
  }, [social.dms]);

  const actorIdsWithDms = Array.from(dmsByActor.keys());
  const [selectedActorId, setSelectedActorId] = useState<string>(
    actorIdsWithDms.find((id) => dmsByActor.get(id)?.some((d) => !d.read)) ?? actorIdsWithDms[0] ?? "chad",
  );

  const activeActorDms = dmsByActor.get(selectedActorId) ?? [];
  const selectedActor = ACTOR_BY_ID[selectedActorId] ?? {
    id: selectedActorId,
    name: selectedActorId,
    handle: selectedActorId,
    bio: "Silicon Valley Operator",
    role: "observer",
    avatarBg: "#2d3748",
    avatarInitial: selectedActorId[0]?.toUpperCase() ?? "?",
    verified: false,
  };

  const handleSelectActor = (actorId: string) => {
    setSelectedActorId(actorId);
    dispatch({ type: "readSocialDm", actorId });
  };

  return (
    <div className="social-workspace space-y-4">
      <div className="flex items-center justify-between border-b border-[#c8d3bb] pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === "feed"
                ? "bg-[#355344] text-[#f7f4e9]"
                : "bg-[#e5ecdc] text-[#4d5e53] hover:bg-[#d8e2cd]"
            }`}
            onClick={() => setActiveTab("feed")}
          >
            Feed ({social.posts.length})
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors relative ${
              activeTab === "dms"
                ? "bg-[#355344] text-[#f7f4e9]"
                : "bg-[#e5ecdc] text-[#4d5e53] hover:bg-[#d8e2cd]"
            }`}
            onClick={() => {
              setActiveTab("dms");
              if (selectedActorId) {
                dispatch({ type: "readSocialDm", actorId: selectedActorId });
              }
            }}
          >
            Direct Messages
            {unreadDmsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-[#c45b38] text-white rounded-full">
                {unreadDmsCount}
              </span>
            )}
          </button>
        </div>
        <div className="text-[10px] font-mono text-[#788874] uppercase tracking-wider">
          Radar & Valley Signal
        </div>
      </div>

      {activeTab === "feed" ? (
        <div className="social-feed space-y-3">
          {social.posts.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#788874] bg-[#f2f4ec] rounded border border-[#d6dfcb]">
              The public feed is quiet. As you launch products and build momentum, the ecosystem will start talking.
            </div>
          ) : (
            social.posts.map((post: SocialPost) => {
              const actor = ACTOR_BY_ID[post.actorId] ?? {
                id: post.actorId,
                name: post.actorId,
                handle: post.actorId,
                bio: "",
                role: "observer",
                avatarBg: "#2d3748",
                avatarInitial: post.actorId[0]?.toUpperCase() ?? "?",
                verified: false,
              };

              return (
                <article
                  key={post.id}
                  className="social-card bg-[#fafaf7] border border-[#d8e0ce] rounded-lg p-4 shadow-sm space-y-2.5 transition-all hover:border-[#b8c6a8]"
                >
                  <header className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-inner"
                        style={{ backgroundColor: actor.avatarBg }}
                      >
                        {actor.avatarInitial}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-xs text-[#1e2a22] font-semibold">{actor.name}</strong>
                          {actor.verified && (
                            <span
                              className="w-3.5 h-3.5 inline-flex items-center justify-center bg-[#3c6b53] text-white text-[9px] rounded-full"
                              title="Verified Valley Insider"
                            >
                              ✓
                            </span>
                          )}
                          <span className="text-[11px] text-[#718270]">@{actor.handle}</span>
                        </div>
                        <div className="text-[9px] font-mono text-[#8f9b88] uppercase tracking-wider">
                          {actor.role.replace("_", " ")}
                        </div>
                      </div>
                    </div>
                    <time className="text-[10px] font-mono text-[#8f9b88]">
                      {formatDate(post.date)}
                    </time>
                  </header>

                  <p className="text-xs text-[#2b3a31] leading-relaxed whitespace-pre-line pl-11">
                    {post.text}
                  </p>

                  <footer className="flex items-center justify-between pt-2 border-t border-[#edf1e7] pl-11 text-[11px] text-[#788874]">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-[#c45b38] transition-colors"
                        onClick={() => dispatch({ type: "likeSocialPost", postId: post.id })}
                        title="Like post"
                      >
                        <span className="text-[#c45b38]">♥</span>
                        <span>{post.likes ?? 0}</span>
                      </button>
                      <span className="inline-flex items-center gap-1 text-[#657662]">
                        <span>🔁</span>
                        <span>{post.reposts ?? 0}</span>
                      </span>
                    </div>
                    {post.milestoneId && (
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#a06245] bg-[#f4e9e0] px-2 py-0.5 rounded border border-[#e8d2c4]">
                        {post.milestoneId.replace("_", " ")}
                      </span>
                    )}
                  </footer>
                </article>
              );
            })
          )}
        </div>
      ) : (
        <div className="social-dms grid grid-cols-1 md:grid-cols-3 gap-3 min-h-[380px]">
          <div className="dm-sidebar md:col-span-1 bg-[#edf2e6] border border-[#cbd6be] rounded-lg overflow-hidden flex flex-col">
            <div className="p-2.5 bg-[#e0e8d5] border-b border-[#cbd6be] text-[10px] font-mono uppercase tracking-wider text-[#637560]">
              Conversations
            </div>
            <div className="divide-y divide-[#d9e2ce] overflow-y-auto flex-1">
              {actorIdsWithDms.length === 0 ? (
                <div className="p-4 text-xs text-[#788874] text-center">No messages yet.</div>
              ) : (
                actorIdsWithDms.map((actorId) => {
                  const actor = ACTOR_BY_ID[actorId] ?? {
                    id: actorId,
                    name: actorId,
                    handle: actorId,
                    bio: "",
                    role: "observer",
                    avatarBg: "#2d3748",
                    avatarInitial: actorId[0]?.toUpperCase() ?? "?",
                    verified: false,
                  };
                  const dms = dmsByActor.get(actorId) ?? [];
                  const latest = dms[0];
                  const hasUnread = dms.some((d) => !d.read);
                  const isSelected = actorId === selectedActorId;

                  return (
                    <button
                      key={actorId}
                      type="button"
                      className={`w-full text-left p-2.5 flex items-start gap-2 transition-colors ${
                        isSelected
                          ? "bg-[#fafaf7] border-l-4 border-[#3c6b53]"
                          : "hover:bg-[#e4ebd8]"
                      }`}
                      onClick={() => handleSelectActor(actorId)}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5"
                        style={{ backgroundColor: actor.avatarBg }}
                      >
                        {actor.avatarInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-[#1e2a22] truncate">{actor.name}</strong>
                          {hasUnread && (
                            <span className="w-2 h-2 rounded-full bg-[#c45b38] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#617260] truncate mt-0.5">
                          {latest?.text ?? ""}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="dm-main md:col-span-2 bg-[#fafaf7] border border-[#cbd6be] rounded-lg flex flex-col min-h-[380px]">
            {activeActorDms.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-[#788874] p-6 text-center">
                Select a conversation on the left to read messages.
              </div>
            ) : (
              <>
                <header className="p-3 border-b border-[#e2e9d7] bg-[#f4f7ee] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: selectedActor.avatarBg }}
                    >
                      {selectedActor.avatarInitial}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <strong className="text-xs text-[#1e2a22] font-semibold">
                          {selectedActor.name}
                        </strong>
                        {selectedActor.verified && (
                          <span className="text-[10px] text-[#3c6b53]">✓</span>
                        )}
                        <span className="text-[10px] text-[#718270]">@{selectedActor.handle}</span>
                      </div>
                      <div className="text-[10px] text-[#697964]">{selectedActor.bio}</div>
                    </div>
                  </div>
                  {activeActorDms.some((d) => !d.read) && (
                    <button
                      type="button"
                      className="text-[10px] text-[#8e4a2d] hover:underline"
                      onClick={() => dispatch({ type: "readSocialDm", actorId: selectedActorId })}
                    >
                      Mark thread read
                    </button>
                  )}
                </header>

                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  {activeActorDms
                    .slice()
                    .reverse()
                    .map((dm: SocialDm) => (
                      <div key={dm.id} className="flex flex-col items-start max-w-[85%] space-y-1">
                        <div className="bg-[#e9eee2] text-[#1e2a22] text-xs p-3 rounded-xl rounded-tl-sm border border-[#d6e0cc] leading-relaxed shadow-sm">
                          {dm.text}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-[#8a9985] pl-1">
                          <span>{formatDate(dm.date)}</span>
                          <span>·</span>
                          <span>Delivered</span>
                        </div>
                      </div>
                    ))}
                </div>

                <footer className="p-2.5 bg-[#f4f7ee] border-t border-[#e2e9d7] text-[10px] text-[#788874] flex justify-between items-center">
                  <span>Direct message thread with @{selectedActor.handle}</span>
                  <span className="font-mono text-[9px] text-[#93a28f]">
                    {activeActorDms.length} message{activeActorDms.length === 1 ? "" : "s"}
                  </span>
                </footer>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
