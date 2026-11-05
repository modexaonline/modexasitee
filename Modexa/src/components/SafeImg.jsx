import { useState } from 'react'
import { FALLBACK_IMG } from '../lib/format'

export default function SafeImg({ src, alt = '', ...rest }) {
  const [failed, setFailed] = useState(false)
  return <img src={!src || failed ? FALLBACK_IMG : src} alt={alt} onError={() => setFailed(true)} decoding="async" {...rest} />
}
