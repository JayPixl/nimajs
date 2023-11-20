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

export const startEngine: (
    options: { watch: boolean },
    config: NimaConfig,
) => void = async (options, config) => {
    try {
        const { absoluteModuleRoot } = getRoot()
        const timestamp = Date.now()
        const tsMode = (await glob("**/*.{ts,tsx}")).length !== 0

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
        const { animationConfig, styles } =
            await generateAnimationConfigs(fullConfig)

        template = template
            .replaceAll("/* NIMA_STYLES */", styles)
            .replaceAll("/* NIMA_ANIMATIONS */", animationConfig)

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
