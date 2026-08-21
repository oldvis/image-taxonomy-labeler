import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const website = import.meta.dirname
const root = path.resolve(website, '..')

describe('pages landing', () => {
  it('introduces the project and links to both apps and the repo', () => {
    const html = readFileSync(path.join(website, 'index.html'), 'utf8')
    expect(html).toMatch(/OldVis Image Taxonomy Labeler/)
    expect(html).toMatch(/taxonomy labeling and comparison/)
    expect(html).toMatch(/href="\.\/label\/"/)
    expect(html).toMatch(/href="\.\/compare\/"/)
    expect(html).toMatch(/href="https:\/\/github\.com\/oldvis\/image-taxonomy-labeler"/)
    expect(html).toMatch(/hierarchical labels/)
    expect(html).toMatch(/multiple annotators/)
    expect(html).toMatch(/Server features are disabled/)
    expect(html).not.toMatch(/<script/)
  })
})

describe('pages workflow', () => {
  it('deploys via official Pages Actions with split build and deploy jobs', () => {
    const yaml = readFileSync(path.join(root, '.github/workflows/gh-pages.yml'), 'utf8')
    expect(yaml).toMatch(/contents:\s*read/)
    expect(yaml).toMatch(/pages:\s*write/)
    expect(yaml).toMatch(/id-token:\s*write/)
    expect(yaml).toMatch(/cancel-in-progress:\s*false/)
    expect(yaml).toMatch(/jobs:[\t\v\f\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*\n\s*build:/)
    expect(yaml).toMatch(/needs:\s*build/)
    expect(yaml).toMatch(/environment:[\s\S]*name:\s*github-pages/)
    expect(yaml).toMatch(/actions\/upload-pages-artifact@v4/)
    expect(yaml).toMatch(/actions\/deploy-pages@v4/)
    expect(yaml).toMatch(/path:\s*site/)
    expect(yaml).toMatch(/--filter \.\/website assemble/)
    expect(yaml).toMatch(/VITE_BASE:\s*\/image-taxonomy-labeler\/label\//)
    expect(yaml).toMatch(/VITE_BASE:\s*\/image-taxonomy-labeler\/compare\//)
    expect(yaml).not.toMatch(/JamesIves/)
    expect(yaml).not.toMatch(/contents:\s*write/)
  })
})
