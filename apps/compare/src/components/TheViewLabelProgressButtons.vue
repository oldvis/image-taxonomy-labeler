<script setup lang="ts">
import {
  formatLabelProgressError,
  parseAnnotatorProfileFile,
} from '@image-taxonomy-labeler/shared/plugins/labelProgress'
import { storeToRefs } from 'pinia'
import { parseJsonFile, uploadFiles } from '~/plugins/file'
import { useStore as useMessageStore } from '~/stores/message'
import { buildAnnotatorProfile, useStore } from '~/stores/profile'

const { addProfiles } = useStore()
const { profiles } = storeToRefs(useStore())
const { addErrorMessage } = useMessageStore()

/**
 * Generate a new name that differs from existing names,
 * based on a tentative name.
 */
const generateUniqueName = (
  name: string = 'new category',
  existingNames: string[],
): string => {
  if (!existingNames.includes(name)) return name
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`^${escaped} \\((?<index>\\d+)\\)$`)
  const indices = new Set(
    existingNames
      .map((d) => {
        if (d === name) return 1
        const index = d.match(re)?.groups?.index
        return index === undefined ? Number.NaN : Number(index)
      })
      .filter((d) => !Number.isNaN(d)),
  )
  for (let i = 2; i <= indices.size + 1; i += 1) {
    if (!indices.has(i)) return `${name} (${i})`
  }
  return `${name} (${Math.max(...indices) + 1})`
}

const upload = async () => {
  const files = await uploadFiles()
  if (files == null) return

  const existingUsernames = profiles.value.map((d) => d.username)
  try {
    const oldProfiles = await Promise.all(
      Array.from(files).map(async (file) => {
        const loaded = await parseJsonFile(file)
        const tasks = parseAnnotatorProfileFile(loaded)
        const newUsername = generateUniqueName(file.name, existingUsernames)
        existingUsernames.push(newUsername)
        return buildAnnotatorProfile(tasks, newUsername)
      }),
    )
    addProfiles(oldProfiles)
  }
  catch (err) {
    addErrorMessage(formatLabelProgressError(err))
  }
}
</script>

<template>
  <div class="flex gap-1">
    <button
      type="button"
      btn-secondary
      title="Upload a JSON file to restore the labeling progress"
      @click="upload"
    >
      Upload
    </button>
  </div>
</template>
