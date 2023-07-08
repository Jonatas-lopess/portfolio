import Light from '@/components/svg/Light'
import Dark from '@/components/svg/Dark'
import { useTheme } from 'next-themes'

export default function ThemeSwitch() {
    const ICON_SIZE = 18
    const { theme, setTheme } = useTheme()

    return theme === 'dark'
        ? <Light onClick={() => setTheme('light')} height={ICON_SIZE} width={ICON_SIZE} className='dark:fill-white' />
        : <Dark onClick={() => setTheme('dark')} height={ICON_SIZE} width={ICON_SIZE}  className='dark:fill-white' />
}