"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, X, RotateCcw, ArrowLeft } from "lucide-react"
import type { ExamResult } from "@/hooks/use-exam-mode"

interface ExamResultsProps {
  results: ExamResult[]
  correctCount: number
  incorrectCount: number
  accuracy: number
  onReset: () => void
  onBack: () => void
}

export function ExamResults({
  results,
  correctCount,
  incorrectCount,
  accuracy,
  onReset,
  onBack,
}: ExamResultsProps) {
  return (
    <div className="w-full max-w-md flex flex-col items-center gap-8">
      {/* Stats Summary */}
      <div className="w-full flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold text-foreground">Resultados del Examen</h2>
        
        {/* Accuracy Circle */}
        <div className="relative h-32 w-32 flex items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${accuracy * 2.83} 283`}
              className={cn(
                accuracy >= 80 ? "text-green-500" :
                accuracy >= 60 ? "text-yellow-500" :
                "text-red-500"
              )}
            />
          </svg>
          <span className="text-3xl font-bold text-foreground">{accuracy}%</span>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-1 rounded-lg border border-border p-4">
            <span className="text-2xl font-bold text-foreground">{results.length}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
            <span className="text-2xl font-bold text-green-500">{correctCount}</span>
            <span className="text-xs text-green-500/70">Correctas</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <span className="text-2xl font-bold text-red-500">{incorrectCount}</span>
            <span className="text-xs text-red-500/70">Incorrectas</span>
          </div>
        </div>
      </div>

      {/* Results List */}
      {results.length > 0 && (
        <div className="w-full flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">Detalle de respuestas</h3>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
            <div className="divide-y divide-border">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center justify-between px-4 py-3",
                    result.correct ? "bg-green-500/5" : "bg-red-500/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6">#{idx + 1}</span>
                    <span className="font-mono text-lg font-bold text-foreground">
                      {result.letter}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Tu respuesta:</span>
                      <span
                        className={cn(
                          "font-mono text-lg font-bold",
                          result.correct ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {result.userAnswer || "-"}
                      </span>
                    </div>
                    {result.correct ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Button onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Repetir Examen
        </Button>
      </div>
    </div>
  )
}
