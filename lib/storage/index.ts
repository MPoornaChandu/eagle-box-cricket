"use client";

import { getDataSourceStatus, getStorageMode as readStorageMode } from "../supabase/client";

export * from "./localStore";
export {
  addActivityLog as addSupabaseActivityLog,
  createFixture as createSupabaseFixture,
  createReport as createSupabaseReport,
  createTeam as createSupabaseTeam,
  deleteFixture as deleteSupabaseFixture,
  deleteTeam as deleteSupabaseTeam,
  getActivityLogs as getSupabaseActivityLogs,
  getFixtures as getSupabaseFixtures,
  getMatchResults as getSupabaseMatchResults,
  getReports as getSupabaseReports,
  getTeams as getSupabaseTeams,
  saveMatchResult as saveSupabaseMatchResult,
  updateFixture as updateSupabaseFixture,
  updateTeam as updateSupabaseTeam
} from "./supabaseStore";

export function getStorageMode() {
  return readStorageMode();
}

export { getDataSourceStatus };
