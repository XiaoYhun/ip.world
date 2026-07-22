/**
 * Shared mutable flag that lets any page tell DynamicErrorInterceptor to
 * stay silent. When `current` is true, the global interceptor skips its
 * toast so the active page can handle the error in its own way.
 */
export const dynamicErrorSuppress = { current: false }
