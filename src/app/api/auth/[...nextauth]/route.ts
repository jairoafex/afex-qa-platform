import NextAuth, { DefaultSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
