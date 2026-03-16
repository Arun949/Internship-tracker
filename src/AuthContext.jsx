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
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', sessionUser.id)
                    .single();
                setIsAdmin(data?.is_admin || false);
            } catch {
                setIsAdmin(false);
            }
        };

        // Use onAuthStateChange ONLY — it fires INITIAL_SESSION immediately on mount,
        // which avoids the race condition between getSession() + onAuthStateChange.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                // Show board immediately — don't wait for profile fetch
                setLoading(false);
                // Load admin flag in background (no await)
                fetchProfile(currentUser);
            }
        );

        // Safety timeout — if Supabase never responds, stop spinning after 5s
        const timeout = setTimeout(() => setLoading(false), 5000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
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
