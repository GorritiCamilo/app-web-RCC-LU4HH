"use client"

import { useState, useEffect, useCallback } from "react"
import { useMorseTrainer, DEFAULT_CONFIG, type MorseTrainerConfig } from "@/hooks/use-morse-trainer"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Square, Radio, GraduationCap, Settings, User, BookOpen, Volume2, Clock, Hash, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const KOCH_SEQUENCE = "KMRSUAPTLOWI.NJEF0YVG5/Q9ZH38B?427C1D6X=".split("")

export default function MorseTrainerPage() {
  const [activeTab, setActiveTab] = useState("training")
  const [config, setConfig] = useState<MorseTrainerConfig>(DEFAULT_CONFIG)
  const [mounted, setMounted] = useState(false)
  const [accuracy, setAccuracy] = useState(0)
  const [sessions, setSessions] = useState(0)
  const [kochLevel, setKochLevel] = useState(5)
  const [examState, setExamState] = useState({
    active: false,
    target: "",
    answered: 0,
    total: 10,
    score: 0,
    revealed: false,
    feedback: "" as "" | "correct" | "wrong",
    lastGuess: ""
  })

  const {
    isPlaying,
    currentLetter,
    currentMorse,
    timeRemaining,
    phase,
    start,
    stop,
    playSingleLetter
  } = useMorseTrainer(config)

  const startExam = useCallback(() => {
    const letters = config.selectedLetters
    const target = letters[Math.floor(Math.random() * letters.length)]
    setExamState({
      active: true,
      target,
      answered: 0,
      total: 10,
      score: 0,
      revealed: false,
      feedback: "",
      lastGuess: ""
    })
    setTimeout(() => playSingleLetter(target), 500)
  }, [config.selectedLetters, playSingleLetter])

  const nextExamLetter = useCallback(() => {
    const letters = config.selectedLetters
    const target = letters[Math.floor(Math.random() * letters.length)]
    setExamState(prev => ({
      ...prev,
      target,
      revealed: false,
      feedback: "",
      lastGuess: ""
    }))
    setTimeout(() => playSingleLetter(target), 500)
  }, [config.selectedLetters, playSingleLetter])

  const checkExamAnswer = useCallback((char: string) => {
    let isCorrect = false
    let isFinished = false
    let finalScore = 0

    setExamState(prev => {
      isCorrect = char === prev.target
      isFinished = prev.answered + 1 >= prev.total
      finalScore = prev.score + (isCorrect ? 1 : 0)
      
      return {
        ...prev,
        lastGuess: char,
        revealed: true,
        feedback: isCorrect ? "correct" : "wrong",
        score: finalScore,
        answered: prev.answered + 1
      }
    })

    setTimeout(() => {
      if (isFinished) {
        setSessions(s => s + 1)
        setAccuracy(Math.round((finalScore / 10) * 100))
        setExamState(prev => ({ ...prev, active: false }))
      } else {
        nextExamLetter()
      }
    }, 1200)
  }, [nextExamLetter])

  // Load persistence
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("morse-trainer-config")
    const savedStats = localStorage.getItem("morse-trainer-stats")
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setConfig((prev: MorseTrainerConfig) => ({ ...prev, ...parsed }))
        setKochLevel(parsed.selectedLetters?.length || 5)
      } catch (e) { console.error(e) }
    }
    
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats)
        setSessions(parsed.sessions || 0)
        setAccuracy(parsed.accuracy || 0)
      } catch (e) { console.error(e) }
    }
  }, [])

  // Save persistence
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("morse-trainer-config", JSON.stringify({
        ...config,
        kochLevel
      }))
      localStorage.setItem("morse-trainer-stats", JSON.stringify({
        sessions,
        accuracy
      }))
    }
  }, [config, kochLevel, sessions, accuracy, mounted])

  // Selection is now freely adjustable, slider merely acts as a preset

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const totalSeconds = config.duration * 60
  const progressPercent = ((totalSeconds - timeRemaining) / totalSeconds) * 100

  const handleToggle = useCallback(() => {
    if (isPlaying) {
      stop()
    } else {
      start()
    }
  }, [isPlaying, start, stop])

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        handleToggle()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleToggle])

  if (!mounted) return null

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-0 md:p-8">
      <main className="w-full h-screen md:h-[90vh] max-w-6xl mx-auto glass shadow-2xl overflow-hidden relative flex flex-col transition-all duration-500 md:rounded-[2.5rem] border-0 md:border md:border-white/20">
        
        {/* Content Area */}
        <div className="flex-1 flex flex-col relative w-full h-full p-0 md:p-6 lg:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col md:flex-row gap-0 md:gap-8">
            
            {/* NAVIGATION SIDEBAR (Desktop) / BOTTOM BAR (Mobile) */}
            <div className="shrink-0 flex items-center justify-center order-last md:order-first absolute md:relative bottom-4 md:bottom-auto left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0 w-[95%] sm:w-[340px] md:w-auto z-50">
              <TabsList className="w-full h-16 md:h-full md:w-20 rounded-full md:rounded-[2rem] glass-dark border border-white/10 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] flex flex-row md:flex-col items-center justify-around md:justify-center p-2 md:p-4 gap-2 md:gap-8">
                <TabsTrigger value="training" className="rounded-full w-12 h-12 flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-300">
                  <Play className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger value="exam" className="rounded-full w-12 h-12 flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-300">
                  <GraduationCap className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-full w-12 h-12 flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-300">
                  <Settings className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger value="profile" className="rounded-full w-12 h-12 flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-300">
                  <User className="h-5 w-5" />
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB CONTENTS CONTAINER */}
            <div className="flex-1 w-full h-full glass-dark md:bg-black/5 md:dark:bg-white/5 md:backdrop-filter-none border-t md:border border-white/10 md:shadow-inner rounded-none md:rounded-[2rem] overflow-y-auto overflow-x-hidden scrollbar-hide pb-24 md:pb-0 relative">

            
            {/* SCREEN: HOME / TRAINING */}
            <TabsContent value="training" className="p-6 flex-1 flex flex-col m-0 data-[state=inactive]:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex flex-col gap-1 mb-6">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="w-fit text-[10px] font-bold tracking-widest uppercase opacity-80 bg-primary/10 text-primary border-primary/20">
                    Koch Method • Stage {kochLevel}
                  </Badge>
                  {isPlaying && (
                    <div className="flex items-center gap-1.5 text-primary animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">On Air</span>
                    </div>
                  )}
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-foreground mt-1">
                  CW <span className="text-primary italic">Trainer</span>
                </h1>
              </header>

              <div className="flex-1 flex flex-col items-center justify-center gap-8 py-4">
                {/* Big Visual Display */}
                <div className={cn(
                  "w-full aspect-square max-w-[280px] rounded-[3rem] bg-secondary/20 dark:bg-primary/5 border-2 border-primary/10 backdrop-blur-xl flex flex-col items-center justify-center relative transition-all duration-500",
                  isPlaying ? "shadow-[0_0_60px_-15px_rgba(59,130,246,0.2)] border-primary/30" : "shadow-inner border-transparent"
                )}>
                   {phase === "idle" ? (
                     <div className="flex flex-col items-center gap-4 group">
                       <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                         <Play className="h-8 w-8 text-primary ml-1" />
                       </div>
                       <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">READY TO TRANSMIT</span>
                     </div>
                   ) : (
                     <div className="animate-in zoom-in-95 duration-200 flex flex-col items-center">
                        <span className={cn(
                          "text-9xl font-black tracking-tighter transition-all duration-150 select-none",
                          config.blindMode ? "opacity-0 blur-xl" : "opacity-100 text-primary drop-shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                        )}>
                          {currentLetter || "?"}
                        </span>
                        <div className="mt-6 flex gap-1.5">
                          {currentMorse.split("").map((s: string, i: number) => (
                            <div 
                              key={i} 
                              className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                s === "." ? "w-2 bg-primary" : "w-6 bg-primary",
                                config.blindMode && "opacity-20 grayscale"
                              )} 
                            />
                          ))}
                        </div>
                     </div>
                   )}
                </div>

                {/* Main Controls */}
                <div className="w-full flex flex-col items-center gap-8">
                   <div className="flex items-center gap-6">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-14 w-14 rounded-full border-2 border-primary/10 transition-all hover:bg-primary/5 active:scale-95"
                        onClick={() => setActiveTab("settings")}
                      >
                         <Settings className="h-6 w-6 text-muted-foreground" />
                      </Button>

                      <Button
                        size="lg"
                        className={cn(
                          "h-24 w-24 rounded-full shadow-2xl shadow-primary/30 transition-all active:scale-90 relative overflow-hidden group",
                          isPlaying ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
                        )}
                        onClick={handleToggle}
                      >
                         <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                         {isPlaying ? <Square className="h-10 w-10 relative z-10" /> : <Play className="h-10 w-10 ml-2 relative z-10" />}
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-14 w-14 rounded-full border-2 border-primary/10 transition-all hover:bg-primary/5 active:scale-95"
                        onClick={() => setActiveTab("exam")}
                      >
                         <GraduationCap className="h-6 w-6 text-muted-foreground" />
                      </Button>
                   </div>

                   <div className="w-full space-y-4 px-2">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">ELAPSED</span>
                          <span className="font-mono text-xl tabular-nums font-black text-foreground leading-none">
                            {formatTime(totalSeconds - timeRemaining)}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-primary tracking-widest uppercase">REMAINING</span>
                          <span className="font-mono text-xl tabular-nums font-black text-primary leading-none">
                            {formatTime(timeRemaining)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-1000 ease-linear" 
                          style={{ width: `${progressPercent}%` }} 
                        />
                      </div>
                   </div>
                </div>
              </div>
            </TabsContent>

            {/* SCREEN: EXAM (CHALLENGE MODE) */}
            <TabsContent value="exam" className="p-6 flex-1 m-0 data-[state=inactive]:hidden animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto">
               <div className="h-full flex flex-col pt-4 gap-6 scrollbar-hide">
                  <header>
                     <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-black tracking-tight">Challenge</h2>
                        {examState.active && (
                          <Badge className="bg-primary animate-pulse border-none px-3 font-black text-[10px]">
                            {examState.answered}/{examState.total}
                          </Badge>
                        )}
                     </div>
                     <p className="text-sm text-muted-foreground font-medium mt-1">Listen and identify the character.</p>
                  </header>

                  {!examState.active ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-10">
                       <div className="w-full max-w-[320px] aspect-square rounded-[3rem] bg-secondary/20 border-2 border-dashed border-primary/20 flex flex-col items-center justify-center p-8 text-center gap-4 relative group">
                          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                             <GraduationCap className="h-10 w-10 text-primary" />
                          </div>
                          <div className="space-y-1">
                             <span className="text-lg font-black tracking-tight">Test Your Receiver</span>
                             <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                               You&apos;ll hear 10 random characters from your current selection.
                             </p>
                          </div>
                       </div>
                       
                       <Button 
                          className="w-full h-18 rounded-3xl font-black tracking-wide text-lg shadow-2xl shadow-primary/20 active:scale-95" 
                          onClick={startExam}
                        >
                           BEGIN ASSESSMENT
                           <Play className="h-5 w-5 ml-3" />
                       </Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col gap-8">
                       <div className="p-8 rounded-[3rem] bg-secondary/30 border border-primary/10 flex flex-col items-center justify-center relative min-h-[160px] shadow-inner overflow-hidden">
                          {examState.feedback === "correct" && (
                            <div className="absolute inset-0 bg-green-500/10 animate-in fade-in duration-300" />
                          )}
                          {examState.feedback === "wrong" && (
                            <div className="absolute inset-0 bg-red-500/10 animate-in fade-in duration-300" />
                          )}
                          
                          <div className={cn(
                            "text-8xl font-black select-none transition-all duration-300",
                            examState.revealed ? "text-primary scale-110 rotate-3" : "text-muted-foreground opacity-20 blur-sm flex gap-4"
                          )}>
                             {examState.revealed ? examState.target : (
                               <Volume2 className="h-16 w-16 animate-bounce" />
                             )}
                          </div>
                          
                          {!examState.revealed && (
                            <Button
                              variant="ghost"
                              className="mt-4 text-[10px] font-black uppercase opacity-60 hover:opacity-100 flex items-center gap-2"
                              onClick={() => playSingleLetter(examState.target)}
                            >
                              <Volume2 className="h-3 w-3" /> Repeat Sound
                            </Button>
                          )}
                       </div>

                       <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-[300px] p-1 scrollbar-hide">
                          {config.selectedLetters.map((char: string) => (
                            <Button
                              key={char}
                              variant={examState.lastGuess === char ? (char === examState.target ? "default" : "destructive") : "secondary"}
                              disabled={examState.revealed}
                              className={cn(
                                "h-14 rounded-2xl font-black text-lg transition-all duration-200 active:scale-90",
                                examState.revealed && char === examState.target && "bg-green-500 text-white border-none scale-105 shadow-lg shadow-green-500/30"
                              )}
                              onClick={() => checkExamAnswer(char)}
                            >
                              {char}
                            </Button>
                          ))}
                       </div>

                       <Button 
                          variant="ghost" 
                          className="w-fit self-center text-[10px] font-black opacity-40 hover:opacity-100 uppercase mt-4"
                          onClick={() => setExamState({ ...examState, active: false })}
                        >
                           Cancel Assessment
                       </Button>
                    </div>
                  )}
               </div>
            </TabsContent>

            {/* SCREEN: SETTINGS */}
            <TabsContent value="settings" className="p-6 flex-1 m-0 data-[state=inactive]:hidden animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-8 pb-10">
                  <header>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                       <Settings className="h-6 w-6 text-primary" />
                       Ajustes
                    </h2>
                  </header>

                  <section className="space-y-8">
                    <div className="space-y-4 p-5 rounded-3xl bg-secondary/20 border border-primary/5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Zap className="h-3.5 w-3.5" /> Character Speed
                        </label>
                        <span className="font-black text-xl text-primary">{config.wpm} <small className="text-[10px] font-medium opacity-60">WPM</small></span>
                      </div>
                      <Slider 
                        value={[config.wpm]} 
                        onValueChange={([val]: number[]) => setConfig((prev: MorseTrainerConfig) => ({...prev, wpm: val}))} 
                        max={40} min={10} step={1}
                        className="py-2"
                      />
                      <p className="text-[10px] text-muted-foreground italic font-medium">Velocidad de cada letra individual.</p>
                    </div>

                    <div className="space-y-4 p-5 rounded-3xl bg-secondary/20 border border-primary/5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" /> Separación (Farnsworth)
                        </label>
                        <span className="font-black text-xl text-primary">{config.farnsworthWpm || config.wpm} <small className="text-[10px] font-medium opacity-60">WPM</small></span>
                      </div>
                      <Slider 
                        value={[config.farnsworthWpm || config.wpm]} 
                        onValueChange={([val]: number[]) => setConfig((prev: MorseTrainerConfig) => ({...prev, farnsworthWpm: val}))} 
                        max={config.wpm} min={1} step={1}
                        className="py-2"
                      />
                      <p className="text-[10px] text-muted-foreground italic font-medium">Bajar este valor aumenta el silencio entre letras para que tengas más tiempo de pensar.</p>
                    </div>

                    <div className="space-y-4 p-5 rounded-3xl bg-secondary/20 border border-primary/5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Volume2 className="h-3.5 w-3.5" /> Frecuencia del Tono
                        </label>
                        <span className="font-black text-xl text-primary">{config.frequency} <small className="text-[10px] font-medium opacity-60">Hz</small></span>
                      </div>
                      <Slider 
                        value={[config.frequency || 700]} 
                        onValueChange={([val]: number[]) => setConfig((prev: MorseTrainerConfig) => ({...prev, frequency: val}))} 
                        max={1000} min={400} step={10}
                        className="py-2"
                      />
                      <p className="text-[10px] text-muted-foreground italic font-medium">Ajusta el pitch (agudeza) del sonido morse.</p>
                    </div>

                    <div className="space-y-4 p-5 rounded-3xl bg-secondary/20 border border-primary/5">
                      <div className="flex justify-between items-start">
                        <label className="flex flex-col gap-1 text-muted-foreground">
                          <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Hash className="h-3.5 w-3.5" /> Selección Libre</span>
                          <span className="text-[10px] leading-tight opacity-70">Toca las letras para armar tu propia secuencia, o usa el preset.</span>
                        </label>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {KOCH_SEQUENCE.map((l: string) => {
                          const isActive = config.selectedLetters.includes(l)
                          return (
                            <button 
                              key={l}
                              onClick={() => {
                                setConfig((prev: MorseTrainerConfig) => {
                                  const newLetters = isActive 
                                    ? prev.selectedLetters.filter(char => char !== l) 
                                    : [...prev.selectedLetters, l]
                                  // Always keep at least 1
                                  if (newLetters.length === 0) return prev
                                  return { ...prev, selectedLetters: newLetters }
                                })
                              }}
                              className={cn(
                                "w-6 h-6 sm:w-7 sm:h-7 rounded-md text-[10px] sm:text-xs font-black flex items-center justify-center transition-all border",
                                isActive 
                                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" 
                                  : "bg-secondary/30 text-muted-foreground border-transparent hover:bg-primary/20 hover:text-primary cursor-pointer border shadow-none"
                              )}
                            >
                              {l}
                            </button>
                          )
                        })}
                      </div>

                      <div className="pt-4 border-t border-primary/10 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preset: Nivel Koch</span>
                          <span className="font-black text-sm text-primary">{kochLevel}</span>
                        </div>
                        <Slider 
                          value={[kochLevel]} 
                          onValueChange={([val]: number[]) => setKochLevel(val)} 
                          onPointerUp={() => {
                             setConfig((prev: MorseTrainerConfig) => ({ ...prev, selectedLetters: KOCH_SEQUENCE.slice(0, kochLevel) }))
                          }}
                          onWheel={() => {
                             // Fallback for some pointer events
                             setConfig((prev: MorseTrainerConfig) => ({ ...prev, selectedLetters: KOCH_SEQUENCE.slice(0, kochLevel) }))
                          }}
                          max={KOCH_SEQUENCE.length} min={2} step={1}
                          className="py-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-6 rounded-[2rem] bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => setConfig((prev: MorseTrainerConfig) => ({...prev, blindMode: !prev.blindMode}))}>
                       <div className="space-y-1">
                          <span className="text-sm font-black uppercase tracking-wider">Ocultar Caracteres</span>
                          <p className="text-[10px] opacity-80 leading-tight font-medium">Solo audio. Confía en tus oídos.</p>
                       </div>
                       <Switch 
                          checked={config.blindMode} 
                          onCheckedChange={() => {}} 
                          className="data-[state=checked]:bg-white data-[state=unchecked]:bg-black/20 pointer-events-none"
                       />
                    </div>
                  </section>
               </div>
            </TabsContent>

            {/* SCREEN: PROFILE / STATS */}
            <TabsContent value="profile" className="p-6 flex-1 m-0 data-[state=inactive]:hidden animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="space-y-8">
                  <header className="flex flex-col items-center py-6">
                     <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-inner group">
                           <User className="h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                        <Badge className="absolute -bottom-2 right-0 bg-primary text-white border-4 border-slate-50 dark:border-slate-950 px-2 py-0.5 font-black text-[10px]">
                          PRO
                        </Badge>
                     </div>
                     <h2 className="mt-6 text-2xl font-black tracking-tight">Estadísticas</h2>
                  </header>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-[2rem] bg-secondary/30 flex flex-col items-center gap-1 border border-primary/5">
                        <span className="text-3xl font-black text-primary leading-none">{sessions}</span>
                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Sessions</span>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-secondary/30 flex flex-col items-center gap-1 border border-primary/5">
                        <span className="text-3xl font-black text-primary leading-none">{accuracy}%</span>
                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Accuracy</span>
                    </div>
                  </div>

                  <div className="p-8 rounded-[2.5rem] bg-secondary/20 border border-primary/5 space-y-6">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Recent Achievements</h3>
                     <div className="grid gap-3">
                        {["Velocista v20", "Madrugador", "Constancia"].map((tag: string) => (
                          <div key={tag} className="flex items-center gap-4 p-4 rounded-2xl bg-background/50 border border-border/50 shadow-sm group hover:border-primary/30 transition-colors">
                            <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <BookOpen className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm font-black">{tag}</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </TabsContent>

            </div>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
