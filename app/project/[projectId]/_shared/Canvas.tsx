import React, { useState } from 'react'
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import ScreenFrame from './ScreenFrame';
import { ProjectType, ScreenConfig } from '@/type/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Minus, Plus, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
type Props={
    projectDetail:ProjectType|undefined,
    screenConfig:ScreenConfig[],
    loading?:boolean
}
function Canvas({projectDetail,screenConfig}:Props){
    
    const[panningEnabled,setPanningEnabled]=useState(true);
    const isMobile=projectDetail?.device=='mobile';
    const SCREEN_WIDTH=isMobile?400:1200;
    const SCREEN_HEIGHT=isMobile?800:800;
    const GAP=isMobile?10:20;
    const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="tools absolute p-2 px-3 bg-white shadow flex gap-3 rounded-4xl bottom-10 left-1/2 z-30 text-gray-500">
      <Button  variant={'ghost'} size={'sm'} onClick={() => zoomIn()}><Plus/></Button>
      <Button variant={'ghost'} size={'sm'} onClick={() => zoomOut()}><Minus/></Button>
      <Button variant={'ghost'} size={'sm'} onClick={() => resetTransform()}><RefreshCw/></Button>
    </div>
  );
};
  return (
    <div className='w-full h-screen bg-gray-100'
    style={{
        backgroundImage:"radial-gradient(rgba(0,0,0,0.15) 1px, transparent 1px)",
        backgroundSize:"20px 20px"
    }}
    >
       <TransformWrapper
       initialScale={0.7}
       minScale={0.7}
       maxScale={3}
       initialPositionX={50}
       initialPositionY={50}
       limitToBounds={false}
       wheel={{step:0.8}}
       doubleClick={{disabled:false}}
       panning={{disabled:!panningEnabled}}
       >
        {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
        <>
          <Controls />
      <TransformComponent
      wrapperStyle={{width:'100%',height:'100%', position:'relative'}}
      >
        <div style={{
          position:'relative', 
          width:'max-content', 
          height:'max-content',
          minWidth:`${screenConfig?.length * (SCREEN_WIDTH + GAP)}px`,
          minHeight:'100vh',
          padding:'20px'
        }}>
        {screenConfig?.map((screen,index)=>(
          <div key={screen?.screenId || index}>
         {screen?.code ? <ScreenFrame 
            x={index*(SCREEN_WIDTH+GAP)} 
            y={20} 
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            setPanningEnabled={setPanningEnabled}
            htmlCode={screen?.code}
            projectDetail={projectDetail}
            /> :
            <div 
            className='bg-white rounded-2xl p-5 gap-4 flex flex-col'
            style={{
                width:SCREEN_WIDTH,
                height:SCREEN_HEIGHT,
                position:'absolute',
                left:`${index*(SCREEN_WIDTH+GAP)}px`,
                top:20
            }}
            >
                <Skeleton className='w-full rounded-lg h-10 bg-gray-200'/>
                <Skeleton className='w-[50%] rounded-lg h-20 bg-gray-200'/>
                <Skeleton className='w-[70%] rounded-lg h-30 bg-gray-200'/>
                <Skeleton className='w-[30%] rounded-lg h-10 bg-gray-200'/>
                 <Skeleton className='w-full rounded-lg h-10 bg-gray-200'/>
                <Skeleton className='w-[50%] rounded-lg h-20 bg-gray-200'/>
                <Skeleton className='w-[70%] rounded-lg h-30 bg-gray-200'/>

            </div>
            }
            </div>
         
        ))}
        </div>

      </TransformComponent>
      </>)}
    </TransformWrapper>
    </div>
  )
}

export default Canvas
