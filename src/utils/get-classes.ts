import { glob } from "glob"
import type { NimaConfig } from "../types/nima-config.js"
import { NimaError } from "../types/errors.js"
import fs from "fs"

export const getClasses: (
    config: NimaConfig,
) => Promise<string[]> = async config => {
    let classes: string[] = []
    try {
        const myGlob = await glob(config!.compilerOptions!.content!, {
            ignore: "node_modules/**",
        })
        myGlob.map(path => {
            const data = fs.readFileSync(path, "utf-8")
            const regex =
                /\bclassName\s*=\s*(?:"([^"]+)"|'([^']+)'|{`([^`]+)`})/g
            let match

            while ((match = regex.exec(data)) !== null) {
                const classNameString = match[1] || match[2] || match[3]
                const classNames = classNameString?.split(" ")
                classNames?.map(name => {
                    if (
                        /^nima-/.test(name) &&
                        !classes.includes(name.slice(5))
                    ) {
                        classes.push(name.slice(5))
                    }
                })
            }
        })
        return classes
    } catch (e) {
        throw new NimaError("Error while reading classes from input.")
    }
}
