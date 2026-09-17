export const newsTemplates = [
  { id: "raise", headline: "{{company}} is raising at a number that would have been funny last year", tone: "hype" as const },
  { id: "launch", headline: "{{company}} launched {{product}} into a market that already had one", tone: "hype" as const },
  { id: "layoff", headline: "{{company}} is right-sizing, which is a word", tone: "panic" as const },
  { id: "model", headline: "{{company}} says the new model is better. The evals, selected carefully, agree", tone: "hype" as const },
  { id: "reg", headline: "A regulator would like a word with anyone whose product can talk", tone: "panic" as const },
  { id: "open", headline: "Weights appeared on the internet. Pricing meetings were moved up", tone: "markets" as const },
  { id: "outage", headline: "The cloud blinked. Several startups discovered they were a wrapper", tone: "panic" as const },
  { id: "hire", headline: "{{company}} hired a researcher for a sum that looks like a Series A", tone: "hype" as const },
  { id: "acquire", headline: "{{company}} bought a team, a domain, and a problem", tone: "markets" as const },
  { id: "energy", headline: "A substation would like to speak to the manager of intelligence", tone: "neutral" as const },
];

export const fillerNews = [
  "Investors remain extremely excited about the word agentic.",
  "A new benchmark was created. It favors the lab that created it.",
  "Someone shipped a chatbot that apologizes in a new tone of voice.",
  "The cluster is fine. The status page is a different product.",
  "A keynote promised the future, then demoed a spreadsheet.",
  "Open weights, closed notebooks, mixed feelings.",
  "Hiring freeze at one lab, bidding war at another. The graph is a mood.",
  "A senator said guardrails. A founder said innovation. Both posted.",
];
