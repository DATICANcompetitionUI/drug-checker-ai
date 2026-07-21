"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  ["Does AI decide if drugs interact?", "No. AI only explains verified database results. It never generates or infers interaction data on its own — every finding comes from the verified database first."],
  ["Can I check more than two drugs?", "Yes. The platform checks every possible pair across 2 to 5 selected medications simultaneously, giving you a complete picture of the combined risk."],
  ["Are reports stored securely?", "Yes. Reports are tied to your account, saved in the database, and can be viewed, updated, or permanently deleted at any time from your dashboard."],
  ["Is drug scanning always accurate?", "No. Camera OCR and barcode lookup are best-effort helpers, especially for local Nigerian medicine packs with stylized text or unindexed barcodes. For the most reliable result, type the generic active ingredient printed on the label."],
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <div className="mt-12 space-y-3">
      {faqs.map(([question, answer], index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={question}
            className={`overflow-hidden rounded-[24px] border bg-white transition-colors ${isOpen ? "border-primary-blue/30 shadow-soft" : "border-border-app"}`}
          >
            <button
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between gap-4 px-7 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-base font-black text-text-primary">{question}</span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-primary-blue transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <p className="px-7 pb-6 text-sm font-medium leading-7 text-text-secondary">
                  {answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
