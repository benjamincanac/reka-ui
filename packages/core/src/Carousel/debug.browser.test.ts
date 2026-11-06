import { mount } from '@vue/test-utils'
import { it } from 'vitest'
import { commands } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { CarouselContent, CarouselItem, CarouselRoot, CarouselViewport } from '.'

it('traces a mouse drag release', async () => {
  const logs: string[] = []
  const t0 = performance.now()
  const at = () => Math.round(performance.now() - t0)
  document.body.innerHTML = ''
  mount(defineComponent({ setup: () => () => h(CarouselRoot, { 'aria-label': 'x', 'style': { width: '200px', margin: '20px' }, 'onUpdate:modelValue': (v: number, d: any) => logs.push(`${at()} model ${v} ${d.reason}`) }, () => [
    h(CarouselViewport, { 'data-testid': 'vp' }, () => h(CarouselContent, () => Array.from({ length: 5 }, (_, i) => h(CarouselItem, { key: i, style: { width: '200px', height: `${100 + i * 20}px` } }, () => h('button', { type: 'button' }, `S${i}`))))),
  ]) }), { attachTo: document.body })
  await new Promise(r => setTimeout(r, 400))
  const vp = document.querySelector<HTMLElement>('[data-testid="vp"]')!
  const items = [...vp.querySelectorAll<HTMLElement>('[data-index]')]
  logs.push(`items ${items.map(i => `${i.offsetLeft}/${i.getBoundingClientRect().width}`).join(' ')} vp ${vp.clientWidth}/${vp.scrollWidth}`)
  for (const type of ['scroll', 'scrollend', 'pointerdown', 'pointerup', 'pointercancel', 'lostpointercapture', 'click', 'selectstart'])
    vp.addEventListener(type, () => logs.push(`${at()} ${type} ${vp.scrollLeft} snap=${vp.style.scrollSnapType}`), true)
  document.addEventListener('pointerup', () => logs.push(`${at()} doc pointerup ${vp.scrollLeft}`), true)
  const orig = vp.scrollTo.bind(vp)
  vp.scrollTo = ((o: any) => {
    if (o.behavior !== 'instant')
      logs.push(`${at()} scrollTo ${JSON.stringify(o)} from ${vp.scrollLeft}`)
    orig(o)
  }) as any
  const box = vp.getBoundingClientRect()
  await commands.mouseDrag(box.right - 10, box.top + 40, box.left - 300, box.top + 40, 4)
  for (let k = 0; k < 15; k++) {
    await new Promise(r => setTimeout(r, 100))
    logs.push(`${at()} poll ${vp.scrollLeft} snap=${vp.style.scrollSnapType} sel=${String(getSelection())}`)
  }
  throw new Error(logs.join('\n'))
})
