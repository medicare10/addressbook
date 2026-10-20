import { useEffect, useState } from 'react'

export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    if (delay <= 0) return undefined

    const timer = window.setTimeout(() => {
      setDebounced(value)
    }, delay)

    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}
