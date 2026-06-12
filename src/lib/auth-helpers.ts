// ============================================================
// Auth Helpers — Shared authentication & authorization utilities
// ============================================================
import { NextRequest } from "next/server";
import {
  isUsingMockData,
  getMockCreatorById,
} from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapCreatorFromDb } from "@/lib/db-mappers";
import type { Creator } from "@/types";

export interface AuthResult {
  isAuthenticated: boolean;
  userId: string | null;
  creator: Creator | null;
}

export interface AdminAuthResult extends AuthResult {
  isAdmin: boolean;
}

/**
 * Verify that the request is from an authenticated user.
 * Works in both mock mode (keevan-auth cookie) and real mode (Supabase auth).
 */
export async function verifyAuth(
  request: NextRequest
): Promise<AuthResult> {
  if (isUsingMockData()) {
    const authCookie = request.cookies.get("keevan-auth");
    if (!authCookie?.value) {
      return { isAuthenticated: false, userId: null, creator: null };
    }

    try {
      const { id } = JSON.parse(authCookie.value);
      const creator = getMockCreatorById(id) ?? null;
      if (!creator) {
        return { isAuthenticated: false, userId: null, creator: null };
      }
      return { isAuthenticated: true, userId: creator.id, creator };
    } catch {
      return { isAuthenticated: false, userId: null, creator: null };
    }
  }

  // Real Supabase auth
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { isAuthenticated: false, userId: null, creator: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAuthenticated: false, userId: null, creator: null };
  }

  // Get creator profile
  const { data: creatorRow } = await supabase
    .from("creators")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!creatorRow) {
    return { isAuthenticated: true, userId: user.id, creator: null };
  }

  const creator = mapCreatorFromDb(creatorRow);
  return { isAuthenticated: true, userId: user.id, creator };
}

/**
 * Verify that the request is from an admin user.
 * Works in both mock mode (keevan-auth cookie) and real mode (Supabase auth).
 */
export async function verifyAdmin(
  request: NextRequest
): Promise<AdminAuthResult> {
  const authResult = await verifyAuth(request);

  if (!authResult.isAuthenticated || !authResult.creator) {
    return { ...authResult, isAdmin: false };
  }

  if (isUsingMockData()) {
    return { ...authResult, isAdmin: authResult.creator.isAdmin };
  }

  // Real Supabase: check is_admin field on creators table
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ...authResult, isAdmin: false };
  }

  const { data: creatorRow } = await supabase
    .from("creators")
    .select("is_admin")
    .eq("id", authResult.userId)
    .single();

  if (!creatorRow) {
    return { ...authResult, isAdmin: false };
  }

  return { ...authResult, isAdmin: Boolean(creatorRow.is_admin) };
}
