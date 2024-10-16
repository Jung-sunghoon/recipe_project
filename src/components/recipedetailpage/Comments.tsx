import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import {
	collection,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	DocumentData,
	Timestamp,
} from 'firebase/firestore';
import CustomButton, { ButtonType } from '../custombutton/CustomButton';
import styled from '../../pages/recipedetail/RecipeDetail.module.css';
// import { getAuth } from 'firebase/auth';

const mokuser = {
	user_nickname: 'test_nickname',
	user_id: 'CA06FVCAxSNsOMXkwhgP',
};

interface CommentsProps {
	recipeId: string;
}

const Comments: React.FC<CommentsProps> = ({ recipeId }) => {
	const [comments, setComments] = useState<DocumentData[]>([]);
	const [newComment, setNewComment] = useState<string>('');

	// 현재 수정중인 상태를 관리 - 초기 값은 수정중이 아니기 때문에 null을 넣어줌
	// 수정할때 필드를 생성해주기 위한 상태 관리
	const [editingCommentId, setEditngCommentId] = useState<string | null>(null);
	const [editedComment, setEditedComment] = useState<string>('');

	// const auth = getAuth();
	// const currentUser = auth.currentUser;

	// 댓글 불러오기
	const getComments = async () => {
		const commentsCollection = collection(db, 'recipes', recipeId, 'comment');
		const commentSnapshot = await getDocs(commentsCollection);
		const commentList = commentSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));
		setComments(commentList);
	};

	useEffect(() => {
		getComments();
	}, []);

	// 댓글 작성일 변환
	const formatDate = (timestamp: Timestamp) => {
		const date = timestamp.toDate();
		return date.toLocaleString();
	};

	// 댓글 수정하기
	const updateComment = async (id: string) => {
		const commnetDoc = doc(db, 'recipes', recipeId, 'comment', id);
		await updateDoc(commnetDoc, {
			comment_description: editedComment,
			comment_update_time: new Date(),
			isEdited: true,
		});
		setEditngCommentId(null);
		getComments();
	};

	// 댓글 삭제하기
	const deleteComment = async (id: string) => {
		const commentDoc = doc(db, 'recipes', recipeId, 'comment', id);
		await deleteDoc(commentDoc);
		getComments();
	};

	// 댓글 등록하기
	const addComment = async () => {
		if (newComment.trim()) {
			if (!mokuser.user_nickname) {
				alert('로그인이 필요한 작업입니다 :)');
				setNewComment('');
				return;
			}

			try {
				await addDoc(collection(db, 'recipes', recipeId, 'comment'), {
					comment_description: newComment,
					// user_nickname: currentUser?.displayName,
					user_nickname: 'test_nickname',
					comment_create_time: new Date(),
				});
				setNewComment('');
				getComments();
			} catch (eorror) {
				console.error('오류입니다.');
			}
		} else {
			alert('댓글을 입력해주세요!');
		}
	};

	return (
		<>
			<h3>댓글 | Comment</h3>
			<div className={styled.commentInput}>
				<label htmlFor="comment">
					<textarea
						id="comment"
						value={newComment}
						onChange={(e) => setNewComment(e.target.value)}
						placeholder={`특별한 레시피를 남겨준 ${mokuser.user_nickname} 님에게 따뜻한 댓글을 남겨주세요 ♥`}
					/>
				</label>

				<button onClick={addComment}>등록</button>
			</div>

			<section className={styled.commentList}>
				<h3 className={styled.srOnly}>댓글 리스트</h3>
				<div>
					{comments.map((comment) => (
						<div key={comment.id} className={styled.commentBlock}>
							<ul className={styled.commentWriterInfo}>
								<li>{comment.user_nickname}</li>
								<li>
									{comment.comment_update_time
										? formatDate(comment.comment_update_time)
										: formatDate(comment.comment_create_time)}

									{comment.isEdited && <span> 수정됨 </span>}
								</li>
							</ul>

							{editingCommentId === comment.id ? (
								<>
									<textarea
										value={editedComment}
										onChange={(e) => setEditedComment(e.target.value)}
									/>
									<div className={styled.editingSettingBtn}>
										<CustomButton
											btnType={ButtonType.Edit}
											color="orange"
											shape="rad30"
											onClick={() => updateComment(comment.id)}
										>
											저장
										</CustomButton>
										<CustomButton
											btnType={ButtonType.Delete}
											color="white"
											shape="rad30"
											onClick={() => setEditngCommentId(null)}
										>
											취소
										</CustomButton>
									</div>
								</>
							) : (
								<>
									<p>{comment.comment_description}</p>

									{mokuser.user_nickname === comment.user_nickname && (
										<div className={styled.commentSettingsBtn}>
											<CustomButton
												btnType={ButtonType.Edit}
												color="orange"
												shape="rad30"
												onClick={() => {
													setEditngCommentId(comment.id);
													setEditedComment(comment.comment_description);
												}}
											>
												수정
											</CustomButton>
											<CustomButton
												btnType={ButtonType.Delete}
												color="white"
												shape="rad30"
												onClick={() => deleteComment(comment.id)}
											>
												삭제
											</CustomButton>
										</div>
									)}
								</>
							)}
						</div>
					))}
				</div>
			</section>
		</>
	);
};

export default Comments;
