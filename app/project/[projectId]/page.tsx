"use client"
import React, { useContext, useEffect, useState, useRef } from 'react'
import ProjectHeader from './_shared/ProjectHeader'
import SettingsSection from './_shared/SettingsSection'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { ProjectType, ScreenConfig } from '@/type/types'
import { Loader2Icon } from 'lucide-react'
import Canvas from './_shared/Canvas'
import { SettingContext } from '@/context/SettingContext'

function ProjectCanvasPlayground() {
  const {projectId}=useParams();
  const [projectDetail,setProjectDetail]=useState<ProjectType>();
  const [screenConfigOriginal,setScreenConfigOriginal]=useState<ScreenConfig[]>([]);
  const [screenConfig,setScreenConfig]=useState<ScreenConfig[]>([]);
  const {settingsDetail,setSettingsDetail}=useContext(SettingContext)
  const [loading,setLoading]=useState(false);
  const [loadingMsg,setLoadingMsg]=useState('Loading');
  const generatingRef = useRef(false);
  useEffect(()=>{
      GetProjectDetail()
    },[projectId])
  const GetProjectDetail=async()=>{
    setLoading(true);
    setLoadingMsg('Loading...')
    try {
      const result=await axios.get('/api/project?projectId='+projectId);
      console.log(result.data)
      if(result.data?.projectDetail) {
        const projectData = result.data.projectDetail;
        setProjectDetail(projectData);
        // Ensure settingsDetail always has projectId
        setSettingsDetail({
          ...projectData,
          projectId: projectData.projectId || projectId
        });
      } else {
        // If no projectDetail but we have projectId, initialize with it
        setSettingsDetail({ projectId: projectId as string });
      }
      if(result.data?.screenConfig) {
        setScreenConfigOriginal(result.data.screenConfig);
        setScreenConfig(result.data.screenConfig);
      }
    } catch(error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{
    if(projectDetail && screenConfigOriginal && screenConfigOriginal.length==0)
    {
      generateScreenConfig();
    }
  },[projectDetail, screenConfigOriginal])

  useEffect(()=>{
    if(projectDetail && screenConfigOriginal && screenConfigOriginal.length > 0 && !generatingRef.current)
    {
      // Check if any screens need UI generation
      const needsGeneration = screenConfigOriginal.some(screen => !screen?.code);
      if(needsGeneration && !loading) {
        generatingRef.current = true;
        GenerateScreenUIUX();
      }
    }
  },[projectDetail, screenConfigOriginal])

  const generateScreenConfig=async()=>{
    setLoading(true);
    setLoadingMsg("Generating Screen Config...");
    const result=await axios.post('/api/generate-config',{
      projectId:projectId,
      deviceType:projectDetail?.device,
      userInput:projectDetail?.userInput
    })
    console.log(result.data);
    GetProjectDetail();
    setLoading(false);
  }

  const GenerateScreenUIUX=async ()=>{
    if(!screenConfigOriginal || screenConfigOriginal.length === 0) {
      generatingRef.current = false;
      return;
    }
    
    setLoading(true)
    const screensToGenerate = screenConfigOriginal.filter(screen => !screen?.code);
    
    if(screensToGenerate.length === 0) {
      generatingRef.current = false;
      setLoading(false)
      return;
    }
    
    for(let index=0;index<screensToGenerate.length;index++)
    {
     const screen=screensToGenerate[index];
     if(screen?.code) continue;
     
     setLoadingMsg(`Generating Screen ${index+1}/${screensToGenerate.length}`)
     try {
       const result=await axios.post('/api/generate-screen-ui',{
        projectId,
        screenId:screen?.screenId,
        screenName:screen?.screenName,
        purpose:screen?.purpose,
        screenDescription:screen?.screenDescription
       });
       console.log(result.data)
       if(result.data && result.data.screenId) {
         setScreenConfig(prev=>prev.map((item,i)=>(
           item.screenId === result.data.screenId ? result.data : item
         )))
         setScreenConfigOriginal(prev=>prev.map((item,i)=>(
           item.screenId === result.data.screenId ? result.data : item
         )))
       }
     } catch(error) {
       console.error(`Error generating screen ${screen?.screenName}:`, error);
       setLoadingMsg(`Error generating ${screen?.screenName}. Continuing...`)
     }
    }
    generatingRef.current = false;
    setLoading(false)
    setLoadingMsg('Loading')
  }

  return (
    <div>
      <ProjectHeader/>
      <div className='flex'>
        {loading && <div className='p-3 absolute bg-blue-300/20 border-blue-400 border rounded-xl left-1/2 mt-20'>
          <h2 className='flex gap-2 items-center'>
            <Loader2Icon className='animate-spin'/>{loadingMsg}  
          </h2>
        </div>}
        {/* Settings */}
        <SettingsSection projectDetail={projectDetail}/>
        
        {/* canvas */}
        <Canvas projectDetail={projectDetail} 
        screenConfig={screenConfig}/>
      </div>
    </div>
  )
}

export default ProjectCanvasPlayground
