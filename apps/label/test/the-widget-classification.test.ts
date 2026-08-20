import { useLabelTask as useClassification } from '@image-taxonomy-labeler/ui/label-tasks/classification/useLabelTask'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

const TheWidgetClassification = (
  await import('~/components/TheWidgetClassification.vue')
).default

describe('theWidgetClassification selected styles', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useClassification().setAll([])
  })

  it('uses the same teal selected pill as other chrome toggles', () => {
    const classification = useClassification()
    classification.addAnnotation('u1', 'Unsure')
    classification.addAnnotation('u2', 'Sure')

    const unsure = mount(TheWidgetClassification, { props: { uuid: 'u1' } })
    const sure = mount(TheWidgetClassification, { props: { uuid: 'u2' } })

    const [unsureOn, unsureOff] = unsure.findAll('button')
    const [sureOff, sureOn] = sure.findAll('button')

    expect(unsureOn.classes()).toContain('pill-on')
    expect(sureOn.classes()).toContain('pill-on')
    // Off must stay `pill` (same padding as `pill-on`). `btn-secondary` is
    // px-2.5, so swapping it in on toggle shifts button width.
    expect(unsureOff.classes()).toContain('pill')
    expect(sureOff.classes()).toContain('pill')
    expect(unsureOff.classes()).not.toContain('btn-secondary')
    expect(sureOff.classes()).not.toContain('btn-secondary')
  })
})
