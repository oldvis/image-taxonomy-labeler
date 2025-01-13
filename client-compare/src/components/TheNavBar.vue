<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { DisplayMode, useStore } from '~/stores/mode'

const { displayMode } = storeToRefs(useStore())
</script>

<template>
  <nav
    class="flex select-none"
    border="b gray-200"
    p="x-3 y-1"
  >
    <img
      class="h-28px pr-1"
      src="/favicon.svg"
    >
    <div class="text-lg font-bold">
      VisTaxa - Compare
    </div>
    <div class="grow" />
    <div class="hidden md:flex gap-4 items-center ml-auto text-sm">
      <button
        icon-btn
        :class="{ 'text-teal-600': displayMode === DisplayMode.Trees }"
        @click="displayMode = DisplayMode.Trees"
      >
        Trees
      </button>
      <button
        icon-btn
        :class="{ 'text-teal-600': displayMode === DisplayMode.Images }"
        @click="displayMode = DisplayMode.Images"
      >
        Images
      </button>
      <button
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
    </div>
  </nav>
</template>
