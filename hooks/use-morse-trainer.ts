"use client"

import { useState, useRef, useCallback, useEffect } from "react"

// Morse code definitions
const MORSE_CODE: Record<string, string> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
}

// Alfabeto fonético ICAO/NATO (pronunciación hispanizada)
const PHONETIC_ALPHABET: Record<string, string> = {
  A: "Alfa",
  B: "Bravo",
  C: "Charlie",
  D: "Delta",
  E: "Echo",
  F: "Foxtrot",
  G: "Golf",
  H: "Hotel",
  I: "India",
  J: "Juliet",
  K: "Kilo",
  L: "Lima",
  M: "Mike",
  N: "November",
  O: "Oscar",
  P: "Papa",
  Q: "Quebec",
  R: "Romeo",
  S: "Sierra",
  T: "Tango",
  U: "Uniform",
  V: "Victor",
  W: "Whiskey",
  X: "X-ray",
  Y: "Yankee",
  Z: "Zulu",
  "0": "Cero",
  "1": "Uno",
  "2": "Dos",
  "3": "Tres",
  "4": "Cuatro",
  "5": "Cinco",
  "6": "Seis",
  "7": "Siete",
  "8": "Ocho",
  "9": "Nueve",
}

// Koch method order - ordenado por dificultad (más fáciles primero)
// E, T = 1 elemento | I, M, A, N = 2 elementos | etc.
export const KOCH_ORDER = [
  // Nivel 1: 1 elemento (más fáciles)
  "E", "T",
  // Nivel 2: 2 elementos simples
  "I", "M", "A", "N",
  // Nivel 3: 2-3 elementos
  "S", "O", "R", "U", "D", "K", "G", "W",
  // Nivel 4: 3-4 elementos mixtos
  "H", "L", "F", "P", "B", "V", "J", "X",
  // Nivel 5: patrones complejos
  "C", "Y", "Z", "Q",
  // Números (por longitud y patrón)
  "5", "0", "1", "6", "2", "7", "3", "8", "4", "9",
]

export interface MorseTrainerConfig {
  selectedLetters: string[]
  wpm: number
  frequency: number
  farnsworthSpacing: number
  duration: number // in minutes
  startDelay: number // delay inicial en segundos
  blindMode: boolean
  showMorseVisual: boolean // mostrar puntos y rayas en pantalla
}

export const DEFAULT_CONFIG: MorseTrainerConfig = {
  selectedLetters: ["E", "T"],
  wpm: 15,
  frequency: 700,
  farnsworthSpacing: 3,
  duration: 15,
  startDelay: 10, // 10 segundos por defecto
  blindMode: false,
  showMorseVisual: false, // por defecto oculto para no crear vicios
}

export function useMorseTrainer(config: MorseTrainerConfig) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentLetter, setCurrentLetter] = useState<string | null>(null)
  const [currentMorse, setCurrentMorse] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(config.duration * 60)
  const [phase, setPhase] = useState<"idle" | "countdown" | "morse" | "wait1" | "speech" | "wait2">("idle")
  const [countdown, setCountdown] = useState<number | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPlayingRef = useRef(false)
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null)
  const spanishVoiceRef = useRef<SpeechSynthesisVoice | null>(null)

  // Find best Spanish voice (prefer Latin American or Mexican)
  const findSpanishVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices()
    
    // Priority order for Spanish voices (prefer Latin American accents)
    const priorities = [
      "es-MX", // Mexico
      "es-AR", // Argentina
      "es-CO", // Colombia
      "es-CL", // Chile
      "es-PE", // Peru
      "es-VE", // Venezuela
      "es-419", // Latin America generic
      "es-US", // US Spanish
      "es-ES", // Spain (fallback)
      "es",    // Generic Spanish
    ]
    
    for (const langCode of priorities) {
      const voice = voices.find(v => 
        v.lang.toLowerCase().startsWith(langCode.toLowerCase()) ||
        v.lang.toLowerCase() === langCode.toLowerCase()
      )
      if (voice) {
        return voice
      }
    }
    
    // Last resort: any voice with "spanish" or "español" in name
    const anySpanish = voices.find(v => 
      v.name.toLowerCase().includes("spanish") ||
      v.name.toLowerCase().includes("español") ||
      v.lang.startsWith("es")
    )
    
    return anySpanish || null
  }, [])

  // Initialize voices when they're loaded
  useEffect(() => {
    const loadVoices = () => {
      spanishVoiceRef.current = findSpanishVoice()
    }
    
    // Voices might already be loaded
    loadVoices()
    
    // Or they might load async
    window.speechSynthesis.onvoiceschanged = loadVoices
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [findSpanishVoice])

  // Calculate timing based on WPM
  const getDotDuration = useCallback(() => {
    // Standard: PARIS = 50 units, so 1 WPM = 1200ms/unit
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
      
      // Smooth attack and release to avoid clicks
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.005)
      gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + duration / 1000 - 0.005)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration / 1000)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
      
      oscillatorRef.current = oscillator
      gainNodeRef.current = gainNode
      
      const timeout = setTimeout(() => {
        resolve()
      }, duration)
      timeoutsRef.current.push(timeout)
    })
  }, [config.frequency, initAudio])

  // Play morse code for a letter
  const playMorseCode = useCallback(async (letter: string): Promise<void> => {
    const morse = MORSE_CODE[letter]
    if (!morse || !isPlayingRef.current) return

    const dotDuration = getDotDuration()
    const dashDuration = dotDuration * 3
    const elementGap = dotDuration
    const farnsworthGap = dotDuration * config.farnsworthSpacing

    for (let i = 0; i < morse.length; i++) {
      if (!isPlayingRef.current) return
      
      const element = morse[i]
      if (element === ".") {
        await playTone(dotDuration)
      } else if (element === "-") {
        await playTone(dashDuration)
      }
      
      // Gap between elements (except after last)
      if (i < morse.length - 1 && isPlayingRef.current) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, elementGap)
          timeoutsRef.current.push(timeout)
        })
      }
    }

    // Extra Farnsworth spacing after character
    if (isPlayingRef.current) {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, farnsworthGap)
        timeoutsRef.current.push(timeout)
      })
    }
  }, [getDotDuration, config.farnsworthSpacing, playTone])

  // Speak phonetic name
  const speakPhonetic = useCallback((letter: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!isPlayingRef.current) {
        resolve()
        return
      }

      const phonetic = PHONETIC_ALPHABET[letter] || letter
      const utterance = new SpeechSynthesisUtterance(phonetic)
      
      // Use the best Spanish voice we found
      if (spanishVoiceRef.current) {
        utterance.voice = spanishVoiceRef.current
        utterance.lang = spanishVoiceRef.current.lang
      } else {
        // Fallback to Mexican Spanish
        utterance.lang = "es-MX"
      }
      
      utterance.rate = 0.85
      utterance.pitch = 1.0
      
      speechSynthRef.current = utterance
      
      utterance.onend = () => {
        resolve()
      }
      utterance.onerror = () => {
        resolve()
      }
      
      window.speechSynthesis.speak(utterance)
    })
  }, [])

  // Get random letter from selected
  const getRandomLetter = useCallback(() => {
    const letters = config.selectedLetters
    if (letters.length === 0) return "K"
    return letters[Math.floor(Math.random() * letters.length)]
  }, [config.selectedLetters])

  // Main training loop
  const runTrainingLoop = useCallback(async () => {
    while (isPlayingRef.current) {
      const letter = getRandomLetter()
      const morse = MORSE_CODE[letter]
      
      setCurrentLetter(letter)
      setCurrentMorse(morse)
      setPhase("morse")
      
      // Play morse code
      await playMorseCode(letter)
      if (!isPlayingRef.current) break
      
      // Wait 2 seconds
      setPhase("wait1")
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 2000)
        timeoutsRef.current.push(timeout)
      })
      if (!isPlayingRef.current) break
      
      // Speak phonetic
      setPhase("speech")
      await speakPhonetic(letter)
      if (!isPlayingRef.current) break
      
      // Wait 2 seconds
      setPhase("wait2")
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 2000)
        timeoutsRef.current.push(timeout)
      })
    }
  }, [getRandomLetter, playMorseCode, speakPhonetic])

  // Stop ref for use in timer
  const stopRef = useRef<() => void>(() => {})

  // Start training with initial delay
  const start = useCallback(async () => {
    if (config.selectedLetters.length === 0) return
    
    isPlayingRef.current = true
    setIsPlaying(true)
    setTimeRemaining(config.duration * 60)
    
    // Initialize and resume audio context
    const audioContext = initAudio()
    if (audioContext.state === "suspended") {
      audioContext.resume()
    }
    
    // Initial countdown delay
    if (config.startDelay > 0) {
      setPhase("countdown")
      setCountdown(config.startDelay)
      
      for (let i = config.startDelay; i > 0; i--) {
        if (!isPlayingRef.current) return
        setCountdown(i)
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 1000)
          timeoutsRef.current.push(timeout)
        })
      }
      setCountdown(null)
    }
    
    if (!isPlayingRef.current) return
    
    // Start countdown timer for session duration
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stopRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    runTrainingLoop()
  }, [config.duration, config.selectedLetters.length, config.startDelay, runTrainingLoop, initAudio])

  // Stop training
  const stop = useCallback(() => {
    isPlayingRef.current = false
    setIsPlaying(false)
    setPhase("idle")
    setCurrentLetter(null)
    setCurrentMorse(null)
    setCountdown(null)
    
    clearAllTimeouts()
    
    // Stop any playing oscillator
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop()
      } catch {
        // Already stopped
      }
      oscillatorRef.current = null
    }
    
    // Cancel speech
    window.speechSynthesis.cancel()
  }, [clearAllTimeouts])

  // Update stop ref
  useEffect(() => {
    stopRef.current = stop
  }, [stop])

  // Reset timer when duration changes
  useEffect(() => {
    if (!isPlaying) {
      setTimeRemaining(config.duration * 60)
    }
  }, [config.duration, isPlaying])

  // Cleanup on unmount
  useEffect(() => {
    const audioCtx = audioContextRef.current
    return () => {
      isPlayingRef.current = false
      clearAllTimeouts()
      window.speechSynthesis.cancel()
      // Don't close AudioContext - let browser handle it
      // Closing causes issues with React strict mode and hot reload
      if (audioCtx) {
        audioCtx.suspend().catch(() => {})
      }
    }
  }, [clearAllTimeouts])

  return {
    isPlaying,
    currentLetter,
    currentMorse,
    timeRemaining,
    phase,
    countdown,
    start,
    stop,
    MORSE_CODE,
    PHONETIC_ALPHABET,
  }
}
