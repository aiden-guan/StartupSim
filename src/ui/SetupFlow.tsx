import { useState } from "react";
import { identity } from "../branding/identity";
import { cofounders } from "../data/cofounders";
import { useGame } from "../state/store";

export function SetupFlow() {
  const dispatch = useGame((s) => s.dispatch);
  const [founder, setFounder] = useState("Aiden");
  const [company, setCompany] = useState(identity.companyFallback);
  const [cofounderId, setCofounderId] = useState(cofounders[0]!.id);

  return (
    <div className="h-full overflow-auto bg-[#efe8dc] text-[#1b2230]">
      <div className="mx-auto max-w-3xl px-8 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#c4622d]">Articles of incorporation</p>
        <h1 className="mt-2 font-display text-4xl">Name the people. Name the vehicle.</h1>
        <div className="mt-8 grid gap-4">
          <label className="grid gap-1 text-sm">
            Founder
            <input className="border border-[#cfc5b6] bg-white px-3 py-2" value={founder} onChange={(e) => setFounder(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Company
            <input className="border border-[#cfc5b6] bg-white px-3 py-2" value={company} onChange={(e) => setCompany(e.target.value)} />
          </label>
        </div>
        <h2 className="mt-10 font-display text-2xl">Cofounder</h2>
        <p className="text-sm text-[#5d6573]">None of these is a secret best. They are different ways to be early.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {cofounders.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCofounderId(c.id)}
              className={`border p-4 text-left ${cofounderId === c.id ? "border-[#c4622d] bg-white" : "border-[#cfc5b6] bg-[#f6f1e8]"}`}
            >
              <div className="font-medium">{c.name}</div>
              <div className="font-mono text-[11px] uppercase tracking-wide text-[#c4622d]">{c.title}</div>
              <p className="mt-2 text-sm leading-relaxed">{c.pitch}</p>
              <div className="mt-2 font-mono text-[11px] text-[#5d6573]">
                R{c.skills.research} E{c.skills.engineering} P{c.skills.product} G{c.skills.growth} · {Math.round(c.equity * 100)}% equity
              </div>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mt-10 bg-[#1b2230] px-6 py-3 text-white"
          onClick={() => dispatch({ type: "newGame", input: { founderName: founder, companyName: company, cofounderId } })}
        >
          Sign the lease
        </button>
      </div>
    </div>
  );
}
