import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/auth';

const Login = () => {
      const [isLogin, setIsLogin] = useState(true);
      const [credentials, setCredentials] = useState({
            username: '',
            email: '',
            password: ''
      });
      const [error, setError] = useState('');
      const [success, setSuccess] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const navigate = useNavigate();

      const handleChange = (e) => {
            const { name, value } = e.target;
            setCredentials(prev => ({
                  ...prev,
                  [name]: value
            }));
      };

      const handleSubmit = async (e) => {
            e.preventDefault();
            setError('');
            setSuccess('');
            setIsLoading(true);
            try {
                  if (isLogin) {
                        await login(credentials.username, credentials.password);
                        navigate('/');
                  } else {
                        await register(credentials.username, credentials.email, credentials.password);
                        setSuccess('Registration successful! Please login.');
                        setIsLogin(true);
                        setCredentials(prev => ({ ...prev, password: '' }));
                  }
            } catch (err) {
                  console.error('Auth failed:', err);
                  setError(err.response?.data?.message || (isLogin ? 'Invalid credentials' : 'Registration failed'));
            } finally {
                  setIsLoading(false);
            }
      };

      return (
            <div className="page-container flex-center" style={{ minHeight: '100vh', padding: '1rem', background: 'linear-gradient(135deg, #F8FAFC, #E0E7FF)' }}>
                  <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', background: 'white' }}>
                        
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                              <h2 className="heading-1" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>TransitConnect</h2>
                              <p className="text-muted">{isLogin ? 'Welcome back! Please sign in.' : 'Create your account to join.'}</p>
                        </div>

                        {error && <div className="alert-warning" style={{ marginBottom: '1.5rem', borderLeftColor: 'var(--color-error)', color: '#B91C1C', background: '#FEF2F2' }}>{error}</div>}
                        {success && <div className="alert-info" style={{ marginBottom: '1.5rem', borderLeftColor: 'var(--color-success)', color: '#047857', background: '#ECFDF5' }}>{success}</div>}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                              <div>
                                    <label className="label">Username</label>
                                    <input
                                          className="input-field"
                                          type="text"
                                          name="username"
                                          value={credentials.username}
                                          onChange={handleChange}
                                          required
                                          placeholder="Enter your username"
                                    />
                              </div>

                              {!isLogin && (
                                    <div className="animate-fade-in">
                                          <label className="label">Email Address</label>
                                          <input
                                                className="input-field"
                                                type="email"
                                                name="email"
                                                value={credentials.email}
                                                onChange={handleChange}
                                                required
                                                placeholder="you@example.com"
                                          />
                                    </div>
                              )}

                              <div>
                                    <label className="label">Password</label>
                                    <input
                                          className="input-field"
                                          type="password"
                                          name="password"
                                          value={credentials.password}
                                          onChange={handleChange}
                                          required
                                          placeholder="••••••••"
                                    />
                              </div>

                              <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={isLoading}
                                    style={{ marginTop: '0.5rem', width: '100%', opacity: isLoading ? 0.7 : 1 }}
                              >
                                    {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                              </button>
                        </form>

                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                              <p className="text-muted" style={{ margin: 0 }}>
                                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                                    <button
                                          type="button"
                                          onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                                          style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                                    >
                                          {isLogin ? "Sign Up" : "Log In"}
                                    </button>
                              </p>
                        </div>
                  </div>
            </div>
      );
};

export default Login;
