function requireEnv(key: string, value: string | undefined): string {
    const normalizedValue = value?.trim();
    if (!normalizedValue) {
        throw new Error(
            `Missing required public env var ${key}. Set it in .env.local or the shell before starting Expo.`,
        );
    }
    return normalizedValue;
}

const supabaseUrl = requireEnv(
    'EXPO_PUBLIC_SUPABASE_URL',
    process.env.EXPO_PUBLIC_SUPABASE_URL,
);
const supabasePublishableDefaultKey = requireEnv(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
);
const supabaseAnonKey = requireEnv(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

export const runtimeConfig = {
    supabaseUrl,
    supabasePublishableDefaultKey,
    supabaseAnonKey,
};
