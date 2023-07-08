import { usePathname, useRouter } from 'next/navigation'

export default function LocaleSwitch({ locale }: { locale: string }) {
    let pathname = usePathname()
    const router = useRouter()
    const lang = locale === "en" ? "pt-BR" : "en"

    function handleSwitch() {
        if(pathname.startsWith(`/${locale}`)) {
            pathname = pathname.replace(`/${locale}`, `/${lang}`)
        } else {
            pathname = `/${lang}` + pathname
        }

        router.push(pathname)
    }

    return <button onClick={handleSwitch} >{lang.toUpperCase()}</button>
}