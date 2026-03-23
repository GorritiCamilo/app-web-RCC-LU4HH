"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { useExamMode, type ExamConfig } from "@/hooks/use-exam-mode"
import { ExamResults } from "@/components/exam-results"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Play, Square, ArrowLeft, Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExamModeProps {
  config: ExamConfig
  onBack: () => void
}

export function ExamMode({ config, onBack }: ExamModeProps) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    isRunning,
    isFinished,
    currentMorse,
    timeRemaining,
    results,
    waitingForInput,
    correctCount,
    incorrectCount,
    accuracy,
    start,
    stop,
    reset,
    submitAnswer,
  } = useExamMode(config)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const totalSeconds = config.duration * 60
  const progressPercent = ((totalSeconds - timeRemaining) / totalSeconds) * 100

  const handleSubmit = () => {
    if (!waitingForInput) return
    submitAnswer(inputValue)
    setInputValue("")
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  // Auto-focus input when waiting for input
  useEffect(() => {
    if (waitingForInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [waitingForInput])

  const handleToggle = () => {
    if (isRunning) {
      stop()
    } else {
      start()
    }
  }

  const handleReset = () => {
    reset()
  }

  // Show results screen
  if (isFinished) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <ExamResults
          results={results}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          accuracy={accuracy}
          onReset={handleReset}
          onBack={onBack}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        {/* Back Button (only when not running) */}
        {!isRunning && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="self-start text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al entrenamiento
          </Button>
        )}

        {/* Morse Display (exam mode - no letter shown) */}
        <div className="flex flex-col items-center justify-center gap-6">
          {/* Question Mark / Waiting indicator */}
          <div
            className={cn(
              "flex h-40 w-40 items-center justify-center rounded-2xl border-2 transition-all duration-300",
              "sm:h-48 sm:w-48",
              isRunning
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-muted/30"
            )}
          >
            {isRunning ? (
              <span className="font-mono text-8xl font-bold text-muted-foreground/30 sm:text-9xl">
                ?
              </span>
            ) : (
              <span className="text-4xl text-muted-foreground/30">···</span>
            )}
          </div>

          {/* Morse Code Display - Hidden in exam mode */}
          <div className="h-12 flex items-center justify-center">
            <span className="text-sm text-muted-foreground/50">
              {isRunning ? "Escucha atentamente..." : "Modo Examen"}
            </span>
          </div>

          {/* Status */}
          <div className="h-6 flex items-center">
            <span
              className={cn(
                "text-xs font-medium uppercase tracking-wider transition-colors",
                waitingForInput ? "text-primary" : "text-muted-foreground/50"
              )}
            >
              {isRunning
                ? waitingForInput
                  ? "Escribe tu respuesta"
                  : "Escuchando..."
                : "Modo Examen"}
            </span>
          </div>
        </div>

        {/* Input Area (only when running and waiting for input) */}
        {isRunning && (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                maxLength={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder={waitingForInput ? "Letra..." : "Espera..."}
                disabled={!waitingForInput}
                className="text-center font-mono text-2xl h-14 uppercase"
                autoComplete="off"
                autoCapitalize="characters"
              />
              <Button
                onClick={handleSubmit}
                disabled={!waitingForInput}
                size="lg"
                className="h-14 px-6"
              >
                <Send className="h-5 w-5" />
                <span className="sr-only">Enviar</span>
              </Button>
            </div>

            {/* Live Stats */}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-500">
                <span className="font-bold">{correctCount}</span> correctas
              </span>
              <span className="w-px h-4 bg-border" />
              <span className="flex items-center gap-1 text-red-500">
                <span className="font-bold">{incorrectCount}</span> incorrectas
              </span>
              <span className="w-px h-4 bg-border" />
              <span className="text-muted-foreground">
                {results.length} total
              </span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Play/Stop Button */}
          <Button
            onClick={handleToggle}
            size="lg"
            className="h-16 w-16 rounded-full shadow-lg"
            variant={isRunning ? "destructive" : "default"}
            disabled={config.selectedLetters.length === 0}
          >
            {isRunning ? (
              <Square className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
            <span className="sr-only">{isRunning ? "Detener" : "Iniciar Examen"}</span>
          </Button>

          {/* Timer and Progress */}
          <div className="w-full flex flex-col items-center gap-3">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl font-light text-foreground tabular-nums">
                {formatTime(timeRemaining)}
              </span>
              <span className="text-sm text-muted-foreground">restante</span>
            </div>
            <Progress value={progressPercent} className="w-full h-1.5" />
          </div>

          {/* Session Info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="font-medium">{config.wpm}</span> WPM
            </span>
            <span className="w-px h-3 bg-border" />
            <span className="flex items-center gap-1">
              <span className="font-medium">{config.frequency}</span> Hz
            </span>
            <span className="w-px h-3 bg-border" />
            <span className="flex items-center gap-1">
              <span className="font-medium">{config.selectedLetters.length}</span> letras
            </span>
          </div>
        </div>

        {/* Empty state warning */}
        {config.selectedLetters.length === 0 && (
          <p className="text-sm text-destructive text-center">
            Selecciona al menos una letra en la configuración
          </p>
        )}
      </div>
    </div>
  )
}
