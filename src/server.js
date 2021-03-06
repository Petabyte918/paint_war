const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const path = require('path')
const { Game } = require('./Game.js')

const game = new Game({ size: 50, interval: 100 })
game.startInterval()

app.use(express.static('dist'))
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../dist/', 'index.html'))
})

io.on('connection', function (socket) {
  console.log(`${socket.id} connected. Waiting for the name...`)
  socket.emit('game:name')  // Asking for name

  socket.on('game:name', function (name) {
      console.log(`Player with ${socket.id} identified as ` + name)
      game.onPlayerJoin(socket, name)
  })

  socket.on('changeDir', function (dir, turnIndex) {
    game.onChangeDir(socket, dir, turnIndex)
    game.sockets.forEach(gsocket => gsocket && gsocket.emit('changeDir', socket.id, dir, turnIndex))
  })

  socket.on('disconnect', function () {
    console.log(`${socket.id} disconnected`)
    game.onPlayerLeave(socket)
  })

  socket.on('start', function () {
    console.log('Start received')
    game.sockets.forEach((socket) => socket && socket.emit('game:start'))
    game.start()
  })

  socket.on('restart', function () {
    console.log('Restart received')
    game.sockets.forEach((socket) => socket && socket.emit('game:restart'))
    game.restart()
  })

  socket.on('game:ping', () => socket.emit('game:pong', Date.now()))
})

const PORT = process.env.PORT || 3000
http.listen(PORT, function () {
  console.log(`listening on *:${PORT}`)
})
