import { nimaTemplates } from "../lib/templates/index.js"
import type { NimaAnimation, NimaConfig } from "../types"
import { fancyLog } from "./fancy-log.js"

export const generateFullConfig: (
    config: NimaConfig,
    classes: string[],
) => NimaConfig = (config, classes) => {
    const myTemplates = nimaTemplates as any

    const newConfig = {
        compilerOptions: {
            ...config.compilerOptions,
        },
        animations: [
            ...[
                ...(config?.animations
                    ?.filter(
                        anim =>
                            anim.alwaysCompile === true &&
                            !classes.includes(anim.name),
                    )
                    .map(anim => anim.name) || []),
                ...classes,
            ]
                .map(cl => {
                    const template =
                        myTemplates.filter(
                            (temp: NimaAnimation) => temp.name === cl,
                        )[0] ||
                        config.animations?.filter(anim => anim.name === cl)[0]
                    if (template) {
                        return template
                    } else {
                        fancyLog(
                            `Invalid animation name found: \`${cl}\``,
                            "warn",
                        )
                    }
                })
                .filter((temp: NimaAnimation) => temp !== undefined),
        ],
    } as NimaConfig

    return newConfig
}
