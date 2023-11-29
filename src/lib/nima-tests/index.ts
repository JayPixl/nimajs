export const nimaTests = [
    {
        name: "hasValue",
        getFn: (args: string[]) => `(el) => el?.value === "${args[0]}"`,
    },
    {
        name: "custom",
        getFn: (args: string[]) => args[0],
    },
    {
        name: "hasAttr",
        getFn: (args: string[]) => `(el) => el?.${args[0]} === ${args[1]}`,
    },
    {
        name: "hasClass",
        getFn: (args: string[]) =>
            `(el) => el?.classList.contains("${args[0]}")`,
    },
] as const
