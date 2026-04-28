// src/lib/api.js
const BASE = 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('tbi_token') || ''
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  }
}

export async function getMe() {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (!res.ok) throw new Error('Not authenticated')
  return res.json()
}

export async function checkHealth() {
  const res = await fetch(`${BASE}/health`)
  return res.json()
}

export async function connectDB(databaseUrl) {
  const res = await fetch(`${BASE}/connect`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ database_url: databaseUrl }),
  })
  return res.json()
}

export async function queryBI(question, history = []) {
  const res = await fetch(`${BASE}/query`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ question, history }),
  })
  return res.json()
}

export async function speakText(text) {
  const res = await fetch(`${BASE}/voice/speak`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ text }),
  })
  if (!res.ok) return null
  return res.blob()
}

export async function transcribeAudio(audioBlob) {
  const form = new FormData()
  form.append('file', audioBlob, 'recording.wav')
  const res = await fetch(`${BASE}/voice/transcribe`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  })
  return res.json()
}

export async function uploadCSV(files) {
  const form = new FormData()
  for (const file of files) {
    form.append('files', file)
  }
  const res = await fetch(`${BASE}/upload-csv`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  })
  return res.json()
}