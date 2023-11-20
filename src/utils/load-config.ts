import path from "path"
import { defaultConfig } from "../lib/default-config.js"
import { NimaError } from "../types/errors.js"
import { NimaConfig } from "../types/nima-config.js"
import { glob } from "glob"
import fs from "fs"
import { fileURLToPath } from "url"
import { fancyLog } from "./fancy-log.js"

const loadConfig: () => Promise<{
    config: NimaConfig
}> = async () => {
    let config = defaultConfig
    let loadedConfig: any = null

    const timestamp = Date.now()

    let configDir
    try {
        const res = await glob("**/nima.config.{ts,js,json,mjs}", {
            ignore: "node_modules/**/*.*",
        })
        if (res.length === 0) {
            throw new NimaError(
                "No config file found!",
                "Create a new config file using `npx nima init`.",
            )
        } else if (res.length > 1) {
            throw new NimaError(
                "Multiple config files found!",
                "You can only have one config file at a time.",
            )
        } else {
            configDir = res[0]
        }
    } catch (e) {
        console.log(e)
        if (e instanceof NimaError) {
            throw e
        }
        throw new NimaError(
            "Error reading config file...",
            "Internal error, try again",
        )
    }

    fancyLog(
        `Found config file at: \`${path.relative(process.cwd(), configDir!)}\``,
        "info",
    )

    try {
        const slice = configDir?.split(".")
        const ext = slice![slice!.length - 1]?.toLowerCase()

        switch (ext) {
            case "mjs":
            case "ts":
            case "js": {
                loadedConfig = (
                    await import(
                        path
                            .relative(
                                fileURLToPath(path.dirname(import.meta.url)),
                                path.resolve(process.cwd(), configDir!),
                            )
                            .replaceAll("\\", "/") + `?${Date.now()}`
                    )
                ).default as any
                break
            }
            case "ts": {
                // loadedConfig = (
                //     (await import(
                //         path
                //             .relative(
                //                 fileURLToPath(path.dirname(import.meta.url)),
                //                 path.resolve(process.cwd(), configDir!),
                //             )
                //             .replaceAll("\\", "/")
                //     )) as any
                // ).default
                // console.log(JSON.stringify(loadedConfig))
                // throw new NimaError(
                //     "TypeScript is not yet supported. Please format your config file in JavaScript or JSON format.",
                // )
                break
            }
            case "json": {
                await fs.readFile(
                    path.resolve(process.cwd(), configDir!),
                    (err, data) => {
                        loadedConfig = JSON.parse(data.toString())
                    },
                )

                break
            }
        }
    } catch (e) {
        console.log(e)
        if (e instanceof NimaError) {
            throw e
        }
        throw new NimaError(
            "Error while importing config file.",
            "Make sure config file is in the correct format.",
        )
    }

    fancyLog(`Reading contents of config file...`, "info")

    if (loadedConfig) {
        if (loadedConfig?.compilerOptions?.content) {
            if (typeof loadedConfig.compilerOptions.content === "string") {
                config = {
                    ...config,
                    compilerOptions: {
                        ...config.compilerOptions,
                        content: [loadedConfig.compilerOptions.content],
                    },
                }
            } else if (Array.isArray(loadedConfig?.compilerOptions?.content)) {
                config = {
                    ...config,
                    compilerOptions: {
                        ...config.compilerOptions,
                        content: loadedConfig.compilerOptions.content,
                    },
                }
            } else {
                throw new NimaError(
                    "Config `content` property is in an invalid format.",
                )
            }
        }
        if (loadedConfig?.compilerOptions?.outputDir) {
            if (typeof loadedConfig.compilerOptions.outputDir === "string") {
                config = {
                    ...config,
                    compilerOptions: {
                        ...config.compilerOptions,
                        outputDir: loadedConfig.compilerOptions.outputDir,
                    },
                }
            } else {
                throw new NimaError(
                    "Config `outputDir` property is in an invalid format.",
                )
            }
        }
        if (loadedConfig?.animations) {
            if (Array.isArray(loadedConfig.animations)) {
                config = {
                    ...config,
                    animations: [...loadedConfig.animations],
                }
            } else {
                throw new NimaError(
                    "Config `animations` property is must be an array.",
                )
            }
        }
    }

    fancyLog(
        `Successfully loaded config from \`${path.relative(
            process.cwd(),
            configDir!,
        )}\` in ${Date.now() - timestamp}ms`,
        "boldinfo",
    )

    return {
        config,
    }
}

export default loadConfig
