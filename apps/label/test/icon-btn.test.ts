import { describe, expect, it } from 'vitest'
import unoConfig from '../uno.config'

const shortcut = (name: string): string => {
  const entry = (unoConfig.shortcuts as [string, string][])
    .find(([shortcutName]) => shortcutName === name)
  if (entry === undefined) throw new Error(`missing shortcut: ${name}`)
  return entry[1]
}

describe('icon-btn', () => {
  it('dims when disabled so header Divide reads as off', () => {
    const iconBtn = shortcut('icon-btn')
    expect(iconBtn).toContain('disabled:opacity-50')
    expect(iconBtn).toContain('disabled:text-gray-400')
  })
})
