export const nimaTests = [
    {
        name: "hasValue",
        getFn: (args: string[]) => `(el) => el?.value === "${args[0]}"`,
    },
] as const
