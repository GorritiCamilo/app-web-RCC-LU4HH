"use client"

import { cn } from "@/lib/utils"

interface MorseDisplayProps {
  letter: string | null
  morse: string | null
  blindMode: boolean
  showMorseVisual: boolean
  phase: "idle" | "countdown" | "morse" | "wait1" | "speech" | "wait2"
  countdown?: number | null
}

export function MorseDisplay({ letter, morse, blindMode, showMorseVisual, phase, countdown }: MorseDisplayProps) {
  const showLetter = !blindMode || phase === "speech" || phase === "wait2"
  const isActive = phase !== "idle" && phase !== "countdown"
  const isCountdown = phase === "countdown"

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Letter Display */}
      <div
        className={cn(
          "flex h-40 w-40 items-center justify-center rounded-2xl border-2 transition-all duration-300",
          "sm:h-48 sm:w-48",
          isCountdown
            ? "border-yellow-500/30 bg-yellow-500/5"
            : isActive
              ? "border-primary/30 bg-primary/5"
              : "border-border bg-muted/30"
        )}
      >
        {isCountdown && countdown !== null ? (
          <span className="font-mono text-8xl font-bold text-yellow-500 sm:text-9xl">
            {countdown}
          </span>
        ) : isActive && letter ? (
          <span
            className={cn(
              "font-mono text-8xl font-bold transition-all duration-300 sm:text-9xl",
              showLetter ? "text-foreground opacity-100" : "text-muted-foreground/20 opacity-50"
            )}
          >
            {showLetter ? letter : "?"}
          </span>
        ) : (
          <span className="text-4xl text-muted-foreground/30">···</span>
        )}
      </div>

      {/* Morse Code Display */}
      <div className="h-12 flex items-center justify-center">
        {isActive && morse && showMorseVisual ? (
          <div className="flex items-center gap-2">
            {morse.split("").map((symbol, idx) => (
              <span
                key={idx}
                className={cn(
                  "flex items-center justify-center transition-all",
                  symbol === "."
                    ? "h-3 w-3 rounded-full bg-primary"
                    : "h-3 w-9 rounded-full bg-primary"
                )}
              />
            ))}
          </div>
        ) : isActive && morse && !showMorseVisual ? (
          <span className="text-sm text-muted-foreground/50">
            Visualización oculta
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            Código Morse aparecerá aquí
          </span>
        )}
      </div>

      {/* Phase Indicator */}
      <div className="h-6 flex items-center">
        <span
          className={cn(
            "text-xs font-medium uppercase tracking-wider transition-colors",
            phase === "countdown" && "text-yellow-500",
            phase === "morse" && "text-primary",
            phase === "wait1" && "text-muted-foreground",
            phase === "speech" && "text-primary",
            phase === "wait2" && "text-muted-foreground",
            phase === "idle" && "text-muted-foreground/50"
          )}
        >
          {phase === "countdown" && "Preparándose..."}
          {phase === "morse" && "Reproduciendo Morse"}
          {phase === "wait1" && "Esperando..."}
          {phase === "speech" && "Alfabeto Fonético"}
          {phase === "wait2" && "Siguiente..."}
          {phase === "idle" && "Listo para comenzar"}
        </span>
      </div>
    </div>
  )
}
