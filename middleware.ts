import { NextResponse, NextRequest } from 'next/server'
import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
 
const locales = ['en', 'pt-BR']
export const defaultLocale = 'en'

function getLocale(request: NextRequest): string { 
    let headers = new Headers(request.headers)
    let acceptLanguage = headers.get("accept-language")
    if(acceptLanguage) {
        headers.set('accept-language', acceptLanguage.replaceAll("_", "-"))
    }

    let headersObject = Object.fromEntries(headers.entries())
    let languages = new Negotiator({ headers: headersObject }).languages()
    
    return match(languages, locales, defaultLocale)
}
 
export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    const pathnameIsMissingLocale = locales.every(
        (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    )

    if(pathnameIsMissingLocale) {
        const locale = getLocale(request) ?? defaultLocale
    
        return NextResponse.rewrite(
            new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.nextUrl)
        )
    }
}

export const config = {
    matcher: [
        '/((?!_next|api|favicon.ico).*)',
    ],
}