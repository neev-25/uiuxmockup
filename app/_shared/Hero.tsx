"use client"

import React, { useState } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronRight, Loader, Send } from 'lucide-react'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { cn } from '@/lib/utils'
import { suggestions } from '@/data/constant'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'

function Hero() {
  const [userInput, setUserInput] = useState('')
  const [device, setDevice] = useState('website')
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onCreateProject = async () => {
    if (!user) {
      router.push('/sign-in')
      return
    }
    if (!userInput.trim()) {
      toast.error('Please describe the design you want')
      return
    }

    setLoading(true)
    try {
      const newProjectId = crypto.randomUUID()
      await axios.post('/api/project', {
        userInput: userInput.trim(),
        device,
        projectId: newProjectId,
      })
      router.push(`/project/${newProjectId}`)
    } catch (error: unknown) {
      console.error('Error creating project:', error)
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.error || 'Failed to create project'
        : 'Failed to create project'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-10 md:px-24 lg:px-48 xl:px-60 mt-8 relative z-10">
      <div className="flex items-center justify-center w-full mb-5">
        <div className="group relative max-w-sm flex items-center justify-center rounded-full px-4 py-1.5 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f]">
          <span
            className={cn(
              'animate-gradient absolute inset-0 block h-full w-full rounded-[inherit] bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:300%_100%] p-[1px]'
            )}
            style={{
              WebkitMask:
                'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'destination-out',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'subtract',
              WebkitClipPath: 'padding-box',
            }}
          />
          🎉 <hr className="mx-2 h-4 w-px shrink-0 bg-neutral-500" />
          <AnimatedGradientText className="text-sm font-medium">
            AI-Powered UI Design
          </AnimatedGradientText>
          <ChevronRight className="ml-1 size-4 stroke-neutral-500 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
        </div>
      </div>

      <h2 className="text-4xl md:text-5xl font-bold text-center leading-tight">
        Design High Quality{' '}
        <span className="text-primary">Website & Mobile App</span> Mockups
      </h2>
      <p className="text-center text-muted-foreground text-lg mt-3">
        Describe your idea and turn it into polished UI designs in seconds
      </p>

      <div className="flex mt-5 w-full gap-6 items-center justify-center">
        <InputGroup className="max-w-xl bg-white z-10 rounded-2xl shadow-sm">
          <InputGroupTextarea
            className="flex field-sizing-content min-h-24 w-full resize-none rounded-md bg-transparent px-3 py-2.5 text-base transition-[color,box-shadow] outline-none md:text-sm"
            placeholder="Describe the app or website you want to design..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                onCreateProject()
              }
            }}
          />
          <InputGroupAddon align="block-end">
            <Select value={device} onValueChange={setDevice}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
              </SelectContent>
            </Select>
            <InputGroupButton
              className="ml-auto"
              disabled={loading || !userInput.trim()}
              size="sm"
              variant="default"
              onClick={onCreateProject}
            >
              {loading ? (
                <Loader className="animate-spin" />
              ) : (
                <Send />
              )}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.name}
            className="p-3 border rounded-2xl flex flex-col items-center bg-white z-10 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all min-w-[100px] max-w-[120px]"
            onClick={() => setUserInput(suggestion.description)}
          >
            <span className="text-lg">{suggestion.icon}</span>
            <span className="text-center line-clamp-2 text-xs mt-1">
              {suggestion.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Hero
