"use client"

import { useState, useRef, useCallback, useEffect } from "react"

// Morse code definitions
const MORSE_CODE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".",
  F: "..-.", G: "--.", H: "....", I: "..", J: ".---",
  K: "-.-", L: ".-..", M: "--", N: "-.", O: "---",
  P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-",
  U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--",
  Z: "--..", "0": "-----", "1": ".----", "2": "..---",
  "3": "...--", "4": "....-", "5": ".....", "6": "-....",
  "7": "--...", "8": "---..", "9": "----.",
}

export interface ExamResult {
  letter: string
  userAnswer: string
  correct: boolean
  timestamp: number
}

export interface ExamConfig {
  selectedLetters: string[]
  wpm: number
  frequency: number
  farnsworthSpacing: number
  duration: number // in minutes
}

export function useExamMode(config: ExamConfig) {
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [currentLetter, setCurrentLetter] = useState<string | null>(null)
  const [currentMorse, setCurrentMorse] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(config.duration * 60)
  const [results, setResults] = useState<ExamResult[]>([])
  const [waitingForInput, setWaitingForInput] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRunningRef = useRef(false)
  const currentLetterRef = useRef<string | null>(null)
  const resolveInputRef = useRef<((value: string) => void) | null>(null)
  const stopRef = useRef<() => void>(() => {})

  // Calculate timing based on WPM
  const getDotDuration = useCallback(() => {
    return 1200 / config.wpm
  }, [config.wpm])

  // Clean up all timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  // Play a tone
  const playTone = useCallback((duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const audioContext = initAudio()
      
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime)
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.005)
      gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + duration / 1000 - 0.005)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration / 1000)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
      
      const timeout = setTimeout(() => {
        resolve()
      }, duration)
      timeoutsRef.current.push(timeout)
    })
  }, [config.frequency, initAudio])

  // Play morse code for a letter
  const playMorseCode = useCallback(async (letter: string): Promise<void> => {
    const morse = MORSE_CODE[letter]
    if (!morse || !isRunningRef.current) return

    const dotDuration = getDotDuration()
    const dashDuration = dotDuration * 3
    const elementGap = dotDuration
    const farnsworthGap = dotDuration * config.farnsworthSpacing

    for (let i = 0; i < morse.length; i++) {
      if (!isRunningRef.current) return
      
      const element = morse[i]
      if (element === ".") {
        await playTone(dotDuration)
      } else if (element === "-") {
        await playTone(dashDuration)
      }
      
      if (i < morse.length - 1 && isRunningRef.current) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, elementGap)
          timeoutsRef.current.push(timeout)
        })
      }
    }

    if (isRunningRef.current) {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, farnsworthGap)
        timeoutsRef.current.push(timeout)
      })
    }
  }, [getDotDuration, config.farnsworthSpacing, playTone])

  // Get random letter from selected
  const getRandomLetter = useCallback(() => {
    const letters = config.selectedLetters
    if (letters.length === 0) return "K"
    return letters[Math.floor(Math.random() * letters.length)]
  }, [config.selectedLetters])

  // Wait for user input
  const waitForUserInput = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      setWaitingForInput(true)
      resolveInputRef.current = resolve
    })
  }, [])

  // Submit user answer
  const submitAnswer = useCallback((answer: string) => {
    if (!waitingForInput || !currentLetterRef.current) return
    
    const normalizedAnswer = answer.trim().toUpperCase()
    const isCorrect = normalizedAnswer === currentLetterRef.current
    
    setResults((prev) => [
      ...prev,
      {
        letter: currentLetterRef.current!,
        userAnswer: normalizedAnswer || "-",
        correct: isCorrect,
        timestamp: Date.now(),
      },
    ])
    
    setWaitingForInput(false)
    
    if (resolveInputRef.current) {
      resolveInputRef.current(normalizedAnswer)
      resolveInputRef.current = null
    }
  }, [waitingForInput])

  // Main exam loop
  const runExamLoop = useCallback(async () => {
    while (isRunningRef.current) {
      const letter = getRandomLetter()
      const morse = MORSE_CODE[letter]
      
      currentLetterRef.current = letter
      setCurrentLetter(letter)
      setCurrentMorse(morse)
      
      // Play morse code
      await playMorseCode(letter)
      if (!isRunningRef.current) break
      
      // Wait for user input
      await waitForUserInput()
      if (!isRunningRef.current) break
      
      // Small pause before next letter
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 500)
        timeoutsRef.current.push(timeout)
      })
    }
  }, [getRandomLetter, playMorseCode, waitForUserInput])

  // Start exam
  const start = useCallback(() => {
    if (config.selectedLetters.length === 0) return
    
    isRunningRef.current = true
    setIsRunning(true)
    setIsFinished(false)
    setResults([])
    setTimeRemaining(config.duration * 60)
    
    // Initialize and resume audio context
    const audioContext = initAudio()
    if (audioContext.state === "suspended") {
      audioContext.resume()
    }
    
    // Start countdown timer
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stopRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    runExamLoop()
  }, [config.duration, config.selectedLetters.length, runExamLoop, initAudio])

  // Stop exam
  const stop = useCallback(() => {
    const wasRunning = isRunningRef.current
    isRunningRef.current = false
    setIsRunning(false)
    setWaitingForInput(false)
    setCurrentLetter(null)
    setCurrentMorse(null)
    
    clearAllTimeouts()
    
    // Resolve any pending input
    if (resolveInputRef.current) {
      resolveInputRef.current("")
      resolveInputRef.current = null
    }
    
    // Mark as finished if we were running (not just cancelled)
    if (wasRunning) {
      setIsFinished(true)
    }
  }, [clearAllTimeouts])

  // Update stop ref
  useEffect(() => {
    stopRef.current = stop
  }, [stop])

  // Reset exam
  const reset = useCallback(() => {
    setIsFinished(false)
    setResults([])
    setTimeRemaining(config.duration * 60)
  }, [config.duration])

  // Reset timer when duration changes
  useEffect(() => {
    if (!isRunning && !isFinished) {
      setTimeRemaining(config.duration * 60)
    }
  }, [config.duration, isRunning, isFinished])

  // Cleanup on unmount
  useEffect(() => {
    const audioCtx = audioContextRef.current
    return () => {
      isRunningRef.current = false
      clearAllTimeouts()
      // Don't close AudioContext - let browser handle it
      if (audioCtx) {
        audioCtx.suspend().catch(() => {})
      }
    }
  }, [clearAllTimeouts])

  // Calculate stats
  const correctCount = results.filter((r) => r.correct).length
  const incorrectCount = results.filter((r) => !r.correct).length
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0

  return {
    isRunning,
    isFinished,
    currentLetter,
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
    MORSE_CODE,
  }
}
