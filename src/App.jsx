import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import ThreeDWebsite from './ThreeDWebsite'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ThreeDWebsite />
    </>
  )
}

export default App
