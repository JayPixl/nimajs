import path from "path"
import { fileURLToPath } from "url"

const getRoot: () => {
    absoluteModuleRoot: string
    relativeAppRoot: string
    absoluteAppRoot: string
} = () => {
    return {
        relativeAppRoot: /node\_modules/.test(import.meta.url)
            ? "../../../../"
            : "../../../",
        absoluteModuleRoot: path.resolve(
            path.dirname(fileURLToPath(import.meta.url)),
            "../..",
        ),
        absoluteAppRoot: path.resolve(
            path.dirname(fileURLToPath(import.meta.url)),
            "../..",
            /node\_modules/.test(import.meta.url) ? "../.." : "..",
        ),
    }
}

export default getRoot
