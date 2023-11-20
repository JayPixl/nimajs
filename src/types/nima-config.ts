import {
    nimaAnimatableProperties,
    customEasings,
    nimaTemplates,
    nimaEventTypes,
} from "../lib"

/**
 * V1 Nima Config
 */
export interface NimaConfig {
    compilerOptions?: NimaCompilerOptions
    animations?: NimaAnimation[]
}

/* Compiler Options */

export interface NimaCompilerOptions {
    outputDir?: string
    content?: string | string[]
}

/* Templates */

export type NimaTemplate = (typeof nimaTemplates)[number]["name"]

/* Animation */

export interface NimaAnimation {
    name: string
    triggerMode?: "replace" | "overlap"
    template?: "custom" | NimaTemplate
    alwaysCompile?: boolean
    triggers?: Partial<Record<NimaTrigger, NimaMotion>>
}

/* Trigger Config */

export type NimaTrigger =
    | NimaEventType
    | `${NimaEventType}@${NimaTargetSelector}`

/* Motion Config */

export interface NimaMotion
    extends Partial<Record<NimaPropertySelector, NimaPropertyValues>>,
        NimaMotionConfig {
    endTriggers?: NimaTrigger[]
    pauseTriggers?: NimaTrigger[]
    resumeTriggers?: NimaTrigger[]

    css?: string[]
}

export interface NimaMotionConfig {
    duration?: `${number}ms` | `${number}s` | number
    delay?: `${number}ms` | `${number}s` | number
    iterations?: number | "infinite"
    easing?: NimaEasingFunction
    direction?: "normal" | "reverse" | "alternate" | "alternate-reverse"
    fill?: "none" | "forwards" | "backwards" | "both"
    stagger?: `${number}ms` | `${number}s` | number
}

/* Properties */

export type NimaAnimatableProperties = (typeof nimaAnimatableProperties)[number]

export type NimaPropertySelector =
    | NimaAnimatableProperties
    | `${NimaAnimatableProperties}@${NimaTargetSelector}`

export interface ExtendedNimaPropertyValues extends NimaMotionConfig {
    frames: (string | number)[] | Partial<Record<NimaFrameKey, number | string>>
}

export type NimaFrameKey = `${number}%` | "from" | "to"

export type NimaPropertyValues =
    | (string | number)[]
    | ExtendedNimaPropertyValues

export type NimaCustomEasings = keyof typeof customEasings

export type NimaEasingFunction =
    | "ease"
    | "ease-in-out"
    | "ease-in"
    | "ease-out"
    | "linear"
    | `cubic-bezier(${string})`
    | `steps(${string})`
    | NimaCustomEasings

/* Events */

export type NimaEventType =
    | (typeof nimaEventTypes)[number]
    | `timer<${string}>`
    | `viewportenter<${string}>`
    | `viewportleave<${string}>`
    | `keyup<${string}>`
    | `keydown<${string}>`

/* Selectors */

export type NimaTargetSelectorType = (typeof nimaTargetSelectorTypes)[number]

export const nimaTargetSelectorTypes = [
    "self",
    "ancestor",
    "parent",
    "sibling",
    "child",
    "descendant",
    "selector",
] as const

export type NimaTargetSelector = `${NimaTargetSelectorType}${string}`
