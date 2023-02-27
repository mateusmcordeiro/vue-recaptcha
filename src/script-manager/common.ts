import { LiteralUnion, Opaque } from 'type-fest'
import pDefer from 'p-defer'
import { warn } from '../utils'
import defu from 'defu'

export type RecaptchaCallback = '__vueRecaptchaLoaded'

export interface RecaptchaV2CommonOptions {
  sitekey: string
  tabindex?: string
  callback?: (response: string) => void
  'expired-callback'?: () => void
  'error-callback'?: (error: Error) => void
}

export interface RecaptchaV2CheckboxOptions extends RecaptchaV2CommonOptions {
  theme?: 'dark' | 'light'
  size?: 'compact' | 'normal'
}

export interface RecaptchaV2InvisibleOptions extends RecaptchaV2CommonOptions {
  size: 'invisible'
  badge?: 'bottomright' | 'bottomleft' | 'inline'
}

export type RecaptchaV2Options = RecaptchaV2CheckboxOptions | RecaptchaV2InvisibleOptions

export type WidgetID = Opaque<string, 'widget-id'>

export interface GRecaptcha {
  render(ele: Element, options: RecaptchaV2Options): WidgetID
  reset(widgetId: WidgetID): void
  execute(widgetId: WidgetID): void
  execute(siteKey: string, options: { action: string }): Promise<string>
}

declare global {
  interface Window {
    grecaptcha: GRecaptcha
    __vueRecaptchaLoaded: () => void
  }
}

export interface RecaptchaParams {
  render: LiteralUnion<'explicit', string>
  hl?: string | undefined
  trustedtypes?: 'true' | undefined
  onload?: RecaptchaCallback
  [k: string]: string | undefined
}

export interface ScriptManagerFactory {
  (params: RecaptchaParams): () => void
}

export const recaptchaLoaded = pDefer()
const ONLOAD_KEY: RecaptchaCallback = '__vueRecaptchaLoaded' as const

if (typeof window !== 'undefined') {
  window[ONLOAD_KEY] = () => {
    recaptchaLoaded.resolve()
  }
}

export function toQueryString(params: RecaptchaParams) {
  return new URLSearchParams(normalizeParams(params)).toString()
}

export function normalizeParams(raw: RecaptchaParams): string[][] {
  const params = defu(raw, { onload: ONLOAD_KEY, render: 'explicit' })
  if (params.render === 'onload') {
    warn('passing `onload` as `render` param is not allowed')
    params.render = 'explicit'
  }

  if (params.onload !== ONLOAD_KEY) {
    warn('passing `onload` param with other value is not allowed')
    params.onload = ONLOAD_KEY
  }

  return toStringPair(params)
}

export function toStringPair(params: RecaptchaParams): string[][] {
  return Object.entries(params).filter((pair): pair is [string, string] => typeof pair[1] === 'string')
}

export function checkRecaptchaLoad() {
  if (typeof window === 'undefined') {
    return false
  }

  const isLoaded = Object.hasOwn(window, 'grecaptcha') && Object.hasOwn(window.grecaptcha, 'execute')
  if (isLoaded) {
    recaptchaLoaded.resolve()
  }
  return isLoaded
}