import getRoot from "./get-root.js"
import fs from "fs"
import { glob } from "glob"
import path from "path"
import { NimaError } from "../types/errors.js"
import { fancyLog } from "./fancy-log.js"

const runInit: (
    format: "js" | "ts" | "json",
    outputDir: string,
) => Promise<{
    success?: boolean
}> = async (format, outputDir) => {
    const { absoluteModuleRoot } = getRoot()

    let templateDir
    let extension

    switch (format) {
        case "js": {
            templateDir = "templates/config/v1.js"
            extension = "mjs"
            break
        }
        case "ts": {
            templateDir = "templates/config/v1.txt"
            extension = "ts"
            break
        }
        case "json": {
            templateDir = "templates/config/v1.json"
            extension = "json"
            break
        }
    }

    fancyLog(
        `Beginning init with format \`nima.config.${format}\` in directory ${outputDir}`,
        "info",
    )

    let data
    try {
        data = fs
            .readFileSync(path.resolve(absoluteModuleRoot, templateDir))
            .toString()
        fancyLog("Successfully loaded template file.", "info")
    } catch (e) {
        throw new NimaError(
            "Could not read template file.",
            "This is an internal error thrown while reading template config file. Try creating a `nima.config.js` file at the root of your project.",
        )
    }

    const matchedConfig = await glob("**/nima.config.{js,ts,json,mjs}", {
        ignore: "node_modules/**/*.*",
    })
    if (matchedConfig.length !== 0) {
        throw new NimaError(
            "Config file already found!" /*"Add the `--force` option to replace your original config file."*/,
        )
    }

    try {
        fs.writeFileSync(
            path.resolve(process.cwd(), outputDir, `nima.config.${extension}`),
            data,
        )
        fancyLog("", "blank")
        fancyLog(
            `Successfully created config at: ${outputDir.slice(
                2,
            )}/nima.config.${extension}`,
            "success",
        )
        return {
            success: true,
        }
    } catch (e) {
        throw new NimaError(
            "Could not write to file.",
            "Make sure your output directory is correct. If all else fails try creating a `nima.config.js` file at the root of your project.",
        )
    }
}

export default runInit
