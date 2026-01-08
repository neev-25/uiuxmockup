import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

function ProjectHeader() {
  return (
    <div className='flex items-center justify-between p-3 shadow'>
      <div className='flex gap-2 items-center'>
            <Image src={'/logo.png'} alt='logo' width={40} height={40}/>
            <h2 className='text-xl font-semibold '><span className='text-primary'>UIUX</span>Mock</h2>
        </div>
        <Button><Save/>Save</Button>
    </div>
  )
}

export default ProjectHeader
