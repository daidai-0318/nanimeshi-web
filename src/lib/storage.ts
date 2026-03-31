// Groq APIキーのみlocalStorageに保存（サーバーには送らない）

export function getApiKey(): string {
  return localStorage.getItem('nanimeshi-api-key') || ''
}

export function setApiKey(key: string) {
  localStorage.setItem('nanimeshi-api-key', key)
}

export function removeApiKey() {
  localStorage.removeItem('nanimeshi-api-key')
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}
