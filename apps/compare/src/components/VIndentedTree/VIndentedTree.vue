<script setup lang="ts">
import type { HierarchyNode } from 'd3'
import { hierarchy } from 'd3'

interface LeafNode {
  name: string
  value: number
}

interface InternalNode {
  name: string
  children: (InternalNode | LeafNode)[]
}

type RawTreeNode = InternalNode | LeafNode

interface TreeNode {
  name: string
  value: number
  children?: TreeNode[]
}

const props = defineProps({
  data: {
    type: Object as PropType<RawTreeNode>,
    required: true,
  },
  nodeWidth: {
    type: Number as PropType<number>,
    default: 17,
  },
  nodeHeight: {
    type: Number as PropType<number>,
    default: 17,
  },
  width: {
    type: Number as PropType<number>,
    default: 928,
  },
  textClassMap: {
    type: Function as PropType<((d: HierarchyNode<TreeNode>, i: number) => string)>,
    default: () => '',
  },
})

const emit = defineEmits<{
  (e: 'hoverNode', name: string): void
  (e: 'leaveNode', name: string): void
  (e: 'clickNode', name: string): void
}>()

const container = ref<SVGSVGElement | null>(null)
const gLink = ref<SVGGElement | null>(null)
const gNode = ref<SVGGElement | null>(null)

const { data, nodeWidth, nodeHeight } = toRefs(props)

type HierarchyNodeWithIndex = HierarchyNode<TreeNode> & { index: number }

const root = computed(() => (
  hierarchy(data.value as TreeNode).eachBefore(((i) => (d) => (d as HierarchyNodeWithIndex).index = i++ - 1)(0))
))

const nodes = computed(() => root.value.descendants())
const height = computed(() => (nodes.value.length + 1) * nodeHeight.value)
</script>

<template>
  <svg
    ref="container"
    :width="width"
    :height="height"
    :viewBox="`${[-nodeWidth / 2, -nodeHeight * 3 / 2, width, height]}`"
    :style="`width: ${width}; height: ${height}; font: 10px sans-serif; overflow: visible;`"
  >
    <g
      ref="gLink"
      fill="none"
      stroke="#999"
    >
      <path
        v-for="(d, i) in root.links()"
        :key="i"
        :d="`
          M${d.source.depth * nodeWidth},${(d.source as HierarchyNodeWithIndex).index * nodeHeight}
          V${(d.target as HierarchyNodeWithIndex).index * nodeHeight}
          h${nodeWidth}
        `"
      />
    </g>
    <g ref="gNode">
      <g
        v-for="(d, i) in nodes"
        :key="i"
        :transform="`translate(0,${(d as HierarchyNodeWithIndex).index * nodeHeight})`"
        style="cursor: pointer"
        @mouseover="emit('hoverNode', d.data.name)"
        @mouseleave="emit('leaveNode', d.data.name)"
        @click="emit('clickNode', d.data.name)"
      >
        <circle
          :cx="d.depth * nodeWidth"
          r="2.5"
          :fill="d.children ? undefined : '#999'"
          :class="{ 'dark:fill-gray-300': d.children }"
        />
        <text
          dy="0.32em"
          :x="d.depth * nodeWidth + 6"
          :class="textClassMap(d, i)"
          font-size="1.2em"
        >
          {{ d.data.name }}
        </text>
        <title>
          {{ d.ancestors().reverse().map(d => d.data.name).join('/') }}
        </title>
        <slot
          name="node"
          :node="d"
        />
      </g>
    </g>
  </svg>
</template>
