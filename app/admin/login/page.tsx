'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()

  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      if (!response.ok) {
        setError('Неверный логин или пароль')
        return
      }

      router.replace('/admin')
      router.refresh()
    } catch {
      setError('Не удалось выполнить вход')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <span className="admin-login-mark">a</span>
          <span>ailat.</span>
        </div>

        <div className="admin-login-heading">
          <span>ADMIN PANEL</span>
          <h1>Вход</h1>
          <p>Введите данные администратора Ailat Finance.</p>
        </div>

        <form onSubmit={submit}>
          <label className="admin-login-field">
            <span>Логин</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="admin-login-field">
            <span>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error ? (
            <div className="admin-login-error">
              {error}
            </div>
          ) : null}

          <button
            className="admin-login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <a className="admin-login-back" href="/">
          ← Вернуться на сайт
        </a>
      </div>
    </main>
  )
}