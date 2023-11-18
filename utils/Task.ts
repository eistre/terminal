export type Task = {
    label: string
    defaultOpen?: boolean
    variant: 'outline' | 'solid'
    content: string
    hint?: string
}
