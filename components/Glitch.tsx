"use client";
import React from "react";

export default function Glitch({ text, className = "", hard = false, as: Tag = "span" }: { text: string; className?: string; hard?: boolean; as?: any }) {
  return (
    <Tag className={`glitch ${hard ? "hard" : ""} ${className}`} data-text={text}>
      {text}
    </Tag>
  );
}
