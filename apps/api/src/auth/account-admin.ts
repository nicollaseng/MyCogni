export interface AccountAdmin {
  deleteUser(userId: string): Promise<void>
}

export function createSupabaseAccountAdmin(supabaseUrl: string, secretKey: string): AccountAdmin {
  return {
    async deleteUser(userId) {
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { apikey: secretKey },
      })
      if (!response.ok && response.status !== 404) {
        throw new Error(`Supabase refused to delete the account: ${String(response.status)}`)
      }
    },
  }
}
