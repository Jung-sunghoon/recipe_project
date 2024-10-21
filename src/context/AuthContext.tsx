import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import {
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
	GoogleAuthProvider,
	User,
} from 'firebase/auth';
import {
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	setDoc,
	where,
} from 'firebase/firestore';

// 로그인 상태와 관련된 context 값의 타입 정의
interface AuthContextProps {
	user: User | null;
	nickname: string | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	googleLogin: () => Promise<void>;
	logout: () => Promise<void>;
}

// AuthContext 생성
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Context 사용을 위한 커스텀 훅
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.');
	}
	return context;
};

// AuthProvider 컴포넌트
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [nickname, setNickname] = useState<string | null>(null); // 닉네임 상태 추가
	const [loading, setLoading] = useState(true);
	// 소셜 로그인 닉네임 중복 체크 스테이트
	const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(
		null
	);

	// Firebase Auth 상태를 확인하고 로그인 여부 관리
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			setUser(currentUser);
			setLoading(false);

			// 유저가 로그인된 경우 Firestore에서 닉네임을 가져옴
			if (currentUser) {
				try {
					const fetchedNickname = await getUserNicknameByEmail(
						currentUser.email!
					);
					// 변경 사항
					// const fetchedNickname = await getUserInfo(currentUser.uid);

					setNickname(fetchedNickname); // 닉네임 설정
				} catch (error) {
					console.error('닉네임을 가져오는데 실패했습니다:', error);
				}
			} else {
				setNickname(null); // 로그아웃된 경우 닉네임 초기화
			}
		});

		return () => unsubscribe();
	}, []);

	// 이메일/비밀번호 로그인 함수
	const login = async (email: string, password: string) => {
		setLoading(true);
		try {
			await signInWithEmailAndPassword(auth, email, password);
		} catch (error) {
			console.error('로그인 실패:', error);
			throw error; // 로그인 컴포넌트에서 처리할 수 있도록 예외를 던짐
		} finally {
			setLoading(false);
		}
	};

	// 구글 로그인 함수
	const googleLogin = async () => {
		const provider = new GoogleAuthProvider();
		setLoading(true);
		try {
			const result = await signInWithPopup(auth, provider);
			const user = result.user;
			const userDocRef = doc(db, 'users', user.uid);
			const q = query(
				collection(db, 'users'),
				where('user_nickname', '==', user.displayName)
			);
			const querySnapshot = await getDocs(q);
			setNicknameAvailable(querySnapshot.empty);
			// ture : 중복되지 않음
			// false : 중복됨

			// 기존에 컬렉션에 추가되지 않았던 문제를 파이어베이스 users 컬렉션에 추가하는 코드입니다.
			// 구글 유저의 닉네임이 기존 회원의 닉네임과 같다면 닉네임 앞에 "google_" 텍스트를 추가합니다.
			await setDoc(
				userDocRef,
				{
					recipes_total: 0,
					user_email: user.email,
					user_info: '',
					user_name: '',
					user_nickname: nicknameAvailable
						? 'google_' + user.displayName
						: user.displayName,
					user_phone_number: user.phoneNumber ?? '',
					provider: 'google',
				},
				{
					merge: true,
				}
			);
		} catch (error) {
			console.error('구글 로그인 실패:', error);
			throw error; // 로그인 컴포넌트에서 처리할 수 있도록 예외를 던짐
		} finally {
			setLoading(false);
		}
	};

	// 로그아웃 함수
	const logout = async () => {
		try {
			await signOut(auth);
		} catch (error) {
			console.error('로그아웃 실패:', error);
		}
	};

	// 이메일로 유저 닉네임을 조회하는 함수
	const getUserNicknameByEmail = async (email: string) => {
		try {
			const userCollectionRef = collection(db, 'users'); // 'users'는 Firestore의 컬렉션 이름
			const q = query(userCollectionRef, where('user_email', '==', email)); // email 필드로 쿼리
			const querySnapshot = await getDocs(q);

			if (!querySnapshot.empty) {
				const userDoc = querySnapshot.docs[0]; // 첫 번째 일치하는 도큐먼트
				const userData = userDoc.data();
				return userData.user_nickname; // 닉네임 반환
			} else {
				throw new Error('일치하는 유저가 없습니다.');
			}
		} catch (error) {
			console.error('Firestore에서 닉네임 조회 실패:', error);
			throw error;
		}
	};

	// 유저의 정보를 이메일이 아닌 uid로 조회해서 닉네임을 찾는 코드입니다.
	const getUserInfo = async (uid: string) => {
		try {
			const userDocRef = doc(db, 'users', uid);
			const userDoc = await getDoc(userDocRef);

			if (userDoc.exists()) {
				return userDoc.data().user_nickname;
			} else {
				throw new Error('일치하는 유저가 없습니다.');
			}
		} catch (error) {
			console.error('Firestore에서 닉네임 조회 실패:', error);
			throw error;
		}
	};

	return (
		<AuthContext.Provider
			value={{ user, nickname, loading, login, googleLogin, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
};
