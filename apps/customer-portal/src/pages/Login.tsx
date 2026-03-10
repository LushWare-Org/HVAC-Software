import { useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/');
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'var(--bg-app)'
        }}>
            <div className="w-full" style={{ maxWidth: '448px' }}>
                <div className="card anim-fade-up" style={{ boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ padding: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: 'var(--t1)' }}>Welcome back</h2>
                        <p style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--t3)' }}>Sign in to access your account</p>
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: 'var(--t2)' }}>Email</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    defaultValue="john.smith@email.com"
                                    style={{
                                        width: '100%',
                                        height: '48px',
                                        paddingLeft: '16px',
                                        paddingRight: '16px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--bd)',
                                        background: 'var(--bg-card)',
                                        color: 'var(--t1)',
                                        fontSize: '14px',
                                        transition: 'all 0.2s',
                                        outline: 'none'
                                    }}
                                    onFocus={e => {
                                        e.target.style.borderColor = 'var(--blue)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.borderColor = 'var(--bd)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: 'var(--t2)' }}>Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    defaultValue="password"
                                    style={{
                                        width: '100%',
                                        height: '48px',
                                        paddingLeft: '16px',
                                        paddingRight: '16px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--bd)',
                                        background: 'var(--bg-card)',
                                        color: 'var(--t1)',
                                        fontSize: '14px',
                                        transition: 'all 0.2s',
                                        outline: 'none'
                                    }}
                                    onFocus={e => {
                                        e.target.style.borderColor = 'var(--blue)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.borderColor = 'var(--bd)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--t3)' }}>
                                    <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                    <span>Remember me</span>
                                </label>
                                <a href="#" style={{ color: 'var(--blue)', fontWeight: '500', textDecoration: 'none', transition: 'opacity 0.2s' }} onMouseOver={e => (e.target as HTMLElement).style.opacity = '0.8'} onMouseOut={e => (e.target as HTMLElement).style.opacity = '1'}>
                                    Forgot password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ height: '48px' }}
                            >
                                Sign In
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
