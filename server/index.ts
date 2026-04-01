// server/index.ts
// Combined Next.js + Socket.io custom server.
// Binds to PORT (default 3000). In production, mapped to external port 3014.
// Nginx Proxy Manager proxies chat.team1676.org → :3014 with WebSocket support.

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'
import { getToken } from 'next-auth/jwt'
import { prisma } from '../lib/prisma'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT ?? '3000')

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie ?? ''
      const req = {
        headers: { cookie: cookieHeader },
        cookies: Object.fromEntries(
          cookieHeader.split(';').map(c => c.trim().split('=').map(decodeURIComponent))
        ),
      } as Parameters<typeof getToken>[0]['req']

      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! })
      if (!token?.userId) return next(new Error('Unauthorized'))

      const user = await prisma.user.findUnique({
        where: { id: token.userId as string },
        select: { id: true, role: true, isBanned: true },
      })
      if (!user || user.isBanned) return next(new Error('Unauthorized'))

      socket.data.userId = user.id
      socket.data.role = user.role
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', async (socket) => {
    const userId = socket.data.userId as string

    // Auto-join user's channels
    const memberships = await prisma.channelMember.findMany({ where: { userId }, select: { channelId: true } })
    for (const m of memberships) await socket.join(`channel:${m.channelId}`)
    await socket.join(`user:${userId}`)

    // Presence: mark online
    await prisma.user.update({ where: { id: userId }, data: { status: 'ONLINE', lastSeenAt: new Date() } })
    io.emit('presence:update', { userId, status: 'ONLINE' })

    socket.on('message:send', async (data: { channelId: string; content: string }) => {
      const { channelId, content } = data
      const message = await prisma.message.create({
        data: { content, authorId: userId, channelId },
        include: {
          author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } },
          attachments: true, reactions: true,
        },
      })
      io.to(`channel:${channelId}`).emit('message:new', { message })
    })

    socket.on('message:edit', async (data: { messageId: string; content: string }) => {
      const msg = await prisma.message.findUnique({ where: { id: data.messageId } })
      if (!msg || (msg.authorId !== userId && !['ADMIN', 'MODERATOR'].includes(socket.data.role))) return
      await prisma.message.update({ where: { id: data.messageId }, data: { content: data.content, isEdited: true } })
      io.to(`channel:${msg.channelId}`).emit('message:edit', { messageId: data.messageId, content: data.content, editedAt: new Date() })
    })

    socket.on('message:delete', async (data: { messageId: string }) => {
      const msg = await prisma.message.findUnique({ where: { id: data.messageId } })
      if (!msg || (msg.authorId !== userId && !['ADMIN', 'MODERATOR'].includes(socket.data.role))) return
      await prisma.message.update({ where: { id: data.messageId }, data: { isDeleted: true } })
      io.to(`channel:${msg.channelId}`).emit('message:delete', { messageId: data.messageId })
    })

    socket.on('reaction:toggle', async (data: { messageId: string; emoji: string }) => {
      const { messageId, emoji } = data
      const msg = await prisma.message.findUnique({ where: { id: messageId } })
      if (!msg) return
      const existing = await prisma.reaction.findUnique({
        where: { emoji_messageId_userId: { emoji, messageId, userId } },
      })
      if (existing) {
        await prisma.reaction.delete({ where: { id: existing.id } })
      } else {
        await prisma.reaction.create({ data: { emoji, messageId, userId } })
      }
      const count = await prisma.reaction.count({ where: { messageId, emoji } })
      io.to(`channel:${msg.channelId}`).emit(existing ? 'reaction:remove' : 'reaction:add', { messageId, emoji, userId, count })
    })

    socket.on('typing:start', async ({ channelId }: { channelId: string }) => {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true, name: true } })
      socket.to(`channel:${channelId}`).emit('typing:start', { userId, channelId, userName: user?.displayName ?? user?.name ?? '' })
    })

    socket.on('typing:stop', ({ channelId }: { channelId: string }) => {
      socket.to(`channel:${channelId}`).emit('typing:stop', { userId, channelId })
    })

    socket.on('presence:update', async ({ status }: { status: string }) => {
      await prisma.user.update({ where: { id: userId }, data: { status: status as 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE' } })
      io.emit('presence:update', { userId, status })
    })

    socket.on('dm:send', async ({ receiverId, content }: { receiverId: string; content: string }) => {
      const dm = await prisma.directMessage.create({
        data: { content, senderId: userId, receiverId },
        include: { sender: { select: { id: true, name: true, displayName: true, avatarUrl: true } } },
      })
      io.to(`user:${receiverId}`).emit('dm:new', { dm })
      socket.emit('dm:new', { dm })
    })

    socket.on('poll:create', async ({ channelId, question, options }: { channelId: string; question: string; options: string[] }) => {
      const message = await prisma.message.create({
        data: { content: `**${question}**`, authorId: userId, channelId },
        include: { author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } }, attachments: true, reactions: true },
      })
      await prisma.poll.create({
        data: { messageId: message.id, question, options: { create: options.map((text, order) => ({ text, order })) } },
      })
      const fullMessage = await prisma.message.findUnique({
        where: { id: message.id },
        include: {
          author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } },
          attachments: true, reactions: true,
          poll: { include: { options: { include: { votes: true }, orderBy: { order: 'asc' } } } },
        },
      })
      io.to(`channel:${channelId}`).emit('message:new', { message: fullMessage })
    })

    socket.on('poll:vote', async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      const existing = await prisma.pollVote.findUnique({ where: { pollId_userId: { pollId, userId } } })
      if (existing) {
        await prisma.pollVote.update({ where: { id: existing.id }, data: { optionId } })
      } else {
        await prisma.pollVote.create({ data: { pollId, optionId, userId } })
      }
      const options = await prisma.pollOption.findMany({ where: { pollId }, orderBy: { order: 'asc' }, include: { votes: true } })
      const poll = await prisma.poll.findUnique({ where: { id: pollId }, select: { message: { select: { channelId: true } } } })
      if (poll) io.to(`channel:${poll.message.channelId}`).emit('poll:vote', { pollId, options })
    })

    socket.on('disconnect', async () => {
      await prisma.user.update({ where: { id: userId }, data: { status: 'OFFLINE', lastSeenAt: new Date() } })
      io.emit('presence:update', { userId, status: 'OFFLINE' })
    })
  })

  httpServer.listen(port, hostname, () => {
    console.log(`> Pi-Chat ready on http://${hostname}:${port}`)
    console.log(`> Socket.io attached to same server`)
  })
})
