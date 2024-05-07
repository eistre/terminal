// template from https://v2.lucia-auth.com/getting-started/nuxt/
/// <reference types="lucia" />
declare namespace Lucia {
    type Auth = import("./utils/lucia").Auth
    type DatabaseUserAttributes = {
        name: string,
        email?: string,
        expireTime: string | null,
        role: 'UNVERIFIED' | 'USER' | 'ADMIN'
    }
    type DatabaseSessionAttributes = {}
}
