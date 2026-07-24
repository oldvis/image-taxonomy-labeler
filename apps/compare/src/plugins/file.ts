import { saveAs } from 'file-saver'

export const saveJsonFile = (
  data: unknown,
  filename: string,
): void => {
  const json = JSON.stringify(data)
  const blob = new Blob([json], { type: 'application/json' })
  saveAs(blob, filename)
}

export const parseJsonFile = (file: File): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)))
      }
      catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsText(file)
  })

export const uploadJsonFile = (): Promise<unknown | null> =>
  new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      parseJsonFile(file).then(resolve, reject)
    }
    input.click()
  })

export const uploadFiles = (): Promise<null | FileList> =>
  new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = () => {
      const { files } = input
      if (files === null || files.length === 0) {
        resolve(null)
        return
      }
      resolve(files)
    }
    input.click()
  })
