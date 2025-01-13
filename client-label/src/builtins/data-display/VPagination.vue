<script setup lang="ts">
import type { PropType } from 'vue'
import { ElPagination } from 'element-plus'
import 'element-plus/es/components/pagination/style/css'

defineProps({
  /** The total number of pages. */
  pageCount: {
    type: Number as PropType<number>,
    required: true,
  },
})

/** The current page index (starting from 1). */
const currentPage = defineModel({
  type: Number as PropType<number>,
  required: true,
})
</script>

<template>
  <ElPagination
    v-model:current-page="currentPage"
    layout="prev, pager, next"
    :page-count="pageCount"
    style="
      --el-pagination-hover-color: rgb(13, 148, 136);
      --el-pagination-bg-color: unset;
      --el-pagination-button-disabled-bg-color: unset;
      --el-pagination-button-color: unset;
      --el-pagination-text-color: unset;
    "
  />
</template>
