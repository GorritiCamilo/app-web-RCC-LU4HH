"use client"

import { useState, useEffect } from "react"
import { useMorseTrainer, DEFAULT_CONFIG, type MorseTrainerConfig } from "@/hooks/use-morse-trainer"
import { SettingsPanel } from "@/components/settings-panel"
import { MorseDisplay } from "@/components/morse-display"
import { ExamMode } from "@/components/exam-mode"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Square, Radio, GraduationCap } from "lucide-react"

export default function MorseTrainerPage() {
  const [config, setConfig] = useState<MorseTrainerConfig>(DEFAULT_CONFIG)
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<"training" | "exam">("training")

  const {
    isPlaying,
    currentLetter,
    currentMorse,
    timeRemaining,
    phase,
    start,
    stop,
  } = useMorseTrainer(config)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const totalSeconds = config.duration * 60
  const progressPercent = ((totalSeconds - timeRemaining) / totalSeconds) * 100

  const handleToggle = () => {
    if (isPlaying) {
      stop()
    } else {
      start()
    }
  }

  const handleSwitchToExam = () => {
    if (isPlaying) {
      stop()
    }
    setMode("exam")
  }

  const handleBackToTraining = () => {
    setMode("training")
  }

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Morse Koch</span>
            {mode === "exam" && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                Examen
              </span>
            )}
          </div>
          <SettingsPanel config={config} onConfigChange={setConfig} disabled={isPlaying} />
        </div>
      </header>

      {/* Conditional Content based on mode */}
      {mode === "exam" ? (
        <ExamMode config={config} onBack={handleBackToTraining} />
      ) : (
        <>
          {/* Main Content - Training Mode */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-md flex flex-col items-center gap-10">
              {/* Display */}
              <MorseDisplay
                letter={currentLetter}
                morse={currentMorse}
                blindMode={config.blindMode}
                showMorseVisual={config.showMorseVisual}
                phase={phase}
              />

              {/* Controls */}
              <div className="flex flex-col items-center gap-6 w-full">
                {/* Play/Stop Button */}
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleToggle}
                    size="lg"
                    className="h-16 w-16 rounded-full shadow-lg"
                    disabled={config.selectedLetters.length === 0}
                  >
                    {isPlaying ? (
                      <Square className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6 ml-1" />
                    )}
                    <span className="sr-only">{isPlaying ? "Detener" : "Iniciar"}</span>
                  </Button>

                  {/* Exam Mode Button */}
                  {!isPlaying && (
                    <Button
                      onClick={handleSwitchToExam}
                      variant="outline"
                      size="lg"
                      className="h-16 px-6 rounded-full"
                      disabled={config.selectedLetters.length === 0}
                    >
                      <GraduationCap className="h-5 w-5 mr-2" />
                      Examen
                    </Button>
                  )}
                </div>

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

          {/* Footer */}
          <footer className="border-t border-border py-4">
            <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
              Entrenamiento de Código Morse · Método Koch
            </div>
          </footer>
        </>
      )}
    </main>
  )
}
