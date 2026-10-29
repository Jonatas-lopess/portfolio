import { NextResponse, NextRequest } from 'next/server'
import { hasLocalePrefix, localePath, negotiateLocale } from '@/lib/locale'

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    if(!hasLocalePrefix(pathname)) {
        const locale = negotiateLocale(request.headers.get('accept-language'))

        return NextResponse.rewrite(new URL(localePath(locale, pathname), request.nextUrl))
    }
}

export const config = {
    matcher: [
        '/((?!_next|api|favicon.ico|.*\\.(?:png|jpe?g|gif|webp|svg|ico|pdf|txt|xml)$).*)',
    ],
}
