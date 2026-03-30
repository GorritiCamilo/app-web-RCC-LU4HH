"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export interface MorseTrainerConfig {
  wpm: number
  farnsworthWpm?: number
  frequency: number
  duration: number
  wordLength: "Variable" | number
  selectedLetters: string[]
  blindMode: boolean
  showMorseVisual: boolean
}

export const DEFAULT_CONFIG: MorseTrainerConfig = {
  wpm: 20,
  farnsworthWpm: 12,
  frequency: 700,
  duration: 1, // minutes
  wordLength: 5,
  selectedLetters: ["K", "M", "U", "R", "E"],
  blindMode: false,
  showMorseVisual: true,
}

export const MORSE_MAP: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
  "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  "/": "-..-.", "?": "..--..", ".": ".-.-.-", ",": "--..--", "=": "-...-",
}

export function useMorseTrainer(config: MorseTrainerConfig) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentLetter, setCurrentLetter] = useState("")
  const [currentMorse, setCurrentMorse] = useState("")
  const [timeRemaining, setTimeRemaining] = useState(config.duration * 60)
  const [phase, setPhase] = useState<"idle" | "playing" | "finished">("idle")
  
  const audioCtxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const schedulerRef = useRef<number | null>(null)
  const nextStartTimeRef = useRef<number>(0)
  const isPlayingRef = useRef(false)
  const audioPrimedRef = useRef(false)

  const stop = useCallback(() => {
    setIsPlaying(false)
    isPlayingRef.current = false
    if (timerRef.current) clearInterval(timerRef.current)
    if (schedulerRef.current) {
      window.clearTimeout(schedulerRef.current)
      schedulerRef.current = null
    }
    setPhase("idle")

    const context = audioCtxRef.current
    if (context?.state === "running") {
      void context.suspend()
    }
    
    // Stop any ongoing sound if possible (though scheduling makes this tricky without tracking every oscillator)
    // For now, we just stop the loop.
  }, [])

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioCtxRef.current
  }, [])

  const unlockAudio = useCallback(async () => {
    const context = initAudio()

    if (context.state !== "running") {
      try {
        await context.resume()
      } catch {
        return null
      }
    }

    // iOS Safari can require a first no-op sound triggered by user gesture.
    if (!audioPrimedRef.current) {
      const source = context.createBufferSource()
      source.buffer = context.createBuffer(1, 1, 22050)
      source.connect(context.destination)
      source.start(0)
      audioPrimedRef.current = true
    }

    return context
  }, [initAudio])

  const playTone = useCallback((time: number, duration: number) => {
    const context = initAudio()
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = "sine"
    oscillator.frequency.value = config.frequency
    
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(0.2, time + 0.005)
    gain.gain.linearRampToValueAtTime(0.2, time + duration - 0.005)
    gain.gain.linearRampToValueAtTime(0, time + duration)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(time)
    oscillator.stop(time + duration)
  }, [config.frequency, initAudio])

  const scheduleLetter = useCallback((letter: string, startTime: number) => {
    const morse = MORSE_MAP[letter] || ""
    const charWpm = config.wpm
    const effectiveWpm = config.farnsworthWpm || charWpm
    
    const dotDuration = 1.2 / charWpm
    const dashDuration = dotDuration * 3
    const intraCharSpace = dotDuration
    
    // Farnsworth timing: char speed vs total speed
    // Standard spacing is 3 units between letters.
    // We adjust the inter-character space to match the effective WPM.
    // Total duration of a word "PARIS" is 50 units.
    const standardUnit = 1.2 / effectiveWpm
    const interCharSpace = standardUnit * 3 // simplified farnsworth calculation
    
    let currentTime = startTime

    for (const symbol of morse) {
      if (symbol === ".") {
        playTone(currentTime, dotDuration)
        currentTime += dotDuration + intraCharSpace
      } else if (symbol === "-") {
        playTone(currentTime, dashDuration)
        currentTime += dashDuration + intraCharSpace
      }
    }

    return currentTime - intraCharSpace + interCharSpace
  }, [config.wpm, config.farnsworthWpm, playTone])

  const start = useCallback(async () => {
    const context = await unlockAudio()
    if (!context) return

    setIsPlaying(true)
    isPlayingRef.current = true
    setPhase("playing")
    setTimeRemaining(config.duration * 60)
    
    const totalDurationMs = config.duration * 60 * 1000
    const endTime = Date.now() + totalDurationMs
    
    // Scheduling loop
    nextStartTimeRef.current = context.currentTime + 0.1
    
    const run = () => {
      if (!isPlayingRef.current) return

      if (Date.now() >= endTime) {
        stop()
        setPhase("finished")
        return
      }

      // Buffer lookahead: schedule letters if they start within the next 0.5s
      while (nextStartTimeRef.current < context.currentTime + 0.5 && isPlayingRef.current) {
        const letter = config.selectedLetters[Math.floor(Math.random() * config.selectedLetters.length)]
        
        // Use a timeout to update the UI closer to when the letter is actually heard
        // context.currentTime vs Date.now() sync is tricky, so we approximate
        const delayToVisual = (nextStartTimeRef.current - context.currentTime) * 1000
        setTimeout(() => {
          if (isPlayingRef.current) {
            setCurrentLetter(letter)
            setCurrentMorse(MORSE_MAP[letter] || "")
          }
        }, delayToVisual)

        nextStartTimeRef.current = scheduleLetter(letter, nextStartTimeRef.current)
      }

      if (isPlayingRef.current) {
        schedulerRef.current = window.setTimeout(run, 60)
      }
    }

    run()

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [config, scheduleLetter, stop, unlockAudio])

  useEffect(() => {
    return () => {
      isPlayingRef.current = false
      if (timerRef.current) clearInterval(timerRef.current)
      if (schedulerRef.current) window.clearTimeout(schedulerRef.current)
    }
  }, [])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && isPlayingRef.current) {
        stop()
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [stop])

  return {
    isPlaying,
    currentLetter,
    currentMorse,
    timeRemaining,
    phase,
    start,
    stop,
    unlockAudio,
    MORSE_MAP,
    playSingleLetter: async (letter: string) => {
      const context = await unlockAudio()
      if (!context) return
      scheduleLetter(letter, context.currentTime + 0.01)
    }
  }
}

