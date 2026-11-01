import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../lib/theme'

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useTheme(), dark = theme === 'dark'
  return <button type="button" className={`theme-toggle ${className}`} onClick={() => setTheme()} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={dark} title={dark ? 'Light mode' : 'Dark mode'}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>
}
