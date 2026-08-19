<script setup lang="ts">
import { onKeyStroke, useFocus } from '@vueuse/core'
import { useStore } from '~/stores/selector'

const input = ref('')
const target = ref()
const { focused } = useFocus(target)
const { addSearchSelector } = useStore()
const onSearch = () => {
  addSearchSelector(input.value)
  input.value = ''
}
onKeyStroke('Enter', () => {
  if (!focused.value) return
  onSearch()
})
</script>

<template>
  <div class="relative flex items-center">
    <input
      ref="target"
      v-model="input"
      strip-input
      type="text"
      class="w-full text-sm pr-6"
      placeholder="Search"
      required
    >
    <button
      type="button"
      icon-btn
      class="absolute right-0 pr-1"
      @click="onSearch"
    >
      <div class="i-fa6-solid:magnifying-glass" />
    </button>
  </div>
</template>
