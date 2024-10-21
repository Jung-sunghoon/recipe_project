import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import errorIcon from '/assets/icon_error.png';
import { useAuth } from '../../../context/AuthContext';
import { usePageStyle } from '../../../hooks/usePageStyle'; // 커스텀 훅 import

const Login = () => {
	usePageStyle(); // 커스텀 훅 사용

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loginError, setLoginError] = useState('');
	const { login, googleLogin } = useAuth();
	const navigate = useNavigate();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoginError('');

		if (!email || !password) {
			setLoginError('아이디 또는 비밀번호를 입력해주세요');
			return;
		}

		try {
			await login(email, password);
			navigate('/');
		} catch (error: any) {
			console.error('로그인 실패:', error.message);
			setLoginError('아이디 또는 비밀번호가 올바르지 않습니다');
		}
	};

	const handleGoogleLogin = async () => {
		try {
			await googleLogin();
			navigate('/');
		} catch (error: any) {
			console.error('구글 로그인 실패:', error.message);
			setLoginError('구글 로그인에 실패했습니다. 다시 시도해주세요.');
		}
	};

	// url에 따른 스타일링
	useEffect(() => {
		const currentUrl = window.location.href;

		if (currentUrl.includes('/login')) {
			document.body.style.backgroundColor = '#fff9e9';
		}

		return () => {
			document.body.style.backgroundColor = '';
		};
	}, []);

	return (
		<div className={styles.pageContainer}>
			<div className={styles.loginContainer}>
				<div className={styles.loginBox}>
					<h1 className={styles.title}>
						<Link to="/">
							<img src="/assets/icon_logo.png" alt="홈으로 가기" />
						</Link>
					</h1>
					<form onSubmit={handleLogin}>
						<input
							type="email"
							placeholder="이메일을 입력해주세요"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className={`${styles.input} ${email ? styles.inputWithContent : ''}`}
						/>
						<input
							type="password"
							placeholder="비밀번호를 입력해주세요"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className={`${styles.input} ${password ? styles.inputWithContent : ''}`}
						/>
						{loginError && (
							<p className={styles.error}>
								<img src={errorIcon} alt="Error" className={styles.errorIcon} />
								{loginError}
							</p>
						)}
						<button
							type="button"
							onClick={handleGoogleLogin}
							className={styles.googleButton}
						>
							<img src="/assets/icon_google.png" alt="Google" /> 구글로
							로그인하기
						</button>
						<button type="submit" className={styles.loginButton}>
							로그인하기
						</button>
					</form>
					<div className={styles.links}>
						<Link to="/forgot-password">이메일 찾기</Link> <span>|</span>{' '}
						<Link to="/forgot-password">비밀번호 찾기</Link>
					</div>
					<p className={styles.signup}>
						아직 회원이 아니신가요? <Link to="/signup">회원가입</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default Login;
