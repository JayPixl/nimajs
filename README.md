# Nima

Nima is a versatile trigger-based animation engine that is able to be used across many environments and platforms by harnessing the power of native browser keyframes animations.

## Usage

Begin here to get started using Nima in your project.

### Installation

Install the package using npm.

```bash
npm i nimajs
```

### Initialization

Use the Nima CLI from the root of your project to create a nima config file, which will hold the compiler options as well as structure for all your custom animations.

```bash
npx nima init
```

This will create a `nima.config.js` file at the root of your project that looks something like this:

```js
/** @type {import('nimajs/dist/dev/config/types/v1').V1Config} */

export default {
    compilerOptions: {
        content: ["**/*.{js,ts,jsx,tsx}"], // Where to look for JSX source files
        outputDir: "./", // Where the Nima Engine should be output
    },
    animations: [], // Configuration for custom animations
}
```

### Configuration

The first step in bringing your animations to life is by defining their structure in the config file.

> Note: there are many predefined animations available in the nimajs package! Check out the available templates before trying to create it yourself!

We'll create a simple button animation called "my-button-animation", with a hover effect as well as a click animation.

```js
// ...
animations: [
    {
        name: "my-button-animation", // Name your animation
        triggerMode: "overlap", // Triggers overlap
        alwaysCompile: true, // Always compile this animation
        triggers: {
            mouseenter: {
                // On mouse enter, run this animation
                scale: [1, 1.1], // Scale from 1 to 1.1
                duration: 300, // Duration of 300ms
                fill: "forwards", // Keep the end state of the animation
                iterations: 1, // Only run this animation once
                endTrigger: "mouseleave", // End this animaation on mouseleave
            },
            click: {
                // On click, run this animation
                scale: [1.1, 1.2, 1.1], // Scale from 1.1 to 1.2 to 1.1, spaced evenly
                duration: 200, // Duration of 200ms
                iterations: 1, // Only one iteration
                easing: "linear", // Use the "linear" easing function
                endTrigger: "timer<200ms>", // End after 200ms so you can click again
            },
            mouseleave: {
                // On mouse leave, run this animation
                scale: [1.1, 1], // Scale from 1.1 to 1
                duration: 300, // Duration of 300ms
                fill: "forwards", // Keep the end state of the animation
                iterations: 1, // Only run this animation once
                endTrigger: "mouseenter", // End this animaation on mouseenter
            },
        },
    },
]
// ...
```

### Building

In order to use our handy new animation in our project, we need to build the Nima Engine using the Nima CLI again. Run this command in your terminal from the root of your project, and the engine will be built in the output directory defined by your Nima config file compiler options.

```bash
npx nima build
```

This should build a `nima-engine.js` file in the root of your project, loaded with all the CSS keyframes, selectors, and JavaScript necessary to handle your awesome new animation!

### Implementation

The last steps in order to include your animation in your project are importing the Nima Engine and using the animation selector in your code.

#### Engine Import

Importing the Nima engine will be different with different project types and formats, but we'll give an example using React.

In your `App.tsx` file, import the Nima Engine start function from the `nima-engine.js` file, and use it in a `useEffect()` hook in the `App` function.

```jsx
import React, { useEffect } from "react"
import { loadNimaEngine } from "./nima-engine.js"

export default function App() {
    useEffect(() => {
        loadNimaEngine()
    }, [])

    return (
        <>
            <button>Push me!</button>
        </>
    )
}
```

#### Activate Selector

The final step is to slap your animation onto a component or tag! Since your animation name is `my-button-animation`, you'll have to use the `nima-my-button-animation` class name in your project.

```jsx
// ...
return (
    <>
        <button className="nima-my-button-animation">Push me!</button>
    </>
)
// ...
```

Congrats! You created your first Nima animation! 🎉

## CLI Reference

### Usage

```bash
npx nima [command] [flags]
```

\- or -

```bash
npx nimajs [command] [flags]
```

> If run without a command, defaults to the `build` command.

### Commands

#### `init [format] [output]`

Creates a nima config file in your project.

-   Format

    -   format of config file

    -   `--js` _(default)_

        -   js format

    -   `--json`

        -   json format

    -   `--ts`

        -   ts format

-   Output

    -   Default output is `./`

    -   `--output [dir]` or `-o [dir]`

        -   ex `-o ./src`

#### `build [options]`

Runs the build script to generate the Nima Engine at the directory specified in the config file.

-   Options

    -   `--watch` or `-w`

        -   Run in watch mode. Watches for changes to input files or config file and reruns the build command automatically.

## Config Reference

```js
// nima.config.js

export default {
    compilerOptions: {
        // Compiler Options
    },
    animations: [
        // Custom Animations
    ],
}
```

### Compiler Options

| Property    | Type       | Description                                                                                |
| ----------- | ---------- | ------------------------------------------------------------------------------------------ |
| `content`   | `string[]` | Array of glob patterns to search for valid `nima-*` class names to include in the compiler |
| `outputDir` | `string`   | Directory to generate the Nima config file at. Default is `"./"`                           |

### Animations

```ts
{
    // Name of the animation
    name: "<string>"

    // Whether triggers should overlap or replace each other
    triggerMode: "<'replace'|'overlap'>"

    // Template to extend
    template: "<string>"

    // Whether this animation should always be compiled regardless of whether it is present in the project
    alwaysCompile: "<boolean>"

    // Animation's triggers are defined here
    triggers: {
        // Trigger type with optional selector
        // ex. `load: { /* ... */}` or `"click@selector#myId": { /* ... */}`
        "<NimaTrigger>": {
            // Spaces values evenly in the animation
            // ex. `scale: [1, 1.2]` or `"opacity@child.my-class": [0, 1]`
            "<NimaPropertySelector>": [
                "start value",
                "mid value",
                "end value"
            ]

            // Custom control per property, inherits properties from main
            // ex. `top: {
            //     frames: [0, 1],
            //     duration: 500,
            //     easing: "linear"
            // }`
            "<NimaPropertySelector>": {
                // Short syntax, spaces evenly
                frames: [
                    "start value",
                    "mid value",
                    "end value"
                ]

                // - OR -

                // Expanded syntax, define stop points
                // ex. `frames: {
                //    "0%": "5px",
                //    "60%": "12px",
                //    "100%": "10px"
                // }`
                frames: {
                    "<'from'|'to'|number|`${number}%`>": "<value>",
                    // ...
                }

                // Extends NimaMotionConfig
                // ex. `duration: 500`
                "<NimaMotionConfig>": "<value>"
            }


            // NimaMotionConfig values, any missing will default to global defaults

            // If number, defaults to value in milliseconds
            duration: "<string|number>"

            delay: "<string|number>"

            // Added delay per selected element
            stagger: "<string|number>"

            // How many times to run the animation per trigger
            iterations: "<number|'infinite'>"

            // Easing function to use for the animation
            easing: "<NimaEasingFunction>"

            // Which way to play the animation
            direction: "<'normal'|'reverse'|'alternate'|'alternate-reverse'>"

            // Which end state to keep
            fill: "<'none'|'forwards'|'backwards'|'both'>"


            // Action triggers

            // Triggers to end the animation
            endTriggers: [
                "<NimaTrigger>"
            ]

            // Triggers to pause the animation
            pauseTriggers: [
                "<NimaTrigger>"
            ]

            // Triggers to resume the animation when paused
            resumeTriggers: [
                "<NimaTrigger>"
            ]
        }
    }
}
```

### Triggers

A trigger is composed of two parts: the event and a target, separated by an `"@"` symbol. For example: `"blur@parent"`

-   Event

    An HTML Event such as `"load"`, `"mouseenter"`, or `"focus"`.

    > Event arguments must be placed in angle brackets. Separate arguments with commas (`,`) and denote spaces with underscores (`_`). For example `timer<500ms>` or `viewportenter<100px_0px,0.8>`

    Custom Nima Events:

    -   `"viewportenter"`

        Fired when the target element enters the viewport.

        Arguments: `<rootMargin,viewportThreshold>`

        -   `rootMargin`

            How much margin around the viewport will trigger the event.

            > Ex. `0px` or `50px 0px`

        -   `viewportThreshold`

            How much of the element must be visible in order to trigger. Percentage from 0 to 1.

            > Ex. `0.8` or `1`

    -   `"viewportleave"`

        Fired when the target element leaves the viewport.

        Same arguments as `"viewportenter"`

    -   `"timer"`

        Fired after a set amount of time.

        Arguments: `<time>`

        -   `time`

            Amount of time; required.

            > Ex. `500ms` or `2s` or `4000`

-   Target

    Tells Nima what target to attach the trigger to. Broken up into two parts: the target type and the target selector. If a target isn't chosen at all it will default to `self`.

    -   Type

        -   `"self"`

            Default value, property applies to self.

        -   `"chlid"`

            Will select the direct child of the animated element.

        -   `"descendant"`

            Will select a descendant of the animated element.

        -   `"sibling"`

            Selects a sibling of the animated element.

        -   `"parent"`

            Selects a direct parent of the animated element.

        -   `"ancestor"`

            Selects an ancestor of the animated element.

        -   `"selector"`
            Used to select an element not relative to the animated element.

    -   Selector

        This can be any CSS selector and is placed right next to the target type.

        Examples:

        -   `"sibling.my-class"`

            Selects siblings of the animated element with the class `my-class`.

        -   `"descendantdiv"`

            Selects descendants of the animated element that are `<div>` elements.

        -   `"selector#myId"`

            Selects the element with an id of `myId`.

-   Full Examples

    ```js
    "mouseenter@parent.parent-class"

    "focus@siblinginput"

    "viewportenter<100px>@self"
    ```

> This is also how selectors work for animated properties. For example `"opacity@child"` or `"background-color@selector#myId"`

## Type Reference

```ts
/* Full Config */
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

// All animatable properties, such as "opacity" or "translateY" or "margin-x" or "border-top-color"
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

// Custom easing functions: "ease-smooth", "ease-smack"
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

// All event types, such as "load" or "mouseenter" or "timer<200ms>" or "viewportenter<0px,0.5>"
export type NimaEventType =
    | (typeof nimaEventTypes)[number]
    | `timer<${string}>`
    | `viewportenter<${string}>`
    | `viewportleave<${string}>`

/* Selectors */

export type NimaTargetSelectorType =
    | "self"
    | "ancestor"
    | "parent"
    | "sibling"
    | "child"
    | "descendant"
    | "selector"

export type NimaTargetSelector = `${NimaTargetSelectorType}${string}`
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for more information about contributions and Code of Conduct.

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.
