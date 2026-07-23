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
    <span class="text-lg font-bold">
      VisTaxa - Label
    </span>
    <TheDialogLogin />
    <TheWidgetLoad />
    <div class="hidden md:flex gap-4 items-center ml-auto">
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
