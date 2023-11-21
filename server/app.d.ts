// https://lucia-auth.com/getting-started/nuxt/
/// <reference types="lucia" />
declare namespace Lucia {
    type Auth = import("./utils/lucia").Auth
    type DatabaseUserAttributes = {
        name: string
    }
    type DatabaseSessionAttributes = {}
}
