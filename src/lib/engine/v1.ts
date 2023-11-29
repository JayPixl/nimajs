import type { NimaEngineConfig, NimaTriggerConfig } from "../../types/engine.js"
import { NimaTargetSelectorType } from "../../types/nima-config.js"

/* END_IMPORTS */

export function loadNimaEngine() {
    /* Initialize Engine Config */
    const config: NimaEngineConfig = {
        animations: [
            /* NIMA_ANIMATIONS */
        ],
    }

    /* Initialize Stylesheet */
    const nimaStyles = `/* NIMA_STYLES */`

    /* Only do once, regarless of how many times the document loads */
    if (!document.documentElement.classList.contains("nm-l")) {
        document.documentElement.classList.add("nm-l")

        /* Initialize WeakMap for event listeners */
        let eventListeners: {
            [index: string]: WeakMap<
                object,
                { abort: AbortController; uid: string }
            >
        } = {}
        config.animations.map(
            anim =>
                (eventListeners[anim.name] = new WeakMap<
                    object,
                    { abort: AbortController; uid: string }
                >()),
        )

        /* Inject Styles into head */
        let nimaStyleTag: HTMLStyleElement
        if (!(nimaStyleTag = document.querySelector("style.nm-s")!)) {
            nimaStyleTag = document.createElement("style")
            nimaStyleTag.classList.add("nm-s")
            document.head.appendChild(nimaStyleTag)
        }
        nimaStyleTag.textContent = nimaStyles

        let usedUIDs: string[] = []

        const generateUid = () => {
            let uid
            while (true) {
                const myUid = Math.random().toString(16).slice(2, 8)

                if (!usedUIDs.includes(myUid)) {
                    uid = myUid
                    usedUIDs.push(myUid)
                    break
                }
            }
            return uid
        }

        const getElemsFromSelector = (
            elem: Element,
            nimauid: string,
            targetType: NimaTargetSelectorType,
            targetSelector?: string,
        ) => {
            switch (targetType) {
                case "self": {
                    return [elem]
                }
                case "child": {
                    return document.querySelectorAll(
                        `*[data-nimauid="${nimauid}"] > ${
                            targetSelector || "*"
                        }`,
                    )
                }
                case "descendant": {
                    return document.querySelectorAll(
                        `*[data-nimauid="${nimauid}"] ${targetSelector || "*"}`,
                    )
                }
                case "parent":
                case "ancestor": {
                    return [elem.closest(`${targetSelector || "*"}`) || elem]
                }
                case "sibling": {
                    return document.querySelectorAll(
                        `*[data-nimauid="${nimauid}"] ~ ${
                            targetSelector || "*"
                        }`,
                    )
                }
                case "selector": {
                    return document.querySelectorAll(targetSelector || "*")
                }
                default: {
                    return [elem]
                }
            }
        }

        /* Cycle through elements in the DOM and add event listeners as needed */
        const refreshElems = () => {
            config.animations.map(anim => {
                /* Get all valid Nima animated elements */
                const elements = document.querySelectorAll(
                    `.nima-${anim.name}`,
                ) as NodeListOf<HTMLElement>

                const InitializeElement: (elem: Element) => {
                    abort: AbortController
                    uid: string
                } = elem => {
                    const abort = new AbortController()
                    const uid = generateUid()
                    elem.setAttribute("data-nimauid", uid)

                    eventListeners[anim.name]!.set(elem, { abort, uid })
                    return {
                        abort,
                        uid,
                    }
                }

                /* Cycle through each element */
                elements.forEach(elem => {
                    let nimauid: string
                    let abort: AbortController

                    elem.classList.add(`nm-l-${anim.name}`)

                    if (!eventListeners[anim.name]!.has(elem)) {
                        const res = InitializeElement(elem)

                        nimauid = res.uid
                        abort = res.abort
                    } else {
                        nimauid = eventListeners[anim.name]!.get(elem)!.uid
                        abort = eventListeners[anim.name]!.get(elem)!.abort
                    }

                    /* Cycle through triggers and set event listerns */
                    anim.triggers.map(trigger => {
                        const initializeTrigElems: (
                            trig: NimaTriggerConfig,
                        ) => Element[] | NodeListOf<Element> = trig => {
                            const triggerElems = getElemsFromSelector(
                                elem,
                                nimauid,
                                trig.target,
                                trig.selector,
                            )

                            triggerElems.forEach(trigElem => {
                                if (!eventListeners[anim.name]!.has(trigElem)) {
                                    InitializeElement(trigElem)
                                    abort.signal.addEventListener(
                                        "abort",
                                        () => {
                                            eventListeners[anim.name]!.get(
                                                trigElem,
                                            )!.abort.abort()
                                        },
                                    )
                                }
                            })

                            return triggerElems
                        }

                        const registerEventCallback: (
                            trig: NimaTriggerConfig,
                            callback: () => void,
                            targetElems: Element[] | NodeListOf<Element>,
                            persistent: boolean,
                        ) => void = (
                            trig,
                            callback,
                            targetElems,
                            persistent,
                        ) => {
                            const action = () => {
                                if (trig?.tests?.length) {
                                    let results: boolean[] = []
                                    trig.tests?.map(test => {
                                        const elems = getElemsFromSelector(
                                            elem,
                                            nimauid,
                                            test.target,
                                            test.selector,
                                        )
                                        elems.forEach(el => {
                                            results.push(test.fn(el))
                                        })
                                    })
                                    if (trig.testMode === "ALL") {
                                        if (
                                            results.filter(res => res === false)
                                                .length === 0
                                        ) {
                                            callback()
                                        }
                                    } else {
                                        if (
                                            results.filter(res => res === true)
                                                .length > 0
                                        ) {
                                            callback()
                                        }
                                    }
                                } else {
                                    callback()
                                }
                            }

                            if (trig.event === "animationend") {
                                elem.addEventListener(
                                    "animationend",
                                    () => {
                                        action()
                                    },
                                    {
                                        once: !persistent,
                                        signal: abort.signal,
                                    },
                                )
                            } else if (trig.event === "timer") {
                                setTimeout(
                                    () => {
                                        action()
                                    },
                                    (trig.timerData as number) ?? 500,
                                )
                            } else if (trig.event === "viewportenter") {
                                const callback: IntersectionObserverCallback =
                                    entries => {
                                        entries.map(entry => {
                                            if (entry.isIntersecting) {
                                                action()
                                                !persistent &&
                                                    intobserver.disconnect()
                                            }
                                        })
                                    }
                                const intobserver = new IntersectionObserver(
                                    callback,
                                    {
                                        rootMargin:
                                            `${trig.viewportMargin}` ?? "0px",
                                        threshold: trig.viewportThreshold ?? 0,
                                    },
                                )
                                targetElems.forEach(el => {
                                    intobserver.observe(el)
                                })

                                abort.signal.addEventListener("abort", () =>
                                    intobserver.disconnect(),
                                )
                            } else if (trig.event === "viewportleave") {
                                const callback: IntersectionObserverCallback =
                                    entries => {
                                        entries.map(entry => {
                                            if (!entry.isIntersecting) {
                                                action()
                                                !persistent &&
                                                    intobserver.disconnect()
                                            }
                                        })
                                    }
                                const intobserver = new IntersectionObserver(
                                    callback,
                                    {
                                        rootMargin:
                                            `${trig.viewportMargin}` ?? "0px",
                                        threshold: trig.viewportThreshold ?? 0,
                                    },
                                )
                                targetElems.forEach(el => {
                                    intobserver.observe(el)
                                })

                                abort.signal.addEventListener("abort", () =>
                                    intobserver.disconnect(),
                                )
                            } else {
                                targetElems.forEach(trigElem => {
                                    trigElem.addEventListener(
                                        trig.event,
                                        () => {
                                            action()
                                        },
                                        {
                                            once: !persistent,
                                            signal: eventListeners[
                                                anim.name
                                            ]?.get(trigElem)!.abort.signal,
                                        },
                                    )
                                })
                            }
                        }

                        if (trigger.staggers.length !== 0) {
                            trigger.staggers.map(stagger => {
                                const staggerElems = (
                                    stagger.target === "self"
                                        ? document.querySelectorAll(
                                              `.nima-${anim.name}`,
                                          )
                                        : getElemsFromSelector(
                                              elem,
                                              nimauid,
                                              stagger.target,
                                              stagger.selector,
                                          )
                                ) as NodeListOf<HTMLElement>
                                staggerElems.forEach((el, i) => {
                                    el.style.setProperty(
                                        `--nm-d-${stagger.uid}`,
                                        `${stagger.value * i}ms`,
                                    )
                                })
                            })
                        }

                        if (trigger.randoms.length !== 0) {
                            trigger.randoms.map(random => {
                                const randElems = getElemsFromSelector(
                                    elem,
                                    nimauid,
                                    random.target,
                                    random.selector,
                                ) as NodeListOf<HTMLElement>
                                randElems.forEach(el => {
                                    let res
                                    if (!el.hasAttribute("data-nimauid")) {
                                        res = InitializeElement(el)
                                    } else {
                                        res = eventListeners[anim.name]!.get(el)
                                    }

                                    if (
                                        !el.classList.contains(
                                            `nm-r-${random.randuid}`,
                                        )
                                    ) {
                                        const randomize = () => {
                                            el.style.setProperty(
                                                `--nm-r-${random.randuid}`,
                                                `${
                                                    Math.round(
                                                        (Math.random() *
                                                            (random.max -
                                                                random.min) +
                                                            random.min) /
                                                            random.step,
                                                    ) * random.step
                                                }${random.unit}`,
                                            )
                                        }
                                        randomize()
                                        el.addEventListener(
                                            "animationiteration",
                                            e => {
                                                if (
                                                    `nm-k-${random.motionuid}` ===
                                                    e.animationName
                                                ) {
                                                    randomize()
                                                }
                                            },
                                            {
                                                signal: res!.abort.signal,
                                            },
                                        )
                                        el.classList.add(
                                            `nm-r-${random.randuid}`,
                                        )
                                    }
                                })
                            })
                        }

                        const startTriggerElems = initializeTrigElems(
                            trigger.startTrigger,
                        )
                        if (trigger.startTrigger.event === "load") {
                            elem.classList.add(`nm-a-${trigger.uid}`)
                        } else {
                            registerEventCallback(
                                trigger.startTrigger,
                                () => {
                                    elem.classList.add(`nm-a-${trigger.uid}`)
                                },
                                startTriggerElems,
                                true,
                            )
                        }

                        let endTriggerElems: (
                            | Element[]
                            | NodeListOf<Element>
                        )[] = []
                        trigger.endTriggers.map(trig => {
                            endTriggerElems.push(initializeTrigElems(trig))
                        })

                        let pauseTriggerElems: (
                            | Element[]
                            | NodeListOf<Element>
                        )[] = []
                        trigger.pauseTriggers.map(trig => {
                            pauseTriggerElems.push(initializeTrigElems(trig))
                        })

                        let resumeTriggerElems: (
                            | Element[]
                            | NodeListOf<Element>
                        )[] = []
                        trigger.resumeTriggers.map(trig => {
                            resumeTriggerElems.push(initializeTrigElems(trig))
                        })

                        trigger.endTriggers.map((endTrig, i) => {
                            registerEventCallback(
                                endTrig,
                                () => {
                                    elem.classList.remove(`nm-a-${trigger.uid}`)
                                },
                                endTriggerElems[i]!,
                                true,
                            )
                        })

                        trigger.pauseTriggers.map((pauseTrig, i) => {
                            registerEventCallback(
                                pauseTrig,
                                () => {
                                    ;(
                                        getElemsFromSelector(
                                            elem,
                                            nimauid,
                                            trigger.startTrigger.target,
                                            trigger.startTrigger.selector,
                                        ) as NodeListOf<HTMLElement>
                                    ).forEach(el => {
                                        el.style.setProperty(
                                            `--nm-p-${trigger.uid}`,
                                            "paused",
                                        )
                                    })
                                },
                                pauseTriggerElems[i]!,
                                true,
                            )
                        })

                        trigger.resumeTriggers.map((resumeTrig, i) => {
                            registerEventCallback(
                                resumeTrig,
                                () => {
                                    ;(
                                        getElemsFromSelector(
                                            elem,
                                            nimauid,
                                            trigger.startTrigger.target,
                                            trigger.startTrigger.selector,
                                        ) as NodeListOf<HTMLElement>
                                    ).forEach(el => {
                                        el.style.setProperty(
                                            `--nm-p-${trigger.uid}`,
                                            "running",
                                        )
                                    })
                                },
                                resumeTriggerElems[i]!,
                                true,
                            )
                        })
                    })
                })
            })
            /* console.log(`Built in ${Date.now() - loadTime}ms`) */
        }

        const observer = new MutationObserver((mutations: MutationRecord[]) => {
            /* console.log("DOM CHANGE") */
            for (const mutation of mutations) {
                for (let node of mutation.removedNodes) {
                    if (
                        node instanceof Element &&
                        node.getAttribute("data-nimauid")
                    ) {
                        Object.keys(eventListeners).map(animname => {
                            if (eventListeners[animname]?.has(node)) {
                                eventListeners[animname]!.get(
                                    node,
                                )!.abort.abort()
                                eventListeners[animname]!.delete(node)
                            }
                        })
                    }
                }
            }
            refreshElems()
        })
        observer.observe(document.body, {
            subtree: true,
            childList: true,
        })

        refreshElems()
    }
}
