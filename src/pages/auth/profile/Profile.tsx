import { useEffect, useState } from 'react';
import styles from './Profile.module.css';
import { auth, db } from '../../../firebase/config';
import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	updateDoc,
	where,
	writeBatch,
} from 'firebase/firestore';
import Spoon from './spoon/Spoon';
import {
	deleteUser,
	EmailAuthProvider,
	reauthenticateWithCredential,
	signOut,
	updatePassword,
} from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { Pagination } from 'antd';
import { FirebaseError } from 'firebase/app';

interface Badge {
	image: string;
	name: string;
	count: number;
}

// 사용자 게시글 수에 따라 배지 제공하기 위한 데이터
const badgeData: Badge[] = [
	{ image: '/assets/member_step1.svg', name: '스푼 Spoon', count: 0 },
	{ image: '/assets/member_step2.svg', name: '포크 Fork', count: 10 },
	{ image: '/assets/member_step3.svg', name: '챕스 Chopsticks', count: 20 },
	{ image: '/assets/member_step4.svg', name: '터너 Turner', count: 30 },
	{ image: '/assets/member_step5.svg', name: '나이프 Knife', count: 40 },
];

export default function Profile() {
	const [userEmail, setUserEmail] = useState<string | null>(null);
	const [userName, setUserName] = useState<string | null>(null);
	const [userNickname, setUserNickname] = useState<string>('');
	const [userPhoneNumber, setUserPhoneNumber] = useState<string | null>(null);
	const [userRecipes, setUserRecipes] = useState<any[]>([]);
	const [spoonModalOpen, setSpoonModalOpen] = useState<boolean>(false);
	const [showEditInfo, setShowEditInfo] = useState<boolean>(false);
	const [userIntroduction, setUserIntroduction] = useState<string | null>('');
	const [editIntroduction, setEditIntroduction] = useState<boolean>(false);
	const [showEditPassword, setShowEditPassword] = useState<boolean>(false);
	const [nowPassword, setNowPassword] = useState<string>('');
	const [newPassword, setNewPassword] = useState<string>('');
	const [confirmPassword, setConfirmPassword] = useState<string>('');
	const [newNickname, setNewNickname] = useState('');
	const [showUserPosts, setShowUserPosts] = useState<boolean>(false);
	const [showUserFavorite, setShowUserFavorite] = useState<boolean>(false);
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 4;
	const filteredCount = userRecipes.length;
	const currentRecipes = userRecipes.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize
	);

	const [currentFavoritePage, setCurrentFavoritePage] = useState(1);
	const [likedRecipes, setLikedRecipes] = useState<any[]>([]);
	const likeCount = likedRecipes.length;
	const heartedRecipes = likedRecipes.slice(
		(currentFavoritePage - 1) * pageSize,
		currentFavoritePage * pageSize
	);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchUserData = async () => {
			const user = auth.currentUser;

			if (user) {
				// Firestore에서 사용자 닉네임 가져오기
				const userDocRef = doc(db, 'users', user.uid);
				const userDocSnap = await getDoc(userDocRef);

				if (userDocSnap.exists()) {
					setUserEmail(userDocSnap.data().user_email);
					setUserName(userDocSnap.data().user_name);
					setUserNickname(userDocSnap.data().user_nickname);
					setUserPhoneNumber(userDocSnap.data().user_phone_number);
					setUserIntroduction(userDocSnap.data().user_info);

					// Firestore에서 사용자가 작성한 게시물 가져오기

					/*
                    -2024-10-22
                    -author : hye's
                    
                    -현재 닉네임변경시에 레시피에 등록되어있는 author.user_nickname도 바뀌는게 아니기떄문에  user_uid로 게시물을 찾도록변경
                    
                    -현재 정보수정에 닉네임이 변경될경우 기존 레시피's에있는 닉네임도 변경을 해주어야함

                    -이기능을 위해서 현재 레시피 등록함수에 author객체안에 user_uid : user.uid 코드추가
                    
                    */
					const recipesCollectionRef = collection(db, 'recipes');
					const q = query(
						recipesCollectionRef,
						where('author.user_uid', '==', user.uid)
					);
					const recipesSnapshot = await getDocs(q);
					const recipesData = recipesSnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					}));

					setUserRecipes(recipesData);

					// 사용자가 좋아요를 누른 게시물 쿼리
					const likedRecipesData = [];

					// 각 레시피 문서에 대해 hearted 하위 컬렉션 쿼리
					const allRecipesSnapshot = await getDocs(recipesCollectionRef);
					for (const recipeDoc of allRecipesSnapshot.docs) {
						const heartedCollectionRef = collection(recipeDoc.ref, 'hearted'); // 각 레시피 문서의 hearted 하위 컬렉션
						const likedQuery = query(
							heartedCollectionRef,
							where('uid', '==', user.uid)
						); // 사용자 ID로 쿼리
						const likedSnapshot = await getDocs(likedQuery);

						if (!likedSnapshot.empty) {
							likedRecipesData.push({
								id: recipeDoc.id,
								...recipeDoc.data(),
							});
						}
					}

					setLikedRecipes(likedRecipesData);
				} else {
					setUserNickname('Unknown User');
				}
			} else {
				setUserNickname('Unknown User');
			}
		};
		setNewNickname(userNickname);
		fetchUserData();
	}, [showEditInfo]);

	// 게시글 수를 기준으로 현재 배지를 반환하는 함수
	const getCurrentBadge = (postsCount: number): Badge => {
		return (
			badgeData
				.slice()
				.reverse()
				.find((badgeData) => postsCount >= badgeData.count) || badgeData[0]
		);
	};

	// 현재 사용자의 게시물 수에 따라 배지 계산
	const currentBadge = getCurrentBadge(userRecipes.length);

	// 정보수정 업데이트 부분
	const userInfoUpdate = async () => {
		const user = auth.currentUser;
		if (user) {
			const userDocRef = doc(db, 'users', user.uid);

			try {
				await updateDoc(userDocRef, {
					user_name: userName,
					user_nickname: newNickname,
					user_phone_number: userPhoneNumber,
				});
				alert('사용자 정보가 업데이트되었습니다.');
				/*
                -2024-10-22
                -author : hye's
                -현재 사용자가 닉네임을 바꾸었다면 그에 해당하는 uid로 레시피's를 찾아서 작성자의 이름도 변경되도록함
                -batch > 여러문서를 한번에 묶어서 실행함
                */

				const recipesQuery = query(
					collection(db, 'recipes'),
					where('author.user_uid', '==', user.uid)
				);
				const querySnapshot = await getDocs(recipesQuery);

				const batch = writeBatch(db);
				querySnapshot.forEach((docSnapshot) => {
					batch.update(docSnapshot.ref, {
						'author.user_nickname': newNickname,
					});
				});

				await batch.commit();

				setUserNickname(newNickname);
				setShowEditInfo(false);
			} catch (error) {
				console.error('사용자 정보 업데이트 오류:', error);
			}
		}
	};

	// 자기소개 업데이트 부분
	const userIntroductionUpdate = async () => {
		if (auth.currentUser) {
			const userDocRef = doc(db, 'users', auth.currentUser.uid);

			try {
				await updateDoc(userDocRef, {
					user_info: userIntroduction,
				});
				setEditIntroduction(false);
			} catch (error) {
				console.error('사용자 소개 업데이트 오류:', error);
			}
		}
	};

	// 비밀번호 변경 부분
	const userPasswordChange = async () => {
		const user = auth.currentUser;

		if (!user) {
			alert('사용자가 로그인되어 있지 않습니다. 다시 로그인 후 시도해주세요.');
			return;
		}
		if (newPassword !== confirmPassword) {
			alert('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
			return;
		}

		try {
			const credential = EmailAuthProvider.credential(
				user?.email!,
				nowPassword
			);
			await reauthenticateWithCredential(user, credential); // 현재 비밀번호 확인

			await updatePassword(user, newPassword); // 새 비밀번호 설정
			setNowPassword('');
			setNewPassword('');
			setConfirmPassword('');
			setShowEditPassword(false);

			alert('비밀번호가 변경되었습니다.');

			// 비밀번호 변경 후 로그아웃 및 페이지 이동
			await signOut(auth); // 로그아웃을 기다림
			alert('비밀번호가 변경되어 로그아웃되었습니다. 다시 로그인해주세요.');

			// 로그아웃이 완료된 후에 페이지 이동
			navigate('/login');
		} catch (error: any) {
			if (error.code === 'auth/wrong-password') {
				alert('현재 비밀번호가 잘못되었습니다. 다시 입력해주세요.');
			} else {
				console.error('비밀번호 변경 오류:', error);
				alert('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
			}
		}
	};

	// 회원탈퇴 함수
	const handleDeleteAccount = async () => {
		const user = auth.currentUser;

		if (user) {
			const confirmDelete = window.confirm(
				'정말로 계정과 데이터를 삭제하시겠습니까?'
			);

			if (confirmDelete) {
				try {
					// Firestore에서 사용자의 데이터 삭제
					const userDocRef = doc(db, 'users', user.uid);
					await deleteDoc(userDocRef);

					// Firebase Auth에서 사용자 삭제
					await deleteUser(user);

					alert('계정과 데이터가 성공적으로 삭제되었습니다.');
				} catch (error) {
					console.error('계정 삭제 오류:', error);

					if (error instanceof FirebaseError) {
						// FirebaseError 인스턴스인지 확인
						if (error.code === 'auth/requires-recent-login') {
							alert(
								'최근 로그인 정보가 필요합니다. 다시 로그인 후 시도해 주세요.'
							);
						} else {
							alert('계정 삭제 중 오류가 발생했습니다: ' + error.message);
						}
					} else {
						alert('알 수 없는 오류가 발생했습니다.');
					}
				}
			}
		}
	};

	return (
		<main className={styles.container}>
			<div className={styles.wrapper}>
				<div className={styles.logo}>
					{showEditInfo ? (
						<>
							<span className={styles.logoText}>My Info</span>
							<h1>정보수정</h1>
						</>
					) : showEditPassword ? (
						<>
							<span className={styles.logoText}>My Info</span>
							<h1>비밀번호 변경</h1>
						</>
					) : showUserPosts ? (
						<>
							<span className={styles.logoText}>My Recipe</span>
							<h1>등록한 레시피</h1>
						</>
					) : showUserFavorite ? (
						<>
							<span className={styles.logoText}>My Favorite Recipe</span>
							<h1>좋아요 누른 레시피</h1>
						</>
					) : (
						<>
							<Link to={'/'}>
								<img
									src="/assets/icon_back.png"
									alt="홈으로 이동하는 아이콘"
									className={styles.backIcon}
								/>
							</Link>
							<span className={styles.logoText}>My Page</span>
							<h1>마이페이지</h1>
						</>
					)}
				</div>
				<div className={styles.profileBox}>
					<section className={styles.profile}>
						<div className={styles.user}>
							<img src="/assets/icon_profileImg.png" alt="" />
							<h2>
								{userNickname}
								<img src="/assets/icon_nicknameImg.png" alt="" />
							</h2>
							{editIntroduction ? (
								<div className={styles.userEditIntroduction}>
									<input
										type="text"
										value={userIntroduction || ''}
										onChange={(e) => setUserIntroduction(e.target.value)}
									/>
									<button onClick={userIntroductionUpdate}>저장</button>
									<button onClick={() => setEditIntroduction(false)}>
										취소
									</button>
								</div>
							) : (
								<span onClick={() => setEditIntroduction(true)}>
									{userIntroduction
										? userIntroduction
										: '자기소개를 작성해주세요.'}
									<img src="/assets/icon_infoImg.png" alt="" />
								</span>
							)}
						</div>
						<div className={styles.userPostsContainer}>
							<div className={styles.userPost}>
								<div>
									<img src="/assets/icon_posts.png" alt="" />
								</div>
								<span>등록된 게시물</span>
								<h3>{userRecipes.length}</h3>
							</div>
							<div className={styles.userDivider}></div>
							<div className={styles.userClass}>
								<div onClick={() => setSpoonModalOpen(true)}>
									<img src={currentBadge.image} alt={currentBadge.name} />
								</div>
								<span>뱃지 등급</span>
								<h3>{currentBadge.name}</h3>
							</div>
						</div>
					</section>
					<div className={styles.sectionDivider}></div>
					{!showEditInfo &&
					!showEditPassword &&
					!showUserPosts &&
					!showUserFavorite ? (
						// 기본 화면: 회원 정보 및 버튼들
						<section className={styles.userInformation}>
							<div className={styles.userRecipe}>
								<span>레시피 | Recipe</span>
								<div>
									<button onClick={() => setShowUserPosts(true)}>
										등록한 레시피
										<img src="/assets/icon_profileButton.png" alt="" />
									</button>
									<button onClick={() => setShowUserFavorite(true)}>
										좋아요 누른 레시피
										<img src="/assets/icon_profileButton.png" alt="" />
									</button>
								</div>
							</div>
							<div className={styles.userInfo}>
								<span>회원정보 | User Info</span>
								<div>
									<button onClick={() => setShowEditInfo(true)}>
										정보수정
										<img src="/assets/icon_profileButton.png" alt="" />
									</button>
									<button onClick={() => setShowEditPassword(true)}>
										비밀번호 변경
										<img src="/assets/icon_profileButton.png" alt="" />
									</button>
									<button onClick={handleDeleteAccount}>
										회원탈퇴
										<img src="/assets/icon_profileButton.png" alt="" />
									</button>
								</div>
							</div>
						</section>
					) : null}
					{showEditInfo &&
					!showEditPassword &&
					!showUserPosts &&
					!showUserFavorite ? (
						// 정보 수정 화면
						<section className={styles.userEditInfo}>
							<div
								className={styles.editBack}
								onClick={() => setShowEditInfo(false)}
							>
								<img src="/assets/icon_infoback.png" alt="" />
								<span>뒤로가기</span>
							</div>
							<div className={styles.editInput}>
								<span>이메일</span>
								<input
									type="email"
									className={styles.editReadOnly}
									readOnly
									value={userEmail || ''}
								/>
							</div>
							<div className={styles.editInput}>
								<span>이름</span>
								<input
									type="text"
									className={styles.editReadOnly}
									value={userName || ''}
									readOnly
								/>
							</div>
							<div className={styles.editInput}>
								<span>닉네임</span>
								<input
									type="text"
									value={newNickname || ''}
									onChange={(e) => setNewNickname(e.target.value)}
								/>
							</div>
							<div className={styles.editInput}>
								<span>연락처</span>
								<input
									type="tel"
									value={userPhoneNumber || ''}
									onChange={(e) => setUserPhoneNumber(e.target.value)}
								/>
							</div>
							<div className={styles.editBtn}>
								<button onClick={userInfoUpdate}>수정완료</button>
								<p>회원탈퇴</p>
							</div>
						</section>
					) : null}
					{!showEditInfo &&
					showEditPassword &&
					!showUserPosts &&
					!showUserFavorite ? (
						// 비밀번호 변경 화면
						<section className={styles.userEditInfo}>
							<div
								className={styles.editBack}
								onClick={() => setShowEditPassword(false)}
							>
								<img src="/assets/icon_infoback.png" alt="" />
								<span>뒤로가기</span>
							</div>
							<div className={styles.editInput}>
								<span>현재 비밀번호</span>
								<input
									type="password"
									value={nowPassword}
									onChange={(e) => setNowPassword(e.target.value)}
								/>
							</div>
							<div className={styles.editInput}>
								<span>새 비밀번호</span>
								<input
									type="password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
								/>
							</div>
							<div className={styles.editInput}>
								<span>새 비밀번호 확인</span>
								<input
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
								/>
							</div>
							<div className={styles.editPwBtn}>
								<button onClick={userPasswordChange}>비밀번호 변경하기</button>
							</div>
						</section>
					) : null}
					{!showEditInfo &&
					!showEditPassword &&
					showUserPosts &&
					!showUserFavorite ? (
						// 등록한 레시피 화면
						<section className={styles.userEditInfo}>
							<div
								className={styles.editBack}
								onClick={() => setShowUserPosts(false)}
							>
								<img src="/assets/icon_infoback.png" alt="" />
								<span>뒤로가기</span>
							</div>
							<div className={styles.post}>
								<span>제목</span>
								<span>작성일</span>
								<span>좋아요</span>
								<span>조회수</span>
							</div>
							<div>
								{currentRecipes.map((recipe) => (
									<Link to={`/recipedetail/${recipe.id}`} key={recipe.id}>
										<div className={styles.recipePost}>
											<span>{recipe.recipe_name}</span>
											<span>
												{new Date(
													recipe.recipe_create_time?.seconds * 1000
												).toLocaleDateString()}
											</span>
											<span>{recipe.hearts || 0}</span>
											<span>{recipe.views || 0}</span>
											<img src="/assets/icon_profileButton.png" alt="" />
										</div>
									</Link>
								))}
							</div>
							<Pagination
								className={styles.pagination}
								current={currentPage}
								pageSize={pageSize}
								total={filteredCount}
								onChange={(page) => setCurrentPage(page)}
							/>
						</section>
					) : null}
					{!showEditInfo &&
					!showEditPassword &&
					!showUserPosts &&
					showUserFavorite ? (
						// 좋아요 누른 레시피 화면
						<section className={styles.userEditInfo}>
							<div
								className={styles.editBack}
								onClick={() => setShowUserFavorite(false)}
							>
								<img src="/assets/icon_infoback.png" alt="" />
								<span>뒤로가기</span>
							</div>
							<div>
								{heartedRecipes.map((recipe) => (
									<Link to={`/recipedetail/${recipe.id}`} key={recipe.id}>
										<div className={styles.recipePost}>
											<span>{recipe.recipe_name}</span>
											<span>
												{new Date(
													recipe.recipe_create_time?.seconds * 1000
												).toLocaleDateString()}
											</span>
											<span>{recipe.hearts || 0}</span>
											<span>{recipe.views || 0}</span>
											<img src="/assets/icon_profileButton.png" alt="" />
										</div>
									</Link>
								))}
							</div>
							<Pagination
								className={styles.pagination}
								current={currentFavoritePage}
								pageSize={pageSize}
								total={likeCount}
								onChange={(page) => setCurrentFavoritePage(page)}
							/>
						</section>
					) : null}
				</div>
			</div>
			{spoonModalOpen && <Spoon onClose={() => setSpoonModalOpen(false)} />}
		</main>
	);
}
