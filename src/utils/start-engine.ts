import fs from "fs"
import { NimaError } from "../types/errors.js"
import { NimaConfig } from "../types/nima-config.js"
import { generateAnimationConfigs } from "./generate-animation-configs.js"
import path from "path"
import getRoot from "./get-root.js"
import { glob } from "glob"
import { generateFullConfig } from "./generate-full-config.js"
import { getClasses } from "./get-classes.js"
import { fancyLog } from "./fancy-log.js"
import { NimaBuildOptions } from "../types/cli.js"
import postcss from "postcss"
import autoprefixer from "autoprefixer"
import cssnano from "cssnano"
import UglifyJS from "uglify-js"

export const startEngine: (
    options: NimaBuildOptions,
    config: NimaConfig,
) => void = async (options, config) => {
    try {
        const { absoluteModuleRoot } = getRoot()
        const timestamp = Date.now()

        const tsMode: boolean = options?.format
            ? options.format === "ts"
            : (await glob("**/*.{ts,tsx}", { ignore: "node_modules/**/*.*" }))
                  .length !== 0

        let template = (
            !tsMode
                ? fs.readFileSync(
                      path.resolve(absoluteModuleRoot, "dist/lib/engine/v1.js"),
                  )
                : fs.readFileSync(
                      path.resolve(
                          absoluteModuleRoot,
                          "templates/engine/v1.txt",
                      ),
                  )
        )
            .toString()
            .replace(/(\/\/[^\n]+)map/, "")

        const classes = await getClasses(config)
        fancyLog(
            `Found ${classes.length} Nima animations in the source files!`,
            "info",
        )

        const fullConfig = generateFullConfig(config, classes)

        fancyLog(`Generating Nima Engine...`, "info")
        let { animationConfig, styles } = await generateAnimationConfigs(
            fullConfig,
            options,
        )

        if (options.minifyCSS) {
            try {
                const res = await postcss([
                    cssnano({ preset: "default", plugins: [autoprefixer] }),
                ]).process(styles, { from: undefined })
                styles = res.css
            } catch (e) {
                fancyLog("Could not minify CSS", "warn")
            }
        }

        // Deal with minifier warnings and add CLI options

        template = template
            .replaceAll("/* NIMA_STYLES */", styles)
            .replaceAll("/* NIMA_ANIMATIONS */", animationConfig)

        if (options.minifyJS) {
            try {
                if (!tsMode) {
                    const res = UglifyJS.minify(template)
                    if (res.code && !res.error) {
                        template = res.code
                    } else throw res.error
                } else {
                    if (options.format === "ts") {
                        fancyLog(
                            `Cannot minify engine when in TypeScript format`,
                            "warn",
                        )
                    } else {
                        fancyLog(
                            `Cannot minify engine when in TypeScript format`,
                            "warn",
                        )
                        fancyLog(
                            `TypeScript was detected in your project, so the format was automatically set to TS mode.`,
                            "hint",
                        )
                        fancyLog(
                            `Try either manually setting the output format or use the \`--no-minify-js\` flag.`,
                            "hint",
                        )
                    }
                }
            } catch (e) {
                fancyLog("Could not minify JavaScript", "warn")
            }
        }

        const enginePath = path.resolve(
            process.cwd(),
            config!.compilerOptions!.outputDir!,
            `nima-engine.${tsMode ? "ts" : "mjs"}`,
        )

        fs.writeFileSync(enginePath, template)

        fancyLog("", "blank")

        fancyLog(
            `Nima Engine generated at \`${path.relative(
                process.cwd(),
                enginePath,
            )}\` in ${Date.now() - timestamp}ms ✨`,
            "success",
        )
    } catch (e: any) {
        if (e instanceof NimaError) {
            fancyLog(e.message, "error")
            if (e?.hint) {
                fancyLog(e.hint, "hint")
            }
        } else {
            console.error(e)
        }
        process.exit(1)
    }
}
