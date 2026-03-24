import { Role } from '@prisma/client'

export const PERMISSIONS = {
  'message:send':                   ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER', 'GUEST'],
  'message:send:announcement':      ['ADMIN', 'MODERATOR'],
  'message:delete:own':             ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER'],
  'message:delete:any':             ['ADMIN', 'MODERATOR'],
  'message:edit:own':               ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER'],
  'message:pin':                    ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD'],
  'channel:create':                 ['ADMIN', 'MODERATOR'],
  'channel:archive':                ['ADMIN', 'MODERATOR'],
  'channel:delete':                 ['ADMIN'],
  'channel:manage_members':         ['ADMIN', 'MODERATOR'],
  'member:ban':                     ['ADMIN', 'MODERATOR'],
  'member:change_role':             ['ADMIN'],
  'member:invite_guest':            ['ADMIN'],
  'admin:access':                   ['ADMIN'],
  'admin:view_moderator':           ['ADMIN', 'MODERATOR'],
  'admin:audit:read':               ['ADMIN', 'MODERATOR'],
  'admin:announcements:broadcast':  ['ADMIN', 'MODERATOR'],
  'task:create':                    ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER'],
  'task:assign:any':                ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD'],
  'task:assign:self':               ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER'],
  'poll:create':                    ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER'],
  'dm:send':                        ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER', 'GUEST'],
  'file:upload':                    ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER'],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role)
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: role ${role} does not have ${permission}`)
  }
}
