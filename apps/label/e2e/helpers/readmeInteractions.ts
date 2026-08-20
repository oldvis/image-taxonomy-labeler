import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

const IMAGE_DRAG_MIME = 'application/x-oldvis-image'

/** Class-token match. String toHaveClass() compares the entire class attribute. */
const BORDER_BLACK = /(^|\s)border-black(\s|$)/

/** Groups-row content whose visible taxon name matches exactly. */
export const taxonContent = (page: Page, name: string): Locator => (
  page.locator('.el-tree-node__content').filter({
    has: page.locator('div.pointer-events-none', { hasText: new RegExp(`^${name}$`) }),
  })
)

const taxonRowRoot = (page: Page, name: string): Locator => (
  taxonContent(page, name).locator('.flex.grow.gap-2.items-center')
)

const dispatchImageDragOver = async (
  sourceImg: Locator,
  row: Locator,
  ontoMulti: boolean,
): Promise<void> => {
  const uuid = await sourceImg.evaluate((img) => {
    const match = (img as HTMLImageElement).currentSrc.match(/\/uuids\/([0-9a-f-]+)\//i)
    if (match?.[1] == null) throw new Error('image src has no uuid')
    return match[1]
  })
  await row.evaluate((el, { uuid, ontoMulti, mime }) => {
    const dt = new DataTransfer()
    dt.setData(mime, uuid)
    dt.setData('text/plain', uuid)
    const init: DragEventInit = { bubbles: true, cancelable: true, dataTransfer: dt }
    el.dispatchEvent(new DragEvent('dragover', init))
    if (!ontoMulti) return
    const zone = el.querySelector('[data-multi-label-zone]')
    if (zone == null) throw new Error('multi-label zone missing')
    zone.dispatchEvent(new DragEvent('dragover', init))
  }, { uuid, ontoMulti, mime: IMAGE_DRAG_MIME })
}

const dispatchNodeDragOver = async (
  page: Page,
  sourceName: string,
  targetName: string,
  at?: { x: number, y: number },
): Promise<void> => {
  await page.evaluate(({ sourceName, targetName, at }) => {
    const nodeFor = (name: string): HTMLElement | undefined => (
      Array.from(document.querySelectorAll('.el-tree-node')).find((node) => {
        const content = node.querySelector(':scope > .el-tree-node__content')
        if (content == null) return false
        return Array.from(content.querySelectorAll('div.pointer-events-none'))
          .some((label) => (label.textContent ?? '').trim() === name)
      }) as HTMLElement | undefined
    )
    const source = nodeFor(sourceName)
    const target = nodeFor(targetName)
    if (source == null || target == null) {
      throw new Error(`tree node missing: ${sourceName} -> ${targetName}`)
    }
    const dt = new DataTransfer()
    dt.effectAllowed = 'move'
    dt.setData('text/plain', '')
    source.dispatchEvent(new DragEvent('dragstart', {
      bubbles: true,
      cancelable: true,
      dataTransfer: dt,
    }))
    const content = target.querySelector(':scope > .el-tree-node__content')
    if (!(content instanceof HTMLElement)) throw new Error('target content missing')
    const fireOver = (el: Element, clientX: number, clientY: number): void => {
      el.dispatchEvent(new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
        clientX,
        clientY,
      }))
    }
    if (at == null) {
      const rect = content.getBoundingClientRect()
      fireOver(target, rect.left + 24, rect.top + rect.height * 0.5)
      return
    }
    const merge = content.querySelector('[data-merge-zone]')
    if (merge == null) throw new Error('merge zone missing')
    fireOver(merge, at.x, at.y)
    fireOver(target, at.x, at.y)
  }, { sourceName, targetName, at })
}

const cancelNodeDrag = async (page: Page, sourceName: string): Promise<void> => {
  await page.evaluate((sourceName) => {
    const nodeFor = (name: string): HTMLElement | undefined => (
      Array.from(document.querySelectorAll('.el-tree-node')).find((node) => {
        const content = node.querySelector(':scope > .el-tree-node__content')
        if (content == null) return false
        return Array.from(content.querySelectorAll('div.pointer-events-none'))
          .some((label) => (label.textContent ?? '').trim() === name)
      }) as HTMLElement | undefined
    )
    const source = nodeFor(sourceName)
    if (source == null) throw new Error(`tree node missing: ${sourceName}`)
    const dt = new DataTransfer()
    dt.effectAllowed = 'move'
    dt.setData('text/plain', '')
    const rect = source.getBoundingClientRect()
    source.dispatchEvent(new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      dataTransfer: dt,
      clientX: rect.left + 24,
      clientY: rect.top + rect.height * 0.5,
    }))
    source.dispatchEvent(new DragEvent('dragend', {
      bubbles: true,
      cancelable: true,
      dataTransfer: dt,
    }))
  }, sourceName)
}

export async function captureTaxonHoverClip(
  page: Page,
  name: string,
  outPath: string,
): Promise<void> {
  const row = taxonContent(page, name)
  await row.hover()
  await row.getByTitle('Edit the node name').waitFor({ state: 'visible' })
  await row.screenshot({ path: outPath, animations: 'disabled' })
  await page.mouse.move(0, 0)
  await expect(row.getByTitle('Edit the node name')).toHaveCount(0)
}

export async function captureImageDragClips(
  page: Page,
  taxon: string,
  singlePath: string,
  multiPath: string,
): Promise<void> {
  const img = page.locator('.grid-cols-3 img').first()
  await img.waitFor({ state: 'visible' })
  const row = taxonRowRoot(page, taxon)
  await row.scrollIntoViewIfNeeded()

  const multi = row.locator('[data-multi-label-zone]')
  await dispatchImageDragOver(img, row, false)
  await expect(multi).not.toHaveClass(/opacity-0/)
  await expect(multi).not.toHaveClass(BORDER_BLACK)
  await taxonContent(page, taxon).screenshot({ path: singlePath, animations: 'disabled' })

  await dispatchImageDragOver(img, row, true)
  await expect(multi).toHaveClass(BORDER_BLACK)
  await taxonContent(page, taxon).screenshot({ path: multiPath, animations: 'disabled' })

  await row.evaluate((el) => {
    el.dispatchEvent(new DragEvent('dragleave', {
      bubbles: true,
      relatedTarget: document.body,
    }))
  })
  await expect(multi).toHaveClass(/opacity-0/)
}

export async function captureNodeDragClips(
  page: Page,
  source: string,
  target: string,
  movePath: string,
  mergePath: string,
): Promise<void> {
  const targetContent = taxonContent(page, target)
  await targetContent.scrollIntoViewIfNeeded()
  const merge = targetContent.locator('[data-merge-zone]')

  await dispatchNodeDragOver(page, source, target)
  await expect(targetContent.getByText('merge')).toBeVisible()
  await expect(merge).not.toHaveClass(BORDER_BLACK)
  await targetContent.screenshot({ path: movePath, animations: 'disabled' })

  const box = await merge.boundingBox()
  if (box == null) throw new Error('merge zone has no box')
  await dispatchNodeDragOver(page, source, target, {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  })
  await expect(merge).toHaveClass(BORDER_BLACK)
  await targetContent.screenshot({ path: mergePath, animations: 'disabled' })

  await cancelNodeDrag(page, source)
  await expect(targetContent.getByText('merge')).toBeHidden()
}
