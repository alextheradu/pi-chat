import { useState } from 'react'
import TabBar, { type Tab } from '../components/TabBar'
import ChannelsScreen from './ChannelsScreen'
import DMScreen from './DMScreen'
import TasksScreen from './TasksScreen'
import SettingsScreen from './SettingsScreen'
import { useAuthStore } from '../store/auth'

export default function MainApp() {
  const [tab, setTab] = useState<Tab>('channels')
  const { setUser } = useAuthStore()

  function handleSignOut() {
    setUser(null)
  }

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', background: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {tab === 'channels'  && <ChannelsScreen />}
        {tab === 'dms'       && <DMScreen />}
        {tab === 'tasks'     && <TasksScreen />}
        {tab === 'settings'  && <SettingsScreen onSignOut={handleSignOut} />}
      </div>

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
