"use client";
import { useState } from "react";

const ITEMS = [
  ["Where does the data come from?", "From licensed B2B data providers, reached through one connection. Each result shows which provider found it."],
  ["What's a waterfall?", "We ask the cheapest provider first. If it doesn't find an email, we ask the next one. You only pay when one finds it."],
  ["What does verified mean?", "The email was checked for deliverability. Catch-all domains are marked separately, because no one can fully confirm them."],
  ["Do you guarantee results?", "No. You see a free count and a price estimate before every run, and you only pay for what's found."],
  ["Can I clean my own list?", "Yes. Import a CSV, map the columns, see the price, and run."],
  ["Can people opt out?", "Yes. Anyone can ask to be removed, and removed contacts are never returned again."],
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="faq">
      {ITEMS.map(([q, a], i) => (
        <div key={q} className="faq-item">
          <button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            <span>{q}</span>
            <span aria-hidden className="faq-plus" data-open={open === i}>+</span>
          </button>
          <div className="faq-body" data-open={open === i}>
            <p>{a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
