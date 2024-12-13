import { z } from 'zod'

export const ProviderSchema = z.enum(['ollama', 'anthropic', 'xai']).default('ollama')

export const ArgsSchema = z.object({
  pwd: z.string(),
  provider: ProviderSchema
})

export type TProviders = z.infer<typeof ProviderSchema>
export type TArgs = z.infer<typeof ArgsSchema>
