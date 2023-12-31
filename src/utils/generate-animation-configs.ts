import { nimaTemplates } from "../lib/templates/index.js"
import {
    type NimaConfig,
    nimaTargetSelectorTypes,
    NimaAnimatableProperties,
    NimaTargetSelectorType,
    NimaFrameKey,
    NimaMotionConfig,
    NimaMotion,
} from "../types/nima-config.js"
import { NimaError } from "../types/errors.js"
import { fancyLog } from "./fancy-log.js"
import {
    customEasings,
    nimaAnimatableProperties,
    nimaEventTypes,
    nimaTests,
} from "../lib/index.js"
import { NimaEngineTest, NimaTriggerConfig } from "../types/engine.js"
import { NimaBuildOptions } from "../types/cli.js"

export const generateAnimationConfigs: (
    config: NimaConfig,
    options: NimaBuildOptions,
) => Promise<{ animationConfig: string; styles: string }> = async (
    config,
    options,
) => {
    try {
        const NIMA_DEFAULTS = {
            triggerMode: "replace",
            duration: "500ms",
            direction: "normal",
            delay: "0s",
            easing: "ease-smooth",
            iterations: "infinite",
            fill: "none",
            stagger: "0s",
        } as const

        let usedUIDs: string[] = []

        let workingAnimConfig = ""

        let keyframes = ""
        let selectors = ""

        let playState = ""
        let delays = ""

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

        const getTimeValue = (input: string | number) => {
            if (typeof input === "string") {
                return isNaN(Number(input)) ? input : `${input}ms`
            } else if (typeof input === "number") {
                return `${input}ms`
            } else {
                fancyLog(`Invalid time value: ${input}`)
                return `200ms`
            }
        }

        const getEasingFunction: (input: string) => string = input => {
            if (
                [
                    "ease",
                    "linear",
                    "ease-in",
                    "ease-out",
                    "ease-in-out",
                ].includes(input) ||
                /^cubic\-bezier\([^\)]+\)$/.test(input) ||
                /^steps\([^\)]+\)$/.test(input)
            ) {
                return input
            } else if (Object.keys(customEasings).includes(input)) {
                return (customEasings as any)[input]
            } else {
                //console.log(`|${input}|`)
                fancyLog(`Invalid easing function: ${input}`, "warn")
                return getEasingFunction(NIMA_DEFAULTS.easing)
            }
        }

        const getMilliseconds: (input: string | number) => number = input => {
            return /s/g.test(input.toString())
                ? /ms/g.test(input.toString())
                    ? Number(input.toString().replaceAll("ms", ""))
                    : Number(input.toString().replaceAll("s", "")) * 1000
                : Number(input)
        }

        const splitSelector: (input: string) => {
            property: string
            target: NimaTargetSelectorType
            selector?: string
            extraData?: string[]
        } = input => {
            let property: string
            let target: NimaTargetSelectorType = "self"
            let selector: string | undefined = undefined
            let extraData: string[] = []

            if (/\<[^\>]*\>/g.test(input.split("@")[0]!)) {
                property = input.split("@")[0]!.slice(0, input.indexOf("<"))

                extraData = /(?<=\<)[^\>]*(?=\>)/g
                    .exec(input.split("@")[0]!)![0]
                    .replaceAll("_", " ")
                    .split(",")
            } else {
                property = input.split("@")[0]!
            }

            if (/\@/g.test(input)) {
                const selectorType = nimaTargetSelectorTypes.filter(
                    type => input.split("@")[1]?.startsWith(type),
                )[0]
                if (!selectorType) {
                    fancyLog(
                        `Invalid selector type: ${input.split("@")[1]}`,
                        "warn",
                    )
                } else {
                    target = selectorType
                    selector = input.split("@")[1]!.slice(selectorType.length)
                }
            }

            return {
                property,
                target,
                selector: selector,
                extraData,
            }
        }

        config.animations?.map(anim => {
            //console.log(`ANIM ${anim.name}`)
            let template
            if (anim?.template) {
                const matchedTemplate = nimaTemplates.filter(
                    temp => temp.name === anim.template,
                )[0]
                if (matchedTemplate) {
                    template = matchedTemplate
                } else {
                    fancyLog(
                        `Invalid template name: \`${anim.template}\``,
                        "warn",
                    )
                }
            }

            const name = `name: '${anim.name}',\n`
            const triggerMode = `triggerMode: '${
                anim.triggerMode ??
                template?.triggerMode ??
                NIMA_DEFAULTS.triggerMode
            }',\n`

            let myTriggers = ""

            const allTriggers = anim?.triggers
                ? anim.triggers
                : (template?.triggers as any)

            if (!allTriggers) {
                throw new NimaError(
                    `No triggers found in animation \`${anim.name}\``,
                )
            }

            let mySelectors: {
                [index: string]: string[]
            } = {}

            let trigUids: string[] = []

            let hasTimeline: boolean = false

            Object.keys(allTriggers).map(trigName => {
                const myTrigger = allTriggers![trigName]! as NimaMotion

                let staggers = ""
                let randoms = ""

                //console.log(trigName)

                const getTest: (input: string) => {
                    target: NimaTargetSelectorType
                    selector?: string
                    fn: string
                } = input => {
                    const res = splitSelector(input)
                    let fn = nimaTests
                        .filter(test => test.name === res.property)[0]
                        ?.getFn(res?.extraData || [])
                    if (!fn) {
                        fancyLog(
                            `Invalid test value: \`${res.property}\``,
                            "warn",
                        )
                        fn = `(el) => true`
                    }
                    return {
                        target: res.target,
                        selector: res.selector,
                        fn,
                    }
                }

                const parseTrigger: (
                    trig: string,
                ) => NimaTriggerConfig = trig => {
                    const res = splitSelector(trig)
                    const event = res.property
                    if (!nimaEventTypes.includes(event as any)) {
                        throw new NimaError(`Invalid event type: ${event}`)
                    }

                    const target = res.target
                    const selector = res.selector ?? undefined

                    let timerData
                    let viewportMargin
                    let viewportThreshold

                    switch (event) {
                        case "viewportleave":
                        case "viewportenter": {
                            viewportMargin = res?.extraData?.[0] ?? undefined
                            viewportThreshold = res?.extraData?.[1] ?? undefined
                        }
                        case "timer": {
                            if (res?.extraData?.[0]) {
                                timerData = getMilliseconds(res.extraData[0])
                            } else {
                                fancyLog(
                                    `Must include a time value with the \`timer\` trigger.`,
                                    "warn",
                                )
                                timerData = "1000ms"
                            }
                        }
                    }

                    return {
                        event,
                        target,
                        selector,
                        timerData,
                        viewportMargin,
                        viewportThreshold,
                    } as NimaTriggerConfig
                }

                const startTrigger = parseTrigger(trigName)

                let tests = myTrigger?.tests?.map(test => getTest(test))

                let endTriggers: NimaTriggerConfig[] = []
                myTrigger?.endTriggers?.map(trig => {
                    let config = parseTrigger(
                        typeof trig === "string" ? trig : trig?.trigger,
                    )
                    let endTrigTests: NimaEngineTest[] = []
                    if (typeof trig !== "string" && trig?.tests) {
                        trig.tests.map(test =>
                            endTrigTests.push(getTest(test) as any),
                        ) // Add tests to output
                    }
                    endTriggers.push({
                        ...config,
                        testMode: "ALL",
                        tests: endTrigTests,
                    })
                })

                let pauseTriggers: NimaTriggerConfig[] = []
                myTrigger?.pauseTriggers?.map(trig => {
                    let config = parseTrigger(
                        typeof trig === "string" ? trig : trig?.trigger,
                    )
                    let pauseTrigTests: NimaEngineTest[] = []
                    if (typeof trig !== "string" && trig?.tests) {
                        trig.tests.map(test =>
                            pauseTrigTests.push(getTest(test) as any),
                        ) // Add tests to output
                    }
                    pauseTriggers.push({
                        ...config,
                        testMode: "ALL",
                        tests: pauseTrigTests,
                    })
                })

                let resumeTriggers: NimaTriggerConfig[] = []
                myTrigger?.resumeTriggers?.map(trig => {
                    let config = parseTrigger(
                        typeof trig === "string" ? trig : trig?.trigger,
                    )
                    let resumeTrigTests: NimaEngineTest[] = []
                    if (typeof trig !== "string" && trig?.tests) {
                        trig.tests.map(test =>
                            resumeTrigTests.push(getTest(test) as any),
                        ) // Add tests to output
                    }
                    resumeTriggers.push({
                        ...config,
                        testMode: "ALL",
                        tests: resumeTrigTests,
                    })
                })

                const trigUid = generateUid()

                playState += `--nm-p-${trigUid}: running;\n`

                trigUids.push(trigUid)

                let motionDefaults: Record<keyof NimaMotionConfig, string> =
                    myTrigger.timeline && myTrigger?.timeline !== "auto"
                        ? {
                              duration: "1ms",
                              delay: "0ms",
                              iterations: "1",
                              easing: "linear",
                              direction: "alternate",
                              fill: "both",
                              stagger: "0s",
                              timeline: myTrigger.timeline,
                          }
                        : {
                              duration: getTimeValue(
                                  myTrigger?.duration ?? NIMA_DEFAULTS.duration,
                              ),
                              delay: getTimeValue(
                                  myTrigger?.delay ?? NIMA_DEFAULTS.delay,
                              ),
                              iterations: (
                                  myTrigger?.iterations ??
                                  NIMA_DEFAULTS.iterations
                              ).toString(),
                              easing: getEasingFunction(
                                  myTrigger?.easing ?? NIMA_DEFAULTS.easing,
                              ),
                              direction:
                                  myTrigger?.direction ??
                                  NIMA_DEFAULTS.direction,
                              fill: myTrigger.fill ?? NIMA_DEFAULTS.fill,
                              stagger: getTimeValue(
                                  myTrigger?.stagger ?? NIMA_DEFAULTS.stagger,
                              ),
                              timeline: "auto",
                          }

                let motions: {
                    frames: Partial<Record<NimaFrameKey, string[]>>
                    uid: string
                    target: {
                        type: NimaTargetSelectorType
                        selector?: string
                    }
                    props: Record<keyof NimaMotionConfig, string>
                }[] = []

                Object.keys(myTrigger).map(prop => {
                    const myProp = myTrigger[prop as any]
                    const splitProp = splitSelector(prop)

                    //console.log(splitProp)

                    const buildValue = (
                        prop: NimaAnimatableProperties,
                        value: string | number,
                    ) => {
                        switch (prop) {
                            case "translateX": {
                                return `translate: ${
                                    isNaN(Number(value)) ? value : `${value}px`
                                } var(--nima-translate-y)`
                                break
                            }
                            case "translateY": {
                                return `translate: var(--nima-translate-x) ${
                                    isNaN(Number(value)) ? value : `${value}px`
                                }`
                                break
                            }
                            default: {
                                return `${prop}: ${value}`
                            }
                        }
                    }

                    const addProps = (
                        frames: Partial<Record<NimaFrameKey, string[]>>,
                        props: NimaMotionConfig,
                        target: {
                            type: NimaTargetSelectorType
                            selector?: string
                        },
                    ) => {
                        let rands: {
                            uid: string
                            unit: string
                            min: string
                            max: string
                            step: string
                        }[] = []

                        Object.values(frames).map((vals, i) => {
                            //console.log(frames[Object.keys(frames)[i] as any])

                            vals?.map(val => {
                                val
                                    .match(/\?[a-zA-Z]*\<[^\>]*\>/g)
                                    ?.map(match => {
                                        const unit = match.slice(
                                            1,
                                            match.indexOf("<"),
                                        )
                                        const vals = match
                                            .slice(
                                                match.indexOf("<") + 1,
                                                match.indexOf(">"),
                                            )
                                            .split(",")

                                        const randuid = generateUid()

                                        let caught = false
                                        frames[Object.keys(frames)[i] as any] =
                                            frames[
                                                Object.keys(frames)[i] as any
                                            ]?.map(str => {
                                                if (caught === false) {
                                                    return str.replace(
                                                        match,
                                                        `var(--nm-r-${randuid})`,
                                                    )
                                                }
                                                return str
                                            })

                                        rands.push({
                                            uid: randuid,
                                            unit,
                                            min: vals[0] || "0",
                                            max: vals[1] || "1",
                                            step: vals[2] || "0.01",
                                        })
                                    })
                            })
                        })

                        const matchedMotion = motions.filter(
                            motion =>
                                JSON.stringify(
                                    [
                                        Object.values(motion.props),
                                        Object.values(motion.target),
                                    ].sort(),
                                ) ===
                                JSON.stringify(
                                    [
                                        Object.values(props),
                                        Object.values(target),
                                    ].sort(),
                                ),
                        )[0]

                        let myMotionUid = ""

                        if (matchedMotion) {
                            //console.log(matchedMotion)

                            myMotionUid = matchedMotion.uid

                            Object.keys(frames).map(frameKey => {
                                const frameValue = frames[frameKey as any]!
                                const res = motions[
                                    motions.indexOf(matchedMotion)
                                ]?.frames[frameKey as any]?.push(frameValue[0]!)
                                if (!res) {
                                    motions[
                                        motions.indexOf(matchedMotion)
                                    ]!.frames[frameKey as any] = [
                                        frameValue[0]!,
                                    ]
                                }
                            })
                        } else {
                            myMotionUid = generateUid()
                            motions.push({
                                uid: myMotionUid,
                                target,
                                props: {
                                    ...motionDefaults,
                                    ...(motionDefaults.timeline === "auto"
                                        ? (props as any)
                                        : {}),
                                },
                                frames,
                            })
                        }
                        rands.map(rand => {
                            randoms +=
                                `{\n` +
                                `randuid: "${rand.uid}",\n` +
                                `motionuid: "${myMotionUid}",\n` +
                                `min: ${rand.min},\n` +
                                `max: ${rand.max},\n` +
                                `step: ${rand.step},\n` +
                                `unit: "${rand.unit}",\n` +
                                `target: "${target.type}",\n` +
                                (target.selector
                                    ? `selector: "${target.selector}",\n`
                                    : "") +
                                `},\n`
                        })
                    }

                    switch (prop) {
                        case "direction":
                        case "delay":
                        case "iterations":
                        case "duration":
                        case "fill":
                        case "easing":
                        case "tests":
                        case "stagger":
                        case "endTrigger":
                        case "endTriggers":
                        case "pauseTriggers":
                        case "resumeTriggers":
                            break
                        case "timeline":
                            if ((myProp as any) !== "auto") {
                                hasTimeline = true
                            }
                            break
                        default: {
                            if (
                                nimaAnimatableProperties.includes(
                                    splitProp.property as any,
                                )
                            ) {
                                if (Array.isArray(myProp)) {
                                    //console.log(splitProp.property)
                                    if (myProp.length === 1) {
                                        addProps(
                                            {
                                                "100%": [
                                                    buildValue(
                                                        splitProp.property as NimaAnimatableProperties,
                                                        myProp[0]!,
                                                    ),
                                                ],
                                            },
                                            motionDefaults as NimaMotionConfig,
                                            {
                                                type: splitProp.target,
                                                selector: splitProp.selector,
                                            },
                                        )
                                    } else {
                                        let builtFrames: Partial<
                                            Record<NimaFrameKey, string[]>
                                        > = {}
                                        for (
                                            let i: number = 0;
                                            i < myProp.length;
                                            i++
                                        ) {
                                            builtFrames[
                                                `${Math.floor(
                                                    i *
                                                        (100 /
                                                            (myProp.length -
                                                                1)),
                                                )}%`
                                            ] = [
                                                buildValue(
                                                    splitProp.property as NimaAnimatableProperties,
                                                    myProp[i]!,
                                                ),
                                            ]
                                        }
                                        addProps(
                                            builtFrames,
                                            motionDefaults as NimaMotionConfig,
                                            {
                                                type: splitProp.target,
                                                selector: splitProp.selector,
                                            },
                                        )
                                    }
                                } else if (myProp?.frames) {
                                    let myConfig: NimaMotionConfig = (
                                        motionDefaults.timeline === "auto"
                                            ? {
                                                  duration: getTimeValue(
                                                      myProp?.duration ??
                                                          motionDefaults.duration,
                                                  ),
                                                  delay: getTimeValue(
                                                      myProp?.delay ??
                                                          motionDefaults.delay,
                                                  ),
                                                  direction:
                                                      myProp?.direction ??
                                                      motionDefaults.direction,
                                                  easing: getEasingFunction(
                                                      myProp?.easing ??
                                                          motionDefaults.easing,
                                                  ),
                                                  fill:
                                                      myProp?.fill ??
                                                      motionDefaults.fill,
                                                  iterations:
                                                      myProp?.iterations ??
                                                      motionDefaults.iterations,
                                                  stagger: getTimeValue(
                                                      myProp?.stagger ??
                                                          motionDefaults.stagger,
                                                  ),
                                              }
                                            : motionDefaults
                                    ) as NimaMotionConfig
                                    // Check if frames value is array, build props like above
                                    let builtFrames: Partial<
                                        Record<NimaFrameKey, string[]>
                                    > = {}

                                    if (Array.isArray(myProp.frames)) {
                                        for (
                                            let i: number = 0;
                                            i < myProp.frames.length;
                                            i++
                                        ) {
                                            builtFrames[
                                                `${Math.round(
                                                    i *
                                                        (100 /
                                                            (myProp.frames
                                                                .length -
                                                                1)),
                                                )}%`
                                            ] = [
                                                buildValue(
                                                    splitProp.property as NimaAnimatableProperties,
                                                    myProp.frames[i]!,
                                                ),
                                            ]
                                        }
                                    } else {
                                        try {
                                            Object.keys(myProp.frames).map(
                                                frameKey => {
                                                    if (
                                                        !Array.isArray(
                                                            myProp.frames,
                                                        )
                                                    )
                                                        builtFrames[
                                                            frameKey as NimaFrameKey
                                                        ] = [
                                                            buildValue(
                                                                splitProp.property as NimaAnimatableProperties,
                                                                myProp.frames[
                                                                    frameKey as NimaFrameKey
                                                                ]!,
                                                            ),
                                                        ]
                                                },
                                            )
                                        } catch (e) {
                                            fancyLog(
                                                `Invalid frames values: ${JSON.stringify(
                                                    myProp.frames,
                                                )}`,
                                                "warn",
                                            )
                                        }
                                    }
                                    addProps(builtFrames, myConfig, {
                                        type: splitProp.target,
                                        selector: splitProp.selector,
                                    })
                                }
                            } else {
                                fancyLog(
                                    `Invalid property: ${splitProp.property}`,
                                    "warn",
                                )
                            }
                            break
                        }
                    }
                })

                const getTargetSelector = (target: {
                    type: NimaTargetSelectorType
                    selector?: string
                }) => {
                    switch (target.type) {
                        case "self": {
                            return `.nima-${anim.name}`
                        }
                        case "selector":
                        case "ancestor":
                        case "parent": {
                            fancyLog(
                                `You cannot use \`${target.type}\` as an animation selection type`,
                                "warn",
                            )
                            return `.nima-${anim.name}`
                        }
                        case "child": {
                            return `.nima-${anim.name} > ${
                                target.selector
                                    ? target.selector
                                    : ":first-child"
                            }`
                        }
                        case "descendant": {
                            return `.nima-${anim.name} ${
                                target.selector ? target.selector : "*"
                            }`
                        }
                        case "sibling": {
                            return `.nima-${anim.name} ~ ${
                                target.selector ? target.selector : "*"
                            }`
                        }
                    }
                }

                let myMotions: {
                    [index: string]: { anim: string; timeline?: string }[]
                } = {}

                motions.map(motion => {
                    keyframes +=
                        `@keyframes nm-k-${motion.uid} {\n` +
                        (Object.keys(motion.frames) as NimaFrameKey[])
                            .sort((a, b) => {
                                const order: { [stop: string]: number } = {
                                    from: 0,
                                    to: 1,
                                }

                                const getValue = (stop: string): number =>
                                    stop.endsWith("%") ? parseFloat(stop) : NaN

                                const compareValues = (
                                    a: number,
                                    b: number,
                                ): number =>
                                    isNaN(a) ? order[a]! - order[b]! : a - b

                                // Compare the stops based on their numeric values or order
                                return compareValues(getValue(a), getValue(b))
                            })
                            .map(
                                frame =>
                                    `${frame} {\n` +
                                    `${motion.frames[frame as any]
                                        ?.map(val => `${val};\n`)
                                        .join("")}` +
                                    `}\n`,
                            )
                            .join("") +
                        `}\n`

                    const targetSelector = getTargetSelector(motion.target)
                    const val = `${getTimeValue(motion.props.duration)} ${
                        getTimeValue(motion.props.stagger) === "0s"
                            ? `${getTimeValue(motion.props.delay)}`
                            : `calc(var(--nm-d-${motion.uid}) + ${getTimeValue(
                                  motion.props.delay,
                              )})`
                    } ${motion.props.iterations} ${getEasingFunction(
                        motion.props.easing,
                    )} ${motion.props.direction} ${
                        motion.props.fill
                    } var(--nm-p-${trigUid}) nm-k-${motion.uid}`

                    if (getTimeValue(motion.props.stagger) !== "0s") {
                        delays += `--nm-d-${motion.uid}: 0s;\n`
                        staggers +=
                            `{\n` +
                            `uid: '${motion.uid}',\n` +
                            `target: '${motion.target.type}',\n` +
                            (motion.target.selector
                                ? `selector: '${motion.target.selector}',\n`
                                : "") +
                            `value: ${getMilliseconds(
                                motion.props.stagger,
                            )},\n` +
                            `},\n`
                    }

                    myMotions?.[targetSelector]
                        ? myMotions[targetSelector]!.push({
                              anim: val,
                              ...(hasTimeline
                                  ? { timeline: motion.props.timeline }
                                  : {}),
                          })
                        : (myMotions[targetSelector] = [
                              {
                                  anim: val,
                                  ...(hasTimeline
                                      ? { timeline: motion.props.timeline }
                                      : {}),
                              },
                          ])
                })

                Object.keys(myMotions).map(target => {
                    const val =
                        `--nm-a-${trigUid}: ` +
                        myMotions[target]!.map(obj => obj.anim).join(",") +
                        (hasTimeline
                            ? `;\n--nm-t-${trigUid}: ` +
                              myMotions[target]!.map(obj => obj.timeline).join(
                                  ",",
                              )
                            : "")

                    mySelectors?.[target]
                        ? mySelectors[target]!.push(val)
                        : (mySelectors[target] = [val])
                })

                myTriggers +=
                    `{\n` +
                    `uid: '${trigUid}',\n` +
                    `startTrigger: {\n` +
                    `event: '${startTrigger.event}',\n` +
                    `target: '${startTrigger.target}',\n` +
                    (startTrigger.selector
                        ? `selector: '${startTrigger.selector}',\n`
                        : "") +
                    (startTrigger.viewportMargin
                        ? `viewportMargin: '${startTrigger.viewportMargin}',\n`
                        : "") +
                    (startTrigger.viewportThreshold
                        ? `viewportThreshold: ${startTrigger.viewportThreshold},\n`
                        : "") +
                    (startTrigger.timerData
                        ? `timerData: ${startTrigger.timerData},\n`
                        : "") +
                    `tests: [\n` +
                    (tests
                        ?.map(
                            test =>
                                `{\n` +
                                `target: "${test.target}",\n` +
                                (test.selector
                                    ? `selector: "${test.selector}",\n`
                                    : "") +
                                `fn: ${test.fn},\n` +
                                `},\n`,
                        )
                        .join("") || "") +
                    `],\n` +
                    `},\n` +
                    `endTriggers: [\n` +
                    endTriggers
                        .map(trig => {
                            return (
                                `{\n` +
                                `event: '${trig.event}',\n` +
                                `target: '${trig.target}',\n` +
                                (trig.selector
                                    ? `selector: '${trig.selector}',\n`
                                    : "") +
                                (trig.viewportMargin
                                    ? `viewportMargin: '${trig.viewportMargin}',\n`
                                    : "") +
                                (trig.viewportThreshold
                                    ? `viewportThreshold: ${trig.viewportThreshold},\n`
                                    : "") +
                                (trig.timerData
                                    ? `timerData: ${trig.timerData},\n`
                                    : "") +
                                `tests: [\n` +
                                (trig.tests
                                    ?.map(
                                        test =>
                                            `{\n` +
                                            `target: "${test.target}",\n` +
                                            (test.selector
                                                ? `selector: "${test.selector}",\n`
                                                : "") +
                                            `fn: ${test.fn},\n` +
                                            `},\n`,
                                    )
                                    .join("") || "") +
                                `],\n` +
                                `},\n`
                            )
                        })
                        .join("") +
                    `],\n` +
                    `pauseTriggers: [\n` +
                    pauseTriggers
                        .map(trig => {
                            return (
                                `{\n` +
                                `event: '${trig.event}',\n` +
                                `target: '${trig.target}',\n` +
                                (trig.selector
                                    ? `selector: '${trig.selector}',\n`
                                    : "") +
                                (trig.viewportMargin
                                    ? `viewportMargin: '${trig.viewportMargin}',\n`
                                    : "") +
                                (trig.viewportThreshold
                                    ? `viewportThreshold: ${trig.viewportThreshold},\n`
                                    : "") +
                                (trig.timerData
                                    ? `timerData: ${trig.timerData},\n`
                                    : "") +
                                `tests: [\n` +
                                (trig.tests
                                    ?.map(
                                        test =>
                                            `{\n` +
                                            `target: "${test.target}",\n` +
                                            (test.selector
                                                ? `selector: "${test.selector}",\n`
                                                : "") +
                                            `fn: ${test.fn},\n` +
                                            `},\n`,
                                    )
                                    .join("") || "") +
                                `],\n` +
                                `},\n`
                            )
                        })
                        .join("") +
                    `],\n` +
                    `resumeTriggers: [\n` +
                    resumeTriggers
                        .map(trig => {
                            return (
                                `{\n` +
                                `event: '${trig.event}',\n` +
                                `target: '${trig.target}',\n` +
                                (trig.selector
                                    ? `selector: '${trig.selector}',\n`
                                    : "") +
                                (trig.viewportMargin
                                    ? `viewportMargin: '${trig.viewportMargin}',\n`
                                    : "") +
                                (trig.viewportThreshold
                                    ? `viewportThreshold: ${trig.viewportThreshold},\n`
                                    : "") +
                                (trig.timerData
                                    ? `timerData: ${trig.timerData},\n`
                                    : "") +
                                `tests: [\n` +
                                (trig.tests
                                    ?.map(
                                        test =>
                                            `{\n` +
                                            `target: "${test.target}",\n` +
                                            (test.selector
                                                ? `selector: "${test.selector}",\n`
                                                : "") +
                                            `fn: ${test.fn},\n` +
                                            `},\n`,
                                    )
                                    .join("") || "") +
                                `],\n` +
                                `},\n`
                            )
                        })
                        .join("") +
                    `],\n` +
                    `staggers: [\n` +
                    staggers +
                    `],\n` +
                    `randoms: [\n` +
                    randoms +
                    `],\n` +
                    `},\n`
            })

            //console.log(mySelectors)

            Object.keys(mySelectors).map(target => {
                selectors +=
                    `${target} {\n` + mySelectors[target]!.join(";\n") + `\n}\n`

                function generate(prefix: string, remaining: string[]): void {
                    let uids: string[] = []

                    for (let i = 0; i < prefix.length; i += 6) {
                        uids.push(prefix.slice(i, i + 6))
                    }

                    if (uids.length !== 0)
                        selectors +=
                            `${target.replace(
                                new RegExp(`nima-${anim.name}`, "g"),
                                `nima-${anim.name}${uids
                                    .map(trigUid => `.nm-a-${trigUid}`)
                                    .join("")}`,
                            )} {\n` +
                            `animation: ${uids
                                .map(trigUid => `var(--nm-a-${trigUid})`)
                                .join(",")}\n` +
                            (hasTimeline
                                ? `;\nanimation-timeline: ${uids
                                      .map(trigUid => `var(--nm-t-${trigUid})`)
                                      .join(",")}\n`
                                : "") +
                            `}\n`

                    for (let i = 0; i < remaining.length; i++) {
                        generate(prefix + remaining[i], remaining.slice(i + 1))
                    }
                }

                //console.log(trigUids)

                if (anim.triggerMode === "overlap") {
                    generate("", trigUids)
                } else {
                    trigUids.map(trigUid => {
                        //console.log(trigUid)

                        selectors +=
                            `${target.replace(
                                new RegExp(`nima-${anim.name}`, "g"),
                                `nima-${anim.name}.nm-a-${trigUid}`,
                            )} {\n` +
                            `animation: var(--nm-a-${trigUid})\n` +
                            (hasTimeline
                                ? `;\nanimation-timeline: var(--nm-t-${trigUid})\n`
                                : "") +
                            `}\n`
                    })
                }
            })

            const triggers = `triggers: [\n` + myTriggers + `],\n`

            workingAnimConfig += `{\n` + name + triggerMode + triggers + `},\n`
        })

        const stylesHead =
            `:root {\n` +
            `--nima-translate-x: 0px;\n` +
            `--nima-translate-y: 0px;\n` +
            playState +
            delays +
            `}\n`

        return {
            animationConfig: workingAnimConfig,
            styles: stylesHead + keyframes + selectors,
        }
    } catch (e) {
        if (e instanceof NimaError) {
            throw e
        }
        throw new NimaError("Error while starting Nima Engine...")
    }
}
