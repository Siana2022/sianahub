import type { Metadata } from 'next'
import { Playfair_Display, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
})

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'SianaHub',
  description: 'Sistema operativo de Siana Digital',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${playfair.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full`}>
      <body className="min-h-full bg-[#ffffff] text-[#000000] antialiased">
        {children}
      </body>
    </html>
  )
}
