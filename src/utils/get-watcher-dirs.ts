import loadConfig from "./load-config.js"
import { glob } from "glob"

export const getWatcherDirs: () => Promise<string> = async () => {
    return `{${(
        (await loadConfig({ silent: true })).config!.compilerOptions!
            .content as string[]
    ).join(",")},${
        (
            await glob("**/nima.config.{ts,js,json,mjs}", {
                ignore: "node_modules/**/*.*",
            })
        )[0]
    }}`
}
