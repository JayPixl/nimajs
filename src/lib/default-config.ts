import type { NimaConfig } from "../types"

export const defaultConfig: NimaConfig = {
    compilerOptions: {
        content: ["**/*.{js,ts,jsx,tsx}"],
        outputDir: "./",
    },
}
