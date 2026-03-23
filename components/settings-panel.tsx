"use client"

import { KOCH_ORDER, type MorseTrainerConfig } from "@/hooks/use-morse-trainer"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet"
import { Settings, Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface SettingsPanelProps {
  config: MorseTrainerConfig
  onConfigChange: (config: MorseTrainerConfig) => void
  disabled?: boolean
}

export function SettingsPanel({ config, onConfigChange, disabled }: SettingsPanelProps) {
  const { theme, setTheme } = useTheme()

  const toggleLetter = (letter: string) => {
    if (disabled) return
    const newSelected = config.selectedLetters.includes(letter)
      ? config.selectedLetters.filter((l) => l !== letter)
      : [...config.selectedLetters, letter]
    onConfigChange({ ...config, selectedLetters: newSelected })
  }

  const selectUpTo = (index: number) => {
    if (disabled) return
    const newSelected = KOCH_ORDER.slice(0, index + 1).filter(
      (char) => /^[A-Z0-9]$/.test(char)
    )
    onConfigChange({ ...config, selectedLetters: newSelected })
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Configuración</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configuración</SheetTitle>
          <SheetDescription>Ajusta los parámetros del entrenamiento</SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-8">
          {/* Theme Selector */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">Tema</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="flex-1"
              >
                <Sun className="mr-2 h-4 w-4" />
                Claro
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="flex-1"
              >
                <Moon className="mr-2 h-4 w-4" />
                Oscuro
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className="flex-1"
              >
                <Monitor className="mr-2 h-4 w-4" />
                Auto
              </Button>
            </div>
          </div>

          {/* Letters Selection */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Letras (Método Koch)</Label>
              <span className="text-xs text-muted-foreground">
                {config.selectedLetters.length} seleccionadas
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {KOCH_ORDER.filter((char) => /^[A-Z0-9]$/.test(char)).map((letter, idx) => (
                <button
                  key={letter}
                  onClick={() => toggleLetter(letter)}
                  onDoubleClick={() => selectUpTo(idx)}
                  disabled={disabled}
                  className={cn(
                    "h-9 rounded-md text-sm font-mono font-medium transition-colors",
                    "border border-border hover:border-primary/50",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    config.selectedLetters.includes(letter)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground hover:bg-accent"
                  )}
                >
                  {letter}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Doble clic para seleccionar hasta esa letra
            </p>
          </div>

          {/* WPM */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Velocidad</Label>
              <span className="text-sm font-mono text-muted-foreground">{config.wpm} WPM</span>
            </div>
            <Slider
              value={[config.wpm]}
              onValueChange={([wpm]) => onConfigChange({ ...config, wpm })}
              min={5}
              max={40}
              step={1}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">Palabras por minuto</p>
          </div>

          {/* Frequency */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Frecuencia</Label>
              <span className="text-sm font-mono text-muted-foreground">{config.frequency} Hz</span>
            </div>
            <Slider
              value={[config.frequency]}
              onValueChange={([frequency]) => onConfigChange({ ...config, frequency })}
              min={400}
              max={1000}
              step={50}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">Tono del código Morse</p>
          </div>

          {/* Farnsworth Spacing */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Espaciado Farnsworth</Label>
              <span className="text-sm font-mono text-muted-foreground">{config.farnsworthSpacing}x</span>
            </div>
            <Slider
              value={[config.farnsworthSpacing]}
              onValueChange={([farnsworthSpacing]) =>
                onConfigChange({ ...config, farnsworthSpacing })
              }
              min={1}
              max={5}
              step={0.5}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">Multiplicador del espacio entre caracteres</p>
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Duración</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {formatTime(config.duration)}
              </span>
            </div>
            <Slider
              value={[config.duration]}
              onValueChange={([duration]) => onConfigChange({ ...config, duration })}
              min={1}
              max={60}
              step={1}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">Tiempo total de la sesión</p>
          </div>

          {/* Start Delay */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Delay Inicial</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {config.startDelay} seg
              </span>
            </div>
            <Slider
              value={[config.startDelay]}
              onValueChange={([startDelay]) => onConfigChange({ ...config, startDelay })}
              min={0}
              max={30}
              step={1}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">Tiempo de espera antes de comenzar</p>
          </div>

          {/* Show Morse Visual */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Mostrar Código Morse</Label>
              <p className="text-xs text-muted-foreground">
                Muestra puntos y rayas en pantalla
              </p>
            </div>
            <Switch
              checked={config.showMorseVisual}
              onCheckedChange={(showMorseVisual) => onConfigChange({ ...config, showMorseVisual })}
              disabled={disabled}
            />
          </div>

          {/* Blind Mode */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Modo Ciego</Label>
              <p className="text-xs text-muted-foreground">
                Oculta la letra durante el ejercicio
              </p>
            </div>
            <Switch
              checked={config.blindMode}
              onCheckedChange={(blindMode) => onConfigChange({ ...config, blindMode })}
              disabled={disabled}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
