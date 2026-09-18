import { useEffect, useState } from 'react'
import { getSyncedValue, setSyncedValue, subscribeSynced } from './docStore.js'

// useLocalStorage와 동일한 [value, setValue] 형태지만, Firestore를 통해
// 모든 기기에 실시간으로 값이 동기화됩니다.
export function useSyncedState(key, initialValue) {
  const [value, setValue] = useState(() => getSyncedValue(key, initialValue))

  useEffect(() => subscribeSynced(key, initialValue, setValue), [key])

  const setter = (next) => setSyncedValue(key, initialValue, next)
  return [value, setter]
}
