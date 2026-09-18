import { useState, useEffect } from 'react'

function serialize(value) {
  return JSON.stringify(value, (_key, v) => (v instanceof Date ? { __isDate: true, iso: v.toISOString() } : v))
}

function deserialize(text) {
  return JSON.parse(text, (_key, v) => (v && typeof v === 'object' && v.__isDate ? new Date(v.iso) : v))
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) return deserialize(stored)
    } catch {
      // 저장된 값이 손상된 경우 초기값으로 대체
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, serialize(value))
    } catch {
      // 저장 공간 초과 등은 조용히 무시 (앱 동작에는 영향 없음)
    }
  }, [key, value])

  return [value, setValue]
}
