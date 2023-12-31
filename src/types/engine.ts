import type { NimaEventType, NimaTargetSelectorType } from "./nima-config"

export interface NimaEngineConfig {
    animations: NimaEngineAnimation[]
}

export interface NimaEngineAnimation {
    name: string
    triggerMode: "replace" | "overlap"
    triggers: NimaEngineTrigger[]
    //vars: { [index: string]: string }
}

export interface NimaEngineTrigger {
    uid: string

    startTrigger: NimaTriggerConfig
    endTriggers: NimaTriggerConfig[]
    pauseTriggers: NimaTriggerConfig[]
    resumeTriggers: NimaTriggerConfig[]

    staggers: NimaEngineStagger[]
    randoms: NimaEngineRandoms[]
}

export interface NimaEngineStagger {
    uid: string
    target: NimaTargetSelectorType
    selector?: string
    value: number
}

export interface NimaEngineRandoms {
    randuid: string
    motionuid: string
    min: number
    max: number
    step: number
    unit: string
    target: NimaTargetSelectorType
    selector?: string
}

export interface NimaTriggerConfig {
    event: NimaEventType
    target: NimaTargetSelectorType
    selector?: string
    viewportMargin?: number | string
    viewportThreshold?: number
    timerData?: string | number
    testMode?: "ALL" | "SOME"
    tests?: NimaEngineTest[]
}

export interface NimaEngineTest {
    target: NimaTargetSelectorType
    selector?: string
    fn: (el: any) => boolean
}

type NimaTriggerOld =
    | "abort"
    | "afterprint"
    | "animationend"
    | "animationiteration"
    | "animationstart"
    | "beforeprint"
    | "beforeunload"
    | "blur"
    | "canplay"
    | "canplaythrough"
    | "change"
    | "click"
    | "contextmenu"
    | "copy"
    | "cut"
    | "dblclick"
    | "drag"
    | "dragend"
    | "dragenter"
    | "dragleave"
    | "dragover"
    | "dragstart"
    | "drop"
    | "durationchange"
    | "emptied"
    | "ended"
    | "error"
    | "focus"
    | "focusin"
    | "focusout"
    | "fullscreenchange"
    | "fullscreenerror"
    | "hashchange"
    | "input"
    | "invalid"
    | "keydown"
    | "keypress"
    | "keyup"
    | "load"
    | "loadeddata"
    | "loadedmetadata"
    | "loadstart"
    | "message"
    | "mousedown"
    | "mouseenter"
    | "mouseleave"
    | "mousemove"
    | "mouseout"
    | "mouseover"
    | "mouseup"
    | "offline"
    | "online"
    | "open"
    | "pagehide"
    | "pageshow"
    | "paste"
    | "pause"
    | "play"
    | "playing"
    | "popstate"
    | "progress"
    | "ratechange"
    | "reset"
    | "resize"
    | "scroll"
    | "search"
    | "seeked"
    | "seeking"
    | "select"
    | "stalled"
    | "storage"
    | "submit"
    | "suspend"
    | "timeupdate"
    | "toggle"
    | "touchcancel"
    | "touchend"
    | "touchmove"
    | "touchstart"
    | "transitionend"
    | "unload"
    | "volumechange"
    | "waiting"
    | "wheel"
    | "enterviewport"
    | "exitviewport"
