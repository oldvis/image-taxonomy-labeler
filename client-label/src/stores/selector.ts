import type { IFuseOptions } from 'fuse.js'
import type { Visualization } from '~/plugins/visualization'
import Fuse from 'fuse.js'
import { isEqual } from 'lodash'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { useLabelTask as useClassification } from '~/builtins/label-tasks/classification/useLabelTask'
import { useLabelTask as useTaxonomization } from '~/builtins/label-tasks/taxonomization/useLabelTask'

export enum SelectorType {
  /** The type of selectors that follow Fuse.js options schema. */
  Fuse = 'Fuse',
  /** The type of selectors that search for unlabeled entries. */
  Unlabeled = 'Unlabeled',
  /** The type of selectors that search for labeled entries. */
  Labeled = 'Labeled',
  /** The type of selectors that search for unsure entries. */
  Sure = 'Sure',
  /** The type of selectors that search for unsure entries. */
  Unsure = 'Unsure',
  /** The type of selectors that search entries by labels. */
  Category = 'Category',
}

export interface Selector<Type extends SelectorType = SelectorType> {
  /** The type of the selector. */
  type: Type
  /** The query selector. */
  query: Type extends SelectorType.Category
    ? string
    : (Type extends SelectorType.Fuse
        ? {
            pattern: string
            options: IFuseOptions<Visualization>
          }
        : null)
  /** The uuid of the selector. */
  uuid: string
}

const buildSearchSelector = (
  pattern: string,
  options: IFuseOptions<Visualization>,
): Selector<SelectorType.Fuse> => ({
  type: SelectorType.Fuse,
  query: { pattern, options },
  uuid: uuidv4(),
})

const buildUnlabeledSelector = (
): Selector<SelectorType.Unlabeled> => ({
  type: SelectorType.Unlabeled,
  query: null,
  uuid: uuidv4(),
})

const buildLabeledSelector = (
): Selector<SelectorType.Labeled> => ({
  type: SelectorType.Labeled,
  query: null,
  uuid: uuidv4(),
})

const buildSureSelector = (
): Selector<SelectorType.Sure> => ({
  type: SelectorType.Sure,
  query: null,
  uuid: uuidv4(),
})

const buildUnsureSelector = (
): Selector<SelectorType.Unsure> => ({
  type: SelectorType.Unsure,
  query: null,
  uuid: uuidv4(),
})

const buildTaxonomyCategorySelector = (
  category: string,
): Selector<SelectorType.Category> => ({
  type: SelectorType.Category,
  query: category,
  uuid: uuidv4(),
})

/** Apply a selector to the data entries. */
const applySelector = (
  data: Visualization[],
  selector: Selector,
): Visualization[] => {
  if (selector.type === SelectorType.Category) {
    const { annotations } = useTaxonomization()
    const { query } = selector as Selector<SelectorType.Category>
    const matchedUuids = new Set(annotations.value
      .filter((d) => (d.value === query))
      .map((d) => d.subject))
    return data.filter((d) => matchedUuids.has(d.uuid))
  }
  if (selector.type === SelectorType.Fuse) {
    const { query } = selector as Selector<SelectorType.Fuse>
    const fuse = new Fuse(data, query.options)
    return fuse.search(query.pattern).map((d) => d.item)
  }
  if (selector.type === SelectorType.Unlabeled) {
    const { annotatedUuids } = useClassification()
    return data.filter((d) => !annotatedUuids.value.has(d.uuid))
  }
  if (selector.type === SelectorType.Labeled) {
    const { annotatedUuids } = useClassification()
    return data.filter((d) => annotatedUuids.value.has(d.uuid))
  }
  if (selector.type === SelectorType.Sure) {
    const { annotations } = useClassification()
    const unsureUuids = new Set(annotations.value
      .filter((d) => (d.value === 'Sure'))
      .map((d) => d.subject))
    return data.filter((d) => unsureUuids.has(d.uuid))
  }
  if (selector.type === SelectorType.Unsure) {
    const { annotations } = useClassification()
    const unsureUuids = new Set(annotations.value
      .filter((d) => (d.value === 'Unsure'))
      .map((d) => d.subject))
    return data.filter((d) => unsureUuids.has(d.uuid))
  }
  return []
}

export const useStore = defineStore('selectors', {
  state: () => ({
    selectors: [] as Selector[],
  }),
  actions: {
    /** Add/Remove a selector of unlabeled data entries. */
    toggleUnlabeledSelector(): void {
      this.toggleSelector(buildUnlabeledSelector())
    },
    /** Add/Remove a selector of labeled data entries. */
    toggleLabeledSelector(): void {
      this.toggleSelector(buildLabeledSelector())
    },
    /** Add/Remove a selector of sure data entries. */
    toggleSureSelector(): void {
      this.toggleSelector(buildSureSelector())
    },
    /** Add/Remove a selector of unsure data entries. */
    toggleUnsureSelector(): void {
      this.toggleSelector(buildUnsureSelector())
    },
    /** Add a selector matching the pattern with data entries. */
    addSearchSelector(pattern: string): void {
      const options = {
        threshold: 0,
        keys: ['uuid', 'authors', 'displayName', 'publishDate', 'tags'],
      }
      this.selectors.push(buildSearchSelector(pattern, options))
    },
    /** Remove all the existing category selectors. */
    clearCategorySelectors(): void {
      this.selectors = this.selectors.filter((d) => d.type !== SelectorType.Category)
    },
    /** Add/Remove a selector matching the categories of data entries. */
    toggleCategorySelector(category: string): void {
      this.toggleSelector(buildTaxonomyCategorySelector(category))
    },
    isCategorySelected(category: string): boolean {
      return this.isSelected(buildTaxonomyCategorySelector(category))
    },
    matchSelector(selector: Selector): Selector | undefined {
      return this.selectors
        .find((d) => (
          selector.type === d.type
          && isEqual(selector.query, d.query)
        ))
    },
    isSelected(selector: Selector): boolean {
      return this.matchSelector(selector) !== undefined
    },
    /**
     * Add/Remove a selector if selector(s)
     * with the same query don't/do exist.
     */
    toggleSelector(selector: Selector): void {
      const matched = this.matchSelector(selector)
      if (matched === undefined) this.selectors.push(selector)
      else this.removeSelector(matched.uuid)
    },
    /** Remove selector by uuid. */
    removeSelector(uuid: string): void {
      const index = this.selectors.findIndex((d) => d.uuid === uuid)
      this.selectors.splice(index, 1)
    },
    /** Apply a selector to the data entries. */
    applySelector,
    /** Apply all the stored selector to the data entries. */
    applySelectors(data: Visualization[]): Visualization[] {
      let kept = data
      this.selectors.forEach((d) => {
        kept = this.applySelector(kept, d)
      })
      return kept
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}
