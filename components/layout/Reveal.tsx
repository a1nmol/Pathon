"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  direction?: "up" | "left" | "fade";
}

export function Reveal({
  children,
  delay = 0,
  className,
  style,
  direction = "up",
}: RevealProps) {
  const initial =
    direction === "up"
      ? { opacity: 0, y: 24, filter: "blur(4px)" }
      : direction === "left"
      ? { opacity: 0, x: -20 }
      : { opacity: 0 };

  const animate =
    direction === "up"
      ? { opacity: 1, y: 0, filter: "blur(0px)" }
      : direction === "left"
      ? { opacity: 1, x: 0 }
      : { opacity: 1 };

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.65,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
