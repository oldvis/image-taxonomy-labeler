<script setup lang="ts">
const props = defineProps({
  value: {
    type: String as PropType<string>,
    required: true,
  },
})
const emit = defineEmits<{
  (e: 'update:value', newValue: string, event: Event): void
}>()

const input = ref<HTMLInputElement>()
const text = ref('')

onMounted(() => {
  text.value = props.value

  // Focus the input to show a blinking caret.
  input.value?.focus()
})

/** Fired when keypress enter or clicking outside the element. */
const onChange = (e: Event): void => {
  const newValue = (e.target as HTMLInputElement).value
  if (newValue.length < 1) return
  emit('update:value', newValue, e)
}
</script>

<template>
  <input
    ref="input"
    v-model="text"
    class="focus:outline-none invalid:border invalid:border-red-500"
    type="text"
    minlength="1"
    :size="Math.max(text.length, 1)"
    style="box-sizing: border-box"
    required
    @change="onChange"
    @keyup.enter="onChange"
  >
</template>
