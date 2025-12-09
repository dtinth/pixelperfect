import { getRuntime } from './api'

export function showInfo(message: string) {
  getRuntime().addMessage('info', message)
}

export function showError(message: string) {
  getRuntime().addMessage('error', message)
}
