import { usePathname, useRouter } from 'next/navigation'
import { Locale, locales, switchLocalePath } from '@/lib/locale'

export default function LocaleSwitch({ locale }: { locale: Locale }) {
    const pathname = usePathname()
    const router = useRouter()
    const other = locales.find((l) => l !== locale) ?? locale

    function handleSwitch() {
        router.push(switchLocalePath(pathname, other))
    }

    return <button onClick={handleSwitch} >{other.toUpperCase()}</button>
}
