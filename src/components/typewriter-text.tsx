"use client";

import { useState, useEffect, useCallback } from "react";

const phrases = [
  "Проверить видимость apple.com в ChatGPT",
  "Как ИИ рекомендует мой интернет-магазин?",
  "Сравнить мой бренд с конкурентами в Perplexity",
  "Найти упоминания сайта в ответах Claude",
  "Проанализировать SEO-позиции в AI-поиске",
];

const TYPING_SPEED = 45;
const DELETING_SPEED = 25;
const PAUSE_AFTER_TYPING = 2200;
const PAUSE_AFTER_DELETING = 400;

export function TypewriterText() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const tick = useCallback(() => {
    const currentPhrase = phrases[phraseIndex];

    if (!isDeleting) {
      // Typing
      if (displayText.length < currentPhrase.length) {
        return TYPING_SPEED;
      } else {
        // Done typing — pause, then start deleting
        setIsDeleting(true);
        return PAUSE_AFTER_TYPING;
      }
    } else {
      // Deleting
      if (displayText.length > 0) {
        return DELETING_SPEED;
      } else {
        // Done deleting — move to next phrase
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
        return PAUSE_AFTER_DELETING;
      }
    }
  }, [displayText, isDeleting, phraseIndex]);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentPhrase.length) {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        } else {
          setIsDeleting(true);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, tick());

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex, tick]);

  return (
    <span className="text-sm text-[#BBBBBB]">
      {displayText}
      <span className="ml-0.5 inline-block h-[1em] w-[1.5px] animate-pulse bg-[#CCCCCC] align-text-bottom" />
    </span>
  );
}
