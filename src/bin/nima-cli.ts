#!/usr/bin/env ts-node-esm --transpile-only

import { exit } from "process"
import { loadConfig, runInit } from "../utils/index.js"
import { fancyLog } from "../utils/fancy-log.js"
import { NimaError } from "../types/errors.js"
import { startEngine } from "../utils/start-engine.js"
import chokidar from "chokidar"

const args = process.argv.slice(2)

fancyLog("", "header")

let lastMemoryUsage = process.memoryUsage()

function logMemoryUsage() {
    const memoryUsage = process.memoryUsage()
    console.log("Memory Usage:")
    console.log(`- RSS: ${memoryUsage.rss - lastMemoryUsage.rss} bytes`)
    console.log(
        `- Heap Total: ${
            memoryUsage.heapTotal - lastMemoryUsage.heapTotal
        } bytes`,
    )
    console.log(
        `- Heap Used: ${memoryUsage.heapUsed - lastMemoryUsage.heapUsed} bytes`,
    )
    console.log(
        `- External: ${memoryUsage.external - lastMemoryUsage.external} bytes`,
    )
    lastMemoryUsage = memoryUsage
}

try {
    if (args[0] === "init") {
        let targetFormat: "ts" | "js" | "json" = "js"
        let outputDir: string | undefined = "./"
        if (args.indexOf("--ts") !== -1) {
            targetFormat = "ts"
            // throw new NimaError(
            //     "TypeScript is not yet supported. Please choose either `--js` or `--json`.",
            // )
        } else if (args.indexOf("--js") !== -1) {
            targetFormat = "js"
        } else if (args.indexOf("--json") !== -1) {
            targetFormat = "json"
        }
        if (args.indexOf("--output") !== -1 || args.indexOf("-o") !== -1) {
            let outputFlagIndex =
                args.indexOf("--output") !== -1
                    ? args.indexOf("--output")
                    : args.indexOf("-o")
            if ((outputDir = args[outputFlagIndex + 1])) {
                if (outputDir.slice(0, 2) !== "./") {
                    outputDir = `./${outputDir}`
                }
            } else {
                throw new NimaError(
                    "No output directory specified.",
                    "Add an output directory after --output or -o",
                )
            }
        }
        //console.log(`Beginning Init: ${Date.now() - startTime}ms`)
        await runInit(targetFormat, outputDir)
        //console.log(`Finished Init: ${Date.now() - startTime}ms`)
    } else if (
        args[0] === "build" ||
        args[0]?.[0] === "-" ||
        args.length === 0
    ) {
        const flags = args.filter(arg => arg !== "build")
        let options = {
            watch: false,
        }

        if (flags.indexOf("-w") !== -1 || flags.indexOf("--watch") !== -1) {
            options.watch = true
        }

        const build = () => {
            loadConfig().then(res => {
                startEngine(options, res.config)
                //logMemoryUsage()
            })
        }

        if (options.watch === true) {
            const inputGlob = "**/*.{js,jsx,ts,tsx,json}"

            const watcher = chokidar.watch(inputGlob, {
                persistent: true,
                ignoreInitial: true,
                ignored: ["node_modules", "**/nima-engine.*"],
            })

            let refreshCount: number = 0

            fancyLog("Starting in Watch Mode!", "important")
            build()

            watcher.on("change", async path => {
                if (refreshCount < 20) {
                    console.clear()
                    fancyLog("", "header")
                    fancyLog(`File changed: ${path}`, "boldinfo")
                    build()
                } else {
                    watcher.close()
                    throw new NimaError(
                        `Process is automatically shutting down to avoid memory issues. Restart the watcher using \`npx nima build -w\``,
                    )
                }
                refreshCount++
            })

            watcher.on("error", error => {
                fancyLog(`Watcher error: ${error}`, "error")
            })

            process.on("SIGINT", () => {
                watcher.close()
                throw new NimaError(`Process closed`)
            })
        } else {
            build()
        }
    } else {
        throw new NimaError(
            "Invalid command syntax.",
            "Try `npx nima --help` for command usage syntax.",
        )
    }
} catch (e: any) {
    if (e instanceof NimaError) {
        fancyLog(e.message, "error")
        if (e?.hint) {
            fancyLog(e.hint, "hint")
        }
    } else {
        console.error(e)
    }
}
