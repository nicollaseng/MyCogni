export async function forgetMemory(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/me/memories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      keepalive: true,
    })
    return response.ok
  } catch {
    return false
  }
}
