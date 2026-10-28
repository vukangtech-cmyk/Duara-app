import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase.js";

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  updateProfile: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null);
      return null;
    }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Hitilafu ya kupata wasifu:", error.message);
        return null;
      }
      setProfile(data || null);
      return data;
    } catch (err) {
      console.warn("Hitilafu ya wasifu:", err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      return await fetchProfile(user.id);
    }
    return null;
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    if (!supabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    async function initializeAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) {
          const currentUser = session?.user || null;
          setUser(currentUser);
          if (currentUser) {
            await fetchProfile(currentUser.id);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.warn("Hitilafu ya kikao:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      if (mounted) {
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email, password) => {
    if (!supabase) throw new Error("Supabase haijaunganishwa.");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
    }
    return data;
  };

  const signUp = async ({ email, password, displayName, phone, institution, region }) => {
    if (!supabase) throw new Error("Supabase haijaunganishwa.");
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName,
          phone: phone || ""
        }
      }
    });
    if (error) throw error;

    if (data?.user) {
      // Upsert to profiles table immediately
      const profilePayload = {
        id: data.user.id,
        display_name: displayName || "Mtumiaji",
        phone: phone || "",
        institution: institution || "Mtu Binafsi / Nje ya Chuo",
        region: region || "Dar es Salaam",
        role: "user",
        is_blocked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: pError } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });

      if (pError) {
        console.warn("Profaili haikuweza kuhifadhiwa kikamilifu:", pError.message);
      }
      setUser(data.user);
      await fetchProfile(data.user.id);
    }
    return data;
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!supabase || !user) throw new Error("Hujaingia kwenye mfumo.");
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
        isAdmin: profile?.role === "admin"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth lazima itumike ndani ya AuthProvider.");
  }
  return context;
}
