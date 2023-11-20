import fs from "fs"
import getRoot from "./get-root.js"
import path from "path"

export const getVersion: () => string | undefined = () => {
    try {
        return JSON.parse(
            fs
                .readFileSync(
                    path.resolve(getRoot().absoluteModuleRoot, "package.json"),
                )
                .toString(),
        ).version
    } catch (e) {
        return undefined
    }
}
