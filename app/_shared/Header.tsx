"use client"

import { Button } from '@/components/ui/button'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

function Header() {
  const { user } = useUser()

  return (
    <div className="flex items-center justify-between p-4">
      <Link href="/" className="flex gap-2 items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">
          <span className="text-primary">UIUX</span>Mock
        </h2>
      </Link>
      <ul className="hidden md:flex gap-10 items-center text-lg">
        <li>
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
        </li>
      </ul>
      {!user ? (
        <SignInButton mode="modal">
          <Button>Get Started</Button>
        </SignInButton>
      ) : (
        <UserButton />
      )}
    </div>
  )
}

export default Header
