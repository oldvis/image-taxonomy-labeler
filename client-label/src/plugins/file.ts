import { saveAs } from 'file-saver'

export const saveJsonFile = (
  data: unknown,
  filename: string,
): void => {
  const json = JSON.stringify(data)
  const blob = new Blob([json], { type: 'application/json' })
  saveAs(blob, filename)
}

export const parseJsonFile = (file: File): Promise<unknown> => {
  const promise = new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const { result } = event.target as FileReader
      const parsedObject = JSON.parse(result as string) as unknown
      resolve(parsedObject)
    }
    reader.readAsText(file)
  }) as Promise<unknown>
  return promise
}

export const uploadJsonFile = () => new Promise((resolve) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.onchange = (e) => {
    const target = e.target as HTMLInputElement
    if (target.files === null) {
      resolve(null)
      return
    }
    const file = target.files[0]
    resolve(parseJsonFile(file))
  }
  input.click()
})
