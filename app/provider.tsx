'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { UserDetailContext } from '@/context/UserDetailContext'
import { SettingContext } from '@/context/SettingContext'
import { RefreshDataContext } from '@/context/RefreshDataContext'
import { RefreshData, SettingsDetail, UserType } from '@/type/types'

function Provider({ children }: { children: React.ReactNode }) {
  const [userDetail, setUserDetail] = useState<UserType | undefined>()
  const [settingsDetail, setSettingsDetail] = useState<SettingsDetail | null>(null)
  const [refreshData, setRefreshData] = useState<RefreshData | undefined>()

  useEffect(() => {
    const createNewUser = async () => {
      try {
        const result = await axios.post('/api/user', {})
        setUserDetail(result.data)
      } catch (error) {
        console.error('Error creating user:', error)
      }
    }
    createNewUser()
  }, [])

  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <SettingContext.Provider value={{ settingsDetail, setSettingsDetail }}>
        <RefreshDataContext.Provider value={{ refreshData, setRefreshData }}>
          {children}
        </RefreshDataContext.Provider>
      </SettingContext.Provider>
    </UserDetailContext.Provider>
  )
}

export default Provider
