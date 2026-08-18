<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { DisplayMode, useStore } from '~/stores/mode'

const { displayMode } = storeToRefs(useStore())
</script>

<template>
  <nav class="status-strip border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 select-none">
    <div class="flex shrink-0 gap-1 items-center">
      <img
        class="h-5 w-5"
        src="/favicon.svg"
        alt=""
      >
      <span class="text-sm font-semibold">
        OldVis<span class="text-gray-500 font-normal dark:text-gray-400"> · Taxonomy Compare</span>
      </span>
    </div>
    <div class="flex shrink-0 gap-1 items-center">
      <button
        type="button"
        :class="displayMode === DisplayMode.Trees ? 'pill-on' : 'pill'"
        @click="displayMode = DisplayMode.Trees"
      >
        Trees
      </button>
      <button
        type="button"
        :class="displayMode === DisplayMode.Images ? 'pill-on' : 'pill'"
        @click="displayMode = DisplayMode.Images"
      >
        Images
      </button>
    </div>
    <div class="grow" />
    <button
      type="button"
      icon-btn
      i-fa6-regular:sun dark:i-fa6-regular:moon
      title="Toggle dark mode"
      @click="toggleDark()"
    />
    <a
      i-fa6-brands:github icon-btn
      rel="noreferrer"
      href="https://github.com/oldvis/image-taxonomy-labeler"
      target="_blank"
      title="GitHub"
    />
  </nav>
</template>
