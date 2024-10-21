import { useEffect, useState } from 'react';
import styles from './SignUp.module.css';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../firebase/config';
import { Link, useNavigate } from 'react-router-dom';
import {
	collection,
	doc,
	getDocs,
	query,
	setDoc,
	where,
} from 'firebase/firestore';

interface SignUpValues {
	email: string;
	password: string;
	confirmPassword: string;
	name: string;
	nickname: string;
	phone: string;
}

export default function SignUp() {
	const [signUpValues, setSignUpValues] = useState<SignUpValues>({
		email: '',
		password: '',
		confirmPassword: '',
		name: '',
		nickname: '',
		phone: '',
	});
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [errMsg, setErrMsg] = useState<string>('');
	const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
	const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(
		null
	);
	const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);
	const navigate = useNavigate();

	// 입력 값 받는 함수
	const signUpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setSignUpValues({
			...signUpValues,
			[name]: value,
		});
	};

	// 중복 체크 함수
	const checkEmailAvailability = async () => {
		const q = query(
			collection(db, 'users'),
			where('user_email', '==', signUpValues.email)
		);
		const querySnapshot = await getDocs(q);
		setEmailAvailable(querySnapshot.empty);
	};

	const checkNicknameAvailability = async () => {
		const q = query(
			collection(db, 'users'),
			where('user_nickname', '==', signUpValues.nickname)
		);
		const querySnapshot = await getDocs(q);
		setNicknameAvailable(querySnapshot.empty);
	};

	const checkPhoneAvailability = async () => {
		const q = query(
			collection(db, 'users'),
			where('user_phone_number', '==', signUpValues.phone)
		);
		const querySnapshot = await getDocs(q);
		setPhoneAvailable(querySnapshot.empty);
	};

	// 회원가입 폼 제출 함수
	const signUpFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setErrMsg('');

		if (
			isLoading ||
			signUpValues.email === '' ||
			signUpValues.password === '' ||
			signUpValues.confirmPassword === '' ||
			signUpValues.name === '' ||
			signUpValues.nickname === '' ||
			signUpValues.phone === ''
		) {
			return;
		}

		// 일치, 중복 여부 체크
		if (signUpValues.password !== signUpValues.confirmPassword) {
			setErrMsg('비밀번호가 일치하지 않습니다.');
			return;
		}

		if (!emailAvailable) {
			setErrMsg('이미 사용 중인 이메일입니다.');
			return;
		}

		if (!nicknameAvailable) {
			setErrMsg('이미 사용 중인 닉네임입니다.');
			return;
		}

		if (!phoneAvailable) {
			setErrMsg('이미 사용 중인 번호입니다.');
			return;
		}

		try {
			setIsLoading(true);
			// Firebase에서 사용자 계정 생성
			const userCreate = await createUserWithEmailAndPassword(
				auth,
				signUpValues.email,
				signUpValues.password
			);

			// Firestore에 사용자 정보 저장하기
			const userDocRef = doc(db, 'users', userCreate.user.uid);
			await setDoc(userDocRef, {
				recipes_total: 0,
				user_email: signUpValues.email,
				user_info: '',
				user_name: signUpValues.name,
				user_nickname: signUpValues.nickname,
				user_phone_number: signUpValues.phone,
				provider: 'normal',
			});

			alert('회원가입이 되었습니다.');

			navigate('/login');
		} catch (e) {
			if (e instanceof FirebaseError) {
				setErrMsg(e.message);
			}
		} finally {
			setIsLoading(false); // 로딩 상태 해제
		}
	};

	// url에 따른 스타일링
	useEffect(() => {
		const currentUrl = window.location.href;

		if (currentUrl.includes('/signup')) {
			document.body.style.backgroundColor = '#fff9e9';
		}

		return () => {
			document.body.style.backgroundColor = '';
		};
	}, []);

	return (
		<div className={styles.container}>
			<div className={styles.logo}>
				<Link to={'/'}>
					<img src="/assets/icon_logo.png" alt="" />
				</Link>
			</div>
			<form onSubmit={signUpFormSubmit}>
				<input
					type="email"
					name="email"
					value={signUpValues.email}
					onChange={signUpInputChange}
					onBlur={checkEmailAvailability}
					placeholder="이메일 형식으로 입력해 주세요."
					required
					className={styles.input}
				/>
				{emailAvailable === false && <div>{errMsg}</div>}
				<input
					type="password"
					name="password"
					value={signUpValues.password}
					onChange={signUpInputChange}
					placeholder="비밀번호 6자리 이상 입력해 주세요."
					required
					className={styles.input}
				/>
				<input
					type="password"
					name="confirmPassword"
					value={signUpValues.confirmPassword}
					onChange={signUpInputChange}
					placeholder="비밀번호 확인"
					required
					className={styles.input}
				/>
				<input
					type="text"
					name="name"
					value={signUpValues.name}
					onChange={signUpInputChange}
					placeholder="이름을 입력해 주세요."
					required
					className={styles.input}
				/>
				<input
					type="text"
					name="nickname"
					value={signUpValues.nickname}
					onChange={signUpInputChange}
					onBlur={checkNicknameAvailability}
					placeholder="닉네임을 입력해 주세요."
					required
					className={styles.input}
				/>
				{nicknameAvailable === false && <div>{errMsg}</div>}
				<input
					type="tel"
					name="phone"
					value={signUpValues.phone}
					onChange={signUpInputChange}
					onBlur={checkPhoneAvailability}
					placeholder="연락처를 입력해 주세요."
					required
					className={styles.input}
				/>
				{phoneAvailable === false && <div>{errMsg}</div>}
				{errMsg && <div>{errMsg}</div>}
				<button type="submit" disabled={isLoading} className={styles.signupBtn}>
					회원가입
				</button>
			</form>
			<div className={styles.pageLogin}>
				<Link to={'/login'}>로그인하기</Link>
			</div>
		</div>
	);
}
