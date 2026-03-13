import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const fetchProfile = async (sessionUser) => {
            if (!sessionUser) {
                setIsAdmin(false);
                return;
            }
            const { data } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', sessionUser.id)
                .single();
            
            setIsAdmin(data?.is_admin || false);
        };

        // Get current session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            fetchProfile(currentUser).finally(() => setLoading(false));
        });

        // Listen for auth changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                await fetchProfile(currentUser);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signUp = (email, password, name) =>
        supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        });

    const signIn = (email, password) =>
        supabase.auth.signInWithPassword({ email, password });

    const signInWithMagicLink = (email) =>
        supabase.auth.signInWithOtp({ email });

    const signOut = () => supabase.auth.signOut();

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, signUp, signIn, signInWithMagicLink, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
