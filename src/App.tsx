import { useEffect } from 'react'
import { useGame } from './store'
import { Title } from './screens/Title'
import { Login } from './screens/Login'
import { Files } from './screens/Files'
import { NewCharacter } from './screens/NewCharacter'
import { Hold } from './screens/Hold'
import { EventPlayer, LoadingScreen, Notice, YouDied } from './ui/Overlays'

export default function App() {
  const { screen, user, go } = useGame()
  useEffect(() => useGame.getState().init(), [])
  // Signed out from another tab or device: back to the title.
  useEffect(() => { if (user === null && screen !== 'title' && screen !== 'menu' && screen !== 'login') go('title') }, [user, screen, go])

  return (
    <div className="screen">
      {(screen === 'title' || screen === 'menu') && <Title />}
      {screen === 'login' && <Login />}
      {screen === 'files' && <Files />}
      {screen === 'new' && <NewCharacter />}
      {screen === 'game' && <Hold />}
      {screen === 'game' && <EventPlayer />}
      {screen === 'game' && <YouDied />}
      <Notice />
      <LoadingScreen />
    </div>
  )
}
