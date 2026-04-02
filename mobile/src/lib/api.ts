import axios from 'axios'
import { Preferences } from '@capacitor/preferences'

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://chat.example.com'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(async (config) => {
  const { value } = await Preferences.get({ key: 'jwt' })
  if (value) config.headers.Authorization = `Bearer ${value}`
  return config
})
