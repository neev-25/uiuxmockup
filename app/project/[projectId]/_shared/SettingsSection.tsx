"use client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RefreshDataContext } from '@/context/RefreshDataContext'
import { SettingContext } from '@/context/SettingContext'
import { THEME_NAME_LIST, THEMES } from '@/data/Themes'
import { ProjectType } from '@/type/types'
import axios from 'axios'
import { Camera, Loader, Loader2Icon, Share, Sparkles } from 'lucide-react'
import React, { useContext, useEffect, useState } from 'react'
type Props={
  projectDetail:ProjectType|undefined,
  screenDescription?:string|undefined,
  takeScreenShot:any
}
function SettingsSection({projectDetail,screenDescription,takeScreenShot}:Props) {
    const [selectedTheme,setSelectedTheme]=useState('')
    const [projectName,setProjectName]=useState(projectDetail?.projectName);
    const [userNewScreenInput,setUserNewScreenInput]=useState<string>()
    const {settingsDetail,setSettingsDetail}=useContext(SettingContext)
    const [loading,setLoading]=useState(false);
    const {refreshData,setRefreshData}=useContext(RefreshDataContext);
    const [loadingMsg,setLoadingMsg]=useState('Loading...')
  useEffect(()=>{
      if(projectDetail) {
        setProjectName(projectDetail?.projectName)
        const themeToSet = projectDetail?.theme || settingsDetail?.theme || '';
        setSelectedTheme(themeToSet as string)
      }
  },[projectDetail, settingsDetail?.theme])

const onThemeSelect=(theme:string)=>{
  console.log('Theme selected:', theme)
  setSelectedTheme(theme);
  setSettingsDetail((prev:any)=>{
    // If prev is null/undefined, use projectDetail as base, otherwise use prev
    const base = prev || projectDetail || {};
    return {
      ...base,
      theme:theme,
      projectId: base.projectId || projectDetail?.projectId,
      projectName: base.projectName || projectDetail?.projectName
    }
  })
}

const GererateNewScreen=async()=>{
try{
      setLoading(true)
      const result=await axios.post('/api/generate-config',{
        projectId:projectDetail?.projectId,
        projectName:projectDetail?.projectName,
        deviceType:projectDetail?.device,
        theme:projectDetail?.theme,
        oldScreenDescription:screenDescription
      });
      console.log(result.data);
      setRefreshData({method:'screenConfig',date:Date.now()})
      setLoading(false)
      console.log("Neev OG")
      }
      catch(e)
      {
        console.log(e)
        setLoading(false)
      }
}


    return (
    <div className='w-[300px] h-[90vh] p-5 border-r'>
      <h2 className='font-medium text-lg'>Settings</h2>
      {loading && <div className='p-3 absolute bg-blue-300/20 border-blue-400 border rounded-xl left-1/2 mt-20'>
          <h2 className='flex gap-2 items-center'>
            <Loader2Icon className='animate-spin'/>{loadingMsg}  
          </h2>
        </div>}
      <div className='mt-3'>
        <h2 className='text-sm mb-1'>Project Name</h2>
      <Input placeholder='Project Name'
      value={projectName || ''}
      onChange={(event)=>{
        const newValue = event.target.value;
        setProjectName(newValue);
       setSettingsDetail((prev:any)=>{
          const base = prev || projectDetail || {};
          return {
            ...base,
            projectName:newValue,
            projectId: base.projectId || projectDetail?.projectId,
            theme: base.theme || projectDetail?.theme
          }
        })
      }}
      />
      </div>
      <div className='mt-5'>
        <h2 className='text-sm mb-1'>Generate New Screen</h2>
            <Textarea placeholder='Enter prompt to generate screen using ai'
              onChange={(event)=>setUserNewScreenInput(event.target.value)}
            />
            <Button size={'sm'} className='mt-2 w-full' onClick={GererateNewScreen}
            disabled={loading}
            >
              {loading ? <Loader className='animate-spin'/>:<Sparkles/>}
              Generate With AI</Button>
      </div>

      <div className='mt-5'>
        <h2 className='text-sm mb-1'>Themes</h2>
        <div className='h-[200px] overflow-auto'>
            <div>
                {THEME_NAME_LIST.map((theme,index)=>(
                <div 
                key={index}
                className={`p-3 border rounded-xl mb-2
                    ${theme==selectedTheme&&'border-primary bg-primary/20'}
                    `}

                 onClick={()=>onThemeSelect(theme)}>
                    <h2>{theme}</h2>
                    <div className='flex gap-2 '>
                        <div className={`h-4 w-4 rounded-full`}
                        style={{background:THEMES[theme].primary}}
                        />
                        <div className={`h-4 w-4 rounded-full`}
                        style={{background:THEMES[theme].secondary}}
                        />
                        <div className={`h-4 w-4 rounded-full`}
                        style={{background:THEMES[theme].accent}}
                        />
                        <div className={`h-4 w-4 rounded-full`}
                        style={{background:THEMES[theme].background}}
                        />
                        <div 
                        className="h-4 w-4 rounded-full"
                        style={{
                            background: `linear-gradient(
                            135deg,
                            ${THEMES[theme].background},
                            ${THEMES[theme].primary},
                            ${THEMES[theme].accent}
                            )`,
                            }}
                        />
                    </div>            
                </div>
                ))}
            </div>
        </div>
      </div>
      <div className='mt-5'>
        <h2 className='text-sm mb-2'>Extras</h2>
        <div className='grid grid-cols-2 gap-3'>
            <Button size={'sm'} variant={'outline'} onClick={takeScreenShot}><Camera className='mr-2 h-4 w-4' />Screenshot</Button>
            <Button size={'sm'} variant={'outline'}><Share className='mr-2 h-4 w-4'/>Share</Button>
        </div>
      </div>
    </div>
  )
}

export default SettingsSection
