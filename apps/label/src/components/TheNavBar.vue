<template>
  <nav class="strip border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 select-none">
    <div class="flex shrink-0 gap-1 items-center">
      <img
        class="h-5 w-5"
        src="/favicon.svg"
        alt=""
      >
      <span class="text-sm font-semibold">
        OldVis<span class="text-gray-500 font-normal dark:text-gray-400"> · Taxonomy Label</span>
      </span>
    </div>
    <TheWidgetLoad />
    <div class="grow" />
    <TheDialogLogin />
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
