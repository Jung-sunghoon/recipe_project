import {
	doc,
	collection,
	addDoc,
	deleteDoc,
	query,
	where,
	getDocs,
	updateDoc,
	increment,
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import heartEmpty from '/assets/icon_like_heart_empty.svg';
import heartPull from '/assets/icon_like_heart_pull.svg';
import { useAuth } from '../../../context/AuthContext';
import styled from './LikeButton.module.css';
import { useState, useEffect } from 'react';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const LikeButton = ({ recipeId }: { recipeId: string }) => {
	const user = useAuth();
	const [isHearted, setIsHearted] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [isFadingOut, setIsFadingOut] = useState(false);

	// 이미 좋아요를 눌렀는지 확인
	const checkIfHearted = async () => {
		if (user && user.user) {
			const heartedCollectionRef = collection(
				db,
				'recipes',
				recipeId,
				'hearted'
			);
			const heartedQuery = query(
				heartedCollectionRef,
				where('uid', '==', user.user!.uid)
			);
			const heartedDocs = await getDocs(heartedQuery);

			return !heartedDocs.empty;
		}
		return false;
	};

	// 페이지 로드 시 좋아요 상태 확인
	useEffect(() => {
		const fetchHeartedStatus = async () => {
			const hearted = await checkIfHearted();
			setIsHearted(hearted);
		};

		fetchHeartedStatus();
	}, [user, recipeId]);

	const toggleLike = async () => {
		if (user.user === null) {
			alert('로그인이 필요합니다.');
			return;
		}

		const recipeDocRef = doc(db, 'recipes', recipeId);
		const hearted = await checkIfHearted();

		if (!hearted && user.user) {
			// 좋아요 추가
			const heartedCollectionRef = collection(
				db,
				'recipes',
				recipeId,
				'hearted'
			);
			await addDoc(heartedCollectionRef, {
				email: user.user.email,
				uid: user.user.uid,
				nickname: user.nickname,
			});

			await updateDoc(recipeDocRef, { hearts: increment(1) });

			openModal();
			setIsHearted(true);
		} else {
			// 좋아요 취소 (해당 문서 삭제)
			const heartedCollectionRef = collection(
				db,
				'recipes',
				recipeId,
				'hearted'
			);
			const heartedQuery = query(
				heartedCollectionRef,
				where('uid', '==', user.user!.uid)
			);
			const heartedDocs = await getDocs(heartedQuery);
			const heartedDocId = heartedDocs.docs[0].id;

			const heartedDocRef = doc(
				db,
				'recipes',
				recipeId,
				'hearted',
				heartedDocId
			);
			await deleteDoc(heartedDocRef);
			await updateDoc(recipeDocRef, { hearts: increment(-1) });

			openModal();
			setIsHearted(false);
		}
	};

	const openModal = () => {
		setIsOpen(true);
		setIsFadingOut(false);
		setTimeout(() => {
			setIsFadingOut(true);
		}, 1000);
		setTimeout(() => {
			setIsOpen(false);
		}, 2000);
	};

	return (
		<>
			<aside className={styled.stickyHeartIcon} onClick={toggleLike}>
				<img src={isHearted ? heartPull : heartEmpty} alt="좋아요 아이콘" />{' '}
			</aside>

			<Modal
				isOpen={isOpen}
				style={{
					content: {
						transition: 'opacity 1s',
						opacity: isFadingOut ? 0 : 1,
						backgroundColor: 'white',
						padding: '10px 20px',
						borderRadius: '10px',
						textAlign: 'center',
						position: 'absolute',
						top: '50%',
						bottom: '42%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						width: 'auto',
						height: 'auto',
						border: '1px solid #ccc',
					},
					overlay: {
						backgroundColor: 'transparent',
					},
				}}
			>
				{isHearted ? (
					<p className={styled.insideModal}>
						<span className={styled.heart}>♥</span> 좋아요를 눌렀습니다!{' '}
						<span className={styled.heart}>♥</span>
					</p>
				) : (
					<p className={styled.insideModal}>
						<span className={styled.heartOff}>♥</span> 좋아요를 취소했습니다!{' '}
						<span className={styled.heartOff}>♥</span>
					</p>
				)}
			</Modal>
		</>
	);
};

export default LikeButton;
