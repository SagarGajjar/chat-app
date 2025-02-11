import React, { useEffect } from 'react'
import './App.css'
import { Home } from './Pages/Home'
import { Chat } from './Pages/Chat'
import { SocketContext, socket } from './utils/context/socket'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const App = () => {
    useEffect(() => {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification')
        } else {
            Notification.requestPermission()
        }
    }, [])

    return (
        <BrowserRouter>
            <SocketContext.Provider value={socket}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/chat" element={<Chat />} />
                </Routes>
            </SocketContext.Provider>
        </BrowserRouter>
    )
}

export default App
