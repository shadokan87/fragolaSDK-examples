export type ExtractToolHandler<T> = T extends { handler: infer H }
    ? H extends (...args: any[]) => any
        ? H
        : never
    : never;