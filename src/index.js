/* eslint-disable import/extensions */
import express from 'express'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import http from 'http'

import { Server } from 'socket.io'
import BadWords from 'bad-words'
import { generateMessage } from './utils/messages.mjs'
import { addUser, getUser, getUsersInRoom, removeUser } from './utils/users.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const server = http.createServer(app)
const io = new Server(server)

io.on('connection', (socket) => {
    // welcome message to room and new user joined message
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }
        socket.join(user.room)

        // welcome message
        socket.emit(
            'message',
            generateMessage(`Welcome ${user.username} Tiktoker!`, 'Admin')
        )

        // send joined message except current user
        socket.broadcast
            .to(user.room)
            .emit(
                'message',
                generateMessage(
                    `Yay, ${user.username} tiktoker joined our ${user.room} group`,
                    'Admin'
                )
            )

        // send room users
        io.to(user.room).emit('roomdata', {
            room: user.room,
            users: getUsersInRoom(user.room),
        })
        callback()
        return true
    })

    // send message to every user
    socket.on('sendMessage', (message, callback) => {
        const filter = new BadWords()

        if (filter.isProfane(message)) {
            return callback('profanity not allowed')
        }
        const user = getUser(socket.id)
        io.to(user.room).emit(
            'message',
            generateMessage(message, user.username)
        )
        callback()
        return ''
    })

    // send location to all users
    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit(
            'locationMessage',
            generateMessage(
                `https://google.com/maps?q=${location.latitude},${location.longitude}`,
                user.username
            )
        )
        // callback('something went wrong')
        callback()
    })

    // send disconnected message
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit(
                'message',
                generateMessage(
                    `Oops ${user.username} tiktoker left our precious ${user.room} group`,
                    'Admin'
                )
            )
            io.to(user.room).emit('roomdata', {
                room: user.room,
                users: getUsersInRoom(user.room),
            })
        }
    })
})

const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

app.get('/', (req, res) => {
    res.send('index.html')
})

server.listen(port, () => {
    console.log(`Server started on port ${port}`)
})
