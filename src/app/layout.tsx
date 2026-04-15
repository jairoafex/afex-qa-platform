import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], display: 'swap', preload: true })

export const metadata: Metadata = {
  title: 'Afex+ QA Platform - Gestión de Pruebas',
  description: 'Plataforma profesional de gestión de escenarios de prueba para Afex+',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
